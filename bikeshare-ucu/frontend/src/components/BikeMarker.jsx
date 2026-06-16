import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

function createBikeIcon() {
  return L.divIcon({
    className: 'bike-marker-icon',
    html: `<div style="
      background:#1B4332;
      width:36px;height:36px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      overflow:hidden;
    "><img src="/images/logo-mobile.png" alt="" style="width:26px;height:26px;object-fit:contain;" /></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function formatGpsTime(iso) {
  if (!iso) return 'Sin datos';
  return new Date(iso).toLocaleString('es-UY', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const bikeIcon = createBikeIcon();

export default function BikeMarker({ lat, lng, lastGpsUpdate }) {
  if (lat == null || lng == null) return null;

  return (
    <Marker position={[parseFloat(lat), parseFloat(lng)]} icon={bikeIcon}>
      <Tooltip direction="top" offset={[0, -20]}>
        Última actualización: {formatGpsTime(lastGpsUpdate)}
      </Tooltip>
      <Popup>
        <strong>Tu bici</strong>
        <br />
        GPS: {formatGpsTime(lastGpsUpdate)}
      </Popup>
    </Marker>
  );
}
