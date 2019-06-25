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

const { check, run, empty, send } = require('../helpers/express-rest')
const { authentication, isAdmin, isUserOrAdmin } = require('../auth')
const { getUsers, getUserByEmail, patchUser, deleteUser } = require('../dao')
module.exports = {
  users: {
    get: [
      check(authentication),
      check(isAdmin),
      run((request, response) => getUsers().then(formatUsers).then(send(response)))
    ]
  },
  user: email => getUserByEmail(email).then(user => user &&
    {
      get: [
        check(authentication),
        check(isUserOrAdmin(email)),
        run((request, response) => getUserByEmail(request.params.email).then(formatUser).then(send(response)))
      ],
      patch: [
        check(authentication),
        check(isUserOrAdmin(email)),
        run((request, response) => patchUser(request.params.email, request.body).then(formatUser).then(send(response)))
      ],
      delete: [
        check(authentication),
        check(isAdmin),
        run((request, response) => deleteUser(request.params.email).then(empty(response)))
      ]
    }
  )
}