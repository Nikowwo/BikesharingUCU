require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

// Usamos la API basada en promesas en todas las rutas.
const db = pool.promise();

// Verificacion temprana de la conexion (no bloquea el arranque del server).
db.query('SELECT 1')
  .then(() => console.log('[db] Conectado a MySQL correctamente'))
  .catch((err) => console.error('[db] Error conectando a MySQL:', err.message));

module.exports = db;
