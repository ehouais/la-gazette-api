const { asyncMW, sendJson, resourceMW } = require('../helpers/express-rest')
const { getNbAdverts, getNbUsers, getNbPhotos } = require('../dao')

module.exports = {
  stats: resourceMW({
    get: asyncMW(async (request, response) => sendJson(response)({
      nbUsers: await getNbUsers(),
      nbAdverts: await getNbAdverts(),
      nbPhotos: await getNbPhotos()
    }))
  })
}