const crypto = require('crypto');
const db = require('../db');

const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '');
const CO2_PER_SEMESTER_KG = 5 * 120 * 0.21;

function getSecret() {
  return process.env.APPROVE_SECRET || process.env.JWT_SECRET || 'cambiar-en-produccion';
}

function signReturnToken(loanId) {
  return crypto.createHmac('sha256', getSecret()).update(`return:${loanId}`).digest('hex');
}

function verifyReturnToken(loanId, token) {
  if (!loanId || !token) return false;
  const expected = signReturnToken(loanId);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

function buildConfirmReturnUrl(loanId) {
  const token = signReturnToken(loanId);
  return `${API_PUBLIC_URL}/api/contact/confirm-return/${loanId}?token=${token}`;
}

async function confirmLoanReturn(loanId) {
  const [rows] = await db.query(
    `SELECT l.*, u.name AS user_name, u.email AS user_email, b.code AS bike_code
     FROM loans l
     JOIN users u ON u.id = l.user_id
     JOIN bikes b ON b.id = l.bike_id
     WHERE l.id = ?`,
    [loanId]
  );

  if (rows.length === 0) {
    const err = new Error('Préstamo no encontrado');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const loan = rows[0];

  if (loan.status === 'returned') {
    return {
      alreadyReturned: true,
      loan,
      bikeCode: loan.bike_code,
      userName: loan.user_name,
      co2Added: 0,
    };
  }

  if (!['active', 'return_requested'].includes(loan.status)) {
    const err = new Error('Este préstamo no puede confirmarse como devuelto');
    err.code = 'INVALID_STATUS';
    throw err;
  }

  await db.query(
    `UPDATE loans
     SET status = 'returned', return_confirmed_date = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [loanId]
  );
  await db.query("UPDATE bikes SET status = 'available' WHERE id = ?", [loan.bike_id]);
  await db.query('UPDATE users SET co2_saved_kg = co2_saved_kg + ? WHERE id = ?', [
    CO2_PER_SEMESTER_KG,
    loan.user_id,
  ]);

  return {
    alreadyReturned: false,
    loan,
    bikeCode: loan.bike_code,
    userName: loan.user_name,
    co2Added: CO2_PER_SEMESTER_KG,
  };
}

module.exports = {
  buildConfirmReturnUrl,
  verifyReturnToken,
  confirmLoanReturn,
};
