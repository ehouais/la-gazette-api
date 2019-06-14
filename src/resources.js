const { validate, genericErrorHandler, StaticResource } = require('./helpers/express-rest')
const { Roles, authorize } = require('./helpers/auth')
const { advertExists, createAdvert, getAllAdverts, getAdvert, deleteAdvert } = require('./dao')
const { homeUri, advertsUri, advertUri } = require('./routes')
const { log } = require('./helpers/logger')

AdvertParamsValidator = (params, assert) => {
  assert(params.title, 'Title is missing (string)')
  assert(params.title && params.title.length <= 64, 'Title is too long (should be 64 characters max.')
}

const formatAdverts = adverts => adverts.map(formatAdvert)
const formatAdvert = data => ({
  self: advertUri(data.id),
  collection: advertsUri(),
  creation_date: data.creation_date,
  title: data.title
})

module.exports = {
  home: StaticResource({ adverts: advertsUri() }),
  adverts: {
    get: (request, response) => {
      authorize(request.user.role, [Roles.USER], response, () => {
        log('adverts.get: DAO.getAllAdverts...')
        getAllAdverts()
          .then(adverts => {
            log('adverts.get: formatAdverts...')
            response.json(formatAdverts(adverts))
          })
          .catch(genericErrorHandler(response))
      })
    },
    post: (request, response) => {
      authorize(request.user.role, [Roles.USER], response, () => {
        validate(request.body, AdvertParamsValidator, response, params => {
          createAdvert(params)
            .then(advert => response.status(201).json(formatAdvert(advert)))
            .catch(genericErrorHandler(response))
        })
      })
    },
  },
  advert: id =>
    advertExists(id)
      .then(exists =>
        exists && {
          get: (request, response) => {
            authorize(request.user.role, [Roles.USER], response, () => {
              getAdvert(request.params.advert_id)
                .then(advert => response.json(formatAdvert(advert)))
                .catch(genericErrorHandler(response))
            })
          },
          delete: (request, response) => {
            authorize(request.user.role, [Roles.USER], response, () => {
              deleteAdvert(request.params.advert_id)
                .then(() => { response.status(204).end() })
                .catch(genericErrorHandler(response))
            })
          }
        }
      )
}
