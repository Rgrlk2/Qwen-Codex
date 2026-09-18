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
 *      para ese prospecto: muestra, oculta, mueve y destaca bloques, y
 *      agrega "Lo que conversamos" y una nota propia.
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
 * Por eso `PersonalizacionFicha` no tiene ningún campo donde escribir el
 * contenido de un bloque: sólo puede decidir si se ve, dónde va y si se
 * destaca. El texto sale siempre de `content/copy/`, congelado por hash.
 *
 * Ver MASTER_SPEC.md §2.3, USER_FLOWS.md F4b a F4d, DATA_MODEL.md §7b.
 */

import type { Id, ISODate, Trazado } from './core';
import type { ProductoId } from './catalogo';
import type { Necesidad } from './motor';

// ===========================================================================
// A · La ficha oficial — fuente maestra, sólo lectura
// ===========================================================================

/**
 * Los bloques de una ficha. ⛔ Son exactamente las secciones del copy maestro
 * aprobado: no se inventa ninguno y no se renombra ninguno.
 *
 * `datosQueNecesita` existe **sólo en Merma IA**, tal como lo documenta
 * `content/copy/COPY_LOCK.md`. En los demás productos no aparece, y ⛔ no se
 * agrega para emparejar.
 */
export type BloqueFichaId =
  | 'slogan'
  | 'definicion'
  | 'datosQueNecesita'
  | 'queHace'
  | 'ejemplo'
  | 'beneficios'
  | 'casosDeUso'
  | 'dondeTieneMasSentido'
  | 'precioDeReferencia';

/** Orden canónico, el del documento fuente. El vendedor puede alterarlo en su capa. */
export const ORDEN_CANONICO: ReadonlyArray<BloqueFichaId> = [
  'slogan',
  'definicion',
  'datosQueNecesita',
  'queHace',
  'ejemplo',
  'beneficios',
  'casosDeUso',
  'dondeTieneMasSentido',
  'precioDeReferencia',
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
