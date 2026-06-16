require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configuracion de multer para guardar fotos en la carpeta de uploads.
const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// POST /api/reports
// multipart/form-data con { loan_id, description, photos[] }
router.post('/', authenticateToken, upload.array('photos', 10), async (req, res) => {
  try {
    const { loan_id, description } = req.body;
    if (!loan_id || !description) {
      return res.status(400).json({ error: 'Faltan campos loan_id o description' });
    }

    // Verificar que el prestamo exista y pertenezca al usuario.
    const [loanRows] = await db.query('SELECT * FROM loans WHERE id = ?', [loan_id]);
    if (loanRows.length === 0) {
      return res.status(404).json({ error: 'Prestamo no encontrado' });
    }
    if (loanRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'No sos el dueno de este prestamo' });
    }

    // Construir las URLs publicas de las fotos subidas.
    const photoUrls = (req.files || []).map((f) => `/uploads/${f.filename}`);

    const [result] = await db.query(
      `INSERT INTO damage_reports (loan_id, user_id, description, photo_urls, status)
       VALUES (?, ?, ?, ?, 'open')`,
      [loan_id, req.user.id, description, JSON.stringify(photoUrls)]
    );

    const [rows] = await db.query('SELECT * FROM damage_reports WHERE id = ?', [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[reports POST] error:', err.message);
    return res.status(500).json({ error: 'Error creando el reporte' });
  }
});

// GET /api/reports/my
// Reportes del usuario con su estado.
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dr.*, b.code AS bike_code
       FROM damage_reports dr
       JOIN loans l ON l.id = dr.loan_id
       JOIN bikes b ON b.id = l.bike_id
       WHERE dr.user_id = ?
       ORDER BY dr.created_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[reports/my] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo tus reportes' });
  }
});

module.exports = router;
