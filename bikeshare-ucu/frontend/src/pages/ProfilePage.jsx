import { useState } from 'react';
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
  const { user, loading, updateProfile, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (!user) return <Navigate to="/" replace />;

  return (
    <AppLayout className="page-bg-bikes">
      <main className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
          <div className="bg-ucu-card rounded-2xl p-8 shadow-xl">
            <h1 className="font-syne font-bold text-2xl text-ucu-green text-center mb-6">Tu Perfil</h1>
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
              {user.ci && (
                <div className="py-2">
                  <span className="text-sm text-gray-500">CI</span>
                  <p className="font-medium">{user.ci}</p>
                </div>
              )}
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
            <h2 className="font-syne font-bold text-2xl text-ucu-green mb-6">CO2 Ahorrado</h2>
            <p className="text-gray-600 mb-4">Gracias a tus viajes en bici redujiste:</p>
            <p className="font-syne font-bold text-5xl text-ucu-navy mb-2">
              {Number(user.co2_saved_kg || 0).toFixed(0)} kg
            </p>
            <p className="text-gray-500">De CO2</p>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
