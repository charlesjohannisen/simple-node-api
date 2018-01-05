const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const api = express()
const mongoose = require('mongoose')
const Honeybadger = require('honeybadger').configure({
  apiKey: process.env.HONEY_BADGER_API_KEY
})
const auth = require('./auth')
const { clientErrorHandler, errorHandler } = require('./helper')
const routes = require('./routes')
const Database = require('../database')
Honeybadger.logger.level = 'info'
Honeybadger.metricsInterval = 10000
api.use(Honeybadger.requestHandler)
api.use(bodyParser.json())
api.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  next()
})
api.use(methodOverride())
mongoose.Promise = global.Promise
mongoose.createConnection(process.env.DB_URL, {
  useMongoClient: true
})
  .then(db => {
    api.use((req, res, next) => {
      req.database = new Database(db)
      next()
    })
    api.use(auth.initialize())
    routes.set(api, auth)
    api.use(clientErrorHandler)
    api.use(errorHandler)
    api.listen(process.env.APP_PORT, () => {
      console.log(`Generic Node API running on ${process.env.APP_HOST}:${process.env.APP_PORT}`)
    })
  })
  .catch(error => {
    console.log('connection error:', error)
  })

module.exports = api
api.use(Honeybadger.errorHandler)
