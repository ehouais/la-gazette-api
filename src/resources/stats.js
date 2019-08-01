const { asyncMW, resourceMW } = require('../helpers/express-rest')
const { getNbAdverts, getNbUsers, getNbPhotos } = require('../dao')

module.exports = {
  stats: resourceMW({
    get: asyncMW(async (request, response) => response.json({
      nbUsers: await getNbUsers(),
      nbAdverts: await getNbAdverts(),
      nbPhotos: await getNbPhotos()
    }))
  })
}