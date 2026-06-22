import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';

function EditableField({ label, value, field, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  const save = async () => {
    try {
      await onSave({ [field]: draft });
      toast.success('Actualizado');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <div className="flex-1">
        <span className="text-sm text-gray-500">{label}</span>
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="block w-full mt-1 input-field"
            autoFocus
          />
        ) : (
          <p className="font-medium">{value || 'N/D'}</p>
        )}
      </div>
      {editing ? (
        <button type="button" onClick={save} className="text-sm text-ucu-mint font-medium ml-2">
          Guardar
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(value || '');
            setEditing(true);
          }}
          className="text-gray-400 hover:text-ucu-navy ml-2"
        >
          <Pencil size={16} />
        </button>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, updateProfile, logout, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (!user) return <Navigate to="/" replace />;

  const co2Savings = user.co2_savings;
  const co2Kg = co2Savings?.applies
    ? Number(co2Savings.saved_kg)
    : Number(user.co2_saved_kg || 0);

  return (
    <AppLayout className="page-bg-bikes">
      <main className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
          <div className="bg-ucu-card rounded-2xl p-8 shadow-xl">
            <h1 className="font-asap font-semibold text-heading-lg text-ucu-green text-center mb-6">Tu Perfil</h1>
            <div className="space-y-1">
              <div className="py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Nombre</span>
                <p className="font-medium">{user.name}</p>
              </div>
              <EditableField
                label="Teléfono"
                value={user.phone}
                field="phone"
                onSave={updateProfile}
              />
              <EditableField label="Mail" value={user.email} field="email" onSave={updateProfile} />
              <EditableField label="CI" value={user.ci} field="ci" onSave={updateProfile} />
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-8 text-red-600 text-sm font-medium hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="bg-ucu-card rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center">
            <h2 className="font-asap font-semibold text-heading-lg text-ucu-green mb-4">CO₂ ahorrado</h2>
            <p className="font-asap font-semibold text-heading-2xl text-ucu-navy mb-3">
              {co2Kg.toFixed(1)} kg
            </p>
            {co2Savings?.applies ? (
              <p className="text-sm text-gray-600 leading-relaxed">
                Estimado desde que usás la bici en lugar de{' '}
                <strong>{co2Savings.previous_transport_label}</strong>, con{' '}
                {co2Savings.days_per_week}{' '}
                {co2Savings.days_per_week === 1 ? 'día' : 'días'} por semana a la facultad
                y {Number(co2Savings.distance_km)} km por tramo.
              </p>
            ) : co2Savings?.is_electric ? (
              <p className="text-sm text-gray-500">
                Indicaste que tu transporte anterior era eléctrico; no aplicamos estimación de CO₂.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                {Number(user.co2_saved_kg || 0) > 0
                  ? 'Total acumulado en tus alquileres.'
                  : 'El cálculo aplica con bici activa y transporte anterior auto, ómnibus, taxi/uber o moto.'}
              </p>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
