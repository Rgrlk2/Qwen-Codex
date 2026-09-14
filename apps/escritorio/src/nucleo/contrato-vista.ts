/**
 * Contrato que cumple toda vista.
 *
 * ⛔ DUEÑO: SESIÓN 1. Congelado tras Fase 0.
 *
 * Los cuatro estados no son una recomendación: son parte del contrato.
 * Una vista sin estado vacío o sin estado de error no está terminada
 * (docs/QA_CHECKLIST.md §7.5 y §10).
 */

import type { CapaDatos, Rol } from '@labia/compartido';

export interface ContextoVista {
  readonly datos: CapaDatos;
  readonly raiz: HTMLElement;
  readonly rol: Rol;
  /** Se dispara al navegar a otra vista: la vista cancela lo pendiente. */
  readonly senal: AbortSignal;
  /** `true` mientras la app corra con mock: obliga a mostrar "Datos de ejemplo". */
  readonly datosDeEjemplo: boolean;
}

export interface Vista {
  /** Monta la vista. Debe dejar visible el estado "cargando" antes de pedir datos. */
  montar(contexto: ContextoVista): void | Promise<void>;
  /** Libera recursos: escuchas, temporizadores, grabaciones en curso. */
  desmontar(): void;
}
