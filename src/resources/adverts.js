const { advertsUri, advertUri, advertPhotosUri, userUri } = require('../routes')
const formatAdverts = adverts => adverts.map(formatAdvert)
const formatAdvert = data => ({
  self: advertUri(data.id),
  text: data.text || data.title,
  photos: advertPhotosUri(data.id),
  from: userUri(data.from),
  creation_date: timestamp(data.creation_date)
})
const advertFromRequest = request => ({ ...request.body, from: request.auth.email })

const { timestamp, createAdvert, getAdverts, getAdvert, patchAdvert, deleteAdvert } = require('../dao')
const { asyncMW, check, empty, created, sendJson, paramsValidity, resourceExists, resourceMW } = require('../helpers/express-rest')
const { Authenticated, AuthAdvertOwnerOrAdmin } = require('../auth')
const advertExists = resourceExists(params => getAdvert(params.advert_id), 'advert')
const createParamsValidity = paramsValidity(check => {
  check('text').exists() && check('text').isLength({ min: 10, max: 1024})
})
const patchParamsValidity = paramsValidity(check => {
  check('text').isLength({ min: 10, max: 1024})
})

module.exports = {
  adverts: resourceMW({
    get: (request, response) => getAdverts().then(formatAdverts).then(sendJson(response)),
    post: [
      check(Authenticated, createParamsValidity),
      asyncMW((request, response) => createAdvert(advertFromRequest(request)).then(advert => advertUri(advert.id)).then(created(response)))
    ],
  }),
  advert: resourceMW({
    get: [
      check(advertExists),
      (request, response) => sendJson(response)(formatAdvert(request.advert))
    ],
    patch: [
      check(advertExists, AuthAdvertOwnerOrAdmin, patchParamsValidity),
      asyncMW((request, response) => patchAdvert(request.advert.id, request.body).then(empty(response)))
    ],
    delete: [
      check(advertExists, AuthAdvertOwnerOrAdmin),
      asyncMW((request, response) => deleteAdvert(request.advert.id).then(empty(response)))
    ]
  })
}