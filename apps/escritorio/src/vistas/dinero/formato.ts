/**
 * Formato es-PY local a Dinero y Administración.
 *
 * ⛔ DUEÑO: Sesión 6. `apps/escritorio/src/nucleo/formato.ts` es de Sesión 1 y
 * todavía no tiene implementación en la base: mientras tanto, estas vistas
 * necesitan su propio formato y lo resuelven acá, dentro de su ámbito.
 *
 * Moneda SIEMPRE explícita: "Gs." para PYG, "USD" para dólares. Nunca un
 * número pelado. Fechas y números con Intl, locale es-PY, zona America/Asuncion.
 */

import type { Dinero, ISODate, PeriodoMensual } from '@labia/compartido';

const ZONA = 'America/Asuncion';

const NUMERO_PYG = new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 });
const NUMERO_USD = new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ⛔ Nunca un número pelado: la moneda va siempre explícita. */
export function formatearDinero(d: Dinero): string {
  if (d.moneda === 'USD') return `USD ${NUMERO_USD.format(d.monto / 100)}`;
  return `Gs. ${NUMERO_PYG.format(d.monto)}`;
}

export function formatearPorcentaje(valor: number): string {
  return `${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 1 }).format(valor)} %`;
}

export function formatearFecha(iso: ISODate): string {
  return new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeZone: ZONA }).format(new Date(iso));
}

export function formatearFechaHora(iso: ISODate): string {
  return new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA }).format(new Date(iso));
}

const MESES = new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric', timeZone: ZONA });

/** `PeriodoMensual` es `"YYYY-MM"`. Se muestra como "septiembre de 2026". */
export function formatearPeriodo(periodo: PeriodoMensual): string {
  const [anio, mes] = periodo.split('-').map(Number);
  if (!anio || !mes) return periodo;
  const texto = MESES.format(new Date(Date.UTC(anio, mes - 1, 2)));
  return texto;
}

/** Período actual en zona America/Asuncion, formato `YYYY-MM`. */
export function periodoActual(): PeriodoMensual {
  const partes = new Intl.DateTimeFormat('es-PY', { year: 'numeric', month: '2-digit', timeZone: ZONA }).formatToParts(new Date());
  const anio = partes.find((p) => p.type === 'year')?.value ?? '2026';
  const mes = partes.find((p) => p.type === 'month')?.value ?? '01';
  return `${anio}-${mes}`;
}

export function periodoAnterior(periodo: PeriodoMensual): PeriodoMensual {
  const [anio, mes] = periodo.split('-').map(Number);
  if (!anio || !mes) return periodo;
  const fecha = new Date(Date.UTC(anio, mes - 2, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function periodoSiguiente(periodo: PeriodoMensual): PeriodoMensual {
  const [anio, mes] = periodo.split('-').map(Number);
  if (!anio || !mes) return periodo;
  const fecha = new Date(Date.UTC(anio, mes, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;
}
