const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { Strategy, ExtractJwt } = require('passport-jwt')
const jwt = require('jwt-simple')
const messages = require('./messages')
const params = {
  secretOrKey: process.env.APP_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: true
}

const pathsRoles = [
  { path: '/users(.*)', roles: ['admin'] }
]

function roleCanAccess(userRole, url) {
  let canAccess = true
  pathsRoles.forEach(({ path, roles }) => {
    const reg = new RegExp(path)
    if (reg.test(url)) {
      canAccess = roles.find(role => userRole === role)
    }
  })
  return canAccess
}

const strategy = new Strategy(params, (req, payload, done) => {
  req.database.User.select(payload.id)
    .then(user => {
      if (!user) {
        return done({ error: messages.authentication.INCORRECT_CREDENTIALS })
      }
      if (!roleCanAccess(user.role, req.url)) {
        return done({ error: messages.authentication.RESTRICTED_ROUTE })
      }
      return done(null, user)
    })
    .catch(error => done(error))
})

const localStategy = new LocalStrategy(
  { usernameField: 'email', passReqToCallback: true },
  (req, username, passw, done) => {
    const password = passw === '_reset_' ? null : passw
    req.database.User.select(null, username, password)
      .then(user => {
        if (!user) {
          return done({ error: messages.authentication.INCORRECT_CREDENTIALS })
        }
        if (password) {
          if (user.emailVerified) {
            const token = jwt.encode({ id: user._id }, process.env.APP_SECRET)
            return done(null, { token, role: user.role })
          }
          return done({ error: req.database.EMAIL_NOT_VERIFIED })
        }
        return done(null, user)
      })
      .catch(error => done(error))
})

passport.use(localStategy)
passport.use(strategy)

module.exports = {
  initialize: () => passport.initialize(),
  authenticate: () => passport.authenticate('jwt', { session: false }),
  initializeAuth: () => passport.authenticate('local', { session: false })
}
