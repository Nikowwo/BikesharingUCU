const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const USER_FIELDS =
  'id, name, email, avatar_url, phone, ci, role, co2_saved_kg, created_at';

// GET /api/users/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json(rows[0]);
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
    return res.json(rows[0]);
  } catch (err) {
    console.error('[users/me PATCH] error:', err.message);
    return res.status(500).json({ error: 'Error actualizando el perfil' });
  }
});

module.exports = router;
