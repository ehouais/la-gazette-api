const { photoUri } = require('../routes')
const formatPhotos = photos => photos.map(photo => photoUri(photo.key))

const { asyncMW, check, empty, sendJson, resourceExists, resourceMW } = require('../helpers/express-rest')
const { AuthAdmin, AuthAdvertOwnerOrAdmin } = require('../auth')
const { getPhotos, getPhoto, getPhotoStream } = require('../dao')
const photoExists = resourceExists(params => getPhoto(params.photo_id), 'photo')

module.exports = {
  photos: resourceMW({
    get: [
      check(AuthAdmin),
      asyncMW((request, response) => getPhotos().then(formatPhotos).then(sendJson(response)))
    ]
  }),
  photo: resourceMW({
    get: [
      check(photoExists),
      asyncMW((request, response) => getPhotoStream(request.photo.id).then(stream => stream.pipe(response)))
    ],
    delete: [
      check(photoExists, AuthAdvertOwnerOrAdmin),
      asyncMW((request, response) => deletePhoto(request.photo.id).then(empty(response)))
    ]
  })
}
