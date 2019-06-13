const { Uri } = require('./helpers/express-rest')

const homeRoute    = '/'
const advertsRoute = '/adverts'
const advertRoute  = '/adverts/:advert_id'

const root = `${process.env.ROOT_URI}:${process.env.PORT}`

module.exports = {
  homeRoute,
  advertsRoute,
  advertRoute,

  homeUri: Uri(root, homeRoute),
  advertsUri: Uri(root, advertsRoute),
  advertUri: Uri(root, advertRoute),
}
