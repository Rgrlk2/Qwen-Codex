/**
 * Fichas de producto — la pieza central de la experiencia comercial.
 *
 * Una ficha NO es una página informativa suelta. Es el eslabón que une el
 * motor con la propuesta:
 *
 *   Planificar → Cliente → Producto recomendado → FICHA → Presentación
 *   → Cotización → Seguimiento
 *
 * Tiene cuatro caras:
 *
 *   A) Para el VENDEDOR — parte de la ficha oficial y prepara una versión
 *      para ese prospecto: muestra, oculta, mueve y destaca bloques, agrega
 *      "Lo que conversamos" y una nota propia, y escribe el precio
 *      REFERENCIAL para ese cliente (ver `PrecioPreparado`).
 *   B) Para el CLIENTE — recibe un enlace limpio y responsive. ⛔ No entra al
 *      Escritorio ni ve información operativa del vendedor.
 *   C) Para la PROPUESTA — ⛔ la ficha **no reemplaza la cotización**. Ayuda a
 *      entender y elegir; después vienen la presentación y la cotización
 *      formal, que sí pasa por aprobación.
 *   D) Como PORTAFOLIO — el índice "Soluciones Lab.IA", con las específicas y
 *      las integrales, navegable por producto **o por necesidad**.
 *
 * ⛔ LA REGLA QUE SOSTIENE TODO:
 *
 *   La ficha oficial queda INTACTA como fuente maestra. La personalización es
 *   una CAPA ENCIMA. Nunca modifica el copy aprobado.
 *
 * Por eso la capa no tiene ningún campo donde escribir el contenido de un
 * bloque: sólo puede decidir si se ve, dónde va y si se destaca. El texto sale
 * siempre de `content/copy/`, congelado por hash.
 *
 * La única excepción, y es una excepción declarada: el PRECIO. El copy publica
 * rangos a propósito —"según plan", "según cantidad de usuarios"—, así que el
 * vendedor puede poner el importe de ese prospecto. Y aun así no escribe
 * texto: pone dos números tipados y una aclaración suya. Ver `PrecioPreparado`.
 *
 * Ver MASTER_SPEC.md §2.3, USER_FLOWS.md F4b a F4d, DATA_MODEL.md §7b.
 */

import type { Dinero, Id, ISODate, Trazado } from './core';
import type { ProductoId } from './catalogo';
import type { Necesidad } from './motor';

// ===========================================================================
// A · La ficha oficial — fuente maestra, sólo lectura
// ===========================================================================

/**
 * Los bloques de una ficha. ⛔ Son exactamente las secciones del copy maestro
 * aprobado: no se inventa ninguno y no se renombra ninguno.
 *
 * ⛔ Un producto no los tiene todos, y **no se rellenan para emparejar**.
 *
 * Dos aclaraciones que salen del copy, no de una preferencia:
 *  - `datosQueNecesita`: en Merma IA se titula "¿Qué datos necesita?" y en
 *    Cotiza Fácil "¿Qué necesita del negocio?". Son la misma sección con dos
 *    nombres aprobados; cada ficha conserva EL SUYO. En los otros once no
 *    existe, y no se inventa (COPY_LOCK.md).
 *  - `propuestaDeValor`: existe sólo en Precio Vivo, que ⛔ no tiene eslogan
 *    oficial. Ahí ocupa el lugar del eslogan. No se inventa uno.
 */
export type BloqueFichaId =
  | 'slogan'
  | 'propuestaDeValor'
  | 'definicion'
  | 'datosQueNecesita'
  | 'queHace'
  | 'ejemplo'
  | 'beneficios'
  | 'casosDeUso'
  | 'dondeTieneMasSentido'
  | 'precioDeReferencia'
  | 'enUnaFrase';

/**
 * Inventario de bloques y orden de referencia.
 *
 * ⛔ NO es el que manda: el orden REAL de cada ficha es el del documento
 *    fuente, producto por producto, porque el copy aprobado no coloca las
 *    secciones en el mismo lugar en los trece (Cotiza Fácil pone "¿Qué
 *    necesita del negocio?" DESPUÉS de "¿Qué hace?", y Merma IA la pone
 *    antes). COPY_LOCK.md regla 2: "mismo orden de secciones".
 *
 * Esta lista sirve para dos cosas: saber qué bloques existen, y ubicar los
 * que un producto NO tiene. El vendedor puede alterar el orden en su capa.
 */
export const ORDEN_CANONICO: ReadonlyArray<BloqueFichaId> = [
  'slogan',
  'propuestaDeValor',
  'definicion',
  'datosQueNecesita',
  'queHace',
  'ejemplo',
  'beneficios',
  'casosDeUso',
  'dondeTieneMasSentido',
  'precioDeReferencia',
  'enUnaFrase',
];

/**
 * Un bloque de la ficha oficial.
 *
 * ⛔ `contenido` viene del copy aprobado, servido tal cual. No hay ningún
 *    método que lo escriba: ver la ausencia deliberada en api.ts.
 */
export interface BloqueFicha {
  readonly id: BloqueFichaId;
  readonly titulo: string;
  /** Copy aprobado, literal. ⛔ Nunca reescrito, nunca resumido. */
  readonly contenido: string;
  /** `false` en los bloques que ese producto no tiene (p. ej. `datosQueNecesita`). */
  readonly presente: boolean;
  /** ⛔ El cliente no debería ver este bloque sin que el vendedor lo decida. */
  readonly sensibleAlPrecio: boolean;
}

/**
 * La ficha oficial de un producto. **Inmutable.**
 *
 * ⛔ Se genera a partir del copy congelado y de la plantilla visual oficial.
 *    No se edita desde ninguna vista, ni la del vendedor ni la del CEO.
 */
export interface FichaOficial {
  readonly productoId: ProductoId;
  readonly nombreProducto: string;
  readonly familia: 'especifica' | 'integral';
  readonly bloques: ReadonlyArray<BloqueFicha>;
  /** Logo oficial del producto. Ver INVENTARIO_ACTIVOS.md §3. */
  readonly logo: string;
  /** Huella del copy con el que se generó. Cambia el copy, cambia la huella. */
  readonly huellaCopy: string;
  readonly versionCatalogo: number;
}

// ===========================================================================
// B · La capa de personalización — del vendedor, para un prospecto
// ===========================================================================

/**
 * Qué hace el vendedor con un bloque.
 *
 * ⛔ Notar lo que NO está: no hay `contenido`, ni `titulo`, ni `textoAlternativo`.
 *    La capa decide **presentación**, nunca contenido. Es la regla "la ficha
 *    oficial queda intacta", hecha imposible de romper por construcción.
 */
/**
 * El precio que el vendedor escribe en la ficha para ESTE prospecto.
 *
 * ⛔ POR QUÉ EXISTE: el precio de la ficha es REFERENCIAL. El copy maestro
 *    publica rangos ("Gs. 270.000 a Gs. 960.000 por mes, según plan") porque
 *    el valor real depende de usuarios, sucursales, canales e integraciones.
 *    Después de la reunión el vendedor ya sabe el tamaño del cliente, y
 *    mandarle un rango cuando puede mandarle SU número es mandarle menos.
 *
 * ⛔ LO QUE ESTO NO ES: no es la cotización. La ficha no compromete a nadie;
 *    la cotización sí, y ésa pasa por la aprobación del CEO antes de salir.
 *    Por eso acá no hay alternativas de pago, ni calendario, ni firma.
 *
 * ⛔ POR QUÉ ES ESTRUCTURADO Y NO TEXTO LIBRE: la regla "la capa nunca escribe
 *    el contenido de un bloque" se sostiene. Esto son dos importes y una
 *    aclaración del vendedor con su propia voz —como `loQueConversamos`—, no
 *    un campo donde reescribir el copy aprobado. El texto que lee el cliente
 *    lo arma `textoPrecioPreparado()`, en un solo lugar y siempre igual.
 */
export interface PrecioPreparado {
  /** Implementación / setup. `null` cuando este producto no cobra setup. */
  readonly setup: Dinero | null;
  /** Mensualidad. `null` cuando el producto se cobra una sola vez. */
  readonly mensual: Dinero | null;
  /**
   * La letra chica del vendedor: "incluye 3 sucursales", "hasta 5 usuarios".
   * ⛔ Es la voz del vendedor, no la de Lab.IA: se muestra separada.
   */
  readonly aclaracion: string | null;
}

/** ⛔ Una aclaración es una línea, no un contrato. */
export const MAXIMO_ACLARACION_PRECIO = 240;

export interface PersonalizacionBloque {
  readonly bloqueId: BloqueFichaId;
  readonly visible: boolean;
  /** Posición dentro de la ficha personalizada. */
  readonly orden: number;
  /** Se muestra con más peso visual. A lo sumo dos por ficha. */
  readonly destacado: boolean;
}

/**
 * La ficha preparada para un prospecto concreto.
 *
 * Es una **capa encima** de `FichaOficial`: guarda decisiones de presentación
 * y dos textos propios del vendedor. El contenido sigue saliendo del copy.
 */
export interface FichaPersonalizada extends Trazado {
  readonly id: Id;
  readonly productoId: ProductoId;
  readonly clienteId: Id;
  readonly vendedorId: Id;
  /** Plan del motor que recomendó este producto. De ahí salen los dolores. */
  readonly planId: Id | null;

  readonly bloques: ReadonlyArray<PersonalizacionBloque>;

  /**
   * "Lo que conversamos": lo que el vendedor escuchó en la reunión, con sus
   * palabras. ⛔ Va claramente separado del copy oficial, para que el cliente
   * distinga qué dice Lab.IA y qué dice su vendedor.
   */
  readonly loQueConversamos: string | null;
  /** Nota del vendedor, en el cierre. Misma separación visual. */
  readonly notaDelVendedor: string | null;

  /**
   * El precio referencial que puso el vendedor para este prospecto.
   *
   * `null` ⇒ el cliente ve el precio del copy maestro, tal cual está aprobado.
   * ⛔ Se muestra sólo si además el bloque `precioDeReferencia` está visible:
   *    poner un precio no es decidir mostrarlo.
   */
  readonly precio: PrecioPreparado | null;

  /** Huella del copy vigente al preparar. Si cambia, se avisa antes de compartir. */
  readonly huellaCopy: string;
  readonly version: number;
}

/** Lo que el vendedor manda al preparar o actualizar. */
export interface NuevaFichaPersonalizada {
  readonly productoId: ProductoId;
  readonly clienteId: Id;
  readonly planId?: Id;
  readonly bloques: ReadonlyArray<PersonalizacionBloque>;
  readonly loQueConversamos?: string;
  readonly notaDelVendedor?: string;
  /** Omitido ⇒ el cliente ve el precio del copy. Ver `PrecioPreparado`. */
  readonly precio?: PrecioPreparado;
}

// ===========================================================================
// C · Lo que ve el cliente
// ===========================================================================

/**
 * La ficha tal como llega al cliente por el enlace.
 *
 * ⛔ Superficie mínima. Sin navegación al Escritorio, sin otros clientes, sin
 *    datos operativos del vendedor: nada de comisiones, de plan interno, de
 *    ranking de productos ni de por qué se eligió éste.
 * ⛔ Nunca revela cuántas veces se abrió.
 */
export interface FichaPublica {
  readonly nombreProducto: string;
  readonly logo: string;
  /** Sólo los bloques visibles, ya ordenados. */
  readonly bloques: ReadonlyArray<Omit<BloqueFicha, 'presente' | 'sensibleAlPrecio'>>;
  readonly destacados: ReadonlyArray<BloqueFichaId>;
  readonly loQueConversamos: string | null;
  readonly notaDelVendedor: string | null;
  /** Nombre de pila del vendedor, para que el cliente sepa con quién habla. */
  readonly nombreVendedor: string;
  /** ⛔ Única acción disponible. No hay formulario de datos ni pasarela. */
  readonly llamadoALaAccion: 'Hablemos';
}

export const TEXTO_LLAMADO_A_LA_ACCION = 'Hablemos';

// ===========================================================================
// D · El portafolio público — índice "Soluciones Lab.IA"
// ===========================================================================

/**
 * El índice de las trece.
 *
 * ⛔ Nueve específicas y cuatro integrales. Portafolio cerrado: el índice no
 *    puede mostrar un producto que no esté en el catálogo.
 */
export interface IndicePortafolio {
  readonly especificas: ReadonlyArray<EntradaPortafolio>;
  readonly integrales: ReadonlyArray<EntradaPortafolio>;
}

export interface EntradaPortafolio {
  readonly productoId: ProductoId;
  readonly nombreProducto: string;
  readonly logo: string;
  readonly slogan: string;
}

/**
 * Navegación por dolor, no por nombre de producto.
 *
 * El cliente muchas veces no sabe qué producto quiere: sabe qué le duele.
 * Esto entra por la necesidad y sale con las fichas que la resuelven, usando
 * la misma taxonomía del motor.
 */
export interface EntradaPorNecesidad {
  readonly necesidadId: Necesidad['id'];
  readonly enunciado: string;
  /** ⛔ Sólo `directo` y `cercano`, y en ese orden (MASTER_SPEC §2.2). */
  readonly fichas: ReadonlyArray<EntradaPortafolio>;
}

// ===========================================================================
// Enlace y aperturas
// ===========================================================================

export interface OpcionesEnlaceFicha {
  readonly venceEn: ISODate;
  readonly topeAperturas?: number;
}

/** El aviso cuando el copy cambió después de preparar la ficha. */
export interface AvisoCopyDesactualizado {
  readonly huellaGuardada: string;
  readonly huellaVigente: string;
  readonly bloquesAfectados: ReadonlyArray<BloqueFichaId>;
  /**
   * ⛔ El enlace sirve el copy VIGENTE, nunca una copia vieja. Esto avisa al
   *    vendedor de que lo que va a ver el cliente cambió desde que él lo armó.
   */
  readonly seSirveElVigente: true;
}
