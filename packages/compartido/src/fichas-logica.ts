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

import type { Moneda } from './core';
import { textoDinero } from './core';
import type { ProductoId } from './catalogo';
import type {
  AvisoCopyDesactualizado, BloqueFicha, BloqueFichaId, EntradaPorNecesidad,
  EntradaPortafolio, FichaOficial, FichaPersonalizada, FichaPublica,
  IndicePortafolio, PersonalizacionBloque, PrecioPreparado,
} from './fichas';
import { MAXIMO_ACLARACION_PRECIO, ORDEN_CANONICO } from './fichas';

/**
 * Encabezado del copy → bloque de la ficha.
 *
 * ⛔ ESTÁN TODOS LOS QUE EL COPY USA, no sólo los más frecuentes. El copy
 *    aprobado titula la MISMA sección de varias maneras, y un encabezado que
 *    no esté acá se descarta **en silencio**: el bloque desaparece de la
 *    ficha y nadie se entera. Eso ya pasó, y costó caro:
 *
 *      · El precio se llama "Precio de referencia" en ocho productos, pero
 *        "Precio" en Smart Commerce y Exeq.IA, "Precio documentado" en
 *        Park.IA y "Precio de referencia documentado" en Agendar.IA y en
 *        Precio Vivo. Con sólo la primera forma mapeada, CINCO de los trece
 *        productos —las cuatro soluciones integrales y Precio Vivo— se
 *        servían al cliente SIN precio.
 *      · "En una frase" está en los trece y no estaba mapeada: se perdía en
 *        los trece.
 *      · "¿Qué mira?" es el "¿Qué hace?" de Precio Vivo.
 *      · "¿Qué necesita del negocio?" es el "¿Qué datos necesita?" de Cotiza
 *        Fácil.
 *      · "Propuesta de valor documentada" es lo que Precio Vivo muestra en
 *        lugar del eslogan, porque no tiene uno (COPY_LOCK.md).
 *
 *    `scripts/verificar-fichas.mjs` comprueba que no quede ni un encabezado
 *    del copy sin mapear. Si Lab.IA aprueba un copy con una sección nueva,
 *    la verificación falla y hay que decidir acá qué hacer con ella, en vez
 *    de que se caiga sola.
 *
 * `conservaTitulo` marca los encabezados que NO son una variante de forma
 * sino la voz propia de ese producto: ahí el cliente lee el encabezado tal
 * como lo escribió Lab.IA, no el título genérico.
 */
interface Encabezado {
  readonly id: BloqueFichaId;
  readonly conservaTitulo?: true;
}

const POR_ENCABEZADO: Readonly<Record<string, Encabezado>> = {
  'Slogan': { id: 'slogan' },
  'Propuesta de valor documentada': { id: 'propuestaDeValor', conservaTitulo: true },
  'Definición': { id: 'definicion' },
  '¿Qué datos necesita?': { id: 'datosQueNecesita' },
  '¿Qué necesita del negocio?': { id: 'datosQueNecesita', conservaTitulo: true },
  '¿Qué hace?': { id: 'queHace' },
  '¿Qué mira?': { id: 'queHace', conservaTitulo: true },
  'Ejemplo': { id: 'ejemplo' },
  'Beneficios': { id: 'beneficios' },
  '5 casos de uso': { id: 'casosDeUso' },
  'Dónde tiene más sentido': { id: 'dondeTieneMasSentido' },
  'Precio de referencia': { id: 'precioDeReferencia' },
  'Precio de referencia documentado': { id: 'precioDeReferencia' },
  'Precio documentado': { id: 'precioDeReferencia' },
  'Precio': { id: 'precioDeReferencia' },
  'En una frase': { id: 'enUnaFrase' },
};

/** Los encabezados que el copy usa, para que la verificación los compare. */
export const ENCABEZADOS_DEL_COPY: ReadonlyArray<string> = Object.keys(POR_ENCABEZADO);

const TITULOS: Readonly<Record<BloqueFichaId, string>> = {
  slogan: 'Slogan',
  propuestaDeValor: 'Propuesta de valor',
  definicion: 'Qué es',
  datosQueNecesita: '¿Qué datos necesita?',
  queHace: '¿Qué hace?',
  ejemplo: 'Ejemplo',
  beneficios: 'Beneficios',
  casosDeUso: 'Casos de uso',
  dondeTieneMasSentido: 'Dónde tiene más sentido',
  precioDeReferencia: 'Precio de referencia',
  enUnaFrase: 'En una frase',
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
  const encontrados = new Map<BloqueFichaId, { titulo: string; contenido: string }>();
  // ⛔ El orden de aparición, producto por producto. El copy no pone las
  //    secciones en el mismo lugar en los trece, y COPY_LOCK.md regla 2 pide
  //    "mismo orden de secciones".
  const enOrden: BloqueFichaId[] = [];

  const partes = bruto.split(/^### /m).slice(1);
  for (const parte of partes) {
    const corte = parte.indexOf('\n');
    const encabezado = (corte === -1 ? parte : parte.slice(0, corte)).trim();
    const entrada = POR_ENCABEZADO[encabezado];
    if (!entrada) continue;
    const contenido = (corte === -1 ? '' : parte.slice(corte + 1)).trim();
    if (contenido.length === 0) continue;
    if (!encontrados.has(entrada.id)) enOrden.push(entrada.id);
    encontrados.set(entrada.id, {
      titulo: entrada.conservaTitulo ? encabezado : TITULOS[entrada.id],
      contenido,
    });
  }

  // ⛔ PRECIO VIVO no tiene eslogan oficial: su sección "Slogan" dice, con
  //    todas las letras, que no lo hay. Mostrarle eso al cliente como titular
  //    sería peor que no mostrar nada. COPY_LOCK.md manda poner en su lugar
  //    la propuesta de valor documentada, que es justo el bloque de al lado.
  //    ⛔ No se inventa un eslogan: se corre el que Lab.IA ya escribió.
  if (encontrados.has('propuestaDeValor')) encontrados.delete('slogan');

  const presentes = enOrden
    .filter((id) => encontrados.has(id))
    .map((id): BloqueFicha => {
      const hallado = encontrados.get(id)!;
      return {
        id,
        titulo: hallado.titulo,
        contenido: hallado.contenido,
        presente: true,
        sensibleAlPrecio: SENSIBLES.has(id),
      };
    });

  // Los que este producto no tiene van al final, vacíos y marcados: nadie los
  // muestra, pero el inventario queda completo para quien lo recorra.
  const ausentes = ORDEN_CANONICO
    .filter((id) => !encontrados.has(id))
    .map((id): BloqueFicha => ({
      id,
      titulo: TITULOS[id],
      contenido: '',
      presente: false,
      sensibleAlPrecio: SENSIBLES.has(id),
    }));

  return [...presentes, ...ausentes];
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
 * Qué puede estar mal en el precio que escribió el vendedor.
 *
 * ⛔ Nada de esto es "el precio es muy bajo": eso no es un error de datos, es
 *    una decisión comercial, y la toma quien firma la cotización. Acá sólo se
 *    rechaza lo que no se puede mostrar.
 */
export type ErrorPrecioPreparado =
  | { readonly tipo: 'sin_importes' }
  | { readonly tipo: 'monto_negativo' }
  | { readonly tipo: 'monedas_mezcladas'; readonly monedas: ReadonlyArray<Moneda> }
  | { readonly tipo: 'aclaracion_larga'; readonly largo: number };

/** Las reglas del precio de la ficha, en un solo lugar. */
export function validarPrecioPreparado(precio: PrecioPreparado): ErrorPrecioPreparado | null {
  const importes = [precio.setup, precio.mensual].filter((d) => d !== null);
  if (importes.length === 0) return { tipo: 'sin_importes' };
  if (importes.some((d) => d.monto < 0)) return { tipo: 'monto_negativo' };

  const monedas = importes.map((d) => d.moneda);
  if (new Set(monedas).size > 1) return { tipo: 'monedas_mezcladas', monedas };

  const largo = (precio.aclaracion ?? '').trim().length;
  if (largo > MAXIMO_ACLARACION_PRECIO) return { tipo: 'aclaracion_larga', largo };
  return null;
}

/**
 * ⛔ La nota que acompaña SIEMPRE al bloque del precio, lo escriba el copy o
 *    lo escriba el vendedor. La ficha ayuda a entender y a decidir; el número
 *    que compromete a Lab.IA es el de la cotización, y ése lleva aprobación y
 *    firma. Que el cliente lo sepa desde la ficha evita el peor malentendido
 *    posible: creer que ya tiene una oferta cerrada.
 *
 * ⛔ NO se pega dentro del texto del bloque: la vista la dibuja aparte, como
 *    nota al pie. Así el copy aprobado se sigue sirviendo intacto, sin una
 *    línea agregada que no esté en `content/copy/`.
 */
export const NOTA_PRECIO_REFERENCIAL =
  'Valores de referencia. La propuesta formal, con el detalle y las formas de pago, se envía por separado.';

/**
 * El precio del vendedor, escrito como lo lee el cliente.
 *
 * ⛔ Sigue la forma del copy maestro —lista de renglones en negrita— para que
 *    la ficha se lea igual la ponga quien la ponga. El texto se arma acá y en
 *    ningún otro lado: la pantalla del vendedor, la del cliente y cualquier
 *    documento muestran exactamente la misma línea.
 */
export function textoPrecioPreparado(precio: PrecioPreparado): string {
  const renglones: string[] = [];
  if (precio.setup) renglones.push(`- **Implementación: ${textoDinero(precio.setup)}**`);
  if (precio.mensual) renglones.push(`- **Mensualidad: ${textoDinero(precio.mensual)}**`);

  const aclaracion = (precio.aclaracion ?? '').trim();
  if (aclaracion) renglones.push('', aclaracion);

  // ⛔ La nota de referencia NO va acá: la dibuja la vista, para el precio del
  //    copy y para el del vendedor por igual. Ver `NOTA_PRECIO_REFERENCIAL`.
  return renglones.join('\n');
}

/**
 * Completa la capa con los bloques que la ficha oficial tiene y la capa no.
 *
 * ⛔ POR QUÉ HACE FALTA: la capa se guarda con los bloques que existían el día
 *    que el vendedor la preparó. Si Lab.IA aprueba un copy con una sección
 *    nueva, esa sección no está en ninguna capa vieja y desaparecería de todas
 *    las fichas ya preparadas, sin que nadie se entere.
 *
 * ⛔ Y POR QUÉ EL BLOQUE NUEVO ENTRA VISIBLE, SALVO EL PRECIO: que el bloque no
 *    esté en la capa no significa que el vendedor lo haya ocultado —no existía
 *    cuando decidió—, así que se respeta el arranque normal, que es "todo a la
 *    vista". La única excepción es lo sensible al precio: eso no se muestra
 *    solo, lo decide el vendedor.
 */
export function conBloquesNuevos(
  ficha: FichaOficial, capa: ReadonlyArray<PersonalizacionBloque>,
): ReadonlyArray<PersonalizacionBloque> {
  const conocidos = new Set(capa.map((b) => b.bloqueId));
  const faltantes = ficha.bloques.filter((b) => b.presente && !conocidos.has(b.id));
  if (faltantes.length === 0) return capa;

  let orden = capa.reduce((mayor, b) => Math.max(mayor, b.orden), -1);
  return [
    ...capa,
    ...faltantes.map((b): PersonalizacionBloque => {
      orden += 1;
      return {
        bloqueId: b.id,
        visible: !b.sensibleAlPrecio,
        orden,
        destacado: false,
      };
    }),
  ];
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
  // ⛔ Primero se completa con lo que el copy tenga de nuevo: si no, una
  //    sección aprobada después de preparar la ficha no se vería nunca.
  const visibles = [...conBloquesNuevos(ficha, capa.bloques)]
    .filter((b) => b.visible)
    .sort((a, b) => a.orden - b.orden);

  const bloques = visibles.flatMap((p) => {
    const oficial = ficha.bloques.find((b) => b.id === p.bloqueId);
    if (!oficial || !oficial.presente) return [];

    // ⛔ ÚNICA sustitución admitida, y sólo en el bloque del precio: el copy
    //    publica rangos a propósito, y el vendedor que ya conoce al cliente
    //    puede poner SU importe. El resto del texto sale intacto del copy.
    //    Si el vendedor no puso precio, el cliente lee el del copy.
    const contenido = oficial.id === 'precioDeReferencia' && capa.precio
      ? textoPrecioPreparado(capa.precio)
      : oficial.contenido;

    // ⛔ Sólo título y contenido: `presente` y `sensibleAlPrecio` son internos.
    return [{ id: oficial.id, titulo: oficial.titulo, contenido }];
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

/**
 * Lo que va debajo del nombre en la tarjeta del portafolio.
 *
 * ⛔ Precio Vivo no tiene eslogan: en su lugar va su propuesta de valor
 *    documentada. Sin esto, la tarjeta decía "Sin eslogan oficial definido en
 *    la documentación revisada", que es una nota interna, no un mensaje para
 *    un cliente.
 */
function sloganDeTarjeta(ficha: FichaOficial): string {
  const vivo = (id: BloqueFichaId) =>
    ficha.bloques.find((b) => b.id === id && b.presente)?.contenido;
  return vivo('slogan') ?? vivo('propuestaDeValor') ?? '';
}

export function indiceDe(fichas: ReadonlyArray<FichaOficial>): IndicePortafolio {
  const entrada = (f: FichaOficial): EntradaPortafolio => ({
    productoId: f.productoId,
    nombreProducto: f.nombreProducto,
    logo: f.logo,
    slogan: sloganDeTarjeta(f),
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
        slogan: sloganDeTarjeta(e.ficha),
      })),
  };
}

