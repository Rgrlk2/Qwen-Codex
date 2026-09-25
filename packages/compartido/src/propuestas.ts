/**
 * Presentaciones y cotizaciones. Son DOS COSAS DISTINTAS que nunca se mezclan.
 *
 *   A) PRESENTACIÓN — se genera PRIMERO. Personalizada, visual, compartible,
 *      SIN precio definitivo, NO requiere aprobación.
 *
 *   B) COTIZACIÓN — se prepara DESPUÉS. El vendedor propone el precio especial.
 *      ⛔ SIEMPRE pasa por aprobación del administrador (CEO).
 *
 * El circuito, sin desvíos:
 *   borrador del vendedor → revisión del CEO → aprobación o corrección
 *   → incorporación de firmas → PDF definitivo → enlace para el cliente
 *
 * ⛔ No existe ninguna transición que lleve una cotización al cliente sin pasar
 *    por `aprobada`. El tipo `EstadoCotizacion` y los métodos de api.ts lo
 *    hacen imposible por construcción, no por una validación saltéable.
 *
 * ⛔ PLANTILLA GENÉRICA. Esta estructura se genera para cualquiera de los 13
 *    productos, cualquier variante y cualquier cliente. No hay ningún caso
 *    particular, ningún cliente de referencia y ningún importe fijado en el
 *    código: todo precio entra por datos.
 *
 * Nombres: internamente el importe negociado se llama **precio efectivo**.
 * ⛔ En el PDF que recibe el cliente se muestra SIEMPRE como "Precio especial"
 *    (ver `ETIQUETA_PRECIO_ESPECIAL`).
 *
 * Ver MASTER_SPEC.md §2.5 y §11, COMMERCIAL_RULES.md §6, USER_FLOWS.md F8b a F12.
 */

import type { Dinero, Id, ISODate, TotalesPorMoneda, Trazado } from './core';
import type { ProductoId } from './catalogo';
import type { AlternativaCalculada, BaseCalculo, CodigoAlternativa } from './alternativas';
import type { Firma } from './aceptacion';

/**
 * Qué documento sirve un enlace compartido.
 *
 * ⛔ Incluye `'ficha'` porque `CapaFichas.compartirFicha` devuelve un
 *    `EnlaceCompartido`: el enlace de una ficha es un enlace como los otros
 *    —token opaco, vencimiento, tope de aperturas, revocación— y tiene que
 *    poder decir qué es. Sin este valor, una ficha compartida viajaría
 *    disfrazada de presentación.
 *
 * El nombre `TipoPropuesta` quedó corto: hoy nombra el tipo de documento del
 * enlace, no sólo las propuestas. Anotado en docs/PEDIDOS.md.
 */
export type TipoPropuesta = 'presentacion' | 'cotizacion' | 'ficha';

/** ⛔ Etiqueta obligatoria en el documento del cliente. Internamente: precio efectivo. */
export const ETIQUETA_PRECIO_ESPECIAL = 'Precio especial';

/** ⛔ Permanencia mínima por defecto de toda cotización. */
export const PERMANENCIA_MINIMA_MESES = 12;

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
  /** Plan del motor que la originó: de ahí salen dolores y argumentos. */
  readonly planId: Id | null;

  /**
   * "Lo que conversamos": lo que el vendedor escuchó, con sus palabras.
   * ⛔ Va claramente separado del copy oficial, igual que en la ficha, para
   *    que el cliente distinga qué dice Lab.IA y qué dice su vendedor.
   *
   * ⛔ ESTO, Y NO UNA LISTA DE CASOS DE USO COPIADOS, es lo que hace la
   *    presentación relevante para ese cliente. El copy aprobado vive en
   *    `content/copy/` con su huella; guardarlo también acá crearía una
   *    segunda fuente del mismo texto y una de las dos se quedaría vieja.
   */
  readonly loQueConversamos: string | null;
  readonly notaDelVendedor: string | null;

  /**
   * Rango de referencia documentado, si se decide incluirlo.
   * ⛔ Va SIEMPRE marcado como referencia. Nunca es un precio definitivo:
   *    eso es la cotización, y ésa pasa por la aprobación del CEO.
   */
  readonly mostrarRangoDeReferencia: boolean;

  readonly descartadaEn: ISODate | null;
  readonly version: number;
}

export interface NuevaPresentacion {
  readonly clienteId: Id;
  readonly titulo: string;
  readonly productosIncluidos: ReadonlyArray<ProductoId>;
  readonly planId?: Id;
  readonly loQueConversamos?: string;
  readonly notaDelVendedor?: string;
  readonly mostrarRangoDeReferencia?: boolean;
}

// ===========================================================================
// B · COTIZACIÓN — precio especial, aprobación obligatoria
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

// ---------------------------------------------------------------------------
// Encabezado — quién, qué, cuándo
// ---------------------------------------------------------------------------

/** El cliente puede ser una empresa o un profesional independiente. Nunca las dos. */
export type TipoDestinatario = 'empresa' | 'profesional';

/**
 * A quién va dirigida la cotización.
 * ⛔ Todo viene del registro del cliente. Ningún dato se escribe en el código.
 */
export interface DestinatarioCotizacion {
  readonly clienteId: Id;
  readonly tipo: TipoDestinatario;
  /** Persona a la que va dirigida: nombre de contacto. */
  readonly nombreCliente: string;
  /** Razón social si es empresa; nombre profesional si es profesional. */
  readonly nombreEmpresaOProfesional: string;
  /** Profesión, cuando el destinatario es un profesional. */
  readonly profesion: string | null;
  readonly ruc: string | null;
  readonly ciudad: string | null;
}

/**
 * Qué se cotiza.
 * ⛔ Una cotización = UN producto y, cuando corresponde, UNA variante.
 *    Los combos se cotizan como cotizaciones vinculadas, no mezcladas.
 */
export interface ObjetoCotizado {
  readonly productoId: ProductoId;
  readonly nombreProducto: string;
  /** Variante o plan, cuando el producto lo tiene. `null` cuando no existe. */
  readonly variante: string | null;
}

// ---------------------------------------------------------------------------
// Precios — lista, especial y ahorro
// ---------------------------------------------------------------------------

/**
 * Los seis importes obligatorios del cuerpo de la cotización.
 *
 *   setup:      precio de lista · precio especial · ahorro
 *   mensualidad: precio de lista · precio especial · ahorro
 *
 * ⛔ El ahorro NO se escribe: se calcula (lista − especial) y se recalcula en el
 *    servidor antes de aprobar.
 * ⛔ Las cuatro monedas tienen que ser la misma. Nunca se suman monedas distintas.
 */
export interface PreciosCotizacion {
  readonly setupLista: Dinero;
  /** S — internamente "precio efectivo"; en el PDF del cliente, "Precio especial". */
  readonly setupEspecial: Dinero;
  readonly ahorroSetup: Dinero;
  readonly ahorroSetupPorcentaje: number;

  readonly mensualLista: Dinero;
  /** M — internamente "precio efectivo"; en el PDF del cliente, "Precio especial". */
  readonly mensualEspecial: Dinero;
  readonly ahorroMensual: Dinero;
  readonly ahorroMensualPorcentaje: number;
}

/** Lo que el vendedor escribe. El resto lo calcula el servidor. */
export interface PreciosEntrada {
  readonly setupEspecial: Dinero;
  readonly mensualEspecial: Dinero;
}

// ---------------------------------------------------------------------------
// Instalación y responsabilidades
// ---------------------------------------------------------------------------

/** Qué tiene que poner el cliente para que la instalación pueda arrancar. */
export type TipoAporteCliente = 'insumo' | 'acceso' | 'cuenta' | 'informacion' | 'equipo';

export interface AporteDelCliente {
  readonly tipo: TipoAporteCliente;
  readonly descripcion: string;
  /** `true` cuando sin esto la instalación no puede empezar. */
  readonly bloqueante: boolean;
}

export interface CondicionesInstalacion {
  /** Cómo se instala: modalidad, requisitos previos, quién participa. */
  readonly descripcion: string;
  /** Tiempo estimado de instalación, en días hábiles. */
  readonly tiempoEstimadoDiasHabiles: number;
  /** Texto que ve el cliente: "hasta 10 días hábiles desde la aceptación". */
  readonly tiempoEstimadoTexto: string;
  /** ⛔ Insumos, accesos, cuentas, información y equipos a cargo del cliente. */
  readonly aportesDelCliente: ReadonlyArray<AporteDelCliente>;
}

// ---------------------------------------------------------------------------
// Alcance y condiciones
// ---------------------------------------------------------------------------

/**
 * Alcance del servicio.
 * ⛔ `queIncluye` y `queNoIncluye` son ambos obligatorios y no vacíos: una
 *    cotización sin exclusiones escritas es un reclamo futuro.
 */
export interface AlcanceCotizacion {
  readonly queIncluye: ReadonlyArray<string>;
  readonly queNoIncluye: ReadonlyArray<string>;
  /** Límites de uso incluidos: consultas por mes, usuarios, canales. */
  readonly limitesIncluidos: ReadonlyArray<string>;
}

/**
 * Condiciones comerciales de la cotización.
 * ⛔ Plantilla genérica: el texto se compone de la base de la empresa más lo
 *    que agregue el vendedor. No hay condiciones fijadas por ningún caso previo.
 */
export interface CondicionesCotizacion {
  /** Permanencia mínima comprometida. Por defecto `PERMANENCIA_MINIMA_MESES` (12). */
  readonly permanenciaMinimaMeses: number;
  readonly instalacion: CondicionesInstalacion;
  readonly alcance: AlcanceCotizacion;
  /** Bases y condiciones completas, tal como se imprimen en el PDF. */
  readonly basesYCondiciones: string;
  /** Tratamiento del IVA. Se declara y se aprueba; no se asume. */
  readonly tratamientoIva: string;
  readonly notasInternas: string | null;
}

// ---------------------------------------------------------------------------
// Logos del documento
// ---------------------------------------------------------------------------

/**
 * Logos oficiales que lleva el documento.
 *
 * ⛔ Son referencias a activos oficiales del inventario
 *    (docs/INVENTARIO_ACTIVOS.md). No se generan, no se redibujan, no se
 *    recolorean, no se recortan y no se deforman: se muestran con
 *    `object-fit: contain` respetando su proporción original.
 */
export interface LogosDocumento {
  readonly labIa: string;
  readonly rgrlkGroup: string;
  readonly producto: string;
  /** Sólo si la variante tiene logo oficial propio. `null` si no existe. */
  readonly variante: string | null;
}

// ---------------------------------------------------------------------------
// La cotización
// ---------------------------------------------------------------------------

export interface Cotizacion extends Trazado {
  readonly id: Id;
  readonly tipo: 'cotizacion';
  /** Número o folio del documento. */
  readonly folio: string;
  readonly version: number;
  readonly estado: EstadoCotizacion;

  readonly destinatario: DestinatarioCotizacion;
  readonly objeto: ObjetoCotizado;

  readonly vendedorId: Id;
  readonly nombreVendedor: string;

  readonly fechaEmision: ISODate;
  /** Fecha de validez de la oferta. */
  readonly fechaValidez: ISODate;

  readonly precios: PreciosCotizacion;
  /** Las cuatro alternativas, calculadas. ⛔ Excluyentes entre sí. */
  readonly alternativas: ReadonlyArray<AlternativaCalculada>;
  readonly condiciones: CondicionesCotizacion;
  readonly logos: LogosDocumento;

  /** ⛔ Una entrada por moneda. Nunca un total consolidado. */
  readonly totalesPorMoneda: TotalesPorMoneda;

  /** La presentación previa, si la hubo. El circuito esperado es presentación primero. */
  readonly presentacionId: Id | null;
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
  /** Firma del vendedor y, tras la aprobación, firma del CEO. */
  readonly firmas: ReadonlyArray<Firma>;
  readonly avisos: ReadonlyArray<string>;
}

/**
 * Lo que el vendedor manda al crear.
 * ⛔ Precios de lista, ahorros, alternativas, totales y logos NO se envían:
 *    salen del catálogo y del cálculo del servidor.
 */
export interface NuevaCotizacion {
  readonly clienteId: Id;
  readonly productoId: ProductoId;
  readonly variante?: string;
  readonly presentacionId?: Id;
  readonly precios: PreciosEntrada;
  readonly condiciones: CondicionesCotizacion;
  readonly fechaValidez: ISODate;
}

/** Lo propuesto contra lo documentado. Es información para el administrador, no un bloqueo. */
export interface ComparacionConLista {
  readonly productoId: ProductoId;
  readonly precioListaSetup: Dinero | null;
  readonly setupEspecial: Dinero;
  readonly desviacionSetup: Dinero | null;
  readonly desviacionSetupPorcentaje: number | null;
  readonly precioListaMensualidad: Dinero | null;
  readonly mensualEspecial: Dinero;
  readonly desviacionMensualidad: Dinero | null;
  readonly desviacionMensualidadPorcentaje: number | null;
  /** `true` cuando el producto no tiene precio de lista documentado. */
  readonly sinPrecioDeLista: boolean;
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

/** Previsualización: lo que el vendedor ve mientras arma, antes de mandar a revisión. */
export interface PrevisualizacionCotizacion {
  readonly base: BaseCalculo;
  readonly precios: PreciosCotizacion;
  readonly alternativas: ReadonlyArray<AlternativaCalculada>;
  readonly totalesPorMoneda: TotalesPorMoneda;
  readonly avisos: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------------
// Revisión del CEO
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
  /**
   * ⛔ El servidor vuelve a ejecutar los cuatro cálculos antes de aprobar.
   * `true` cuando lo recalculado coincide con lo que el vendedor mandó.
   */
  readonly calculosRecalculados: boolean;
  /** Alternativas que quedan aprobadas y visibles para el cliente. */
  readonly alternativasAprobadas: ReadonlyArray<CodigoAlternativa>;
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
 * ⛔ Para una cotización sólo se emite si el estado es `aprobada` y las dos
 *    firmas están incorporadas y vigentes.
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
  /** ⛔ Referencia interna. El PDF se sirve desde el servidor, no por URL directa. */
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
  /** `true` cuando el cliente ya respondió por este enlace. */
  readonly respondido: boolean;
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
// Vista pública de una PRESENTACIÓN
// ---------------------------------------------------------------------------

/**
 * ⛔ Superficie mínima: sin navegación al Escritorio, sin otros clientes,
 *    sin precios de terceros, y NUNCA revela cuántas aperturas hubo.
 *
 * La vista pública de una COTIZACIÓN es `CotizacionPublica` (aceptacion.ts):
 * lleva alternativas, botones de opción y constancia.
 */
/**
 * Lo que el cliente abre de una presentación.
 *
 * ⛔ Superficie mínima, como la ficha: sin navegación al Escritorio, sin otros
 *    clientes, sin nada operativo del vendedor. Y ⛔ SIN COPY: acá viajan los
 *    identificadores de los productos; el texto aprobado lo pone el navegador
 *    desde el archivo congelado, para que no haya dos fuentes del mismo texto.
 */
export interface PresentacionPublica {
  readonly tipo: 'presentacion';
  readonly titulo: string;
  readonly nombreVendedor: string;
  readonly emitidaEn: ISODate;
  /** ⛔ Sólo los identificadores. El copy lo pone el navegador. */
  readonly productos: ReadonlyArray<ProductoId>;
  readonly loQueConversamos: string | null;
  readonly notaDelVendedor: string | null;
  /**
   * Si el cliente ve el rango documentado de cada producto.
   * ⛔ Es un rango de referencia, nunca un precio cerrado: lo que compromete a
   *    Lab.IA es la cotización, y ésa lleva aprobación y firma.
   */
  readonly mostrarRangoDeReferencia: boolean;
  /** ⛔ Única acción disponible, igual que en la ficha. */
  readonly llamadoALaAccion: 'Hablemos';
}
