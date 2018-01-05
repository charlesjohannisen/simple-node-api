const SendGrid = require('@sendgrid/mail')
const fs = require('fs')
const { populateTemplate } = require('./helper')

const mailContent = {
  passwordreset: 'Hi,<br>your reset link is [link]',
  verifyemail: 'Hi,<br>please verify your email address [link]'
}

function sendMail(to, subject, html, attachments) {
  const msg = {
    to,
    from: process.env.MAIL_FROM,
    subject,
    html,
    attachments
  }
  SendGrid.setApiKey(process.env.SENDGRID_API_KEY)
  return SendGrid.send(msg)
}

function passwordResetMail(to, hash) {
  return sendMail(
    to,
    'Reset Password',
    populateTemplate({ link: `<a href="${process.env.FRONTEND_URL}/resetpassword/${hash}/">HERE</a>` }, mailContent.passwordreset)
  )
}

function emailVerificationMail(to, hash) {
  return sendMail(
    to,
    'Verify Email',
    populateTemplate({ link: `<a href="${process.env.FRONTEND_URL}/verifyemail/${hash}/">HERE</a>` }, mailContent.verifyemail)
  )
}

function makeAttachments(attachments) {
  const attach = []
  for(let index in attachments) {
    const file = attachments[index][0]
    const attachment = fs.readFileSync(file.path)
    attach.push(
      {
        content: attachment.toString('base64'),
        filename: file.originalname,
        type: file.mimetype,
        disposition: 'attachment',
        contentId: file.filename
      }
    )
  }
  return attach
}

module.exports = {
  passwordResetMail,
  emailVerificationMail
}
