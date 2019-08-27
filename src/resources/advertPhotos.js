const { photoUri } = require('../routes')
const { formatPhotos } = require('../formats')
const { resourceMW, checkResource } = require('../helpers/express-rest')
const { ifAuthenticated, ifAdminOrAdvertOwner } = require('../auth')
const { getAdvert, getAdvertPhotos, uploadPhoto } = require('../dao')
const multipart = require('../helpers/multipart')
const ifAdvertExists = checkResource(advertId => getAdvert(advertId))

module.exports = {
  advertPhotos: resourceMW({
    get: (request, response) => {
      ifAdvertExists(request.params.advert_id, response, async advert => {
        const photos = await getAdvertPhotos(advert.id)
        response.json(formatPhotos(photos))
      })
    },
    post: (request, response) => {
      ifAdvertExists(request.params.advert_id, response, advert => {
        ifAuthenticated(request, response, authUser => {
          ifAdminOrAdvertOwner([ authUser, advert ], async () => {
            const { fields, files } = await multipart(request) // TODO: explicitely limit image size
            const { name, buffer } = files[0]
            const photo = await uploadPhoto(name, advert.id, buffer, fields.thumbnail)
            response.set('Location', photoUri(photo.key))
            response.sendStatus(204)
          })
        })
      })
    }
  })
}
