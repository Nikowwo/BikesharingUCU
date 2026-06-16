const express = require('express');
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de este router requieren autenticacion + rol admin.
router.use(authenticateToken, requireAdmin);

// Estimacion de CO2 ahorrado por semestre:
// 5 km/dia * 120 dias habiles * 0.21 kg CO2/km = 126 kg
const CO2_PER_SEMESTER_KG = 5 * 120 * 0.21;

/* ----------------------------- LOANS ----------------------------- */

// GET /api/admin/loans?status=return_requested
router.get('/loans', async (req, res) => {
  try {
    const { status } = req.query;
    if (!status) {
      return res.status(400).json({ error: 'Query status requerido' });
    }
    const [rows] = await db.query(
      `SELECT l.*, u.name AS user_name, u.email AS user_email,
              u.avatar_url AS user_avatar_url,
              b.code AS bike_code, b.model AS bike_model
       FROM loans l
       JOIN users u ON u.id = l.user_id
       JOIN bikes b ON b.id = l.bike_id
       WHERE l.status = ?
       ORDER BY l.return_request_date ASC`,
      [status]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin/loans] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo prestamos' });
  }
});

// GET /api/admin/loans/pending
router.get('/loans/pending', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, u.name AS user_name, u.email AS user_email,
              u.avatar_url AS user_avatar_url,
              b.code AS bike_code, b.model AS bike_model
       FROM loans l
       JOIN users u ON u.id = l.user_id
       JOIN bikes b ON b.id = l.bike_id
       WHERE l.status = 'pending'
       ORDER BY l.request_date ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin/loans/pending] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo prestamos pendientes' });
  }
});

// POST /api/admin/loans/:id/approve
// Body opcional: { admin_notes }
router.post('/loans/:id/approve', async (req, res) => {
  try {
    const loanId = req.params.id;
    const { admin_notes } = req.body;

    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Prestamo no encontrado' });
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ error: 'El prestamo no esta pendiente' });
    }

    await db.query(
      `UPDATE loans
       SET status = 'active', approval_date = CURRENT_TIMESTAMP, admin_notes = ?
       WHERE id = ?`,
      [admin_notes || null, loanId]
    );
    await db.query("UPDATE bikes SET status = 'loaned' WHERE id = ?", [rows[0].bike_id]);

    const [updated] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    return res.json(updated[0]);
  } catch (err) {
    console.error('[admin/loans/:id/approve] error:', err.message);
    return res.status(500).json({ error: 'Error aprobando el prestamo' });
  }
});

// POST /api/admin/loans/:id/reject
// Body: { admin_notes }
router.post('/loans/:id/reject', async (req, res) => {
  try {
    const loanId = req.params.id;
    const { admin_notes } = req.body;

    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Prestamo no encontrado' });

    await db.query(
      `UPDATE loans SET status = 'rejected', admin_notes = ? WHERE id = ?`,
      [admin_notes || null, loanId]
    );

    const [updated] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    return res.json(updated[0]);
  } catch (err) {
    console.error('[admin/loans/:id/reject] error:', err.message);
    return res.status(500).json({ error: 'Error rechazando el prestamo' });
  }
});

// POST /api/admin/loans/:id/confirm-return
// Cierra el prestamo, libera la bici y suma el CO2 ahorrado al usuario.
router.post('/loans/:id/confirm-return', async (req, res) => {
  try {
    const loanId = req.params.id;

    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Prestamo no encontrado' });
    const loan = rows[0];

    if (!['active', 'return_requested'].includes(loan.status)) {
      return res.status(409).json({ error: 'El prestamo no puede confirmarse como devuelto' });
    }

    await db.query(
      `UPDATE loans
       SET status = 'returned', return_confirmed_date = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [loanId]
    );
    await db.query("UPDATE bikes SET status = 'available' WHERE id = ?", [loan.bike_id]);

    // Sumar CO2 ahorrado estimado al usuario.
    await db.query(
      'UPDATE users SET co2_saved_kg = co2_saved_kg + ? WHERE id = ?',
      [CO2_PER_SEMESTER_KG, loan.user_id]
    );

    const [updated] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    return res.json({ ...updated[0], co2_added_kg: CO2_PER_SEMESTER_KG });
  } catch (err) {
    console.error('[admin/loans/:id/confirm-return] error:', err.message);
    return res.status(500).json({ error: 'Error confirmando la devolucion' });
  }
});

/* ----------------------------- BIKES ----------------------------- */

// GET /api/admin/bikes
// Todas las bicis con su prestamo activo (si lo tienen) y datos del usuario.
router.get('/bikes', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*,
              l.id AS active_loan_id, l.status AS loan_status, l.semester,
              u.id AS borrower_id, u.name AS borrower_name, u.email AS borrower_email
       FROM bikes b
       LEFT JOIN loans l
         ON l.bike_id = b.id AND l.status IN ('active', 'return_requested')
       LEFT JOIN users u ON u.id = l.user_id
       ORDER BY b.code`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin/bikes GET] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo las bicis' });
  }
});

// POST /api/admin/bikes
// Body: { code, model }
router.post('/bikes', async (req, res) => {
  try {
    const { code, model } = req.body;
    if (!code) return res.status(400).json({ error: 'Falta el campo code' });

    const [result] = await db.query(
      "INSERT INTO bikes (code, model, status) VALUES (?, ?, 'available')",
      [code, model || null]
    );
    const [rows] = await db.query('SELECT * FROM bikes WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una bici con ese code' });
    }
    console.error('[admin/bikes POST] error:', err.message);
    return res.status(500).json({ error: 'Error creando la bici' });
  }
});

// PATCH /api/admin/bikes/:id/status
// Body: { status } -> available | maintenance
router.patch('/bikes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'status debe ser available o maintenance' });
    }

    const [result] = await db.query('UPDATE bikes SET status = ? WHERE id = ?', [
      status,
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Bici no encontrada' });
    }

    const [rows] = await db.query('SELECT * FROM bikes WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('[admin/bikes/:id/status] error:', err.message);
    return res.status(500).json({ error: 'Error actualizando el estado de la bici' });
  }
});

/* ---------------------------- REPORTS ---------------------------- */

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dr.*,
              u.name AS user_name, u.email AS user_email,
              l.semester, b.code AS bike_code, b.model AS bike_model
       FROM damage_reports dr
       JOIN users u ON u.id = dr.user_id
       JOIN loans l ON l.id = dr.loan_id
       JOIN bikes b ON b.id = l.bike_id
       ORDER BY dr.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin/reports GET] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo los reportes' });
  }
});

// PATCH /api/admin/reports/:id
// Body: { status, admin_notes }
router.patch('/reports/:id', async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (status && !['open', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'status invalido' });
    }

    const [result] = await db.query(
      `UPDATE damage_reports
       SET status = COALESCE(?, status), admin_notes = ?
       WHERE id = ?`,
      [status || null, admin_notes || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    const [rows] = await db.query('SELECT * FROM damage_reports WHERE id = ?', [req.params.id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('[admin/reports/:id] error:', err.message);
    return res.status(500).json({ error: 'Error actualizando el reporte' });
  }
});

/* ----------------------------- USERS ----------------------------- */

// GET /api/admin/users
// Lista de usuarios con sus prestamos activos (si los tienen).
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.role, u.co2_saved_kg, u.created_at,
              l.id AS active_loan_id, l.status AS active_loan_status,
              b.code AS active_bike_code
       FROM users u
       LEFT JOIN loans l
         ON l.user_id = u.id AND l.status IN ('active', 'return_requested')
       LEFT JOIN bikes b ON b.id = l.bike_id
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[admin/users GET] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo los usuarios' });
  }
});

// PATCH /api/admin/users/:id/role
// Body: { role } -> user | admin
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role debe ser user o admin' });
    }

    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [
      role,
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [rows] = await db.query(
      'SELECT id, name, email, avatar_url, role, co2_saved_kg FROM users WHERE id = ?',
      [req.params.id]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error('[admin/users/:id/role] error:', err.message);
    return res.status(500).json({ error: 'Error actualizando el rol del usuario' });
  }
});

module.exports = router;
