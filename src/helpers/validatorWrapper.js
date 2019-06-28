const Validator = require('validator')

module.exports = (data, checks) => {
  const errors = []
  check = { exists: key => key in data }
  checks(name => new Proxy({}, {
    get: (target, key) => (...args) => {
      if (key == 'exists') {
        if (args[0]) errors.push(`"${name}" is mandatory`) // check('property').exists(true)
        return name in data
      } else {
        const result = Validator[key].call(this, data[name], ...args)
        if (!result) errors.push(`"${name}" value is invalid`)
        return result
      }
    }
  }))
  return errors
}
