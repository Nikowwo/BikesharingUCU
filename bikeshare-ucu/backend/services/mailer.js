const { Resend } = require('resend');

const CONTACT_TO = process.env.CONTACT_TO || 'nicolasgobbo2007@gmail.com';
const FROM_ADDRESS = process.env.SMTP_FROM || 'BikeShare UCU <onboarding@resend.dev>';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

async function sendEmail({ to, subject, text, html }) {
  const resend = getResend();

  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY no configurada — email no enviado a', to);
    return { sent: false, to };
  }

  await resend.emails.send({
    from: FROM_ADDRESS.includes('@') ? FROM_ADDRESS : 'BikeShare UCU <onboarding@resend.dev>',
    to,
    subject,
    text,
    html,
  });

  return { sent: true, to };
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
  sendEmail,
  sendAdminEmail,
  notifyApplicationApproved,
  notifyApplicationRejected,
};
