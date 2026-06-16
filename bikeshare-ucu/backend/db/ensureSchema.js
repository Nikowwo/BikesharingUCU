const db = require('../db');

async function ensureRentalApplicationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS rental_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      ci VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      address_proof_path VARCHAR(500) NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

module.exports = { ensureRentalApplicationsTable };
