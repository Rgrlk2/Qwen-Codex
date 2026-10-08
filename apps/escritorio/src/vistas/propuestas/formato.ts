/**
 * Formato es-PY, sólo para esta vista.
 *
 * `apps/escritorio/src/nucleo/formato.ts` es de la Sesión 1 y todavía no
 * implementa nada (`export {}`): esta vista no puede esperarla, así que usa su
 * propio formateador local, con las mismas reglas — moneda siempre explícita,
 * zona America/Asuncion, tabular-nums en el marcado — hasta que la
 * integración reemplace esto por el formateador compartido.
 */

import type { Dinero, ISODate } from '@labia/compartido';

const FORMATEADOR_FECHA = new Intl.DateTimeFormat('es-PY', {
  timeZone: 'America/Asuncion',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** Igual que el de arriba pero sin mover el día: para fechas de calendario. */
const FORMATEADOR_FECHA_CALENDARIO = new Intl.DateTimeFormat('es-PY', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const FORMATEADOR_FECHA_HORA = new Intl.DateTimeFormat('es-PY', {
  timeZone: 'America/Asuncion',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const FORMATEADOR_NUMERO = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });
const FORMATEADOR_DECIMAL = new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ⛔ La moneda siempre es explícita: "Gs." para PYG, "USD" para dólares. */
export function formatearDinero(dinero: Dinero): string {
  if (dinero.moneda === 'PYG') {
    return `Gs. ${FORMATEADOR_NUMERO.format(dinero.monto)}`;
  }
  return `USD ${FORMATEADOR_DECIMAL.format(dinero.monto / 100)}`;
}

/** `2026-10-05` sin hora: eso es una FECHA de calendario, no un instante. */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Una fecha de calendario se dibuja como lo que es.
 *
 * ⛔ `new Date('2026-10-05')` se interpreta como medianoche UTC. Asunción está
 *    detrás de UTC, así que al formatearla en zona local daba **el día
 *    anterior**: una cotización válida hasta el 5 le decía al cliente que
 *    vencía el 4. Un día menos del que le corresponde.
 *
 * Cuando el valor SÍ trae hora, es un instante y se formatea en la zona del
 * negocio, que es lo correcto para "cuándo pasó esto".
 */
export function formatearFecha(fecha: ISODate): string {
  if (SOLO_FECHA.test(fecha)) {
    const [anio, mes, dia] = fecha.split('-').map(Number) as [number, number, number];
    // Medianoche UTC de ese mismo día, formateada EN UTC: el calendario no se
    // mueve de zona.
    return FORMATEADOR_FECHA_CALENDARIO.format(Date.UTC(anio, mes - 1, dia));
  }
  return FORMATEADOR_FECHA.format(new Date(fecha));
}

export function formatearFechaHora(fecha: ISODate): string {
  return FORMATEADOR_FECHA_HORA.format(new Date(fecha));
}

export function haVencido(fecha: ISODate): boolean {
  return new Date(fecha).getTime() < Date.now();
}

/** Marcado con `font-variant-numeric: tabular-nums`, como exige el diseño. */
export function spanImporte(texto: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'propuestas-importe';
  span.textContent = texto;
  return span;
}
