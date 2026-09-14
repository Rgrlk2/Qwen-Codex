/**
 * Núcleo del mock: latencia simulada, falla forzada y paginación.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * Existe para que los cuatro estados de interfaz (cargando, vacío, error, con datos)
 * se puedan probar SIN backend. Una vista que no puede mostrar su estado de error
 * no está terminada (docs/QA_CHECKLIST.md §2).
 */

import type { ErrorApi, Pagina, Resultado } from '@labia/compartido';

export interface ConfiguracionMock {
  /** Latencia simulada en milisegundos. */
  readonly latenciaMs: number;
  /** Fuerza el error indicado en la próxima llamada. `null` = sin falla forzada. */
  readonly fallaForzada: ErrorApi | null;
  /** Devuelve listados vacíos, para probar el estado vacío. */
  readonly forzarVacio: boolean;
  /** Semilla del generador de datos de ejemplo: el mock es reproducible. */
  readonly semilla: number;
}

export const CONFIGURACION_POR_DEFECTO: ConfiguracionMock = {
  latenciaMs: 350,
  fallaForzada: null,
  forzarVacio: false,
  semilla: 20260914,
};

/** Firma de los ayudantes del mock. Implementación: Sesión 1, Fase 0. */
export type Responder = <T>(datos: T) => Promise<Resultado<T>>;
export type Paginar = <T>(items: ReadonlyArray<T>, cursor?: string, limite?: number) => Pagina<T>;
