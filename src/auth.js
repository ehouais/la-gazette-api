const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { getUserByEmail, patchUser } = require('./dao')
const { promisify, check } = require('./helpers/express-rest')

const genToken = data => promisify(jwt.sign)(data, process.env.JWT_SECRET)
const verifyToken = token => promisify(jwt.verify)(token, process.env.JWT_SECRET)

const getAuthUser = async request => {
  // Check token presence
  const token = request.get(process.env.TOKEN_HEADER)
  if (!token) return
  // Check token validity
  const [err, data] = await verifyToken(token)
  if (err) return
  // Get corresponding user (or null if token is short-lived)
  const user = await getUserByEmail(data.email)
  // Keep track of user's last token generation date
  if (user) await patchUser(user.email, { last_auth: new Date() })

  return user || { email: data.email }
}

module.exports = {
  // Credentials management methods
  hashPassword: password => bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS),
  checkCredentials: (email, password) => getUserByEmail(email).then(user => user && bcrypt.compare(password, user.passhash)),

  // JWT promisified management methods
  genToken,
  verifyToken,

  ifAuthenticated: check(request => getAuthUser(request), 401),
  ifAdmin: check(user => user.admin, 403),
  ifAdminOrAdvertOwner: check(([ user, advert ]) => user.admin || advert.from == user.email, 403),
  ifAdminOrUser: check(([ user, user2 ]) => user.admin || user.email == user2.email, 403)
}
