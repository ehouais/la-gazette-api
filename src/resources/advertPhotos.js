const { photoUri } = require('../routes')
const formatAdvertPhotos = photos => photos.map(photo => photoUri(photo.key))

const { check, genericErrorHandler, formatAndSend } = require('../helpers/express-rest')
const { authentication, isAdvertOwner } = require('../auth')
const { getAdvert, getAdvertPhotos, uploadPhoto } = require('../dao')
const Busboy = require('busboy')
const crypto = require('crypto')
module.exports = {
  advertPhotos: advertId => getAdvert(advertId).then(advert => advert &&
    {
      get: [
        (request, response) => getAdvertPhotos(request.params.advert_id)
          .then(formatAndSend(response, formatAdvertPhotos))
          .catch(genericErrorHandler(response))
      ],
      post: [
        check(authentication),
        check(isAdvertOwner),
        (request, response) => {
          var busboy = new Busboy({ headers: request.headers });
          busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            const bufs = [];
            file.on('data', data => { bufs.push(data) })
            file.on('end', () => {
              const key = crypto.randomBytes(8).toString('hex')+'-'+filename
              uploadPhoto(key, request.params.advert_id, Buffer.concat(bufs))
                .then(() => { response.sendStatus(201) })
                .catch(genericErrorHandler(response))
            })
          })
          request.pipe(busboy);
        }
      ]
    }
  )
}
