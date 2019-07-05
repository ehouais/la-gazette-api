const { photoUri } = require('../routes')
const formatPhotos = photos => photos.map(photo => photoUri(photo.key))

const { check, empty, send, resourceExists, resourceMW } = require('../helpers/express-rest')
const { isAdmin, isAdvertOwnerOrAdmin } = require('../auth')
const { getPhotos, getPhoto, getPhotoStream } = require('../dao')
const photoExists = resourceExists(params => getPhoto(params.photo_id), 'photo')

module.exports = {
  photos: resourceMW({
    get: [
      check(isAdmin),
      (request, response) => getPhotos().then(formatPhotos).then(send(response))
    ]
  }),
  photo: resourceMW({
    get: [
      check(photoExists),
      (request, response) => getPhotoStream(request.photo.id).then(stream => stream.pipe(response))
    ],
    delete: [
      check(photoExists, isAdvertOwnerOrAdmin),
      (request, response) => deletePhoto(request.photo.id).then(empty(response))
    ]
  })
}
