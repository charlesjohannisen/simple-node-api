const bcrypt = require('bcrypt')
const { User } = require('../models/User')
const { VerificationHash } = require('../models/VerificationHash')
const messages = require('../../api/messages')

class UserCrud {
  constructor(connection) {
    this.User = connection.model('User', User)
    this.VerificationHash = connection.model('VerificationHash', VerificationHash)
  }

  select(id, username, password) {
    return new Promise((resolve, reject) => {
      let query
      if (id) {
        query = this.User.findById(id)
      } else if (username) {
        query = this.User.findOne({ username })
      } else {
        reject({ error: messages.database.PARAMETERS_NOT_SPECIFIED })
      }

      query.then(foundUser => {
        if (foundUser && password) {
          if (bcrypt.compareSync(password, foundUser.password)) {
            resolve(foundUser)
          } else {
            reject({ error: messages.database.INCORRECT_CREDENTIALS })
          }
        } else {
          resolve(foundUser)
        }
      })
        .catch(reject)
    })
  }

  create(email, password) {
    return new Promise((resolve, reject) => {
      this.getUser(null, email, null)
        .then(userData => {
          if (!userData) {
            const user = new this.User({
              email,
              password
            })
            user.save()
              .then(newUser => {
                resolve(newUser.id)
              })
              .catch(reject)
          } else {
            reject({ error: messages.database.USER_EXISTS })
          }
        })
        .catch(reject)
    })
  }

  update(id, data) {
    return new Promise((resolve, reject) => {
      this.User.findById(id)
        .then(user => {
          if (user) {
            user.set(data)
            user.save()
              .then(alteredUser => {
                if (data.password) {
                  this.VerificationHash.deleteMany(
                    { userId: id, type: 'passwordreset' }
                  )
                    .exec()
                    .then(resolve(alteredUser))
                    .catch(reject)
                } else {
                  resolve(alteredUser)
                }
              })
              .catch(reject)
          } else {
            reject({ error: messages.database.USER_NOT_FOUND })
          }
        })
        .catch(reject)
    })
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      this.User.findByIdAndRemove(id)
        .then(user => resolve(user._id))
        .catch(reject)
    })
  }
}

module.exports = UserCrud
