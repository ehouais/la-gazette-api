const Validator = require('validator')
const { asyncMW, resourceMW } = require('../helpers/express-rest')
const { formatToken } = require('../formats')
const { checkCredentials, genToken, verifyToken } = require('../auth')
const { getUserByEmail } = require('../dao')

module.exports = {
  tokens: resourceMW({
    get: [
      asyncMW(async (request, response) => {
        // Get token from query parameters
        const token = Object.keys(request.query)[0]
        if (!token) return response.sendStatus(501)
        // Check token validity
        const [err, data] = await verifyToken(token)
        if (err) return response.status(400).end('Invalid token')
        // Return token structure
        return response.json(formatToken(token, data))
      })
    ],
    post: [
      asyncMW(async (request, response) => {
        const { email, password } = request.body
        if (!email)
          return response.status(400).end('Email not found')

        // email+password => user already exists => Long-lived token returned immediately
        if (password) {
          validCredentials = await checkCredentials(email, password)
          if (!validCredentials) return response.status(400).end('Invalid credentials')
          const data = { email,  exp: Math.floor(Date.now() / 1000) + (60 * 60) }
          const [err, token] = await genToken(data)
          if (err) throw err
          return response.json(formatToken(token, data))
        }

        // no password => user creation or password reset => check if email is valid & short-lived token sent by email
        if (!Validator.isEmail(email) || !email.match(/@orange.com$/))
          return response.status(400).end('Invalid email address')

        const user = await getUserByEmail(email)
        if (user) return response.status(400).end('User already exists')
        const data = { email,  exp: Math.floor(Date.now() / 1000) + (15 * 60) }
        const [err, token] = await genToken(data)
        if (err) throw err
        return response.json(formatToken(token, data))
      })
    ]
  })
}
