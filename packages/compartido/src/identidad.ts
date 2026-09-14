/**
 * Usuarios, roles y permisos.
 * Ver MASTER_SPEC.md §1.2 y §12.3.
 */

import type { Dinero, Id, ISODate, Trazado } from './core';

export type Rol = 'vendedor' | 'supervisor' | 'administrador' | 'auditor';

export interface Usuario extends Trazado {
  readonly id: Id;
  readonly nombre: string;
  readonly email: string;
  readonly rol: Rol;
  readonly supervisorId: Id | null;
  readonly activo: boolean;
  /**
   * Límite autónomo de descuento.
   * ⛔ `null` = **no definido**, y se interpreta como el escenario conservador:
   * todo descuento requiere aprobación. Nunca significa "ilimitado".
   * Ver COMMERCIAL_RULES.md §4.1.
   */
  readonly limiteDescuentoAutonomo: Dinero | null;
  readonly rubrosAsignados: ReadonlyArray<Id>;
  readonly ultimoIngresoEn: ISODate | null;
}

export interface Equipo {
  readonly id: Id;
  readonly nombre: string;
  readonly supervisorId: Id;
  readonly integrantes: ReadonlyArray<Id>;
}

export interface Sesion {
  readonly usuario: Usuario;
  readonly iniciadaEn: ISODate;
  readonly permisos: ReadonlyArray<Permiso>;
  /** `true` mientras la aplicación corra contra el mock: obliga a mostrar el chip "Datos de ejemplo". */
  readonly datosDeEjemplo: boolean;
}

export type Permiso =
  | 'cartera.ver.propia'
  | 'cartera.ver.equipo'
  | 'cartera.ver.todas'
  | 'propuestas.crear'
  | 'cotizaciones.aprobar'
  | 'catalogo.editar'
  | 'comisiones.reglas.publicar'
  | 'periodo.cerrar'
  | 'accesos.enlace.ver.propios'
  | 'accesos.enlace.ver.equipo'
  | 'accesos.enlace.ver.todos'
  | 'auditoria.ver.propia'
  | 'auditoria.ver.toda'
  | 'sugerencias.resolver'
  | 'usuarios.administrar';
