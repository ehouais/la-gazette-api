const Roles = { USER: 1, ADMIN: 2 }

const authorize = (role, allowedRoles, response, cb) => {
  if (allowedRoles.indexOf(role) != -1) cb()
  else response.sendStatus(401)
}

module.exports = { Roles, authorize }