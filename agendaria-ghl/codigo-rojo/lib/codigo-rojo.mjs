// Código Rojo: bloquea la agenda de la Dra. por un imprevisto y propone nuevos horarios
// a cada paciente afectado. No borra turnos: los cancela con motivo y deja la propuesta
// en el contacto; el workflow de GHL envía el WhatsApp y el bot gestiona la respuesta.

export const BASE_URL = "https://services.leadconnectorhq.com";
export const CALENDAR_VERSION = "2021-04-15";
export const CONTACT_VERSION = "2021-07-28";
export const TAG_AFECTADO = "codigo-rojo-afectado";
export const ACTIVE_STATUSES = new Set(["new", "confirmed"]);
export const MOTIVOS = ["Cesárea de urgencia", "Parto", "Urgencia médica", "Imprevisto personal"];
export const PROPOSAL_FIELDS = ["cr_propuesta_1", "cr_propuesta_2", "cr_propuesta_3"];
const OFFSET_MS = -3 * 3600 * 1000; // Paraguay: UTC-3 todo el año
const WINDOW_MS = 48 * 3600 * 1000; // regla de la Dra.: agenda a 48 h
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function formatLocal(ms) {
  const d = new Date(ms + OFFSET_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function parseRequest(body, now = Date.now()) {
  const horas = Number(body.horas ?? 2);
  if (!Number.isInteger(horas) || horas < 2 || horas > 5) throw new Error("La duración debe ser de 2 a 5 horas.");
  if (!MOTIVOS.includes(body.motivo)) throw new Error("Motivo inválido.");
  return { start: now, end: now + horas * 3600 * 1000, motivo: body.motivo, confirmar: body.confirmar === true };
}

export function affectedAppointments(events, start, end) {
  return events
    .filter((e) => ACTIVE_STATUSES.has(e.appointmentStatus))
    .filter((e) => Date.parse(e.startTime) < end && Date.parse(e.endTime) > start)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

export function pickProposals(freeSlots, after, limit = 3, taken = new Set()) {
  const slots = Object.entries(freeSlots)
    .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .flatMap(([, value]) => value.slots || [])
    .map((iso) => Date.parse(iso))
    .filter((ms) => ms >= after && ms <= after + WINDOW_MS)
    .sort((a, b) => a - b);
  const picked = [];
  for (const ms of slots) {
    if (picked.length === limit) break;
    if (!taken.has(ms)) picked.push(ms);
  }
  return picked;
}

export class GHL {
  constructor({ token, locationId, fetchImpl = fetch }) {
    this.token = token;
    this.locationId = locationId;
    this.fetch = fetchImpl;
  }

  async request(method, path, { body, version = CALENDAR_VERSION } = {}) {
    const res = await this.fetch(BASE_URL + path, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Version: version,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  }

  async events(userId, start, end) {
    const q = new URLSearchParams({ locationId: this.locationId, userId, startTime: start, endTime: end });
    return (await this.request("GET", `/calendars/events?${q}`)).events || [];
  }

  async freeSlots(calendarId, start, end) {
    const q = new URLSearchParams({ startDate: start, endDate: end, timezone: "America/Asuncion" });
    return this.request("GET", `/calendars/${calendarId}/free-slots?${q}`);
  }

  blockSlot(userId, start, end, title) {
    return this.request("POST", "/calendars/events/block-slots", {
      body: { locationId: this.locationId, assignedUserId: userId, title,
              startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString() },
    });
  }

  cancelAppointment(id) {
    return this.request("PUT", `/calendars/events/appointments/${id}`, { body: { appointmentStatus: "cancelled" } });
  }

  async fieldIds() {
    const data = await this.request("GET", `/locations/${this.locationId}/customFields?model=contact`,
      { version: CONTACT_VERSION });
    return Object.fromEntries((data.customFields || []).map((f) => [String(f.fieldKey).replace(/^contact\./, ""), f.id]));
  }

  updateContactFields(contactId, values, ids) {
    const customFields = Object.entries(values).filter(([k]) => ids[k]).map(([k, v]) => ({ id: ids[k], field_value: v }));
    return this.request("PUT", `/contacts/${contactId}`, { body: { customFields }, version: CONTACT_VERSION });
  }

  addNote(contactId, body) {
    return this.request("POST", `/contacts/${contactId}/notes`, { body: { body }, version: CONTACT_VERSION });
  }

  addTag(contactId, tag) {
    return this.request("POST", `/contacts/${contactId}/tags`, { body: { tags: [tag] }, version: CONTACT_VERSION });
  }
}

// Vista previa (confirmar=false) o ejecución (confirmar=true).
export async function runCodigoRojo(ghl, userId, req) {
  const affected = affectedAppointments(await ghl.events(userId, req.start, req.end), req.start, req.end);
  const preview = affected.map((e) => ({ id: e.id, titulo: e.title, inicio: formatLocal(Date.parse(e.startTime)) }));
  if (!req.confirmar) return { modo: "vista_previa", afectados: preview };

  await ghl.blockSlot(userId, req.start, req.end, `Código Rojo — ${req.motivo}`);
  const ids = await ghl.fieldIds();
  const taken = new Set();
  const results = [];
  for (const e of affected) {
    const slots = await ghl.freeSlots(e.calendarId, req.end, req.end + WINDOW_MS);
    const proposals = pickProposals(slots, req.end, 3, taken);
    proposals.forEach((ms) => taken.add(ms));
    const original = formatLocal(Date.parse(e.startTime));
    const values = { cr_turno_original: `${e.title} · ${original}` };
    PROPOSAL_FIELDS.forEach((key, i) => { values[key] = proposals[i] ? formatLocal(proposals[i]) : ""; });
    await ghl.cancelAppointment(e.id);
    await ghl.updateContactFields(e.contactId, values, ids);
    await ghl.addNote(e.contactId, `Código Rojo (${req.motivo}). Turno ${original} cancelado sin borrar. ` +
      `Propuestas: ${proposals.map(formatLocal).join(" / ") || "sin horarios en 48 h → lista de espera"}.`);
    await ghl.addTag(e.contactId, TAG_AFECTADO);
    results.push({ id: e.id, titulo: e.title, inicio: original, propuestas: proposals.map(formatLocal) });
  }
  return { modo: "ejecutado", bloqueo: { desde: formatLocal(req.start), hasta: formatLocal(req.end) }, afectados: results };
}

export function pinMatches(given, expected) {
  if (typeof given !== "string" || !expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
