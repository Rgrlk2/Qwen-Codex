/**
 * Formato es-PY.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * - Fechas y números con Intl, locale es-PY, zona America/Asuncion.
 * - ⛔ Moneda SIEMPRE explícita: "Gs." para PYG, "USD" para dólares.
 *   Nunca un número pelado.
 * - Los importes se renderizan con font-variant-numeric: tabular-nums.
 *
 * ⛔ NO EXISTE una función que sume dos monedas ni que devuelva un "total
 *    consolidado": los totales se formatean uno por moneda
 *    (COMMERCIAL_RULES §1, QA_CHECKLIST §5.2).
 */

import type { Dinero, ISODate, Moneda, TotalesPorMoneda } from '@labia/compartido';

export const LOCALE = 'es-PY';
export const ZONA = 'America/Asuncion';

/**
 * Etiqueta visible de cada moneda. ⛔ Siempre acompaña al importe.
 * El guaraní se escribe "Gs."; el dólar, "USD" (no "$": es ambiguo en la región).
 */
export const ETIQUETA_MONEDA: Readonly<Record<Moneda, string>> = {
  PYG: 'Gs.',
  USD: 'USD',
};

/**
 * Decimales de la unidad mínima entera de cada moneda.
 * PYG se guarda en guaraníes; USD, en centavos (core.ts, `Dinero`).
 */
const DECIMALES: Readonly<Record<Moneda, number>> = { PYG: 0, USD: 2 };

const memo = new Map<string, Intl.NumberFormat>();

function numerador(moneda: Moneda): Intl.NumberFormat {
  const existente = memo.get(moneda);
  if (existente) return existente;
  const decimales = DECIMALES[moneda];
  const creado = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  memo.set(moneda, creado);
  return creado;
}

/** Pasa de la unidad mínima entera a la unidad de presentación. */
function aUnidadDePresentacion(importe: Dinero): number {
  const decimales = DECIMALES[importe.moneda];
  return decimales === 0 ? importe.monto : importe.monto / 10 ** decimales;
}

/**
 * Formatea un importe. ⛔ Siempre con su moneda adelante: "Gs. 1.250.000".
 * Es la única forma admitida de mostrar dinero (QA_CHECKLIST §5.1).
 */
export function formatearDinero(importe: Dinero): string {
  return `${ETIQUETA_MONEDA[importe.moneda]} ${numerador(importe.moneda).format(aUnidadDePresentacion(importe))}`;
}

/**
 * Formatea totales agrupados por moneda: una cadena por moneda.
 * ⛔ Devuelve una lista, no un total único: no existe un total consolidado.
 * Lista vacía ⇒ lista vacía; el estado vacío lo decide la vista, con texto honesto.
 */
export function formatearTotales(totales: TotalesPorMoneda): ReadonlyArray<string> {
  return totales.map(formatearDinero);
}

/**
 * Un importe listo para el DOM, con `tabular-nums` puesto en el propio
 * elemento: las columnas alinean aunque la hoja de estilos todavía no cargue
 * (QA_CHECKLIST §5.16).
 */
export function elementoImporte(importe: Dinero, documento: Document = document): HTMLElement {
  const span = documento.createElement('span');
  span.className = 'importe';
  span.style.fontVariantNumeric = 'tabular-nums';
  span.textContent = formatearDinero(importe);
  return span;
}

/** Rango: se muestra como rango. ⛔ Nunca promediado ni redondeado (§5.4). */
export function formatearRango(desde: Dinero, hasta: Dinero): string {
  if (desde.moneda !== hasta.moneda) {
    throw new Error('Un rango no puede mezclar monedas.');
  }
  return `${formatearDinero(desde)} a ${formatearDinero(hasta)}`;
}

export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat(LOCALE).format(valor);
}

/** Porcentaje con un decimal: "12,5 %". */
export function formatearPorcentaje(fraccion: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(fraccion);
}

function fecha(iso: ISODate): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "15/09/2026", en hora de Asunción. */
export function formatearFecha(iso: ISODate): string {
  const d = fecha(iso);
  if (!d) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** "15/09/2026 08:30", en hora de Asunción. */
export function formatearFechaHora(iso: ISODate): string {
  const d = fecha(iso);
  if (!d) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** "lunes, 15 de septiembre", para encabezados de agenda. */
export function formatearDiaLargo(iso: ISODate): string {
  const d = fecha(iso);
  if (!d) return '—';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

/** Período `YYYY-MM` en palabras: "septiembre de 2026". */
export function formatearPeriodo(periodo: string): string {
  const partes = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (!partes) return periodo;
  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const d = new Date(Date.UTC(anio, mes - 1, 15, 12));
  return new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, month: 'long', year: 'numeric' }).format(d);
}

/** "hace 3 días" / "en 2 horas". Para atrasos y vencimientos. */
export function formatearRelativo(iso: ISODate, ahora: Date = new Date()): string {
  const d = fecha(iso);
  if (!d) return '—';
  const segundos = Math.round((d.getTime() - ahora.getTime()) / 1000);
  const rel = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const escalas: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ];
  for (const escala of escalas) {
    const unidad = escala[0];
    const tamano = escala[1];
    if (Math.abs(segundos) >= tamano || unidad === 'second') {
      return rel.format(Math.trunc(segundos / tamano), unidad);
    }
  }
  return rel.format(0, 'second');
}

/** Día del calendario en Asunción, como `YYYY-MM-DD`. */
export function diaEnAsuncion(momento: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(momento);
  return partes;
}
