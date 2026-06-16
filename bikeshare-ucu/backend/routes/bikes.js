require('dotenv').config();
const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Calcula la distancia en km entre dos puntos GPS usando la formula de Haversine.
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // radio de la Tierra en km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/bikes/available
// Devuelve todas las bicis disponibles con su posicion GPS actual.
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, model, status, current_lat, current_lng, last_gps_update
       FROM bikes
       WHERE status = 'available'
       ORDER BY code`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[bikes/available] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo bicis disponibles' });
  }
});

// GET /api/bikes/my
// Devuelve la bici actualmente prestada al usuario (loan status='active'),
// con su posicion GPS y los ultimos 20 puntos para trazar el recorrido.
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [bikeRows] = await db.query(
      `SELECT b.id, b.code, b.model, b.status, b.current_lat, b.current_lng,
              b.last_gps_update, l.id AS loan_id, l.status AS loan_status,
              l.semester, l.approval_date
       FROM loans l
       JOIN bikes b ON b.id = l.bike_id
       WHERE l.user_id = ? AND l.status IN ('active', 'return_requested')
       LIMIT 1`,
      [req.user.id]
    );

    if (bikeRows.length === 0) {
      return res.json(null); // el usuario no tiene una bici prestada activa
    }

    const bike = bikeRows[0];

    const [track] = await db.query(
      `SELECT lat, lng, recorded_at
       FROM gps_logs
       WHERE bike_id = ?
       ORDER BY recorded_at DESC
       LIMIT 20`,
      [bike.id]
    );

    // Devolvemos el recorrido en orden cronologico ascendente.
    bike.track = track.reverse();
    return res.json(bike);
  } catch (err) {
    console.error('[bikes/my] error:', err.message);
    return res.status(500).json({ error: 'Error obteniendo tu bici' });
  }
});

// POST /api/bikes/:id/gps
// Endpoint para el chip GPS. Recibe { lat, lng, bike_id }, actualiza la posicion
// de la bici, inserta un registro en gps_logs y verifica el radio respecto al campus.
router.post('/:id/gps', async (req, res) => {
  try {
    const bikeId = req.body.bike_id || req.params.id;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined || !bikeId) {
      return res.status(400).json({ error: 'Faltan campos lat, lng o bike_id' });
    }

    // Actualizar posicion actual de la bici.
    await db.query(
      `UPDATE bikes
       SET current_lat = ?, current_lng = ?, last_gps_update = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [lat, lng, bikeId]
    );

    // Insertar registro historico.
    await db.query(
      'INSERT INTO gps_logs (bike_id, lat, lng) VALUES (?, ?, ?)',
      [bikeId, lat, lng]
    );

    // Verificar distancia al campus UCU.
    const ucuLat = parseFloat(process.env.UCU_LAT) || -34.8893849;
    const ucuLng = parseFloat(process.env.UCU_LNG) || -56.1585772;
    const maxRadius = parseFloat(process.env.MAX_RADIUS_KM) || 5;
    const distanceKm = haversineKm(parseFloat(lat), parseFloat(lng), ucuLat, ucuLng);
    const outOfRange = distanceKm > maxRadius;

    return res.json({
      ok: true,
      bike_id: Number(bikeId),
      distance_km: Number(distanceKm.toFixed(3)),
      out_of_range: outOfRange,
    });
  } catch (err) {
    console.error('[bikes/:id/gps] error:', err.message);
    return res.status(500).json({ error: 'Error registrando posicion GPS' });
  }
});

module.exports = router;
