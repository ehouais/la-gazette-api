const { log } = require('./logger')

const chain = function() {
  return [...arguments].reduce((chain, mw) => chain ? (request, response, next) => {
    chain(request, response, () => { mw(request, response, next || (() => {})) })
  } : mw, null)
}
const regexp = RegExp(':[a-zA-Z0-9_]+', 'g')
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

module.exports = {
  check: validator => (request, response, next) => {
    validator(request)
      .then(() => next())
      .catch(e => {
        response.status(e.status || 500).end(e.message)
      })
  },  
  run: process => (request, response) => process(request, response)
    .catch(error => {
      if (typeof error == 'string') log(`Error: ${error}`)
      else log('Error', error)
      response.sendStatus(500)
    }),
  empty: response => () => response.sendStatus(204),
  created: response => data => response.status(201).json(data),
  send: response => data => response.json(data),
  paramsValidator: tests => request => new Promise((resolve, reject) => {
    const messages = []
    const res = tests(request.body, (test, message) => {
      if (!test) messages.push(message)
      return test
    })
    if (messages.length) return reject({ status: 400, message: messages.join('\n')})
    resolve()
  }),
  resourceMW: resource => resourceFactoryMW(() => Promise.resolve(resource)),
  resourceFactoryMW,
  StaticResource: data => ({ get: (request, response) => response.json(data) }),
  Uri: (root, pattern) => {
    const params = pattern.match(regexp) || []
    return function() {
      return root+pattern.replace(regexp, id => arguments[params.indexOf(id)])
    }
  }
}
