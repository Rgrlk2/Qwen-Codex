/**
 * Las fichas de producto: del copy aprobado a la ficha que ve el cliente.
 *
 * ⛔ El contenido NO se escribe acá. Se lee del copy aprobado y congelado que
 *    vive en `content/copy/`, y se corta en bloques por sus encabezados. Eso
 *    es lo que hace cierta la regla "la ficha oficial es fuente maestra": no
 *    hay una segunda copia del texto que pueda derivar.
 *
 * ⛔ La personalización es una CAPA ENCIMA. Guarda visible, orden y destacado
 *    por bloque, más los dos textos del vendedor. Nunca toca el copy.
 *
 * Ver packages/compartido/src/fichas.ts y docs/MASTER_SPEC.md §2.3.
 */

import type { ProductoId } from './catalogo';
import type {
  AvisoCopyDesactualizado, BloqueFicha, BloqueFichaId, EntradaPorNecesidad,
  EntradaPortafolio, FichaOficial, FichaPersonalizada, FichaPublica,
  IndicePortafolio, PersonalizacionBloque,
} from './fichas';
import { ORDEN_CANONICO } from './fichas';

/**
 * Encabezado del copy → bloque de la ficha.
 * ⛔ Los nombres salen del documento fuente, no se inventan.
 */
const POR_ENCABEZADO: Readonly<Record<string, BloqueFichaId>> = {
  'Slogan': 'slogan',
  'Definición': 'definicion',
  '¿Qué datos necesita?': 'datosQueNecesita',
  '¿Qué hace?': 'queHace',
  'Ejemplo': 'ejemplo',
  'Beneficios': 'beneficios',
  '5 casos de uso': 'casosDeUso',
  'Dónde tiene más sentido': 'dondeTieneMasSentido',
  'Precio de referencia': 'precioDeReferencia',
};

const TITULOS: Readonly<Record<BloqueFichaId, string>> = {
  slogan: 'Slogan',
  definicion: 'Qué es',
  datosQueNecesita: '¿Qué datos necesita?',
  queHace: '¿Qué hace?',
  ejemplo: 'Ejemplo',
  beneficios: 'Beneficios',
  casosDeUso: 'Casos de uso',
  dondeTieneMasSentido: 'Dónde tiene más sentido',
  precioDeReferencia: 'Precio de referencia',
};

/** ⛔ El cliente no debería ver el precio sin que el vendedor lo decida. */
const SENSIBLES: ReadonlySet<BloqueFichaId> = new Set(['precioDeReferencia']);

export interface CopyDeProducto {
  readonly productoId: ProductoId;
  readonly nombreProducto: string;
  readonly familia: 'especifica' | 'integral';
  /** Texto crudo del producto dentro del documento fuente. */
  readonly bruto: string;
}

/**
 * Corta el copy de un producto en bloques.
 *
 * ⛔ Un bloque que el producto no tiene queda `presente: false` y sin
 *    contenido. No se rellena con texto de otro producto para emparejar:
 *    `datosQueNecesita` existe sólo en Merma IA (COPY_LOCK.md).
 */
export function bloquesDelCopy(bruto: string): ReadonlyArray<BloqueFicha> {
  const encontrados = new Map<BloqueFichaId, string>();
  const partes = bruto.split(/^### /m).slice(1);
  for (const parte of partes) {
    const corte = parte.indexOf('\n');
    const encabezado = (corte === -1 ? parte : parte.slice(0, corte)).trim();
    const id = POR_ENCABEZADO[encabezado];
    if (!id) continue;
    encontrados.set(id, (corte === -1 ? '' : parte.slice(corte + 1)).trim());
  }
  return ORDEN_CANONICO.map((id) => {
    const contenido = encontrados.get(id);
    return {
      id,
      titulo: TITULOS[id],
      contenido: contenido ?? '',
      presente: contenido !== undefined && contenido.length > 0,
      sensibleAlPrecio: SENSIBLES.has(id),
    };
  });
}

/**
 * Recorta del documento maestro la sección de un producto.
 *
 * Los documentos numeran los productos con `# N. Nombre`; la sección de uno
 * llega hasta el siguiente encabezado de ese nivel. Se compara sin tildes ni
 * mayúsculas porque el mismo producto aparece como "Cotiza Fácil" y como
 * "COTIZA Facil" según el archivo.
 *
 * Devuelve `null` si no está: quien llama decide si eso es un dato faltante o
 * un fallo de contrato.
 */
export function seccionDeProducto(documento: string, nombreProducto: string): string | null {
  const normalizar = (t: string) =>
    t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const objetivo = normalizar(nombreProducto);
  const lineas = documento.split('\n');
  let inicio = -1;
  let fin = lineas.length;
  for (let i = 0; i < lineas.length; i += 1) {
    const encabezado = /^#\s+\d+\.\s*(.+?)\s*$/.exec(lineas[i] ?? '');
    if (!encabezado) continue;
    if (inicio === -1) {
      if (normalizar(encabezado[1] ?? '') === objetivo) inicio = i + 1;
    } else {
      fin = i;
      break;
    }
  }
  if (inicio === -1) return null;
  return lineas.slice(inicio, fin).join('\n').trim();
}

/**
 * Huella del copy: identifica la versión del texto servido.
 *
 * ⛔ Se calcula del contenido. Si el copy cambia, la huella cambia sola y el
 *    aviso al vendedor aparece sin que nadie se acuerde de actualizar nada.
 * ⛔ Vive acá, una sola vez. La capa autenticada y la pública tienen que dar
 *    la MISMA huella para el mismo texto: si cada una calculara la suya, el
 *    día que difieran el Escritorio avisaría de un cambio que no existió.
 */
export function huellaDelCopy(bruto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bruto.length; i += 1) {
    h ^= bruto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function fichaOficialDe(
  copy: CopyDeProducto, logo: string, huellaCopy: string, versionCatalogo: number,
): FichaOficial {
  return {
    productoId: copy.productoId,
    nombreProducto: copy.nombreProducto,
    familia: copy.familia,
    bloques: bloquesDelCopy(copy.bruto),
    logo,
    huellaCopy,
    versionCatalogo,
  };
}

// ---------------------------------------------------------------------------
// La capa de personalización
// ---------------------------------------------------------------------------

/** ⛔ Máximo dos destacados: si todo resalta, nada resalta (DATA_MODEL §7b.3). */
export const MAXIMO_DESTACADOS = 2;

/**
 * Punto de partida al preparar una ficha para un prospecto: todo lo que el
 * producto tiene, visible, en el orden del documento fuente, sin destacados.
 */
export function personalizacionInicial(ficha: FichaOficial): ReadonlyArray<PersonalizacionBloque> {
  return ficha.bloques
    .filter((b) => b.presente)
    .map((b, i) => ({ bloqueId: b.id, visible: true, orden: i, destacado: false }));
}

export type ErrorPersonalizacion =
  | { readonly tipo: 'demasiados_destacados'; readonly cuantos: number }
  | { readonly tipo: 'orden_repetido'; readonly orden: number }
  | { readonly tipo: 'bloque_ausente'; readonly bloqueId: BloqueFichaId }
  | { readonly tipo: 'sin_bloques_visibles' };

/** Las reglas de DATA_MODEL §7b.3, en un solo lugar. */
export function validarPersonalizacion(
  ficha: FichaOficial, bloques: ReadonlyArray<PersonalizacionBloque>,
): ErrorPersonalizacion | null {
  const destacados = bloques.filter((b) => b.destacado && b.visible).length;
  if (destacados > MAXIMO_DESTACADOS) return { tipo: 'demasiados_destacados', cuantos: destacados };

  const ordenes = new Set<number>();
  for (const b of bloques) {
    if (ordenes.has(b.orden)) return { tipo: 'orden_repetido', orden: b.orden };
    ordenes.add(b.orden);
    const enLaFicha = ficha.bloques.find((x) => x.id === b.bloqueId);
    if (!enLaFicha || !enLaFicha.presente) return { tipo: 'bloque_ausente', bloqueId: b.bloqueId };
  }
  if (!bloques.some((b) => b.visible)) return { tipo: 'sin_bloques_visibles' };
  return null;
}

/**
 * Arma lo que ve el cliente.
 *
 * ⛔ Acá se hace cumplir la superficie mínima: se toma el contenido de la
 *    ficha OFICIAL —nunca de la capa—, se filtran los bloques ocultos y no se
 *    copia ni un dato operativo del vendedor.
 */
export function fichaPublicaDe(
  ficha: FichaOficial, capa: FichaPersonalizada, nombreVendedor: string,
): FichaPublica {
  const visibles = [...capa.bloques]
    .filter((b) => b.visible)
    .sort((a, b) => a.orden - b.orden);

  const bloques = visibles.flatMap((p) => {
    const oficial = ficha.bloques.find((b) => b.id === p.bloqueId);
    if (!oficial || !oficial.presente) return [];
    // ⛔ Sólo título y contenido: `presente` y `sensibleAlPrecio` son internos.
    return [{ id: oficial.id, titulo: oficial.titulo, contenido: oficial.contenido }];
  });

  return {
    nombreProducto: ficha.nombreProducto,
    logo: ficha.logo,
    bloques,
    destacados: visibles.filter((b) => b.destacado).map((b) => b.bloqueId),
    loQueConversamos: capa.loQueConversamos,
    notaDelVendedor: capa.notaDelVendedor,
    nombreVendedor,
    llamadoALaAccion: 'Hablemos',
  };
}

/** ⛔ El enlace sirve el copy vigente. Esto avisa al vendedor, no al cliente. */
export function revisarCopy(
  ficha: FichaOficial, capa: FichaPersonalizada,
): AvisoCopyDesactualizado | null {
  if (capa.huellaCopy === ficha.huellaCopy) return null;
  return {
    huellaGuardada: capa.huellaCopy,
    huellaVigente: ficha.huellaCopy,
    bloquesAfectados: capa.bloques.filter((b) => b.visible).map((b) => b.bloqueId),
    seSirveElVigente: true,
  };
}

// ---------------------------------------------------------------------------
// El portafolio
// ---------------------------------------------------------------------------

export function indiceDe(fichas: ReadonlyArray<FichaOficial>): IndicePortafolio {
  const entrada = (f: FichaOficial): EntradaPortafolio => ({
    productoId: f.productoId,
    nombreProducto: f.nombreProducto,
    logo: f.logo,
    slogan: f.bloques.find((b) => b.id === 'slogan')?.contenido ?? '',
  });
  return {
    especificas: fichas.filter((f) => f.familia === 'especifica').map(entrada),
    integrales: fichas.filter((f) => f.familia === 'integral').map(entrada),
  };
}

/** ⛔ Sólo `directo` y `cercano`, y en ese orden (MASTER_SPEC §2.2). */
export function porNecesidad(
  necesidadId: string, enunciado: string,
  encajes: ReadonlyArray<{ readonly ficha: FichaOficial; readonly encaje: string }>,
): EntradaPorNecesidad {
  const peso = (e: string) => (e === 'directo' ? 0 : e === 'cercano' ? 1 : 99);
  return {
    necesidadId,
    enunciado,
    fichas: encajes
      .filter((e) => peso(e.encaje) < 2)
      .sort((a, b) => peso(a.encaje) - peso(b.encaje))
      .map((e) => ({
        productoId: e.ficha.productoId,
        nombreProducto: e.ficha.nombreProducto,
        logo: e.ficha.logo,
        slogan: e.ficha.bloques.find((b) => b.id === 'slogan')?.contenido ?? '',
      })),
  };
}

