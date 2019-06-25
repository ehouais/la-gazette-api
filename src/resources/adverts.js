const { advertsUri, advertUri, advertPhotosUri, userUri } = require('../routes')
const formatAdverts = adverts => adverts.map(formatAdvert)
const formatAdvert = data => ({
  self: advertUri(data.id),
  collection: advertsUri(),
  text: data.text || data.title,
  photos: advertPhotosUri(data.id),
  from: userUri(data.from),
  creation_date: data.creation_date
})

const { createAdvert, getAdverts, getAdvert, deleteAdvert } = require('../dao')
const { check, paramsValidator, genericErrorHandler, formatAndSend } = require('../helpers/express-rest')
const { authentication, isAdvertOwner } = require('../auth')
const AdvertParamsValidator = paramsValidator((params, assert) => {
  if (assert(params.text, 'Text is missing (string)')) {
    assert(params.text && params.text.length < 1024, 'Text is too long (should be 1024 characters max.')
  }
})
module.exports = {
  adverts: {
    get: (request, response) => {
      getAdverts()
      .then(formatAndSend(response, formatAdverts))
      .catch(genericErrorHandler(response))
    },
    post: [
      check(authentication),
      check(AdvertParamsValidator),
      (request, response) => {
        createAdvert({ ...request.body, from: request.user.email })
          .then(formatAndSend(response, formatAdvert, 201))
          .catch(genericErrorHandler(response))
      }
    ],
  },
  advert: id => getAdvert(id).then(advert => advert &&
    {
      get: [
        (request, response) => {
          getAdvert(request.params.advert_id)
            .then(formatAndSend(response, formatAdvert))
            .catch(genericErrorHandler(response))
        }
      ],
      delete: [
        check(authentication),
        check(isAdvertOwner),
        (request, response) => {
          deleteAdvert(request.params.advert_id)
            .then(() => { response.status(204).end() })
            .catch(genericErrorHandler(response))
        }
      ]
    }
  )
}