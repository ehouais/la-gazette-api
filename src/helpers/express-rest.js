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
  check: (...checkProcs) => (request, response, next) =>
    checkProcs.reduce(
      (chain, promise) => chain.then(() => promise(request)),
      Promise.resolve()
    )
    .then(() => next())
  ,
  resourceExists: (check, save) => request => new Promise((resolve, reject) => {
    check(request.params).then(resource => {
      if (!resource) return reject({ status: 404 })
      if (save) request[save] = resource
      resolve()
    })
  }),
  paramsValidity: checks => request => new Promise((resolve, reject) => {
    const errors = validator(request.body, checks)
    if (errors.length) return reject({ status: 400, message: errors.join('\n')})
    resolve()
  }),
  empty: response => () => response.sendStatus(204),
  created: response => data => response.status(201).json(data),
  send: response => data => response.json(data),
  resourceMW,
  StaticResource: data => (resourceMW({ get: (request, response) => response.json(data) })),
  Uri: (root, pattern) => {
    const params = pattern.match(regexp) || []
    return function() {
      return root+pattern.replace(regexp, id => arguments[params.indexOf(id)])
    }
  }
}
