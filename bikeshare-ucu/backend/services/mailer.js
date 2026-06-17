const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const CONTACT_TO = process.env.CONTACT_TO || 'nicolasgobbo2007@gmail.com';
const RESEND_FROM =
  process.env.RESEND_FROM || 'BikeShare UCU <onboarding@resend.dev>';
const BREVO_FROM_EMAIL =
  process.env.BREVO_FROM_EMAIL || process.env.SMTP_USER || CONTACT_TO;
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'BikeShare UCU';

function getSmtpFrom() {
  return (
    process.env.SMTP_FROM ||
    (process.env.SMTP_USER ? `BikeShare UCU <${process.env.SMTP_USER}>` : null)
  );
}

function getSmtpPass() {
  return process.env.SMTP_PASS?.replace(/\s/g, '') || '';
}

function getSmtpTransporter() {
  if (!process.env.SMTP_USER || !getSmtpPass()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: getSmtpPass(),
    },
  });
}

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

async function sendViaBrevo({ to, subject, text, html }) {
  if (!process.env.BREVO_API_KEY) {
    return null;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: BREVO_FROM_NAME,
        email: BREVO_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errorMessage = body.message || body.error || errorMessage;
    } catch {
      // ignore JSON parse errors
    }
    console.error('[mailer] Brevo error al enviar a', to, ':', errorMessage);
    return { sent: false, to, error: errorMessage, provider: 'brevo' };
  }

  const data = await response.json().catch(() => ({}));
  console.log('[mailer] Brevo enviado a', to, 'id:', data.messageId);
  return { sent: true, to, id: data.messageId, provider: 'brevo' };
}

async function sendViaSmtp({ to, subject, text, html }) {
  const transporter = getSmtpTransporter();
  const from = getSmtpFrom();

  if (!transporter || !from) {
    return null;
  }

  await transporter.sendMail({ from, to, subject, text, html });
  console.log('[mailer] SMTP enviado a', to);
  return { sent: true, to, provider: 'smtp' };
}

async function sendViaResend({ to, subject, text, html }) {
  const resend = getResend();
  if (!resend) {
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    text,
    html,
  });

  if (error) {
    console.error('[mailer] Resend error al enviar a', to, ':', error.message);
    return { sent: false, to, error: error.message, provider: 'resend' };
  }

  console.log('[mailer] Resend enviado a', to, 'id:', data?.id);
  return { sent: true, to, id: data?.id, provider: 'resend' };
}

async function sendEmail({ to, subject, text, html }) {
  console.log('[mailer] Enviando email a', to, '-', subject);

  if (process.env.BREVO_API_KEY) {
    try {
      const brevoResult = await sendViaBrevo({ to, subject, text, html });
      if (brevoResult?.sent) {
        return brevoResult;
      }
      if (brevoResult && !brevoResult.sent) {
        console.warn('[mailer] Brevo falló, probando respaldo...');
      }
    } catch (err) {
      console.error('[mailer] Brevo error:', err.message);
    }
  }

  if (getResend()) {
    const resendResult = await sendViaResend({ to, subject, text, html });
    if (resendResult?.sent) {
      return resendResult;
    }
    if (resendResult && !resendResult.sent) {
      console.warn('[mailer] Resend falló, probando SMTP...');
    }
  }

  try {
    const smtpResult = await sendViaSmtp({ to, subject, text, html });
    if (smtpResult) {
      return smtpResult;
    }
  } catch (err) {
    console.error('[mailer] SMTP error:', err.message);
    return { sent: false, to, error: err.message, provider: 'smtp' };
  }

  console.warn('[mailer] Sin proveedor de email — no enviado a', to);
  return {
    sent: false,
    to,
    error: 'Configurá BREVO_API_KEY, RESEND_API_KEY o SMTP_USER/SMTP_PASS',
  };
}

async function sendAdminEmail({ subject, text, html }) {
  return sendEmail({ to: CONTACT_TO, subject, text, html });
}

async function notifyApplicationApproved({ email, fullName, bikeCode }) {
  const subject = '[BikeShare UCU] Tu solicitud de alquiler fue aprobada';
  const text = `
Hola ${fullName},

Tu solicitud de alquiler de bicicleta en BikeShare UCU fue aprobada.

Se te asignó la bici ${bikeCode}. Ya podés verla en la sección "Mi Bici" de la plataforma.

¡Buen viaje!
BikeShare UCU
  `.trim();

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1b263b;max-width:560px;">
      <h2 style="margin:0 0 12px;color:#2d6a4f;">¡Solicitud aprobada!</h2>
      <p style="margin:0 0 16px;">Hola <strong>${fullName}</strong>,</p>
      <p style="margin:0 0 16px;line-height:1.5;">
        Tu solicitud de alquiler de bicicleta en BikeShare UCU fue <strong>aprobada</strong>.
      </p>
      <p style="margin:0 0 16px;line-height:1.5;">
        Se te asignó la bici <strong>${bikeCode}</strong>. Ya podés verla en la sección
        <em>Mi Bici</em> de la plataforma.
      </p>
      <p style="margin:0;color:#666;">¡Buen viaje!<br/>BikeShare UCU</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

async function notifyApplicationRejected({ email, fullName, reason }) {
  const subject = '[BikeShare UCU] Tu solicitud de alquiler fue rechazada';
  const reasonText = reason?.trim()
    ? `Motivo del rechazo: ${reason.trim()}`
    : 'No se indicó un motivo específico.';

  const text = `
Hola ${fullName},

Tu solicitud de alquiler de bicicleta en BikeShare UCU fue rechazada.

${reasonText}

Si tenés dudas, contactá a Bedelías.
BikeShare UCU
  `.trim();

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1b263b;max-width:560px;">
      <h2 style="margin:0 0 12px;color:#c1121f;">Solicitud rechazada</h2>
      <p style="margin:0 0 16px;">Hola <strong>${fullName}</strong>,</p>
      <p style="margin:0 0 16px;line-height:1.5;">
        Tu solicitud de alquiler de bicicleta en BikeShare UCU fue <strong>rechazada</strong>.
      </p>
      <p style="margin:0 0 16px;padding:12px 16px;background:#f8f5f0;border-left:4px solid #c1121f;line-height:1.5;">
        ${reason?.trim() ? `<strong>Motivo:</strong> ${reason.trim()}` : 'No se indicó un motivo específico.'}
      </p>
      <p style="margin:0;color:#666;">Si tenés dudas, contactá a Bedelías.<br/>BikeShare UCU</p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
}

module.exports = {
  CONTACT_TO,
  BREVO_FROM_EMAIL,
  BREVO_FROM_NAME,
  RESEND_FROM,
  sendEmail,
  sendAdminEmail,
  notifyApplicationApproved,
  notifyApplicationRejected,
};
