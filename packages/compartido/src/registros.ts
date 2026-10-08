/**
 * Registro de accesos — los DOS registros del sistema.
 *
 *   1. `AccesoEnlace`   (en propuestas.ts) → "¿el cliente abrió lo que le mandé?"
 *   2. `RegistroAcceso` (acá)              → "¿quién usa el sistema y qué tocó?"
 *
 * ⛔ La interfaz NUNCA los mezcla en una misma lista.
 * ⛔ Ambos son append-only: no existe método de escritura ni de borrado.
 *
 * Ver MASTER_SPEC.md §10, DATA_MODEL.md §11.
 */

import type { Id, ISODate } from './core';
import type { Rol } from './identidad';
import type { TipoDispositivo } from './propuestas';

export type AccionRegistrada =
  | 'ingreso'
  | 'cierre_sesion'
  | 'intento_fallido'
  | 'alta_vendedor'
  | 'baja_vendedor'
  | 'cambio_participacion'
  | 'cambio_presupuesto'
  | 'cambio_taxonomia'
  | 'aprobacion_cotizacion'
  | 'correccion_cotizacion'
  | 'rechazo_cotizacion'
  | 'cierre_periodo'
  | 'ajuste'
  | 'emision_pdf'
  | 'emision_enlace'
  | 'revocacion_enlace'
  | 'borrado_audio'
  | 'reasignacion_cartera'
  | 'cambio_parametros';

export type EntidadRegistrada =
  | 'usuario'
  | 'cliente'
  | 'plan'
  | 'producto'
  | 'precio_lista'
  | 'participacion'
  | 'presupuesto'
  | 'taxonomia'
  | 'cotizacion'
  | 'presentacion'
  | 'enlace'
  | 'documento'
  | 'seguimiento'
  | 'audio'
  | 'liquidacion'
  | 'ajuste'
  | 'sugerencia'
  | 'parametros';

export interface OrigenSesion {
  readonly tipoDispositivo: TipoDispositivo;
  readonly paisAproximado: string | null;
}

/** ⛔ Append-only. Sin UPDATE, sin DELETE desde la aplicación. */
export interface RegistroAcceso {
  readonly id: Id;
  readonly actorId: Id;
  readonly nombreActor: string;
  readonly rol: Rol;
  readonly accion: AccionRegistrada;
  readonly entidadTipo: EntidadRegistrada;
  readonly entidadId: Id | null;
  readonly valorAnterior: unknown | null;
  readonly valorPosterior: unknown | null;
  readonly ocurridoEn: ISODate;
  readonly origenSesion: OrigenSesion;
}

export interface FiltroRegistroAcceso {
  readonly actorId?: Id;
  readonly accion?: AccionRegistrada;
  readonly entidadTipo?: EntidadRegistrada;
  readonly entidadId?: Id;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
}
