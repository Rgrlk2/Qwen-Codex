import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GHL, TAG_AFECTADO, affectedAppointments, formatLocal, parseRequest, pickProposals, pinMatches, runCodigoRojo,
} from "../lib/codigo-rojo.mjs";

const NOW = Date.parse("2026-10-12T14:00:00-03:00"); // lunes 14:00
const iso = (s) => `2026-10-${s}:00-03:00`;

function fakeFetch(routes, calls) {
  return async (url, init) => {
    const path = url.replace("https://services.leadconnectorhq.com", "");
    calls.push({ method: init.method, path, body: init.body ? JSON.parse(init.body) : undefined });
    const match = routes.find(([m, re]) => m === init.method && re.test(path));
    const payload = match ? match[2](path) : {};
    return { ok: true, status: 200, text: async () => JSON.stringify(payload) };
  };
}

test("formatLocal usa hora de Paraguay", () => {
  assert.equal(formatLocal(NOW), "lunes 12/10 14:00");
});

test("parseRequest valida horas y motivo", () => {
  assert.equal(parseRequest({ motivo: "Parto" }, NOW).end - NOW, 2 * 3600e3);
  assert.equal(parseRequest({ motivo: "Parto", horas: 5 }, NOW).end - NOW, 5 * 3600e3);
  assert.throws(() => parseRequest({ motivo: "Parto", horas: 1 }, NOW));
  assert.throws(() => parseRequest({ motivo: "Parto", horas: 6 }, NOW));
  assert.throws(() => parseRequest({ motivo: "otro" }, NOW));
  assert.equal(parseRequest({ motivo: "Parto", confirmar: "true" }, NOW).confirmar, false);
});

test("solo turnos activos que se superponen con la ventana", () => {
  const end = NOW + 3 * 3600e3;
  const events = [
    { id: "a", appointmentStatus: "confirmed", startTime: iso("12T15:00"), endTime: iso("12T15:20") },
    { id: "b", appointmentStatus: "cancelled", startTime: iso("12T15:20"), endTime: iso("12T15:40") },
    { id: "c", appointmentStatus: "new", startTime: iso("12T13:50"), endTime: iso("12T14:10") },
    { id: "d", appointmentStatus: "new", startTime: iso("12T17:00"), endTime: iso("12T17:20") },
    { id: "e", appointmentStatus: "showed", startTime: iso("12T14:30"), endTime: iso("12T14:50") },
  ];
  assert.deepEqual(affectedAppointments(events, NOW, end).map((e) => e.id), ["c", "a"]);
});

test("propuestas dentro de 48 h, sin repetir horarios ya ofrecidos", () => {
  const after = NOW + 3 * 3600e3;
  const free = {
    "2026-10-13": { slots: [iso("13T08:00"), iso("13T08:20"), iso("13T08:40")] },
    "2026-10-16": { slots: [iso("16T08:00")] },
    traceId: "x",
  };
  const taken = new Set([Date.parse(iso("13T08:00"))]);
  assert.deepEqual(pickProposals(free, after, 3, taken).map(formatLocal),
    ["martes 13/10 08:20", "martes 13/10 08:40"]);
});

test("vista previa no modifica nada", async () => {
  const calls = [];
  const ghl = new GHL({ token: "t", locationId: "L", fetchImpl: fakeFetch([
    ["GET", /^\/calendars\/events\?/, () => ({ events: [
      { id: "a", title: "Consulta — Mateo", appointmentStatus: "confirmed", startTime: iso("12T15:00"), endTime: iso("12T15:20") }] })],
  ], calls) });
  const out = await runCodigoRojo(ghl, "U", parseRequest({ motivo: "Parto" }, NOW));
  assert.equal(out.modo, "vista_previa");
  assert.equal(out.afectados.length, 1);
  assert.ok(calls.every((c) => c.method === "GET"));
});

test("ejecución bloquea, cancela sin borrar, propone y etiqueta", async () => {
  const calls = [];
  const events = [
    { id: "a", calendarId: "C1", contactId: "K1", title: "Consulta — Mateo", appointmentStatus: "confirmed",
      startTime: iso("12T15:00"), endTime: iso("12T15:20") },
    { id: "b", calendarId: "C1", contactId: "K2", title: "Consulta — Lucía", appointmentStatus: "new",
      startTime: iso("12T15:20"), endTime: iso("12T15:40") },
  ];
  const free = { "2026-10-13": { slots: [iso("13T08:00"), iso("13T08:20"), iso("13T08:40"), iso("13T09:00")] } };
  const ghl = new GHL({ token: "t", locationId: "L", fetchImpl: fakeFetch([
    ["GET", /^\/calendars\/events\?/, () => ({ events })],
    ["GET", /free-slots/, () => free],
    ["GET", /customFields/, () => ({ customFields: [
      { id: "F0", fieldKey: "contact.cr_turno_original" }, { id: "F1", fieldKey: "contact.cr_propuesta_1" },
      { id: "F2", fieldKey: "contact.cr_propuesta_2" }, { id: "F3", fieldKey: "contact.cr_propuesta_3" }] })],
  ], calls) });
  const out = await runCodigoRojo(ghl, "U", parseRequest({ motivo: "Cesárea de urgencia", horas: 3, confirmar: true }, NOW));

  assert.equal(out.modo, "ejecutado");
  assert.ok(!calls.some((c) => c.method === "DELETE"));
  const block = calls.find((c) => c.path === "/calendars/events/block-slots");
  assert.equal(block.body.title, "Código Rojo — Cesárea de urgencia");
  assert.equal(block.body.assignedUserId, "U");
  const cancels = calls.filter((c) => c.method === "PUT" && c.path.startsWith("/calendars/events/appointments/"));
  assert.deepEqual(cancels.map((c) => c.body.appointmentStatus), ["cancelled", "cancelled"]);
  assert.deepEqual(out.afectados[0].propuestas, ["martes 13/10 08:00", "martes 13/10 08:20", "martes 13/10 08:40"]);
  assert.deepEqual(out.afectados[1].propuestas, ["martes 13/10 09:00"]);
  const tags = calls.filter((c) => c.path.endsWith("/tags"));
  assert.deepEqual(tags.map((c) => c.body.tags[0]), [TAG_AFECTADO, TAG_AFECTADO]);
  const notes = calls.filter((c) => c.path.endsWith("/notes"));
  assert.match(notes[0].body.body, /Cesárea de urgencia/);
  const update = calls.find((c) => c.path === "/contacts/K2");
  assert.deepEqual(update.body.customFields.find((f) => f.id === "F2"), { id: "F2", field_value: "" });
});

test("PIN en comparación estricta", () => {
  assert.ok(pinMatches("4821", "4821"));
  assert.ok(!pinMatches("4820", "4821"));
  assert.ok(!pinMatches("482", "4821"));
  assert.ok(!pinMatches(undefined, "4821"));
  assert.ok(!pinMatches("", ""));
});
