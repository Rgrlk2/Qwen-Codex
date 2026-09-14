/**
 * Catálogo cerrado de productos Lab.IA.
 *
 * ⛔ PORTAFOLIO CERRADO EN 13 PRODUCTOS: 9 específicas + 4 integrales.
 * ⛔ Todo producto adicional hallado en la web está EXCLUIDO (ver MASTER_SPEC.md §4.2).
 * ⛔ El copy (slogan, definición, beneficios, casos de uso, precios) NO se declara acá:
 *    vive en content/copy/ y se resuelve por `claveCopy`. Duplicarlo garantiza divergencia.
 *
 * Ver MASTER_SPEC.md §4 y content/copy/COPY_LOCK.md.
 */

import type { Dinero, Id, ISODate, Moneda } from './core';

// ---------------------------------------------------------------------------
// Los 13 identificadores. Esta lista es el portafolio.
// ---------------------------------------------------------------------------

export const PRODUCTOS_ESPECIFICOS = [
  'ojo-digital',
  'pulso-digital',
  'vendedor-24-7',
  'radar-stock',
  'faro-digital',
  'merma-ia',
  'cotiza-facil',
  'precio-vivo',
  'ruta-ia',
] as const;

export const PRODUCTOS_INTEGRALES = [
  'park-ia',
  'smart-commerce',
  'agendar-ia',
  'exeq-ia',
] as const;

export type ProductoEspecificoId = (typeof PRODUCTOS_ESPECIFICOS)[number];
export type ProductoIntegralId = (typeof PRODUCTOS_INTEGRALES)[number];

/**
 * Único tipo admitido para referenciar un producto en todo el sistema.
 * Cualquier otro valor es un fallo de contrato, no un dato.
 */
export type ProductoId = ProductoEspecificoId | ProductoIntegralId;

export const PRODUCTOS: ReadonlyArray<ProductoId> = [
  ...PRODUCTOS_ESPECIFICOS,
  ...PRODUCTOS_INTEGRALES,
];

/** Verificación en tiempo de compilación: el portafolio tiene exactamente 13. */
type Longitud<T extends readonly unknown[]> = T['length'];
type _Especificas9 = Longitud<typeof PRODUCTOS_ESPECIFICOS> extends 9 ? true : never;
type _Integrales4 = Longitud<typeof PRODUCTOS_INTEGRALES> extends 4 ? true : never;
export type PortafolioCerrado = _Especificas9 & _Integrales4;

export type FamiliaProducto = 'especifica' | 'integral';

// ---------------------------------------------------------------------------
// Producto
// ---------------------------------------------------------------------------

export interface Producto {
  readonly id: ProductoId;
  /** Nombre comercial exacto. */
  readonly nombre: string;
  readonly familia: FamiliaProducto;
  /** Orden del copy aprobado: 1–9 específicas, 10–13 integrales. */
  readonly orden: number;
  /** Ancla para resolver el copy en content/copy/. NO contiene el texto. */
  readonly claveCopy: string;
  /**
   * Alias históricos. Único caso documentado: `faro-digital` ← "FARO Inteligente".
   * Un alias NUNCA es un producto aparte.
   */
  readonly aliasHistoricos: ReadonlyArray<string>;
  /** Despublicar oculta; nunca borra. Control de administración. */
  readonly publicado: boolean;
}

export interface ProductoDetalle extends Producto {
  readonly precios: ReadonlyArray<PrecioCatalogo>;
  readonly rubrosIds: ReadonlyArray<Id>;
  readonly calificadoresIds: ReadonlyArray<Id>;
}

// ---------------------------------------------------------------------------
// Precios
// ---------------------------------------------------------------------------

export type ModalidadPrecio = 'implementacion' | 'mensualidad' | 'unica_vez' | 'prueba';

/**
 * Estado documental de un precio. Se deriva de cómo lo expresa el copy aprobado.
 * `no_documentado` = el copy dice "Precio oficial no encontrado."
 */
export type EstadoPrecio =
  | 'documentado_exacto'
  | 'documentado_rango'
  | 'documentado_desde'
  | 'no_documentado';

export interface PrecioCatalogo {
  readonly id: Id;
  readonly productoId: ProductoId;
  readonly modalidad: ModalidadPrecio;
  /** Plan nombrado por el copy (Park.IA: Base/Control/Control Plus/Piloto Control). */
  readonly plan: string | null;
  readonly estado: EstadoPrecio;
  readonly moneda: Moneda;
  /** Unidad mínima entera. `null` cuando el precio no está documentado. */
  readonly montoDesde: number | null;
  /** Sólo en rangos. */
  readonly montoHasta: number | null;
  /**
   * `true` = IVA incluido · `false` = IVA excluido (`+ IVA` documentado)
   * `null` = **no documentado**. No se asume ningún régimen. Ver COMMERCIAL_RULES.md §3.
   */
  readonly ivaIncluido: boolean | null;
  /** Transcripción literal del copy. **Es lo que se muestra en pantalla.** */
  readonly textoDocumentado: string;
  /** Condición literal del copy (p. ej. tramo de repartidores en Ruta IA). */
  readonly condicion: string | null;
  readonly vigenteDesde: ISODate | null;
  readonly vigenteHasta: ISODate | null;
  readonly versionCatalogo: number;
}

// ---------------------------------------------------------------------------
// Taxonomía de rubros — derivada de "Dónde tiene más sentido"
// ---------------------------------------------------------------------------

/**
 * `rubro`       = sector de actividad (Farmacias, Ferreterías, Distribuidoras…)
 * `calificador` = condición que atraviesa rubros (Comercios con varias sucursales…)
 *
 * ⛔ No se agrega ningún término que no aparezca en el copy aprobado.
 */
export type ClaseTermino = 'rubro' | 'calificador';

export interface Rubro {
  readonly id: Id;
  /** Literal del copy aprobado. */
  readonly nombre: string;
  readonly clase: ClaseTermino;
  /** En qué productos aparece el término. */
  readonly fuente: ReadonlyArray<ProductoId>;
}

/** Relación N:N producto × término. Única base de la recomendación. Mapeo literal, sin pesos. */
export interface ProductoRubro {
  readonly productoId: ProductoId;
  readonly terminoId: Id;
  readonly clase: ClaseTermino;
}

export interface ResumenRubro {
  readonly rubro: Rubro;
  readonly cuentasPropias: number;
  readonly cuentasSinPropuesta: number;
  readonly productosRecomendados: ReadonlyArray<ProductoId>;
  readonly mensualidadesActivas: number;
  readonly potencialPorMoneda: ReadonlyArray<Dinero>;
}

export interface FiltroProductos {
  readonly familia?: FamiliaProducto;
  readonly rubroId?: Id;
  readonly soloPublicados?: boolean;
  readonly texto?: string;
}
