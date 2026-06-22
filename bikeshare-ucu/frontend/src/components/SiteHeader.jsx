import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import HeaderLogo from './HeaderLogo';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '../context/AuthContext';

/** Altura fija del header en toda la app */
export const HEADER_HEIGHT = 'h-28';
export const HEADER_OFFSET = 'pt-28';

function ProfileAvatar({ user }) {
  const [imgError, setImgError] = useState(false);

  if (user?.avatar_url && !imgError) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || 'Perfil'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full border-2 border-white/60 object-cover shrink-0 bg-white/10"
      />
    );
  }

  return (
    <span className="w-9 h-9 rounded-full bg-white/25 border-2 border-white/60 flex items-center justify-center shrink-0">
      <User size={18} className="text-white" strokeWidth={2} />
    </span>
  );
}

/**
 * Header único para toda la app (login, registro e interior).
 * variant="guest" → solo logo (misma posición y tamaño).
 * variant="auth"  → logo + nav + perfil.
 */
export default function SiteHeader({ variant = 'auth', logoTo }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const navBtn = (path) =>
    `px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
      pathname === path
        ? 'bg-white/30 text-white'
        : 'bg-white/10 text-white/90 hover:bg-white/20'
    }`;

  const logoLink = logoTo !== undefined ? logoTo : variant === 'auth' ? '/home' : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ucu-navy text-white shadow-md">
      <div
        className={`relative max-w-7xl mx-auto px-4 ${HEADER_HEIGHT} flex items-center justify-between`}
      >
        <div className="relative z-10 flex items-center h-full shrink-0">
          <HeaderLogo to={logoLink} />
        </div>

        {variant === 'auth' && (
          <nav className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2 max-w-[calc(100%-9rem)] sm:max-w-none">
            <Link to="/home" className={navBtn('/home')}>
              Inicio
            </Link>
            <Link to="/my-bike" className={navBtn('/my-bike')}>
              Mi Bici
            </Link>
            <Link
              to="/terminos"
              className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-300 underline underline-offset-2 whitespace-nowrap transition-all duration-200 hover:text-gray-100 hover:scale-105"
            >
              Términos y Condiciones
            </Link>
          </nav>
        )}

        <div className="relative z-10 flex items-center justify-end gap-1 h-full min-h-[36px] shrink-0">
          {variant === 'auth' ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 hover:opacity-90 px-1 py-1 rounded-lg hover:bg-white/10"
              >
                <ProfileAvatar user={user} />
                <span className="text-sm text-white hidden md:inline truncate max-w-[120px]">
                  {user?.name || 'Nombre'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 text-white shrink-0"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Cerrar sesión"
        message="¿Estás seguro de que querés cerrar sesión?"
        confirmText="Cerrar sesión"
        onConfirm={() => {
          logout();
          setLogoutOpen(false);
        }}
        onCancel={() => setLogoutOpen(false)}
        danger
      />
    </header>
  );
}
