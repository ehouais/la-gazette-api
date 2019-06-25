const { photoUri } = require('../routes')
const formatPhotos = photos => photos.map(photo => photoUri(photo.key))

const { check, run, empty } = require('../helpers/express-rest')
const { authentication, isAdmin, isAdvertOwner } = require('../auth')
const { getPhotos, getPhoto, getPhotoStream } = require('../dao')
module.exports = {
  photos: {
    get: [
      check(authentication),
      check(isAdmin),
      run((request, response) => getPhotos().then(formatPhotos).then(send(response)))
    ]
  },
  photo: photoId => getPhoto(photoId).then(photo => photo &&
    {
      get: run((request, response) => getPhotoStream(request.params.photo_id).then(stream => stream.pipe(response))),
      delete: [
        check(authentication),
        check(isAdvertOwner), // or admin
        run((request, response) => deletePhoto(request.params.photo_id).then(empty(response)))
      ]
    }
  )
}
