const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { calculateCo2Savings } = require('../services/co2Calculator');

const router = express.Router();

const USER_FIELDS =
  'id, name, email, avatar_url, phone, ci, role, co2_saved_kg, created_at';

async function attachCo2Savings(user) {
  const [rows] = await db.query(
    `SELECT l.approval_date, ra.days_per_week, ra.previous_transport, ra.distance_km, ra.is_electric
     FROM loans l
     JOIN rental_applications ra
       ON ra.user_id = l.user_id AND ra.status = 'approved'
     WHERE l.user_id = ? AND l.status IN ('active', 'return_requested')
     ORDER BY l.approval_date DESC, ra.reviewed_at DESC
     LIMIT 1`,
    [user.id]
  );

  user.co2_savings = rows[0]
    ? calculateCo2Savings({
        previous_transport: rows[0].previous_transport,
        days_per_week: rows[0].days_per_week,
        distance_km: rows[0].distance_km,
        approval_date: rows[0].approval_date,
        is_electric: rows[0].is_electric,
      })
    : { applies: false, saved_kg: 0 };

  return user;
}

// GET /api/users/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json(await attachCo2Savings(rows[0]));
  } catch (err) {
    console.error('[users/me] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo el usuario' });
  }
});

// PATCH /api/users/me
router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, ci } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (email !== undefined) {
      const [dup] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [
        email.trim(),
        req.user.id,
      ]);
      if (dup.length > 0) {
        return res.status(409).json({ error: 'Ese email ya está en uso' });
      }
      updates.push('email = ?');
      values.push(email.trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone?.trim() || null);
    }
    if (ci !== undefined) {
      updates.push('ci = ?');
      values.push(ci?.trim() || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [
      req.user.id,
    ]);
    return res.json(await attachCo2Savings(rows[0]));
  } catch (err) {
    console.error('[users/me PATCH] error:', err.message);
    return res.status(500).json({ error: 'Error actualizando el perfil' });
  }
});

module.exports = router;
