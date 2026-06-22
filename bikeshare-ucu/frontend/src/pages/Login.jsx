import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import LoginHero from '../components/LoginHero';
import SiteHeader, { HEADER_OFFSET } from '../components/SiteHeader';
import { useAuth, getLoginErrorMessage } from '../context/AuthContext';

export default function Login() {
  const { user, loading, loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (user) return <Navigate to="/home" replace />;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      toast.success('¡Bienvenido!');
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
            <h1 className="font-jakarta font-title text-3xl text-ucu-navy mb-8">Iniciar Sesión</h1>

            <div className="mb-8">
              <GoogleLogin
                onSuccess={async (res) => {
                  try {
                    await loginWithGoogle(res.credential);
                    toast.success('¡Bienvenido!');
                  } catch (err) {
                    toast.error(getLoginErrorMessage(err));
                  }
                }}
                onError={() => toast.error('Error con Google')}
                theme="outline"
                size="large"
                text="continue_with"
                locale="es"
                width="100%"
              />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ucu-navy/80 mb-1.5">Correo Electrónico:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ucu-navy/80 mb-1.5">Contraseña:</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    required
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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                <span className="text-blue-600 cursor-pointer">¿Olvidaste tu contraseña?</span>
                <Link to="/registro" className="text-ucu-navy">
                  ¿No tenés cuenta? <span className="text-blue-600 underline">Registrate acá</span>
                </Link>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={submitting} className="btn-navy lowercase">
                  {submitting ? 'Ingresando...' : 'iniciar sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
