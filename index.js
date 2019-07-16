const { log } = require('./src/helpers/logger')
const { SECRET_HEADER, SHARED_SECRET, PORT } = process.env

// Test DB connection
const dao = require('./src/dao')
dao.test()
  .then(_ => {
    // Instantiate express application
    const express = require('express')
    const app = express()

    // Register several utilitary middlewares
    app
      // Check shared secret in headers
      .use((request, response, next) => {
        return request.method == 'OPTIONS' || request.get(SECRET_HEADER) == SHARED_SECRET ? next() : response.sendStatus(401)
      })
      // Handle CORS headers
      .use(require('cors')())
      // Auto-parse body when content-type is 'application/x-www-form-urlencoded'
      .use(express.urlencoded({ extended: true }))
      // Auto-parse body when content-type is 'application/json'
      .use(express.json())

    // Register routes and corresponding resources
    const { homeRoute, tokensRoute, advertsRoute, advertRoute, advertPhotosRoute, photosRoute, photoRoute, usersRoute, userRoute, statsRoute } = require('./src/routes')
    const { home } = require('./src/resources/home')
    const { tokens } = require('./src/resources/tokens')
    const { adverts, advert } = require('./src/resources/adverts')
    const { users, user } = require('./src/resources/users')
    const { advertPhotos } = require('./src/resources/advertPhotos')
    const { photos, photo } = require('./src/resources/photos')
    const { stats } = require('./src/resources/stats')
    app
      .all(homeRoute, home)
      .all(tokensRoute, tokens)
      .all(advertsRoute, adverts)
      .all(advertRoute, advert)
      .all(advertPhotosRoute, advertPhotos)
      .all(photosRoute, photos)
      .all(photoRoute, photo)
      .all(usersRoute, users)
      .all(userRoute, user)
      .all(statsRoute, stats)

    // Start server
    app.listen(PORT, () => log(`Server listening on port ${PORT}`))
  })
  .catch(e => {
    log(`Application could not start: `, e)
  })