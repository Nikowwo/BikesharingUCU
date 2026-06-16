import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import BikeMarker from '../components/BikeMarker';
import MapResize from '../components/MapResize';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { UCU_LAT, UCU_LNG, UCU_MAP_ZOOM, MAX_RADIUS_KM, isOutOfRange } from '../lib/geo';
import { daysRemaining, rentalEndDate } from '../lib/rental';

import 'leaflet/dist/leaflet.css';

const campusIcon = L.divIcon({
  className: '',
  html: `<div style="background:#52B788;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;border:2px solid white;">🏛️ UCU</div>`,
  iconAnchor: [30, 15],
});

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function isGpsStale(lastUpdate) {
  if (!lastUpdate) return true;
  return Date.now() - new Date(lastUpdate).getTime() > 60 * 60 * 1000;
}

export default function MyBikePage() {
  const { user, loading } = useAuth();
  const [bike, setBike] = useState(undefined);
  const [application, setApplication] = useState(null);
  const [fetching, setFetching] = useState(true);

  const loadBike = useCallback(async () => {
    try {
      const [bikeRes, appRes] = await Promise.all([
        api.get('/bikes/my'),
        api.get('/contact/my-application'),
      ]);
      setBike(bikeRes.data);
      setApplication(appRes.data);
    } catch {
      toast.error('Error cargando tu bici');
      setBike(null);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    setFetching(true);
    setBike(undefined);
    setApplication(null);
    loadBike();

    const interval = setInterval(loadBike, 30000);
    return () => clearInterval(interval);
  }, [user, loadBike]);

  if (!loading && !user) return <Navigate to="/" replace />;

  if (loading || fetching) {
    return (
      <AppLayout className="page-bg-bikes">
        <main className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-12">
          <div
            className="bg-ucu-card rounded-2xl p-10 max-w-md w-full shadow-xl animate-pulse"
            aria-hidden="true"
          >
            <div className="h-7 bg-gray-200 rounded-lg w-2/3 mx-auto mb-4" />
            <div className="space-y-2 mb-8">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto" />
            </div>
            <div className="h-10 bg-gray-200 rounded-md w-36 mx-auto" />
          </div>
        </main>
      </AppLayout>
    );
  }

  const pendingApp = application?.status === 'pending';

  if (!bike) {
    return (
      <AppLayout className="page-bg-bikes">
        <main className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-12">
          <div className="bg-ucu-card rounded-2xl p-10 max-w-md text-center shadow-xl">
            <h1 className="font-syne font-bold text-2xl text-ucu-green mb-4">
              {pendingApp ? 'Solicitud en revisión' : 'Sin bici activa'}
            </h1>
            <p className="text-gray-600 mb-6">
              {pendingApp
                ? `Tu solicitud fue enviada el ${formatDate(application.created_at)}. Bedelías la revisará y te asignará una bici.`
                : 'Completá el formulario al final de Inicio para solicitar tu bici.'}
            </p>
            <Link to="/home" className="btn-navy inline-block">
              Ir a Inicio
            </Link>
          </div>
        </main>
      </AppLayout>
    );
  }

  const daysLeft = daysRemaining(bike.approval_date);
  const endDate = rentalEndDate(bike.approval_date);
  const outOfRange =
    bike.current_lat != null &&
    bike.current_lng != null &&
    isOutOfRange(bike.current_lat, bike.current_lng);
  const gpsStale = isGpsStale(bike.last_gps_update);
  const returnInProgress = bike.loan_status === 'return_requested';

  return (
    <AppLayout className="page-bg-bikes">
      <main className="px-4 py-10 min-h-[calc(100vh-7rem)]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 lg:items-stretch">
          <div className="bg-ucu-card rounded-2xl p-6 shadow-xl flex flex-col h-full">
            <h2 className="font-syne font-bold text-xl text-ucu-navy text-center mb-4 shrink-0">
              Encontrá tu bici
            </h2>
            <div className="bike-map-panel">
              <div className="bike-map-wrap">
                <MapContainer
                  center={[UCU_LAT, UCU_LNG]}
                  zoom={UCU_MAP_ZOOM}
                  className="h-full w-full"
                  scrollWheelZoom
                >
                  <MapResize />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Circle
                  center={[UCU_LAT, UCU_LNG]}
                  radius={MAX_RADIUS_KM * 1000}
                  pathOptions={{ color: '#52B788', fillColor: '#52B788', fillOpacity: 0.15 }}
                />
                <Marker position={[UCU_LAT, UCU_LNG]} icon={campusIcon}>
                  <Popup>Universidad Católica del Uruguay</Popup>
                </Marker>
                <BikeMarker
                  lat={bike.current_lat}
                  lng={bike.current_lng}
                  lastGpsUpdate={bike.last_gps_update}
                />
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-ucu-card rounded-2xl p-8 shadow-xl">
              <h3 className="font-syne font-bold text-lg text-ucu-navy mb-4">Tu bicicleta</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Código</dt>
                  <dd className="font-bold text-ucu-green">{bike.code}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Modelo</dt>
                  <dd className="font-medium">{bike.model || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Semestre</dt>
                  <dd>{bike.semester}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Aprobación</dt>
                  <dd>{formatDate(bike.approval_date)}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-gray-500">Estado</dt>
                  <dd>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {returnInProgress ? 'Devolución solicitada' : 'Activo'}
                    </span>
                  </dd>
                </div>
              </dl>
              {gpsStale && (
                <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                  <Radio className="w-4 h-4" />
                  GPS sin señal reciente
                </div>
              )}
              {outOfRange && (
                <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Fuera del rango de 5 km del campus
                </div>
              )}
            </div>

            <div className="bg-ucu-card rounded-2xl p-10 shadow-xl flex flex-col items-center justify-center text-center gap-2">
              <p className="font-syne font-bold text-2xl md:text-3xl text-ucu-navy leading-snug">
                Faltan {daysLeft} días de tu alquiler
              </p>
              {endDate && (
                <p className="text-sm text-gray-500">
                  Vence el {endDate.toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            <div className="bg-ucu-card rounded-2xl p-8 shadow-xl">
              <h3 className="font-syne font-bold text-lg text-ucu-navy mb-3">
                ¿Querés devolver la bici?
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Si querés devolver tu bicicleta alquilada, clickeá{' '}
                <button
                  type="button"
                  disabled={returnInProgress}
                  onClick={async () => {
                    try {
                      const { data } = await api.post(`/loans/${bike.loan_id}/request-return`);
                      toast.success(
                        data.email_sent
                          ? 'Solicitud enviada por email a Bedelías'
                          : 'Solicitud registrada (email no enviado — revisá SMTP)'
                      );
                      loadBike();
                    } catch (err) {
                      toast.error(err.response?.data?.error || 'Error al solicitar devolución');
                    }
                  }}
                  className="text-blue-600 underline disabled:opacity-50"
                >
                  aquí
                </button>{' '}
                para solicitar la devolución.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
