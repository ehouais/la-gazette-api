const { userUri } = require('../routes')
const { formatUsers, formatUser, formatUserAdverts } = require('../formats')
const Validator = require('validator')
const { resourceMW, ifResourceExists, checkData } = require('../helpers/express-rest')
const { hashPassword, ifAuthenticated, ifAdmin } = require('../auth')
const { createUser, getUsers, getUserByEmail, getUserAdverts, patchUser, deleteUser } = require('../dao')

const ifUserExists = ifResourceExists(email => getUserByEmail(email))
const ifUserPasswordValid = checkData(password => {
  if (!password) return 'Password not found'
  if (!Validator.isLength(password, { min: 8, max: 16})) return 'Invalid password'
  // TODO: decide password strength policy
})
const ifUserPatchDataValid = checkData(({ firstname, lastname }) => {
  if (firstname && !Validator.isLength(firstname, { min: 1, max: 64})) return 'invalid \'firstname\' value'
  if (lastname && !Validator.isLength(lastname, { min: 1, max: 64})) return 'invalid \'lastname\’ value'
  // TODO: check other fields (avatar, phone, location)
})

module.exports = {
  users: resourceMW({
    get: (request, response) => {
      ifAuthenticated(request, response, authUser => {
        ifAdmin(authUser, response, async () => {
          const users = await getUsers()
          response.json(formatUsers(users))
        })
      })
    },
    post: (request, response) => {
      ifAuthenticated(request, response, authUser => {
        ifUserPasswordValid(request.body.password, response, async password => {
          const hash = await hashPassword(password)
          const user = await createUser(authUser.email, hash)
          response.set('Location', userUri(user.email))
          response.sendStatus(204)
        })
      })
    }
  }),
  user: resourceMW({
    get: (request, response) => {
      ifUserExists(request.params.email, response, async user => {
        response.json(formatUser(user))
      })
    },
    patch: (request, response) => {
      ifUserExists(request.params.email, response, user => {
        ifAuthenticated(request, response, authUser => {
          ifAdminOrUser([ authUser, user ], response, () => {
            ifUserPatchDataValid(request.body, response, async () => {
              await patchUser(request.user.email, request.body)
              response.end()
            })
          })
        })
      })
    },
    delete: (request, response) => {
      ifUserExists(request.params.email, response, user => {
        ifAuthenticated(request, response, async authUser => {
          await deleteUser(request.user.email)
          response.end()
        })
      })
    }
  }),
  userAdverts: resourceMW({
    get: (request, response) => {
      ifUserExists(request.params.email, response, async user => {
        const adverts = await getUserAdverts(user.email)
        response.json(formatUserAdverts(adverts))
      })
    }
  })
}
