require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    phone: user.phone,
    ci: user.ci,
    role: user.role,
    co2_saved_kg: user.co2_saved_kg,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, ci, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, ci, phone, role)
       VALUES (?, ?, ?, ?, ?, 'user')`,
      [name.trim(), email.trim(), hash, ci?.trim() || null, phone?.trim() || null]
    );

    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('[auth/register]', err.message);
    return res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim()]);
    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('[auth/login]', err.message);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Falta el campo credential' });
  }

  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('TU_CLIENT')) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID no configurado en backend/.env' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('[auth/google] verify:', err.message);
    return res.status(401).json({ error: 'No se pudo verificar el token de Google' });
  }

  const googleId = payload.sub;
  const name = payload.name || '';
  const email = payload.email || '';
  const avatarUrl = payload.picture || null;

  try {
    let [rows] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    let user = rows[0];

    if (!user && email) {
      [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      user = rows[0];
      if (user) {
        await db.query(
          'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), name = COALESCE(NULLIF(name, ""), ?) WHERE id = ?',
          [googleId, avatarUrl, name, user.id]
        );
        [rows] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
        user = rows[0];
      }
    }

    if (!user) {
      const [result] = await db.query(
        'INSERT INTO users (google_id, name, email, avatar_url, role) VALUES (?, ?, ?, ?, ?)',
        [googleId, name, email, avatarUrl, 'user']
      );
      [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = rows[0];
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('[auth/google] db:', err.message);
    return res.status(503).json({
      error: 'Error de base de datos. Ejecutá database/migration_v2.sql si agregaste login por email.',
      detail: err.message,
    });
  }
});

module.exports = router;
