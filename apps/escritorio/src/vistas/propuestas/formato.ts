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

export function formatearFecha(fecha: ISODate): string {
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
