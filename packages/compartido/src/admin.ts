/**
 * Administración.
 *
 * ⛔ No existe alta ni baja de producto: el portafolio cerrado se defiende en el contrato,
 *    no con una validación que alguien pueda saltear.
 * ⛔ No existe edición de regla de comisión (sólo publicación de versión nueva),
 *    ni reapertura de período, ni escritura sobre auditoría.
 *
 * Ver MASTER_SPEC.md §6, API_CONTRACTS.md §2.8.
 */

import type { Dinero, Id, ISODate, Moneda, PeriodoMensual, TotalesPorMoneda } from './core';
import type { EstadoPrecio, ModalidadPrecio, ProductoId } from './catalogo';

export interface PanelAdmin {
  readonly cotizacionesEnCola: number;
  readonly tiempoPromedioAprobacionHoras: number | null;
  readonly vendidoDelPeriodo: TotalesPorMoneda;
  readonly mensualidadesActivas: number;
  readonly bajasDelPeriodo: number;
  readonly comisionDevengada: TotalesPorMoneda;
  readonly comisionLiquidada: TotalesPorMoneda;
  readonly cuentasSinActividad: number;
  readonly sugerenciasSinResponder: number;
  readonly periodo: PeriodoMensual;
}

/** Carga de precios transcriptos del copy aprobado. ⛔ `textoDocumentado` es obligatorio. */
export interface PrecioCatalogoEntrada {
  readonly productoId: ProductoId;
  readonly modalidad: ModalidadPrecio;
  readonly plan: string | null;
  readonly estado: EstadoPrecio;
  readonly moneda: Moneda;
  readonly montoDesde: number | null;
  readonly montoHasta: number | null;
  readonly ivaIncluido: boolean | null;
  /** Transcripción literal del copy. Es lo que se muestra. */
  readonly textoDocumentado: string;
  readonly condicion: string | null;
  readonly vigenteDesde: ISODate | null;
}

export type AlcanceReasignacion = 'cartera_completa' | 'cuentas_seleccionadas';

/** ⛔ Qué pasa con lo en curso es una decisión explícita. Sin default silencioso. */
export interface ReasignacionCartera {
  readonly origenVendedorId: Id;
  readonly destinoVendedorId: Id;
  readonly alcance: AlcanceReasignacion;
  readonly cuentasIds?: ReadonlyArray<Id>;
  readonly fechaEfectiva: ISODate;
  readonly motivo: string;
  readonly decisiones: {
    readonly cotizacionesEnCola: 'mantener_en_origen' | 'transferir';
    readonly mensualidadesVigentes: 'mantener_en_origen' | 'transferir';
    readonly planesAbiertos: 'cerrar' | 'transferir';
    readonly seguimientosPendientes: 'mantener_en_origen' | 'transferir';
  };
}

export interface ResultadoReasignacion {
  readonly cuentasMovidas: number;
  readonly cotizacionesAfectadas: number;
  readonly mensualidadesAfectadas: number;
  readonly planesAfectados: number;
  /** ⛔ Las comisiones ya devengadas NO se reasignan: pertenecen a quien las generó. */
  readonly comisionesDevengadasIntactas: number;
}

export interface FiltroUsuarios {
  readonly rol?: string;
  readonly activo?: boolean;
  readonly supervisorId?: Id;
  readonly texto?: string;
}

/**
 * Parámetros del sistema.
 * ⛔ Los que están en `null` NO están definidos en los insumos y no se inventan.
 *    Cada uno tiene un comportamiento conservador documentado en COMMERCIAL_RULES.md §6.
 */
export interface ParametrosSistema {
  /** Días sin contacto para levantar la señal de atención. */
  readonly diasSinContactoParaSenal: number | null;
  /** Días sin apertura de enlace para levantar la señal. */
  readonly diasSinAperturaParaSenal: number | null;
  /** Vigencia por defecto de una cotización, en días. `null` ⇒ el vendedor la fija a mano. */
  readonly vigenciaCotizacionDias: number | null;
  /** Vigencia por defecto de un enlace, en días. */
  readonly vigenciaEnlaceDias: number | null;
  /** SLA de aprobación, en horas. `null` ⇒ sin reloj ni escalado automático. */
  readonly slaAprobacionHoras: number | null;
  /** Retención de audios de seguimiento, en días. `null` ⇒ sin borrado automático. */
  readonly retencionAudioDias: number | null;
  /** Retención de auditoría, en días. */
  readonly retencionAuditoriaDias: number | null;
  readonly monedasHabilitadas: ReadonlyArray<Moneda>;
  /** ⛔ Sin tipo de cambio institucional definido no hay consolidación de monedas. */
  readonly tipoCambioInstitucional: null;
  readonly limiteDescuentoPorDefecto: Dinero | null;
}
