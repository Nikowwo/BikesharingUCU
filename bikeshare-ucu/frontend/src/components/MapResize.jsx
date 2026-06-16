import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}
