const CI_LENGTH = 8;
const PHONE_MIN_LENGTH = 8;
const PHONE_MAX_LENGTH = 9;

function digitsOnly(value, maxLength) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

function parseCi(value) {
  const digits = digitsOnly(value, CI_LENGTH);
  if (!new RegExp(`^\\d{${CI_LENGTH}}$`).test(digits)) {
    return null;
  }
  return digits;
}

function parsePhone(value, { required = false } = {}) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return required ? null : '';
  }
  const digits = digitsOnly(trimmed, PHONE_MAX_LENGTH);
  if (
    digits.length < PHONE_MIN_LENGTH ||
    digits.length > PHONE_MAX_LENGTH ||
    !/^[0-9]+$/.test(digits)
  ) {
    return null;
  }
  return digits;
}

module.exports = {
  CI_LENGTH,
  PHONE_MIN_LENGTH,
  PHONE_MAX_LENGTH,
  parseCi,
  parsePhone,
};
