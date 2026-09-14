/**
 * Dinero: participación, mensualidades, liquidaciones y presupuesto.
 *
 * REGLA COMERCIAL VIGENTE — no es un pendiente:
 *   50 % Lab.IA / 50 % vendedor, sobre SETUP y sobre MENSUALIDADES.
 *   Configurable por producto. Los meses de participación del vendedor en la
 *   mensualidad también son configurables por producto.
 *
 * ⛔ La participación se calcula sobre lo COBRADO, no sobre lo vendido.
 *    Plata que no entró no genera comisión pagable.
 * ⛔ porcentajeLabIA + porcentajeVendedor === 100. Siempre.
 * ⛔ Ningún total consolidado entre monedas.
 *
 * Ver MASTER_SPEC.md §2.5 y §7, COMMERCIAL_RULES.md §3 y §4.
 */

import type { Dinero, Id, ISODate, PeriodoMensual, TotalesPorMoneda } from './core';
import type { ModalidadPrecio, ProductoId } from './catalogo';

// ---------------------------------------------------------------------------
// Participación — la regla 50/50
// ---------------------------------------------------------------------------

/** Valores por defecto de la regla comercial vigente. */
export const PARTICIPACION_POR_DEFECTO = {
  porcentajeLabIA: 50,
  porcentajeVendedor: 50,
  aplicaASetup: true,
  aplicaAMensualidad: true,
  /** `null` = sin límite mientras la mensualidad esté activa. */
  mesesParticipacionVendedor: null,
} as const;

/**
 * Participación configurable por producto.
 * ⛔ Una versión publicada es inmutable: cambiar = publicar `version + 1`.
 */
export interface ParticipacionProducto {
  readonly id: Id;
  readonly productoId: ProductoId;
  /** ⛔ `porcentajeLabIA + porcentajeVendedor === 100`. */
  readonly porcentajeLabIA: number;
  readonly porcentajeVendedor: number;
  readonly aplicaASetup: boolean;
  readonly aplicaAMensualidad: boolean;
  /**
   * Meses que el vendedor participa de la mensualidad, contados desde el alta.
   * `null` = sin límite. ⛔ `null` NO es cero.
   */
  readonly mesesParticipacionVendedor: number | null;
  readonly version: number;
  readonly vigenteDesde: ISODate;
  readonly publicadaPor: Id;
  readonly publicadaEn: ISODate;
}

export interface NuevaParticipacion {
  readonly productoId: ProductoId;
  readonly porcentajeLabIA: number;
  readonly porcentajeVendedor: number;
  readonly aplicaASetup: boolean;
  readonly aplicaAMensualidad: boolean;
  readonly mesesParticipacionVendedor: number | null;
  readonly vigenteDesde: ISODate;
  readonly motivo: string;
}

// ---------------------------------------------------------------------------
// Mensualidades
// ---------------------------------------------------------------------------

export type EstadoMensualidad = 'activa' | 'suspendida' | 'baja';

export interface Mensualidad {
  readonly id: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly productoId: ProductoId;
  readonly plan: string | null;
  /** El importe APROBADO en la cotización. ⛔ No el de lista. */
  readonly importe: Dinero;
  readonly vendedorId: Id;
  readonly cotizacionId: Id;
  readonly altaEn: ISODate;
  readonly bajaEn: ISODate | null;
  readonly motivoBaja: string | null;
  readonly estado: EstadoMensualidad;
  readonly diaCobro: number | null;
  readonly mesesAcumulados: number;
  /** `null` cuando el producto no tiene plazo de participación. */
  readonly mesesDeParticipacionRestantes: number | null;
}

export type EstadoCobro = 'pendiente' | 'cobrado' | 'atrasado' | 'incobrable';

export interface CobroMensualidad {
  readonly id: Id;
  readonly mensualidadId: Id;
  readonly periodo: PeriodoMensual;
  readonly importe: Dinero;
  readonly estado: EstadoCobro;
  readonly cobradoEn: ISODate | null;
  /** Contado desde el alta: permite aplicar `mesesParticipacionVendedor`. */
  readonly mesDeParticipacion: number;
}

export interface FiltroMensualidades {
  readonly clienteId?: Id;
  readonly productoId?: ProductoId;
  readonly vendedorId?: Id;
  readonly estado?: EstadoMensualidad;
}

// ---------------------------------------------------------------------------
// Líneas de participación
// ---------------------------------------------------------------------------

export type EstadoLinea = 'devengada' | 'liquidada' | 'ajustada' | 'anulada';

/**
 * Una línea nace SÓLO contra un cobro confirmado.
 *
 * Invariantes:
 *   parteLabIA.moneda === parteVendedor.moneda === baseCobrada.moneda
 *   parteLabIA.monto + parteVendedor.monto === baseCobrada.monto
 *   fuera del plazo de participación: parteVendedor = 0, parteLabIA = baseCobrada
 */
export interface LineaParticipacion {
  readonly id: Id;
  readonly vendedorId: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly productoId: ProductoId;
  readonly origen: ModalidadPrecio;
  /** Cotización aceptada o cobro de mensualidad. */
  readonly referenciaId: Id;
  readonly baseCobrada: Dinero;
  readonly participacionId: Id;
  readonly participacionVersion: number;
  readonly porcentajeVendedorAplicado: number;
  readonly parteLabIA: Dinero;
  readonly parteVendedor: Dinero;
  readonly periodo: PeriodoMensual;
  readonly estado: EstadoLinea;
  readonly liquidacionId: Id | null;
  readonly devengadaEn: ISODate;
}

// ---------------------------------------------------------------------------
// Liquidación, ajuste y observación
// ---------------------------------------------------------------------------

/** ⛔ `cerrada` es terminal. No se reabre. */
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
  readonly lineas: ReadonlyArray<LineaParticipacion>;
  readonly ajustes: ReadonlyArray<Ajuste>;
}

export interface Ajuste {
  readonly id: Id;
  readonly liquidacionOrigenId: Id | null;
  readonly periodoAplicacion: PeriodoMensual;
  readonly vendedorId: Id;
  /** Con signo: suma o resta sobre el período de aplicación. */
  readonly importe: Dinero;
  /** Obligatorio. */
  readonly motivo: string;
  readonly observacionId: Id | null;
  readonly creadoPor: Id;
  readonly creadoEn: ISODate;
}

export interface NuevoAjuste {
  readonly liquidacionOrigenId?: Id;
  readonly periodoAplicacion: PeriodoMensual;
  readonly vendedorId: Id;
  readonly importe: Dinero;
  readonly motivo: string;
  readonly observacionId?: Id;
}

export type EstadoObservacion = 'abierta' | 'procede' | 'no_procede' | 'parcial';

/** ⛔ Abrir una observación NO modifica ningún importe. */
export interface Observacion {
  readonly id: Id;
  readonly lineaParticipacionId: Id;
  readonly abiertaPor: Id;
  readonly descripcion: string;
  readonly estado: EstadoObservacion;
  readonly resolucion: string | null;
  readonly resueltaPor: Id | null;
  readonly resueltaEn: ISODate | null;
  readonly abiertaEn: ISODate;
}

export interface NuevaObservacion {
  readonly lineaParticipacionId: Id;
  readonly descripcion: string;
}

// ---------------------------------------------------------------------------
// Presupuesto
// ---------------------------------------------------------------------------

export interface Presupuesto {
  readonly id: Id;
  readonly vendedorId: Id;
  readonly nombreVendedor: string;
  readonly periodo: PeriodoMensual;
  /** En guaraníes: el ranking ordena por monto. */
  readonly metaVendido: Dinero;
  readonly metaCobrado: Dinero | null;
  readonly definidoPor: Id;
  readonly definidoEn: ISODate;
  readonly version: number;
}

export interface NuevoPresupuesto {
  readonly vendedorId: Id;
  readonly periodo: PeriodoMensual;
  readonly metaVendido: Dinero;
  readonly metaCobrado?: Dinero;
}

// ---------------------------------------------------------------------------
// Las ocho cifras
// ---------------------------------------------------------------------------

/**
 * ⛔ No existe ningún campo `totalConsolidado`: cada cifra es TotalesPorMoneda,
 *    una entrada por moneda.
 */
export interface ResumenDinero {
  readonly periodo: PeriodoMensual;
  readonly vendido: TotalesPorMoneda;
  readonly cobrado: TotalesPorMoneda;
  readonly porCobrar: TotalesPorMoneda;
  readonly parteLabIA: TotalesPorMoneda;
  readonly parteVendedor: TotalesPorMoneda;
  readonly comisionPendiente: TotalesPorMoneda;
  readonly comisionPagada: TotalesPorMoneda;
  readonly mensualidadesVigentes: {
    readonly cantidad: number;
    readonly importe: TotalesPorMoneda;
  };
}

export interface LineaPorCobrar {
  readonly id: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly vendedorId: Id;
  readonly nombreVendedor: string;
  readonly productoId: ProductoId;
  readonly origen: ModalidadPrecio;
  readonly importe: Dinero;
  readonly venceEn: ISODate | null;
  readonly diasDeAntiguedad: number;
  readonly estado: EstadoCobro;
}

// ---------------------------------------------------------------------------
// Cierre de período
// ---------------------------------------------------------------------------

export type BloqueoCierre =
  | 'cotizaciones_sin_resolver'
  | 'cobros_sin_confirmar'
  | 'observaciones_abiertas';

export interface VerificacionCierre {
  readonly periodo: PeriodoMensual;
  readonly puedeCerrar: boolean;
  readonly bloqueos: ReadonlyArray<{
    readonly tipo: BloqueoCierre;
    readonly cantidad: number;
    readonly detalle: string;
  }>;
}
