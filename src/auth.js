const { getAdvert, getUserByEmail, patchUser } = require('./dao')

// JWT methods promisification
const jwt = require('jsonwebtoken')
const genToken = data => new Promise(resolve => jwt.sign(data, process.env.JWT_SECRET, (err, token) => resolve(token)))
const verifyToken = token => new Promise(resolve => jwt.verify(token, process.env.JWT_SECRET, (err, data) => resolve(!err && data)))

// Check procedures returning the check result or a promise resolving to the result
// The result is false (OK) or { status, message } (error)

const Authenticated = async (request, checkRole) => {
  const token = request.get(process.env.TOKEN_HEADER)
  if (!token) return { status: 401, message: 'Token not found' }
  const data = await verifyToken(token)
  if (!data) return { status: 401, message: 'Invalid token' }
  request.auth = await getUserByEmail(data.email) || { email: data.email }
  await patchUser(data.email, { last_auth: new Date() })
  if (checkRole && ! await checkRole(request)) return { status: 403 }
}
const isAdmin = request => request.auth.admin
const isUser = request => request.auth.email == request.params.email
const isAdvertOwner = async request => await getAdvert(request.params.advert_id).then(advert => advert.from == request.auth.email)

const AuthAdmin = async request => Authenticated(request, isAdmin)
const AuthUserOrAdmin = async request => Authenticated(request, request => isAdmin(request) || isUser(request))
const AuthAdvertOwnerOrAdmin = async request => Authenticated(request, async request => isAdmin(request) || await isAdvertOwner(request))

module.exports = { genToken, verifyToken, Authenticated, AuthAdmin, AuthAdvertOwnerOrAdmin, AuthUserOrAdmin }