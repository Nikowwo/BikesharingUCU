# Configuración de email

## Recomendado: Brevo (Railway + mails a cualquier alumno)

### 1. Brevo
1. Creá cuenta en [brevo.com](https://www.brevo.com)
2. **Settings → Senders** → verificá `nicolasgobbo2007@gmail.com` (código de 6 dígitos)
3. **Settings → SMTP & API → API Keys** → generá una key (`xkeysib-...`)

### 2. Variables en Railway / `backend/.env`

```env
BREVO_API_KEY=xkeysib-tu-key-aqui
BREVO_FROM_EMAIL=nicolasgobbo2007@gmail.com
BREVO_FROM_NAME=BikeShare UCU
CONTACT_TO=nicolasgobbo2007@gmail.com
API_PUBLIC_URL=https://tu-backend.up.railway.app
FRONTEND_URL=https://bikesharing-ucu.vercel.app
```

No hace falta clave SMTP de Brevo ni dominio propio para empezar.

### 3. Reiniciá / redeploy el backend

Al arrancar deberías ver:
```
[mailer] Email: Brevo=sí | SMTP=... | Resend=...
```

---

## Flujo de emails

1. **Formulario** → Bedelías recibe solicitud (Aprobar / Rechazar)
2. **Aprobar** → mail al correo del formulario
3. **Rechazar** (con motivo) → mail al correo del formulario

---

## Alternativas (respaldo)

| Método | Cuándo usarlo |
|--------|----------------|
| **Gmail SMTP** | Desarrollo local (`SMTP_USER`, `SMTP_PASS`) |
| **Resend** | Solo si tenés dominio verificado (`RESEND_API_KEY`) |

Orden en código: **Brevo → Resend → Gmail SMTP**

---

## Sin configuración

La solicitud se guarda en `rental_applications` y en `backend/data/rental-requests/request-*.txt`
