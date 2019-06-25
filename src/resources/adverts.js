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
const advertFromRequest = request => ({ ...request.body, from: request.user.email })

const { createAdvert, getAdverts, getAdvert, deleteAdvert } = require('../dao')
const { check, run, empty, send, paramsValidator } = require('../helpers/express-rest')
const { authentication, isAdvertOwner } = require('../auth')
const AdvertParamsValidator = paramsValidator((params, assert) => {
  if (assert(params.text, 'Text is missing (string)')) {
    assert(params.text && params.text.length < 1024, 'Text is too long (should be 1024 characters max.')
  }
})
module.exports = {
  adverts: {
    get: run((request, response) => getAdverts().then(formatAdverts).then(send(response))),
    post: [
      check(authentication),
      check(AdvertParamsValidator),
      run((request, response) => createAdvert(advertFromRequest).then(formatAdvert).then(created(response)))
    ],
  },
  advert: id => getAdvert(id).then(advert => advert &&
    {
      get: run((request, response) => getAdvert(request.params.advert_id).then(formatAdvert).then(send(response))),
      delete: [
        check(authentication),
        check(isAdvertOwner),
        run((request, response) => deleteAdvert(request.params.advert_id).then(empty(response)))
      ]
    }
  )
}