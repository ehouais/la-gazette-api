const { log } = require('./src/helpers/logger')

// Test DB connection
const dao = require('./src/dao')
dao.test()
  .then(_ => {
    // Instantiate express application
    const express = require('express')
    const app = express()
    const { secretMW } = require('./src/auth')

    // Register several utilitary middlewares
    app
      // Check shared secret in headers
      .use(secretMW)
      // Handle CORS headers
      .use(require('cors')())
      // Auto-parse body when content-type is 'application/x-www-form-urlencoded'
      .use(express.urlencoded({ extended: true }))
      // Auto-parse body when content-type is 'application/json'
      .use(express.json())

    // Register routes and corresponding resources
    const { homeRoute, tokensRoute, tokenRoute, advertsRoute, advertRoute, advertPhotosRoute, photosRoute, photoRoute, usersRoute, userRoute } = require('./src/routes')
    const { home } = require('./src/resources/home')
    const { tokens, token } = require('./src/resources/tokens')
    const { adverts, advert } = require('./src/resources/adverts')
    const { users, user } = require('./src/resources/users')
    const { advertPhotos } = require('./src/resources/advertPhotos')
    const { photos, photo } = require('./src/resources/photos')
    app
      .all(homeRoute, home)
      .all(tokensRoute, tokens)
      .all(tokenRoute, token)
      .all(advertsRoute, adverts)
      .all(advertRoute, advert)
      .all(advertPhotosRoute, advertPhotos)
      .all(photosRoute, photos)
      .all(photoRoute, photo)
      .all(usersRoute, users)
      .all(userRoute, user)

    // Start server
    const port = process.env.PORT
    app.listen(port, () => log(`Server listening on port ${port}`))
  })
  .catch(e => {
    log(`Application could not start: `, e)
  })