const { advertUri } = require('../routes')
const { formatAdverts, formatAdvert } = require('../formats')
const advertFromRequest = request => ({ ...request.body, from: request.auth.email })
const { createAdvert, getAdverts, getAdvert, patchAdvert, deleteAdvert } = require('../dao')
const { asyncMW, check, paramsValidity, resourceExists, resourceMW } = require('../helpers/express-rest')
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
    get: asyncMW(async (request, response) => {
      let { before, contains } = request.query
      if (contains) contains = contains.split(',').join(' ')
      response.json(formatAdverts(await getAdverts(before, contains)))
    }),
    post: [
      check(Authenticated, createParamsValidity),
      asyncMW(async (request, response) => {
        const advert = await createAdvert(advertFromRequest(request))
        response.created(advertUri(advert.id))
      })
    ],
  }),
  advert: resourceMW({
    get: [
      check(advertExists),
      (request, response) => response.json(formatAdvert(request.advert))
    ],
    patch: [
      check(advertExists, AuthAdvertOwnerOrAdmin, patchParamsValidity),
      asyncMW(async (request, response) => response.empty(await patchAdvert(request.advert.id, request.body)))
    ],
    delete: [
      check(advertExists, AuthAdvertOwnerOrAdmin),
      asyncMW(async (request, response) => response.empty(await deleteAdvert(request.advert.id)))
    ]
  })
}