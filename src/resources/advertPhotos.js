const { photoUri } = require('../routes')
const formatAdvertPhotos = photos => photos.map(photo => photoUri(photo.key))

const { check, run, created, send } = require('../helpers/express-rest')
const { authentication, isAdvertOwnerOrAdmin } = require('../auth')
const { getAdvert, getAdvertPhotos, uploadPhoto } = require('../dao')

const upload = require('../helpers/upload')
const crypto = require('crypto')
const keygen = filename => crypto.randomBytes(8).toString('hex')+'-'+filename

module.exports = {
  advertPhotos: advertId => getAdvert(advertId).then(advert => advert &&
    {
      get: run((request, response) => getAdvertPhotos(request.params.advert_id).then(formatAdvertPhotos).then(send(response))),
      post: [
        check(authentication),
        check(isAdvertOwnerOrAdmin),
        run((request, response) => upload(request)
          .then(({ filename, buffer }) => uploadPhoto(keygen(filename), request.params.advert_id, buffer))
          .then(created(response)))
      ]
    }
  )
}
