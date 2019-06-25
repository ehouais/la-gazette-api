const { photoUri } = require('../routes')
const formatPhotos = photos => photos.map(photo => photoUri(photo.key))
/* const formatPhotoInfo = data => ({
  self: photoInfoUri(data.id),
  advert: advertUri(advertId),
  photo: photoUri(data.id),
  creation_date: data.creation_date
}) */

const { check, genericErrorHandler, formatAndSend } = require('../helpers/express-rest')
const { authentication, isAdmin, isAdvertOwner } = require('../auth')
const { getPhotos, getPhoto, getPhotoStream } = require('../dao')
module.exports = {
  photos: {
      get: [
        check(authentication),
        check(isAdmin),
        (request, response) => getPhotos()
          .then(formatAndSend(response, formatPhotos))
          .catch(genericErrorHandler(response))
      ]
  },
  photo: photoId => getPhoto(photoId).then(photo => photo &&
    {
      get: (request, response) => {
        //response.set('Link', `<${photoInfoUri(photoId)}>; rel="info"`)
        getPhotoStream(request.params.photo_id)
          .then(stream => stream.pipe(response))
          .catch(genericErrorHandler(response))
      },
      delete: [
        check(authentication),
        check(isAdvertOwner), // or admin
        (request, response) => deletePhoto(request.params.photo_id)
          .then(response.sendStatus(204))
          .catch(genericErrorHandler(response))
      ]
    }
  )
}
