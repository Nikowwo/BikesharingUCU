import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { TERMS_SECTIONS } from '../data/terms';

export default function TermsPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (!user) return <Navigate to="/" replace />;

  return (
    <AppLayout>
      <section className="bg-ucu-cream py-16 px-6 min-h-[calc(100vh-7rem)]">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-asap font-semibold text-3xl text-ucu-navy text-center mb-10">
            Términos y Condiciones
          </h1>
          <div className="space-y-8">
            {TERMS_SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="font-asap font-semibold text-ucu-navy mb-2">{s.title}</h2>
                <p className="text-gray-700 leading-relaxed text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
