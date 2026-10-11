# Guía: lo que necesito de GoHighLevel (último paso de la Capa 1)

Objetivo: una **sub-cuenta exclusiva de la Dra. Claudia Leguizamón**, con saldo, 2 usuarios y un token para
que Claude cree calendarios, campos y la base demo. Tiempo estimado: 30–40 minutos.

> Regla de seguridad: **nunca pegues tokens ni contraseñas en el chat.** El token va como variable de entorno.

## 1. Crear la sub-cuenta (vista de agencia)
1. Elegí la agencia que vas a usar para facturar a la Dra. (las billeteras no se pasan entre agencias distintas).
2. **Sub-Accounts → + Create Sub-Account → Blank / Regular**.
3. Nombre: `Agendar.IA – Dra. Claudia Leguizamón`. País: Paraguay. Zona horaria: `America/Asuncion`. Idioma: español.

## 2. Saldo (billetera de la sub-cuenta)
El agente de voz, el bot de WhatsApp y los mensajes se descuentan de esta billetera; con saldo cero no funcionan.
1. Dentro de la sub-cuenta: **Settings → Billing / Wallet & Transactions**.
2. Cargar **USD 25–50** para la demo.
3. Activar **recarga automática** con tope (ej.: si baja de USD 10, recargar USD 25).

## 3. Usuarios y roles (Settings → My Staff → + Add Employee)

| Usuario | Tipo / Rol GHL | Permisos |
|---|---|---|
| **Dra. Claudia Leguizamón** | Account · **Admin** | Acceso total. Única que conoce el PIN del Código Rojo. |
| **Secretaría** | Account · **User** | Solo **Calendars / Appointments** (ver, crear, mover y **cambiar estado a Confirmed** = autorización manual del pago) y **Conversations con "Only assigned data"** (solo ve los chats que el sistema le asigna cuando llega un comprobante). Todo lo demás **desactivado**: Contacts (salvo asignados), Opportunities, Marketing, Workflows, Payments, Reporting, Settings, AI Agents. |

Notas:
- La Secretaría necesita ver el comprobante para autorizar el pago; por eso las conversaciones con comprobante se le
  **asignan automáticamente** y no ve el resto.
- Con mail de cada una me alcanza: el ID de usuario de la Dra. lo obtengo por API.
- Rol de la Licenciada: queda para la Capa 2.

## 4. Token de integración privada
1. Sub-cuenta → **Settings → Private Integrations → Create New Integration**. Nombre: `Agendar.IA Claude`.
2. Scopes (marcar todos estos):
   `locations.readonly`, `locations/customFields.readonly`, `locations/customFields.write`,
   `locations/tags.readonly`, `locations/tags.write`, `calendars.readonly`, `calendars.write`,
   `calendars/events.readonly`, `calendars/events.write`, `contacts.readonly`, `contacts.write`, `users.readonly`.
3. Copiar el token (`pit-…`). Se muestra una sola vez.
4. **Settings → Business Profile**: copiar el **Location ID**.

## 5. Darme acceso desde Claude Code
1. Menú del entorno (barra de título de la sesión) → **Edit**:
   - **Network access → Allowed domains**: agregar `services.leadconnectorhq.com` (dejar "Allow package managers").
   - **Environment variables**: `GHL_TOKEN=pit-…` y `GHL_LOCATION_ID=<Location ID>`.
2. Abrir una sesión nueva (las variables se cargan al iniciar) y escribirme "listo".
3. Por chat pasame solo: Location ID y los mails de la Dra. y de la Secretaría.

## 6. Lo que hago yo con eso
1. `check` → verifico sub-cuenta, zona horaria y usuarios.
2. `apply` → campos, tags y 15 calendarios personales de la Dra. (servicio × sede, 48 h, sin autoconfirmación).
3. `import-demo` → 540 familias, 792 niños y 3.562 turnos ficticios (DND, sin notificaciones).
4. Genero la base de conocimiento final y te paso el checklist de prueba.

## 7. Lo que tenés que hacer vos (requiere tus credenciales o aprobación de terceros)

| Paso | Dónde | Por qué vos |
|---|---|---|
| Twilio: cuenta + número PY con voz | twilio.com → Phone Numbers | Pago y documentación regulatoria a tu nombre |
| Conectar Twilio | GHL → Settings → Phone System → Twilio | Usa tu Account SID / Auth Token |
| Conectar WhatsApp | GHL → Settings → WhatsApp (alta con Meta) | Login de administrador de Meta Business |
| Plantillas Meta | `datos_sena`, `confirmacion_turno`, `recordatorio_turno`, `propuesta_reprogramacion` | Las aprueba Meta (24–48 h) |
| Agentes de IA | Copiar `prompts/agente_voz.md` y `prompts/agente_whatsapp.md` | Te guío en vivo (lo automatizo si la API lo permite) |
| Workflows | Tabla del README | La API de GHL no permite crearlos |
| Código Rojo | Netlify: decime la cuenta/equipo y lo despliego; el PIN lo carga la Dra. | El PIN no debe pasar por el chat |
