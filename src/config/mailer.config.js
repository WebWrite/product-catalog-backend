import nodemailer from "nodemailer"
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
})

export default transport
