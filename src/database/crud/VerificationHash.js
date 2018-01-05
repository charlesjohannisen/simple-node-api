const { VerificationHash } = require('../models/VerificationHash')
const messages = require('../../api/messages')

class VerificationHashCrud {
  constructor(connection) {
    this.VerificationHash = connection.model('VerificationHash', VerificationHash)
  }

  create(userId, type) {
    return new Promise((resolve, reject) => {
      const verificationhash = new this.VerificationHash({
        userId,
        type
      })
      verificationhash.save()
        .then(newPasswordReset => resolve(newPasswordReset._id))
        .catch(reject)
    })
  }

  select(id, expires) {
    return new Promise((resolve, reject) => {
      this.VerificationHash.findById(id)
        .then(verificationHash => {
          if (verificationHash) {
            if (!expires || (expires && verificationHash.expires > Date.now())) {
              resolve(verificationHash)
            } else {
              reject({ error: messages.database.HASH_EXPIRED })
            }
          } else {
            reject({error: messages.database.HASH_NOT_FOUND})
          }
        })
        .catch(reject)
    })
  }
}

module.exports = VerificationHashCrud
