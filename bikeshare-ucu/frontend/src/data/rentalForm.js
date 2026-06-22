export const DAYS_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export const PREVIOUS_TRANSPORT_OPTIONS = [
  { value: 'caminando', label: 'A pie' },
  { value: 'omnibus', label: 'Ómnibus' },
  { value: 'auto', label: 'Auto particular' },
  { value: 'taxi_uber', label: 'Taxi / Uber' },
  { value: 'motocicleta', label: 'Motocicleta' },
  { value: 'monopatin', label: 'Monopatín' },
  { value: 'otro', label: 'Otro' },
];

export const MOTORIZED_TRANSPORT_VALUES = ['omnibus', 'auto', 'taxi_uber', 'motocicleta'];

export function isMotorizedTransport(value) {
  return MOTORIZED_TRANSPORT_VALUES.includes(value);
}
