#!/usr/bin/env python3
"""Genera MANUAL_GHL_DETALLADO.txt: versión extendida, pantalla por pantalla y campo por campo,
de toda la configuración manual de GoHighLevel para Agendar.IA (Dra. Leguizamón).

    python3 generar_manual_detallado.py

Los datos variables (calendarios, horarios, campos, etiquetas, base de conocimiento, preguntas
frecuentes, prompts) se generan desde config/leguizamon.json y los archivos del kit.
"""
import generar_manual as gm
import ghl_provision as gp

OUT = gp.ROOT / "MANUAL_GHL_DETALLADO.txt"
L = "=" * 78
S = "-" * 78
DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]


def h(title):
    return f"\n\n{L}\n{title}\n{L}\n"


def sub(title):
    return f"\n{S}\n{title}\n{S}\n"


def fields_detailed(config):
    out = []
    payloads = gp.custom_field_payloads(config)
    for n, body in enumerate(payloads, 1):
        key = body["fieldKey"].removeprefix("contact.")
        out.append(sub(f"CAMPO {n:02d} de {len(payloads)} · {body['name']}"))
        steps = [
            "Settings → Custom Fields → pestaña \"Contact\" → abrí la carpeta \"Agendar.IA\".",
            "Click en el botón \"+ Add Field\" / \"+ Agregar campo\" (arriba a la derecha).",
            f"En la grilla de tipos, click en: {gm.field_type_label(body['dataType'])}.",
            "Click \"Next\" / \"Siguiente\".",
            f"Field Name / Nombre del campo: \"{body['name']}\"",
            "Placeholder (texto de ayuda): dejar vacío.",
            "Folder / Carpeta: \"Agendar.IA\".",
        ]
        if body.get("options"):
            steps.append("Options / Opciones: escribí cada opción y presioná Enter (o \"+ Add option\") en este orden:")
            steps += [f"      · {o}" for o in body["options"]]
            steps.append("\"Allow custom values\" / \"Permitir otros valores\": APAGADO.")
        steps += [
            f"Unique Key / Clave única: debe quedar \"contact.{key}\". Si GHL propone otra, hacé click en el lápiz y corregila.",
            "Click \"Save\" / \"Guardar\".",
            "Verificá que el campo aparezca en la lista dentro de la carpeta.",
        ]
        out += [f"  {i}. {s}" if not s.startswith("      ") else s for i, s in enumerate(steps, 1)]
        usage = {
            "nombre_hijo": "Nombre y apellido del niño/a del último turno (el turno va a nombre del niño).",
            "fecha_nacimiento_hijo": "Fecha de nacimiento o edad del niño/a.",
            "hijos_adicionales": "Otros hijos del mismo responsable (nombre y fecha).",
            "parentesco_responsable": "Madre, padre, abuela, tutor, etc.",
            "servicio_solicitado": "Tipo de consulta del último pedido.",
            "sede_preferida": "Sede donde suele atenderse.",
            "cobertura": "Particular (paga seña) o Seguro (sin seña).",
            "seguro_nombre": "Nombre del seguro o convenio.",
            "idioma_preferido": "Idioma en que conversa (el bot responde igual).",
            "motivo_administrativo": "Motivo breve en palabras del responsable (nunca datos clínicos).",
            "canal_origen": "Por dónde llegó: llamada, WhatsApp, web o administración.",
            "cr_turno_original": "Código Rojo: turno que se movió.",
            "cr_propuesta_1": "Código Rojo: primera opción ofrecida.",
            "cr_propuesta_2": "Código Rojo: segunda opción ofrecida.",
            "cr_propuesta_3": "Código Rojo: tercera opción ofrecida.",
        }
        out.append(f"  Para qué sirve: {usage.get(key, '')}")
    return "\n".join(out)


def tags_detailed():
    out = []
    for n, tag in enumerate(gp.TAGS, 1):
        out.append(f"  {n:2d}. Click \"+ New Tag\" → Tag name: \"{tag}\" → \"Save\". Verificá que aparezca en la lista.")
    return "\n".join(out)


def calendars_detailed(config):
    rules = config["reglas_agenda"]
    specs = gp.calendar_specs(config)
    colors = {"cde_centro": "Azul", "hernandarias": "Verde", "santa_rita": "Naranja", "virtual": "Violeta"}
    out = []
    for n, (service, sede, blocks) in enumerate(specs, 1):
        name = gp.calendar_name(service, sede)
        slug = gp.calendar_name(service, sede).lower()
        for a, b in [("agendaria · ", "agendaria-"), (" · ", "-"), (" / ", "-"), (" ", "-"),
                     ("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")]:
            slug = slug.replace(a, b)
        out.append(sub(f"CALENDARIO {n:02d} de {len(specs)} · {name}"))
        out.append(f"  Servicio: {service['nombre']} · Sede: {sede['nombre']} · Modalidad: {service['modalidad']}")
        out.append(f"  Valor particular: {gp.format_gs(service['precio_particular_gs'])} · "
                   f"{'Acepta seguro' if service.get('acepta_seguro') else 'Solo particular'}")
        out.append("")
        out.append("  A) CREAR")
        out.append("   1. Menú izquierdo → \"Calendars\" → arriba a la derecha \"Calendar Settings\" (engranaje).")
        out.append("   2. Click \"+ Create Calendar\" → elegir \"Personal Booking\" (si no existe: \"Simple Calendar\") → \"Get Started\".")
        out.append("  B) PESTAÑA \"MEETING DETAILS\" / \"DETALLES\"")
        out.append(f"   3. Calendar Name ............ \"{name}\"")
        out.append(f"   4. Description .............. \"{service['nombre']} en {sede['nombre']}. Turno a nombre del niño/a. "
                   f"{service.get('nota', '')}\"")
        out.append(f"   5. Custom URL / Slug ........ \"{slug}\"")
        out.append(f"   6. Calendar color ........... {colors[sede['clave']]}")
        out.append("   7. Team member / Assigned to  \"Claudia Leguizamón\"")
        out.append(f"   8. Meeting Duration ......... {service['duracion_min']} mins")
        if sede["clave"] == "virtual":
            out.append("   9. Meeting Location ......... \"Google Meet\" si tenés Google conectado (Settings → Integrations);")
            out.append("                                 si no, \"Custom\" → \"Enlace de Google Meet enviado por WhatsApp\".")
        else:
            out.append(f"   9. Meeting Location ......... \"Custom\" / \"Address\" → \"{sede['direccion']}\"")
        out.append("  10. Click \"Next\" / \"Save and continue\".")
        out.append("  C) PESTAÑA \"AVAILABILITY\" / \"DISPONIBILIDAD\"")
        step = 11
        for day in DAYS_ORDER:
            day_blocks = [b for b in blocks if day in b["dias"]]
            label = gp.DAY_NAMES[day].capitalize()
            if not day_blocks:
                out.append(f"  {step}. {label:<10}: switch APAGADO (gris).")
            else:
                first = day_blocks[0]
                text = f"switch ENCENDIDO → From \"{first['desde']}\" To \"{first['hasta']}\""
                for extra in day_blocks[1:]:
                    text += f" → \"+\" agregar franja → From \"{extra['desde']}\" To \"{extra['hasta']}\""
                out.append(f"  {step}. {label:<10}: {text}.")
            step += 1
        out += [
            f"  {step}. Slot Interval / Intervalo ............. {service['duracion_min']} mins",
            f"  {step + 1}. Minimum Scheduling Notice / Aviso mín.  {rules['aviso_minimo_horas']} hours",
            f"  {step + 2}. Date Range / Rango .................... {rules['ventana_reserva_dias']} days into the future",
            f"  {step + 3}. Max bookings per slot ................. {rules['turnos_por_horario']}",
            f"  {step + 4}. Max bookings per day .................. sin límite (vacío)",
            f"  {step + 5}. Pre-buffer / Post-buffer .............. 0 / 0",
            f"  {step + 6}. Timezone .............................. America/Asuncion",
            f"  {step + 7}. Click \"Next\" / \"Save\".",
            "  D) PESTAÑA \"FORMS & PAYMENT\" / \"FORMULARIO Y PAGO\"",
            f"  {step + 8}. Form: el formulario por defecto (Nombre, Apellido, Teléfono, Email). No agregar campos clínicos.",
            f"  {step + 9}. Accept payments / Cobrar en la reserva: APAGADO (la seña se transfiere y la valida Secretaría).",
            "  E) PESTAÑA \"NOTIFICATIONS & ADDITIONAL OPTIONS\" / \"CONFIRMACIÓN\"",
            f"  {step + 10}. Auto Confirm / Confirmación automática: APAGADO.",
            f"  {step + 11}. Notificaciones por email al contacto: APAGADAS (las maneja WhatsApp vía workflows).",
            f"  {step + 12}. Allow reschedule / cancel desde el link: ENCENDIDO.",
            f"  {step + 13}. Click \"Save\" / \"Guardar\".",
            "  F) VERIFICAR",
            f"  {step + 14}. En la lista, el calendario figura activo (switch azul) y asignado a la Dra.",
            f"  {step + 15}. Ícono de cadena → abrir el link público → deben verse SOLO horarios de los días encendidos",
            "      y SOLO hasta 2 días hacia adelante.",
        ]
    return "\n".join(out)


def faq_entries(config):
    sedes = gp.sedes_by_key(config)
    pairs = []
    for s in gp.active_services(config):
        where = "; ".join(f"{sedes[b['sede']]['nombre']}: {gp.describe_days(b['dias'])} de {b['desde']} a {b['hasta']}"
                          for b in s["horarios"])
        pairs.append((f"¿Cuánto cuesta y cuánto dura la {s['nombre'].lower()}?",
                      f"{s['nombre']}: {s['duracion_min']} minutos, valor particular {gp.format_gs(s['precio_particular_gs'])}. "
                      f"{'Acepta seguro.' if s.get('acepta_seguro') else 'Solo particular.'} {s.get('nota', '')}"))
        pairs.append((f"¿Qué días y dónde se atiende {s['nombre'].lower()}?", where + "."))
    for sede in config["sedes"]:
        pairs.append((f"¿Dónde queda la sede {sede['corto']}?", f"{sede['nombre']}: {sede['direccion']}. {sede.get('referencia', '')}"))
    seguros = config.get("seguros_aceptados") or []
    pairs.append(("¿Qué seguros aceptan?", "; ".join(s["nombre"] for s in seguros) + ". Cada uno cubre consultas distintas."))
    sena = config["sena"]
    c = sena["cuenta"]
    pairs.append(("¿Por qué tengo que pagar una seña?",
                  f"Solo para turnos particulares: {gp.format_gs(sena['monto_gs'])}, se descuenta de la consulta. Reserva el horario "
                  "exclusivamente para su hijo/a. Turnos con seguro no pagan seña."))
    pairs.append(("¿A qué cuenta transfiero la seña?",
                  f"{c['banco']} · {c['tipo']} · N.º {c['numero']} · Titular {c['titular']} · Alias {c['alias']}."))
    pairs.append(("¿Cuándo queda confirmado mi turno?",
                  "Cuando Secretaría verifica la transferencia (particular) o la cobertura (seguro). Le avisamos por WhatsApp."))
    pairs.append(("¿Puedo sacar turno para la semana que viene?",
                  "La Dra. habilita la agenda con 48 horas de anticipación. Para más adelante lo anotamos en lista de espera."))
    pairs.append(("¿La doctora me puede indicar algo por WhatsApp?",
                  "No se dan indicaciones médicas por este medio. " + config["clinica"]["mensaje_urgencia"]))
    pairs.append(("¿Por qué la Dra. ya no está en la plataforma del sanatorio?",
                  "La Dra. ahora agenda por este número propio, para atender mejor a cada familia."))
    return "\n".join(f"  P{n:02d}: {q}\n  R{n:02d}: {a}\n" for n, (q, a) in enumerate(pairs, 1))


STATIC_HEAD = r"""
AGENDAR.IA · DRA. CLAUDIA LEGUIZAMÓN
MANUAL DETALLADO DE CONFIGURACIÓN DE GOHIGHLEVEL (GHL)
Pantalla por pantalla · campo por campo · con controles, errores y operación diaria
Capa 1 · Versión DEMO (datos ficticios)
"""

PART_00 = r"""
0.1 CONVENCIONES DE ESTE MANUAL
  - "Texto entre comillas" = copiar y pegar EXACTO (respetando mayúsculas, tildes y espacios).
  - → significa "click en" o "y después".
  - [ ] casilla para tildar cuando completás el paso.
  - CONTROL = verificación obligatoria antes de seguir. Si falla, ir a la sección "Si algo falla".
  - Los botones se nombran en inglés / español. GHL cambia el idioma según tu usuario y algunos
    nombres varían por versión o marca blanca. Si no encontrás un botón exacto, buscá el más parecido
    o usá el buscador de configuración (lupa arriba en Settings).
  - Nunca escribas datos clínicos reales en GHL durante la demo.

0.2 MAPA DE PANTALLAS DE GHL (sub-cuenta, menú izquierdo)
  Launchpad ........ pantalla de inicio con accesos rápidos (no se usa)
  Dashboard ........ métricas (solo la Dra.)
  Conversations .... bandeja de WhatsApp / llamadas / SMS de cada contacto
  Calendars ........ agenda (vista Día/Semana/Mes) + "Calendar Settings" (configuración) + "Appointments" (lista)
  Contacts ......... pacientes/responsables; importación; acciones masivas; etiquetas
  Opportunities .... embudo de ventas (no se usa en Capa 1)
  Payments ......... cobros online (no se usa: la seña es por transferencia)
  AI Agents ........ Conversation AI (WhatsApp), Voice AI (llamadas), Knowledge Base (base de conocimiento)
  Marketing ........ campañas (no se usa)
  Automation ....... Workflows (automatizaciones)
  Sites ............ páginas web (no se usa)
  Reporting ........ reportes de llamadas y citas
  Settings ......... (abajo) configuración: Business Profile, Billing, My Staff, Custom Fields, Tags,
                     Phone System, WhatsApp, Integrations, Private Integrations

0.3 ORDEN RECOMENDADO Y TIEMPOS
  Día 1 (3–4 h)
    [ ] Parte 1  · Mails en Google Workspace ................... 15 min
    [ ] Parte 2  · Sub-cuenta ................................... 10 min
    [ ] Parte 3  · Billetera .................................... 10 min
    [ ] Parte 4  · Perfil del negocio ........................... 10 min
    [ ] Parte 5  · Usuarios y permisos .......................... 20 min
    [ ] Parte 6  · Campos personalizados ........................ 30 min
    [ ] Parte 7  · Etiquetas .................................... 10 min
    [ ] Parte 8  · Calendarios .................................. 90 min
    [ ] Parte 9  · Twilio (inicia la aprobación del número) ..... 30 min
    [ ] Parte 10 · WhatsApp + Parte 11 Plantillas (inicia Meta) . 40 min
  Día 2–3 (mientras Meta aprueba)
    [ ] Parte 12 · Base de conocimiento ......................... 20 min
    [ ] Parte 13 · Bot de WhatsApp .............................. 40 min
    [ ] Parte 14 · Agente de voz ................................ 40 min
    [ ] Parte 15 · Workflows .................................... 90 min
    [ ] Parte 17 · Pacientes demo ............................... 20 min
    [ ] Parte 19 · Pruebas ...................................... 60 min
  Después
    [ ] Parte 18 · Capacitación de Secretaría y la Dra. (operación diaria)

0.4 QUÉ TENER ABIERTO
  - Pestaña 1: GHL (https://app.gohighlevel.com o el dominio de tu agencia).
  - Pestaña 2: este manual.
  - Pestaña 3: Google Workspace (admin.google.com) / Twilio / Meta Business, según la parte.
  - Celular con WhatsApp (que NO sea el de la Dra.) para las pruebas.
"""

PART_01 = r"""
1.1 CREAR EL MAIL DE LA DRA.
  1. Abrí https://admin.google.com → iniciá sesión con tu administrador de rgrlk.com.
  2. Menú izquierdo → "Directorio" → "Usuarios".
  3. Arriba → "Agregar un usuario nuevo".
  4. Nombre: "Claudia"  ·  Apellido: "Leguizamón".
  5. Correo electrónico principal: "DraLeguizamon.AgendarIA"  (el dominio @rgrlk.com ya aparece a la derecha).
  6. Correo electrónico secundario: el mail personal de la Dra. (opcional, para recuperación).
  7. Desplegá "Administrar la contraseña, la unidad organizativa y la foto de perfil".
  8. Contraseña: "Crear contraseña" → una larga (mín. 12 caracteres) → DESTILDAR "Solicitar un cambio de
     contraseña en el próximo acceso" solo si la vas a manejar vos durante la demo.
  9. Click "Agregar usuario nuevo" → "Listo".
 10. Guardá usuario y contraseña en tu gestor.
1.2 CREAR EL MAIL DE SECRETARÍA (o alias sin costo)
  Opción A (licencia propia): repetir 1.1 con Nombre "Secretaría", Apellido "Leguizamón",
    correo "SecretariaLeguizamon.AgendarIA".
  Opción B (alias, sin licencia):
   1. Directorio → Usuarios → click en TU usuario.
   2. "Información del usuario" → "Direcciones de correo electrónico alternativas (alias)".
   3. "Alias de correo electrónico" → "SecretariaLeguizamon.AgendarIA" → "Guardar".
   4. Los mails de GHL a Secretaría llegan a tu bandeja; cuando haya secretaria real, se crea su usuario.
1.3 ACTIVAR LAS CASILLAS
  1. Ventana de incógnito → https://mail.google.com → ingresar con cada usuario nuevo → aceptar términos.
  2. Recomendado: activar verificación en 2 pasos (Cuenta de Google → Seguridad).
CONTROL 1: podés leer y enviar mails desde DraLeguizamon.AgendarIA@rgrlk.com.
Si algo falla: "El dominio no tiene licencias disponibles" → usar la Opción B (alias) o comprar 1 licencia
(Facturación → Suscripciones).
"""

PART_02 = r"""
2.1 IR A LA VISTA DE AGENCIA
  1. Entrá a GHL con tu usuario de agencia.
  2. Si arriba a la izquierda ves el nombre de una sub-cuenta: click en él → "Switch to Agency View".
  3. Elegí la AGENCIA que va a pagar esta sub-cuenta (recordá: las billeteras no se transfieren entre agencias).
2.2 CREAR
  1. Menú izquierdo → "Sub-Accounts".
  2. Arriba a la derecha → "+ Create Sub-Account".
  3. Pantalla "Choose a snapshot": elegí "Blank Snapshot" / "Regular Account" → "Proceed without snapshot".
  4. Pantalla "Add account": si muestra un mapa/buscador de Google, click en "Add manually" / "Agregar manualmente".
  5. Completar:
       Friendly Business Name ...... "Agendar.IA – Dra. Claudia Leguizamón"
       Legal Business Name ......... "Claudia Leguizamón"
       Business Email .............. "DraLeguizamon.AgendarIA@rgrlk.com"
       Business Phone .............. tu número o el de Secretaría (formato +595…)
       Branded Domain / Website .... vacío
       Niche / Industry ............ "Health & Medical" / "Medical"
       Street Address .............. "Av. San Blas km 3, Edificio Médico Demo, piso 2, consultorio 4"
       City ........................ "Ciudad del Este"
       State / Province ............ "Alto Paraná"
       Postal Code ................. "7000"
       Country ..................... "Paraguay"
       Time Zone ................... "(GMT-03:00) America/Asuncion"
       Language .................... "Español"
       First / Last name (contacto). "Claudia" / "Leguizamón"
  6. Click "Save" / "Create".
2.3 ENTRAR A LA SUB-CUENTA
  1. En la lista de Sub-Accounts, buscá "Agendar.IA – Dra. Claudia Leguizamón".
  2. Click en "Switch to Sub-Account" (o en el nombre).
CONTROL 2: arriba a la izquierda dice "Agendar.IA – Dra. Claudia Leguizamón".
Si algo falla: "Sub-account limit reached" → tu plan de agencia no permite más sub-cuentas: usar el plan
"Unlimited" o borrar una sub-cuenta de prueba que no uses.
"""

PART_03 = r"""
3.1 QUÉ SE COBRA DE LA BILLETERA DE LA SUB-CUENTA
  - Minutos del agente de voz (Voice AI).
  - Mensajes del bot de WhatsApp (Conversation AI) y, según el plan, conversaciones de WhatsApp.
  - Llamadas/SMS si usaras LeadConnector Phone (no es el caso: la línea es de Twilio, que cobra aparte).
  IMPORTANTE: GHL NO transfiere saldo entre billeteras ni entre agencias. Esta sub-cuenta se recarga con tarjeta.
3.2 RECARGAR
  1. Dentro de la sub-cuenta → abajo a la izquierda "Settings".
  2. Menú de Settings → "Billing" (en algunas versiones "Company Billing" o "Wallet & Transactions").
  3. Pestaña "Wallet & Transactions".
  4. Botón "+ Add Balance" / "Add Funds".
  5. Amount: "25" (demo) — "50" si van a hacer muchas llamadas de prueba.
  6. Payment method: la tarjeta de la agencia (aparece por defecto) o "+ Add new card" → completar → "Save".
  7. Click "Add" / "Pay" → esperar el mensaje "Balance added successfully".
3.3 RECARGA AUTOMÁTICA
  1. En la misma pestaña → "Auto Recharge" / "Recarga automática" → switch ENCENDIDO.
  2. "Recharge when balance falls below": "10".
  3. "Recharge amount": "25".
  4. Click "Save".
3.4 VER EL CONSUMO
  - Settings → Billing → Wallet & Transactions → lista de movimientos (filtrar por "AI", "Voice", "WhatsApp").
  - Revisalo una vez por semana durante la demo.
CONTROL 3: el saldo es mayor a 0 y la recarga automática dice "Enabled".
Si algo falla: "Card declined" → probar otra tarjeta o habilitar compras internacionales en el banco.
"""

PART_04 = r"""
4.1 PERFIL
  1. Settings → "Business Profile".
  2. Sección "General Information": verificar nombre, email, teléfono, sitio web (vacío).
  3. "Business Logo": subir el logo de la Dra. o de Agendar.IA (PNG cuadrado, mín. 300×300).
  4. Sección "Business Physical Address": la dirección de CDE Centro.
  5. Sección "General": Time Zone "America/Asuncion" · Platform Language "Español".
  6. Click "Update Information" (cada sección tiene su propio botón: apretá todos los que cambies).
  7. Arriba en esta pantalla figura el "Location ID": copialo y guardalo en tu gestor (solo para automatizar después).
4.2 HORARIO COMERCIAL (lo usan los agentes para saber si están "fuera de horario")
  1. Settings → "Business Profile" (o "Calendars → Preferences" según versión) → "Business Hours".
  2. Lunes a viernes: 08:00–12:00 y 14:00–19:00 · Sábado: 08:00–12:00 · Domingo: cerrado → "Save".
4.3 MONEDA (si aparece)
  1. Settings → "Payments" → "Currency" → "PYG – Guaraní paraguayo" → "Save". (No se cobra online; solo para reportes.)
CONTROL 4: zona horaria America/Asuncion (UTC-3) y horario comercial cargado.
"""


def part_05(config):
    roles = {r["rol"]: r for r in config["roles"]}
    return r"""
5.1 DRA. CLAUDIA LEGUIZAMÓN — ADMINISTRADORA (ACCESO TOTAL)
  1. Settings → "My Staff" (o "Team").
  2. Click "+ Add Employee".
  3. Pestaña "User Info":
       First Name ....... "Claudia"
       Last Name ........ "Leguizamón"
       Email ............ "<<EMAIL_DRA>>"
       Password ......... contraseña temporal (se la pasás a la Dra.)
       Phone ............ celular de la Dra. (para notificaciones de urgencia)
       Extension ........ vacío
  4. Pestaña "Call & Voicemail Settings": dejar por defecto.
  5. Pestaña "User Roles": User Type "Account" · User Role "Admin".
  6. Pestaña "User Permissions": todo ENCENDIDO (es administradora).
  7. Pestaña "User Availability" (si aparece): Timezone "America/Asuncion".
  8. Click "Save".
5.2 SECRETARÍA — SOLO TURNOS Y AUTORIZACIÓN MANUAL DE PAGOS
  1. "+ Add Employee".
  2. User Info: First Name "Secretaría" · Last Name "Leguizamón" · Email "<<EMAIL_SEC>>" · Password temporal.
  3. User Roles: User Type "Account" · User Role "User".
  4. User Permissions — dejá EXACTAMENTE así:
       Dashboard Stats ............... APAGADO
       Bulk Requests ................. APAGADO
       Campaigns ..................... APAGADO
       Workflows / Automation ........ APAGADO
       Triggers ...................... APAGADO
       Funnels / Websites ............ APAGADO
       Opportunities ................. APAGADO
       Settings ...................... APAGADO
       Tags .......................... APAGADO
       Lead Value .................... APAGADO
       Marketing / Social Planner .... APAGADO
       Agent Reporting / Reporting ... APAGADO
       Bot Service / AI Agents ....... APAGADO
       Invoices / Payments ........... APAGADO
       Content AI .................... APAGADO
       Reputation / Reviews .......... APAGADO
       Memberships / Courses ......... APAGADO
       Phone Calls ................... ENCENDIDO (para recibir transferencias del agente de voz)
       Conversations ................. ENCENDIDO
       Contacts ...................... ENCENDIDO
       Appointments / Calendars ...... ENCENDIDO
  5. Debajo de Conversations y Contacts: "Only Assigned Data" / "Solo datos asignados" → ENCENDIDO.
     (Ve solo los chats/contactos que el workflow le asigna: comprobantes, urgencias, lista de espera.)
  6. Click "Save".
5.3 INVITACIÓN Y APP
  1. Cada una recibe un mail "You've been invited…" → "Accept" → crea su contraseña.
  2. Instalar en el celular la app "LeadConnector" (App Store / Google Play) → iniciar sesión.
  3. En la app: Settings → Notifications → activar notificaciones de Conversations y Appointments.
CONTROL 5: en My Staff figuran 2 usuarias. Al entrar como Secretaría solo se ven Conversations, Contacts y Calendars.
Si algo falla: Secretaría no ve los turnos → abrir cada calendario y verificar que esté activo; en
"Calendars → Calendar Settings → Preferences" permitir que los "Users" vean citas de calendarios del equipo.
""".replace("<<EMAIL_DRA>>", roles["Administradora"]["email"]).replace("<<EMAIL_SEC>>", roles["Secretaría"]["email"])


PART_09 = r"""
9.1 POR QUÉ TWILIO
  GHL no vende números de Paraguay. Twilio aporta la línea para LLAMADAS (agente de voz).
  WhatsApp NO pasa por Twilio (va con Meta, Parte 10).
9.2 CREAR LA CUENTA
  1. https://www.twilio.com/try-twilio → First name, Last name, Email (usá DraLeguizamon.AgendarIA@rgrlk.com o el tuyo), Password.
  2. Aceptar términos → "Start your free trial" → verificar el mail (link) → verificar tu celular (SMS).
  3. Cuestionario: "Which Twilio product…?" → "Voice" · "What do you plan to build?" → "Other" · "How do you
     want to build?" → "With no code or low code" → "Get Started".
9.3 PASAR A CUENTA PAGA (obligatorio: en prueba solo llama a números verificados)
  1. Console (https://console.twilio.com) → arriba "Upgrade account".
  2. Datos de facturación (empresa o persona), tarjeta, monto inicial "20" USD → "Upgrade".
9.4 COMPRAR EL NÚMERO
  1. Menú izquierdo → "Phone Numbers" → "Manage" → "Buy a number".
  2. Country: "Paraguay (+595)" · Capabilities: tildar "Voice" · "Search".
  3a. Si hay resultados: elegí uno → "Buy" → si pide "Address" o "Regulatory Bundle":
       - "Create new bundle" → End-user type: "Business" (o "Individual") → nombre legal, documento (RUC/CI),
         dirección en Paraguay, documento escaneado → "Submit for review". Aprobación: 1 a 3 días hábiles.
  3b. Si NO hay números de Paraguay: comprá un número con voz de EE.UU. ("United States" → "Voice") para la demo,
       o pedí a la telefónica de la Dra. desvío de llamadas de su línea actual al número de Twilio.
9.5 PERMISOS GEOGRÁFICOS (necesario para transferir llamadas a Secretaría)
  1. Console → "Voice" → "Settings" → "Geo permissions".
  2. Tildar "Paraguay" (y "Brazil" si hay familias que llaman desde Brasil) → "Save".
9.6 CREDENCIALES
  1. Console → página principal → "Account Info": copiar "Account SID" (AC…) y "Auth Token" (click en "Show").
  2. Guardalos en tu gestor. No los pegues en chats.
9.7 CONECTAR A GHL
  1. GHL sub-cuenta → Settings → "Phone System" (o "Phone Numbers").
  2. Si ves "LeadConnector Phone System": botón "Switch to Twilio" / pestaña "Integrations" → "Twilio".
  3. Pegar Account SID y Auth Token → "Connect" / "Save".
  4. Pestaña "Phone Numbers": aparece el número de Twilio → menú (⋮) → "Set as default" / "Edit" → nombre "Línea Agendar.IA".
  5. "Inbound call settings": por ahora "Forward to" vacío (lo atiende el agente de voz, Parte 14).
CONTROL 9: llamás desde tu celular al número → suena o atiende el buzón por defecto de GHL.
Si algo falla: "Number not available in GHL" → el bundle regulatorio sigue en revisión; esperar la aprobación.
"""

PART_10 = r"""
10.1 REQUISITOS
  - Un Facebook personal que sea administrador del Meta Business (business.facebook.com).
  - Número de agendamiento que NO esté en la app de WhatsApp (ni Business) de ningún celular.
    Puede ser el de Twilio. NUNCA el celular personal de la Dra.
  - Si el número ya estaba en una app de WhatsApp: en esa app → Ajustes → Cuenta → "Eliminar cuenta" y esperar 3 min.
10.2 CONECTAR DESDE GHL
  1. GHL sub-cuenta → Settings → "WhatsApp".
  2. Si muestra un plan/suscripción de WhatsApp de GHL: "Subscribe"/"Start" (se cobra de la billetera).
  3. Click "Connect WhatsApp" / "Get Started" → se abre la ventana de Meta.
  4. "Continue as <tu nombre>" (Facebook).
  5. "Select your business portfolio": elegí el existente o "Create a business portfolio" → nombre
     "Agendar.IA – Dra. Claudia Leguizamón", mail, sitio web (puede ser vacío) → "Next".
  6. "Create a WhatsApp Business profile": "Create a new WhatsApp Business account".
       WhatsApp Business account name ... "Dra. Claudia Leguizamón"
       Display name ..................... "Dra. Claudia Leguizamón · Turnos"
       Category ......................... "Medical and health"
       Description (opcional) ........... "Agenda de turnos pediátricos"
  7. "Add a phone number": ingresar el número con +595 (o el de Twilio) → método "Phone call".
     Si es de Twilio: en Twilio Console → Phone Numbers → el número → "A call comes in" → configurar reenvío
     a tu celular (o revisar "Monitor → Logs → Calls" y escuchar la grabación) para recibir el código.
  8. Ingresar el código de 6 dígitos → "Next" → revisar permisos → "Finish"/"Done".
  9. De vuelta en GHL: Settings → WhatsApp → el número aparece "Connected".
10.3 VERIFICAR EL NEGOCIO EN META (sube el límite de mensajes y evita bloqueos)
  1. business.facebook.com → "Settings" → "Business info" / "Security center" → "Start verification".
  2. Subir: constancia de RUC o documento, comprobante de domicilio, sitio web o dominio → enviar.
10.4 MÉTODO DE PAGO EN META (si lo pide)
  1. Business Settings → "Accounts" → "WhatsApp accounts" → la cuenta → "Payment settings" → agregar tarjeta.
CONTROL 10: desde tu celular escribís "hola" al número → el mensaje aparece en GHL → Conversations.
Si algo falla: "Phone number already registered" → el número sigue activo en una app de WhatsApp; eliminarla (10.1).
"""


def part_11(config):
    c = config["sena"]["cuenta"]
    return r"""
11.1 PARA QUÉ SON
  Meta solo permite mensajes libres dentro de las 24 h desde el último mensaje del paciente. Fuera de esa ventana
  (recordatorios, Código Rojo) hay que usar plantillas aprobadas.
11.2 CÓMO CREAR CADA PLANTILLA
  1. GHL → Settings → WhatsApp → pestaña "Templates" → "+ Create Template".
  2. Template name: el nombre EXACTO (minúsculas y guion bajo).
  3. Category: "Utility" (NO "Marketing": se rechaza o cuesta más).
  4. Language: "Spanish" (es). Para familias brasileñas podés duplicar en "Portuguese (BR)".
  5. Header: "None". Footer: "Agendar.IA". Buttons: "None" (salvo que se indique).
  6. Body: pegar el texto; cada {{1}}, {{2}}… se inserta con "+ Add variable".
  7. Sample values: completar ejemplos (Meta los exige para aprobar).
  8. "Submit" → estado "Pending" → en 1 a 48 h pasa a "Approved".

  PLANTILLA A — datos_sena
    Body:
      Hola {{1}}, reservamos el preturno de {{2}}. Para confirmarlo, la Dra. solicita una seña de Gs. 100.000 que se
      descuenta de la consulta. Transferí a: <<BANCO>>, cuenta N.º <<NUM>>, titular <<TIT>>, alias <<ALIAS>>.
      Enviános el comprobante por acá dentro de las 2 horas. ¡Gracias!
    Variables: {{1}} nombre del responsable (ej. "María") · {{2}} turno (ej. "Mateo – Control de niño sano, lunes 10:20")

  PLANTILLA B — confirmacion_turno
    Body:
      ¡Listo, {{1}}! El turno de {{2}} quedó confirmado para {{3}} en {{4}}. Si necesitás cambiarlo, escribinos por acá.
    Variables: {{1}} "María" · {{2}} "Mateo" · {{3}} "lunes 12/10 10:20" · {{4}} "Ciudad del Este — Centro"

  PLANTILLA C — recordatorio_turno
    Body:
      Hola {{1}}, te recordamos el turno de {{2}} mañana {{3}} en {{4}}. Respondé SÍ para confirmar asistencia o
      escribinos si necesitás cambiarlo.
    Buttons (opcional): "Quick reply" → "SÍ" y "Cambiar turno".
    Variables: {{1}} "María" · {{2}} "Mateo" · {{3}} "10:20" · {{4}} "Ciudad del Este — Centro"

  PLANTILLA D — propuesta_reprogramacion
    Body:
      Hola {{1}}, la Dra. Claudia Leguizamón tuvo un imprevisto médico y debemos mover el turno de {{2}}.
      Opciones: {{3}} · {{4}} · {{5}}. Respondé con la opción que prefieras o escribinos si ninguna te sirve.
      La seña pagada se mantiene.
    Variables: {{1}} "María" · {{2}} "Consulta por enfermedad · lunes 12/10 15:00" · {{3}} "martes 13/10 08:20"
               · {{4}} "martes 13/10 08:40" · {{5}} "miércoles 14/10 15:20"
11.3 SI META RECHAZA
  - "Category mismatch": cambiar a Utility y quitar palabras promocionales.
  - "Variable formatting": no empezar ni terminar el texto con una variable; no poner dos variables seguidas.
  - Volver a enviar con "Edit" → "Submit".
CONTROL 11: las 4 plantillas en "Approved".
""".replace("<<BANCO>>", c["banco"]).replace("<<NUM>>", c["numero"]).replace("<<TIT>>", c["titular"]).replace("<<ALIAS>>", c["alias"])


def part_12(config):
    return r"""
12.1 CREAR LA BASE
  1. Menú izquierdo → "AI Agents" (o "AI Employee").
  2. Pestaña "Knowledge Base" → "+ Create Knowledge Base" / "+ New".
  3. Name: "AgendarIA · Base Dra. Leguizamón" · Description: "Información del consultorio para los agentes" → "Create".
12.2 FUENTE 1 — TEXTO PRINCIPAL
  1. Dentro de la base → "+ Add Source" / "Add Data".
  2. Tipo: "Rich Text" / "Text" / "Write content".
  3. Title: "Consultorio Dra. Leguizamón".
  4. Content: pegar COMPLETO el ANEXO A.
  5. "Save".
12.3 FUENTE 2 — PREGUNTAS FRECUENTES
  1. "+ Add Source" → tipo "FAQ".
  2. Por cada par del ANEXO D: "+ Add FAQ" → Question = texto P · Answer = texto R → "Save".
12.4 ENLACE DE RESERVA WEB
  Cuando tengas el link del grupo de calendarios (Parte 8.17): editar la Fuente 1 → buscar "Reserva por enlace
  web: PENDIENTE" → reemplazar PENDIENTE por el link → "Save".
12.5 MODO VACACIONES / AUSENCIA
  Al iniciar la ausencia: editar la Fuente 1 → pegar AL PRINCIPIO:
    "AUSENCIA ACTIVA: <<AUSENCIA>>"
  → "Save". Al volver la Dra., borrar esa línea → "Save".
CONTROL 12: la base tiene 2 fuentes (texto + FAQ).
""".replace("<<AUSENCIA>>", config["clinica"]["ausencia"]["mensaje"])


PART_13 = r"""
13.1 CREAR EL BOT
  1. AI Agents → pestaña "Conversation AI" → "+ Create Bot" / "+ New Agent".
  2. Bot name: "Agendar.IA – WhatsApp Dra. Leguizamón" → "Create".
13.2 PESTAÑA "BOT SETTINGS" / "CONFIGURACIÓN"
  Mode ............................ "Auto Pilot"
  Channels ........................ tildar SOLO "WhatsApp" (destildar SMS, Facebook, Instagram, Live Chat, Email)
  Bot response delay .............. 5 segundos
  Business hours .................. "Always active" (24/7)
  Stop bot on human reply ......... ENCENDIDO
  Reactivate bot after ............ 12 horas
  Max messages per conversation ... 25 (luego handoff)
  Bot name visible al paciente .... "Sofía"
  Knowledge base .................. "AgendarIA · Base Dra. Leguizamón"
  Transcribe voice notes .......... ENCENDIDO (si existe)
  Tags to exclude / Filtro ........ "agendaria-demo" (el bot no responde a contactos ficticios)
  → "Save".
13.3 PESTAÑA "PROMPT" / "PERSONALITY" / "INSTRUCTIONS"
  1. Borrar el texto de ejemplo.
  2. Pegar COMPLETO el ANEXO B.
  3. Si hay campo "Objective/Goal" separado: "Agendar turnos pediátricos en el calendario correcto sin dar
     indicaciones médicas."
  4. "Save".
13.4 PESTAÑA "GOALS" / "INTENTS"
  1. Goal: "Appointment Booking".
  2. Calendars: tildar los 15 calendarios "AgendarIA · …".
  3. "Booking confirmation message": "Le reservé el preturno 🙂 En breve le explico cómo confirmarlo."
  4. "Save".
13.5 PESTAÑA "ACTIONS" (una por una con "+ Add Action")
  Acción 1 · Update Contact Field
    Name: "Guardar datos del turno"
    Campos: Nombre del hijo/a · Fecha de nacimiento del hijo/a · Parentesco del responsable · Servicio solicitado ·
            Sede preferida · Cobertura · Seguro médico · Idioma preferido · Motivo (administrativo)
    When: "Cuando el responsable brinda esos datos durante la conversación."
  Acción 2 · Add Tag "agendaria-whatsapp"
    When: "Al inicio de cada conversación nueva."
  Acción 3 · Add Tag "agendaria-pendiente-pago"
    When: "Inmediatamente después de reservar un turno cuya cobertura es Particular."
  Acción 4 · Add Tag "agendaria-comprobante-recibido"
    When: "Cuando el responsable envía una foto, captura o PDF del comprobante de transferencia."
  Acción 5 · Add Tag "agendaria-lista-espera"
    When: "Cuando pide un turno para más de 48 horas hacia adelante y acepta la lista de espera."
  Acción 6 · Add Tag "agendaria-urgencia"
    When: "Cuando describe dificultad para respirar, convulsiones, desmayo, fiebre en bebé menor de 3 meses,
           sangrado, golpe fuerte, deshidratación, intoxicación o dice que es urgente."
  Acción 7 · Remove Tag "codigo-rojo-afectado"
    When: "Cuando el responsable eligió un nuevo horario o aceptó la lista de espera tras un Código Rojo."
  Acción 8 · Human Handoff / Stop Bot
    Assign to: "Secretaría"
    Add tag: "agendaria-handoff-secretaria"
    When: "Pide hablar con una persona, se enoja o reclama, consulta por recetas o medicamentos, o pregunta algo
           que no está en la base de conocimiento."
  → "Save".
13.6 PROBAR ANTES DE ACTIVAR
  1. Botón "Test Bot" / "Testing" (panel derecho).
  2. Escribir los mensajes del guion de la Parte 19.1 y comparar con la respuesta esperada.
  3. Corregir el prompt si responde distinto → "Save" → volver a probar.
13.7 ACTIVAR
  Switch "Active" / "Bot status: On".
CONTROL 13: desde tu celular, "hola" al WhatsApp → responde Sofía en español en menos de 10 segundos.
"""


def part_14(voz_welcome):
    return r"""
14.1 CREAR EL AGENTE
  1. AI Agents → pestaña "Voice AI" → "+ Create Agent" → "Start from scratch".
14.2 PESTAÑA "AGENT GOALS" / "GENERAL"
  Agent name ............ "Agendar.IA – Recepción Dra. Leguizamón"
  Business name ......... "Consultorio Pediátrico Dra. Claudia Leguizamón"
  Language .............. "Spanish (Latin America)" si existe; si no "Spanish"
  Voice ................. escuchar las muestras y elegir una voz FEMENINA, cálida, español latino
  Voice speed ........... 0.95 – 1.0 (normal o apenas más lento)
  Welcome message ....... "<<WELCOME>>"
  Agent prompt .......... pegar COMPLETO el ANEXO C
14.3 PESTAÑA "KNOWLEDGE BASE"
  Seleccionar "AgendarIA · Base Dra. Leguizamón".
14.4 PESTAÑA "PHONE & AVAILABILITY"
  Phone number .......... el número de Twilio (Parte 9)
  Working hours ......... "24/7"
  Max call duration ..... 8 minutos
  Idle reminder ......... ENCENDIDO · cada 8 s · mensaje "¿Sigue ahí?" · cortar tras 3
  Interruption sensitivity ... media (deja que el paciente interrumpa)
  Background noise ...... "None" / "Office" bajo
  Recording / Aviso ..... ENCENDIDO; agregar al final del saludo: "Esta llamada puede ser grabada para mejorar la atención."
14.5 PESTAÑA "ACTIONS" (con "+ Add Action")
  Acción 1 · Book Appointment
    Calendars: los 15 "AgendarIA · …" · When: "Cuando el responsable confirma niño, consulta, sede, día y hora."
  Acción 2 · Update Contact Field
    Los mismos 9 campos del bot de WhatsApp · When: "Cuando el responsable brinda esos datos."
  Acción 3 · Call Transfer
    Transfer to: número de Secretaría en formato +595XXXXXXXXX (o el usuario "Secretaría")
    When: "Urgencia, pide hablar con una persona, reclamo, recetas o medicamentos, o dato no disponible."
    Transfer message: "Le paso con Secretaría, un momento por favor."
  Acción 4 · Add Tag "agendaria-voz" · When: "Al inicio de cada llamada."
  Acción 5 · Add Tag "agendaria-lista-espera" · When: "Pide turno para más de 48 horas y acepta lista de espera."
  Acción 6 · Add Tag "agendaria-urgencia" · When: "Se detecta una posible urgencia médica."
14.6 PESTAÑA "POST CALL"
  Call summary .......... ENCENDIDO (se guarda como nota en el contacto)
  Transcript ............ ENCENDIDO
  Send summary to ....... email de la Dra. (opcional)
14.7 PROBAR Y PUBLICAR
  1. Botón "Test Agent" / "Web Call" → hablar con el micrófono de la computadora siguiendo el guion 19.2.
  2. Ajustar prompt o voz → "Save".
  3. "Publish" / switch "Active".
CONTROL 14: llamás al número → atiende Sofía → pedís turno → aparece en Calendars como "Unconfirmed".
Si algo falla: no atiende → número no asignado al agente (14.4) o Twilio en modo prueba (9.3).
""".replace("<<WELCOME>>", voz_welcome)


PART_15 = r"""
15.0 REGLAS PARA TODOS LOS WORKFLOWS
  - Crear: Automation → Workflows → "+ Create Workflow" → "Start from Scratch".
  - Renombrar: click en "New Workflow" arriba a la izquierda → escribir el nombre → Enter.
  - Pestaña "Settings" del workflow:
       Timezone ............... "Account timezone" (America/Asuncion)
       Allow re-entry ......... ENCENDIDO (un mismo contacto puede tener varios turnos)
       Stop on response ....... APAGADO (salvo 15.7)
       Sender (WhatsApp) ...... el número conectado
  - En cada trigger: "+ Add filters" → "Contact Tag" → "Does not include" → "agendaria-demo".
  - Guardar con "Save" y activar con el switch "Draft → Publish".
  - Probar con "Test Workflow" eligiendo un contacto de prueba con TU teléfono (nunca un contacto demo).

15.1 · AgendarIA · Preturno particular
  TRIGGER
    1. "Add New Trigger" → "Appointment Status".
    2. Filters: "In calendar" → seleccionar los 15 "AgendarIA · …"
                "Appointment status" → "New" (en algunas versiones "Booked" o "Unconfirmed")
                + filtro de etiqueta demo (15.0).
    3. "Save Trigger".
  ACCIONES
    4. "+" → "If / Else" → Branch "Particular": condición "Contact Details → Cobertura → is → Particular".
       Rama "None" (else) = seguro.
    RAMA PARTICULAR
    5. "+" → "Add Contact Tag" → "agendaria-pendiente-pago".
    6. "+" → "Send WhatsApp" → Template "datos_sena" → {{1}} = {{contact.first_name}} ·
       {{2}} = {{contact.nombre_hijo}} – {{appointment.title}} {{appointment.start_time}}.
    7. "+" → "Wait" → "Time Delay" → 2 hours.
    8. "+" → "If / Else" → condición "Contact Tag → includes → agendaria-comprobante-recibido".
       Rama SÍ: sin acciones (Secretaría verifica y confirma).
       Rama NO:
        9.  "+" → "Update Appointment Status" → "Cancelled".
        10. "+" → "Send WhatsApp" (mensaje libre si está dentro de 24 h):
            "No recibimos el comprobante y liberamos el horario para otra familia. Si querés, te anoto en lista de
             espera o buscamos otro turno 🙂"
        11. "+" → "Remove Contact Tag" → "agendaria-pendiente-pago".
    RAMA SEGURO (None)
    12. "+" → "Add Contact Tag" → "agendaria-pendiente-confirmacion".
    13. "+" → "Add Task" → Title "Verificar cobertura y confirmar turno" · Assigned to "Secretaría" · Due in 2 hours.
  Nota: si faltan menos de 5 h para el turno, Secretaría controla el comprobante a mano (límite: 3 h antes).

15.2 · AgendarIA · Comprobante recibido
  TRIGGER: "Contact Tag" → "Tag Added" → "agendaria-comprobante-recibido" (+ filtro demo).
  ACCIONES
    1. "Assign to User" → "Secretaría" (opción "Only apply to unassigned contacts": APAGADO).
    2. "Add Task" → Title "Verificar seña Gs. 100.000" · Description "Revisar el banco. Si ingresó, abrir el turno
       en Calendars y cambiar a Confirmed." · Assigned "Secretaría" · Due in 1 hour.
    3. "Internal Notification" → Type "In-App" → User "Secretaría" → Title "Comprobante recibido" →
       Message "{{contact.name}} envió el comprobante de la seña."
    4. "Internal Notification" → Type "Email" → User "Secretaría" → Subject "Comprobante recibido – {{contact.name}}".

15.3 · AgendarIA · Turno confirmado
  TRIGGER: "Appointment Status" → In calendar (15 AgendarIA) → Status "Confirmed" (+ filtro demo).
  ACCIONES
    1. "Remove Contact Tag" → "agendaria-pendiente-pago".
    2. "Remove Contact Tag" → "agendaria-comprobante-recibido".
    3. "Remove Contact Tag" → "agendaria-pendiente-confirmacion".
    4. "Send WhatsApp" → Template "confirmacion_turno" → {{1}} {{contact.first_name}} · {{2}} {{contact.nombre_hijo}}
       · {{3}} {{appointment.start_time}} · {{4}} {{appointment.location}}.

15.4 · AgendarIA · Recordatorios
  TRIGGER: "Appointment Status" → In calendar (15 AgendarIA) → Status "Confirmed" (+ filtro demo).
  ACCIONES
    1. "Wait" → "Event / Appointment Time" → "Before" → 24 hours.
       (Si el turno es en menos de 24 h, la opción "Skip if time has passed" → ENCENDIDA.)
    2. "Send WhatsApp" → Template "recordatorio_turno".
    3. "Wait" → "Event / Appointment Time" → "Before" → 2 hours.
    4. "Send WhatsApp" → "Te esperamos en 2 horas en {{appointment.location}} 🙂"

15.5 · AgendarIA · Lista de espera
  TRIGGER: "Contact Tag" → "Tag Added" → "agendaria-lista-espera" (+ filtro demo).
  ACCIONES
    1. "Assign to User" → "Secretaría".
    2. "Add Task" → "Ofrecer turno a {{contact.nombre_hijo}} cuando se libere un horario de {{contact.servicio_solicitado}}"
       · Assigned "Secretaría" · Due in 1 day.

15.6 · AgendarIA · Alerta urgencia
  TRIGGER: "Contact Tag" → "Tag Added" → "agendaria-urgencia" (+ filtro demo).
  ACCIONES
    1. "Assign to User" → "Secretaría".
    2. "Internal Notification" → "SMS" → To "Specific number" → celular de la Dra. → "Posible urgencia:
       {{contact.name}} {{contact.phone}}. El bot ya indicó acudir a urgencias."
    3. "Internal Notification" → "In-App" → "Secretaría" → mismo texto.
    4. "Remove Contact Tag" → "agendaria-urgencia" (para que vuelva a disparar si ocurre otra vez).

15.7 · AgendarIA · Código Rojo
  Settings del workflow: "Stop on response" ENCENDIDO.
  TRIGGER: "Contact Tag" → "Tag Added" → "codigo-rojo-afectado" (+ filtro demo).
  ACCIONES
    1. "Send WhatsApp" → Template "propuesta_reprogramacion" → {{1}} {{contact.first_name}} ·
       {{2}} {{contact.cr_turno_original}} · {{3}} {{contact.cr_propuesta_1}} · {{4}} {{contact.cr_propuesta_2}} ·
       {{5}} {{contact.cr_propuesta_3}}.
    2. "Wait" → "Time Delay" → 30 minutes. (Si responde antes, "Stop on response" corta y el bot conversa.)
    3. "Add Task" → "Llamar: turno movido por Código Rojo sin respuesta" · Assigned "Secretaría" · Due now.

CONTROL 15: los 7 workflows en "Published". Probá cada uno con "Test Workflow" y tu contacto de prueba.
Si algo falla: el WhatsApp no sale → plantilla no aprobada (Parte 11) o fuera de la ventana de 24 h con mensaje libre.
"""

PART_16 = r"""
16.1 CUÁNDO
  Cesárea o parto de urgencia, urgencia médica o imprevisto personal de la Dra. que obliga a suspender las
  próximas 2, 3, 4 o 5 horas.
16.2 PASO 1 — BLOQUEAR LA AGENDA (Dra. o Secretaría, 1 minuto)
  1. App LeadConnector o web → Calendars → vista "Day".
  2. Usuario: "Claudia Leguizamón" (o "All calendars").
  3. Arrastrar el mouse/dedo sobre el rango (desde ahora hasta +2 h por defecto; 3, 4 o 5 h si hace falta).
  4. Elegir "Block off time" / "Blocked slot".
  5. Title: "Código Rojo — Cesárea" (o "Parto", "Urgencia médica", "Imprevisto personal") → "Save".
     Este bloqueo queda como registro del recibimiento.
16.3 PASO 2 — LISTAR LOS AFECTADOS (Secretaría)
  1. Calendars → pestaña "Appointments" / "List view".
  2. Filtro de fecha: hoy · rango horario del bloqueo · estado "Confirmed" y "New/Unconfirmed".
16.4 PASO 3 — POR CADA TURNO AFECTADO
  1. Abrir el turno → anotar servicio, sede y hora.
  2. Buscar 3 horarios libres del MISMO calendario dentro de las próximas 48 h (vista Day/Week del calendario).
  3. Cambiar el estado del turno a "Cancelled" → "Save". NO usar "Delete".
  4. Abrir el contacto (click en el nombre) → panel de campos → carpeta "Agendar.IA":
       Código Rojo · turno original ... "Consulta por enfermedad · lunes 12/10 15:00"
       Código Rojo · propuesta 1 ...... "martes 13/10 08:20"
       Código Rojo · propuesta 2 ...... "martes 13/10 08:40"
       Código Rojo · propuesta 3 ...... "miércoles 14/10 15:20"
     → "Save".
  5. Pestaña "Notes" → "+ Add Note" → "Código Rojo (motivo). Turno cancelado sin borrar. Propuestas enviadas." → "Save".
  6. Campo "Tags" → agregar "codigo-rojo-afectado" → el workflow 15.7 envía el WhatsApp automáticamente.
16.5 DESPUÉS
  - Cuando el paciente elige, el bot reserva el nuevo turno. Secretaría lo confirma SIN pedir otra seña.
  - Si nadie responde en 30 min, aparece la tarea "Llamar…".
"""


def part_17(config, n_contacts, sample):
    return r"""
17.1 IMPORTAR LOS CONTACTOS
  Archivo: ghl_contactos_import.csv · <<N>> responsables ficticios · teléfonos +595900… · mails @example.com.
  1. Menú izquierdo → "Contacts" → arriba a la derecha "Import" (ícono de nube/flecha).
  2. "Upload File" → arrastrar ghl_contactos_import.csv → "Next".
  3. Object: "Contacts" → "Next".
  4. Import type: "Create new contacts" (destildar "Update existing") → "Next".
  5. Mapeo de columnas (columna del archivo → campo de GHL):
       First Name ........................ First Name
       Last Name ......................... Last Name
       Phone ............................. Phone
       Email ............................. Email
       Tags .............................. Tags
       Nombre del hijo/a ................. Custom field "Nombre del hijo/a"
       Fecha de nacimiento del hijo/a .... Custom field "Fecha de nacimiento del hijo/a"
       Otros hijos/as registrados ........ Custom field "Otros hijos/as registrados"
       Parentesco del responsable ........ Custom field "Parentesco del responsable"
       Sede preferida .................... Custom field "Sede preferida"
       Cobertura ......................... Custom field "Cobertura"
       Seguro médico ..................... Custom field "Seguro médico"
       Idioma preferido .................. Custom field "Idioma preferido"
     Si alguna columna queda "Do not import", elegí el campo a mano en el desplegable.
  6. "Next" → Options:
       Add tags to all ................ "agendaria-demo"
       Trigger workflows / Automation . APAGADO
       Assign to user ................. vacío
  7. "Start Bulk Import" → esperar el aviso (Contacts → "Bulk Actions" muestra el progreso y errores).
17.2 BLOQUEAR MENSAJES A LOS FICTICIOS (OBLIGATORIO)
  1. Contacts → "+ Add filter" / "More filters" → "Tag" → "is" → "agendaria-demo" → Apply.
  2. Checkbox del encabezado → "Select all <<N>>".
  3. Botón "Bulk Actions" / "More" (⋯) → "DND" / "Change DND".
  4. "Enable DND" → "All channels" → "Confirm".
17.3 TURNOS DE EJEMPLO (manual, 10 turnos)
  GHL no importa citas por CSV; los 3.562 turnos históricos solo se cargan por API.
  Para cada línea de abajo:
  1. Calendars → "+ New" / "+ New Appointment".
  2. Calendar: el del servicio y sede de la línea.
  3. Contact: buscar por teléfono el responsable.
  4. Date & Time: la de la línea (fechas pasadas: permitir "Ignore availability"/"Override").
  5. Title: "<servicio> — <niño/a>".
  6. Status: "Showed".
  7. "Book Appointment" / "Save".
<<SAMPLE>>
CONTROL 17: <<N>> contactos con la etiqueta agendaria-demo, todos con DND. 10 turnos de ejemplo cargados.
""".replace("<<N>>", str(n_contacts)).replace("<<SAMPLE>>", sample)


PART_18 = r"""
18.1 SECRETARÍA — RUTINA DIARIA (app LeadConnector o web)
  Al empezar el día:
   [ ] Tareas (campana o "Tasks"): resolver las pendientes, primero "Verificar seña".
   [ ] Calendars → vista Day: revisar turnos "Unconfirmed" de hoy y mañana.
   [ ] Conversations: responder los chats asignados (handoff del bot).
  Cada vez que llega "Comprobante recibido":
   1. Abrir la conversación → ver la imagen del comprobante.
   2. Abrir el homebanking → verificar que ingresaron Gs. 100.000 del titular indicado.
   3. Si ingresó: Calendars → abrir el turno → Status "Confirmed" → "Save". (El sistema avisa al paciente.)
   4. Si NO ingresó: escribir en la conversación "Todavía no vemos la transferencia, ¿nos reenviás el comprobante?"
   5. Marcar la tarea como completada.
  Turno con seguro:
   1. Verificar cobertura (llamada o portal del seguro) → Status "Confirmed".
  Paciente que llama a la línea fija o se presenta:
   1. Calendars → "+ New Appointment" → elegir calendario → buscar o crear contacto → hora → Status según pago.
18.2 DRA. — LO QUE PUEDE HACER DESDE EL CELULAR
   - Ver la agenda del día y la semana (Calendars).
   - Activar Código Rojo (Parte 16).
   - Recibir alertas de urgencia (SMS).
   - Ver métricas (Dashboard / Reporting).
18.3 SEMANAL (vos o la Dra.)
   [ ] Saldo de la billetera y consumo (Parte 3.4).
   [ ] Settings → WhatsApp → calidad del número ("Quality rating" en verde).
   [ ] Revisar 5 conversaciones del bot al azar: ¿respetó los límites?
   [ ] Workflows → pestaña "Execution logs": errores en rojo.
"""

PART_19 = r"""
19.1 GUION DE PRUEBA — WHATSAPP (celular que NO sea de la Dra.)
  #   Mensaje que escribís                                  Respuesta esperada
  01  "hola"                                                 Sofía se presenta en español.
  02  "hello"                                                Responde en ESPAÑOL (nunca en inglés).
  03  "Olá, quero marcar uma consulta pro meu filho"         Responde en portugués.
  04  "Quiero turno para control de mi hija"                 Pide nombre del niño, edad, responsable, sede, cobertura.
  05  (completar como particular)                            Ofrece 2–3 horarios de las próximas 48 h.
  06  (elegir un horario)                                    Repite niño, consulta, sede, día y hora; reserva;
                                                             explica seña Gs. 100.000 + datos Itaú + plazo 2 h.
  07  (no mandar comprobante, esperar 2 h)                   Turno pasa a Cancelled y llega aviso de liberación.
  08  (repetir 04–06 y mandar una foto)                      "Secretaría verifica…" · tarea a Secretaría.
  09  (Secretaría pone Confirmed)                            Llega confirmacion_turno.
  10  "Tengo seguro Prepaga Demo Salud"                      No pide seña; queda pendiente de Secretaría.
  11  "Quiero turno para dentro de 5 días"                   Explica regla de 48 h; ofrece lista de espera.
  12  "Tengo dos hijos, Mateo y Lucía"                       Pregunta para cuál; un turno por niño.
  13  "Mi hijo tiene la nariz tapada, ¿le hago lavado?"      NO indica nada; mensaje de "no doy indicaciones" + urgencia.
  14  "Mi bebé está convulsionando"                          SOLO el mensaje de urgencia (Sanatorio Le Blanc); alerta.
  15  "La receta tiene un error"                             "Le paso con Secretaría"; handoff.
  16  "Quiero hablar con una persona"                        Handoff a Secretaría.
  17  "¿Por qué la doctora no está en el sanatorio?"         "Ahora agenda por este número propio…".
  18  "¿Cuánto cuesta la integrativa?"                       Gs. 350.000, 45 min, jueves, solo particular.
19.2 GUION DE PRUEBA — VOZ
  01  Llamar al número                                       Saludo de Sofía.
  02  "Quiero un turno para mi hijo"                         Pregunta datos de a uno; repite el WhatsApp dígito por dígito.
  03  Elegir horario                                         Confirma; explica seña; turno "Unconfirmed" en el calendario.
  04  "Es urgente, no respira bien"                          Mensaje de urgencia + transferencia a Secretaría.
  05  Hablar en portugués                                    Responde en portugués.
19.3 CÓDIGO ROJO
  01  Turno de prueba a tu nombre en la próxima hora → Parte 16 completa → llega propuesta_reprogramacion.
  02  Responder "la opción 2" → el bot reserva ese horario → Secretaría confirma sin pedir seña.
"""

PART_20 = r"""
  Síntoma                                      Causa probable / Solución
  El bot no responde                           Billetera en 0 (P3) · bot apagado (13.7) · canal WhatsApp no tildado (13.2)
                                               · el contacto tiene "agendaria-demo" o DND.
  Responde en inglés                           Prompt no pegado completo (13.3).
  Da indicaciones médicas                      Prompt incompleto o base con texto clínico: revisar 13.3 y el ANEXO A.
  No ofrece horarios                           Calendario sin días encendidos (P8 C) · Date Range > 2 días mal cargado ·
                                               pedido a menos de 2 h (aviso mínimo) · calendario no tildado en Goals (13.4).
  Turnos confirmados solos                     "Auto Confirm" encendido en ese calendario (P8 E).
  Dos turnos a la misma hora en sedes distintas Calendarios no asignados a la Dra. (P8 B paso 7).
  Agente de voz no atiende                     Número no asignado (14.4) · Twilio en prueba (9.3) · bundle sin aprobar (9.4).
  No transfiere a Secretaría                   Geo permissions de Twilio sin Paraguay (9.5) · número mal escrito (+595…).
  WhatsApp de recordatorio no sale             Plantilla no aprobada (P11) · workflow en Draft (15.0).
  Secretaría ve todo                           Falta "Only Assigned Data" (5.2 paso 5).
  Llegan mensajes a contactos demo             Falta DND masivo (17.2) o filtro demo en triggers (15.0).
  "Insufficient balance"                       Recargar (3.2) y revisar la recarga automática (3.3).
"""

PART_21 = r"""
21.1 CAMBIAR UN PRECIO
  1. AI Agents → Knowledge Base → Fuente 1 → editar la línea del servicio → "Save".
  2. Fuente 2 (FAQ) → editar la pregunta de ese servicio → "Save".
21.2 CAMBIAR UN HORARIO
  1. Calendars → Calendar Settings → el calendario → Availability → cambiar franja → "Save".
  2. Base de conocimiento → actualizar la línea de horarios del servicio.
21.3 AGREGAR UN SEGURO
  Base de conocimiento → sección "Seguros y convenios" → agregar línea "Nombre: cubre X; copago Gs. Y" → "Save".
21.4 VACACIONES
  Parte 12.5 + bloquear los días en Calendars (Block off time de día completo).
21.5 NUEVO SERVICIO
  Crear calendario nuevo (P8) + agregarlo en Goals del bot (13.4), en Actions del agente de voz (14.5),
  en los filtros de los workflows 15.1/15.3/15.4 y en la base de conocimiento.
21.6 SEGURIDAD
  - Si alguna vez se crea un token (Private Integrations), guardarlo solo en variables de entorno y rotarlo si se expone.
  - Revisar My Staff cada mes: dar de baja usuarios que ya no trabajan.
  - Exportar contactos una vez por mes: Contacts → seleccionar todo → "Export".
"""

PART_22 = r"""
  Billetera (Wallet) ....... saldo prepago de la sub-cuenta para IA, voz y mensajes.
  Calendario personal ...... calendario asignado a un usuario; GHL evita choques entre todos sus calendarios.
  Conversation AI .......... bot de texto (WhatsApp) de GHL.
  DND (Do Not Disturb) ..... bloqueo de mensajes salientes a un contacto.
  Handoff .................. el bot deja la conversación a una persona.
  Plantilla (Template) ..... mensaje pre-aprobado por Meta para escribir fuera de las 24 h.
  Preturno ................. turno reservado pero no confirmado (estado Unconfirmed/New).
  Sub-cuenta (Location) .... espacio independiente de un cliente dentro de la agencia.
  Trigger .................. evento que inicia un workflow.
  Voice AI ................. agente que atiende llamadas con voz.
  Workflow ................. automatización: disparador + acciones.
"""

FINAL_CHECKLIST = r"""
  [ ] Mails creados (P1)                       [ ] Sub-cuenta creada (P2)
  [ ] Billetera con saldo + recarga auto (P3)  [ ] Zona horaria y horario comercial (P4)
  [ ] Dra. Admin + Secretaría User (P5)        [ ] 15 campos personalizados (P6)
  [ ] 11 etiquetas (P7)                        [ ] 15 calendarios + grupo + link (P8)
  [ ] Twilio pago + número + geo + GHL (P9)    [ ] WhatsApp conectado (P10)
  [ ] 4 plantillas aprobadas (P11)             [ ] Base de conocimiento + FAQ (P12)
  [ ] Bot WhatsApp activo (P13)                [ ] Agente de voz publicado (P14)
  [ ] 7 workflows publicados (P15)             [ ] Código Rojo practicado (P16)
  [ ] Contactos demo + DND (P17)               [ ] Secretaría capacitada (P18)
  [ ] Guiones de prueba aprobados (P19)
"""


def build(config):
    voz = gp.ROOT / "prompts" / "agente_voz.md"
    wa = gp.ROOT / "prompts" / "agente_whatsapp.md"
    n_contacts = gm.demo_contacts_csv(config)
    n_cal = len(gp.calendar_specs(config))
    index = """ÍNDICE
  PARTE 0  · Convenciones, mapa de pantallas, orden y tiempos
  PARTE 1  · Mails en Google Workspace
  PARTE 2  · Crear la sub-cuenta
  PARTE 3  · Billetera (saldo y recarga automática)
  PARTE 4  · Perfil del negocio, horario comercial y moneda
  PARTE 5  · Usuarios y permisos detallados
  PARTE 6  · Campos personalizados (uno por uno)
  PARTE 7  · Etiquetas (una por una)
  PARTE 8  · Calendarios (15, día por día) + grupo y link público
  PARTE 9  · Twilio (línea de voz)
  PARTE 10 · WhatsApp con Meta
  PARTE 11 · Plantillas de WhatsApp
  PARTE 12 · Base de conocimiento + preguntas frecuentes
  PARTE 13 · Bot de WhatsApp (Conversation AI)
  PARTE 14 · Agente de voz (Voice AI)
  PARTE 15 · Workflows (7, nodo por nodo)
  PARTE 16 · Código Rojo manual
  PARTE 17 · Pacientes demo: importación, DND y turnos de ejemplo
  PARTE 18 · Operación diaria (Secretaría y Dra.)
  PARTE 19 · Guiones de prueba con respuesta esperada
  PARTE 20 · Si algo falla (síntoma → solución)
  PARTE 21 · Mantenimiento (precios, horarios, seguros, vacaciones)
  PARTE 22 · Glosario
  ANEXO A  · Base de conocimiento (texto completo)
  ANEXO B  · Prompt del bot de WhatsApp
  ANEXO C  · Prompt del agente de voz
  ANEXO D  · Preguntas frecuentes para la base de conocimiento
  ANEXO E  · Lista de verificación final"""
    parts = [
        L + STATIC_HEAD + L, "\n" + index,
        h("PARTE 0 · CONVENCIONES, MAPA DE PANTALLAS, ORDEN Y TIEMPOS") + PART_00,
        h("PARTE 1 · MAILS EN GOOGLE WORKSPACE (rgrlk.com)") + PART_01,
        h("PARTE 2 · CREAR LA SUB-CUENTA DE LA DRA.") + PART_02,
        h("PARTE 3 · BILLETERA (SALDO Y RECARGA AUTOMÁTICA)") + PART_03,
        h("PARTE 4 · PERFIL DEL NEGOCIO, HORARIO COMERCIAL Y MONEDA") + PART_04,
        h("PARTE 5 · USUARIOS Y PERMISOS DETALLADOS") + part_05(config),
        h(f"PARTE 6 · CAMPOS PERSONALIZADOS ({len(gp.CUSTOM_FIELDS)}, UNO POR UNO)")
        + "\nANTES DE EMPEZAR: Settings → Custom Fields → pestaña \"Contact\" → \"+ Add Folder\" → \"Agendar.IA\" → \"Save\".\n"
        + fields_detailed(config)
        + f"\n\nCONTROL 6: la carpeta Agendar.IA tiene {len(gp.CUSTOM_FIELDS)} campos con las claves indicadas.\n",
        h(f"PARTE 7 · ETIQUETAS ({len(gp.TAGS)}, UNA POR UNA)")
        + "\nRuta: Settings → \"Tags\" (en algunas versiones Contacts → pestaña \"Tags\").\n\n" + tags_detailed()
        + f"\n\nCONTROL 7: la lista muestra las {len(gp.TAGS)} etiquetas escritas exactamente igual.\n",
        h(f"PARTE 8 · CALENDARIOS ({n_cal}, DÍA POR DÍA)")
        + "\nTodos asignados a la Dra.: GHL impide turnos superpuestos entre sedes y servicios.\n"
        + "Regla de la Dra.: agenda abierta solo 48 h hacia adelante, sin confirmación automática.\n"
        + calendars_detailed(config)
        + sub("8.16 · GRUPO DE CALENDARIOS")
        + "  1. Calendars → Calendar Settings → pestaña \"Groups\" → \"+ Create Group\".\n"
        + "  2. Group name \"Agendar.IA – Dra. Leguizamón\" · Description \"Turnos pediátricos\" · Slug \"dra-leguizamon\" → \"Save\".\n"
        + "  3. Editar cada uno de los 15 calendarios → campo \"Group\" → \"Agendar.IA – Dra. Leguizamón\" → \"Save\".\n"
        + sub("8.17 · LINK PÚBLICO DE RESERVA")
        + "  1. Pestaña \"Groups\" → ícono de cadena del grupo → copiar el link.\n"
        + "  2. Abrirlo en incógnito: deben aparecer los servicios y, al elegir uno, horarios de hasta 2 días.\n"
        + "  3. Ese link va en la base de conocimiento (Parte 12.4).\n"
        + f"\nCONTROL 8: {n_cal} calendarios activos, asignados a la Dra., agrupados y con link funcionando.\n",
        h("PARTE 9 · TWILIO (LÍNEA DE VOZ)") + PART_09,
        h("PARTE 10 · WHATSAPP CON META (TWILIO NO INTERVIENE)") + PART_10,
        h("PARTE 11 · PLANTILLAS DE WHATSAPP") + part_11(config),
        h("PARTE 12 · BASE DE CONOCIMIENTO + PREGUNTAS FRECUENTES") + part_12(config),
        h("PARTE 13 · BOT DE WHATSAPP (CONVERSATION AI)") + PART_13,
        h("PARTE 14 · AGENTE DE VOZ (VOICE AI)") + part_14(gm.welcome_message(voz)),
        h("PARTE 15 · WORKFLOWS (7, NODO POR NODO)") + PART_15,
        h("PARTE 16 · CÓDIGO ROJO MANUAL") + PART_16,
        h("PARTE 17 · PACIENTES DEMO") + part_17(config, n_contacts, gm.sample_turnos()),
        h("PARTE 18 · OPERACIÓN DIARIA") + PART_18,
        h("PARTE 19 · GUIONES DE PRUEBA") + PART_19,
        h("PARTE 20 · SI ALGO FALLA") + PART_20,
        h("PARTE 21 · MANTENIMIENTO") + PART_21,
        h("PARTE 22 · GLOSARIO") + PART_22,
        h("ANEXO A · BASE DE CONOCIMIENTO (pegar en Parte 12.2)") + gp.render_kb(config),
        h("ANEXO B · PROMPT DEL BOT DE WHATSAPP (pegar en Parte 13.3)") + gm.prompt_block(wa),
        h("ANEXO C · PROMPT DEL AGENTE DE VOZ (pegar en Parte 14.2)") + gm.prompt_block(voz),
        h("ANEXO D · PREGUNTAS FRECUENTES (cargar en Parte 12.3)") + "\n" + faq_entries(config),
        h("ANEXO E · LISTA DE VERIFICACIÓN FINAL") + FINAL_CHECKLIST,
        f"\n{L}\nFIN DEL MANUAL DETALLADO · Agendar.IA · Lab.IA · RGrlk Group\n{L}\n",
    ]
    return "".join(parts)


def main():
    OUT.write_text(build(gp.load_config()), encoding="utf-8")
    print(f"Manual detallado: {OUT.relative_to(gp.ROOT)}")


if __name__ == "__main__":
    main()
