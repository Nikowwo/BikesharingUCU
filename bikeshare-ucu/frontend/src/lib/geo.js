// Campus UCU — Av. 8 de Octubre (Google Maps)
export const UCU_LAT = -34.8893849;
export const UCU_LNG = -56.1585772;
export const UCU_MAP_ZOOM = 17;
export const MAX_RADIUS_KM = 5;
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isOutOfRange(lat, lng) {
  if (lat == null || lng == null) return false;
  return haversineKm(parseFloat(lat), parseFloat(lng), UCU_LAT, UCU_LNG) > MAX_RADIUS_KM;
}
