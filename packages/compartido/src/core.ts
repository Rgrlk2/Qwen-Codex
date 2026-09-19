/**
 * Primitivas compartidas del Escritorio Vendedores Lab.IA.
 *
 * Reglas que este archivo hace cumplir por tipos:
 *  - Todo importe lleva moneda (no existe `number` de dinero suelto).
 *  - No se puede sumar PYG con USD: `Dinero<M>` es genérico en la moneda.
 *  - No existe un "total consolidado": los totales son `TotalesPorMoneda`.
 *
 * Ver docs/DATA_MODEL.md §0 y docs/COMMERCIAL_RULES.md §1.
 */

/** Identificador opaco. Nunca se deriva significado de su contenido. */
export type Id = string;

/** Fecha y hora ISO-8601 con zona. Zona de negocio: America/Asuncion. */
export type ISODate = string;

/** Período mensual `YYYY-MM`. */
export type PeriodoMensual = string;

/** Clave de idempotencia. Obligatoria en toda creación y acción de estado. */
export type ClaveIdempotencia = string;

/** Versión optimista de una entidad editable. */
export type Version = number;

// ---------------------------------------------------------------------------
// Dinero
// ---------------------------------------------------------------------------

/**
 * Monedas del portafolio. PYG en 12 productos; USD documentado en Precio Vivo.
 * No hay tipo de cambio institucional definido: ver COMMERCIAL_RULES.md §1 y §11 (X3).
 */
export type Moneda = 'PYG' | 'USD';

/**
 * Importe con moneda. `monto` va en **unidad mínima entera**:
 *  - PYG: guaraníes (sin decimales)
 *  - USD: centavos
 *
 * El parámetro genérico impide sumar monedas distintas en tiempo de compilación.
 */
export interface Dinero<M extends Moneda = Moneda> {
  readonly monto: number;
  readonly moneda: M;
}

/**
 * Totales agrupados por moneda: **una entrada por moneda**.
 * Reemplaza deliberadamente a cualquier `total: Dinero` único.
 * Ver COMMERCIAL_RULES.md §1 M3/M4 y QA_CHECKLIST.md §5.2.
 */
export type TotalesPorMoneda = ReadonlyArray<Dinero>;

/**
 * Firma de la suma de dinero. Sólo acepta dos importes de **la misma** moneda.
 * Se declara el contrato; la implementación vive en la capa que corresponda.
 */
export type SumarDinero = <M extends Moneda>(a: Dinero<M>, b: Dinero<M>) => Dinero<M>;

// ---------------------------------------------------------------------------
// Resultados y errores
// ---------------------------------------------------------------------------

export type CodigoError =
  /**
   * Credenciales inválidas en el ingreso.
   * ⛔ Mensaje genérico: NUNCA revela si el usuario existe (MASTER_SPEC §1.3).
   */
  | 'credenciales_invalidas'
  | 'no_autenticado'
  | 'sin_permiso'
  | 'no_encontrado'
  | 'validacion'
  | 'conflicto_version'
  | 'regla_comercial'
  | 'requiere_aprobacion'
  | 'requiere_firma'
  | 'monedas_mezcladas'
  | 'limite_excedido'
  | 'enlace_vencido'
  | 'enlace_revocado'
  | 'tope_aperturas'
  | 'servicio_no_disponible'
  | 'tiempo_agotado'
  | 'desconocido';

export interface ErrorApi {
  readonly codigo: CodigoError;
  /** Texto que se muestra al usuario, en es-PY. Sin códigos ni jerga técnica. */
  readonly mensajeAmable: string;
  /** Qué puede hacer el usuario al respecto. */
  readonly pista?: string;
  /** Campo afectado, en errores de validación. */
  readonly campo?: string;
  /** Sólo para registro técnico. Nunca se muestra en pantalla. */
  readonly detalle?: unknown;
}

export type Resultado<T> =
  | { readonly ok: true; readonly datos: T }
  | { readonly ok: false; readonly error: ErrorApi };

export interface Pagina<T> {
  readonly items: ReadonlyArray<T>;
  /** `null` = no hay más páginas. */
  readonly cursor: string | null;
  /** `null` cuando el conteo total es caro de calcular. */
  readonly total: number | null;
}

export interface OpcionesPagina {
  readonly cursor?: string;
  readonly limite?: number;
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

export interface RangoFechas {
  readonly desde: ISODate;
  readonly hasta: ISODate;
}

export interface Adjunto {
  readonly id: Id;
  readonly nombre: string;
  readonly tipoMime: string;
  readonly tamanoBytes: number;
  readonly almacenamientoRef: string;
  readonly subidoEn: ISODate;
}

/** Marca de auditoría mínima de una entidad. */
export interface Trazado {
  readonly creadoEn: ISODate;
  readonly creadoPor: Id;
  readonly actualizadoEn: ISODate;
  readonly actualizadoPor: Id;
  readonly version: Version;
}
