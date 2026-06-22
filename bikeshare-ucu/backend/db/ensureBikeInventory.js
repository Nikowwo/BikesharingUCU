const db = require('../db');

const BIKE_INVENTORY_SIZE = 200;
const BIKE_MODEL = 'Mountain Bike UCU';

function formatBikeCode(n) {
  return `UCU-${String(n).padStart(3, '0')}`;
}

/**
 * Crea UCU-001 … UCU-200 si no existen. No modifica bicis ya cargadas.
 */
async function ensureBikeInventory() {
  const values = [];
  const placeholders = [];

  for (let n = 1; n <= BIKE_INVENTORY_SIZE; n += 1) {
    values.push(formatBikeCode(n), BIKE_MODEL);
    placeholders.push('(?, ?, \'available\')');
  }

  await db.query(
    `INSERT IGNORE INTO bikes (code, model, status) VALUES ${placeholders.join(', ')}`,
    values
  );
}

async function countAvailableBikes() {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS total FROM bikes WHERE status = 'available'"
  );
  return rows[0]?.total ?? 0;
}

module.exports = {
  BIKE_INVENTORY_SIZE,
  BIKE_MODEL,
  formatBikeCode,
  ensureBikeInventory,
  countAvailableBikes,
};
