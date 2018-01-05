function appendFieldConfig(field, fieldSettings) {
  return Object.keys(fieldSettings).reduce(
    (acc, setting) => {
      const value = fieldSettings[setting].reduce(
        (settingAcc, currentField) => {
          if (typeof currentField === 'string' && field === currentField) {
            return true
          } else if (typeof currentField === 'object' && currentField[field]) {
            return currentField[field]
          }
          return settingAcc
        },
        undefined
      )
      if (value) {
        return { ...acc, [setting]: value }
      }
      return acc
    },
    {}
  )
}

function configFields(fields, fieldSettings) {
  return Object.keys(fields).reduce(
    (acc, field) => {
      const setting = appendFieldConfig(field, fieldSettings)
      return { ...acc, [field]: { ...fields[field], ...setting } }
    },
    {}
  )
}

function setS3FileUrl(file) {
  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${file}`
}

module.exports = {
  configFields,
  setS3FileUrl
}
