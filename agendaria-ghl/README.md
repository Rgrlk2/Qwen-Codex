# Agendar.IA × GoHighLevel — Dra. Claudia Leguizamón

Asistente de **voz (llamadas)** y **texto (WhatsApp)** en la sub-cuenta GHL **LabIA**
(`krXZA2jf7PzcNfbcJO9g`), usuario de la Dra. `szEt5JMJQiTra12QG6q4`.
Los turnos viven en **calendarios personales de la Dra.**, uno por servicio y sede.

> **Modo DEMO:** `config/leguizamon.json` y `data/demo/` contienen datos ficticios.
> Reemplazar por los reales antes de atender pacientes.

```
Paciente ── llamada ──> Número Twilio PY ──> GHL Voice AI ("Sofía") ─┐
Paciente ── WhatsApp ─> WhatsApp GHL (Meta) ─> Conversation AI ──────┤
                                                                     ├─> Calendarios AgendarIA · <Servicio> · <Sede> (48 h)
Dra. ── botón 🔴 ──> codigo-rojo (Netlify) ──> bloqueo + propuestas ─┤
                                                                     └─> Workflows: confirmación, recordatorio, Código Rojo, urgencia
```

## Contenido

| Ruta | Uso |
|---|---|
| `config/leguizamon.json` | Única fuente de datos: sedes, horarios, servicios, seguros, vacunas, ausencia, urgencias. |
| `ghl_provision.py` | Valida horarios y crea por API campos, tags y calendarios (idempotente). Genera la base de conocimiento. Importa la demo. |
| `generar_demo.py` | Genera pacientes ficticios y turnos 01/01–10/10/2026 en `data/demo/`. |
| `codigo-rojo/` | Botón rojo de la Dra. (página + función Netlify). |
| `prompts/agente_voz.md`, `prompts/agente_whatsapp.md` | Configuración y prompt de cada agente. |
| `knowledge/base_conocimiento.md` | Knowledge Base de ambos agentes (generada). |

## Configuración demo

- **Horario general:** lunes a viernes 08–12 y 14–19; sábados 08–12.
- **Sedes:** Ciudad del Este — Centro, Hernandarias (martes y viernes por la tarde), Santa Rita (sábados), Teleconsulta.
- **9 tipos de consulta:** primera consulta, control de niño sano, consulta por enfermedad, control de recién nacido,
  pediatría integrativa (jueves, solo particular), nutricional, certificado escolar, vacunación (los viernes en
  Hernandarias aplica la licenciada) y teleconsulta. Electroencefalografía figura como "próximamente".
- **15 calendarios** sin superposiciones (`python3 ghl_provision.py validate`).
- **Lo que pidió la Dra. en la reunión:** ninguna indicación médica (ni "lavado nasal"); ante urgencia, solo derivar
  al centro de salud más cercano o a la urgencia del Sanatorio Le Blanc; español por defecto, portugués para las
  colonias, nunca inglés; opción de seguir por WhatsApp o por enlace; modo vacaciones; agenda a 48 h.

## Paso a paso

### 1. Acceso (una vez)
1. Sub-cuenta LabIA → **Settings → Private Integrations → Create** con los scopes listados en `ghl_provision.py`.
2. **Business Profile**: zona horaria `America/Asuncion`.
3. Entorno de Claude Code: permitir el dominio `services.leadconnectorhq.com`.

### 2. Aprovisionamiento por API
```bash
export GHL_TOKEN=pit-...           # el Location ID ya está en config.ghl
python3 ghl_provision.py validate  # sin red
python3 ghl_provision.py check
python3 ghl_provision.py plan
python3 ghl_provision.py apply     # campos, tags y 15 calendarios
python3 ghl_provision.py kb
```
Calendarios: ventana de reserva de **2 días** (48 h), aviso mínimo 2 h, 1 turno por horario,
**sin confirmación automática** (Secretaría valida), personales de la Dra. → GHL bloquea choques entre sedes.

### 3. Base demo (pacientes y turnos ficticios)
```bash
python3 generar_demo.py                          # regenera data/demo/ (determinista)
python3 ghl_provision.py import-demo             # o --desde 2026-09-01 para cargar menos
```
521 responsables, 774 niños (181 familias con varios hijos), 3.547 turnos con estados atendido / inasistencia /
cancelado / reprogramado, feriados, vacaciones (19/01–01/02 y 20/07–02/08), estacionalidad invernal y un
Código Rojo el 18/08. Contactos con tag `agendaria-demo` y **DND activo**; turnos con `toNotify: false`:
nadie recibe mensajes. Teléfonos `+595900…`, correos `@example.com`. La importación es reanudable.

### 4. Telefonía (Twilio con número paraguayo)
1. Cuenta Twilio con número de Paraguay con voz (verificar disponibilidad y requisitos regulatorios).
2. GHL: **Settings → Phone System → Twilio → Connect** y asignar el número al Voice AI.
3. Alternativa si no hay número PY en Twilio: desvío desde la línea actual a un número Twilio.

### 5. WhatsApp
1. **Settings → WhatsApp** → alta con Meta Business. Número de agendamiento, **no** el celular personal de la Dra.
2. Plantillas a aprobar en Meta: `confirmacion_turno`, `recordatorio_turno`, `propuesta_reprogramacion`
   (texto en `codigo-rojo/README.md`).

### 6. Agentes de IA
1. **AI Agents → Knowledge Base**: subir `knowledge/base_conocimiento.md`.
2. **Voice AI** según `prompts/agente_voz.md`; **Conversation AI** según `prompts/agente_whatsapp.md`.
3. Copiar el enlace del widget de calendarios en `clinica.enlace_reserva_web` y regenerar `kb`.

### 7. Código Rojo
Ver `codigo-rojo/README.md`: despliegue en Netlify, PIN y workflow `AgendarIA · Código Rojo`.

### 8. Workflows (interfaz GHL — la API no permite crearlos)

| Workflow | Disparador | Acciones |
|---|---|---|
| `AgendarIA · Turno solicitado` | Appointment status = new | Tag `agendaria-pendiente-confirmacion`; WhatsApp "solicitud recibida"; tarea a Secretaría |
| `AgendarIA · Turno confirmado` | Appointment status = confirmed | Plantilla `confirmacion_turno`; quitar tag pendiente |
| `AgendarIA · Recordatorio` | Appointment confirmado | 24 h antes → `recordatorio_turno`; 2 h antes → recordatorio corto |
| `AgendarIA · Código Rojo` | Tag añadido `codigo-rojo-afectado` | Plantilla `propuesta_reprogramacion`; esperar respuesta 30 min; sin respuesta → tarea "llamar" a Secretaría |
| `AgendarIA · Lista de espera` | Disparado por agentes | Tag `agendaria-lista-espera`; tarea a Secretaría |
| `AgendarIA · Alerta urgencia` | Disparado por agentes | Tag `agendaria-urgencia`; notificación interna inmediata a Secretaría y Dra. |
| `AgendarIA · Comprobante` | WhatsApp entrante con adjunto | Tag `agendaria-comprobante-recibido`; pausar bot; asignar a Secretaría |

Filtro en todos: **excluir contactos con tag `agendaria-demo`**.

### 9. Pruebas antes de pacientes reales
Con datos ficticios: reservar, reprogramar, cancelar, dos hijos del mismo responsable, pedido fuera de 48 h,
seguro que no cubre la consulta, portugués, "hello", urgencia, "¿le hago lavado nasal?" (debe negarse),
receta con error (handoff), modo ausencia y un Código Rojo completo.

## Tests
```bash
python3 -m unittest -v test_ghl_provision.py
node --test codigo-rojo/test/codigo-rojo.test.mjs
```
