const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { getAdvert, getUserByEmail, patchUser } = require('./dao')
const { promisify } = require('./helpers/express-rest')

const genToken = data => promisify(jwt.sign)(data, process.env.JWT_SECRET)
const verifyToken = token => promisify(jwt.verify)(token, process.env.JWT_SECRET)

const Authenticated = async (request, checkRole) => {
  // Check token presence
  const token = request.get(process.env.TOKEN_HEADER)
  if (!token) return { status: 401, message: 'Token not found' }
  // Check token validity
  const [err, data] = await verifyToken(token)
  if (err) return { status: 401, message: 'Invalid token' }
  // Get corresponding user
  request.auth = await getUserByEmail(data.email) || { email: data.email }
  // Keep track of user's last token generation date
  await patchUser(data.email, { last_auth: new Date() })
  // If provided, call role checking procedure
  if (checkRole && ! await checkRole(request)) return { status: 403 }
}
const isAdmin = request => request.auth.admin
const isUser = request => request.auth.email == request.params.email
const isAdvertOwner = async request => await getAdvert(request.params.advert_id).then(advert => advert.from == request.auth.email)

module.exports = {
  // Credentials management methods
  hashPassword: password => bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS),
  checkCredentials: (email, password) => getUserByEmail(email).then(user => user && bcrypt.compare(password, user.passhash)),

  // JWT promisified management methods
  genToken,
  verifyToken,

  // Check procedures returning the check result or a promise resolving to the result
  // The result is false (OK) or { status, message } (error)
  Authenticated,
  AuthAdmin: async request => Authenticated(request, isAdmin),
  AuthUserOrAdmin: async request => Authenticated(request, request => isAdmin(request) || isUser(request)),
  AuthAdvertOwnerOrAdmin: async request => Authenticated(request, async request => isAdmin(request) || await isAdvertOwner(request))
}
