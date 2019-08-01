const { formatPhotos } = require('../formats')
const { asyncMW, check, resourceExists, resourceMW } = require('../helpers/express-rest')
const { AuthAdmin, AuthAdvertOwnerOrAdmin } = require('../auth')
const { getPhotos, getPhoto, getPhotoStream } = require('../dao')
const photoExists = resourceExists(params => getPhoto(params.photo_id), 'photo')

const mime = require('mime')
const path = require('path')

module.exports = {
  photos: resourceMW({
    get: [
      check(AuthAdmin),
      asyncMW(async (request, response) => response.json(formatPhotos(await getPhotos())))
    ]
  }),
  photo: resourceMW({
    get: [
      check(photoExists),
      asyncMW(async (request, response) => {
        response.set('Content-Type', mime.getType(path.extname(request.photo.key).slice(1)))
        const stream = await getPhotoStream(request.photo.key)
        stream.pipe(response)
      })
    ],
    delete: [
      check(photoExists, AuthAdvertOwnerOrAdmin),
      asyncMW(async (request, response) => response.empty(await deletePhoto(request.photo.key)))
    ]
  })
}
