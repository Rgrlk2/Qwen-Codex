# Agendar.IA × GoHighLevel — Dra. Claudia Leguizamón

Asistente de **voz (llamadas)** y **texto (WhatsApp)** sobre una sub-cuenta de GoHighLevel.
Los turnos viven en **calendarios nativos de GHL**, uno por servicio.

```
Paciente ── llamada ──> Número Twilio PY ──> GHL Voice AI ("Sofía") ─┐
Paciente ── WhatsApp ─> WhatsApp GHL (Meta) ─> Conversation AI ──────┤
                                                                     ├─> Calendarios AgendarIA · <Servicio> (48 h)
                                                                     ├─> Contacto + campos (niño ≠ responsable)
                                                                     └─> Workflows: confirmación, lista de espera, urgencia
```

## Contenido

| Archivo | Uso |
|---|---|
| `config/leguizamon.json` | Única fuente de datos del consultorio. `null` = pendiente de confirmar. |
| `ghl_provision.py` | Crea por API campos, tags y calendarios (idempotente). Genera la base de conocimiento. |
| `prompts/agente_voz.md` | Configuración y prompt del Voice AI. |
| `prompts/agente_whatsapp.md` | Configuración y prompt del Conversation AI (WhatsApp). |
| `knowledge/base_conocimiento.md` | Se sube como Knowledge Base de ambos agentes. |

## Paso a paso

### 1. Acceso (una vez)
1. En la sub-cuenta: **Settings → Private Integrations → Create** con los scopes listados en `ghl_provision.py`.
2. **Settings → Business Profile**: copiar Location ID; zona horaria `America/Asuncion`.
3. En el entorno de Claude Code: permitir el dominio `services.leadconnectorhq.com`.

### 2. Aprovisionamiento por API
```bash
export GHL_TOKEN=pit-...  GHL_LOCATION_ID=...
python3 ghl_provision.py check   # valida acceso y lista datos pendientes
python3 ghl_provision.py plan    # vista previa
python3 ghl_provision.py apply   # crea campos, tags y calendarios
python3 ghl_provision.py kb      # regenera la base de conocimiento
```
Los calendarios se crean con: ventana de reserva de **2 días** (regla de 48 h), aviso mínimo de 2 h,
1 turno por horario y **sin confirmación automática** (Secretaría valida). Un servicio sin horario o
duración se omite hasta completarlo.

### 3. Telefonía (Twilio con número paraguayo)
1. Cuenta Twilio con número de Paraguay con capacidad de voz (verificar disponibilidad y requisitos regulatorios del país).
2. GHL: **Settings → Phone System → Twilio → Connect** (Account SID + Auth Token) y asignar el número.
3. Asignar el número al agente Voice AI.
4. Alternativa si no hay número PY disponible en Twilio: desvío desde la línea actual a un número Twilio.

### 4. WhatsApp
1. **Settings → WhatsApp** → alta con Meta Business (embedded signup). Usar un número que **no** esté en la app de WhatsApp común.
2. Plantillas a aprobar en Meta: `confirmacion_turno`, `recordatorio_turno`, `propuesta_reprogramacion`.

### 5. Agentes de IA (interfaz GHL)
1. **AI Agents → Knowledge Base**: subir `knowledge/base_conocimiento.md`.
2. **Voice AI**: crear según `prompts/agente_voz.md`.
3. **Conversation AI**: crear según `prompts/agente_whatsapp.md`.

### 6. Workflows (interfaz GHL — la API no permite crearlos)

| Workflow | Disparador | Acciones |
|---|---|---|
| `AgendarIA · Turno solicitado` | Appointment status = new (calendarios AgendarIA) | Tag `agendaria-pendiente-confirmacion`; WhatsApp al responsable "solicitud recibida"; tarea a Secretaría |
| `AgendarIA · Turno confirmado` | Appointment status = confirmed | WhatsApp plantilla `confirmacion_turno`; quitar tag pendiente |
| `AgendarIA · Recordatorio` | Appointment confirmado | Esperar hasta 24 h antes → `recordatorio_turno`; 2 h antes → recordatorio corto |
| `AgendarIA · Lista de espera` | Disparado por agentes | Tag `agendaria-lista-espera`; tarea a Secretaría |
| `AgendarIA · Alerta urgencia` | Disparado por agentes | Tag `agendaria-urgencia`; notificación interna inmediata (SMS/email/app) a Secretaría y Dra. |
| `AgendarIA · Post llamada` | Call status = completed | Tag `agendaria-voz`; si hay pendiente, tarea a Secretaría |
| `AgendarIA · Comprobante` | Mensaje WhatsApp entrante con adjunto | Tag `agendaria-comprobante-recibido`; pausar bot; asignar a Secretaría |

### 7. Pruebas antes de pacientes reales
- 10 llamadas y 10 chats con datos ficticios: reservar, reprogramar, cancelar, dos hijos del mismo responsable, pedido fuera de 48 h, precio no cargado, portugués, urgencia, pedido de consejo médico (debe negarse).
- Verificar que ningún turno quede confirmado sin Secretaría.

## Tests
```bash
python3 -m unittest -v test_ghl_provision.py
```
