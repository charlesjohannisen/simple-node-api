const express = require('express')
const { join } = require('path')
const authentication = require('./authentication.js')
const users = require('./users.js')
const { normaliseSelect } = require('../../database/Normalise.js')

module.exports = {
  set: (api, auth) => {
    authentication.set(api, auth)
    users.set(api, auth)

    api.use('/public', express.static(join(__dirname, '../public/')))

    api.get(
      '/dashboard',
      auth.authenticate(),
      (req, res) => res.json(normaliseSelect('User', req.user, ['id', 'role', 'emailVerified']))
    )
  }
}
