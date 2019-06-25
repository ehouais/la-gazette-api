const { userUri, userAdvertsUri, userPhotosUri } = require('../routes')
const formatUsers = users => users.map(formatUser)
const formatUser = data => ({
  self: userUri(data.email),
  firstname: data.firstname,
  lastname: data.lastname,
  email: data.email,
  avatar: data.avatar,
  //posts: userAdvertsUri(data.email),
  //photos: userPhotosUri(data.email),
  creation_date: data.creation_date
})

const { check, paramsValidator, genericErrorHandler, formatAndSend } = require('../helpers/express-rest')
const { authentication, isAdmin, isUserOrAdmin } = require('../auth')
const { getUsers, getUserByEmail } = require('../dao')
module.exports = {
  users: {
    get: [
      check(authentication),
      check(isAdmin),
      (request, response) => {
        getUsers()
          .then(formatAndSend(response, formatUsers))
          .catch(genericErrorHandler(response))
      }
    ]
  },
  user: email => getUserByEmail(email).then(user => user &&
    {
      get: [
        check(authentication),
        check(isUserOrAdmin(email)),
        (request, response) => {
          getUserByEmail(request.params.user_id)
            .then(formatAndSend(response, formatUser))
            .catch(genericErrorHandler(response))
        }
      ]
    }
  )
}