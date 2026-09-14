/**
 * Seguimiento por voz y por texto.
 *
 * ⛔ Regla dura: nada derivado de voz o texto se persiste sin confirmación humana.
 *    El sistema propone; la persona guarda.
 *
 * Ver MASTER_SPEC.md §2.3, USER_FLOWS.md F6/F7.
 */

import type { Adjunto, Id, ISODate } from './core';
import type { ProductoId } from './catalogo';
import type { EtapaCliente } from './clientes';

/** Voz y texto producen la **misma** entidad y el **mismo** procesamiento. */
export type OrigenSeguimiento = 'voz' | 'texto';

export interface AudioSeguimiento {
  readonly id: Id;
  readonly duracionSegundos: number;
  readonly formato: string;
  readonly almacenamientoRef: string;
  readonly retencionHasta: ISODate;
  readonly borradoEn: ISODate | null;
  readonly borradoPor: Id | null;
}

export type EstadoPaso = 'propuesto' | 'aceptado' | 'descartado' | 'resuelto';

export interface PasoSugerido {
  readonly id: Id;
  readonly seguimientoId: Id;
  readonly titulo: string;
  readonly venceEn: ISODate | null;
  readonly estado: EstadoPaso;
  readonly resueltoEn: ISODate | null;
}

export interface Seguimiento {
  readonly id: Id;
  readonly clienteId: Id;
  readonly vendedorId: Id;
  readonly origen: OrigenSeguimiento;
  /** Cuándo pasó (puede diferir de cuándo se registró). */
  readonly ocurridoEn: ISODate;
  readonly registradoEn: ISODate;
  /** Transcripción editada o texto escrito. La transcripción sobrevive al audio. */
  readonly texto: string;
  /** Sólo cuando `origen === 'voz'`. */
  readonly audio: AudioSeguimiento | null;
  /** Validados contra los 13. Lo que no valida NO entra acá. */
  readonly productosMencionados: ReadonlyArray<ProductoId>;
  readonly pasos: ReadonlyArray<PasoSugerido>;
  readonly adjuntos: ReadonlyArray<Adjunto>;
  /**
   * ⛔ Literalmente `true`. Un seguimiento sin confirmación humana no se persiste.
   * El tipo lo hace imposible de olvidar.
   */
  readonly confirmadoPorUsuario: true;
}

// ---------------------------------------------------------------------------
// Captura y procesamiento (no persisten nada)
// ---------------------------------------------------------------------------

export interface CapturaSeguimiento {
  readonly clienteId: Id;
  readonly origen: OrigenSeguimiento;
  readonly texto: string;
  /** Referencia a un audio ya subido. Sólo para `origen === 'voz'`. */
  readonly audioId?: Id;
  readonly ocurridoEn?: ISODate;
}

/**
 * Lo que el sistema **propone** a partir de una captura.
 * ⛔ `procesarCaptura` no escribe nada: devuelve esto para que el usuario confirme.
 */
export interface PropuestaDeSeguimiento {
  readonly notaEstructurada: string;
  readonly pasosPropuestos: ReadonlyArray<Omit<PasoSugerido, 'id' | 'seguimientoId' | 'estado' | 'resueltoEn'>>;
  readonly etapaSugerida: EtapaCliente | null;
  /** Sólo ids del catálogo cerrado. */
  readonly productosMencionados: ReadonlyArray<ProductoId>;
  /**
   * Menciones que NO corresponden a ninguno de los 13.
   * ⛔ Nunca se convierten en producto. Sólo pueden derivar a una sugerencia.
   */
  readonly mencionesFueraDeCatalogo: ReadonlyArray<string>;
  readonly borradorRespuesta: string | null;
}

/** Lo que el usuario confirmó guardar, ítem por ítem. */
export interface SeguimientoConfirmado {
  readonly clienteId: Id;
  readonly origen: OrigenSeguimiento;
  readonly texto: string;
  readonly audioId: Id | null;
  readonly ocurridoEn: ISODate;
  readonly productosMencionados: ReadonlyArray<ProductoId>;
  readonly pasosAceptados: ReadonlyArray<{ readonly titulo: string; readonly venceEn: ISODate | null }>;
  readonly aplicarEtapaSugerida: boolean;
  /** ⛔ Sin esto en `true`, la escritura devuelve `validacion`. */
  readonly confirmadoPorUsuario: true;
}

export interface FiltroSeguimientos {
  readonly clienteId?: Id;
  readonly origen?: OrigenSeguimiento;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
  readonly conPasosAbiertos?: boolean;
}

/** Soporte de dictado del dispositivo. Sin soporte se informa y se ofrece texto: nunca un botón inerte. */
export interface SoporteDictado {
  readonly disponible: boolean;
  readonly motivoNoDisponible: string | null;
}
