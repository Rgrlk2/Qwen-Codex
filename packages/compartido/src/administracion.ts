/**
 * Administración — UNA vista adicional con secciones internas.
 *
 * ⛔ No es otra aplicación ni un menú de nueve pantallas: es una vista con
 *    secciones, dentro de la misma app, en la ruta protegida #/administracion.
 *
 * ⛔ ELIMINADO de esta vista: analítica genérica de conversión, mezcla de
 *    productos, embudos, tasas de cierre y gráficos decorativos. No existe
 *    ningún tipo acá que permita dibujarlos.
 *
 * Ver MASTER_SPEC.md §3, USER_FLOWS.md F15 a F19.
 */

import type { Dinero, Id, ISODate, PeriodoMensual, TotalesPorMoneda } from './core';
import type { EstadoPrecio, ModalidadPrecio, ProductoId } from './catalogo';
import type { Moneda } from './core';

/** Las diez secciones de la vista. */
export type SeccionAdmin =
  | 'control_financiero'
  | 'presupuesto_de_ventas'
  | 'vendido_cobrado_por_cobrar'
  | 'comisiones'
  | 'ranking'
  | 'accesos_y_uso'
  | 'todos_los_clientes'
  | 'aprobacion_de_cotizaciones'
  | 'configuracion_comercial'
  | 'sugerencias';

// ---------------------------------------------------------------------------
// Control financiero
// ---------------------------------------------------------------------------

export interface ControlFinanciero {
  readonly periodo: PeriodoMensual;
  readonly vendido: TotalesPorMoneda;
  readonly cobrado: TotalesPorMoneda;
  readonly porCobrar: TotalesPorMoneda;
  readonly parteLabIA: TotalesPorMoneda;
  readonly parteVendedores: TotalesPorMoneda;
  readonly comisionPendiente: TotalesPorMoneda;
  readonly comisionPagada: TotalesPorMoneda;
  readonly mensualidadesActivas: number;
  readonly bajasDelPeriodo: number;
  readonly cotizacionesEnRevision: number;
  readonly sugerenciasSinResponder: number;
}

/** ⛔ Ordenado por MONTO EN GUARANÍES. No por puntaje, porcentaje ni medalla. */
export interface FilaRanking {
  readonly posicion: number;
  readonly vendedorId: Id;
  readonly nombreVendedor: string;
  readonly vendido: Dinero;
  readonly cobrado: Dinero;
  readonly metaVendido: Dinero | null;
  readonly cumplimientoGuaranies: Dinero | null;
  readonly cumplimientoPorcentaje: number | null;
}

// ---------------------------------------------------------------------------
// Accesos y frecuencia de uso
// ---------------------------------------------------------------------------

/** Sirve para saber quién está trabajando. */
export interface UsoPorVendedor {
  readonly vendedorId: Id;
  readonly nombreVendedor: string;
  readonly ultimoIngresoEn: ISODate | null;
  readonly ingresosEnPeriodo: number;
  readonly diasSinEntrar: number | null;
  readonly planesCreados: number;
  readonly seguimientosRegistrados: number;
  readonly cotizacionesEnviadas: number;
  /** Supera el umbral configurado de días sin entrar. */
  readonly marcadoInactivo: boolean;
}

// ---------------------------------------------------------------------------
// Catálogo (sólo publicación y precios de lista)
// ---------------------------------------------------------------------------

/** ⛔ `textoDocumentado` obligatorio: es la transcripción literal del copy. */
export interface PrecioListaEntrada {
  readonly productoId: ProductoId;
  readonly modalidad: ModalidadPrecio;
  readonly plan: string | null;
  readonly estado: EstadoPrecio;
  readonly moneda: Moneda;
  readonly montoDesde: number | null;
  readonly montoHasta: number | null;
  readonly ivaIncluido: boolean | null;
  readonly textoDocumentado: string;
  readonly condicion: string | null;
  readonly vigenteDesde: ISODate | null;
}

// ---------------------------------------------------------------------------
// Reasignación de cartera
// ---------------------------------------------------------------------------

export type AlcanceReasignacion = 'cartera_completa' | 'clientes_seleccionados';

/** ⛔ Qué pasa con lo en curso es una decisión explícita. Sin default silencioso. */
export interface ReasignacionCartera {
  readonly origenVendedorId: Id;
  readonly destinoVendedorId: Id;
  readonly alcance: AlcanceReasignacion;
  readonly clientesIds?: ReadonlyArray<Id>;
  readonly fechaEfectiva: ISODate;
  readonly motivo: string;
  readonly decisiones: {
    readonly cotizacionesEnRevision: 'mantener_en_origen' | 'transferir';
    readonly mensualidadesVigentes: 'mantener_en_origen' | 'transferir';
    readonly planesAbiertos: 'cerrar' | 'transferir';
    readonly seguimientosPendientes: 'mantener_en_origen' | 'transferir';
  };
}

export interface ResultadoReasignacion {
  readonly clientesMovidos: number;
  readonly cotizacionesAfectadas: number;
  readonly mensualidadesAfectadas: number;
  readonly planesAfectados: number;
  /** ⛔ Las líneas ya devengadas NO se reasignan: son de quien las generó. */
  readonly lineasDevengadasIntactas: number;
}

// ---------------------------------------------------------------------------
// Parámetros
// ---------------------------------------------------------------------------

export interface ParametrosSistema {
  /** Días sin contacto para marcar un cliente en los próximos seguimientos. */
  readonly diasSinContactoParaSenal: number;
  /** Días sin apertura de enlace para avisar al vendedor. */
  readonly diasSinAperturaParaSenal: number;
  /** Días sin entrar para marcar a un vendedor como inactivo. */
  readonly diasSinEntrarParaInactivo: number;
  readonly vigenciaCotizacionDias: number;
  readonly vigenciaEnlaceDias: number;
  readonly retencionAudioDias: number | null;
  readonly monedasHabilitadas: ReadonlyArray<Moneda>;
  /** ⛔ Sin tipo de cambio institucional no hay consolidación de monedas. */
  readonly tipoCambioInstitucional: null;
}
