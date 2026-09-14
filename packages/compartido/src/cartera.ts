/**
 * Cartera y planificación por empresa, profesional y rubro.
 * Ver MASTER_SPEC.md §2.2 y §3, DATA_MODEL.md §4.
 */

import type { Dinero, Id, ISODate, Trazado } from './core';
import type { ProductoId } from './catalogo';

/**
 * Empresa y profesional comparten entidad con discriminante.
 * Separarlos en dos tablas duplicaría todo el resto del modelo sin ganar nada.
 */
export type TipoCuenta = 'empresa' | 'profesional';

export type EtapaCuenta =
  | 'sin_contactar'
  | 'contactada'
  | 'diagnostico'
  | 'propuesta'
  | 'negociacion'
  | 'cerrada_ganada'
  | 'cerrada_perdida'
  | 'cliente_activo';

export interface Cuenta extends Trazado {
  readonly id: Id;
  readonly tipo: TipoCuenta;
  readonly nombre: string;
  /** Obligatorio. Dispara la recomendación de productos. */
  readonly rubroPrincipalId: Id;
  readonly calificadoresIds: ReadonlyArray<Id>;
  readonly vendedorId: Id;
  readonly etapa: EtapaCuenta;
  readonly ciudad: string | null;
  readonly ultimaInteraccionEn: ISODate | null;
  readonly proximoPasoEn: ISODate | null;
  /** Obligatorio cuando `etapa === 'cerrada_perdida'`. */
  readonly motivoPerdida: string | null;
  /** Borrado lógico. */
  readonly archivadoEn: ISODate | null;
}

export interface CuentaDetalle extends Cuenta {
  readonly contactos: ReadonlyArray<Contacto>;
  readonly productosVigentes: ReadonlyArray<ProductoId>;
  readonly productosPropuestos: ReadonlyArray<ProductoId>;
  readonly productosRecomendados: ReadonlyArray<ProductoId>;
  readonly potencialPorMoneda: ReadonlyArray<Dinero>;
}

export type CanalPreferido = 'whatsapp' | 'telefono' | 'email' | 'presencial';

export interface Contacto {
  readonly id: Id;
  readonly cuentaId: Id;
  readonly nombre: string;
  readonly cargo: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly esDecisor: boolean;
  readonly canalPreferido: CanalPreferido | null;
}

export interface NuevaCuenta {
  readonly tipo: TipoCuenta;
  readonly nombre: string;
  readonly rubroPrincipalId: Id;
  readonly calificadoresIds?: ReadonlyArray<Id>;
  readonly ciudad?: string;
  readonly contactos?: ReadonlyArray<Omit<Contacto, 'id' | 'cuentaId'>>;
}

export interface FiltroCuentas {
  readonly tipo?: TipoCuenta;
  readonly rubroId?: Id;
  readonly etapa?: EtapaCuenta;
  readonly vendedorId?: Id;
  readonly sinContactoDesde?: ISODate;
  readonly texto?: string;
}

// ---------------------------------------------------------------------------
// Planificación
// ---------------------------------------------------------------------------

/** ⛔ Un plan tiene UN SOLO eje. Cruzar ejes = dos planes con la misma `campanaId`. */
export type EjePlan = 'empresa' | 'profesional' | 'rubro';

export type MotivoCierrePlan = 'cumplido' | 'parcial' | 'descartado' | 'reemplazado';

export interface Hito {
  readonly id: Id;
  readonly titulo: string;
  readonly venceEn: ISODate;
  readonly cumplidoEn: ISODate | null;
}

export interface PlanDeAccion extends Trazado {
  readonly id: Id;
  readonly eje: EjePlan;
  /** `Cuenta.id` para empresa/profesional · `Rubro.id` para rubro. */
  readonly objetivoId: Id;
  readonly campanaId: Id | null;
  readonly vendedorId: Id;
  readonly objetivo: string;
  /** Sólo productos del catálogo cerrado. */
  readonly productosObjetivo: ReadonlyArray<ProductoId>;
  readonly periodoDesde: ISODate;
  readonly periodoHasta: ISODate;
  /** Con moneda. Sólo se compone de precios documentados. */
  readonly metaDinero: Dinero | null;
  /** `true` si incluye productos con precio `no_documentado`: la meta queda incompleta y se indica. */
  readonly metaParcial: boolean;
  readonly hitos: ReadonlyArray<Hito>;
  readonly estado: 'abierto' | 'cerrado';
  /** Obligatorio al cerrar. */
  readonly motivoCierre: MotivoCierrePlan | null;
}

export interface NuevoPlan {
  readonly eje: EjePlan;
  readonly objetivoId: Id;
  readonly campanaId?: Id;
  readonly objetivo: string;
  readonly productosObjetivo: ReadonlyArray<ProductoId>;
  readonly periodoDesde: ISODate;
  readonly periodoHasta: ISODate;
  readonly metaDinero?: Dinero;
  readonly hitos?: ReadonlyArray<Omit<Hito, 'id' | 'cumplidoEn'>>;
}

export interface FiltroPlanes {
  readonly eje?: EjePlan;
  readonly estado?: 'abierto' | 'cerrado';
  readonly vendedorId?: Id;
  readonly objetivoId?: Id;
}

/**
 * Objetivo sugerido por un plan de rubro.
 * ⛔ Un plan de rubro NO crea cuentas. Aceptar un objetivo genera una tarea, no un registro comercial.
 */
export interface ObjetivoSugerido {
  readonly id: Id;
  readonly planId: Id;
  readonly cuentaId: Id;
  readonly estado: 'sugerido' | 'aceptado' | 'descartado';
}

// ---------------------------------------------------------------------------
// Línea de tiempo unificada de la cuenta
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
  readonly cuentaId: Id;
  readonly tipo: TipoEventoLineaTiempo;
  readonly ocurridoEn: ISODate;
  readonly titulo: string;
  readonly detalle: string | null;
  /** Id de la entidad de origen, para navegar hasta ella. */
  readonly referenciaId: Id;
}
