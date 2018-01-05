const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { configFields } = require('../helper')

const fields = {
  userId: { type: Schema.ObjectId, ref: 'User', required: true },
  created: { type: Date, default: Date.now },
  type: { type: String, enum: ['passwordreset', 'verifyemail'], required: true },
  expires: { type: Date, default: () => Date.now() + 3600000 },
}

const VerificationHash = new Schema(fields)

VerificationHash.pre('save', function (next) {
  if (this.type === 'passwordreset') {
    this.constructor.deleteMany({ userId: this.userId, type: this.type })
      .exec()
      .then(next)
      .catch(err => next(err))
  } else {
    next()
  }
})

fields._id = {}
const appendForNormalising = {
  selectAs: [{ _id: 'id' }],
  select: ['_id', 'userId', 'created', 'type', 'expires'],
  insert: ['userId', 'type'],
  update: ['expires']
}

module.exports = {
  VerificationHash,
  VerificationHashFields: configFields(fields, appendForNormalising)
}
