const { userUri } = require('../routes')
const { formatUsers, formatUser, formatUserAdverts } = require('../formats')
const { asyncMW, check, paramsValidity, resourceExists, resourceMW } = require('../helpers/express-rest')
const { hashPassword, Authenticated, AuthAdmin, AuthUserOrAdmin } = require('../auth')
const { createUser, getUsers, getUserByEmail, getUserAdverts, patchUser, deleteUser } = require('../dao')
const userExists = resourceExists(params => getUserByEmail(params.email), 'user')
const passwordValidity = request => {
  if (!request.body.password) return { status: 400, message: 'Password not found' }
  // TODO: decide password strength policy
  if (request.body.password.length < 8) return { status: 400, message: 'Invalid password'}
}

module.exports = {
  users: resourceMW({
    get: [
      check(AuthAdmin),
      asyncMW(async (request, response) => response.json(formatUsers(await getUsers())))
    ],
    post: [
      check(Authenticated, passwordValidity),
      asyncMW(async (request, response) => {
        const hash = await hashPassword(request.body.password)
        const user = await createUser(request.auth.email, hash) // email coming from short-lived token
        response.created(userUri(user.email))
      })
    ]
  }),
  user: resourceMW({
    get: [
      check(userExists),
      (request, response) => response.json(formatUser(request.user))
    ],
    patch: [
      check(userExists, AuthUserOrAdmin, paramsValidity(check => {
        check('firstname').exists() && check('firstname').isLength({ min: 1, max: 64})
        check('lastname').exists() && check('lastname').isLength({ min: 1, max: 64})
        //check('avatar_uri').exists() && check('avatar_uri').isURL()
      })),
      asyncMW(async (request, response) => response.empty(await patchUser(request.user.email, request.body)))
    ],
    delete: [
      check(userExists, AuthAdmin),
      asyncMW(async (request, response) => response.empty(await deleteUser(request.user.email)))
    ]
  }),
  userAdverts: resourceMW({
    get: [
      check(userExists),
      asyncMW(async (request, response) => response.json(formatUserAdverts(await getUserAdverts(request.user.email))))
    ]
  })
}