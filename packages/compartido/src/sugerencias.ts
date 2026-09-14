/**
 * Sugerencias de nuevos productos.
 *
 * ⛔ Este canal NO abre el portafolio: los 13 productos siguen siendo 13.
 * ⛔ No existe ninguna ruta de escritura desde una sugerencia hacia el catálogo.
 * ⛔ Origen: desde Planificar, cuando ninguno de los 13 encaja; o desde un seguimiento.
 *
 * Ver MASTER_SPEC.md §11, USER_FLOWS.md F18.
 */

import type { Adjunto, Id, ISODate } from './core';
import type { ProductoId } from './catalogo';

export type FrecuenciaObservada = 'unica' | 'ocasional' | 'frecuente';

export type EstadoSugerencia =
  | 'recibida'
  | 'en_evaluacion'
  | 'aceptada_para_estudio'
  | 'rechazada'
  | 'duplicada'
  | 'ya_cubierta_por_producto_existente';

export interface SugerenciaProducto {
  readonly id: Id;
  readonly titulo: string;
  /** El problema en palabras del cliente, no en las nuestras. */
  readonly problemaCliente: string;
  readonly clienteId: Id | null;
  readonly actividadId: Id | null;
  readonly frecuenciaObservada: FrecuenciaObservada;
  readonly productosQueNoAlcanzan: ReadonlyArray<ProductoId>;
  readonly porQueNoAlcanzan: string;
  readonly adjuntos: ReadonlyArray<Adjunto>;
  readonly creadaPor: Id;
  readonly creadaEn: ISODate;
  readonly estado: EstadoSugerencia;
  readonly resolucion: string | null;
  /** Obligatorio cuando `estado === 'ya_cubierta_por_producto_existente'`. */
  readonly productoQueLoCubre: ProductoId | null;
  /** Obligatorio cuando `estado === 'duplicada'`. */
  readonly duplicadaDe: Id | null;
  readonly resueltaPor: Id | null;
  readonly resueltaEn: ISODate | null;
}

export interface NuevaSugerencia {
  readonly titulo: string;
  readonly problemaCliente: string;
  readonly clienteId?: Id;
  readonly actividadId?: Id;
  readonly frecuenciaObservada: FrecuenciaObservada;
  readonly productosQueNoAlcanzan: ReadonlyArray<ProductoId>;
  readonly porQueNoAlcanzan: string;
  readonly adjuntos?: ReadonlyArray<Id>;
}

/** ⛔ El silencio no es una resolución válida: `resolucion` es obligatoria. */
export interface ResolucionSugerencia {
  readonly estado: Exclude<EstadoSugerencia, 'recibida' | 'en_evaluacion'>;
  readonly resolucion: string;
  readonly productoQueLoCubre?: ProductoId;
  readonly duplicadaDe?: Id;
}

export interface FiltroSugerencias {
  readonly estado?: EstadoSugerencia;
  readonly actividadId?: Id;
  readonly creadaPor?: Id;
  readonly frecuencia?: FrecuenciaObservada;
}

/** Agregación por rubro y frecuencia: el insumo de roadmap del administrador. */
export interface AgregadoSugerencias {
  readonly actividadId: Id;
  readonly total: number;
  readonly porEstado: Readonly<Record<EstadoSugerencia, number>>;
  readonly porFrecuencia: Readonly<Record<FrecuenciaObservada, number>>;
}
