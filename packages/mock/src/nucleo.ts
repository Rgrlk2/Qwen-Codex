/**
 * Núcleo del mock: latencia simulada, falla forzada, paginación y rol.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * Existe para que los cuatro estados de interfaz se puedan probar SIN backend.
 * Una vista que no puede mostrar su estado de error no está terminada.
 */

import type { ErrorApi, Pagina, Resultado, Rol } from '@labia/compartido';

export interface ConfiguracionMock {
  readonly latenciaMs: number;
  /** Fuerza el error indicado en la próxima llamada. `null` = sin falla forzada. */
  readonly fallaForzada: ErrorApi | null;
  /** Devuelve listados vacíos, para probar el estado vacío. */
  readonly forzarVacio: boolean;
  /** Rol con el que responde el mock: permite probar la guardia sin dos cuentas. */
  readonly rol: Rol;
  /** Semilla: el mock es reproducible. */
  readonly semilla: number;
}

export const CONFIGURACION_POR_DEFECTO: ConfiguracionMock = {
  latenciaMs: 350,
  fallaForzada: null,
  forzarVacio: false,
  rol: 'vendedor',
  semilla: 20260914,
};

export type Responder = <T>(datos: T) => Promise<Resultado<T>>;
export type Paginar = <T>(items: ReadonlyArray<T>, cursor?: string, limite?: number) => Pagina<T>;

/**
 * ⛔ Todo método de `CapaAdministracion` pasa por acá antes de responder.
 * Si el mock es permisivo, la guardia de rol nunca se prueba.
 */
export type ExigirAdministrador = () => Resultado<void>;
