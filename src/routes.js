const { Uri } = require('./helpers/express-rest')

const homeRoute           = '/'
const tokensRoute         = '/tokens'
const advertsRoute        = '/adverts'
const advertRoute         = '/adverts/:advert_id'
const advertPhotosRoute   = '/adverts/:advert_id/photos'
const photosRoute         = '/photos'
const photoRoute          = '/photos/:photo_id'
const usersRoute          = '/users'
const userRoute           = '/users/:email'
const userAdvertsRoute    = '/users/:email/adverts'
const statsRoute          = '/stats'

const root = process.env.ROOT_URI

module.exports = {
  homeRoute           , homeUri: Uri(root, homeRoute),
  tokensRoute         , tokensUri: Uri(root, tokensRoute),
  advertsRoute        , advertsUri: Uri(root, advertsRoute),
  advertRoute         , advertUri: Uri(root, advertRoute),
  advertPhotosRoute   , advertPhotosUri: Uri(root, advertPhotosRoute),
  photosRoute         , photosUri: Uri(root, photosRoute),
  photoRoute          , photoUri: Uri(root, photoRoute),
  usersRoute          , usersUri: Uri(root, usersRoute),
  userRoute           , userUri: Uri(root, userRoute),
  userAdvertsRoute    , userAdvertsUri: Uri(root, userAdvertsRoute),
  statsRoute          , statsUri: Uri(root, statsRoute)
}
