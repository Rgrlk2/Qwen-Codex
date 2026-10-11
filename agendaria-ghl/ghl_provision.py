#!/usr/bin/env python3
"""Aprovisiona la sub-cuenta GoHighLevel de Agendar.IA (Dra. Leguizamón).

Usa la API v2 de GHL con un Private Integration Token. Solo librería estándar.

    export GHL_TOKEN=pit-...            # Settings > Private Integrations
    export GHL_LOCATION_ID=...          # Settings > Business Profile
    python3 ghl_provision.py check      # valida token, sub-cuenta y config
    python3 ghl_provision.py plan       # muestra qué crearía (no escribe)
    python3 ghl_provision.py apply      # crea campos, tags y calendarios (idempotente)
    python3 ghl_provision.py kb         # regenera knowledge/base_conocimiento.md

Scopes del token: locations.readonly, locations/customFields.readonly/.write,
locations/tags.readonly/.write, calendars.readonly/.write, users.readonly.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = "https://services.leadconnectorhq.com"
API_VERSION = "2021-07-28"
CALENDAR_API_VERSION = "2021-04-15"
ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config" / "leguizamon.json"
KB_PATH = ROOT / "knowledge" / "base_conocimiento.md"
CALENDAR_PREFIX = "AgendarIA · "

CUSTOM_FIELDS = [
    ("nombre_hijo", "Nombre del hijo/a", "TEXT", None),
    ("fecha_nacimiento_hijo", "Fecha de nacimiento del hijo/a", "TEXT", None),
    ("hijos_adicionales", "Otros hijos/as registrados", "LARGE_TEXT", None),
    ("parentesco_responsable", "Parentesco del responsable", "TEXT", None),
    ("servicio_solicitado", "Servicio solicitado", "SINGLE_OPTIONS", "servicios"),
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
]


class ConfigError(Exception):
    pass


def load_config(path=CONFIG_PATH):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def active_services(config):
    return [s for s in config["servicios"] if s.get("activo")]


def parse_hhmm(value):
    hour, minute = value.split(":")
    hour, minute = int(hour), int(minute)
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ConfigError(f"Hora inválida: {value}")
    return hour, minute


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


def missing_for_calendar(service):
    missing = []
    if not service.get("duracion_min"):
        missing.append("duracion_min")
    if not service.get("horarios"):
        missing.append("horarios")
    return missing


def calendar_payload(config, service, location_id):
    rules = config["reglas_agenda"]
    clinica = config["clinica"]
    duration = int(service["duracion_min"])
    payload = {
        "locationId": location_id,
        "name": CALENDAR_PREFIX + service["nombre"],
        "description": f"{service['nombre']} — {clinica['profesional']}. Turno a nombre del niño/a.",
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
        "openHours": open_hours_payload(service["horarios"]),
        "isActive": True,
    }
    user_id = clinica.get("ghl_user_id")
    if user_id:
        payload["calendarType"] = "personal"
        payload["teamMembers"] = [{
            "userId": user_id,
            "priority": 1,
            "isPrimary": True,
            "meetingLocationType": "custom",
            "meetingLocation": clinica.get("direccion") or clinica["ciudad"],
        }]
    return payload


def custom_field_payloads(config):
    service_names = [s["nombre"] for s in active_services(config)]
    payloads = []
    for key, name, data_type, options in CUSTOM_FIELDS:
        body = {"name": name, "dataType": data_type, "model": "contact", "fieldKey": f"contact.{key}"}
        if options == "servicios":
            body["options"] = service_names
        elif options:
            body["options"] = list(options)
        payloads.append(body)
    return payloads


def config_gaps(config):
    """Datos PENDIENTES que impiden una configuración completa."""
    gaps = []
    for field in ("direccion", "telefono_secretaria_transferencia", "centro_urgencias_derivacion"):
        if not config["clinica"].get(field):
            gaps.append(f"clinica.{field}")
    if config.get("seguros_aceptados") is None:
        gaps.append("seguros_aceptados")
    for service in active_services(config):
        for field in missing_for_calendar(service):
            gaps.append(f"{service['clave']}.{field}")
        if service.get("precio_particular_gs") is None:
            gaps.append(f"{service['clave']}.precio_particular_gs")
    return gaps


def render_kb(config):
    clinica = config["clinica"]
    rules = config["reglas_agenda"]
    pending = "PENDIENTE — Secretaría lo confirma"

    def value(v):
        return pending if v in (None, "", []) else v

    def gs(v):
        return pending if v is None else f"Gs. {int(v):,}".replace(",", ".")

    lines = [
        "# Base de conocimiento — Agendar.IA · Dra. Claudia Leguizamón",
        "",
        "> Generado por `ghl_provision.py kb` desde `config/leguizamon.json`. No editar a mano.",
        "> Regla para los agentes: si un dato dice PENDIENTE, NO inventar; derivar a Secretaría.",
        "",
        "## Consultorio",
        f"- Profesional: {clinica['profesional']} ({clinica['especialidad']}).",
        f"- Ciudad: {clinica['ciudad']}.",
        f"- Dirección: {value(clinica.get('direccion'))}.",
        f"- Medios de pago: {', '.join(clinica['medios_pago'])}.",
        f"- Seña / preconsulta: {gs(clinica.get('sena_preconsulta_gs'))}.",
        "- Idiomas de atención: español, portugués y yopará.",
        "",
        "## Reglas de agenda",
        f"- La agenda se habilita con {rules['ventana_reserva_dias'] * 24} horas de antelación. "
        "Para fechas posteriores se ofrece lista de espera.",
        "- El turno se registra a nombre del niño o niña; un responsable puede tener varios hijos.",
        "- Todo turno queda pendiente hasta que Secretaría lo confirma por WhatsApp.",
        "- Enviar un comprobante no confirma el pago: Secretaría verifica que el dinero ingresó.",
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
        lines.append(
            f"- **{service['nombre']}** ({service['modalidad']}): duración {duration}; {insurance}; "
            f"precio particular {gs(service.get('precio_particular_gs'))}; "
            f"horarios {'según calendario' if service.get('horarios') else pending}."
        )
    seguros = config.get("seguros_aceptados")
    lines += [
        "",
        "## Seguros",
        f"- Seguros aceptados: {', '.join(seguros) if seguros else pending}.",
        "",
        "## Límites del asistente",
        "- No brinda consejo médico, no interpreta síntomas, fotos ni estudios, no indica medicamentos ni tratamientos.",
        "- Ante una posible urgencia indica llamar al 141 o al 911 o acudir a urgencias, y avisa a Secretaría.",
        f"- Centro de urgencias de referencia: {value(clinica.get('centro_urgencias_derivacion'))}.",
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
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:500]
            raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {detail}") from None
        return json.loads(raw) if raw else {}

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
        name = CALENDAR_PREFIX + service["nombre"]
        if name.lower() in calendar_names:
            continue
        missing = missing_for_calendar(service)
        if missing:
            plan["skipped_calendars"].append({"servicio": service["nombre"], "faltan": missing})
            continue
        plan["calendars"].append(calendar_payload(config, service, location_id))
    return plan


def client_from_env():
    token = os.environ.get("GHL_TOKEN")
    location_id = os.environ.get("GHL_LOCATION_ID")
    if not token or not location_id:
        sys.exit("Faltan variables de entorno GHL_TOKEN y/o GHL_LOCATION_ID.")
    return GHLClient(token, location_id)


def print_gaps(config):
    gaps = config_gaps(config)
    if gaps:
        print(f"\nDatos PENDIENTES en config ({len(gaps)}):")
        for gap in gaps:
            print(f"  - {gap}")


def cmd_check(config):
    client = client_from_env()
    location = client.location()
    print(f"Sub-cuenta OK: {location.get('name')} ({client.location_id}) · zona {location.get('timezone')}")
    if location.get("timezone") and location["timezone"] != config["clinica"]["zona_horaria"]:
        print(f"  ATENCIÓN: la zona horaria debería ser {config['clinica']['zona_horaria']}.")
    print(f"Campos personalizados: {len(client.custom_fields())} · Tags: {len(client.tags())} · "
          f"Calendarios: {len(client.calendars())}")
    print_gaps(config)


def live_plan(config, client):
    return build_plan(config, client.location_id, client.custom_fields(), client.tags(), client.calendars())


def print_plan(plan):
    print(f"Campos a crear: {[f['name'] for f in plan['custom_fields']]}")
    print(f"Tags a crear: {plan['tags']}")
    print(f"Calendarios a crear: {[c['name'] for c in plan['calendars']]}")
    for skipped in plan["skipped_calendars"]:
        print(f"  Calendario omitido: {skipped['servicio']} (faltan {', '.join(skipped['faltan'])})")


def cmd_plan(config):
    client = client_from_env()
    print_plan(live_plan(config, client))
    print_gaps(config)


def cmd_apply(config):
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


def cmd_kb(config):
    KB_PATH.parent.mkdir(parents=True, exist_ok=True)
    KB_PATH.write_text(render_kb(config), encoding="utf-8")
    print(f"Base de conocimiento escrita en {KB_PATH.relative_to(ROOT)}")


COMMANDS = {"check": cmd_check, "plan": cmd_plan, "apply": cmd_apply, "kb": cmd_kb}


def main(argv):
    if len(argv) != 2 or argv[1] not in COMMANDS:
        sys.exit(__doc__)
    try:
        COMMANDS[argv[1]](load_config())
    except (ConfigError, RuntimeError) as e:
        sys.exit(f"Error: {e}")


if __name__ == "__main__":
    main(sys.argv)
