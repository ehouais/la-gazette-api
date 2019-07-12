const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: { user: process.env.SMTP_LOGIN, pass: process.env.SMTP_PASSWORD }
})
const from = '"La Gazette" <la.gazette@orange.fr>'

module.exports = (to, subject, text, html) => transporter.sendMail({ from, to, subject, text, html })
