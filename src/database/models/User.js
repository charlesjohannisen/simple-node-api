const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Schema = mongoose.Schema
const { configFields, setS3FileUrl } = require('../helper')

const fields = {
  email: { type: String, required: true },
  password: { type: String, required: true },
  profileImage: { type: String, required: true },
  created: { type: Date, default: Date.now },
  emailVerified: { type: Date, default: '' },
  role: { type: String, required: true, default: 'user', enum: ['user', 'admin'] }
}

const User = new Schema(fields)

User.pre('findOne', function () {
  if (this._conditions.email) {
    this.where({ email: this._conditions.email.toLowerCase() })
  }
})

User.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, 10)
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase()
  }
  next()
})

fields._id = {}
const appendForNormalising = {
  selectAs: [{ _id: 'id' }],
  select: ['_id', 'email', { profileImage: setS3FileUrl }, 'created', 'emailVerified', 'role'],
  insert: ['email', 'password', 'profileImage', 'role'],
  update: ['password', 'profileImage', 'emailVerified', 'role'],
  crop: ['profileImage']
  // file: ['eg_resume']
}
module.exports = {
  User,
  UserFields: configFields(fields, appendForNormalising)
}
