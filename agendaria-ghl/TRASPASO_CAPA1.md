# Traspaso · Agendar.IA Capa 1 · Dra. Claudia Leguizamón

Documento para continuar el trabajo en la sesión conectada a GoHighLevel (GHL).
**Leelo completo antes de pedirle algo a Rodrigo: casi todo ya está definido.**

---

## 1. Contexto

- **Cliente:** Dra. Claudia Leguizamón, pediatra, Ciudad del Este (Paraguay). Atiende hoy en el Centro Pediátrico del Sanatorio Le Blanc.
- **Producto:** Agendar.IA (Lab.IA / RGrlk Group). Asistente de turnos por **WhatsApp (texto)** y **llamadas (voz)** sobre GHL.
- **Responsable:** Rodrigo Garelik. Respuestas cortas y profesionales. **No tocar nada que no indique. No inventar preguntas ni datos. No asumir.**
- **Repositorio:** `Rgrlk2/Qwen-Codex`, rama `claude/agendar-ia-voice-assistant-f13lrm`, carpeta `agendaria-ghl/` (PR #11). No tocar `inmobot/`.

## 2. Decisiones tomadas (NO volver a preguntar)

**Asistente**
- Atiende 24 h, en español (por defecto), portugués y yopará. Nunca en inglés.
- **Nunca da consejos médicos.** La regla no tiene excepción, pero siempre la dice con amabilidad.
- **Urgencias:** usa la frase de la Dra.: "Si es una urgencia, acuda al centro de salud o centro médico más cercano o a la urgencia del Sanatorio Le Blanc."
- **Todo lo que no sea turno se deriva a Secretaría.**
- Texto **solo por WhatsApp**. Las llamadas las atiende el agente de voz, con **voz femenina**.
- El paciente elige seguir por WhatsApp o reservar en el enlace web; nunca se lo obliga a usar la plataforma.
- El turno va a nombre del niño o niña; un responsable puede tener varios hijos.

**Agenda y pagos**
- **Turno preconfirmado:** queda reservado hasta que **Secretaría confirma la preconsulta**, es decir, verifica el comprobante.
- **Seña:** Gs. 100.000, **solo particulares**, se descuenta de la consulta, con 2 h para enviar el comprobante (o hasta 3 h antes del turno). Si no llega, el horario se libera.
- **Medios de pago:** transferencia; efectivo solo en el consultorio y **antes** del turno, no en el horario de consulta.
- **Secretaría confirma los turnos y aprueba los pagos**, nunca el sistema solo.
- **Teleconsulta:** por Google Meet.
- El sistema **no pide razón social ni datos de factura**.

**Código Rojo**
- **Solo la Dra.** lo activa: 2 h por defecto, ampliable a 3, 4 o 5 h.
- Bloquea su agenda, cancela sin borrar los turnos afectados y **avisa por WhatsApp a las familias de ese horario**, proponiendo nuevos horarios **hasta acordar**.
- La seña pagada se mantiene.

**Roles**
- **Capa 1:** Dra. (Admin, acceso total) y **Secretaría** (User: solo turnos y autorización manual de pagos; conversaciones solo asignadas).
- **Capa 2:** Licenciada (vacunación). **No pedir sus datos ahora.**
- **Mails** (ya definidos, no pedirlos): `DraLeguizamon.AgendarIA@rgrlk.com` y `SecretariaLeguizamon.AgendarIA@rgrlk.com`.

**Infraestructura**
- **Sub-cuenta exclusiva** de la Dra. en la agencia que elija Rodrigo. Las billeteras no se transfieren entre agencias.
- **Twilio = solo voz** (GHL no vende números de Paraguay). **WhatsApp = Meta, directo desde GHL** (Twilio no interviene).
- **Tokens nunca por chat:** van como variables de entorno (`GHL_TOKEN`, `GHL_LOCATION_ID`, `GHL_USER_ID`).

## 3. Datos reales conocidos

- **Horario actual** (flyer del Centro Pediátrico Le Blanc): lunes, jueves y viernes 08:45–12:00; martes 08:45–12:00 y 17:30–19:30. Teléfono del centro: (0993) 280 090.
- **Consultas** mencionadas en la reunión del 24/07: normal de 20 min (particular o seguro), pediatría integrativa (jueves, solo particular, más larga), nutricional y vacunación. EEG es a futuro.
- **Regla de la Dra.:** abre la agenda con 48 h de anticipación.
- **Sub-cuenta provisoria usada para la demo:** LabIA, Location ID `krXZA2jf7PzcNfbcJO9g`, usuario `szEt5JMJQiTra12QG6q4`. **Confirmar con Rodrigo antes de escribir ahí.**

> ⚠️ `config/leguizamon.json` y `data/demo/` son **DEMO, con datos ficticios**: sedes, precios, seguros, cuenta Itaú y 792 pacientes inventados. **No cargar como reales.**

## 4. Pendiente de la Dra. (se pide solo con el cuestionario)

El cuestionario es `agendaria-ghl/cuestionario-capa1/`, un ZIP listo para Netlify Drop. Pide:
- nombre del asistente y trato (usted o vos);
- número de agendamiento;
- lugares y grilla de horarios por lugar;
- tipos de consulta (duración, valor, seguro, lugares y días);
- ventana de agenda;
- confirmación de la seña, medios de pago y datos bancarios;
- seguros y qué cubren;
- mensaje de urgencia y números de emergencia;
- precios visibles;
- respuesta sobre el sanatorio;
- ausencias y recordatorios;
- nombre y celular de Secretaría;
- motivo del Código Rojo;
- fecha de inicio y cómo comunicará el número;
- formato y forma de envío de su base de pacientes.

**No preguntarle nada fuera de esto.**

## 5. Pendiente de Rodrigo

1. **Aclarar qué es "8D"** antes de mover nada a la sub-cuenta Lab.IA.
2. Crear la sub-cuenta exclusiva, cargar saldo, crear los 2 usuarios y el token (ver `GUIA_ACCESO_GHL.md`).
3. Twilio (número con voz) y WhatsApp con Meta, incluida la tarjeta al conectar.
4. Logo de Pharma.IA para el cuestionario (hoy va como texto).
5. Desplegar el cuestionario y enviárselo a la Dra.

## 6. Qué hay en `agendaria-ghl/`

| Archivo | Para qué |
|---|---|
| `ghl_provision.py` | `validate` / `check` / `plan` / `apply` / `kb` / `import-demo` vía API v2 (campos, etiquetas, 15 calendarios personales servicio × sede, 48 h, sin autoconfirmación) |
| `prompts/agente_whatsapp.md`, `prompts/agente_voz.md` | Prompts de los agentes con todas las reglas de arriba |
| `knowledge/base_conocimiento.md` | Base de conocimiento (hoy con datos demo; regenerar con `kb` cuando haya datos reales) |
| `codigo-rojo/` | Botón rojo (página con PIN + función Netlify) |
| `GUIA_ACCESO_GHL.md` | Sub-cuenta, billetera, usuarios, Twilio, Meta y token |
| `MANUAL_GHL_DETALLADO.txt` | Configuración manual de GHL, click por click (unas 2.200 líneas) |
| `cuestionario-capa1-netlify.zip` | Cuestionario para la Dra. |

**Tests:** `python3 -m unittest test_ghl_provision.py` y `node --test codigo-rojo/test/codigo-rojo.test.mjs`.

## 7. Orden sugerido en la sesión de GHL

1. Confirmar con Rodrigo la sub-cuenta (y qué es "8D").
2. `python3 agendaria-ghl/ghl_provision.py check` (con las variables de entorno cargadas).
3. **Esperar las respuestas del cuestionario.** Recién entonces reemplazar los datos demo de `config/leguizamon.json` por los reales, correr `validate` y `kb`, y después `plan` y `apply`.
4. Cargar la base de conocimiento y los prompts en los agentes; armar los workflows (README y manual).
5. Solo si Rodrigo lo pide: `import-demo` (los contactos ficticios entran con DND, los turnos sin notificación).
