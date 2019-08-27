const { formatPhotos } = require('../formats')
const { resourceMW, checkResource } = require('../helpers/express-rest')
const { ifAuthenticated, ifAdmin, ifAdminOrAdvertOwner } = require('../auth')
const { getPhotos, getPhoto, getPhotoStream } = require('../dao')
const mime = require('mime')
const path = require('path')
const ifPhotoExists = checkResource(photoId => getPhoto(photoId))

module.exports = {
  photos: resourceMW({
    get: (request, response) => {
      ifAuthenticated(request, response, authUser => {
        ifAdmin(authUser, response, async () => {
          const photos = await getPhotos()
          response.json(formatPhotos(photos))
        })
      })
    }
  }),
  photo: resourceMW({
    get: (request, response) => {
      ifPhotoExists(request.params.photo_id, response, async photo => {
        const fileExtension = path.extname(photo.key).slice(1)
        response.set('Content-Type', mime.getType(fileExtension))
        const stream = await getPhotoStream(photo.key)
        stream.pipe(response)
      })
    },
    delete: (request, response) => {
      ifPhotoExists(request.params.photo_id, response, photo => {
        ifAuthenticated(request, response, async authUser => {
          const advert = await getAdvert(photo.advert_id)
          ifAdminOrAdvertOwner([ authUser, advert ], response, async () => {
            await deletePhoto(photo.key)
            response.sendStatus(204)
          })
        })
      })
    }
  })
}
