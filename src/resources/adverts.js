const Validator = require('validator')
const { advertUri } = require('../routes')
const { formatAdverts, formatAdvert } = require('../formats')
const { createAdvert, getAdverts, getAdvert, patchAdvert, deleteAdvert } = require('../dao')
const { resourceMW, checkResource, checkData } = require('../helpers/express-rest')
const { ifAuthenticated, ifAdminOrAdvertOwner } = require('../auth')

const ifAdvertExists = checkResource(advertId => getAdvert(advertId))
const validateText = text => Validator.isLength(text, { min: 10, max: 1024})
const ifAdvertPostDataValid = checkData(({ text }) => {
  if (!text || !validateText(text)) return 'absent or invalid \'text\' value'
})
const ifAdvertPatchDataValid = checkData(({ text }) => {
  if (text && !validateText(text)) return 'invalid \'text\' value'
})

module.exports = {
  adverts: resourceMW({
    get: async (request, response) => {
      let { before, contains } = request.query
      if (contains) contains = contains.split(',').join(' ')
      const adverts = await getAdverts(before, contains)

      response.json(formatAdverts(adverts))
    },
    post: (request, response) => {
      ifAuthenticated(request, response, authUser => {
        ifAdvertPostDataValid(request.body, response, async ({ text }) => {
          const advert = await createAdvert({ text, from: authUser.email })
          response.set('Location', advertUri(advert.id))
          response.sendStatus(204)
        })
      })
    }
  }),
  advert: resourceMW({
    get: (request, response) => {
      ifAdvertExists(request.params.advert_id, response, advert => {
        response.json(formatAdvert(advert))
      })
    },
    patch: (request, response) => {
      ifAdvertExists(request.params.advert_id, response, advert => {
        ifAuthenticated(request, response, authUser => {
          ifAdminOrAdvertOwner([ authUser, advert ], response, () => {
            ifAdvertPatchDataValid(request.body, response, async ({ text }) => {
              await patchAdvert(advert.id, { text })
              response.sendStatus(204)
              // TODO: handle advert fields: phone, location, avatar, needsReview
            })
          })
        })
      })
    },
    delete: (request, response) => {
      ifAdvertExists(request.params.advert_id, response, advert => {
        ifAuthenticated(request, response, authUser => {
          ifAdminOrAdvertOwner([ authUser, advert ], response, async () => {
            await deleteAdvert(advert.id)
            response.sendStatus(204)
          })
        })
      })
    }
  })
}