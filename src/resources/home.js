const { StaticResource } = require('../helpers/express-rest')
const { authUri, advertsUri, photosUri, usersUri } = require('../routes')

module.exports = {
  home: StaticResource({
    adverts: advertsUri(),
    photos: photosUri(),
    doc: 'https://gitlab.forge.orange-labs.fr/lagazette/api/wikis/Contrat%20d\'interface%20historique',
    auth: authUri(),
    users: usersUri()
  })
}
  