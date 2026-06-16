require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const {
  DEFAULT_BIKE_CODE,
  buildApproveUrl,
  buildRejectUrl,
  verifyApplicationToken,
  assignBikeFromApplication,
  rejectApplication,
  renderActionPage,
} = require('../services/rentalApproval');
const {
  buildConfirmReturnUrl,
  verifyReturnToken,
  confirmLoanReturn,
} = require('../services/returnConfirmation');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'data', 'rental-requests');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `proof-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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

const CONTACT_TO = process.env.CONTACT_TO || 'nicolasgobbo2007@gmail.com';

function actionErrorPage(err) {
  const messages = {
    NOT_FOUND: 'No encontramos esa solicitud.',
    REJECTED: 'Esta solicitud ya fue rechazada.',
    HAS_BIKE: 'Ese usuario ya tiene una bici asignada.',
    BIKE_UNAVAILABLE: err.message,
    ALREADY_APPROVED: 'Esta solicitud ya fue aprobada; no se puede rechazar.',
    INVALID_STATUS: 'Este préstamo no puede confirmarse como devuelto.',
  };
  return renderActionPage({
    title: 'No se pudo completar',
    message: messages[err.code] || err.message || 'Ocurrió un error.',
    tone: 'error',
  });
}

// GET /api/contact/approve/:id?token=...&confirm=1
router.get('/approve/:id', async (req, res) => {
  const applicationId = Number(req.params.id);
  const { token, confirm } = req.query;

  if (!verifyApplicationToken(applicationId, token)) {
    return res.status(403).send(
      renderActionPage({
        title: 'Enlace inválido',
        message: 'El enlace de aprobación no es válido o expiró.',
        tone: 'error',
      })
    );
  }

  if (confirm !== '1') {
    const approveUrl = `${buildApproveUrl(applicationId)}&confirm=1`;
    const rejectUrl = buildRejectUrl(applicationId);
    return res.send(
      renderActionPage({
        title: 'Aprobar solicitud',
        message: `¿Asignar la bici <strong>${DEFAULT_BIKE_CODE}</strong> a esta solicitud? El usuario la verá en <em>Mi Bici</em>.`,
        tone: 'info',
        actions: [
          { href: approveUrl, label: 'Aprobar y asignar bici', primary: true },
          { href: rejectUrl, label: 'Rechazar solicitud', primary: false },
        ],
      })
    );
  }

  try {
    const result = await assignBikeFromApplication(applicationId);
    const name = result.application.full_name;
    const email = result.application.email;
    const msg = result.alreadyApproved
      ? `La solicitud de <strong>${name}</strong> (${email}) ya estaba aprobada. Bici: <strong>${result.bikeCode}</strong>.`
      : `Bici <strong>${result.bikeCode}</strong> asignada a <strong>${name}</strong> (${email}). El usuario ya puede verla en Mi Bici.`;

    return res.send(
      renderActionPage({
        title: result.alreadyApproved ? 'Ya estaba aprobada' : 'Bici asignada',
        message: msg,
        tone: 'success',
      })
    );
  } catch (err) {
    console.error('[contact/approve]', err.message);
    return res.status(400).send(actionErrorPage(err));
  }
});

// GET /api/contact/reject/:id?token=...&confirm=1
router.get('/reject/:id', async (req, res) => {
  const applicationId = Number(req.params.id);
  const { token, confirm } = req.query;

  if (!verifyApplicationToken(applicationId, token)) {
    return res.status(403).send(
      renderActionPage({
        title: 'Enlace inválido',
        message: 'El enlace no es válido.',
        tone: 'error',
      })
    );
  }

  if (confirm !== '1') {
    const rejectUrl = `${buildRejectUrl(applicationId)}&confirm=1`;
    const approveUrl = buildApproveUrl(applicationId);
    return res.send(
      renderActionPage({
        title: 'Rechazar solicitud',
        message: '¿Confirmás que querés rechazar esta solicitud de alquiler?',
        tone: 'info',
        actions: [
          { href: rejectUrl, label: 'Sí, rechazar', primary: false },
          { href: approveUrl, label: 'Volver — aprobar', primary: true },
        ],
      })
    );
  }

  try {
    const result = await rejectApplication(applicationId);
    const name = result.application.full_name;
    const msg = result.alreadyRejected
      ? `La solicitud de <strong>${name}</strong> ya estaba rechazada.`
      : `Solicitud de <strong>${name}</strong> rechazada.`;

    return res.send(
      renderActionPage({
        title: result.alreadyRejected ? 'Ya estaba rechazada' : 'Solicitud rechazada',
        message: msg,
        tone: 'success',
      })
    );
  } catch (err) {
    console.error('[contact/reject]', err.message);
    return res.status(400).send(actionErrorPage(err));
  }
});

// GET /api/contact/confirm-return/:id?token=...&confirm=1
router.get('/confirm-return/:id', async (req, res) => {
  const loanId = Number(req.params.id);
  const { token, confirm } = req.query;

  if (!verifyReturnToken(loanId, token)) {
    return res.status(403).send(
      renderActionPage({
        title: 'Enlace inválido',
        message: 'El enlace de confirmación no es válido.',
        tone: 'error',
      })
    );
  }

  if (confirm !== '1') {
    const confirmUrl = `${buildConfirmReturnUrl(loanId)}&confirm=1`;
    return res.send(
      renderActionPage({
        title: 'Confirmar devolución',
        message:
          '¿Confirmás que el usuario devolvió la bici? Se cerrará el préstamo y la bici quedará disponible.',
        tone: 'info',
        actions: [{ href: confirmUrl, label: 'Confirmar devolución', primary: true }],
      })
    );
  }

  try {
    const result = await confirmLoanReturn(loanId);
    const msg = result.alreadyReturned
      ? `La devolución de <strong>${result.userName}</strong> (bici <strong>${result.bikeCode}</strong>) ya estaba confirmada.`
      : `Devolución confirmada. Bici <strong>${result.bikeCode}</strong> liberada. Se sumaron ${result.co2Added} kg de CO₂ ahorrado al usuario.`;

    return res.send(
      renderActionPage({
        title: result.alreadyReturned ? 'Ya estaba confirmada' : 'Devolución confirmada',
        message: msg,
        tone: 'success',
      })
    );
  } catch (err) {
    console.error('[contact/confirm-return]', err.message);
    return res.status(400).send(actionErrorPage(err));
  }
});

// GET /api/contact/my-application — estado de la solicitud del formulario
router.get('/my-application', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, ci, email, status, created_at, reviewed_at
       FROM rental_applications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    return res.json(rows[0] || null);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json(null);
    }
    console.error('[contact/my-application]', err.message);
    return res.status(500).json({ error: 'Error obteniendo solicitud' });
  }
});

// POST /api/contact/rental
router.post('/rental', authenticateToken, upload.single('address_proof'), async (req, res) => {
  try {
    const { full_name, ci, email } = req.body;
    if (!full_name?.trim() || !ci?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Nombre, CI y email son obligatorios' });
    }

    const [pending] = await db.query(
      `SELECT id FROM rental_applications WHERE user_id = ? AND status = 'pending' LIMIT 1`,
      [req.user.id]
    );
    if (pending.length > 0) {
      return res.status(409).json({
        error: 'Ya tenés una solicitud pendiente de revisión',
      });
    }

    const [activeLoan] = await db.query(
      `SELECT id FROM loans WHERE user_id = ? AND status IN ('active', 'return_requested') LIMIT 1`,
      [req.user.id]
    );
    if (activeLoan.length > 0) {
      return res.status(409).json({ error: 'Ya tenés una bici asignada' });
    }

    const proofPath = req.file ? req.file.path : null;
    const [result] = await db.query(
      `INSERT INTO rental_applications (user_id, full_name, ci, email, address_proof_path, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, full_name.trim(), ci.trim(), email.trim(), proofPath]
    );
    const applicationId = result.insertId;

    await db.query('UPDATE users SET ci = ?, name = ? WHERE id = ?', [
      ci.trim(),
      full_name.trim(),
      req.user.id,
    ]);

    const subject = `[BikeShare UCU] Solicitud de alquiler - ${full_name.trim()}`;
    const approveUrl = buildApproveUrl(applicationId);
    const rejectUrl = buildRejectUrl(applicationId);

    const body = `
Nueva solicitud de alquiler de bicicleta — BikeShare UCU

Nombre completo: ${full_name.trim()}
CI: ${ci.trim()}
Correo electrónico: ${email.trim()}
ID usuario en sistema: ${req.user.id}
ID solicitud: ${applicationId}

Aprobar y asignar bici (${DEFAULT_BIKE_CODE}):
${approveUrl}

Rechazar solicitud:
${rejectUrl}

Fecha: ${new Date().toLocaleString('es-UY')}
    `.trim();

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;color:#1b263b;max-width:560px;">
        <h2 style="margin:0 0 12px;">Nueva solicitud de alquiler</h2>
        <p style="margin:0 0 16px;">BikeShare UCU</p>
        <table cellpadding="6" cellspacing="0" style="margin-bottom:20px;">
          <tr><td><strong>Nombre</strong></td><td>${full_name.trim()}</td></tr>
          <tr><td><strong>CI</strong></td><td>${ci.trim()}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email.trim()}</td></tr>
          <tr><td><strong>ID solicitud</strong></td><td>${applicationId}</td></tr>
        </table>
        <p style="margin:0 0 12px;">
          <a href="${approveUrl}" style="display:inline-block;padding:14px 22px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;margin-right:10px;">
            Aprobar y asignar ${DEFAULT_BIKE_CODE}
          </a>
          <a href="${rejectUrl}" style="display:inline-block;padding:14px 22px;background:#6c757d;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
            Rechazar
          </a>
        </p>
        <p style="color:#666;font-size:13px;margin-top:18px;">Fecha: ${new Date().toLocaleString('es-UY')}</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'bikeshare@ucu.edu.uy',
      to: CONTACT_TO,
      subject,
      text: body,
      html: htmlBody,
      attachments: req.file
        ? [{ filename: req.file.originalname, path: req.file.path }]
        : [],
    };

    const transport = createTransport();
    let emailSent = false;
    let emailNote = '';

    if (transport) {
      try {
        await transport.sendMail(mailOptions);
        emailSent = true;
        emailNote = `Email enviado a ${CONTACT_TO}`;
      } catch (mailErr) {
        console.error('[contact/rental] sendMail:', mailErr.message);
        emailNote = `No se pudo enviar el email: ${mailErr.message}. Revisá SMTP_PASS en backend/.env`;
      }
    } else {
      const logPath = path.join(uploadDir, `request-${Date.now()}.txt`);
      fs.writeFileSync(
        logPath,
        `TO: ${CONTACT_TO}\nSUBJECT: ${subject}\n\n${body}\n${req.file ? `FILE: ${req.file.path}` : ''}`
      );
      console.log(`[contact/rental] SMTP incompleto. Guardado en ${logPath}`);
      emailNote =
        'SMTP no configurado: completá SMTP_PASS en backend/.env (contraseña de aplicación de Google).';
    }

    return res.json({
      ok: true,
      application_id: applicationId,
      message: emailSent
        ? `Solicitud enviada por email a ${CONTACT_TO}`
        : 'Solicitud guardada en el sistema.',
      contact_email: CONTACT_TO,
      email_sent: emailSent,
      email_note: emailNote,
    });
  } catch (err) {
    console.error('[contact/rental]', err.message);
    return res.status(500).json({ error: 'No se pudo enviar la solicitud' });
  }
});

module.exports = router;
