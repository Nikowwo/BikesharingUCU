export const CI_LENGTH = 8;
export const PHONE_MIN_LENGTH = 8;
export const PHONE_MAX_LENGTH = 9;

export function digitsOnly(value, maxLength) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

export function isValidCi(value) {
  const digits = digitsOnly(value);
  return new RegExp(`^\\d{${CI_LENGTH}}$`).test(digits);
}

export function isValidPhone(value) {
  const digits = digitsOnly(value);
  if (!digits) return true;
  return (
    digits.length >= PHONE_MIN_LENGTH &&
    digits.length <= PHONE_MAX_LENGTH &&
    /^[0-9]+$/.test(digits)
  );
}

export function ciError(value) {
  if (!isValidCi(value)) return `La CI debe tener ${CI_LENGTH} dígitos numéricos`;
  return null;
}

export function phoneError(value) {
  if (!isValidPhone(value)) {
    return `El teléfono debe tener entre ${PHONE_MIN_LENGTH} y ${PHONE_MAX_LENGTH} dígitos numéricos`;
  }
  return null;
}

export function normalizeCi(value) {
  return digitsOnly(value, CI_LENGTH);
}

export function normalizePhone(value) {
  return digitsOnly(value, PHONE_MAX_LENGTH);
}
