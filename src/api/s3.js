const AWS = require('aws-sdk')
AWS.config.update({
  accessKeyId: process.env.S3_ID,
  secretAccessKey: process.env.S3_KEY
})
const s3 = new AWS.S3()
const fs = require('fs')

function uploadFile(file, bucket) {
  return new Promise((resolve, reject) => {
    const body = fs.createReadStream(file.path)
    const params = {
      Key: `${file.filename}_${file.originalname}`,
      Body: body,
      ACL: 'bucket-owner-full-control',
      Bucket: `${process.env.S3_BUCKET}/${bucket}`
    }
    s3.upload(params, (error, data) => {
      if (error) reject(error)
      resolve(data)
    })
  })
}

function deleteFile(Key, bucket) {
  return new Promise((resolve, reject) => {
    const params = {
      Key,
      Bucket: `${process.env.S3_BUCKET}/${bucket}`
    }
    s3.deleteObject(params, error => {
      if (error) reject(error)
      resolve()
    })
  })
}

module.exports = {
  uploadFile,
  deleteFile
}
