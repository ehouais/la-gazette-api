const { check } = require('../helpers/express-rest')
const { authentication } = require('../auth')
const { userUri } = require('../routes')

module.exports = {
  auth: {
    get: [
      check(authentication),
      (request, response) => {
        response.redirect(userUri(request.user.email))
      }
    ]
  }
}
  