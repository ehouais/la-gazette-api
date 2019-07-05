const basicAuth = require('basic-auth')
const bcrypt = require('bcrypt')
const { getAdvert, getUserByEmail, createUser } = require('./dao')
const Validator = require('validator')

const authenticate = request => new Promise((resolve, reject) => {
  const creds = basicAuth(request)
  if (!creds) return reject({ status: 401, message: 'Credentials not found' })
  const { name: email, pass: password } = creds
  if (!Validator.isEmail(email)) return reject({ status: 400, message: 'email is invalid' })
  getUserByEmail(email)
    .then(user => {
      if (!user) {
        return bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS)
          .then(hash => createUser(email, hash).then(user => resolve(request.auth = { email })))
      } else {
        return bcrypt.compare(password, user.passhash)
          .then(res => res ? resolve(request.auth = user) : reject({ status: 401, message: 'Invalid password' }))
      }
    })
    .catch(e => reject({ status: 500, message: e.message+'\n'+e.stack }))
})

const isAuthenticated = request => authenticate(request)
const isAdmin = request => authenticate(request).then(auth => auth.admin || Promise.reject({ status: 403 }))
const isUserOrAdmin = request => authenticate(request).then(auth => auth.admin || auth.email == request.params.email || Promise.reject({ status: 403 }))
const isAdvertOwnerOrAdmin = request => authenticate(request).then(auth => auth.admin || new Promise((resolve, reject) => {
  getAdvert(request.params.advert_id)
    .then(advert => advert.from == auth.email || reject({ status: 403 }))
    .catch(e => reject({ status: 500, message: e.message }))
}))

module.exports = { isAuthenticated, isAdmin, isAdvertOwnerOrAdmin, isUserOrAdmin }