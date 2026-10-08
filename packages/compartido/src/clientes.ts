/**
 * Clientes: cartera, ficha, contactos y línea de tiempo.
 *
 * La planificación vive en motor.ts; acá sólo se referencia el plan asociado.
 *
 * Ver MASTER_SPEC.md §2.3 y §4, DATA_MODEL.md §6.
 */

import type { Dinero, Id, ISODate, Trazado } from './core';
import type { ProductoId } from './catalogo';

/**
 * Empresa y profesional comparten entidad con discriminante.
 * Separarlos en dos tablas duplicaría todo el resto del modelo sin ganar nada.
 */
export type TipoCliente = 'empresa' | 'profesional';

export type EtapaCliente =
  | 'sin_contactar'
  | 'contactado'
  | 'diagnostico'
  | 'presentacion'
  | 'cotizacion'
  | 'negociacion'
  | 'ganado'
  | 'perdido'
  | 'cliente_activo';

export interface Cliente extends Trazado {
  readonly id: Id;
  readonly tipo: TipoCliente;
  readonly nombre: string;
  /** Actividad de la taxonomía del motor (motor.ts). Obligatoria. */
  readonly actividadId: Id;
  readonly operacionesConfirmadas: ReadonlyArray<Id>;
  readonly vendedorId: Id;
  readonly etapa: EtapaCliente;
  readonly ciudad: string | null;
  readonly ultimaInteraccionEn: ISODate | null;
  readonly proximoPasoEn: ISODate | null;
  /** Obligatorio cuando `etapa === 'perdido'`. */
  readonly motivoPerdida: string | null;
  /** Borrado lógico. */
  readonly archivadoEn: ISODate | null;
}

export interface ClienteDetalle extends Cliente {
  readonly contactos: ReadonlyArray<Contacto>;
  readonly productosVigentes: ReadonlyArray<ProductoId>;
  readonly productosPropuestos: ReadonlyArray<ProductoId>;
  readonly planId: Id | null;
  /** Potencial por moneda, compuesto de precios documentados. Nunca estimado. */
  readonly potencialPorMoneda: ReadonlyArray<Dinero>;
}

export type CanalPreferido = 'whatsapp' | 'telefono' | 'email' | 'presencial';

export interface Contacto {
  readonly id: Id;
  readonly clienteId: Id;
  readonly nombre: string;
  readonly cargo: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly esDecisor: boolean;
  readonly canalPreferido: CanalPreferido | null;
}

export interface NuevoCliente {
  readonly tipo: TipoCliente;
  readonly nombre: string;
  readonly actividadId: Id;
  readonly operacionesConfirmadas?: ReadonlyArray<Id>;
  readonly ciudad?: string;
  readonly contactos?: ReadonlyArray<Omit<Contacto, 'id' | 'clienteId'>>;
}

export interface FiltroClientes {
  readonly tipo?: TipoCliente;
  readonly actividadId?: Id;
  readonly etapa?: EtapaCliente;
  readonly vendedorId?: Id;
  readonly sinContactoDesde?: ISODate;
  readonly texto?: string;
}

// ---------------------------------------------------------------------------
// Línea de tiempo unificada del cliente
// ---------------------------------------------------------------------------

export type TipoEventoLineaTiempo =
  | 'seguimiento'
  | 'presentacion'
  | 'cotizacion'
  | 'cambio_etapa'
  | 'acceso_enlace'
  | 'mensualidad';

export interface EventoLineaTiempo {
  readonly id: Id;
  readonly clienteId: Id;
  readonly tipo: TipoEventoLineaTiempo;
  readonly ocurridoEn: ISODate;
  readonly titulo: string;
  readonly detalle: string | null;
  /** Id de la entidad de origen, para navegar hasta ella. */
  readonly referenciaId: Id;
}
