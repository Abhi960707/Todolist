const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },

  family: 4,

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,

  dnsTimeout: 10000,
});

module.exports = transporter;