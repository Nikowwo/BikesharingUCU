const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendAdminEmail } = require('../services/mailer');
const { buildConfirmReturnUrl } = require('../services/returnConfirmation');

const router = express.Router();

// GET /api/loans/my
// Historial de prestamos del usuario con datos de la bici.
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, b.code AS bike_code, b.model AS bike_model
       FROM loans l
       JOIN bikes b ON b.id = l.bike_id
       WHERE l.user_id = ?
       ORDER BY l.request_date DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[loans/my] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo tus prestamos' });
  }
});

// POST /api/loans/request
// Body: { bike_id, semester }
// Crea un prestamo en estado 'pending' tras validar reglas.
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { bike_id, semester } = req.body;
    if (!bike_id || !semester) {
      return res.status(400).json({ error: 'Faltan campos bike_id o semester' });
    }

    // El usuario no puede tener ya un prestamo activo o pendiente.
    const [existing] = await db.query(
      `SELECT id FROM loans
       WHERE user_id = ? AND status IN ('pending', 'active', 'return_requested')
       LIMIT 1`,
      [req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya tenes un prestamo activo o pendiente' });
    }

    // La bici debe estar disponible.
    const [bikeRows] = await db.query('SELECT id, status FROM bikes WHERE id = ?', [bike_id]);
    if (bikeRows.length === 0) {
      return res.status(404).json({ error: 'Bici no encontrada' });
    }
    if (bikeRows[0].status !== 'available') {
      return res.status(409).json({ error: 'La bici no esta disponible' });
    }

    // Crear loan pendiente. NO se cambia el estado de la bici hasta la aprobacion.
    const [result] = await db.query(
      `INSERT INTO loans (bike_id, user_id, status, semester)
       VALUES (?, ?, 'pending', ?)`,
      [bike_id, req.user.id, semester]
    );

    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[loans/request] error:', err.message);
    return res.status(500).json({ error: 'Error creando el prestamo' });
  }
});

// POST /api/loans/:id/request-return
// Solo el dueno del prestamo. Cambia el estado a 'return_requested'.
router.post('/:id/request-return', authenticateToken, async (req, res) => {
  try {
    const loanId = req.params.id;
    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prestamo no encontrado' });
    }

    const loan = rows[0];
    if (loan.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No sos el dueno de este prestamo' });
    }
    if (loan.status !== 'active') {
      return res.status(409).json({ error: 'El prestamo no esta activo' });
    }

    await db.query(
      `UPDATE loans
       SET status = 'return_requested', return_request_date = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [loanId]
    );

    const [updated] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);

    const [details] = await db.query(
      `SELECT l.id, l.semester, l.return_request_date,
              u.name AS user_name, u.email AS user_email,
              b.code AS bike_code, b.model AS bike_model
       FROM loans l
       JOIN users u ON u.id = l.user_id
       JOIN bikes b ON b.id = l.bike_id
       WHERE l.id = ?`,
      [loanId]
    );
    const info = details[0];
    const requestedAt = info.return_request_date
      ? new Date(info.return_request_date).toLocaleString('es-UY')
      : new Date().toLocaleString('es-UY');

    const confirmUrl = buildConfirmReturnUrl(info.id);
    const subject = `[BikeShare UCU] Devolución solicitada - ${info.bike_code}`;
    const text = `
Solicitud de devolución de bicicleta — BikeShare UCU

Usuario: ${info.user_name}
Email: ${info.user_email}
Bici: ${info.bike_code} (${info.bike_model || 'sin modelo'})
Semestre: ${info.semester}
ID préstamo: ${info.id}
Fecha solicitud: ${requestedAt}

Confirmar devolución:
${confirmUrl}
    `.trim();

    const html = `
      <div style="font-family:Arial,sans-serif;color:#1b263b;max-width:560px;">
        <h2 style="margin:0 0 12px;">Solicitud de devolución</h2>
        <p style="margin:0 0 16px;">BikeShare UCU</p>
        <table cellpadding="6" cellspacing="0" style="margin-bottom:16px;">
          <tr><td><strong>Usuario</strong></td><td>${info.user_name}</td></tr>
          <tr><td><strong>Email</strong></td><td>${info.user_email}</td></tr>
          <tr><td><strong>Bici</strong></td><td>${info.bike_code}</td></tr>
          <tr><td><strong>Semestre</strong></td><td>${info.semester}</td></tr>
          <tr><td><strong>ID préstamo</strong></td><td>${info.id}</td></tr>
          <tr><td><strong>Fecha</strong></td><td>${requestedAt}</td></tr>
        </table>
        <p style="margin:0 0 12px;">
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 22px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
            Confirmar devolución
          </a>
        </p>
      </div>
    `;

    let emailSent = false;
    try {
      const mail = await sendAdminEmail({ subject, text, html });
      emailSent = mail.sent;
    } catch (mailErr) {
      console.error('[loans/request-return] sendMail:', mailErr.message);
    }

    return res.json({ ...updated[0], email_sent: emailSent });
  } catch (err) {
    console.error('[loans/:id/request-return] error:', err.message);
    return res.status(500).json({ error: 'Error solicitando la devolucion' });
  }
});

module.exports = router;
