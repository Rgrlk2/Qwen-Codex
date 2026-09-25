/**
 * Contrato que cumple toda vista.
 *
 * ⛔ DUEÑO: SESIÓN 1. Congelado en el commit base.
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

/**
 * Lo que exporta el módulo de cada vista.
 *
 * ⛔ Convención única entre las seis sesiones: `export function crearVista(): Vista`.
 *    El núcleo importa el módulo por su ruta (`Ruta.modulo`) y llama a esto.
 *    Una vista que no lo exporte todavía no rompe la aplicación: el núcleo
 *    muestra un aviso honesto de que esa sección está en construcción.
 */
export interface ModuloVista {
  readonly crearVista: () => Vista;
}

export function esModuloVista(modulo: unknown): modulo is ModuloVista {
  if (typeof modulo !== 'object' || modulo === null) return false;
  const candidato = (modulo as { crearVista?: unknown }).crearVista;
  return typeof candidato === 'function';
}

/**
 * La cáscara: barra lateral, barra inferior y encabezado.
 *
 * ⛔ DUEÑA DE LA IMPLEMENTACIÓN: SESIÓN 2 (`nucleo/disposicion.ts`).
 *    Acá vive sólo el contrato, para que el núcleo pueda montarla sin conocerla.
 *    Mientras no exista, el núcleo monta una cáscara mínima provisional.
 */
export interface Disposicion {
  /** Contenedor donde el núcleo monta la vista activa. */
  readonly contenido: HTMLElement;
  /** La ruta activa cambió: la cáscara marca el destino correspondiente. */
  marcarRuta(ruta: string): void;
  destruir(): void;
}

export interface OpcionesDisposicion {
  readonly raiz: HTMLElement;
  readonly rol: Rol;
  /** `true` con mock: la cáscara muestra el chip permanente "Datos de ejemplo". */
  readonly datosDeEjemplo: boolean;
  readonly nombreUsuario: string;
  /** Rutas que este rol puede ver. Ya vienen filtradas por la guardia. */
  readonly destinos: ReadonlyArray<{ readonly ruta: string; readonly titulo: string; readonly enBarraInferior: boolean }>;
  cerrarSesion(): void;
}

export interface ModuloDisposicion {
  readonly crearDisposicion: (opciones: OpcionesDisposicion) => Disposicion;
}

export function esModuloDisposicion(modulo: unknown): modulo is ModuloDisposicion {
  if (typeof modulo !== 'object' || modulo === null) return false;
  const candidato = (modulo as { crearDisposicion?: unknown }).crearDisposicion;
  return typeof candidato === 'function';
}
