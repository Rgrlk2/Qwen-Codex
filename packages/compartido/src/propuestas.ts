/**
 * Presentaciones y cotizaciones. Son DOS COSAS DISTINTAS que nunca se mezclan.
 *
 *   A) PRESENTACIÓN — se genera PRIMERO. Personalizada, visual, compartible,
 *      SIN precio definitivo, NO requiere aprobación.
 *
 *   B) COTIZACIÓN — se prepara DESPUÉS. El vendedor propone el precio
 *      personalizado. ⛔ SIEMPRE pasa por aprobación del administrador.
 *
 * El circuito, sin desvíos:
 *   borrador del vendedor → revisión del administrador → aprobada o corregida
 *   → PDF definitivo → envío al cliente
 *
 * ⛔ No existe ninguna transición que lleve una cotización al cliente sin pasar
 *    por `aprobada`. El tipo `EstadoCotizacion` y los métodos de api.ts lo
 *    hacen imposible por construcción, no por una validación saltéable.
 *
 * Ver MASTER_SPEC.md §2.4 y §9, USER_FLOWS.md F8 a F12.
 */

import type { Dinero, Id, ISODate, TotalesPorMoneda, Trazado } from './core';
import type { ProductoId } from './catalogo';

export type TipoPropuesta = 'presentacion' | 'cotizacion';

// ===========================================================================
// A · PRESENTACIÓN — material de venta, sin efecto comercial
// ===========================================================================

export interface Presentacion extends Trazado {
  readonly id: Id;
  readonly tipo: 'presentacion';
  readonly clienteId: Id;
  readonly vendedorId: Id;
  readonly titulo: string;
  readonly productosIncluidos: ReadonlyArray<ProductoId>;
  readonly casosDeUsoIncluidos: ReadonlyArray<string>;
  /** Plan del motor que la originó: de ahí salen dolores y argumentos. */
  readonly planId: Id | null;
  /**
   * Rango de referencia documentado, si se decide incluirlo.
   * ⛔ Va SIEMPRE marcado como referencia. Nunca es un precio definitivo.
   */
  readonly mostrarRangoDeReferencia: boolean;
  readonly version: number;
}

export interface NuevaPresentacion {
  readonly clienteId: Id;
  readonly titulo: string;
  readonly productosIncluidos: ReadonlyArray<ProductoId>;
  readonly casosDeUsoIncluidos?: ReadonlyArray<string>;
  readonly planId?: Id;
  readonly mostrarRangoDeReferencia?: boolean;
}

// ===========================================================================
// B · COTIZACIÓN — precio personalizado, aprobación obligatoria
// ===========================================================================

/**
 * ⛔ `enviada_al_cliente` sólo se alcanza desde `aprobada`.
 * `corregida` vuelve a `borrador` con versión +1, historial intacto.
 */
export type EstadoCotizacion =
  | 'borrador'
  | 'en_revision'
  | 'aprobada'
  | 'corregida'
  | 'rechazada'
  | 'enviada_al_cliente'
  | 'aceptada'
  | 'perdida'
  | 'vencida';

/**
 * Un ítem de cotización guarda el precio de lista JUNTO al propuesto:
 * es lo que permite explicar la desviación meses después.
 */
export interface ItemCotizacion {
  readonly id: Id;
  readonly productoId: ProductoId;
  readonly plan: string | null;
  /** Documentado en el copy. `null` cuando el producto no tiene precio de lista. */
  readonly precioListaSetup: Dinero | null;
  readonly precioListaMensualidad: Dinero | null;
  /** Lo que propone el vendedor. */
  readonly setupPropuesto: Dinero;
  readonly mensualidadPropuesta: Dinero;
  readonly descuentoImplementacionPorcentaje: number;
  readonly alcance: string;
  /** Límites de uso incluidos: "+400 consultas/mes", usuarios, canales. */
  readonly limitesIncluidos: ReadonlyArray<string>;
  readonly notas: string | null;
}

export type ItemCotizacionEntrada = Omit<ItemCotizacion, 'id' | 'precioListaSetup' | 'precioListaMensualidad'>;

// ---------------------------------------------------------------------------
// Hitos de pago del setup
// ---------------------------------------------------------------------------

/**
 * Un hito de pago del setup.
 *
 * Estructura tomada de la Carta Oferta real de Agendar.IA:
 *   "50 % al aceptar · 50 % con versión conectada"
 *
 * Cada hito se expresa por PORCENTAJE o por IMPORTE, nunca por los dos a la vez.
 */
export type DisparadorHitoPago =
  | 'al_aceptar'
  | 'al_entregar'
  | 'al_conectar'
  | 'al_iniciar_piloto'
  | 'fecha_fija';

export interface HitoPagoSetup {
  readonly orden: number;
  readonly disparador: DisparadorHitoPago;
  /** Texto que ve el cliente: "50 % al aceptar", "50 % con versión conectada". */
  readonly descripcion: string;
  /** Exactamente uno de los dos. El otro va en `null`. */
  readonly porcentaje: number | null;
  readonly importe: Dinero | null;
  /** Sólo cuando `disparador === 'fecha_fija'`. */
  readonly fecha: ISODate | null;
}

/**
 * Condiciones comerciales de la cotización.
 * Estructura derivada de la Carta Oferta de Agendar.IA (ver COMMERCIAL_RULES §6).
 */
export interface CondicionesCotizacion {
  // --- Setup y sus hitos de pago ---
  /** ⛔ Los porcentajes deben sumar 100 cuando todos los hitos son porcentuales. */
  readonly hitosPagoSetup: ReadonlyArray<HitoPagoSetup>;
  /** Descuento sobre el setup: porcentaje o importe, uno de los dos. */
  readonly descuentoSetupPorcentaje: number | null;
  readonly descuentoSetupImporte: Dinero | null;

  // --- Mensualidad y su compromiso ---
  /** Meses de servicio incluidos sin cargo adicional (p. ej. "primer mes operativo incluido"). */
  readonly mesesIncluidos: number;
  /** Meses durante los cuales el precio mensual no cambia. */
  readonly mesesCongelamientoPrecio: number;

  // --- Beneficios y lo que los habilita ---
  readonly debitoAutomatico: boolean;
  readonly compromisoDoceMeses: boolean;
  readonly pagoAnualAnticipado: boolean;
  /**
   * ⛔ Cada beneficio declara QUÉ CONDICIÓN lo habilita.
   * Un descuento sin condición escrita es un descuento que después nadie puede reclamar.
   */
  readonly condicionesHabilitantes: ReadonlyArray<CondicionHabilitante>;

  // --- Alcance, vigencia y plan de trabajo ---
  readonly alcance: string;
  /** Qué NO incluye. En la Carta Oferta: comisiones de pasarela y consumos extraordinarios. */
  readonly exclusiones: string;
  readonly cronograma: ReadonlyArray<EtapaCronograma>;
  readonly condicionesComerciales: string;
  /** El copy sólo documenta "+ IVA" en un producto: acá se declara y se aprueba. */
  readonly tratamientoIva: string;
}

/** Qué beneficio se otorga y a cambio de qué. */
export interface CondicionHabilitante {
  readonly beneficio:
    | 'descuento_setup'
    | 'congelamiento_precio'
    | 'meses_incluidos'
    | 'precio_mensual_especial';
  /** "Débito automático", "Compromiso de 12 meses", "Pago anual anticipado". */
  readonly condicion: string;
  readonly descripcion: string;
  /** Qué pasa si el cliente deja de cumplirla. */
  readonly siNoSeCumple: string | null;
}

/**
 * Una etapa del cronograma de implementación.
 * En la Carta Oferta: reserva → versión personalizada → piloto supervisado →
 * inicio estimado → primera mensualidad.
 */
export interface EtapaCronograma {
  readonly orden: number;
  readonly titulo: string;
  /** Fecha estimada, o duración en días desde la etapa anterior. */
  readonly fechaEstimada: ISODate | null;
  readonly duracionDias: number | null;
  readonly entregable: string;
  /** Importe asociado a esta etapa, si la etapa dispara un cobro. */
  readonly importeAsociado: Dinero | null;
}

export interface Cotizacion extends Trazado {
  readonly id: Id;
  readonly tipo: 'cotizacion';
  readonly clienteId: Id;
  readonly vendedorId: Id;
  /** La presentación previa, si la hubo. El circuito esperado es presentación primero. */
  readonly presentacionId: Id | null;
  readonly folio: string;
  readonly version: number;
  readonly estado: EstadoCotizacion;
  readonly items: ReadonlyArray<ItemCotizacion>;
  readonly condiciones: CondicionesCotizacion;
  /** ⛔ Una entrada por moneda. Nunca un total consolidado. */
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly vigenteHasta: ISODate;
  readonly versionCatalogo: number;
  /** Obligatorio al pasar a `perdida`. */
  readonly motivoPerdida: string | null;
}

export interface CotizacionDetalle extends Cotizacion {
  readonly revision: Revision | null;
  readonly versiones: ReadonlyArray<VersionCotizacion>;
  readonly documentos: ReadonlyArray<DocumentoEmitido>;
  readonly enlaces: ReadonlyArray<EnlaceCompartido>;
  readonly comparacion: ComparacionConLista;
  readonly avisos: ReadonlyArray<string>;
}

export interface NuevaCotizacion {
  readonly clienteId: Id;
  readonly presentacionId?: Id;
  readonly items: ReadonlyArray<ItemCotizacionEntrada>;
  readonly condiciones: CondicionesCotizacion;
  readonly vigenteHasta: ISODate;
}

/** Lo propuesto contra lo documentado. Es información para el administrador, no un bloqueo. */
export interface ComparacionConLista {
  readonly lineas: ReadonlyArray<{
    readonly productoId: ProductoId;
    readonly precioListaSetup: Dinero | null;
    readonly setupPropuesto: Dinero;
    readonly desviacionSetup: Dinero | null;
    readonly desviacionSetupPorcentaje: number | null;
    readonly precioListaMensualidad: Dinero | null;
    readonly mensualidadPropuesta: Dinero;
    readonly desviacionMensualidad: Dinero | null;
    readonly desviacionMensualidadPorcentaje: number | null;
    /** `true` en Smart Commerce y Exeq.IA: no hay lista contra la cual comparar. */
    readonly sinPrecioDeLista: boolean;
  }>;
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
  readonly clienteId?: Id;
  readonly vendedorId?: Id;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
}

// ---------------------------------------------------------------------------
// Revisión del administrador
// ---------------------------------------------------------------------------

export type AccionRevision = 'enviar' | 'aprobar' | 'corregir' | 'rechazar';

export interface Revision {
  readonly id: Id;
  readonly cotizacionId: Id;
  readonly version: number;
  readonly vendedorId: Id;
  readonly revisorId: Id | null;
  readonly estado: 'pendiente' | 'aprobada' | 'corregida' | 'rechazada';
  readonly creadoEn: ISODate;
  readonly resueltoEn: ISODate | null;
  readonly eventos: ReadonlyArray<EventoRevision>;
}

/**
 * Append-only.
 * ⛔ `comentario` no vacío en aprobar, corregir y rechazar.
 * ⛔ `actorId !== vendedorId` en `aprobar`: nadie aprueba lo propio.
 */
export interface EventoRevision {
  readonly id: Id;
  readonly cotizacionId: Id;
  readonly version: number;
  readonly actorId: Id;
  readonly accion: AccionRevision;
  readonly comentario: string;
  readonly ocurridoEn: ISODate;
}

export interface FiltroColaRevision {
  readonly vendedorId?: Id;
  readonly desde?: ISODate;
  readonly ordenarPor?: 'antiguedad' | 'monto';
}

// ---------------------------------------------------------------------------
// PDF y enlaces
// ---------------------------------------------------------------------------

/**
 * Inmutable. Mismo insumo ⇒ mismo `hashContenido`.
 * ⛔ Para una cotización sólo se emite si el estado es `aprobada`.
 */
export interface DocumentoEmitido {
  readonly id: Id;
  readonly propuestaId: Id;
  readonly tipoPropuesta: TipoPropuesta;
  readonly versionPropuesta: number;
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
  readonly tipoPropuesta: TipoPropuesta;
  readonly versionPropuesta: number;
  /** ⛔ Token opaco. NUNCA deriva de clienteId, propuestaId ni de dato alguno del cliente. */
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

export type ResultadoAcceso = 'ok' | 'vencido' | 'revocado' | 'tope_superado' | 'codigo_invalido';

export type TipoDispositivo = 'escritorio' | 'celular' | 'tablet' | 'desconocido';

/**
 * Apertura de material compartido. **Append-only.**
 * Responde: "¿el cliente abrió lo que le mandé?"
 *
 * ⛔ Prohibido almacenar: IP completa, user-agent crudo, identificador de
 *    dispositivo, cookie persistente, datos de contacto del visitante, o
 *    correlación entre enlaces. Granularidad geográfica máxima: país.
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

export interface FiltroAperturas {
  readonly propuestaId?: Id;
  readonly enlaceId?: Id;
  readonly vendedorId?: Id;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
  readonly resultado?: ResultadoAcceso;
}

// ---------------------------------------------------------------------------
// Vista pública
// ---------------------------------------------------------------------------

/**
 * ⛔ Superficie mínima: sin navegación al Escritorio, sin otros clientes,
 *    sin precios de terceros, y NUNCA revela cuántas aperturas hubo.
 */
export interface PropuestaPublica {
  readonly tipo: TipoPropuesta;
  readonly titulo: string;
  readonly nombreCliente: string;
  readonly nombreVendedor: string;
  readonly emitidaEn: ISODate;
  readonly productos: ReadonlyArray<ProductoId>;
  /** ⛔ Vacío cuando la cotización está `vencida`. */
  readonly items: ReadonlyArray<Omit<ItemCotizacion, 'notas' | 'precioListaSetup' | 'precioListaMensualidad'>>;
  readonly condiciones: CondicionesCotizacion | null;
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly vigenteHasta: ISODate | null;
  readonly avisoVigencia: string | null;
  readonly pdfDisponible: boolean;
}
