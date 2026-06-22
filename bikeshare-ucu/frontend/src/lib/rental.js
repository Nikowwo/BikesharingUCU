/** Duración del alquiler en días (semestre) */
export const RENTAL_DAYS = 150;

export function parseDbDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && !value.includes('T')) {
    const [datePart, timePart] = value.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    if (timePart) {
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds || 0);
    }
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function rentalEndDate(approvalDate) {
  const start = parseDbDate(approvalDate);
  if (!start || Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + RENTAL_DAYS);
  return end;
}

export function daysRemaining(approvalDate) {
  const start = parseDbDate(approvalDate);
  if (!start || Number.isNaN(start.getTime())) return RENTAL_DAYS;
  const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, RENTAL_DAYS - elapsed);
}
