const bcrypt = require('bcrypt')
const Validator = require('validator')
const { resourceMW } = require('../helpers/express-rest')
const { userUri } = require('../routes')
const { genToken, verifyToken } = require('../auth')
const { getUserByEmail } = require('../dao')

const formatToken = (token, data) => ({
  id: token,
  user: userUri(data.email),
  expiration_date: data.exp
})
const checkCredentials = (email, password) => getUserByEmail(email).then(user => user && bcrypt.compare(password, user.passhash))

module.exports = {
  tokens: resourceMW({
    get: [
      async (request, response) => {
        const token = Object.keys(request.query)[0]
        if (!token) return response.sendStatus(501)
        const data = await verifyToken(token)
        if (!data) return response.status(400).end('Invalid token')
        return response.json(formatToken(token, data))
      }
    ],
    post: [
      async (request, response) => {
        const { email, password } = request.body
        if (!email)
          return response.status(400).end('Email not found')

        // email+password => user already exists => Long-lived token returned immediately
        if (password) {
          validCredentials = await checkCredentials(email, password)
          if (!validCredentials) return response.status(400).end('Invalid credentials')
          const data = { email,  exp: Math.floor(Date.now() / 1000) + (60 * 60) }
          const token = await genToken(data)
          return response.json(formatToken(token, data))
        }

        // no password => user creation or password reset => check if email is valid & short-lived token sent by email
        if (!Validator.isEmail(email) || !email.match(/@orange.com$/))
          return response.status(400).end('Invalid email address')

        const user = await getUserByEmail(email)
        if (user) return response.status(400).end('User already exists')
        const data = { email,  exp: Math.floor(Date.now() / 1000) + (15 * 60) }
        const token = await genToken(data)
        return response.json(formatToken(token, data))
      }
    ]
  })
}
