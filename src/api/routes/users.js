const multer = require('multer')
const fileUpload = multer({ dest: '/tmp/' })
const {
  normaliseData,
  deleteOldFiles,
  normaliseSelect
} = require('../../database/Normalise.js')

function update(req, res) {
  return normaliseData('User', req, 'update')
    .then(updateData => req.database.User.update(req.body.id, updateData)
      .then(() => res.json({ message: 'User Updated' }))
      .catch(error => res.status(500).json({ error })))
    .catch(error => res.status(500).json({ error }))
}

function create(req, res) {
  return normaliseData('User', req, 'create')
    .then(createData => req.database.User.create(createData)
      .then(() => res.json({ message: 'User Created' }))
      .catch(error => res.status(500).json({ error })))
    .catch(error => res.status(500).json({ error }))
}

function deleteUser(req, res) {
  const deleteArray = deleteOldFiles('User', req)
  Promise.all(deleteArray)
    .then(() =>
      req.database.User.delete(req.params.id)
        .then(() => res.json({ message: 'User Deleted' }))
        .catch(error => res.status(500).json({ error })))
    .catch(error => res.status(500).json({ error }))
}

function select(req, res) {
  const { from, limit, sort, search } = req.body
  const { id } = req.params
  req.database.User.select(id, { from, limit, sort, search })
    .then(user => res.json(normaliseSelect('User', user)))
    .catch(error => res.status(500).json({ error }))
}

module.exports = {
  set: (api, auth) => {
    api.post(
      '/users/create',
      auth.authenticate(),
      fileUpload.fields([
        { name: 'profileImage', maxCount: 1 }
      ]),
      create
    )
    api.get('/users/:id', auth.authenticate(), select)
    api.get('/users/delete/:id', auth.authenticate(), deleteUser)
    api.post('/users', auth.authenticate(), select)
    api.post(
      '/users/update',
      auth.authenticate(),
      fileUpload.fields([
        { name: 'profileImage', maxCount: 1 }
      ]),
      update
    )
  }
}
