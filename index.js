// Instantiate express app and register several middlewares
const express = require('express')
const app = express()
app.use(require('cors')())
//app.use(express.urlencoded()); // auto-parse body when content-type is 'application/x-www-form-urlencoded'
//app.use(require('express-jwt')({secret: 'secret'})) // ...
app.use(express.json()); // auto-parse body when content-type is 'application/json'

// Temporary middleware to force role
const { Roles } = require('./src/helpers/auth')
app.use((request, response, next) => { request.user = { role: Roles.USER }; next() })

// Register routes and corresponding resources
const { homeRoute, advertsRoute, advertRoute } = require('./src/routes')
const { home, adverts, advert } = require('./src/resources')
const { registerResource, registerResourceFactory } = require('./src/helpers/express-rest')
registerResource(app, homeRoute, home)
registerResource(app, advertsRoute, adverts)
registerResourceFactory(app, advertRoute, advert)

// Start server
const { log } = require('./src/helpers/logger')
const port = process.env.PORT
app.listen(port, () => log(`Server listening on port ${port}`))