import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import LoginHero from '../components/LoginHero';
import SiteHeader, { HEADER_OFFSET } from '../components/SiteHeader';
import { useAuth, getLoginErrorMessage } from '../context/AuthContext';

export default function Register() {
  const { user, loading, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (user) return <Navigate to="/home" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      toast.success('¡Cuenta creada!');
    } catch (err) {
      toast.error(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader variant="guest" logoTo={null} />
      <div className={`min-h-screen flex ${HEADER_OFFSET}`}>
        <LoginHero />
        <div className="flex-1 flex items-center justify-center px-8 py-12 bg-ucu-cream">
          <div className="w-full max-w-md">
            <h1 className="font-asap font-semibold text-3xl text-ucu-navy mb-6">Crear cuenta</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                ['name', 'Nombre completo', 'text'],
                ['email', 'Correo electrónico', 'email'],
                ['phone', 'Teléfono (opcional)', 'tel'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-ucu-navy/80 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="input-field"
                    required={key === 'name' || key === 'email'}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-ucu-navy/80 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ucu-navy/40 hover:text-ucu-navy/70"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn-navy w-full">
                {submitting ? 'Creando...' : 'Crear cuenta'}
              </button>
              <p className="text-sm text-center">
                ¿Ya tenés cuenta?{' '}
                <Link to="/" className="text-blue-600 underline">
                  Iniciá sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
