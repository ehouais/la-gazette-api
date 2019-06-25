const { log } = require('./logger')

const chain = function() {
  return [...arguments].reduce((chain, mw) => chain ? (request, response, next) => {
    chain(request, response, () => { mw(request, response, next || (() => {})) })
  } : mw, null)
}
const check = validator => (request, response, next) => {
  validator(request)
    .then(() => next())
    .catch(e => { response.status(e.status).end(e.message) })
}
const paramsValidator = tests => request => new Promise((resolve, reject) => {
  const messages = []
  const res = tests(request.body, (test, message) => {
    if (!test) messages.push(message)
    return test
  })
  if (messages.length) return reject({ status: 400, message: messages.join('\n')})
  resolve()
})
const ifExists = (cb, response) =>
  data => { if (data) cb(data); else response.sendStatus(404) }

const genericErrorHandler = response =>
  error => {
    if (typeof error == 'string') log(`Error: ${error}`)
    else log('Error', error)
    response.sendStatus(500)
  }

const formatAndSend = (response, formatter, status = 200) => data => { response.status(status).json(formatter(data)) }

const resourceFactoryMW = factory => (request, response) => {
  const params = request.route.path.match(/:[a-zA-Z0-9_]+/g) || []
  const args = params.map(id => request.params[id.slice(1)])
  factory.apply(null, args).then(resource => {
    if (!resource) return response.sendStatus(404)
    const method = request.method.toLowerCase()
    log(`Request: ${request.method} ${request.path}`)
    let mw = resource[method]
    if (!mw) return response.sendStatus(405)
    if (Array.isArray(mw)) mw = chain(...mw)
    mw(request, response)
  })
}

const resourceMW = resource => resourceFactoryMW(() => Promise.resolve(resource))

const StaticResource = data => ({ get: (request, response) => response.json(data) })

const regexp = RegExp(':[a-zA-Z0-9_]+', 'g')
const Uri = (root, pattern) => {
  const params = pattern.match(regexp) || []
  return function() {
    return root+pattern.replace(regexp, id => arguments[params.indexOf(id)])
  }
}

module.exports = {
  check,
  paramsValidator,
  formatAndSend,
  ifExists,
  genericErrorHandler,
  resourceMW,
  resourceFactoryMW,
  StaticResource,
  Uri
}
