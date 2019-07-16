const { StaticResource } = require('../helpers/express-rest')
const { tokensUri, advertsUri, photosUri, usersUri, statsUri } = require('../routes')

module.exports = {
  home: StaticResource({
    adverts: advertsUri(),
    photos: photosUri(),
    doc: 'https://docs.google.com/spreadsheets/d/1vrfmUPN6hS5JaAuKbF37rprxCzhHFWCJekRzz57B1MA/edit?usp=sharing',
    tokens: tokensUri(),
    users: usersUri(),
    stats: statsUri()
  })
}
  