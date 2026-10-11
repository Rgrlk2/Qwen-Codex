# Guía paso a paso — último paso de la Capa 1 (Agendar.IA · Dra. Leguizamón)

Objetivo: una **sub-cuenta GHL exclusiva de la Dra.**, con saldo, 2 usuarios, teléfono, WhatsApp y un token
para que Claude cree calendarios, campos y la base demo. Tiempo estimado: 45–60 minutos (más 24–48 h de Meta).

> Regla de seguridad: **nunca pegues tokens ni contraseñas en el chat.** El token va como variable de entorno.

---

## Paso 1 · Mails en Google Workspace (rgrlk.com)
Crear en la Consola de Google Workspace (**admin.google.com → Usuarios → Agregar**):

| Usuario | Mail |
|---|---|
| Dra. Claudia Leguizamón | `DraLeguizamon.AgendarIA@rgrlk.com` |
| Secretaría | `SecretariaLeguizamon.AgendarIA@rgrlk.com` |

Cada usuario de Workspace consume una licencia. Si querés ahorrar en la demo, el de Secretaría puede ser un
**alias** de una cuenta existente; GHL solo necesita que el mail reciba la invitación y los códigos de acceso.

## Paso 2 · Crear la sub-cuenta (vista de agencia)
1. Elegí la agencia que va a facturar a la Dra. (las billeteras no se pasan entre agencias distintas).
2. **Sub-Accounts → + Create Sub-Account → Blank / Regular**.
3. Nombre `Agendar.IA – Dra. Claudia Leguizamón` · País Paraguay · Zona horaria `America/Asuncion` · Idioma español.
4. Mail de la cuenta: `DraLeguizamon.AgendarIA@rgrlk.com`.

## Paso 3 · Saldo de la billetera
El agente de voz, el bot de WhatsApp y los mensajes se descuentan de la billetera de la sub-cuenta.
**Con saldo cero no funcionan.**
1. Sub-cuenta → **Settings → Billing / Wallet & Transactions**.
2. Cargar **USD 25–50** para la demo.
3. Activar **recarga automática** con tope (ej.: si baja de USD 10, recargar USD 25).

## Paso 4 · Usuarios y roles (Settings → My Staff → + Add Employee)

| Usuario | Tipo / Rol GHL | Permisos |
|---|---|---|
| **Dra. Claudia Leguizamón** | Account · **Admin** | Acceso total. Única que conoce el PIN del Código Rojo. |
| **Secretaría** | Account · **User** | Aprueba el flujo de agenda: **Calendars / Appointments** (ver, crear, mover y **cambiar estado a Confirmed** = autorización manual del pago) y **Conversations con "Only assigned data"** (solo ve los chats que el sistema le asigna cuando llega un comprobante). Todo lo demás **desactivado**. |

La Licenciada (y su calendario de vacunación) entra en la **Capa 2**.

## Paso 5 · Teléfono y WhatsApp — qué usa Twilio y qué usa Meta

Son **dos cosas distintas**:

| Canal | Proveedor | Por qué |
|---|---|---|
| **Llamadas de voz** (agente de voz) | **Twilio** | GHL no vende números de Paraguay; Twilio aporta la línea telefónica. Meta no interviene. |
| **WhatsApp** (bot de texto) | **Meta**, directo desde GHL | GHL tiene WhatsApp nativo (API oficial de Meta). Twilio **no** interviene. |

No se usan juntos en un mismo canal: Twilio = voz, Meta = WhatsApp. Opcionalmente, **el mismo número** puede
servir para ambos: se usa el número de Twilio para llamadas y se lo registra también en WhatsApp con Meta
(recibe el código de verificación por llamada). Así el paciente tiene un único número para llamar y escribir.

**5a · Voz con Twilio**
1. twilio.com → crear cuenta → **Phone Numbers → Buy a number** → país Paraguay, capacidad **Voice**
   (si no hay disponibilidad, Twilio pide documentación regulatoria o se usa desvío desde la línea actual).
2. Copiar **Account SID** y **Auth Token** (Console → Account Info).
3. GHL sub-cuenta → **Settings → Phone System → Twilio → Connect** → pegar SID y Token → asignar el número.

**5b · WhatsApp con Meta**
1. GHL sub-cuenta → **Settings → WhatsApp → Connect** (alta con Meta Business; requiere login de administrador
   de Meta Business y verificación del negocio).
2. Elegir el número de agendamiento (**no** el celular personal de la Dra.; puede ser el de Twilio).
3. Crear y enviar a aprobación las plantillas: `datos_sena`, `confirmacion_turno`, `recordatorio_turno`,
   `propuesta_reprogramacion` (textos en `codigo-rojo/README.md` y en el README). Meta tarda 24–48 h.

## Paso 6 · Token de integración privada
1. Sub-cuenta → **Settings → Private Integrations → Create New Integration**. Nombre: `Agendar.IA Claude`.
2. Marcar estos scopes:
   `locations.readonly`, `locations/customFields.readonly`, `locations/customFields.write`,
   `locations/tags.readonly`, `locations/tags.write`, `calendars.readonly`, `calendars.write`,
   `calendars/events.readonly`, `calendars/events.write`, `contacts.readonly`, `contacts.write`, `users.readonly`.
3. Copiar el token (`pit-…`); se muestra una sola vez.
4. **Settings → Business Profile** → copiar el **Location ID**.

## Paso 7 · Darme acceso desde Claude Code
1. Menú del entorno (barra de título de la sesión) → **Edit**:
   - **Network access → Allowed domains**: agregar `services.leadconnectorhq.com` (dejar "Allow package managers").
   - **Environment variables**: `GHL_TOKEN=pit-…` y `GHL_LOCATION_ID=<Location ID>`.
2. Abrir una sesión nueva (las variables se cargan al iniciar) y escribirme **"listo"** con el Location ID.

## Paso 8 · Lo que hago yo
1. `check` → verifico sub-cuenta, zona horaria y usuarios (obtengo el ID de la Dra. por mail).
2. `apply` → campos, etiquetas y 15 calendarios personales de la Dra. (servicio × sede, 48 h, sin autoconfirmación).
3. `import-demo` → 540 familias, 792 niños y 3.562 turnos ficticios (sin notificaciones, "no molestar").
4. Base de conocimiento final, despliegue del botón rojo en Netlify (decime cuenta/equipo) y checklist de prueba.

## Paso 9 · Lo que hacemos juntos (te guío pantalla por pantalla)
- Crear los dos agentes de IA copiando `prompts/agente_voz.md` y `prompts/agente_whatsapp.md`
  (lo automatizo si la API lo permite).
- Armar los workflows de la tabla del README (la API de GHL no permite crearlos).
- Cargar el PIN del Código Rojo en Netlify (lo elige la Dra.; no pasa por el chat).
