/**
 * Presentaciones, cotizaciones, aprobación, PDF, enlaces y accesos a enlaces.
 * Ver MASTER_SPEC.md §2.4, §10 y §11; USER_FLOWS.md F5–F8 y F17.
 */

import type { Dinero, Id, ISODate, TotalesPorMoneda, Trazado } from './core';
import type { ModalidadPrecio, ProductoId } from './catalogo';

export type TipoPropuesta = 'presentacion' | 'cotizacion';

interface PropuestaBase extends Trazado {
  readonly id: Id;
  readonly tipo: TipoPropuesta;
  readonly cuentaId: Id;
  readonly vendedorId: Id;
  readonly titulo: string;
}

// ---------------------------------------------------------------------------
// Presentación — material de venta, sin efecto comercial
// ---------------------------------------------------------------------------

export interface Presentacion extends PropuestaBase {
  readonly tipo: 'presentacion';
  readonly productosIncluidos: ReadonlyArray<ProductoId>;
  readonly casosDeUsoIncluidos: ReadonlyArray<string>;
  /**
   * ⛔ `true` convierte la presentación en propuesta económica:
   * queda sujeta a la misma aprobación que una cotización.
   */
  readonly incluyePrecios: boolean;
  readonly plantillaId: Id | null;
}

export interface NuevaPresentacion {
  readonly cuentaId: Id;
  readonly titulo: string;
  readonly productosIncluidos: ReadonlyArray<ProductoId>;
  readonly casosDeUsoIncluidos?: ReadonlyArray<string>;
  readonly incluyePrecios?: boolean;
  readonly plantillaId?: Id;
}

// ---------------------------------------------------------------------------
// Cotización
// ---------------------------------------------------------------------------

export type EstadoCotizacion =
  | 'borrador'
  | 'enviada_a_aprobacion'
  | 'aprobada'
  | 'rechazada'
  | 'cambios_solicitados'
  | 'enviada_al_cliente'
  | 'aceptada'
  | 'perdida'
  | 'vencida';

export type MotivoAprobacion =
  | 'descuento_supera_limite'
  | 'limite_no_definido'
  | 'item_no_documentado'
  | 'fuera_de_rango'
  | 'bajo_el_piso'
  | 'condicion_no_prevista'
  | 'presentacion_con_precios'
  | 'version_catalogo_desactualizada';

export interface ItemCotizacion {
  readonly id: Id;
  readonly productoId: ProductoId;
  readonly modalidad: ModalidadPrecio;
  readonly plan: string | null;
  readonly cantidad: number;
  readonly precioCatalogoId: Id | null;
  /** `null` cuando el ítem está `aCotizar`. */
  readonly precioLista: Dinero | null;
  readonly descuentoPorcentaje: number;
  /** ⛔ Misma moneda que `precioLista`. Un ítem nunca cambia de moneda. */
  readonly precioFinal: Dinero | null;
  /** Producto con precio `no_documentado`: sin importe, dispara aprobación obligatoria. */
  readonly aCotizar: boolean;
  readonly notas: string | null;
}

export type ItemCotizacionEntrada = Omit<ItemCotizacion, 'id' | 'precioLista' | 'precioFinal'>;

export interface Cotizacion extends PropuestaBase {
  readonly tipo: 'cotizacion';
  readonly folio: string;
  readonly estado: EstadoCotizacion;
  readonly items: ReadonlyArray<ItemCotizacion>;
  /** ⛔ Una entrada por moneda. Nunca un total consolidado. */
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly vigenteHasta: ISODate;
  /** Con qué versión de precios se armó. Permite explicar una diferencia meses después. */
  readonly versionCatalogo: number;
  readonly requiereAprobacion: boolean;
  readonly motivoRequiereAprobacion: ReadonlyArray<MotivoAprobacion>;
  /** Obligatorio al pasar a `perdida`. */
  readonly motivoPerdida: string | null;
}

export interface CotizacionDetalle extends Cotizacion {
  readonly solicitudAprobacion: SolicitudAprobacion | null;
  readonly documentos: ReadonlyArray<DocumentoEmitido>;
  readonly enlaces: ReadonlyArray<EnlaceCompartido>;
  readonly avisos: ReadonlyArray<string>;
}

export interface NuevaCotizacion {
  readonly cuentaId: Id;
  readonly titulo: string;
  readonly items: ReadonlyArray<ItemCotizacionEntrada>;
  readonly vigenteHasta: ISODate;
}

export interface VersionCotizacion {
  readonly version: number;
  readonly estado: EstadoCotizacion;
  readonly creadaEn: ISODate;
  readonly creadaPor: Id;
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly motivoCambio: string | null;
}

export interface FiltroCotizaciones {
  readonly estado?: EstadoCotizacion;
  readonly cuentaId?: Id;
  readonly vendedorId?: Id;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
}

// ---------------------------------------------------------------------------
// Aprobación
// ---------------------------------------------------------------------------

export type AccionAprobacion = 'enviar' | 'aprobar' | 'rechazar' | 'solicitar_cambios' | 'escalar';

export interface SolicitudAprobacion {
  readonly id: Id;
  readonly cotizacionId: Id;
  readonly versionCotizacion: number;
  readonly solicitanteId: Id;
  readonly aprobadorId: Id | null;
  readonly estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cambios_solicitados';
  /** `null` mientras el SLA esté pendiente de definición (COMMERCIAL_RULES.md §6-9). */
  readonly slaVenceEn: ISODate | null;
  readonly escaladaA: Id | null;
  readonly creadoEn: ISODate;
  readonly resueltoEn: ISODate | null;
  readonly eventos: ReadonlyArray<EventoAprobacion>;
}

/** Append-only. ⛔ `actorId !== solicitanteId` para `aprobar`: nadie aprueba lo propio. */
export interface EventoAprobacion {
  readonly id: Id;
  readonly solicitudId: Id;
  readonly actorId: Id;
  readonly accion: AccionAprobacion;
  /** Obligatorio en `aprobar`, `rechazar` y `solicitar_cambios`. */
  readonly comentario: string;
  readonly ocurridoEn: ISODate;
}

export interface FiltroColaAprobacion {
  readonly aprobadorId?: Id;
  readonly vendedorId?: Id;
  readonly vencidas?: boolean;
  readonly desde?: ISODate;
}

// ---------------------------------------------------------------------------
// PDF y enlaces
// ---------------------------------------------------------------------------

/** Inmutable. Mismo insumo ⇒ mismo `hashContenido`. Un cambio produce otro documento. */
export interface DocumentoEmitido {
  readonly id: Id;
  readonly propuestaId: Id;
  readonly versionPropuesta: number;
  readonly tipo: 'pdf';
  readonly folio: string;
  readonly hashContenido: string;
  readonly emitidoEn: ISODate;
  readonly emitidoPor: Id;
  readonly validoHasta: ISODate | null;
  readonly almacenamientoRef: string;
}

export interface OpcionesEnlace {
  readonly venceEn: ISODate;
  readonly topeAperturas?: number;
  readonly requiereCodigo?: boolean;
}

export interface EnlaceCompartido {
  readonly id: Id;
  readonly propuestaId: Id;
  readonly versionPropuesta: number;
  /** ⛔ Token opaco. NUNCA deriva de propuestaId, cuentaId ni de dato alguno del cliente. */
  readonly token: string;
  readonly creadoEn: ISODate;
  readonly creadoPor: Id;
  readonly venceEn: ISODate;
  readonly topeAperturas: number | null;
  readonly aperturas: number;
  readonly requiereCodigo: boolean;
  readonly revocadoEn: ISODate | null;
  readonly revocadoPor: Id | null;
}

export type ResultadoAcceso =
  | 'ok'
  | 'vencido'
  | 'revocado'
  | 'tope_superado'
  | 'codigo_invalido';

export type TipoDispositivo = 'escritorio' | 'celular' | 'tablet' | 'desconocido';

/**
 * Registro de accesos a material compartido. **Append-only.**
 *
 * ⛔ Prohibido almacenar: IP completa, user-agent crudo, identificador de dispositivo,
 *    cookie persistente, datos de contacto del visitante, o correlación entre enlaces.
 *    Granularidad geográfica máxima: país.
 */
export interface AccesoEnlace {
  readonly id: Id;
  readonly enlaceId: Id;
  readonly documentoId: Id | null;
  readonly tipoDocumento: TipoPropuesta;
  readonly ocurridoEn: ISODate;
  readonly tipoDispositivo: TipoDispositivo;
  readonly paisAproximado: string | null;
  readonly duracionSegundos: number | null;
  readonly resultado: ResultadoAcceso;
}

export interface FiltroAccesos {
  readonly propuestaId?: Id;
  readonly enlaceId?: Id;
  readonly vendedorId?: Id;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
  readonly resultado?: ResultadoAcceso;
}

// ---------------------------------------------------------------------------
// Vista pública del enlace
// ---------------------------------------------------------------------------

/**
 * Superficie pública mínima.
 * ⛔ Sin navegación al Escritorio, sin otras cuentas, sin precios de otros clientes.
 * ⛔ Nunca revela cuántos accesos hubo.
 */
export interface PropuestaPublica {
  readonly tipo: TipoPropuesta;
  readonly titulo: string;
  readonly nombreCuenta: string;
  readonly nombreVendedor: string;
  readonly emitidaEn: ISODate;
  readonly productos: ReadonlyArray<ProductoId>;
  /** ⛔ Vacío cuando la cotización está `vencida`. */
  readonly items: ReadonlyArray<Omit<ItemCotizacion, 'notas' | 'precioCatalogoId'>>;
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly vigenteHasta: ISODate | null;
  readonly avisoVigencia: string | null;
  readonly pdfDisponible: boolean;
}
