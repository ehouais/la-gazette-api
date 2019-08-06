const { log } = require('./logger')
const regexp = RegExp(':[a-zA-Z0-9_]+', 'g')

// Creates an express middleware from a resource
// A resource is an object with "method-properties" (properties corresponding to available HTTP methods in lowercase)
// A "method-property" contains a middleware
// Ex: MW = resourceMW({ get: mw1, post: mw2})
const resourceMW = resource => (request, response) => {
  const method = request.method.toLowerCase()
  log(`Request: ${request.method} ${request.path}`)
  let mw = resource[method]
  if (!mw) return response.sendStatus(405)
  try {
    mw(request, response)
  } catch(e) {
    log(e)
    response.sendStatus(500)
  }
}
const check = (test, errorCode, msg) => async (args, response, next) => {
  const result = await test(...(Array.isArray(args) ? args : [args]))
  result ? next(result) : response.status(errorCode).end(msg)
}
const checkData = test => async (data, response, next) => {
  const result = test(data)
  result ? response.status(400).end(result) : next(data)
}

module.exports = {
  resourceMW,
  check,
  checkData,
  ifResourceExists: search => check(search, 404),
  StaticResource: data => (resourceMW({ get: (request, response) => Promise.resolve(data).then(data => response.json(data)) })),
  Uri: (root, pattern) => {
    const params = pattern.match(regexp) || []
    return function() {
      return root+pattern.replace(regexp, id => arguments[params.indexOf(id)])
    }
  },
  promisify: fn => (...args) => new Promise((resolve, reject) => fn(...args, (err, result) => resolve([err, result])))
}
