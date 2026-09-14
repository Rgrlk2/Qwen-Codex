/**
 * Identidad y roles.
 *
 * ⛔ SÓLO DOS ROLES: vendedor y administrador.
 *    No existen supervisor ni auditor en ninguna capa del sistema.
 * ⛔ UNA SOLA APLICACIÓN, UN SOLO LOGIN. Administración es una ruta protegida.
 *
 * Ver MASTER_SPEC.md §1.
 */

import type { Id, ISODate, Trazado } from './core';

/** Los únicos dos roles del sistema. */
export type Rol = 'vendedor' | 'administrador';

export interface Usuario extends Trazado {
  readonly id: Id;
  readonly nombre: string;
  readonly email: string;
  /** Nombre de usuario para el ingreso. */
  readonly usuario: string;
  readonly rol: Rol;
  readonly activo: boolean;
  readonly ultimoIngresoEn: ISODate | null;
}

export interface NuevoUsuario {
  readonly nombre: string;
  readonly email: string;
  readonly usuario: string;
  readonly rol: Rol;
}

export interface Sesion {
  readonly usuario: Usuario;
  readonly rol: Rol;
  readonly iniciadaEn: ISODate;
  /** `true` mientras la app corra con mock: obliga a mostrar el chip "Datos de ejemplo". */
  readonly datosDeEjemplo: boolean;
}

/**
 * Capacidades derivadas del rol.
 *
 * ⛔ Ocultar un enlace no es proteger una ruta: la guardia vive en el ruteo
 *    Y en la capa de datos. Esto sólo decide qué se dibuja.
 */
export interface Capacidades {
  readonly verAdministracion: boolean;
  readonly aprobarCotizaciones: boolean;
  readonly configurarComercial: boolean;
  readonly verTodosLosClientes: boolean;
  readonly verAccesosDeVendedores: boolean;
  readonly administrarVendedores: boolean;
  readonly cerrarPeriodo: boolean;
}

export interface FiltroUsuarios {
  readonly rol?: Rol;
  readonly activo?: boolean;
  readonly texto?: string;
}
