/**
 * El copy aprobado de los trece productos, leído de su documento fuente.
 *
 * ⛔ Este archivo NO contiene copy. Importa los dos documentos congelados de
 *    content/copy/ con `?raw` y los corta por producto. El texto vive en un
 *    solo lugar, verificado por content/copy/copy.sha256.
 *
 * ⛔ Los trece identificadores salen de `PRODUCTOS` (catalogo.ts). El nombre
 *    es el encabezado literal del documento: si alguien lo cambia ahí, el
 *    corte falla ruidosamente en vez de servir una ficha vacía.
 */

import type { ProductoId } from '@labia/compartido';
import { PRODUCTOS_ESPECIFICOS, PRODUCTOS_INTEGRALES } from '@labia/compartido';
import { seccionDeProducto, type CopyDeProducto } from './datos-fichas';

import copyEspecificas from '../../../content/copy/LabIA_9_Soluciones_Especificas_Copy_Maestro.md?raw';
import copyIntegrales from '../../../content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md?raw';

/** Identificador → encabezado exacto en el documento fuente. */
const NOMBRE_EN_EL_COPY: Readonly<Record<ProductoId, string>> = {
  'ojo-digital': 'Ojo Digital',
  'pulso-digital': 'Pulso Digital',
  'vendedor-24-7': 'Vendedor 24/7',
  'radar-stock': 'Radar Stock',
  'faro-digital': 'Faro Digital',
  'merma-ia': 'Merma IA',
  'cotiza-facil': 'Cotiza Fácil',
  'precio-vivo': 'Precio Vivo',
  'ruta-ia': 'Ruta IA',
  'park-ia': 'Park.IA',
  'smart-commerce': 'Smart Commerce',
  'agendar-ia': 'Agendar.IA',
  'exeq-ia': 'Exeq.IA',
};

/** ⛔ El logo es el activo incorporado, no uno generado. Ver INVENTARIO_ACTIVOS §3. */
export function logoDe(productoId: ProductoId): string {
  return `/assets/productos/${productoId}/logo-${productoId}.webp`;
}

function copyDe(productoId: ProductoId, familia: 'especifica' | 'integral'): CopyDeProducto {
  const nombreProducto = NOMBRE_EN_EL_COPY[productoId];
  const documento = familia === 'especifica' ? copyEspecificas : copyIntegrales;
  const bruto = seccionDeProducto(documento, nombreProducto);
  if (bruto === null) {
    // El copy es fuente maestra: si el encabezado no está, es un fallo de
    // contrato, no un dato faltante. Callarlo serviría una ficha en blanco.
    throw new Error(`El copy aprobado no tiene la sección "${nombreProducto}".`);
  }
  return { productoId, nombreProducto, familia, bruto };
}

export const COPY_DE_LOS_TRECE: ReadonlyArray<CopyDeProducto> = [
  ...PRODUCTOS_ESPECIFICOS.map((id) => copyDe(id, 'especifica')),
  ...PRODUCTOS_INTEGRALES.map((id) => copyDe(id, 'integral')),
];
