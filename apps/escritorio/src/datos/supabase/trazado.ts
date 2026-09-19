/**
 * El sello de trazado: quién creó cada cosa, quién la tocó y en qué versión va.
 *
 * Cinco tipos del contrato lo llevan (`Trazado` en compartido/src/core.ts):
 * Usuario, Cliente, FichaPersonalizada, Presentacion y Cotizacion. Las cinco
 * tablas tienen el disparador `sella_trazado`, así que estas columnas las
 * escribe la base desde `auth.uid()` y el navegador no las manda nunca.
 *
 * ⛔ Mandar `creado_por` desde acá no sirve de nada: el disparador lo pisa.
 *    Está bien que así sea — si el navegador pudiera elegir el autor, un
 *    vendedor podría firmar una cotización con el nombre de otro.
 *
 * `version` sí viaja, y con un propósito: al guardar se manda la que se leyó.
 * Si en el medio alguien más escribió, la base levanta 40001 y el Escritorio
 * muestra "esto cambió mientras lo editabas" en vez de pisar ese trabajo.
 */

import type { Trazado } from '@labia/compartido';

/** Las columnas del sello, como las devuelve la base. */
export interface FilaTrazado {
  readonly creado_en: string;
  readonly creado_por: string | null;
  readonly actualizado_en: string;
  readonly actualizado_por: string | null;
  readonly version: number;
}

/** Las mismas columnas, para pedírselas a PostgREST. */
export const COLUMNAS_TRAZADO =
  'creado_en, creado_por, actualizado_en, actualizado_por, version';

/**
 * Autor de las filas que sembró la plataforma misma —el portafolio, la
 * taxonomía del motor— donde no hubo ninguna persona apretando un botón.
 */
export const SISTEMA = 'sistema';

export function aTrazado(f: FilaTrazado): Trazado {
  return {
    creadoEn: f.creado_en,
    creadoPor: f.creado_por ?? SISTEMA,
    actualizadoEn: f.actualizado_en,
    actualizadoPor: f.actualizado_por ?? SISTEMA,
    version: f.version,
  };
}
