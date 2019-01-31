const { uploadFile, deleteFile } = require('../api/s3.js')
const { cropAndUpload, pluck, importModels } = require('../api/helper.js')
const { join } = require('path')
const models = importModels(join(__dirname, './models'))

async function selectFields(model) {
  const globalModels = await models
  const fields = globalModels[`${model}Fields`]
  const createFields = Object.keys(fields).filter(
    field => fields[field].insert && !fields[field].crop && !fields[field].file
  )
  const updateFields = Object.keys(fields).filter(
    field => fields[field].update && !fields[field].crop && !fields[field].file
  )
  const deleteFileFields = Object.keys(fields).filter(
    field => fields[field].crop || fields[field].file
  )
  const cropFields = Object.keys(fields).filter(field => fields[field].crop)
  const fileFields = Object.keys(fields).filter(
    field => fields[field].file && cropFields.indexOf(field) === -1
  )
  const selectedFields = Object.keys(fields).filter(
    field => fields[field].select
  )
  return {
    deleteFileFields,
    createFields,
    updateFields,
    fileFields,
    cropFields,
    selectedFields
  }
}

async function normaliseEntry(model, entry, excl) {
  const exclude = excl || []
  const { selectedFields } = await selectFields(model)
  const globalModels = await models
  const fields = globalModels[`${model}Fields`]
  return selectedFields.reduce(
    (acc, field) => {
      if (field in entry) {
        let key = field
        let value = entry[field]

        if (fields[field].selectAs) {
          key = fields[field].selectAs
        }

        if (fields[field].select instanceof Function) {
          value = fields[field].select(entry[field])
        }
        return exclude.indexOf(key) === -1 ? { ...acc, [key]: value } : acc
      }
      return acc
    },
    {}
  )
}

async function normaliseSelect(model, selectData, excl) {
  if (Array.isArray(selectData) && selectData.length) {
    const dataMap = selectData.map(entry => normaliseEntry(model, entry, excl))
    return await Promise.all(dataMap)
  }
  return await normaliseEntry(model, selectData, excl)
}

function deleteOldFile(field, db, id) {
  return new Promise((resolve, reject) => {
    if (id) {
      db.Content.select(id)
        .then(content => {
          const imgPath = content[field].split('/')
          return deleteFile(imgPath[1], imgPath[0])
            .then(resolve)
            .catch(reject)
        })
        .catch(reject)
    } else {
      resolve()
    }
  })
}

async function deleteOldFiles(model, req) {
  const { deleteFileFields } = await selectFields(model)
  return deleteFileFields.map(file => new Promise((resolve, reject) => {
    deleteOldFile(file, req.database, req.body.id || req.params.id)
      .then(resolve)
      .catch(reject)
  }))
}

function getFileUploadArray(fileFields, model, req) {
  return fileFields.map(file => {
    if (req.files[file]) {
      return new Promise((resolve, reject) => {
        uploadFile(req.files[file][0], 'files')
          .then(returnData => {
            deleteOldFile(file, req.database, req.body.id)
              .then(resolve({ [file]: returnData.key }))
              .catch(reject)
          })
          .catch(reject)
      })
    }
    return Promise.resolve()
  })
}

function getImageUploadArray(cropFields, model, req) {
  return cropFields.map(image => {
    if (req.files[image] && req.body.crop) {
      return new Promise((resolve, reject) => {
        cropAndUpload(req.files[image][0], req.body.crop)
          .then(returnData => {
            deleteOldFile(image, req.database, req.body.id)
              .then(resolve({ [image]: returnData.key }))
              .catch(reject)
          })
          .catch(reject)
      })
    }
    return Promise.resolve()
  })
}

async function normaliseData(model, req, action) {
  const {
    createFields,
    updateFields,
    fileFields,
    cropFields
  } = await selectFields(model)
  const imageUploadArray = (cropFields && getImageUploadArray(cropFields, model, req)) || [Promise.resolve([])]
  const fileUploadArray = (fileFields && getFileUploadArray(fileFields, model, req)) || [Promise.resolve([])]

  const fields = action === 'update' ? updateFields : createFields

  return new Promise((resolve, reject) => {
    Promise.all(imageUploadArray.concat(fileUploadArray))
      .then(uploadedFiles => {
        const updateData = pluck(fields, req.body)
        const filesUploaded = uploadedFiles.reduce(
          (acc, file) => ({ ...acc, ...file }),
          {}
        )
        resolve({ ...updateData, ...filesUploaded })
      })
      .catch(reject)
  })
}

module.exports = {
  normaliseData,
  deleteOldFiles,
  normaliseSelect
}
