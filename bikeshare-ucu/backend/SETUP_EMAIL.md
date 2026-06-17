# Cómo enviar el formulario a nicolasgobbo2007@gmail.com

El formulario de alquiler usa **nodemailer**. Sin SMTP configurado, la solicitud se guarda en la base de datos pero **no llega ningún email**.

## Pasos (Gmail)

1. Entrá a tu cuenta Google → **Seguridad** → activá **Verificación en 2 pasos**.

2. Creá una **Contraseña de aplicación**:
   - Google Account → Seguridad → Contraseñas de aplicaciones
   - Nombre: `BikeShare UCU`
   - Copiá la contraseña de 16 caracteres

3. Editá `backend/.env`:

```env
CONTACT_TO=nicolasgobbo2007@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nicolasgobbo2007@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=BikeShare UCU <nicolasgobbo2007@gmail.com>
```

4. **Reiniciá el backend** (`npm start`).

5. Enviá el formulario desde Inicio. Deberías recibir el mail en `nicolasgobbo2007@gmail.com`.

## Aprobar desde el email (un clic)

Cada mail incluye botones **Aprobar y asignar** / **Rechazar**. Al hacer clic:

1. Se abre una página de confirmación en el navegador.
2. Confirmás → se asigna la bici `UCU-001` y el usuario la ve en **Mi Bici**.

Variables opcionales en `backend/.env`:

```env
API_PUBLIC_URL=http://localhost:3001
DEFAULT_BIKE_CODE=UCU-001
CURRENT_SEMESTER=2026-S1
APPROVE_SECRET=una-clave-secreta-larga
```

`APPROVE_SECRET` protege los enlaces del mail. Si no la definís, se usa `JWT_SECRET`.

**Importante:** el backend debe estar corriendo cuando hagas clic en el enlace.

## Confirmar devolución desde el email

Cuando un usuario solicita devolver la bici en **Mi Bici**, el mail incluye el botón **Confirmar devolución**. Al hacer clic:

1. Se abre una página de confirmación en el navegador.
2. Confirmás → el préstamo se cierra y la bici queda disponible otra vez.

## Email al solicitante (aprobación / rechazo)

Cuando Bedelías aprueba o rechaza una solicitud, se envía un email al **correo del formulario**.

Usa la misma configuración SMTP de Gmail (recomendado), porque Resend en modo prueba solo puede enviar a direcciones verificadas:

```env
SMTP_USER=nicolasgobbo2007@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=BikeShare UCU <nicolasgobbo2007@gmail.com>
```

Reiniciá el backend después de cambiar `.env`.

## Sin SMTP (modo desarrollo)

La solicitud igual se guarda en la tabla `rental_applications` y en:

```
backend/data/rental-requests/request-*.txt
```

Para asignar bici después: ejecutá `database/assign_test_bike.sql` en phpMyAdmin.

## Producción

Cambiá `CONTACT_TO=estudiantes@ucu.edu.uy` cuando la facultad use su propio correo.
