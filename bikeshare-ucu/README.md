# BikeShare UCU

Sistema de prestamo de bicicletas para la Universidad Catolica del Uruguay.

## Estructura

```
bikeshare-ucu/
├── backend/      API REST (Express + MySQL)
├── frontend/     React + Vite + Tailwind
└── database/     schema.sql
```

## Requisitos

- Node.js 18+
- MySQL / MariaDB (incluido en XAMPP)

## Puesta en marcha del frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Las variables están en `frontend/.env`.

## Puesta en marcha del backend

1. Crear la base de datos importando el esquema:

```bash
mysql -u root < database/schema.sql
```

(o desde phpMyAdmin: importar `database/schema.sql`)

2. Instalar dependencias:

```bash
cd backend
npm install
```

3. Revisar `backend/.env` (puerto, credenciales de MySQL, `GOOGLE_CLIENT_ID`, etc.).

4. Arrancar el servidor:

```bash
npm run dev   # con --watch
# o
npm start
```

La API queda disponible en `http://localhost:3001`. Healthcheck: `GET /api/health`.

## Endpoints principales

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/auth/google` | Login con Google, devuelve JWT propio |
| GET | `/api/bikes/available` | Bicis disponibles |
| GET | `/api/bikes/my` | Bici prestada al usuario + recorrido GPS |
| POST | `/api/bikes/:id/gps` | Ingesta de posicion del chip GPS |
| GET | `/api/loans/my` | Historial de prestamos del usuario |
| POST | `/api/loans/request` | Solicitar prestamo |
| POST | `/api/loans/:id/request-return` | Solicitar devolucion |
| POST | `/api/reports` | Crear reporte de daño (con fotos) |
| GET | `/api/reports/my` | Reportes del usuario |
| `/api/admin/*` | varias | Gestion (requiere rol admin) |

## Notas

- Las fotos de reportes se guardan en `backend/uploads/` y se sirven en `/uploads`.
- El CO2 ahorrado por semestre se estima en `5 km/dia * 120 dias * 0.21 kg/km = 126 kg`.
- El control de radio del campus usa la formula de Haversine contra `UCU_LAT`/`UCU_LNG`.
