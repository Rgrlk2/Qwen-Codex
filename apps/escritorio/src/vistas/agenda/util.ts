/**
 * Utilidades locales de la vista Agenda.
 *
 * ⛔ DUEÑA: Sesión 4.
 *
 * Formato es-PY implementado acá porque apps/escritorio/src/nucleo/formato.ts
 * (Sesión 1) todavía no existe (docs/PEDIDOS.md [S4] 2026-09-15).
 */

const ZONA = 'America/Asuncion';

export function esc(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeZone: ZONA }).format(new Date(iso));
}

export function formatFechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA }).format(new Date(iso));
}

export function formatDiaCorto(iso: string): string {
  return new Intl.DateTimeFormat('es-PY', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA }).format(new Date(iso));
}

export function aInputFechaHora(iso: string): string {
  const fecha = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

export function generarClave(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const ETIQUETAS_TIPO: Readonly<Record<string, string>> = {
  visita: 'Visita',
  llamada: 'Llamada',
  proximo_paso: 'Próximo paso',
  vencimiento: 'Vencimiento',
  seguimiento_atrasado: 'Seguimiento atrasado',
  hito_plan: 'Hito de plan',
  objetivo_aceptado: 'Objetivo aceptado',
  presentacion_enviada: 'Presentación enviada',
  cotizacion_en_revision: 'Cotización en revisión',
  apertura_enlace: 'Apertura de enlace',
};

export function etiquetaTipo(tipo: string): string {
  return ETIQUETAS_TIPO[tipo] ?? tipo;
}

const ETIQUETAS_PRIORIDAD: Readonly<Record<string, string>> = { alta: 'Prioridad alta', media: 'Prioridad media', baja: 'Prioridad baja' };

export function etiquetaPrioridad(prioridad: string): string {
  return ETIQUETAS_PRIORIDAD[prioridad] ?? prioridad;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}
