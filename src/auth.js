const basicAuth = require('basic-auth')
const bcrypt = require('bcrypt')
const { getAdvert, getUserByEmail } = require('./dao')
const jwt = require('jsonwebtoken')
const { promisify } = require('./helpers/express-rest.js')
const { SECRET_HEADER, SHARED_SECRET, JWT_SECRET, TOKEN_HEADER, BCRYPT_SALT_ROUNDS } = process.env

// Returns a promise resolving to true (valid credentials) or false (invalid credentials)
const secretMW = (request, response, next) => {
  return request.method == 'OPTIONS' || request.get(SECRET_HEADER) == SHARED_SECRET ? next() : response.sendStatus(401)
}
const checkCredentials = (email, password) => getUserByEmail(email).then(user => user && bcrypt.compare(password, user.passhash))
const hashPassword = password => bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
const genToken = (email, duration) => promisify(jwt.sign)({ email }, JWT_SECRET, { expiresIn: duration })
const verifyToken = (token, cb) => jwt.verify(token, JWT_SECRET, cb)

// Check procedures returning the check result or a promise resolving to the result
// The result is false (OK) or { status, message } (error)

const isAuthenticated = request => new Promise((resolve, reject) => {
  const token = request.get(TOKEN_HEADER)
  if (!token) return resolve({ status: 401, message: 'Token not found' })
  verifyToken(token, (err, res) => {
    if (err) return resolve({ status: 401, message: 'Invalid token' })
    getUserByEmail(res.email).then(user => { request.auth = user; resolve() })
  })
})
const isAdmin = request => isAuthenticated(request).then(res => res || (
  !request.auth.admin && { status: 403 })
)
const isUserOrAdmin = request => isAuthenticated(request).then(res => res || (
  !request.auth.admin && request.auth.email != request.params.email && { status: 403 })
)
const isAdvertOwnerOrAdmin = request => isAuthenticated(request).then(res => res || (
  !request.auth.admin ? { status: 403 } : getAdvert(request.params.advert_id)
    .then(advert => advert.from != request.auth.email && { status: 403 })
  )
)

module.exports = { secretMW, hashPassword, checkCredentials, isAuthenticated, isAdmin, isAdvertOwnerOrAdmin, isUserOrAdmin, genToken, verifyToken }