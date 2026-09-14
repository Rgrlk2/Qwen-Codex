/**
 * Dinero, mensualidades y comisiones.
 *
 * ⛔ Este archivo NO contiene ningún porcentaje, tope ni calendario: no están definidos
 *    en los insumos y no se inventan. Ver COMMERCIAL_RULES.md §6.
 * ⛔ Ningún total consolidado entre monedas: todo va como `TotalesPorMoneda`.
 *
 * Ver MASTER_SPEC.md §2.6 y §7, DATA_MODEL.md §8.
 */

import type { Dinero, Id, ISODate, PeriodoMensual, TotalesPorMoneda } from './core';
import type { ModalidadPrecio, ProductoId } from './catalogo';

// ---------------------------------------------------------------------------
// Mensualidades
// ---------------------------------------------------------------------------

export type EstadoMensualidad = 'activa' | 'suspendida' | 'baja';

export interface Mensualidad {
  readonly id: Id;
  readonly cuentaId: Id;
  readonly productoId: ProductoId;
  readonly plan: string | null;
  /** Importe del `precioFinal` del ítem aceptado. No se re-deriva del catálogo. */
  readonly importe: Dinero;
  readonly vendedorId: Id;
  readonly altaEn: ISODate;
  readonly bajaEn: ISODate | null;
  readonly motivoBaja: string | null;
  readonly estado: EstadoMensualidad;
  readonly diaCobro: number | null;
}

export type EstadoCobro = 'pendiente' | 'cobrado' | 'atrasado' | 'incobrable';

export interface CobroMensualidad {
  readonly id: Id;
  readonly mensualidadId: Id;
  readonly periodo: PeriodoMensual;
  readonly importe: Dinero;
  readonly estado: EstadoCobro;
  readonly cobradoEn: ISODate | null;
}

export interface FiltroMensualidades {
  readonly cuentaId?: Id;
  readonly productoId?: ProductoId;
  readonly vendedorId?: Id;
  readonly estado?: EstadoMensualidad;
}

// ---------------------------------------------------------------------------
// Reglas de comisión
// ---------------------------------------------------------------------------

export type TipoRegla = 'porcentaje' | 'monto_fijo' | 'escalonada';

export interface AlcanceRegla {
  readonly productoIds?: ReadonlyArray<ProductoId>;
  readonly familias?: ReadonlyArray<'especifica' | 'integral'>;
  readonly modalidades?: ReadonlyArray<ModalidadPrecio>;
  readonly vendedorIds?: ReadonlyArray<Id>;
}

/**
 * Parámetros de la regla.
 * ⛔ Arranca **vacío**: los factores no están definidos en los insumos.
 *    Sin regla vigente aplicable, la comisión queda "pendiente de regla".
 *    Nunca se aplica un factor por defecto.
 */
export interface ParametrosRegla {
  readonly porcentaje?: number;
  readonly montoFijo?: Dinero;
  readonly escalones?: ReadonlyArray<{
    readonly desde: Dinero;
    readonly hasta: Dinero | null;
    readonly porcentaje: number;
  }>;
}

/** ⛔ Inmutable una vez publicada. Cambiar = publicar `version + 1`. */
export interface ReglaComision {
  readonly id: Id;
  readonly nombre: string;
  readonly version: number;
  readonly alcance: AlcanceRegla;
  readonly tipo: TipoRegla;
  readonly parametros: ParametrosRegla;
  readonly vigenteDesde: ISODate;
  readonly publicadaPor: Id;
  readonly publicadaEn: ISODate;
}

export interface NuevaReglaComision {
  readonly nombre: string;
  readonly alcance: AlcanceRegla;
  readonly tipo: TipoRegla;
  readonly parametros: ParametrosRegla;
  readonly vigenteDesde: ISODate;
}

export interface SimulacionComision {
  readonly periodo: PeriodoMensual;
  readonly lineasAfectadas: number;
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly diferenciasPorMoneda: TotalesPorMoneda;
}

// ---------------------------------------------------------------------------
// Comisiones
// ---------------------------------------------------------------------------

export type OrigenComision = ModalidadPrecio;

export type EstadoLineaComision =
  | 'pendiente_de_regla'
  | 'devengada'
  | 'aprobada'
  | 'liquidada'
  | 'ajustada'
  | 'anulada';

export interface LineaComision {
  readonly id: Id;
  readonly vendedorId: Id;
  readonly origen: OrigenComision;
  /** Cotización o cobro de mensualidad que la genera. */
  readonly referenciaId: Id;
  readonly cuentaId: Id;
  readonly productoId: ProductoId;
  /** Importe efectivo post-descuento, con moneda. */
  readonly base: Dinero;
  /** `null` cuando no hay regla vigente aplicable: la línea queda "pendiente de regla". */
  readonly reglaId: Id | null;
  readonly reglaVersion: number | null;
  readonly factorAplicado: number | null;
  /** ⛔ Misma moneda que `base`. La comisión no cambia de moneda. `null` sin regla. */
  readonly importe: Dinero | null;
  readonly periodo: PeriodoMensual;
  readonly estado: EstadoLineaComision;
  readonly liquidacionId: Id | null;
  readonly devengadaEn: ISODate | null;
}

// ---------------------------------------------------------------------------
// Liquidaciones y ajustes
// ---------------------------------------------------------------------------

/** ⛔ `cerrada` es terminal. No se reabre. Toda corrección es un `AjusteComision`. */
export interface Liquidacion {
  readonly id: Id;
  readonly vendedorId: Id;
  readonly periodo: PeriodoMensual;
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly estado: 'borrador' | 'cerrada';
  readonly cerradaEn: ISODate | null;
  readonly cerradaPor: Id | null;
  readonly comprobanteDocumentoId: Id | null;
}

export interface LiquidacionDetalle extends Liquidacion {
  readonly lineas: ReadonlyArray<LineaComision>;
  readonly ajustes: ReadonlyArray<AjusteComision>;
}

export interface AjusteComision {
  readonly id: Id;
  readonly liquidacionOrigenId: Id | null;
  readonly periodoAplicacion: PeriodoMensual;
  readonly vendedorId: Id;
  /** Con signo. Suma o resta sobre el período de aplicación. */
  readonly importe: Dinero;
  /** Obligatorio. */
  readonly motivo: string;
  readonly discrepanciaId: Id | null;
  readonly creadoPor: Id;
  readonly creadoEn: ISODate;
}

export interface NuevoAjuste {
  readonly liquidacionOrigenId?: Id;
  readonly periodoAplicacion: PeriodoMensual;
  readonly vendedorId: Id;
  readonly importe: Dinero;
  readonly motivo: string;
  readonly discrepanciaId?: Id;
}

// ---------------------------------------------------------------------------
// Discrepancias
// ---------------------------------------------------------------------------

export type EstadoDiscrepancia = 'abierta' | 'procede' | 'no_procede' | 'parcial';

/** Abrir una discrepancia ⛔ no modifica ningún importe. */
export interface Discrepancia {
  readonly id: Id;
  readonly lineaComisionId: Id;
  readonly abiertaPor: Id;
  readonly descripcion: string;
  readonly estado: EstadoDiscrepancia;
  readonly resolucion: string | null;
  readonly resueltaPor: Id | null;
  readonly resueltaEn: ISODate | null;
  readonly abiertaEn: ISODate;
}

export interface NuevaDiscrepancia {
  readonly lineaComisionId: Id;
  readonly descripcion: string;
}

// ---------------------------------------------------------------------------
// Resumen del vendedor
// ---------------------------------------------------------------------------

export interface ResumenDinero {
  readonly periodo: PeriodoMensual;
  /** ⛔ Una entrada por moneda. No existe ningún campo `totalConsolidado`. */
  readonly vendidoImplementaciones: TotalesPorMoneda;
  readonly mensualidadesIncorporadas: TotalesPorMoneda;
  readonly comisionDevengada: TotalesPorMoneda;
  readonly comisionLiquidada: TotalesPorMoneda;
  readonly comisionPendiente: TotalesPorMoneda;
  /** Cantidad de líneas sin regla vigente aplicable. Se muestra como tal. */
  readonly lineasPendientesDeRegla: number;
  readonly mensualidadesActivas: number;
}

// ---------------------------------------------------------------------------
// Cierre de período
// ---------------------------------------------------------------------------

export type BloqueoCierre =
  | 'cotizaciones_en_cola_vencida'
  | 'discrepancias_abiertas'
  | 'cobros_sin_confirmar'
  | 'lineas_pendientes_de_regla';

export interface VerificacionCierre {
  readonly periodo: PeriodoMensual;
  readonly puedeCerrar: boolean;
  readonly bloqueos: ReadonlyArray<{
    readonly tipo: BloqueoCierre;
    readonly cantidad: number;
    readonly detalle: string;
  }>;
}
