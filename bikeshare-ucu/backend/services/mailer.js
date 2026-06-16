const { Resend } = require('resend');

const CONTACT_TO = process.env.CONTACT_TO || 'nicolasgobbo2007@gmail.com';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

async function sendAdminEmail({ subject, text, html }) {
  const resend = getResend();

  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY no configurada');
    return { sent: false, to: CONTACT_TO };
  }

  await resend.emails.send({
    from: 'BikeShare UCU <onboarding@resend.dev>',
    to: CONTACT_TO,
    subject,
    text,
    html,
  });

  return {
    sent: true,
    to: CONTACT_TO,
  };
}

module.exports = {
  CONTACT_TO,
  sendAdminEmail,
};