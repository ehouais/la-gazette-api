const { check, resourceMW, resourceExists, sendText, sendJson } = require('../helpers/express-rest')
const { usersUri, userUri, tokenUri } = require('../routes')
const { checkCredentials, genToken, verifyToken, isAdmin } = require('../auth')
const Validator = require('validator')
const sendMail = require('../helpers/mail')

const tokenExists = resourceExists(params => verifyToken(params.token), 'token')
const formatToken = id => ({
  id
})

module.exports = {
  tokens: resourceMW({
    get: [
      check(isAdmin),
      (request, response) => {
        response.sendStatus(501)
      }
    ],
    post: [
      (request, response) => {
        const { email, password } = request.body
        if (!email)
          return response.status(400).end('Email not found')

        // email+password => user already exists => Long-lived token returned immediately
        if (password)
          return checkCredentials(email, password)
            .then(res => res
              ? genToken(email, '1h').then(token => ({
                id: token,
                user: userUri(email),
                expiration_date: '+1h'
              })).then(sendJson(response))
              : response.status(400).end('Invalid credentials')
            )

        // no password => user creation or password reset => check if email is valid & short-lived token sent by email
        if (!Validator.isEmail(email) || !email.match(/@orange.com$/))
          return response.status(400).end('Invalid email address')

        return genToken(email, '15m')
          .then(tokenUri)
          .then(url => sendMail(email, `La Gazette`, url, `<a href="${url}">URL de confirmation</a>`))
          .then(info => response.end(`An email has been sent to ${email}`))
      }
    ]
  }),
  token: resourceMW({
    get: [
      check(tokenExists),
      (request, response) => {
        if (request.get('accept').indexOf('application/json') != -1)
          response.json({ ...request.token, id: request.params.token })
        else {
          response.send(`
<form><input name="password" type="password"/><input type="submit" value="Envoyer"/></form>
<script>
  const token = ${request.params.token}
  const headers = { ${process.env.TOKEN_HEADER}: token }
  const response = await fetch('${userUri(request.token.email)}')
  document.getElementById('form').addEvenListener('submit', e => {
    if (response.status == 404) {
      fetch('${usersUri()}', { method: 'POST', data: { email, password }, headers })
    } else {
      fetch('${userUri(request.token.email)}', { method: 'PATCH', data: { password }, headers })
    }
    e.preventDefault()
  })
</script>`)
        }
      }
    ]
  })
}
