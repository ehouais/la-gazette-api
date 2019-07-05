const { userUri } = require('../routes')
const formatUsers = users => users.map(formatUser)
const formatUser = data => ({
  self: userUri(data.email),
  firstname: data.firstname,
  lastname: data.lastname,
  email: data.email,
  avatar: data.avatar,
  creation_date: data.creation_date
})

const { check, empty, send, paramsValidity, resourceExists, resourceMW } = require('../helpers/express-rest')
const { isAuthenticated, isAdmin, isUserOrAdmin } = require('../auth')
const { getUsers, getUserByEmail, patchUser, deleteUser } = require('../dao')
const userExists = resourceExists(params => getUserByEmail(params.email), 'user')

module.exports = {
  users: resourceMW({
    get: [
      check(isAdmin),
      (request, response) => getUsers().then(formatUsers).then(send(response))
    ]
  }),
  user: resourceMW({
    get: [
      check(userExists),
      (request, response) => Promise.resolve(request.user).then(formatUser).then(send(response))
    ],
    patch: [
      check(userExists, isUserOrAdmin, paramsValidity(check => {
        check('firstname').exists() && check('firstname').isLength({ min: 1, max: 64})
        check('lastname').exists() && check('lastname').isLength({ min: 1, max: 64})
        //check('avatar_uri').exists() && check('avatar_uri').isURL()
      })),
      (request, response) => patchUser(request.user.email, request.body).then(empty(response))
    ],
    delete: [
      check(userExists, isAdmin),
      (request, response) => deleteUser(request.user.email).then(empty(response))
    ]
  })
}