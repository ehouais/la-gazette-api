const { log } = require('./src/helpers/logger')

// Test DB connection
const dao = require('./src/dao')
dao.test()
  .then(_ => {
    // Instantiate express application
    const express = require('express')
    const app = express()

    // Register several utilitary middlewares
    app
      .use(require('cors')())
      .use(express.urlencoded({ extended: true })) // auto-parse body when content-type is 'application/x-www-form-urlencoded'
      .use(express.json()) // auto-parse body when content-type is 'application/json'

    // Register routes and corresponding resources
    const { homeRoute, authRoute, advertsRoute, advertRoute, advertPhotosRoute, photosRoute, photoRoute, usersRoute, userRoute } = require('./src/routes')
    const { home } = require('./src/resources/home')
    const { auth } = require('./src/resources/auth')
    const { adverts, advert } = require('./src/resources/adverts')
    const { users, user } = require('./src/resources/users')
    const { advertPhotos } = require('./src/resources/advertPhotos')
    const { photos, photo } = require('./src/resources/photos')
    const { resourceMW, resourceFactoryMW } = require('./src/helpers/express-rest')
    app
      .all(homeRoute, resourceMW(home))
      .all(authRoute, resourceMW(auth))
      .all(advertsRoute, resourceMW(adverts))
      .all(advertRoute, resourceFactoryMW(advert))
      .all(advertPhotosRoute, resourceFactoryMW(advertPhotos))
      .all(photosRoute, resourceMW(photos))
      .all(photoRoute, resourceFactoryMW(photo))
      .all(usersRoute, resourceMW(users))
      .all(userRoute, resourceFactoryMW(user))

    // Start server
    const port = process.env.PORT
    app.listen(port, () => log(`Server listening on port ${port}`))
  })
  .catch(e => {
    log(`Application could not start: `, e)
  })