const { photoUri } = require('../routes')
const formatAdvertPhotos = photos => photos.map(photo => photoUri(photo.key))

const { check, created, send, resourceExists, resourceMW } = require('../helpers/express-rest')
const { isAdvertOwnerOrAdmin } = require('../auth')
const { getAdvert, getAdvertPhotos, uploadPhoto } = require('../dao')

const upload = require('../helpers/upload')
const crypto = require('crypto')
const keygen = filename => crypto.randomBytes(8).toString('hex')+'-'+filename
const advertExists = resourceExists(params => getAdvert(params.advert_id), 'advert')

module.exports = {
  advertPhotos: resourceMW({
    get: [
      check(advertExists),
      (request, response) => getAdvertPhotos(request.advert.id).then(formatAdvertPhotos).then(send(response))
    ],
    post: [
      check(advertExists, isAdvertOwnerOrAdmin),
      (request, response) => upload(request)
        .then(({ filename, buffer }) => uploadPhoto(keygen(filename), request.advert.id, buffer))
        .then(created(response))
    ]
  })
}
