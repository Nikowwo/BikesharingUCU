require('dotenv').config();
const jwt = require('jsonwebtoken');

// Verifica el JWT propio enviado en el header Authorization: Bearer <token>.
// Si es valido, adjunta el payload decodificado en req.user.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no provisto' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalido o expirado' });
    }
    req.user = payload; // { id, name, email, role, ... }
    next();
  });
}

// Requiere que el usuario autenticado tenga role 'admin'.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
