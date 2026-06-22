import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { isOutOfRange } from '../lib/geo';
import { daysRemaining, rentalEndDate } from '../lib/rental';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
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
            <h1 className="font-asap font-semibold text-2xl text-ucu-green mb-4">
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
  const returnInProgress = bike.loan_status === 'return_requested';

  return (
    <AppLayout className="page-bg-bikes">
      <main className="px-4 py-10 min-h-[calc(100vh-7rem)]">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <div className="bg-ucu-card rounded-2xl p-8 shadow-xl flex flex-col">
              <h3 className="font-asap font-semibold text-lg text-ucu-navy mb-4">Tu bicicleta</h3>
              <dl className="space-y-2 text-sm flex-1">
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
              {outOfRange && (
                <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Fuera del rango de 5 km del campus
                </div>
              )}
            </div>

            <div className="bg-ucu-card rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center">
              <p className="font-asap font-semibold text-2xl md:text-3xl text-ucu-navy leading-snug">
                Faltan {daysLeft} días de tu alquiler
              </p>
              {endDate && (
                <p className="text-sm text-gray-500 mt-2">
                  Vence el{' '}
                  {endDate.toLocaleDateString('es-UY', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="bg-ucu-card rounded-2xl p-8 shadow-xl text-center">
            <h3 className="font-asap font-semibold text-lg text-ucu-navy mb-3">
              ¿Querés devolver la bici?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mx-auto max-w-xl">
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
      </main>
    </AppLayout>
  );
}
