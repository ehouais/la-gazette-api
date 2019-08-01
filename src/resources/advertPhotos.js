const { photoUri } = require('../routes')
const { formatPhotos } = require('../formats')
const { asyncMW, check, resourceExists, resourceMW } = require('../helpers/express-rest')
const { AuthAdvertOwnerOrAdmin } = require('../auth')
const { getAdvert, getAdvertPhotos, uploadPhoto } = require('../dao')
const multipart = require('../helpers/multipart')
const advertExists = resourceExists(params => getAdvert(params.advert_id), 'advert')

module.exports = {
  advertPhotos: resourceMW({
    get: [
      check(advertExists),
      asyncMW(async (request, response) => response.json(formatPhotos(await getAdvertPhotos(request.advert.id))))
    ],
    post: [
      check(advertExists, AuthAdvertOwnerOrAdmin),
      asyncMW(async (request, response) => {
        const { fields, files } = await multipart(request)
        const { name, buffer } = files[0]
        const photo = await uploadPhoto(name, request.advert.id, buffer, fields.thumbnail)
        response.created(photoUri(photo.key))
      })
    ]
  })
}
