const nodemailer = require('nodemailer');

const CONTACT_TO = process.env.CONTACT_TO || 'nicolasgobbo2007@gmail.com';

function createTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

async function sendAdminEmail({ subject, text, html }) {
  const transport = createTransport();
  if (!transport) {
    console.warn('[mailer] SMTP no configurado — email no enviado:', subject);
    return { sent: false, to: CONTACT_TO };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'bikeshare@ucu.edu.uy',
    to: CONTACT_TO,
    subject,
    text,
    html,
  });

  return { sent: true, to: CONTACT_TO };
}

module.exports = { CONTACT_TO, sendAdminEmail };
