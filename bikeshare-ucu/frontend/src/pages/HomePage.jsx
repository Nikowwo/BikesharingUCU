import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../layouts/AppLayout';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

import {
  DAYS_PER_WEEK_OPTIONS,
  PREVIOUS_TRANSPORT_OPTIONS,
} from '../data/rentalForm';

const EMPTY_FORM = {
  full_name: '',
  ci: '',
  email: '',
  days_per_week: '',
  previous_transport: '',
  distance_km: '',
  is_electric: false,
  accepted_terms: false,
};

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
    if (!file) {
      toast.error('El comprobante de dirección es obligatorio');
      return;
    }
    if (!form.accepted_terms) {
      toast.error('Debés leer y aceptar los Términos y Condiciones');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('ci', form.ci);
      fd.append('email', form.email);
      fd.append('days_per_week', form.days_per_week);
      fd.append('previous_transport', form.previous_transport);
      fd.append('distance_km', form.distance_km);
      fd.append('is_electric', form.is_electric ? '1' : '0');
      fd.append('address_proof', file);

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
        <h1 className="font-asap font-semibold text-3xl md:text-5xl max-w-3xl px-6 leading-tight">
          ¿ESTÁS BUSCANDO UNA BICI PARA IR A LA FACULTAD?
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
            <h2 className="font-asap font-semibold text-xl mb-3">BIKESHARE UCU TE OFRECE LO QUE BUSCÁS.</h2>
            <p className="text-white/85 leading-relaxed">
              Con una amplia variedad de bicis para alquilar, esperamos que puedas moverte de manera
              más sustentable y así, cuidar nuestro planeta y también tu salud.
            </p>
          </div>
        </div>
      </section>

      <section
        id="formulario"
        className="bg-ucu-cream text-ucu-navy px-6 pt-28 pb-16 min-h-[calc(100vh-4rem)] flex flex-col justify-center -mt-px"
      >
        <div className="max-w-xl mx-auto w-full py-6 md:py-8">
          <h2 className="font-asap font-semibold text-2xl md:text-3xl text-center mb-8">ALQUILÁ TU BICI ACÁ</h2>
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-sm mb-1">Nombre Completo:*</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-underline-navy"
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
                className="input-underline-navy"
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
                className="input-underline-navy"
                placeholder=""
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">¿Cuántos días por semana vas a la facultad?*</label>
              <select
                value={form.days_per_week}
                onChange={(e) => setForm({ ...form, days_per_week: e.target.value })}
                className="select-underline-navy"
                required
              >
                <option value="" disabled>
                  Seleccioná una opción
                </option>
                {DAYS_PER_WEEK_OPTIONS.map((day) => (
                  <option key={day} value={day}>
                    {day} {day === 1 ? 'día' : 'días'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">
                ¿Qué método de transporte usabas antes de la bici?*
              </label>
              <select
                value={form.previous_transport}
                onChange={(e) => setForm({ ...form, previous_transport: e.target.value })}
                className="select-underline-navy"
                required
              >
                <option value="" disabled>
                  Seleccioná una opción
                </option>
                {PREVIOUS_TRANSPORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_electric}
                  onChange={(e) => setForm({ ...form, is_electric: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-ucu-navy/30 text-ucu-green focus:ring-ucu-green"
                />
                <span className="text-sm leading-snug">
                  Es eléctrico
                  <span className="block text-xs text-ucu-navy/60 mt-0.5">
                    Si marcás esta opción, no se estimará CO₂ ahorrado en tu perfil.
                  </span>
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm mb-1">
                ¿A cuántos km vivís o recorrés hasta la facultad?*
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.distance_km}
                onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                className="input-underline-navy"
                placeholder="Ej: 3.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Comprobante de dirección:*</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-ucu-navy/80 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-ucu-navy/15 file:text-ucu-navy"
                required
              />
            </div>
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.accepted_terms}
                  onChange={(e) => setForm({ ...form, accepted_terms: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-ucu-navy/30 text-ucu-green focus:ring-ucu-green"
                  required
                />
                <span className="text-sm leading-snug">
                  Leí y acepto los{' '}
                  <Link
                    to="/terminos"
                    className="text-ucu-green underline font-medium hover:text-ucu-navy"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Términos y Condiciones
                  </Link>
                </span>
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-ucu-navy text-ucu-cream px-8 py-2 rounded-full font-medium hover:bg-ucu-navy/90 disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}
