const fs = require('fs')
const sharp = require('sharp')
const { uploadFile } = require('./s3.js')

function listFiles(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (error, items) => {
      if (error) reject(error)
      resolve(items)
    })
  })
}

function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(src)
    stream.once('error', err => reject(err))
    stream.once('end', () => resolve('done copying'))
    stream.pipe(fs.createWriteStream(dest))
  })
}

function getFileExtension(fileName) {
  const file = fileName.split('.').reverse()
  return file.length > 1 ? file[0] : ''
}

function importModels(path) {
  return new Promise((resolve, reject) => {
    listFiles(path)
      .then(files => {
        const modelFields = files.reduce(
          (acc, file) => {
            if (getFileExtension(file) === 'js') {
              const modelName = file.split('.')[0]
              const model = require(`${path}/${modelName}`)
              if (model[`${modelName}Fields`]) {
                return { ...acc, [`${modelName}Fields`]: model[`${modelName}Fields`] }
              }
            }
            return acc
          },
          {}
        )
        resolve(modelFields)
      })
      .catch(reject)
  })
}

function clientErrorHandler(error, req, res, next) {
  res.status(500).json({ error })
}

function errorHandler(error, req, res, next) {
  res.status(500).json({ error })
}

const pluck = (fields, obj) =>
  Object.keys(obj)
    .filter(key => fields.indexOf(key) !== -1)
    .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {})

function cropImage(crop, fromImage, toImage) {
  return new Promise(resolve => {
    sharp(fromImage)
      .extract({
        left: Number(crop.x),
        top: Number(crop.y),
        width: Number(crop.width),
        height: Number(crop.height)
      })
      .resize(Number(crop.resize), null)
      .toFile(toImage, resolve)
  })
}

function cropAndUpload(image, cropData) {
  return new Promise((resolve, reject) => {
    const resizedImgPath = `${image.path}_`
    cropImage(cropData, image.path, resizedImgPath)
      .then(error => {
        if (error) reject(error)
        uploadFile(Object.assign({}, image, { path: resizedImgPath }), 'images')
          .then(returnData => {
            resolve(returnData)
          })
          .catch(reject)
      })
      .catch(reject)
  })
}

function populateTemplate(data, template) {
  return Object.keys(data).reduce(
    (acc, field) => (acc.replace(`[${field}]`, data[field])),
    template
  )
}

module.exports = {
  copyFile,
  getFileExtension,
  clientErrorHandler,
  errorHandler,
  pluck,
  cropAndUpload,
  populateTemplate,
  listFiles,
  importModels
}
