/**
 * Investigación automática del objetivo.
 *
 * EL PRINCIPIO: el vendedor NO investiga ni completa manualmente el perfil del
 * negocio. Escribe lo mínimo que sabe —un RUC, una razón social, un nombre— y
 * el sistema investiga fuentes públicas y devuelve un perfil armado.
 * El vendedor sólo CONFIRMA, CORRIGE o AGREGA.
 *
 * ⛔ Todo dato viene clasificado: verificado · inferido · no encontrado.
 *    Un dato inferido nunca se presenta como verificado.
 * ⛔ Todo dato lleva su fuente, su fecha y su nivel de confianza.
 * ⛔ La investigación y el modelo de lenguaje corren SIEMPRE en el servidor,
 *    detrás de proveedores intercambiables. Ninguna clave ni llamada sensible
 *    vive en el navegador.
 * ⛔ Si la investigación externa falla, se cae a la taxonomía y se le pide al
 *    vendedor ÚNICAMENTE el dato mínimo faltante. Nunca un formulario largo vacío.
 *
 * Ver MASTER_SPEC.md §2.2, USER_FLOWS.md F2.
 */

import type { Id, ISODate } from './core';
import type { ProductoId } from './catalogo';
import type { DolorInferido, Encaje, PerfilOperativo, PosicionRanking } from './motor';

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export type TipoObjetivo = 'empresa' | 'profesional' | 'rubro';

/**
 * Entrada para una empresa. Basta con UNO de los tres campos.
 * El RUC es el más preciso; la razón social y el nombre comercial también sirven.
 */
export interface EntradaEmpresa {
  readonly tipo: 'empresa';
  readonly ruc?: string;
  readonly razonSocial?: string;
  readonly nombreComercial?: string;
  readonly ciudad?: string;
}

/**
 * Entrada para un profesional.
 * `matricula` y `ciudad` sólo si el vendedor los tiene a mano: ⛔ no se le piden.
 */
export interface EntradaProfesional {
  readonly tipo: 'profesional';
  readonly nombre: string;
  readonly profesionOEspecialidad: string;
  readonly matricula?: string;
  readonly ciudad?: string;
}

/** Entrada independiente por rubro. Se conserva tal como estaba. */
export interface EntradaRubro {
  readonly tipo: 'rubro';
  readonly rubro: string;
  readonly ciudad?: string;
}

export type EntradaObjetivo = EntradaEmpresa | EntradaProfesional | EntradaRubro;

// ---------------------------------------------------------------------------
// Clasificación de cada dato
// ---------------------------------------------------------------------------

/**
 * ⛔ La distinción es obligatoria y visible en pantalla:
 *   verificado    → aparece en una fuente pública identificable
 *   inferido      → lo deduce el sistema; se muestra SIEMPRE como hipótesis
 *   no_encontrado → no se halló. Se dice que no se halló; no se rellena.
 */
export type ClasificacionDato = 'verificado' | 'inferido' | 'no_encontrado';

/** Cuánto se puede confiar en el dato. `null` cuando es `no_encontrado`. */
export type NivelConfianza = 'alta' | 'media' | 'baja';

export type TipoFuente =
  | 'registro_publico'
  | 'sitio_web'
  | 'red_social'
  | 'directorio'
  | 'mapa'
  | 'buscador'
  | 'prensa'
  | 'taxonomia_interna';

export interface FuenteInvestigacion {
  readonly id: Id;
  readonly tipo: TipoFuente;
  readonly nombre: string;
  readonly url: string | null;
  readonly consultadaEn: ISODate;
  readonly exito: boolean;
  /** Por qué falló, cuando `exito === false`. Se muestra al vendedor. */
  readonly motivoFallo: string | null;
}

/**
 * Un dato investigado. Es la unidad mínima del resultado.
 *
 * Invariantes:
 *   clasificacion === 'verificado'    ⇒ fuentesIds no vacío y confianza !== null
 *   clasificacion === 'inferido'      ⇒ razonamiento no vacío y confianza !== null
 *   clasificacion === 'no_encontrado' ⇒ valor === null y confianza === null
 */
export interface DatoInvestigado<T = string> {
  readonly campo: string;
  readonly valor: T | null;
  readonly clasificacion: ClasificacionDato;
  readonly confianza: NivelConfianza | null;
  readonly fuentesIds: ReadonlyArray<Id>;
  /** Obligatorio cuando es `inferido`: de qué se dedujo. */
  readonly razonamiento: string | null;
  /** `true` cuando el vendedor lo confirmó o lo corrigió a mano. */
  readonly confirmadoPorVendedor: boolean;
  readonly valorCorregido: T | null;
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------

export type EstadoInvestigacion =
  | 'en_curso'
  | 'completa'
  | 'parcial'
  | 'sin_resultados'
  | 'fuentes_caidas'
  | 'error';

export interface CanalDigital {
  readonly tipo: 'sitio_web' | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'maps' | 'marketplace' | 'otro';
  readonly url: string;
  readonly identificador: string | null;
  readonly activo: boolean | null;
}

export interface PosibleDecisor {
  readonly nombre: string;
  readonly cargo: string | null;
  readonly fuenteId: Id;
  readonly confianza: NivelConfianza;
}

export interface SenalOperativa {
  readonly operacionId: Id | null;
  readonly descripcion: string;
  readonly evidencia: string;
  readonly confianza: NivelConfianza;
}

/** Tamaño aproximado. ⛔ Sólo se completa si hay evidencia; si no, `no_encontrado`. */
export type TamanoAproximado = 'unipersonal' | 'chico' | 'mediano' | 'grande';

/**
 * El resultado completo de investigar un objetivo.
 * Es lo que el vendedor ve y sobre lo que sólo confirma, corrige o agrega.
 */
export interface InvestigacionObjetivo {
  readonly id: Id;
  readonly entrada: EntradaObjetivo;
  readonly estado: EstadoInvestigacion;
  readonly investigadoEn: ISODate;
  readonly vendedorId: Id;

  // --- Lo que se devuelve, dato por dato ---
  readonly actividad: DatoInvestigado<string>;
  /** Actividad de la taxonomía a la que se resolvió. */
  readonly actividadId: Id | null;
  readonly ubicacion: DatoInvestigado<string>;
  readonly canalesDigitales: DatoInvestigado<ReadonlyArray<CanalDigital>>;
  readonly sitioWeb: DatoInvestigado<string>;
  readonly redesEncontradas: DatoInvestigado<ReadonlyArray<CanalDigital>>;
  readonly productosOServicios: DatoInvestigado<ReadonlyArray<string>>;
  readonly senalesOperativas: DatoInvestigado<ReadonlyArray<SenalOperativa>>;
  readonly posiblesDecisores: DatoInvestigado<ReadonlyArray<PosibleDecisor>>;
  /** ⛔ `no_encontrado` si no hay evidencia. No se estima. */
  readonly tamanoAproximado: DatoInvestigado<TamanoAproximado>;

  // --- Lo que se deriva ---
  readonly perfilOperativo: PerfilOperativo;
  readonly doloresProbables: ReadonlyArray<DolorInferido>;
  readonly productosRecomendados: ReadonlyArray<PosicionRanking>;

  // --- Trazabilidad ---
  readonly fuentesConsultadas: ReadonlyArray<FuenteInvestigacion>;
  readonly confianzaGlobal: NivelConfianza;
  /**
   * Lo único que hay que preguntarle al vendedor para poder seguir.
   * ⛔ Nunca es un formulario largo: son los campos mínimos que faltan.
   */
  readonly datosMinimosFaltantes: ReadonlyArray<CampoFaltante>;
  /** `true` cuando se cayó a la taxonomía porque las fuentes externas fallaron. */
  readonly usoRespaldoTaxonomia: boolean;
  readonly versionTaxonomia: number;
  readonly versionCatalogo: number;
}

/** Un dato que el sistema no pudo resolver y necesita del vendedor. */
export interface CampoFaltante {
  readonly campo: string;
  readonly pregunta: string;
  readonly porQueHaceFalta: string;
  readonly obligatorio: boolean;
  readonly opciones: ReadonlyArray<string> | null;
}

/** Corrección del vendedor sobre un dato investigado. */
export interface CorreccionDato {
  readonly campo: string;
  readonly valor: unknown;
  readonly accion: 'confirmar' | 'corregir' | 'agregar' | 'descartar';
}

export interface InvestigacionCorregida {
  readonly investigacion: InvestigacionObjetivo;
  /** Qué cambió en el perfil, los dolores y el ranking tras la corrección. */
  readonly cambios: ReadonlyArray<{
    readonly productoId: ProductoId;
    readonly posicionAnterior: number;
    readonly posicionNueva: number;
    readonly encajeAnterior: Encaje;
    readonly encajeNuevo: Encaje;
    readonly motivo: string;
  }>;
}

// ---------------------------------------------------------------------------
// Proveedores — SIEMPRE del lado del servidor
// ---------------------------------------------------------------------------

/**
 * Proveedores intercambiables. Se declara el CONTRATO, no el proveedor:
 * la elección del proveedor definitivo es una decisión posterior.
 *
 * ⛔ Estas interfaces se implementan ÚNICAMENTE en el servidor.
 *    Ninguna clave de API, ningún token y ninguna llamada a un proveedor
 *    externo pueden vivir en el navegador. El cliente sólo ve
 *    `InvestigacionObjetivo`, que ya viene resuelta y clasificada.
 */
export interface ProveedorBusqueda {
  readonly nombre: string;
  readonly tipo: TipoFuente;
  /** Contrato: recibe una consulta, devuelve resultados con su fuente. */
  readonly disponible: boolean;
}

export interface ProveedorRegistroPublico {
  readonly nombre: string;
  readonly pais: string;
  /** Qué identificadores acepta: RUC, razón social, matrícula. */
  readonly identificadoresSoportados: ReadonlyArray<'ruc' | 'razon_social' | 'matricula'>;
  readonly disponible: boolean;
}

export interface ProveedorModeloLenguaje {
  readonly nombre: string;
  /** Para qué se usa: normalizar, inferir operaciones, redactar argumentos. */
  readonly usos: ReadonlyArray<'normalizar' | 'inferir' | 'redactar' | 'clasificar'>;
  readonly disponible: boolean;
}

/** Estado de los proveedores, visible para el administrador. */
export interface EstadoProveedores {
  readonly busqueda: ReadonlyArray<ProveedorBusqueda>;
  readonly registrosPublicos: ReadonlyArray<ProveedorRegistroPublico>;
  readonly modeloLenguaje: ReadonlyArray<ProveedorModeloLenguaje>;
  /** `true` cuando ningún proveedor externo responde: se usa la taxonomía. */
  readonly modoRespaldo: boolean;
  readonly verificadoEn: ISODate;
}
