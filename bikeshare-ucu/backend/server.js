require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const bikesRoutes = require('./routes/bikes');
const loansRoutes = require('./routes/loans');
const reportsRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact');
const { ensureRentalApplicationsTable } = require('./db/ensureSchema');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS habilitado para el frontend de Vite.
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ]
}));

// Body parser JSON.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta de uploads como estatica.
const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// Healthcheck simple.
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'bikeshare-ucu' }));

// Montar rutas.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bikes', bikesRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/contact', contactRoutes);

ensureRentalApplicationsTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] BikeShare UCU API escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server] No se pudo verificar la tabla rental_applications:', err.message);
    process.exit(1);
  });
