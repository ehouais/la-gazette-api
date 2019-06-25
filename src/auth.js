const basicAuth = require('basic-auth')
const bcrypt = require('bcrypt')
const { getAdvert, getUserByEmail, createUser } = require('./dao')

const authentication = request => new Promise((resolve, reject) => {
  const creds = basicAuth(request)
  if (!creds) return reject({ status: 401, message: 'Credentials not found' })
  const { name: email, pass: password } = creds
  getUserByEmail(email)
    .then(user => {
      if (!user) {
        bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS)
          .then(function(hash) {
            createUser(email, hash).then(user => {
              request.user = { email }
              resolve()
            })
          })
          .catch(e => reject({ status: 500, message: e.message }))
      } else {
        bcrypt.compare(password, user.passhash)
          .then(res => {
            if (!res) return reject({ status: 401, message: 'Invalid password' })
            request.user = user
            resolve()
          })
          .catch(e => reject({ status: 500, message: e.message }))
      }
    })
    .catch(e => reject({ status: 500, message: e.message+'\n'+e.stack }))
})

const isAdmin = request => new Promise((resolve, reject) => {
  if (!request.user.admin) return reject({ status: 403 })
  resolve()
})
const isUserOrAdmin = email => request => new Promise((resolve, reject) => {
  if (request.user.email != email && !request.user.admin) return reject({ status: 403, message: 'Not authorized' })
  resolve()
})
const isAdvertOwner = request => new Promise((resolve, reject) => {
  getAdvert(request.params.advert_id)
    .then(advert => {
      if (advert.from != request.user.email) return reject({ status: 403, message: 'Not authorized' })
      resolve()
    })
    .catch(e => reject({ status: 500, message: e.message }))
})

module.exports = { authentication, isAdmin, isUserOrAdmin, isAdvertOwner }