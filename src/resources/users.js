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

const { check, run, empty, send, paramsValidity } = require('../helpers/express-rest')
const { authentication, isAdmin, isAdvertOwnerOrAdmin } = require('../auth')
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
        run((request, response) => getUserByEmail(request.params.email).then(formatUser).then(send(response)))
      ],
      patch: [
        check(authentication),
        check(isAdvertOwnerOrAdmin),
        check(paramsValidity(check => {
          check('firstname').exists() && check('firstname').isLength({ min: 1, max: 64})
          check('lastname').exists() && check('lastname').isLength({ min: 1, max: 64})
          check('avatar_uri').exists() && check('avatar_uri').isURL()
        })),
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