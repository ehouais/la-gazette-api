const Validator = require('validator')
const { resourceMW, checkData } = require('../helpers/express-rest')
const { formatToken } = require('../formats')
const { checkCredentials, genToken } = require('../auth')
const { getUserByEmail } = require('../dao')

ifEmailPresent = checkData(({ email }) => {
  return !email && 'Email not found'
})
ifCredentialsValid = checkData(async ({ email, password }) => {
  const validCredentials = await checkCredentials(email, password)
  return !validCredentials && 'Invalid credentials'
})
ifEmailValid = checkData(email => {
  return (!Validator.isEmail(email) || !email.match(/@orange.com$/)) && 'Invalid email address'
})
ifUserDoesntExist = checkData(async email => {
  const user = await getUserByEmail(email)
  return user && 'User already exists'
})
const generateToken = async (email, duration) => {
  const exp = Math.floor(Date.now() / 1000) + duration
  const [err, token] = await genToken(email, exp)
  if (err) throw err
  return formatToken(token, email, exp)
}

module.exports = {
  tokens: resourceMW({
    get: async (request, response) => {
      response.sendStatus(501) // TODO: connection stats for admins
    },
    post: async (request, response) => {
      ifEmailPresent(request.body, response, ({ email, password }) => {
        // password provided => user already exists => Long-lived token returned immediately
        if (password) {
          ifCredentialsValid({ email, password }, response, async creds => {
            const token = await generateToken(creds.email, 60 * 60) // 1h validity
            response.json(token)
          })
        } else {
          // no password provided => return short-lived token (used to create user)
          // TODO: target worflow using corporate email and web form landing
          ifEmailValid(email, response, async email => {
            ifUserDoesntExist(email, response, async email => {
              const token = await generateToken(email, 15 * 60) // 15mn validity
              response.json(token)
            })
          })
        }  
      })
    }
  })
}
