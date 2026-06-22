#!/usr/bin/env node
/**
 * Carga UCU-001 … UCU-200 en la tabla bikes.
 * Uso: node backend/scripts/seed-bikes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ensureBikeInventory, BIKE_INVENTORY_SIZE } = require('../db/ensureBikeInventory');

ensureBikeInventory()
  .then(async () => {
    const db = require('../db');
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM bikes');
    console.log(`Inventario listo: ${rows[0].total} bicis (esperado hasta ${BIKE_INVENTORY_SIZE}).`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding bikes:', err.message);
    process.exit(1);
  });
