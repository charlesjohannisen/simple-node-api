const UserCrud = require('./crud/User')
const VerificationHashCrud = require('./crud/VerificationHash')
const messages = require('../api/messages')

class Database {
  constructor(connection) {
    this.User = new UserCrud(connection)
    this.VerificationHash = new VerificationHashCrud(connection)
    Object.keys(messages.database).map(key => {
      this[key] = messages.database[key]
    })
  }
}

module.exports = Database
