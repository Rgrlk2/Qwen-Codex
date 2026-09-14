/**
 * Registro de accesos — los DOS registros del sistema.
 *
 * 1. `AccesoEnlace`      (en propuestas.ts) responde: "¿el cliente abrió lo que le mandé?"
 * 2. `RegistroAuditoria` (acá)              responde: "¿quién tocó qué dentro del sistema?"
 *
 * Son tablas distintas, con audiencias, permisos y retenciones distintas.
 * ⛔ La interfaz NUNCA las mezcla en una misma lista.
 * ⛔ Ambas son append-only: no hay método de escritura ni de borrado desde la aplicación.
 *
 * Ver MASTER_SPEC.md §12, DATA_MODEL.md §10.
 */

import type { Id, ISODate } from './core';
import type { Rol } from './identidad';
import type { TipoDispositivo } from './propuestas';

export type AccionAuditada =
  | 'ingreso'
  | 'cierre_sesion'
  | 'intento_fallido'
  | 'cambio_permiso'
  | 'alta_usuario'
  | 'baja_usuario'
  | 'cambio_catalogo'
  | 'cambio_precio'
  | 'publicacion_regla_comision'
  | 'aprobacion'
  | 'rechazo'
  | 'solicitud_cambios'
  | 'cierre_periodo'
  | 'ajuste_comision'
  | 'emision_pdf'
  | 'emision_enlace'
  | 'revocacion_enlace'
  | 'borrado_audio'
  | 'exportacion_datos'
  | 'reasignacion_cartera'
  | 'cambio_parametros';

export type EntidadAuditada =
  | 'usuario'
  | 'cuenta'
  | 'producto'
  | 'precio'
  | 'cotizacion'
  | 'presentacion'
  | 'enlace'
  | 'documento'
  | 'seguimiento'
  | 'audio'
  | 'regla_comision'
  | 'liquidacion'
  | 'ajuste'
  | 'sugerencia'
  | 'parametros';

export interface OrigenSesion {
  readonly tipoDispositivo: TipoDispositivo;
  readonly paisAproximado: string | null;
}

/** ⛔ Append-only. Sin UPDATE, sin DELETE desde la aplicación. */
export interface RegistroAuditoria {
  readonly id: Id;
  readonly actorId: Id;
  readonly rolVigente: Rol;
  readonly accion: AccionAuditada;
  readonly entidadTipo: EntidadAuditada;
  readonly entidadId: Id | null;
  readonly valorAnterior: unknown | null;
  readonly valorPosterior: unknown | null;
  readonly ocurridoEn: ISODate;
  readonly origenSesion: OrigenSesion;
}

export interface FiltroAuditoria {
  readonly actorId?: Id;
  readonly accion?: AccionAuditada;
  readonly entidadTipo?: EntidadAuditada;
  readonly entidadId?: Id;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
}
