/** Duración máxima estimada del alquiler (CO₂ y referencias legacy) */
export const RENTAL_DAYS = 150;

const DAY_MS = 1000 * 60 * 60 * 24;

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

function firstSemesterWindow(year) {
  return {
    windowStart: new Date(year, 5, 29),
    windowEnd: new Date(year, 6, 3),
  };
}

function secondSemesterWindow(year) {
  return {
    windowStart: new Date(year, 10, 15),
    windowEnd: new Date(year, 10, 20),
  };
}

/** Alquiler antes de julio → 29 jun – 3 jul. Julio en adelante → 15 – 20 nov. */
export function getReturnWindow(approvalDate) {
  const start = parseDbDate(approvalDate);
  if (!start || Number.isNaN(start.getTime())) return null;

  const beforeJuly = start.getMonth() < 6;
  let year = start.getFullYear();

  if (beforeJuly) {
    return { ...firstSemesterWindow(year), period: 'first' };
  }

  let window = secondSemesterWindow(year);
  if (start > window.windowEnd) {
    year += 1;
    window = secondSemesterWindow(year);
  }

  return { ...window, period: 'second' };
}

export function formatReturnWindowRange(approvalDate) {
  const window = getReturnWindow(approvalDate);
  if (!window) return null;

  const fmt = (date) =>
    date.toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });

  return `entre el ${fmt(window.windowStart)} y el ${fmt(window.windowEnd)} inclusive`;
}

/** Días hasta el último día del período de devolución (0 si ya pasó). */
export function daysRemaining(approvalDate) {
  const window = getReturnWindow(approvalDate);
  if (!window) return 0;

  const remainingMs = window.windowEnd.getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / DAY_MS));
}

/** @deprecated Usar getReturnWindow */
export function rentalEndDate(approvalDate) {
  return getReturnWindow(approvalDate)?.windowEnd ?? null;
}
