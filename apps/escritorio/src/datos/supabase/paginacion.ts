/**
 * Paginación contra PostgREST.
 *
 * El contrato pide `Pagina<T>` con un `cursor` opaco. Acá el cursor es el
 * desplazamiento: para una cartera de cientos de clientes es exacto, barato y
 * no depende de que el orden sea estable entre dos llamadas.
 *
 * ⛔ El límite se acota siempre. Un `limite: 100000` desde la vista no puede
 *    convertirse en una consulta que se traiga la base entera.
 */

import type { OpcionesPagina, Pagina } from '@labia/compartido';

export const LIMITE_POR_DEFECTO = 25;
export const LIMITE_MAXIMO = 200;

export interface Rango {
  readonly desde: number;
  readonly hasta: number;
  readonly limite: number;
}

export function rango(pagina?: OpcionesPagina): Rango {
  const pedido = pagina?.limite ?? LIMITE_POR_DEFECTO;
  const limite = Math.min(Math.max(1, Math.trunc(pedido)), LIMITE_MAXIMO);

  const leido = Number.parseInt(pagina?.cursor ?? '0', 10);
  const desde = Number.isFinite(leido) && leido > 0 ? leido : 0;

  return { desde, hasta: desde + limite - 1, limite };
}

export function armarPagina<T>(
  items: ReadonlyArray<T>,
  rangoUsado: Rango,
  total: number | null,
): Pagina<T> {
  const siguiente = rangoUsado.desde + items.length;
  // Sin total, la única pista de que hay más es que vino la página completa.
  const hayMas = total === null ? items.length === rangoUsado.limite : siguiente < total;
  return { items, cursor: hayMas ? String(siguiente) : null, total };
}
