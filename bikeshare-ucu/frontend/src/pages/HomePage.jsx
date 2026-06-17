import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const EMPTY_FORM = { full_name: '', ci: '', email: '' };

export default function HomePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (!user) return <Navigate to="/" replace />;

  const scrollToForm = () => {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('ci', form.ci);
      fd.append('email', form.email);
      if (file) fd.append('address_proof', file);

      const { data } = await api.post('/contact/rental', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.email_sent) {
        toast.success('Solicitud enviada por email. Bedelías la revisará pronto.');
      } else {
        toast.success(
          data.email_note ||
            'Solicitud guardada. Para enviar el email, configurá SMTP en backend/.env (ver SETUP_EMAIL.md).',
          { duration: 8000 }
        );
      }

      setForm(EMPTY_FORM);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout className="!pt-0">
      <section className="relative min-h-screen hero-campus flex flex-col items-center justify-center text-center text-white">
        <h1 className="font-syne font-bold text-3xl md:text-5xl max-w-3xl px-6 leading-tight">
          ¿Estás buscando una bici para ir a la facultad?
        </h1>
        <button
          type="button"
          onClick={scrollToForm}
          className="absolute bottom-10 animate-bounce"
          aria-label="Ver más"
        >
          <ChevronDown size={36} />
        </button>
      </section>

      <section className="bg-ucu-navy text-white py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center md:justify-start">
            <BrandLogo to={null} className="h-24 md:h-28" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-xl mb-3">BikeShare UCU te ofrece lo que buscás.</h2>
            <p className="text-white/85 leading-relaxed">
              Con una amplia variedad de bicis para alquilar, esperamos que puedas moverte de manera
              más sustentable y así, cuidar nuestro planeta y también tu salud.
            </p>
          </div>
        </div>
      </section>

      <section
        id="formulario"
        className="bg-ucu-navy text-white px-6 pt-28 pb-16 min-h-[calc(100vh-4rem)] flex flex-col justify-center -mt-px"
      >
        <div className="max-w-xl mx-auto w-full py-6 md:py-8">
          <h2 className="font-syne font-bold text-2xl md:text-3xl text-center mb-8">Alquilá tu bici acá</h2>
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-sm mb-1">Nombre Completo:*</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-underline"
                placeholder=""
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">CI:*</label>
              <input
                type="text"
                value={form.ci}
                onChange={(e) => setForm({ ...form, ci: e.target.value })}
                className="input-underline"
                placeholder=""
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Correo Electrónico:*</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-underline"
                placeholder=""
                required
              />
            </div>
            <div>
              <p className="text-sm mb-1">¿Cambiaste de dirección?</p>
              <label className="block text-sm mb-1">Comprobante de nueva dirección:</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-white/80 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-white/20 file:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-200 text-ucu-navy px-8 py-2 rounded-full font-medium hover:bg-white disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}
