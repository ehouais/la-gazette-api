const bcrypt = require('bcrypt')
const { userUri } = require('../routes')
const formatUsers = users => users.map(formatUser)
const formatUser = data => ({
  self: userUri(data.email),
  firstname: data.firstname,
  lastname: data.lastname,
  email: data.email,
  avatar: data.avatar,
  creation_date: timestamp(data.creation_date)
})

const { asyncMW, check, empty, created, sendJson, paramsValidity, resourceExists, resourceMW } = require('../helpers/express-rest')
const { Authenticated, AuthAdmin, AuthUserOrAdmin } = require('../auth')
const { timestamp, createUser, getUsers, getUserByEmail, patchUser, deleteUser } = require('../dao')
const userExists = resourceExists(params => getUserByEmail(params.email), 'user')
const passwordValidity = request => {
  if (!request.body.password) return { status: 400, message: 'Password is mandatory' }
  // TODO: decide password strength policy
  if (request.body.password.length < 8) return { status: 400, message: 'Invalid password'}
}
const hashPassword = password => bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS)

module.exports = {
  users: resourceMW({
    get: [
      check(AuthAdmin),
      asyncMW((request, response) => getUsers().then(formatUsers).then(sendJson(response)))
    ],
    post: [
      check(Authenticated, passwordValidity),
      asyncMW((request, response) => hashPassword(request.body.password)
        .then(hash => createUser(request.auth.email, hash))
        .then(user => userUri(user.email))
        .then(created(response)))
    ]
  }),
  user: resourceMW({
    get: [
      check(userExists),
      (request, response) => sendJson(response)(formatUser(request.user))
    ],
    patch: [
      check(userExists, AuthUserOrAdmin, paramsValidity(check => {
        check('firstname').exists() && check('firstname').isLength({ min: 1, max: 64})
        check('lastname').exists() && check('lastname').isLength({ min: 1, max: 64})
        //check('avatar_uri').exists() && check('avatar_uri').isURL()
      })),
      asyncMW((request, response) => patchUser(request.user.email, request.body).then(empty(response)))
    ],
    delete: [
      check(userExists, AuthAdmin),
      asyncMW((request, response) => deleteUser(request.user.email).then(empty(response)))
    ]
  })
}