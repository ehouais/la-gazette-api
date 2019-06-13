const { log } = require('./logger')

const validate = (params, validator, response, cb) => {
  const errors = []
  validator(params, (condition, message) => { if (!condition) errors.push(message) })
  if (errors.length == 0) cb(params)
  else response.status(403).send(errors.join('\n'))
}
const ifExists = (cb, response) =>
  data => { if (data) cb(data); else response.sendStatus(404) }


const genericErrorHandler = response =>
  error => response.status(500).send(`${error.name}: ${error.stack}`)

const registerResourceFactory = (app, route, factory) => {
  const params = route.match(/:[a-zA-Z0-9_]+/g) || []
  app.all(route, (request, response) => {
    const args = params.map(id => request.params[id.slice(1)])
    factory.apply(null, args).then(resource => {
      if (!resource) return response.sendStatus(404)
      const method = request.method.toLowerCase()
      log(`Request: ${request.method} ${request.path}`)
      if (!resource[method]) return response.sendStatus(405)
      resource[method](request, response)
    })
  })
}
const registerResource = (app, route, resource) => {
  registerResourceFactory(app, route, () => Promise.resolve(resource))
}
const StaticResource = data => ({ get: (request, response) => response.json(data) })

const regexp = RegExp(':[a-zA-Z0-9_]+', 'g')
const Uri = (root, pattern) => {
  const params = pattern.match(regexp) || []
  return function() {
    return root+pattern.replace(regexp, id => arguments[params.indexOf(id)])
  }
}

module.exports = {
  validate,
  ifExists,
  genericErrorHandler,
  registerResource,
  registerResourceFactory,
  StaticResource,
  Uri
}
