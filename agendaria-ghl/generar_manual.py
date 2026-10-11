#!/usr/bin/env python3
"""Genera MANUAL_GHL_PASO_A_PASO.txt (configuración manual de GHL, click por click) y
data/demo/ghl_contactos_import.csv (contactos demo listos para importar en GHL).

    python3 generar_manual.py

Los datos (calendarios, horarios, campos, base de conocimiento, prompts) salen de la
configuración y de los archivos del kit, así el manual nunca queda desactualizado.
"""
import csv
import re

import ghl_provision as gp

OUT_TXT = gp.ROOT / "MANUAL_GHL_PASO_A_PASO.txt"
OUT_CSV = gp.DEMO_DIR / "ghl_contactos_import.csv"
LINE = "=" * 78
SUB = "-" * 78


def prompt_block(path):
    text = path.read_text(encoding="utf-8")
    match = re.search(r"```\n(.*?)\n```", text, re.S)
    return match.group(1).strip()


def welcome_message(path):
    match = re.search(r"## Mensaje de bienvenida\n\n> (.+)", path.read_text(encoding="utf-8"))
    return match.group(1).strip() if match else ""


def field_type_label(data_type):
    return {"TEXT": "Single Line (Texto de una línea)", "LARGE_TEXT": "Multi Line (Texto de varias líneas)",
            "SINGLE_OPTIONS": "Dropdown (Single) / Lista desplegable"}[data_type]


def section_fields(config):
    lines = []
    for n, body in enumerate(gp.custom_field_payloads(config), 1):
        lines.append(f"  {n:2d}. Nombre: {body['name']}")
        lines.append(f"      Tipo:   {field_type_label(body['dataType'])}")
        if body.get("options"):
            lines.append("      Opciones (una por renglón, en este orden):")
            lines += [f"        - {o}" for o in body["options"]]
        lines.append(f"      Clave interna esperada: {body['fieldKey']}")
        lines.append("")
    return "\n".join(lines)


def section_tags():
    return "\n".join(f"  {n:2d}. {t}" for n, t in enumerate(gp.TAGS, 1))


def section_calendars(config):
    rules = config["reglas_agenda"]
    lines = []
    for n, (service, sede, blocks) in enumerate(gp.calendar_specs(config), 1):
        name = gp.calendar_name(service, sede)
        lines += [
            SUB,
            f"CALENDARIO {n:02d} de {len(gp.calendar_specs(config))}: {name}",
            SUB,
            f"  Nombre del calendario ...... {name}",
            f"  Descripción ................ {service['nombre']} en {sede['nombre']}. Turno a nombre del niño/a.",
            f"  Usuario asignado ........... Dra. Claudia Leguizamón",
            f"  Ubicación (Meeting location) {sede['direccion']}",
            f"  Duración del turno ......... {service['duracion_min']} minutos",
            f"  Intervalo entre turnos ..... {service['duracion_min']} minutos",
            f"  Aviso mínimo para reservar . {rules['aviso_minimo_horas']} horas",
            f"  Rango de reserva ........... {rules['ventana_reserva_dias']} días hacia adelante (regla de 48 h)",
            f"  Turnos por horario ......... {rules['turnos_por_horario']}",
            "  Confirmación automática .... DESACTIVADA (el turno entra como 'Unconfirmed' = preturno)",
            "  Horarios (Availability / Office hours):",
        ]
        for day in [1, 2, 3, 4, 5, 6, 0]:
            ranges = [f"{b['desde']} a {b['hasta']}" for b in blocks if day in b["dias"]]
            lines.append(f"      {gp.DAY_NAMES[day].capitalize():<10} {' y '.join(ranges) if ranges else 'NO DISPONIBLE (apagar el día)'}")
        lines.append("")
    return "\n".join(lines)


def demo_contacts_csv(config):
    sedes = {k: s["nombre"] for k, s in gp.sedes_by_key(config).items()}
    patients = gp.read_csv("pacientes.csv")
    children = {}
    for p in patients:
        children.setdefault(p["responsable_id"], []).append(p)
    rows = []
    for r in gp.read_csv("responsables.csv"):
        kids = children[r["id"]]
        rows.append({
            "First Name": r["nombre"], "Last Name": r["apellido"], "Phone": r["telefono"], "Email": r["email"],
            "Tags": f"agendaria,{gp.DEMO_TAG}",
            "Nombre del hijo/a": f"{kids[0]['nombre']} {kids[0]['apellido']}",
            "Fecha de nacimiento del hijo/a": kids[0]["fecha_nacimiento"],
            "Otros hijos/as registrados": "; ".join(f"{k['nombre']} {k['apellido']} ({k['fecha_nacimiento']})" for k in kids[1:]),
            "Parentesco del responsable": r["parentesco"],
            "Sede preferida": sedes[r["sede_habitual"]],
            "Cobertura": "Seguro" if r["seguro"] else "Particular",
            "Seguro médico": r["seguro"],
            "Idioma preferido": r["idioma"],
        })
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def sample_turnos():
    turnos = [t for t in gp.read_csv("turnos.csv") if t["estado"] == "atendido"][-10:]
    patients = {p["id"]: p for p in gp.read_csv("pacientes.csv")}
    resp = {r["id"]: r for r in gp.read_csv("responsables.csv")}
    lines = []
    for t in turnos:
        p, r = patients[t["paciente_id"]], resp[t["responsable_id"]]
        lines.append(f"  - {t['inicio'].replace('T', ' ')} · {t['servicio_nombre']} · {t['sede_nombre']} · "
                     f"niño/a {p['nombre']} {p['apellido']} · responsable {r['nombre']} {r['apellido']} "
                     f"({r['telefono']}) · estado: Showed")
    return "\n".join(lines)


def build(config):
    sena = config["sena"]
    cuenta = sena["cuenta"]
    roles = {r["rol"]: r for r in config["roles"]}
    voz, wa = gp.ROOT / "prompts" / "agente_voz.md", gp.ROOT / "prompts" / "agente_whatsapp.md"
    n_contacts = demo_contacts_csv(config)
    n_cal = len(gp.calendar_specs(config))
    return f"""{LINE}
AGENDAR.IA · DRA. CLAUDIA LEGUIZAMÓN
MANUAL DE CONFIGURACIÓN DE GOHIGHLEVEL (GHL) — PASO A PASO, CLICK POR CLICK
Capa 1 · Versión DEMO (datos ficticios)
{LINE}

CÓMO USAR ESTE MANUAL
- Seguí las partes en orden. Cada parte termina con un CONTROL: no avances si el control falla.
- Lo que está entre comillas "así" es texto exacto para copiar y pegar.
- Los nombres de botones están en inglés y español porque GHL los muestra según el idioma de tu
  usuario. Pueden variar levemente según la versión o la marca blanca de tu agencia: buscá el más parecido.
- Tiempo total estimado: 4 a 6 horas de trabajo + 24 a 48 h de espera de aprobación de Meta.
- Nada de este manual requiere token ni programación.

ÍNDICE
  PARTE 0  · Antes de empezar (qué tener a mano)
  PARTE 1  · Mails en Google Workspace
  PARTE 2  · Crear la sub-cuenta de la Dra.
  PARTE 3  · Cargar saldo en la billetera
  PARTE 4  · Perfil del negocio y zona horaria
  PARTE 5  · Usuarios y permisos (Dra. + Secretaría)
  PARTE 6  · Campos personalizados (custom fields)
  PARTE 7  · Etiquetas (tags)
  PARTE 8  · Calendarios ({n_cal})
  PARTE 9  · Teléfono para llamadas (Twilio)
  PARTE 10 · WhatsApp (Meta)
  PARTE 11 · Plantillas de WhatsApp
  PARTE 12 · Base de conocimiento de la IA
  PARTE 13 · Bot de WhatsApp (Conversation AI)
  PARTE 14 · Agente de voz (Voice AI)
  PARTE 15 · Workflows (automatizaciones)
  PARTE 16 · Código Rojo (procedimiento manual)
  PARTE 17 · Pacientes demo (importar CSV)
  PARTE 18 · Pruebas finales
  PARTE 19 · Errores frecuentes
  ANEXO A  · Base de conocimiento (texto completo)
  ANEXO B  · Prompt del bot de WhatsApp
  ANEXO C  · Prompt del agente de voz


{LINE}
PARTE 0 · ANTES DE EMPEZAR
{LINE}
Tené a mano:
  [ ] Acceso de administrador a la agencia de GHL donde vas a crear la sub-cuenta.
  [ ] Tarjeta de crédito para la billetera de GHL (USD 25–50) y para Twilio (USD 20).
  [ ] Acceso de administrador a la Consola de Google Workspace de rgrlk.com.
  [ ] Acceso de administrador a un Meta Business (Facebook Business Manager) para WhatsApp.
  [ ] Un celular a mano para recibir códigos de verificación.
  [ ] Este manual y el archivo ghl_contactos_import.csv (Parte 17).


{LINE}
PARTE 1 · MAILS EN GOOGLE WORKSPACE (rgrlk.com)
{LINE}
1. Abrí https://admin.google.com e ingresá con tu usuario administrador.
2. Menú de la izquierda → "Directorio" (Directory) → "Usuarios" (Users).
3. Click en "Agregar un usuario nuevo" (Add new user).
4. Completá:
     Nombre: "Claudia"   Apellido: "Leguizamón"
     Correo principal: "DraLeguizamon.AgendarIA"  @rgrlk.com
5. Contraseña: dejá "Generar automáticamente" o poné una propia. Click "Agregar usuario nuevo".
6. Guardá la contraseña en tu gestor de contraseñas.
7. Repetí del paso 3 al 6 para Secretaría:
     Nombre: "Secretaría"   Apellido: "Leguizamón"
     Correo principal: "SecretariaLeguizamon.AgendarIA"  @rgrlk.com
   ALTERNATIVA SIN LICENCIA EXTRA: en tu propio usuario → "Información del usuario" →
   "Direcciones de correo electrónico alternativas" → agregar el alias "SecretariaLeguizamon.AgendarIA".
   Los mails de GHL a Secretaría te llegarán a vos.
8. Entrá una vez a cada casilla nueva (https://mail.google.com) para activarla.
CONTROL: podés abrir la bandeja de DraLeguizamon.AgendarIA@rgrlk.com.


{LINE}
PARTE 2 · CREAR LA SUB-CUENTA DE LA DRA.
{LINE}
1. Entrá a GHL con tu usuario de agencia.
2. Arriba a la izquierda, si estás dentro de una sub-cuenta, click en su nombre → "Switch to Agency
   View" / "Cambiar a vista de agencia".
3. Menú izquierdo → "Sub-Accounts" (Sub-cuentas).
4. Arriba a la derecha → botón "+ Create Sub-Account" / "+ Crear sub-cuenta".
5. Elegí "Blank" / "Regular Account" (cuenta en blanco, sin snapshot). Click "Next"/"Siguiente".
6. Si pregunta por plantilla de negocio, elegí la opción manual ("I'll add details manually").
7. Completá:
     Business Name ........ "Agendar.IA – Dra. Claudia Leguizamón"
     Email ................ "DraLeguizamon.AgendarIA@rgrlk.com"
     Phone ................ el teléfono de la Secretaría (o el tuyo para la demo)
     Address .............. "Av. San Blas km 3" · City "Ciudad del Este" · Country "Paraguay"
     Time Zone ............ "(GMT-03:00) America/Asuncion"
     Language ............. "Español"
8. Click "Save" / "Guardar".
9. Volvé a "Sub-Accounts" y abrí la nueva (click en "Switch to sub-account" o en su nombre).
CONTROL: arriba a la izquierda se ve "Agendar.IA – Dra. Claudia Leguizamón".


{LINE}
PARTE 3 · CARGAR SALDO EN LA BILLETERA
{LINE}
IMPORTANTE: GHL no transfiere saldo entre billeteras. Esta sub-cuenta se recarga con tarjeta.
El agente de voz, el bot de WhatsApp y los mensajes se descuentan de esta billetera.
Con saldo cero NO funcionan.
1. Dentro de la sub-cuenta → abajo a la izquierda "Settings" / "Configuración" (engranaje).
2. Menú de configuración → "Billing" / "Facturación".
3. Pestaña "Wallet & Transactions" / "Billetera y transacciones".
4. Botón "Add Balance" / "Agregar fondos".
5. Monto: "25" (demo) o "50" (si van a probar mucho la voz). Elegí la tarjeta de la agencia o
   "Add new card". Click "Add"/"Confirm".
6. En la misma pantalla buscá "Auto Recharge" / "Recarga automática" → activar:
     "When balance falls below" / "Cuando el saldo baje de": "10"
     "Recharge amount" / "Monto a recargar": "25"
   Click "Save".
CONTROL: el saldo aparece arriba y en la lista figura la transacción.


{LINE}
PARTE 4 · PERFIL DEL NEGOCIO Y ZONA HORARIA
{LINE}
1. Settings → "Business Profile" / "Perfil de la empresa".
2. Verificá: nombre, mail, teléfono, dirección y "Time Zone: America/Asuncion".
3. Más abajo, "Location ID": copialo y guardalo (sirve si después querés automatizar).
4. Click "Update Information" / "Actualizar".
CONTROL: la zona horaria dice America/Asuncion (UTC-3).


{LINE}
PARTE 5 · USUARIOS Y PERMISOS
{LINE}
5.1 DRA. CLAUDIA LEGUIZAMÓN (Administradora — acceso total)
1. Settings → "My Staff" / "Mi personal" (en algunas versiones "Team").
2. Botón "+ Add Employee" / "+ Agregar empleado".
3. Pestaña "User Info": First Name "Claudia" · Last Name "Leguizamón" ·
   Email "{roles['Administradora']['email']}" · Phone (opcional) · Password (temporal).
4. Pestaña "User Roles": User Type "Account" · User Role "Admin".
5. Pestaña "Call & Voicemail Settings": dejar por defecto.
6. Pestaña "User Availability": "Ciudad del Este" / zona America/Asuncion.
7. Click "Save".

5.2 SECRETARÍA (solo turnos y autorización manual de pagos)
1. "+ Add Employee".
2. User Info: First Name "Secretaría" · Last Name "Leguizamón" ·
   Email "{roles['Secretaría']['email']}".
3. User Roles: User Type "Account" · User Role "User".
4. Pestaña "User Permissions" / "Permisos": DESACTIVAR TODO y activar SOLO:
     [x] Calendars / Calendarios (y "Appointments" si aparece separado)
     [x] Conversations / Conversaciones
     [x] Contacts / Contactos
   y abajo activar "Only Assigned Data" / "Solo datos asignados" (así ve únicamente los chats y
   contactos que el sistema le asigna cuando llega un comprobante).
   Todo lo demás apagado: Dashboard, Opportunities, Marketing, Automation/Workflows, Payments,
   Reporting, Settings, AI Agents, Sites, Memberships, Reputation.
5. Click "Save".
6. Cada usuaria recibe un mail de GHL: que entre, cree su contraseña y descargue la app
   "LeadConnector" en el celular (iOS/Android) para confirmar turnos desde ahí.
CONTROL: ambas aparecen en My Staff; Secretaría, al entrar, solo ve Calendarios, Conversaciones y Contactos.

QUÉ HACE SECRETARÍA EN EL DÍA A DÍA (para explicárselo):
  - Llega un comprobante → GHL le asigna la conversación y le crea una tarea.
  - Verifica en el banco que entraron {gp.format_gs(sena['monto_gs'])} → abre el turno en Calendarios → cambia el
    estado de "Unconfirmed" a "Confirmed". Eso es la autorización manual: el sistema avisa al paciente.
  - Turnos por seguro: verifica la cobertura y confirma igual.
""" + f"""

{LINE}
PARTE 6 · CAMPOS PERSONALIZADOS
{LINE}
Para qué: el contacto en GHL es el responsable (mamá/papá); el niño/a va en estos campos.
1. Settings → "Custom Fields" / "Campos personalizados".
2. Pestaña "Contact" (no "Opportunity").
3. Opcional: "+ Add Folder" → nombre "Agendar.IA" para agruparlos.
4. Por cada campo de la lista: "+ Add Field" → elegir el tipo → "Next" → escribir el nombre
   EXACTO → si es lista, agregar las opciones → "Save".
   Revisá que la "clave" (Unique Key) quede igual a la indicada; si GHL propone otra, editala.

{section_fields(config)}
CONTROL: hay {len(gp.CUSTOM_FIELDS)} campos nuevos en la carpeta Agendar.IA.


{LINE}
PARTE 7 · ETIQUETAS (TAGS)
{LINE}
1. Settings → "Tags" / "Etiquetas" (o Contacts → Tags, según versión).
2. "+ New Tag" / "+ Nueva etiqueta" → escribir el nombre exacto → "Save". Repetir para cada una:

{section_tags()}

Para qué sirve cada una:
  agendaria ......................... todo contacto que entra por Agendar.IA
  agendaria-voz / -whatsapp ......... canal por el que llegó
  agendaria-lista-espera ............ pidió turno fuera de las 48 h
  agendaria-urgencia ................ el bot detectó posible urgencia
  agendaria-pendiente-confirmacion .. turno con seguro esperando a Secretaría
  agendaria-pendiente-pago .......... preturno particular esperando comprobante
  agendaria-comprobante-recibido .... mandó el comprobante, Secretaría debe verificar
  agendaria-handoff-secretaria ...... el bot pasó la conversación a una persona
  codigo-rojo-afectado .............. turno movido por Código Rojo
  {gp.DEMO_TAG} ..................... pacientes ficticios (excluir de todos los workflows)
CONTROL: las {len(gp.TAGS)} etiquetas existen.


{LINE}
PARTE 8 · CALENDARIOS ({n_cal})
{LINE}
Un calendario por servicio y sede. Todos asignados a la Dra., así GHL impide que se superpongan
turnos de distintas sedes o servicios.

CÓMO CREAR CADA UNO (repetir {n_cal} veces con los datos de abajo):
1. Menú izquierdo → "Calendars" / "Calendarios" → arriba a la derecha "Calendar Settings" /
   "Configuración de calendarios" (ícono engranaje).
2. Botón "+ Create Calendar" / "+ Crear calendario".
3. Tipo: "Personal Booking" / "Reserva personal" (para un solo profesional). Si solo ves
   "Simple Calendar" o "Event", elegí ese. Click "Get Started"/"Next".
4. Sección "Meeting Details" / "Detalles":
     - Calendar name: el NOMBRE exacto de abajo.
     - Description: la DESCRIPCIÓN de abajo.
     - Team member / Usuario: "Claudia Leguizamón".
     - Meeting location: "Custom" / "Personalizada" → pegar la UBICACIÓN.
     - Duración: la DURACIÓN.
     - Color: uno distinto por sede (CDE azul, Hernandarias verde, Santa Rita naranja, Virtual violeta).
   Click "Next"/"Save and continue".
5. Sección "Availability" / "Disponibilidad":
     - "Office Hours" / "Horario": por cada día, encender o apagar y cargar las franjas.
       Para dos franjas el mismo día: "+ Add hours" / "+".
     - "Slot Interval" / "Intervalo": el INTERVALO.
     - "Minimum Scheduling Notice" / "Aviso mínimo": el AVISO MÍNIMO.
     - "Date Range" / "Rango de fechas": "2 days into the future" / "2 días a futuro".
     - "Maximum bookings per slot" / "Reservas por horario": 1.
     - Buffer antes/después: 0.
   Click "Next"/"Save".
6. Sección "Confirmation" / "Confirmación" o "Additional options":
     - "Auto Confirm" / "Confirmar automáticamente": APAGADO.
     - "Allow Google Calendar sync": opcional.
   Click "Save".
7. En la lista, copiá el link público del calendario (ícono de cadena): lo vas a necesitar en
   la Parte 12 para el "enlace de reserva web".

{section_calendars(config)}
CONTROL: en Calendar Settings hay {n_cal} calendarios "AgendarIA · …", todos activos y asignados a la Dra.

ENLACE DE RESERVA WEB PARA PACIENTES (opcional pero recomendado):
1. Calendars → Calendar Settings → pestaña "Groups" / "Grupos" → "+ Create Group".
2. Nombre "Agendar.IA – Dra. Leguizamón" · slug "dra-leguizamon" → "Save".
3. En cada calendario: editar → "Group" → elegir ese grupo → "Save".
4. Copiá el link del grupo: muestra todos los servicios en una página. Ese es el enlace web
   que el bot ofrece como alternativa a seguir por WhatsApp.


{LINE}
PARTE 9 · TELÉFONO PARA LLAMADAS (TWILIO) — SOLO VOZ
{LINE}
Twilio aporta la línea telefónica para el agente de voz. Meta no interviene acá.

9.1 CUENTA Y NÚMERO EN TWILIO
1. Abrí https://www.twilio.com → "Sign up" → registrate con tu mail → verificá el mail y tu celular.
2. Preguntas de bienvenida: "Voice" · "With code: No" / "Other".
3. Pasá la cuenta de prueba a paga: Console → "Upgrade" (arriba) → cargá tarjeta y USD 20.
4. Console → menú izquierdo "Phone Numbers" → "Manage" → "Buy a number".
5. Country: "Paraguay (+595)". Capabilities: marcar "Voice". Click "Search".
   - Si aparecen números: elegí uno → "Buy" → si pide "Regulatory Bundle", completá con los datos
     de la empresa/persona (documento, dirección) → esperá la aprobación (1–3 días hábiles).
   - Si NO aparecen números de Paraguay: alternativa → comprá un número con voz de otro país
     (ej. EE.UU.) solo para la demo, o pedí a la compañía telefónica de la Dra. el desvío de llamadas
     de su línea actual hacia ese número.
6. Console → página principal → copiá "Account SID" y "Auth Token" (click en "Show").

9.2 CONECTAR TWILIO A GHL
1. GHL sub-cuenta → Settings → "Phone System" / "Sistema telefónico" (o "Phone Numbers").
2. Si aparece "LeadConnector Phone" activo, buscá la opción "Switch to Twilio" / "Integrate Twilio".
3. Pegá "Account SID" y "Auth Token" → "Connect"/"Save".
4. En la lista de números debe aparecer el número de Twilio → click → "Assign"/"Default number".
CONTROL: llamás al número desde tu celular y suena (o atiende el buzón por defecto).


{LINE}
PARTE 10 · WHATSAPP (META, DIRECTO DESDE GHL) — Twilio NO interviene
{LINE}
Requisitos: Meta Business verificado (o en proceso), un número que NO esté usándose en la app de
WhatsApp común (puede ser el de Twilio de la Parte 9; nunca el celular personal de la Dra.).
1. GHL sub-cuenta → Settings → "WhatsApp".
2. Si pide contratar el servicio de WhatsApp de GHL, aceptá (se cobra de la billetera).
3. Click "Connect" / "Conectar" → se abre la ventana de Meta (embedded signup).
4. Iniciá sesión con el Facebook administrador del Meta Business.
5. Elegí el Meta Business existente (o creá uno con el nombre "Agendar.IA – Dra. Claudia Leguizamón").
6. "WhatsApp Business Account": crear nueva → nombre "Dra. Claudia Leguizamón".
7. Perfil: nombre visible "Dra. Claudia Leguizamón · Turnos" · categoría "Medical & Health" ·
   descripción "Agenda de turnos pediátricos".
8. Número: "Add a new number" → ingresá el número → verificación por "Phone call" (si es Twilio, la
   llamada la atiende Twilio: configurá en Twilio el número para reenviar la llamada a tu celular o
   revisá el log de la llamada en Twilio para escuchar el código).
9. Aceptá los permisos → "Finish". Volvés a GHL.
10. En Settings → WhatsApp el número figura "Connected".
11. Meta Business Manager → "Business settings" → "Security center" → iniciar la verificación del
    negocio si no está hecha (sube el límite de mensajes).
CONTROL: desde tu celular escribís "hola" al número y el mensaje aparece en GHL → Conversations.


{LINE}
PARTE 11 · PLANTILLAS DE WHATSAPP (las aprueba Meta en 24–48 h)
{LINE}
Se usan para escribirle al paciente cuando pasaron más de 24 h desde su último mensaje
(recordatorios, Código Rojo). Dentro de las 24 h el bot responde libremente.
1. GHL → Settings → WhatsApp → pestaña "Templates" / "Plantillas" → "+ Create Template".
2. Por cada plantilla: Name (exacto, minúsculas) · Category "Utility" · Language "Spanish (SPA)" ·
   Body (texto de abajo; las variables {{{{1}}}}, {{{{2}}}}… se agregan con "Add variable") ·
   ejemplos de variables → "Submit".

  a) datos_sena
     "Hola {{{{1}}}}, reservamos el preturno de {{{{2}}}}. Para confirmarlo, la Dra. solicita una seña de
     Gs. 100.000 que se descuenta de la consulta. Transferí a: {cuenta['banco']}, cuenta N.º
     {cuenta['numero']}, titular {cuenta['titular']}, alias {cuenta['alias']}. Enviános el
     comprobante por acá dentro de las 2 horas. ¡Gracias!"
     Variables: 1 = nombre del responsable · 2 = turno (servicio, día y hora)

  b) confirmacion_turno
     "¡Listo, {{{{1}}}}! El turno de {{{{2}}}} quedó confirmado para {{{{3}}}} en {{{{4}}}}. Si necesitás
     cambiarlo, escribinos por acá."
     Variables: 1 = responsable · 2 = niño/a · 3 = día y hora · 4 = sede

  c) recordatorio_turno
     "Hola {{{{1}}}}, te recordamos el turno de {{{{2}}}} mañana {{{{3}}}} en {{{{4}}}}. Respondé SÍ para
     confirmar asistencia o escribinos si necesitás cambiarlo."
     Variables: 1 = responsable · 2 = niño/a · 3 = hora · 4 = sede

  d) propuesta_reprogramacion
     "Hola {{{{1}}}}, la Dra. Claudia Leguizamón tuvo un imprevisto médico y debemos mover el turno de
     {{{{2}}}}. Opciones: {{{{3}}}} · {{{{4}}}} · {{{{5}}}}. Respondé con la opción que prefieras o
     escribinos si ninguna te sirve. La seña pagada se mantiene."
     Variables: 1 = responsable · 2 = turno original · 3, 4, 5 = propuestas
CONTROL: las 4 plantillas figuran "Approved".


{LINE}
PARTE 12 · BASE DE CONOCIMIENTO DE LA IA
{LINE}
1. Menú izquierdo → "AI Agents" / "Agentes de IA" (en algunas versiones "AI Employee").
2. Pestaña "Knowledge Base" / "Base de conocimiento" → "+ Create Knowledge Base".
3. Nombre: "AgendarIA · Base Dra. Leguizamón" → "Create".
4. "+ Add" / "Agregar fuente" → elegí "Rich Text" / "Texto" (o "FAQ"/"Documento").
5. Título "Consultorio Dra. Leguizamón" → pegá el texto COMPLETO del ANEXO A → "Save".
6. Cuando tengas el enlace del grupo de calendarios (Parte 8), editá la línea "Reserva por enlace
   web: PENDIENTE" y reemplazá PENDIENTE por el enlace.
7. Modo vacaciones: cuando la Dra. se ausente, agregá al principio del texto:
   "AUSENCIA ACTIVA: {config['clinica']['ausencia']['mensaje']}" y borralo al volver.
CONTROL: la base figura con 1 fuente cargada.


{LINE}
PARTE 13 · BOT DE WHATSAPP (CONVERSATION AI)
{LINE}
1. AI Agents → "Conversation AI" → "+ Create Bot" / "+ Crear agente".
2. Nombre: "Agendar.IA – WhatsApp Dra. Leguizamón".
3. Pestaña "Bot Settings" / "Configuración":
     - Mode / Modo: "Auto Pilot" (responde solo).
     - Channels / Canales: marcar SOLO "WhatsApp".
     - Bot response delay / Espera: 5 segundos.
     - "Stop bot when human replies" / "Detener si responde una persona": ACTIVADO.
     - "Reactivate bot after": 12 horas.
     - Knowledge base: "AgendarIA · Base Dra. Leguizamón".
     - Transcripción de audios: activar si aparece.
4. Pestaña "Personality"/"Prompt"/"Instructions": pegá el texto COMPLETO del ANEXO B.
5. Pestaña "Goals"/"Objetivo": "Appointment Booking" / "Reserva de turnos" → seleccionar TODOS los
   calendarios "AgendarIA · …".
6. Pestaña "Actions"/"Acciones" (agregar cada una con "+ Add Action"):
     a) Update Contact Field → mapear: Nombre del hijo/a, Fecha de nacimiento del hijo/a,
        Parentesco del responsable, Servicio solicitado, Sede preferida, Cobertura, Seguro médico,
        Idioma preferido, Motivo (administrativo).
     b) Add Tag "agendaria-pendiente-pago" → condición: "cuando se reserva un turno particular".
     c) Add Tag "agendaria-comprobante-recibido" → condición: "cuando el paciente envía la foto o
        archivo del comprobante de transferencia".
     d) Add Tag "agendaria-lista-espera" → condición: "cuando pide turno para más allá de 48 horas".
     e) Add Tag "agendaria-urgencia" → condición: "cuando se detecta una posible urgencia médica".
     f) Remove Tag "codigo-rojo-afectado" → condición: "cuando eligió nuevo horario o pasó a lista de espera".
     g) Human Handoff / Stop Bot + Assign to "Secretaría" → condición: "pide hablar con una persona,
        reclama, consulta por recetas o medicamentos, o pregunta algo que no está en la base".
7. Click "Save" y activá el bot (switch "Active"/"On").
CONTROL: escribís "hola" al WhatsApp y responde Sofía en español.


{LINE}
PARTE 14 · AGENTE DE VOZ (VOICE AI)
{LINE}
1. AI Agents → "Voice AI" → "+ Create Agent" / "+ Crear agente" → "Start from scratch".
2. Agent name: "Agendar.IA – Recepción Dra. Leguizamón".
3. Business name: "Consultorio Pediátrico Dra. Claudia Leguizamón".
4. Voice: elegí una voz femenina en español latinoamericano; escuchá la muestra; velocidad normal o
   levemente lenta.
5. Language: "Spanish".
6. Welcome message / Saludo inicial: "{welcome_message(voz)}"
7. Agent prompt / Instrucciones: pegá el texto COMPLETO del ANEXO C.
8. Knowledge base: "AgendarIA · Base Dra. Leguizamón".
9. Phone number: elegí el número de Twilio (Parte 9).
10. Working hours: 24/7.
11. Max call duration: 8 minutos · Idle reminder: 8 segundos, mensaje "¿Sigue ahí?", cortar después
    de 3 recordatorios.
12. Actions:
     a) Book Appointment → todos los calendarios "AgendarIA · …".
     b) Update Contact Field → los mismos campos que en el bot de WhatsApp.
     c) Call Transfer → número de Secretaría → condición: urgencia, pide hablar con una persona,
        reclamo, recetas o medicamentos, dato no disponible.
     d) Add Tag "agendaria-lista-espera" / "agendaria-urgencia" con las mismas condiciones del bot.
13. Post-call: activar "Call summary" y "Transcript" (se guardan en la conversación del contacto).
14. "Save" → "Publish"/"Activate".
CONTROL: llamás al número, atiende Sofía, pedís un turno y aparece en el calendario como Unconfirmed.


{LINE}
PARTE 15 · WORKFLOWS (AUTOMATIZACIONES)
{LINE}
Cómo crear cada workflow:
  Menú izquierdo → "Automation" / "Automatización" → "Workflows" → "+ Create Workflow" →
  "Start from Scratch" → arriba a la izquierda cambiá el nombre → "Add New Trigger" → configurar
  → "Save Trigger" → click en "+" debajo para agregar acciones → al final "Save" y switch "Publish".
En TODOS los triggers agregá el filtro: "Contact Tag" → "does not include" / "no incluye" → "{gp.DEMO_TAG}".

15.1 · "AgendarIA · Preturno particular"
  Trigger: "Appointment Status" → filtros: "Calendar is any of" (todos los AgendarIA) y
           "Appointment status is" → "New" / "Unconfirmed".
  Acciones:
   1. "If/Else" → condición: Contact field "Cobertura" is "Particular".
      Rama SÍ:
       2. "Add Contact Tag" → "agendaria-pendiente-pago".
       3. "Send WhatsApp" → plantilla "datos_sena" (o mensaje libre con el mismo texto).
       4. "Wait" → "Time delay" → 2 horas.
       5. "If/Else" → Contact Tag includes "agendaria-comprobante-recibido".
          SÍ: fin (Secretaría verifica).
          NO: 6. "Update Appointment Status" → "Cancelled".
              7. "Send WhatsApp" → "No recibimos el comprobante y liberamos el horario para otra
                 familia. Si querés, te anoto en lista de espera o buscamos otro turno 🙂"
              8. "Remove Contact Tag" → "agendaria-pendiente-pago".
      Rama NO (seguro):
       2. "Add Contact Tag" → "agendaria-pendiente-confirmacion".
       3. "Add Task" → asignada a Secretaría → "Verificar cobertura de seguro y confirmar turno".
  Nota: si el turno se reservó con menos de 5 h de anticipación, Secretaría controla el comprobante
  a mano (regla: hasta 3 h antes del turno).

15.2 · "AgendarIA · Comprobante recibido"
  Trigger: "Contact Tag" → "Tag added" → "agendaria-comprobante-recibido".
  Acciones:
   1. "Assign to User" → "Secretaría" (así la ve con "solo datos asignados").
   2. "Add Task" → asignada a Secretaría → título "Verificar seña Gs. 100.000" → descripción
      "Revisar en el banco y, si ingresó, cambiar el turno a Confirmed." → vencimiento 1 hora.
   3. "Internal Notification" → "In-App" y "Email" a Secretaría → "Llegó un comprobante de seña".

15.3 · "AgendarIA · Turno confirmado"
  Trigger: "Appointment Status" → "Calendar is any of" (AgendarIA) → status "Confirmed".
  Acciones:
   1. "Remove Contact Tag" → "agendaria-pendiente-pago", "agendaria-comprobante-recibido",
      "agendaria-pendiente-confirmacion".
   2. "Send WhatsApp" → plantilla "confirmacion_turno".

15.4 · "AgendarIA · Recordatorios"
  Trigger: "Appointment Status" → status "Confirmed".
  Acciones:
   1. "Wait" → "Event / Appointment time" → "24 hours before".
   2. "Send WhatsApp" → plantilla "recordatorio_turno".
   3. "Wait" → "Event / Appointment time" → "2 hours before".
   4. "Send WhatsApp" → "Te esperamos en 2 horas en {{{{appointment.location}}}} 🙂".

15.5 · "AgendarIA · Lista de espera"
  Trigger: "Contact Tag" → added → "agendaria-lista-espera".
  Acciones: 1. "Add Task" → Secretaría → "Ofrecer turno cuando se libere un horario".

15.6 · "AgendarIA · Alerta urgencia"
  Trigger: "Contact Tag" → added → "agendaria-urgencia".
  Acciones:
   1. "Internal Notification" → "SMS" y "In-App" a la Dra. y a Secretaría → "Posible urgencia:
      {{{{contact.name}}}} {{{{contact.phone}}}}. El bot ya derivó a urgencias."
   2. "Assign to User" → Secretaría.

15.7 · "AgendarIA · Código Rojo"
  Trigger: "Contact Tag" → added → "codigo-rojo-afectado".
  Acciones:
   1. "Send WhatsApp" → plantilla "propuesta_reprogramacion" (variables: Código Rojo · turno original
      y propuestas 1, 2, 3 de los campos personalizados).
   2. "Wait" → "Wait for reply"/"Hasta que responda" con tiempo máximo 30 minutos.
   3. "If/Else" → respondió:
        SÍ: fin (el bot gestiona la respuesta).
        NO: "Add Task" → Secretaría → "Llamar: turno movido por Código Rojo sin respuesta".
CONTROL: los 7 workflows figuran "Published".


{LINE}
PARTE 16 · CÓDIGO ROJO (PROCEDIMIENTO MANUAL)
{LINE}
El botón rojo automático (página con PIN) necesita el token de la API. Mientras tanto, se hace así
en 5 minutos desde la app o la web de GHL:
1. LA DRA. (o Secretaría por pedido de ella): Calendars → vista "Day" → arrastrá sobre el rango
   afectado (2, 3, 4 o 5 horas desde ahora) → "Block off time" / "Bloquear horario" → título
   "Código Rojo — Cesárea / Parto / Urgencia / Imprevisto" → "Save". Nadie más puede reservar ahí.
2. SECRETARÍA: Calendars → "Appointments" / "Lista de citas" → filtrar el día y el rango.
3. Para cada turno afectado:
   a) Abrí el turno → cambiá estado a "Cancelled" (NO borrar).
   b) Abrí el contacto → completá los campos:
        "Código Rojo · turno original": ej. "Consulta por enfermedad · lunes 12/10 15:00"
        "Código Rojo · propuesta 1/2/3": 3 horarios libres del mismo calendario en las próximas 48 h.
   c) Agregá una nota: "Código Rojo (motivo). Turno cancelado sin borrar."
   d) Agregá la etiqueta "codigo-rojo-afectado" → el workflow 15.7 envía el WhatsApp.
4. La seña pagada se mantiene: el nuevo turno se confirma sin pedir otra.


{LINE}
PARTE 17 · PACIENTES DEMO (IMPORTAR CSV)
{LINE}
Archivo: ghl_contactos_import.csv ({n_contacts} responsables ficticios; teléfonos +595900…,
mails @example.com; los hijos van en los campos personalizados).
1. Menú izquierdo → "Contacts" / "Contactos" → arriba a la derecha "Import" / "Importar".
2. "Upload file" → elegí ghl_contactos_import.csv → "Next".
3. Objeto: "Contacts". Acción: "Create new contacts" (crear nuevos) → "Next".
4. Mapeo de columnas: GHL reconoce First Name, Last Name, Phone, Email, Tags. Para las demás
   elegí el campo personalizado con el mismo nombre (Nombre del hijo/a, Fecha de nacimiento del
   hijo/a, Otros hijos/as registrados, Parentesco del responsable, Sede preferida, Cobertura,
   Seguro médico, Idioma preferido) → "Next".
5. Opciones: "Add tags" → "{gp.DEMO_TAG}" · NO marcar "Trigger workflows" · "Start Bulk Import".
6. Esperá el aviso de importación terminada (Contacts → "Bulk Actions" muestra el progreso).
7. MUY IMPORTANTE — bloquear mensajes a los ficticios:
   Contacts → filtro "Tag" is "{gp.DEMO_TAG}" → seleccionar todos (checkbox arriba → "Select all") →
   "Bulk Actions" / "Más" → "DND" / "No molestar" → "All channels" → "Enable" → confirmar.
8. Turnos históricos: GHL no importa citas por CSV. Los 3.562 turnos ficticios se cargan solo por API.
   Para la demo manual, creá 10 turnos de ejemplo (Calendars → "+ New Appointment"), por ejemplo:
{sample_turnos()}
CONTROL: {n_contacts} contactos con etiqueta {gp.DEMO_TAG}, todos con DND activo.


{LINE}
PARTE 18 · PRUEBAS FINALES (marcá cada una)
{LINE}
WhatsApp (desde un celular que NO sea de la Dra.):
  [ ] "hola" → responde Sofía en español.
  [ ] "hello" → responde en español, no en inglés.
  [ ] "Olá, quero marcar uma consulta" → responde en portugués.
  [ ] Pedir turno particular → ofrece 2–3 horarios de las próximas 48 h → reserva → explica la seña
      de Gs. 100.000 y manda los datos de Itaú.
  [ ] No mandar comprobante → a las 2 h el turno pasa a Cancelled y llega el aviso.
  [ ] Mandar foto de comprobante → la conversación se asigna a Secretaría y le aparece la tarea.
  [ ] Secretaría cambia a Confirmed → llega la confirmación al paciente.
  [ ] Pedir turno con seguro → no pide seña; queda pendiente de Secretaría.
  [ ] Pedir turno para dentro de 5 días → explica la regla de 48 h y ofrece lista de espera.
  [ ] Dos hijos del mismo responsable → pregunta para cuál y hace un turno por niño.
  [ ] "Mi hijo tiene la nariz tapada, ¿le hago lavado nasal?" → NO da indicación; deriva.
  [ ] "Mi bebé convulsiona" → responde solo con el mensaje de urgencia y avisa a Secretaría.
  [ ] "La receta tiene un error" → pasa a Secretaría.
  [ ] Pedir "hablar con una persona" → handoff a Secretaría.
Voz:
  [ ] Llamar → saluda Sofía → pedir turno → queda Unconfirmed en el calendario correcto.
  [ ] Decir "es urgente" → mensaje de urgencia y transferencia a Secretaría.
Código Rojo:
  [ ] Hacer el procedimiento de la Parte 16 con un turno de prueba → llega la propuesta por WhatsApp.


{LINE}
PARTE 19 · ERRORES FRECUENTES
{LINE}
- El bot no responde: billetera en cero (Parte 3), bot sin activar o canal WhatsApp no marcado.
- El agente de voz no atiende: número de Twilio no asignado al agente o cuenta Twilio en "trial".
- No aparecen horarios: el calendario tiene "Date Range" mayor a 2 días mal cargado, día apagado,
  o el turno pedido está a menos de 2 h (aviso mínimo).
- Turnos que se confirman solos: "Auto Confirm" quedó encendido en ese calendario.
- No salen los WhatsApp de recordatorio: plantilla no aprobada todavía por Meta.
- Secretaría ve todo: falta activar "Only Assigned Data" en sus permisos.
- Llegan mensajes a contactos demo: no se aplicó el DND masivo (Parte 17, paso 7).


{LINE}
ANEXO A · BASE DE CONOCIMIENTO (copiar completo en la Parte 12)
{LINE}
{gp.render_kb(config)}

{LINE}
ANEXO B · PROMPT DEL BOT DE WHATSAPP (copiar completo en la Parte 13)
{LINE}
{prompt_block(wa)}

{LINE}
ANEXO C · PROMPT DEL AGENTE DE VOZ (copiar completo en la Parte 14)
{LINE}
{prompt_block(voz)}

{LINE}
FIN DEL MANUAL · Agendar.IA · Lab.IA · RGrlk Group
{LINE}
"""


def main():
    config = gp.load_config()
    OUT_TXT.write_text(build(config), encoding="utf-8")
    print(f"Manual: {OUT_TXT.relative_to(gp.ROOT)} · CSV: {OUT_CSV.relative_to(gp.ROOT)}")


if __name__ == "__main__":
    main()
