const db = require('../db');

async function ensureRentalApplicationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS rental_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      ci VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      days_per_week TINYINT NULL,
      previous_transport VARCHAR(50) NULL,
      address_proof_path VARCHAR(500) NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      rejection_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  const columnMigrations = [
    'ALTER TABLE rental_applications ADD COLUMN rejection_reason TEXT NULL AFTER status',
    'ALTER TABLE rental_applications ADD COLUMN days_per_week TINYINT NULL AFTER email',
    'ALTER TABLE rental_applications ADD COLUMN previous_transport VARCHAR(50) NULL AFTER days_per_week',
  ];

  for (const sql of columnMigrations) {
    try {
      await db.query(sql);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        throw err;
      }
    }
  }
}

module.exports = { ensureRentalApplicationsTable };
