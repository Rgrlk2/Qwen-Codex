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
  /**
   * `true` mientras la persona siga usando la clave inicial que le entregaron.
   *
   * ⛔ Ninguna contraseña vive en el repositorio: la inicial se entrega por
   *    fuera del código y la comparación ocurre en el servidor. Este campo es
   *    lo único que viaja, y sólo dice **si hay que cambiarla**, nunca cuál es.
   *
   * Al conectarse la autenticación real, el primer ingreso con este campo en
   * `true` obliga a cambiar la clave antes de dejar entrar a ninguna vista.
   */
  readonly debeCambiarClave: boolean;
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

/**
 * Lo que devuelve un alta de usuario.
 *
 * ⛔ `claveInicial` se muestra UNA SOLA VEZ y no se guarda en ningún lado.
 *    La base la genera al azar y no queda en el repositorio, ni en un correo,
 *    ni en una segunda llamada: si Administración no la anota en ese momento,
 *    hay que dar de baja al usuario y volver a crearlo.
 *
 * ⛔ Sin esto, el alta quedaba inservible: se creaba la cuenta y nadie sabía
 *    con qué entrar. El vendedor nuevo quedaba afuera para siempre.
 */
export interface AltaDeUsuario {
  readonly usuario: Usuario;
  readonly claveInicial: string;
}

/**
 * Qué puede hacer cada rol.
 *
 * ⛔ Esto decide QUÉ SE DIBUJA. No es la protección: la guardia de verdad vive
 *    en el ruteo, en la capa de datos y —sobre todo— en las políticas de la
 *    base, que son las únicas que un navegador no puede saltear.
 *
 * ⛔ POR QUÉ ESTÁ ACÁ Y NO DONDE ESTABA: vivía dentro del paquete de datos de
 *    EJEMPLO, y la aplicación de producción lo importaba de ahí. Esa sola
 *    línea arrastraba los clientes de ejemplo —"Ferretería Modelo S.R.L."—
 *    dentro del archivo que se publica. Una regla de negocio no puede vivir
 *    en el paquete de mentira.
 */
export function capacidadesDeRol(rol: Rol): Capacidades {
  const admin = rol === 'administrador';
  return {
    verAdministracion: admin,
    aprobarCotizaciones: admin,
    configurarComercial: admin,
    verTodosLosClientes: admin,
    verAccesosDeVendedores: admin,
    administrarVendedores: admin,
    cerrarPeriodo: admin,
  };
}

export interface FiltroUsuarios {
  readonly rol?: Rol;
  readonly activo?: boolean;
  readonly texto?: string;
}
