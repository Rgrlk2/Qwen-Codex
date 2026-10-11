#!/usr/bin/env python3
"""Aprovisiona la sub-cuenta GoHighLevel de Agendar.IA (Dra. Leguizamón).

Usa la API v2 de GHL con un Private Integration Token. Solo librería estándar.

    export GHL_TOKEN=pit-...            # Settings > Private Integrations
    export GHL_LOCATION_ID=...          # Settings > Business Profile
    python3 ghl_provision.py validate   # valida horarios y lista datos pendientes (sin red)
    python3 ghl_provision.py check      # valida token, sub-cuenta y config
    python3 ghl_provision.py plan       # muestra qué crearía (no escribe)
    python3 ghl_provision.py apply      # crea campos, tags y calendarios (idempotente)
    python3 ghl_provision.py kb         # regenera knowledge/base_conocimiento.md
    python3 ghl_provision.py import-demo [--desde AAAA-MM-DD]
                                        # carga pacientes y turnos ficticios de data/demo/

Scopes del token: locations.readonly, locations/customFields.readonly/.write,
locations/tags.readonly/.write, calendars.readonly/.write, calendars/events.write,
contacts.readonly/.write, users.readonly.
"""
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "https://services.leadconnectorhq.com"
API_VERSION = "2021-07-28"
CALENDAR_API_VERSION = "2021-04-15"
ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config" / "leguizamon.json"
KB_PATH = ROOT / "knowledge" / "base_conocimiento.md"
DEMO_DIR = ROOT / "data" / "demo"
IMPORT_STATE_PATH = DEMO_DIR / ".ghl_import_state.json"
CALENDAR_PREFIX = "AgendarIA · "
DEMO_TAG = "agendaria-demo"
# Paraguay usa UTC-3 todo el año desde octubre de 2024.
UTC_OFFSET = "-03:00"
DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

CUSTOM_FIELDS = [
    ("nombre_hijo", "Nombre del hijo/a", "TEXT", None),
    ("fecha_nacimiento_hijo", "Fecha de nacimiento del hijo/a", "TEXT", None),
    ("hijos_adicionales", "Otros hijos/as registrados", "LARGE_TEXT", None),
    ("parentesco_responsable", "Parentesco del responsable", "TEXT", None),
    ("servicio_solicitado", "Servicio solicitado", "SINGLE_OPTIONS", "servicios"),
    ("sede_preferida", "Sede preferida", "SINGLE_OPTIONS", "sedes"),
    ("cobertura", "Cobertura", "SINGLE_OPTIONS", ["Particular", "Seguro"]),
    ("seguro_nombre", "Seguro médico", "TEXT", None),
    ("idioma_preferido", "Idioma preferido", "SINGLE_OPTIONS", ["Español", "Portugués", "Yopará"]),
    ("motivo_administrativo", "Motivo (administrativo)", "LARGE_TEXT", None),
    ("canal_origen", "Canal de origen", "SINGLE_OPTIONS", ["Llamada", "WhatsApp", "Web", "Administración"]),
]

TAGS = [
    "agendaria",
    "agendaria-voz",
    "agendaria-whatsapp",
    "agendaria-lista-espera",
    "agendaria-urgencia",
    "agendaria-pendiente-confirmacion",
    "agendaria-comprobante-recibido",
    "agendaria-handoff-secretaria",
    DEMO_TAG,
]

# Estado del turno demo -> appointmentStatus de GHL.
STATUS_MAP = {
    "atendido": "showed",
    "inasistencia": "noshow",
    "cancelado": "cancelled",
    "reprogramado": "cancelled",
    "confirmado": "confirmed",
    "pendiente": "new",
}


class ConfigError(Exception):
    pass


def load_config(path=CONFIG_PATH):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def active_services(config):
    return [s for s in config["servicios"] if s.get("activo")]


def sedes_by_key(config):
    return {s["clave"]: s for s in config["sedes"]}


def parse_hhmm(value):
    hour, minute = value.split(":")
    hour, minute = int(hour), int(minute)
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ConfigError(f"Hora inválida: {value}")
    return hour, minute


def minutes(value):
    hour, minute = parse_hhmm(value)
    return hour * 60 + minute


def open_hours_payload(blocks):
    """Convierte [{"dias":[1,2], "desde":"08:00", "hasta":"12:00"}] al formato openHours de GHL."""
    result = []
    for block in blocks:
        days = block["dias"]
        if not days or any(d not in range(7) for d in days):
            raise ConfigError(f"Días inválidos: {days}")
        open_h, open_m = parse_hhmm(block["desde"])
        close_h, close_m = parse_hhmm(block["hasta"])
        if (close_h, close_m) <= (open_h, open_m):
            raise ConfigError(f"Franja vacía: {block['desde']}-{block['hasta']}")
        result.append({
            "daysOfTheWeek": sorted(days),
            "hours": [{"openHour": open_h, "openMinute": open_m,
                       "closeHour": close_h, "closeMinute": close_m}],
        })
    return result


def schedule_errors(config):
    """Bloques fuera del horario de atención, con sede desconocida o superpuestos (una sola doctora)."""
    errors = []
    sedes = sedes_by_key(config)
    general = config["clinica"].get("horario_atencion") or []
    slots = []
    for service in active_services(config):
        for block in service.get("horarios") or []:
            label = f"{service['clave']} {block.get('sede')} {block['desde']}-{block['hasta']}"
            if block.get("sede") not in sedes:
                errors.append(f"{label}: sede desconocida")
            start, end = minutes(block["desde"]), minutes(block["hasta"])
            for day in block["dias"]:
                inside = any(day in g["dias"] and minutes(g["desde"]) <= start and end <= minutes(g["hasta"])
                             for g in general)
                if general and not inside:
                    errors.append(f"{label} ({DAY_NAMES[day]}): fuera del horario de atención")
                slots.append((day, start, end, label, block.get("profesional", "dra")))
    slots.sort()
    for i, (day, start, end, label, prof) in enumerate(slots):
        for other_day, other_start, _, other_label, other_prof in slots[i + 1:]:
            if other_day != day or other_start >= end:
                break
            if prof == other_prof:
                errors.append(f"Superposición {DAY_NAMES[day]}: {label} / {other_label}")
    return errors


def missing_for_calendar(service):
    missing = []
    if not service.get("duracion_min"):
        missing.append("duracion_min")
    if not service.get("horarios"):
        missing.append("horarios")
    return missing


def calendar_name(service, sede):
    return f"{CALENDAR_PREFIX}{service['nombre']} · {sede['corto']}"


def calendar_specs(config):
    """(servicio, sede, bloques) por cada combinación servicio×sede con horarios."""
    sedes = sedes_by_key(config)
    specs = []
    for service in active_services(config):
        grouped = {}
        for block in service.get("horarios") or []:
            grouped.setdefault(block["sede"], []).append(block)
        for sede_key, blocks in grouped.items():
            specs.append((service, sedes[sede_key], blocks))
    return specs


def calendar_payload(config, service, sede, blocks, location_id):
    rules = config["reglas_agenda"]
    clinica = config["clinica"]
    duration = int(service["duracion_min"])
    payload = {
        "locationId": location_id,
        "name": calendar_name(service, sede),
        "description": f"{service['nombre']} en {sede['nombre']} — {clinica['profesional']}. "
                       f"{sede['direccion']}. Turno a nombre del niño/a.",
        "calendarType": "event",
        "slotDuration": duration,
        "slotDurationUnit": "mins",
        "slotInterval": duration,
        "slotIntervalUnit": "mins",
        "appoinmentPerSlot": int(rules["turnos_por_horario"]),
        "allowBookingAfter": int(rules["aviso_minimo_horas"]),
        "allowBookingAfterUnit": "hours",
        "allowBookingFor": int(rules["ventana_reserva_dias"]),
        "allowBookingForUnit": "days",
        "autoConfirm": bool(rules["confirmacion_automatica"]),
        "openHours": open_hours_payload(blocks),
        "isActive": True,
    }
    user_id = clinica.get("ghl_user_id")
    if user_id:
        # Calendario personal: GHL bloquea choques entre todos los calendarios del mismo usuario.
        payload["calendarType"] = "personal"
        payload["teamMembers"] = [{
            "userId": user_id,
            "priority": 1,
            "isPrimary": True,
            "meetingLocationType": "custom",
            "meetingLocation": sede["direccion"],
        }]
    return payload


def custom_field_payloads(config):
    choices = {
        "servicios": [s["nombre"] for s in active_services(config)],
        "sedes": [s["nombre"] for s in config["sedes"]],
    }
    payloads = []
    for key, name, data_type, options in CUSTOM_FIELDS:
        body = {"name": name, "dataType": data_type, "model": "contact", "fieldKey": f"contact.{key}"}
        if isinstance(options, str):
            body["options"] = choices[options]
        elif options:
            body["options"] = list(options)
        payloads.append(body)
    return payloads


def config_gaps(config):
    """Datos PENDIENTES que impiden una configuración completa."""
    gaps = []
    for field in ("telefono_secretaria_transferencia", "centro_urgencias_derivacion", "enlace_reserva_web"):
        if not config["clinica"].get(field):
            gaps.append(f"clinica.{field}")
    for sede in config["sedes"]:
        if not sede.get("direccion"):
            gaps.append(f"sedes.{sede['clave']}.direccion")
    if config.get("seguros_aceptados") is None:
        gaps.append("seguros_aceptados")
    for service in active_services(config):
        for field in missing_for_calendar(service):
            gaps.append(f"{service['clave']}.{field}")
        if service.get("precio_particular_gs") is None:
            gaps.append(f"{service['clave']}.precio_particular_gs")
    return gaps


def format_gs(value):
    return f"Gs. {int(value):,}".replace(",", ".")


def describe_days(days):
    names = [DAY_NAMES[d] for d in sorted(days, key=lambda d: (d == 0, d))]
    return names[0] if len(names) == 1 else ", ".join(names[:-1]) + " y " + names[-1]


def render_kb(config):
    clinica = config["clinica"]
    rules = config["reglas_agenda"]
    sedes = sedes_by_key(config)
    profesionales = {p["clave"]: p["nombre"] for p in clinica.get("profesionales", [])}
    pending = "PENDIENTE — Secretaría lo confirma"

    def value(v):
        return pending if v in (None, "", []) else v

    def gs(v):
        return pending if v is None else format_gs(v)

    lines = [
        "# Base de conocimiento — Agendar.IA · Dra. Claudia Leguizamón",
        "",
        "> Generado por `ghl_provision.py kb` desde `config/leguizamon.json`. No editar a mano.",
        "> Regla para los agentes: si un dato dice PENDIENTE o no figura aquí, NO inventar; derivar a Secretaría.",
    ]
    if config.get("_modo") == "DEMO":
        lines.append("> **DATOS DE MUESTRA (DEMO).** No usar con pacientes reales.")
    lines += [
        "",
        "## Consultorio",
        f"- Profesional: {clinica['profesional']} ({clinica['especialidad']}).",
        f"- Zona: {clinica['ciudad']} y alrededores.",
        f"- Medios de pago: {', '.join(clinica['medios_pago'])}.",
        f"- Seña / preconsulta: {gs(clinica.get('sena_preconsulta_gs'))}.",
        "- Idiomas de atención: español (por defecto), portugués y yopará.",
        f"- Reserva por enlace web: {value(clinica.get('enlace_reserva_web'))}.",
        "- Este número es el canal propio de agendamiento de la Dra. (ya no se agenda por la plataforma del sanatorio).",
        "",
        "## Horario general de atención",
    ]
    for block in clinica.get("horario_atencion") or []:
        lines.append(f"- {describe_days(block['dias']).capitalize()}: {block['desde']} a {block['hasta']}.")
    lines += ["", "## Sedes"]
    for sede in config["sedes"]:
        extra = f" {sede['referencia']}." if sede.get("referencia") else ""
        phone = f" Tel. {sede['telefono']}." if sede.get("telefono") else ""
        lines.append(f"- **{sede['nombre']}**: {value(sede.get('direccion'))}.{extra}{phone}")
    lines += [
        "",
        "## Reglas de agenda",
        f"- La agenda se habilita con {rules['ventana_reserva_dias'] * 24} horas de antelación. "
        "Para fechas posteriores se ofrece lista de espera.",
        "- El turno se registra a nombre del niño o niña; un responsable puede tener varios hijos.",
        "- Todo turno queda pendiente hasta que Secretaría lo confirma por WhatsApp.",
        "- Enviar un comprobante no confirma el pago: Secretaría verifica que el dinero ingresó.",
        "- El paciente elige: seguir por WhatsApp o reservar en el enlace web. Nunca se lo obliga a usar la plataforma.",
        "",
        "## Servicios",
    ]
    for service in config["servicios"]:
        if not service.get("activo"):
            lines.append(f"- **{service['nombre']}**: todavía no disponible. Se toma el interés como mensaje.")
            continue
        duration = f"{service['duracion_min']} min" if service.get("duracion_min") else pending
        insurance = {True: "particular o seguro", False: "solo particular"}.get(
            service.get("acepta_seguro"), f"cobertura {pending}")
        lines.append(f"- **{service['nombre']}** ({service['modalidad']}): duración {duration}; {insurance}; "
                     f"valor particular {gs(service.get('precio_particular_gs'))}.")
        if service.get("nota"):
            lines.append(f"  - {service['nota']}")
        if not service.get("horarios"):
            lines.append(f"  - Horarios: {pending}.")
        for block in service.get("horarios") or []:
            who = profesionales.get(block.get("profesional", "dra"), clinica["profesional"])
            lines.append(f"  - {sedes[block['sede']]['nombre']}: {describe_days(block['dias'])} "
                         f"de {block['desde']} a {block['hasta']} ({who}).")
    seguros = config.get("seguros_aceptados")
    names = {s["clave"]: s["nombre"] for s in config["servicios"]}
    lines += ["", "## Seguros y convenios"]
    if seguros is None:
        lines.append(f"- {pending}.")
    for seguro in seguros or []:
        covered = ", ".join(names[k] for k in seguro["servicios"])
        lines.append(f"- **{seguro['nombre']}**: cubre {covered}; copago {format_gs(seguro['copago_gs'])}.")
    catalogo = config.get("catalogo_vacunas")
    if catalogo:
        lines += ["", "## Vacunas (precio del producto; la aplicación se cobra aparte)"]
        for vacuna in catalogo:
            lines.append(f"- {vacuna['nombre']}: {gs(vacuna.get('precio_gs'))} · {vacuna['stock']}.")
    lines += [
        "",
        "## Límites del asistente",
        "- No da ninguna indicación médica, ni siquiera una que parezca correcta o haya dado la Dra. antes "
        "(ej.: lavado nasal). No diagnostica, no interpreta síntomas, fotos ni estudios, no indica medicamentos.",
        f"- Urgencias: responde únicamente \"{clinica.get('mensaje_urgencia') or pending}\" y avisa a Secretaría.",
        "- Recetas con error, medicamentos en falta o dudas sobre una indicación: pasa a Secretaría.",
        "- No comparte datos de otros pacientes.",
        "",
    ]
    return "\n".join(lines)


class GHLClient:
    def __init__(self, token, location_id, base_url=BASE_URL):
        self.token = token
        self.location_id = location_id
        self.base_url = base_url

    def request(self, method, path, body=None, version=API_VERSION):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base_url + path, data=data, method=method, headers={
            "Authorization": f"Bearer {self.token}",
            "Version": version,
            "Accept": "application/json",
            "Content-Type": "application/json",
        })
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    raw = resp.read()
                return json.loads(raw) if raw else {}
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < 3:
                    time.sleep(2 ** (attempt + 1))
                    continue
                detail = e.read().decode(errors="replace")[:500]
                raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detail}") from None

    def location(self):
        return self.request("GET", f"/locations/{self.location_id}")["location"]

    def custom_fields(self):
        return self.request("GET", f"/locations/{self.location_id}/customFields?model=contact").get("customFields", [])

    def create_custom_field(self, body):
        return self.request("POST", f"/locations/{self.location_id}/customFields", body)

    def tags(self):
        return self.request("GET", f"/locations/{self.location_id}/tags").get("tags", [])

    def create_tag(self, name):
        return self.request("POST", f"/locations/{self.location_id}/tags", {"name": name})

    def calendars(self):
        return self.request("GET", f"/calendars/?locationId={self.location_id}",
                            version=CALENDAR_API_VERSION).get("calendars", [])

    def create_calendar(self, body):
        return self.request("POST", "/calendars/", body, version=CALENDAR_API_VERSION)

    def upsert_contact(self, body):
        return self.request("POST", "/contacts/upsert", dict(body, locationId=self.location_id))["contact"]

    def create_appointment(self, body):
        return self.request("POST", "/calendars/events/appointments", dict(body, locationId=self.location_id),
                            version=CALENDAR_API_VERSION)


def build_plan(config, location_id, existing_fields=(), existing_tags=(), existing_calendars=()):
    field_names = {f.get("name", "").lower() for f in existing_fields}
    tag_names = {t.get("name", "").lower() for t in existing_tags}
    calendar_names = {c.get("name", "").lower() for c in existing_calendars}
    plan = {"custom_fields": [], "tags": [], "calendars": [], "skipped_calendars": []}
    for body in custom_field_payloads(config):
        if body["name"].lower() not in field_names:
            plan["custom_fields"].append(body)
    for tag in TAGS:
        if tag not in tag_names:
            plan["tags"].append(tag)
    for service in active_services(config):
        missing = missing_for_calendar(service)
        if missing:
            plan["skipped_calendars"].append({"servicio": service["nombre"], "faltan": missing})
    for service, sede, blocks in calendar_specs(config):
        if missing_for_calendar(service) or calendar_name(service, sede).lower() in calendar_names:
            continue
        plan["calendars"].append(calendar_payload(config, service, sede, blocks, location_id))
    return plan


def client_from_env():
    token = os.environ.get("GHL_TOKEN")
    location_id = os.environ.get("GHL_LOCATION_ID") or load_config().get("ghl", {}).get("location_id")
    if not token or not location_id:
        sys.exit("Falta GHL_TOKEN (y GHL_LOCATION_ID si no está en config.ghl.location_id).")
    return GHLClient(token, location_id)


def ensure_valid_schedule(config):
    errors = schedule_errors(config)
    if errors:
        raise ConfigError("horarios inválidos:\n  " + "\n  ".join(errors))


def print_gaps(config):
    gaps = config_gaps(config)
    if gaps:
        print(f"\nDatos PENDIENTES en config ({len(gaps)}):")
        for gap in gaps:
            print(f"  - {gap}")


def cmd_validate(config, _args):
    ensure_valid_schedule(config)
    print(f"Horarios OK: {len(calendar_specs(config))} calendarios (servicio × sede), sin superposiciones.")
    print_gaps(config)


def cmd_check(config, _args):
    client = client_from_env()
    location = client.location()
    print(f"Sub-cuenta OK: {location.get('name')} ({client.location_id}) · zona {location.get('timezone')}")
    if location.get("timezone") and location["timezone"] != config["clinica"]["zona_horaria"]:
        print(f"  ATENCIÓN: la zona horaria debería ser {config['clinica']['zona_horaria']}.")
    print(f"Campos personalizados: {len(client.custom_fields())} · Tags: {len(client.tags())} · "
          f"Calendarios: {len(client.calendars())}")
    print_gaps(config)


def live_plan(config, client):
    ensure_valid_schedule(config)
    return build_plan(config, client.location_id, client.custom_fields(), client.tags(), client.calendars())


def print_plan(plan):
    print(f"Campos a crear: {[f['name'] for f in plan['custom_fields']]}")
    print(f"Tags a crear: {plan['tags']}")
    print(f"Calendarios a crear ({len(plan['calendars'])}):")
    for calendar in plan["calendars"]:
        print(f"  - {calendar['name']}")
    for skipped in plan["skipped_calendars"]:
        print(f"  Calendario omitido: {skipped['servicio']} (faltan {', '.join(skipped['faltan'])})")


def cmd_plan(config, _args):
    client = client_from_env()
    print_plan(live_plan(config, client))
    print_gaps(config)


def cmd_apply(config, _args):
    client = client_from_env()
    plan = live_plan(config, client)
    print_plan(plan)
    for body in plan["custom_fields"]:
        client.create_custom_field(body)
        print(f"  + campo {body['name']}")
    for tag in plan["tags"]:
        client.create_tag(tag)
        print(f"  + tag {tag}")
    for body in plan["calendars"]:
        created = client.create_calendar(body)
        print(f"  + calendario {body['name']} ({created.get('calendar', {}).get('id', '?')})")
    print_gaps(config)


def cmd_kb(config, _args):
    KB_PATH.parent.mkdir(parents=True, exist_ok=True)
    KB_PATH.write_text(render_kb(config), encoding="utf-8")
    print(f"Base de conocimiento escrita en {KB_PATH.relative_to(ROOT)}")


def read_csv(name):
    with open(DEMO_DIR / name, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def contact_payload(responsable, children, field_ids, sede_names):
    """Contacto GHL = responsable; los hijos van en campos. DND activo: los demo nunca reciben mensajes."""
    first = children[0]
    fields = {
        "nombre_hijo": f"{first['nombre']} {first['apellido']}",
        "fecha_nacimiento_hijo": first["fecha_nacimiento"],
        "hijos_adicionales": "; ".join(f"{c['nombre']} {c['apellido']} ({c['fecha_nacimiento']})" for c in children[1:]),
        "parentesco_responsable": responsable["parentesco"],
        "sede_preferida": sede_names[responsable["sede_habitual"]],
        "cobertura": "Seguro" if responsable["seguro"] else "Particular",
        "seguro_nombre": responsable["seguro"],
        "idioma_preferido": responsable["idioma"],
    }
    return {
        "firstName": responsable["nombre"],
        "lastName": responsable["apellido"],
        "phone": responsable["telefono"],
        "email": responsable["email"],
        "source": "Agendar.IA demo",
        "tags": ["agendaria", DEMO_TAG],
        "dnd": True,
        "customFields": [{"id": field_ids[k], "field_value": v} for k, v in fields.items() if k in field_ids and v],
    }


def appointment_payload(turno, calendar_id, contact_id, patient):
    return {
        "calendarId": calendar_id,
        "contactId": contact_id,
        "title": f"{turno['servicio_nombre']} — {patient['nombre']} {patient['apellido']}",
        "startTime": f"{turno['inicio']}:00{UTC_OFFSET}",
        "endTime": f"{turno['fin']}:00{UTC_OFFSET}",
        "appointmentStatus": STATUS_MAP[turno["estado"]],
        "address": turno["sede_nombre"],
        "ignoreDateRange": True,
        "ignoreFreeSlotValidation": True,
        "toNotify": False,
    }


def cmd_import_demo(config, args):
    since = args[args.index("--desde") + 1] if "--desde" in args else "0000"
    client = client_from_env()
    state = json.loads(IMPORT_STATE_PATH.read_text()) if IMPORT_STATE_PATH.exists() else {"contacts": {}, "turnos": {}}
    field_ids = {f.get("fieldKey", "").removeprefix("contact."): f["id"] for f in client.custom_fields()}
    calendars = {c["name"]: c["id"] for c in client.calendars()}
    sedes = sedes_by_key(config)
    sede_names = {k: s["nombre"] for k, s in sedes.items()}
    patients = {p["id"]: p for p in read_csv("pacientes.csv")}
    children_by_resp = {}
    for patient in patients.values():
        children_by_resp.setdefault(patient["responsable_id"], []).append(patient)
    services = {s["clave"]: s for s in config["servicios"]}
    try:
        for responsable in read_csv("responsables.csv"):
            if responsable["id"] in state["contacts"]:
                continue
            body = contact_payload(responsable, children_by_resp[responsable["id"]], field_ids, sede_names)
            state["contacts"][responsable["id"]] = client.upsert_contact(body)["id"]
        print(f"Contactos demo: {len(state['contacts'])}")
        for turno in read_csv("turnos.csv"):
            if turno["id"] in state["turnos"] or turno["inicio"] < since:
                continue
            name = calendar_name(services[turno["servicio"]], sedes[turno["sede"]])
            if name not in calendars:
                raise RuntimeError(f"Falta el calendario '{name}'. Ejecutar 'apply' primero.")
            patient = patients[turno["paciente_id"]]
            body = appointment_payload(turno, calendars[name], state["contacts"][turno["responsable_id"]], patient)
            state["turnos"][turno["id"]] = client.create_appointment(body).get("id", "?")
            if len(state["turnos"]) % 100 == 0:
                print(f"  turnos cargados: {len(state['turnos'])}")
    finally:
        IMPORT_STATE_PATH.write_text(json.dumps(state))
    print(f"Turnos demo cargados: {len(state['turnos'])}")


COMMANDS = {"validate": cmd_validate, "check": cmd_check, "plan": cmd_plan, "apply": cmd_apply,
            "kb": cmd_kb, "import-demo": cmd_import_demo}


def main(argv):
    if len(argv) < 2 or argv[1] not in COMMANDS:
        sys.exit(__doc__)
    try:
        COMMANDS[argv[1]](load_config(), argv[2:])
    except (ConfigError, RuntimeError) as e:
        sys.exit(f"Error: {e}")


if __name__ == "__main__":
    main(sys.argv)
