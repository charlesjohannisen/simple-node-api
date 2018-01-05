const {
  passwordResetMail,
  emailVerificationMail
} = require('../mailer.js')
const messages = require('../messages')

function register(req, res) {
  const { email, password } = req.body

  req.database.User.create(email, password)
    .then(userID => {
      req.database.VerificationHash.create(userID, 'verifyemail')
        .then(verificationToken => {
          emailVerificationMail(email, verificationToken)
            .then(res.json({ message: messages.authentication.VERIFICATION_LINK_SENT }))
            .catch(error => res.status(500).json({ error }))
        })
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}

function forgotpassword(req, res) {
  req.database.VerificationHash.create(req.user._id, 'passwordreset')
    .then(resetToken => {
      passwordResetMail(req.user.email, resetToken)
        .then(res.json({ message: messages.authentication.RESET_LINK_SENT }))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}

function resetpassword(req, res) {
  req.database.VerificationHash.select(req.body.hash, true)
    .then(verificationHash => {
      req.database.User.update(verificationHash.userId, { password: req.body.password })
        .then(res.json({ message: req.database.PASSWORD_UPDATED }))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}

function verifyemail(req, res) {
  req.database.VerificationHash.select(req.body.hash)
    .then(verificationHash => {
      req.database.User.update(
        verificationHash.userId,
        { emailVerified: Date.now() }
      )
        .then(res.json({ message: req.database.EMAIL_VERIFIED }))
        .catch(error => res.status(500).json({ error }))
    })
    .catch(error => res.status(500).json({ error }))
}

module.exports = {
  set: (api, auth) => {
    api.post(
      '/login',
      auth.initializeAuth(),
      (req, res) => res.json({ token: req.user.token, role: req.user.role })
    )
    api.post('/register', register)
    api.post('/forgotpassword', auth.initializeAuth(), forgotpassword)
    api.post('/resetpassword', resetpassword)
    api.post('/verifyemail', verifyemail)
  }
}
