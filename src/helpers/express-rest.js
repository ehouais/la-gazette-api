const { log } = require('./logger')
const validator = require('./validatorWrapper')

// Function that chain middlewares into one middleware
const chain = (...middlewares) => middlewares.reduce(
  (chain, mw) => chain
    ? (request, response, next) => chain(request, response, () => { mw(request, response, next || (() => {})) })
    : mw,
  null
)

const regexp = RegExp(':[a-zA-Z0-9_]+', 'g')

// Creates an express middleware from a resource
// A resource is an object with "method-properties" (properties corresponding to available HTTP methods in lowercase)
// A "method-property" contains a middleware or an array of middlewares
// Ex: MW = resourceMW({ get: [mw1, mw2], post: mw3})
const resourceMW = resource  => (request, response) => {
  const method = request.method.toLowerCase()
  log(`Request: ${request.method} ${request.path}`)
  let mw = resource[method]
  if (!mw) return response.sendStatus(405)
  if (Array.isArray(mw)) mw = chain(...mw)
  mw(request, response).catch(error => {
    if (typeof error == 'string') log(`Error: ${error}`)
    else log('Error', error)
    response.sendStatus(500)
  })
}

module.exports = {
  // Generate a MW based on a list of check procedures,
  // Each check procedure must return the result or a promise resolving with the result
  // The result is FALSY (no error) or { status, message }
  check: (...checkProcs) => (request, response, next) =>
    checkProcs.reduce(
      (chain, proc) => chain.then(e => e || proc(request)),
      Promise.resolve()
    ).then(e => e ? response.status(e.status).end(e.message) : next() )
  ,
  // Generate a check procedure (see above) based on a function
  // The function must return the result or a promise resolving with the result
  // The result is FALSY (resource not found) or the resource (an object)
  // If 'save' is provided, the resource is saved under request[save]
  resourceExists: (check, save) => request => Promise.resolve(check(request.params))
    .then(resource => {
      if (resource && save) request[save] = resource
      return resource ? false : { status: 404 }
    })
  ,
  // Generate a check procedure (see above) based on a function
  // The function must return an array containing 0 or more errors
  paramsValidity: checks => request => {
    const errors = validator(request.body, checks)
    return errors.length > 0 && { status: 400, message: errors.join('\n') }
  },
  empty: response => () => response.sendStatus(204),
  created: response => data => {
    if (typeof data != 'string') response.status(201).json(data)
    else response.set('Location', data).sendStatus(204)
  },
  sendJson: response => data => response.json(data),
  sendText: response => text => response.end(text),
  resourceMW,
  StaticResource: data => (resourceMW({ get: (request, response) => Promise.resolve(data).then(data => response.json(data)) })),
  Uri: (root, pattern) => {
    const params = pattern.match(regexp) || []
    return function() {
      return root+pattern.replace(regexp, id => arguments[params.indexOf(id)])
    }
  },
  promisify: fn => (...args) => new Promise((resolve, reject) => fn(...args, (err, result) => err ? reject(err) : resolve(result)))
}
