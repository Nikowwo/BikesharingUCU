const crypto = require('crypto');
const db = require('../db');
const { ensureBikeInventory } = require('../db/ensureBikeInventory');

const CURRENT_SEMESTER = process.env.CURRENT_SEMESTER || '2026-S1';
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '');

function getApproveSecret() {
  return process.env.APPROVE_SECRET || process.env.JWT_SECRET || 'cambiar-en-produccion';
}

function signApplicationToken(applicationId) {
  return crypto
    .createHmac('sha256', getApproveSecret())
    .update(`rental:${applicationId}`)
    .digest('hex');
}

function verifyApplicationToken(applicationId, token) {
  if (!applicationId || !token) return false;
  const expected = signApplicationToken(applicationId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

function buildApproveUrl(applicationId) {
  const token = signApplicationToken(applicationId);
  return `${API_PUBLIC_URL}/api/contact/approve/${applicationId}?token=${token}`;
}

function buildRejectUrl(applicationId) {
  const token = signApplicationToken(applicationId);
  return `${API_PUBLIC_URL}/api/contact/reject/${applicationId}?token=${token}`;
}

async function assignBikeFromApplication(applicationId) {
  const [apps] = await db.query('SELECT * FROM rental_applications WHERE id = ? LIMIT 1', [
    applicationId,
  ]);
  if (apps.length === 0) {
    const err = new Error('Solicitud no encontrada');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const application = apps[0];
  if (application.status === 'approved') {
    const [loan] = await db.query(
      `SELECT l.id, b.code AS bike_code
       FROM loans l
       JOIN bikes b ON b.id = l.bike_id
       WHERE l.user_id = ? AND l.status IN ('active', 'return_requested')
       ORDER BY l.approval_date DESC
       LIMIT 1`,
      [application.user_id]
    );
    return {
      alreadyApproved: true,
      application,
      bikeCode: loan[0]?.bike_code || null,
      loanId: loan[0]?.id || null,
    };
  }

  if (application.status === 'rejected') {
    const err = new Error('Esta solicitud ya fue rechazada');
    err.code = 'REJECTED';
    throw err;
  }

  const [activeLoan] = await db.query(
    `SELECT id FROM loans WHERE user_id = ? AND status IN ('active', 'return_requested') LIMIT 1`,
    [application.user_id]
  );
  if (activeLoan.length > 0) {
    const err = new Error('El usuario ya tiene una bici asignada');
    err.code = 'HAS_BIKE';
    throw err;
  }

  await ensureBikeInventory();

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [bikes] = await connection.query(
      `SELECT id, code, status FROM bikes WHERE status = 'available' ORDER BY code ASC LIMIT 1 FOR UPDATE`
    );
    const bike = bikes[0];
    if (!bike) {
      const err = new Error('No hay bicis disponibles en el inventario (UCU-001 … UCU-200)');
      err.code = 'BIKE_UNAVAILABLE';
      throw err;
    }

    await connection.query(
      `UPDATE rental_applications SET status = 'approved', reviewed_at = NOW() WHERE id = ?`,
      [applicationId]
    );

    const [loanResult] = await connection.query(
      `INSERT INTO loans (bike_id, user_id, status, semester, approval_date)
       VALUES (?, ?, 'active', ?, NOW())`,
      [bike.id, application.user_id, CURRENT_SEMESTER]
    );

    await connection.query("UPDATE bikes SET status = 'loaned' WHERE id = ?", [bike.id]);

    await connection.commit();

    return {
      alreadyApproved: false,
      application,
      bikeCode: bike.code,
      loanId: loanResult.insertId,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function rejectApplication(applicationId, rejectionReason = null) {
  const [apps] = await db.query('SELECT * FROM rental_applications WHERE id = ? LIMIT 1', [
    applicationId,
  ]);
  if (apps.length === 0) {
    const err = new Error('Solicitud no encontrada');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const application = apps[0];
  if (application.status === 'approved') {
    const err = new Error('No se puede rechazar: la solicitud ya fue aprobada');
    err.code = 'ALREADY_APPROVED';
    throw err;
  }
  if (application.status === 'rejected') {
    return { alreadyRejected: true, application };
  }

  await db.query(
    `UPDATE rental_applications SET status = 'rejected', reviewed_at = NOW(), rejection_reason = ? WHERE id = ?`,
    [rejectionReason?.trim() || null, applicationId]
  );

  const [updated] = await db.query('SELECT * FROM rental_applications WHERE id = ? LIMIT 1', [
    applicationId,
  ]);

  return { alreadyRejected: false, application: updated[0] };
}

function renderRejectFormPage({ applicationId, token, approveUrl, errorMessage = '' }) {
  const actionUrl = `${API_PUBLIC_URL}/api/contact/reject/${applicationId}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rechazar solicitud — BikeShare UCU</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#f8f5f0;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,.08);">
    <h1 style="margin:0 0 12px;color:#1b263b;font-size:1.4rem;">Rechazar solicitud</h1>
    <p style="margin:0 0 20px;color:#333;line-height:1.5;">Indicá el motivo del rechazo. El solicitante recibirá un email con esta información.</p>
    ${errorMessage ? `<p style="color:#c1121f;margin:0 0 12px;">${errorMessage}</p>` : ''}
    <form method="POST" action="${actionUrl}">
      <input type="hidden" name="token" value="${token}" />
      <label for="reason" style="display:block;font-weight:600;margin-bottom:8px;color:#1b263b;">Motivo del rechazo *</label>
      <textarea
        id="reason"
        name="reason"
        required
        rows="4"
        placeholder="Ej.: Documentación incompleta, comprobante de domicilio no válido..."
        style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #ccc;border-radius:8px;font-family:inherit;font-size:1rem;resize:vertical;"
      ></textarea>
      <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:10px;">
        <button type="submit" style="padding:12px 20px;background:#6c757d;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
          Confirmar rechazo
        </button>
        <a href="${approveUrl}" style="display:inline-block;padding:12px 20px;background:#2d6a4f;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Volver — aprobar
        </a>
      </div>
    </form>
  </div>
</body>
</html>`;
}

function renderActionPage({ title, message, tone = 'info', actions = [] }) {
  const colors = {
    success: '#2d6a4f',
    error: '#c1121f',
    info: '#1b263b',
  };
  const accent = colors[tone] || colors.info;

  const actionHtml = actions
    .map(
      (a) =>
        `<a href="${a.href}" style="display:inline-block;margin:8px 8px 0 0;padding:12px 20px;background:${a.primary ? accent : '#6c757d'};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${a.label}</a>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — BikeShare UCU</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#f8f5f0;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,.08);">
    <h1 style="margin:0 0 12px;color:${accent};font-size:1.4rem;">${title}</h1>
    <p style="margin:0;color:#333;line-height:1.5;">${message}</p>
    ${actionHtml ? `<div style="margin-top:20px;">${actionHtml}</div>` : ''}
  </div>
</body>
</html>`;
}

module.exports = {
  API_PUBLIC_URL,
  buildApproveUrl,
  buildRejectUrl,
  verifyApplicationToken,
  assignBikeFromApplication,
  rejectApplication,
  renderActionPage,
  renderRejectFormPage,
};