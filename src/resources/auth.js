const { check, resourceMW } = require('../helpers/express-rest')
const { isAuthenticated } = require('../auth')
const { userUri } = require('../routes')

module.exports = {
  auth: resourceMW({
    get: [
      check(isAuthenticated),
      (request, response) => response.redirect(userUri(request.auth.email))
    ]
  })
}
