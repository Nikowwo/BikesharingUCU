const { RENTAL_DAYS } = require('../constants/rental');

/** kg CO₂ por km recorrido (pasajero) — estimaciones para comparación con bici (0 emisiones directas) */
const EMISSION_KG_PER_KM = {
  auto: 0.192,
  motocicleta: 0.113,
  omnibus: 0.089,
  taxi_uber: 0.192,
};

const TRANSPORT_LABELS = {
  caminando: 'A pie',
  omnibus: 'Ómnibus',
  auto: 'Auto particular',
  taxi_uber: 'Taxi / Uber',
  motocicleta: 'Motocicleta',
  monopatin: 'Monopatín',
  otro: 'Otro',
};

const CO2_ELIGIBLE_TRANSPORTS = new Set(['omnibus', 'taxi_uber', 'auto', 'motocicleta']);

function parseDbDate(value) {
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

function daysSinceApproval(approvalDate) {
  const start = parseDbDate(approvalDate);
  if (!start || Number.isNaN(start.getTime())) return 0;
  const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(elapsed, 0), RENTAL_DAYS);
}

/**
 * Estima CO₂ no emitido al usar bici en lugar del transporte anterior.
 * distance_km = ida (un tramo); se asume ida y vuelta por día de facultad.
 */
function calculateCo2Savings({ previous_transport, days_per_week, distance_km, approval_date, is_electric }) {
  const transport = previous_transport?.trim();
  const daysPerWeek = Number(days_per_week);
  const distanceKm = Number(distance_km);
  const electric = is_electric === true || is_electric === 1 || is_electric === '1';

  if (electric) {
    return {
      applies: false,
      saved_kg: 0,
      is_electric: true,
      previous_transport: transport || null,
      previous_transport_label: TRANSPORT_LABELS[transport] || null,
    };
  }

  if (
    !transport ||
    !CO2_ELIGIBLE_TRANSPORTS.has(transport) ||
    !Number.isFinite(daysPerWeek) ||
    daysPerWeek < 1 ||
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0
  ) {
    return {
      applies: false,
      saved_kg: 0,
      previous_transport: transport || null,
      previous_transport_label: TRANSPORT_LABELS[transport] || null,
    };
  }

  const emissionFactor = EMISSION_KG_PER_KM[transport];
  const daysActive = daysSinceApproval(approval_date);
  const tripDays = (daysActive / 7) * daysPerWeek;
  const totalKm = tripDays * distanceKm * 2;
  const savedKg = totalKm * emissionFactor;

  return {
    applies: true,
    saved_kg: Math.round(savedKg * 10) / 10,
    previous_transport: transport,
    previous_transport_label: TRANSPORT_LABELS[transport],
    days_per_week: daysPerWeek,
    distance_km: distanceKm,
    days_active: daysActive,
    trip_days_estimated: Math.round(tripDays * 10) / 10,
    total_km_estimated: Math.round(totalKm * 10) / 10,
    emission_factor: emissionFactor,
  };
}

module.exports = {
  calculateCo2Savings,
  CO2_ELIGIBLE_TRANSPORTS,
  TRANSPORT_LABELS,
};
