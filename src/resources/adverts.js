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

const { createAdvert, getAdverts, getAdvert, patchAdvert, deleteAdvert } = require('../dao')
const { check, run, empty, created, send, paramsValidity } = require('../helpers/express-rest')
const { authentication, isAdvertOwnerOrAdmin } = require('../auth')
checks = check => {
  check('text').isLength({ min: 10, max: 1024})
}

module.exports = {
  adverts: {
    get: run((request, response) => getAdverts().then(formatAdverts).then(send(response))),
    post: [
      check(authentication),
      check(paramsValidity(check => {
        check('text').isLength({ min: 10, max: 1024})
      })),
      run((request, response) => createAdvert(advertFromRequest(request)).then(formatAdvert).then(created(response)))
    ],
  },
  advert: id => getAdvert(id).then(advert => advert &&
    {
      get: run((request, response) => getAdvert(request.params.advert_id).then(formatAdvert).then(send(response))),
      patch: [
        check(authentication),
        check(isAdvertOwnerOrAdmin),
        check(paramsValidity(check => {
          check('text').exists() && check('text').isLength({ min: 10, max: 1024})
        })),
        run((request, response) => patchAdvert(request.params.advert_id, request.body).then(empty(response)))
      ],
      delete: [
        check(authentication),
        check(isAdvertOwnerOrAdmin),
        run((request, response) => deleteAdvert(request.params.advert_id).then(empty(response)))
      ]
    }
  )
}