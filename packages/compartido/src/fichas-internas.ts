/**
 * La ficha INTERNA de un producto: la que lee el vendedor, no el cliente.
 *
 * La ficha oficial le explica al cliente QUÉ ES el producto. Ésta le explica
 * al vendedor CÓMO VENDERLO: a quién le sirve, qué señales indican que le
 * sirve, qué preguntar para descubrirlo, con qué se combina y dónde NO
 * ofrecerlo.
 *
 * ⛔ LA REGLA QUE SOSTIENE TODO ESTE ARCHIVO: **no se inventa ni un
 *    argumento, ni una objeción, ni una pregunta.** Cada texto que sale de
 *    acá está escrito en la taxonomía —que Administración edita— o en el copy
 *    aprobado. Por eso este módulo no tiene ni una cadena de texto comercial
 *    adentro: sólo arma, ordena y relaciona lo que ya existe.
 *
 *    Un vendedor que repite un argumento inventado por el sistema lo dice con
 *    la misma cara con la que dice uno aprobado, y el cliente no puede
 *    distinguirlos. De ahí la regla.
 *
 * ⛔ Y SI NO HAY NADA CARGADO, SE DICE. No se rellena con el copy comercial
 *    disfrazado de conocimiento de venta: `sinTaxonomia` queda en `true` y la
 *    pantalla manda al vendedor a pedirle a Administración que lo cargue.
 *
 * Ver MASTER_SPEC.md §2.4 y la descripción funcional, punto 6.
 */

import type { Id } from './core';
import type { ProductoId } from './catalogo';
import type {
  Encaje, Necesidad, Operacion, Probabilidad,
  RelacionNecesidadProducto, RelacionOperacionNecesidad,
} from './motor';
import type { FichaOficial } from './fichas';

/** Un dolor que este producto atiende, con el argumento documentado. */
export interface DolorQueAtiende {
  readonly necesidadId: Id;
  readonly nombre: string;
  readonly descripcion: string;
  readonly encaje: Encaje;
  /** ⛔ El argumento aprobado. No se reescribe ni se "mejora". */
  readonly argumento: string;
  /** Por qué la taxonomía relacionó este dolor con este producto. */
  readonly motivo: string;
  /** Qué hay que adaptar, cuando el encaje no es directo. */
  readonly adaptacionRequerida: string | null;
}

/**
 * Una señal: "si el negocio hace ESTO, es probable que le duela AQUELLO".
 *
 * Sale de la cadena de la taxonomía: operación → necesidad → producto. Es el
 * mismo camino que usa el motor para recomendar, leído al revés.
 */
export interface SenalDeOportunidad {
  readonly operacionId: Id;
  /** Lo que el negocio hace: "cobra con tarjeta", "maneja depósito". */
  readonly operacion: string;
  readonly necesidadId: Id;
  /** Lo que probablemente le duele. */
  readonly dolor: string;
  readonly probabilidad: Probabilidad;
  readonly motivo: string;
}

/** Una pregunta para descubrir el problema. ⛔ Escrita en la taxonomía. */
export interface PreguntaParaDescubrir {
  readonly texto: string;
  /** Qué queda confirmado o descartado según cómo conteste. */
  readonly queValida: string;
  readonly origen: 'operacion' | 'necesidad';
}

/** Otro producto que suele ir con éste, y por qué. */
export interface ProductoComplementario {
  readonly productoId: ProductoId;
  readonly nombreProducto: string;
  /** La operación del negocio que los pone juntos. */
  readonly porLaOperacion: string;
  /** El otro dolor, el que cubre el complementario y éste no. */
  readonly cubreElDolor: string;
  readonly encaje: Encaje;
}

/** Dónde ESTE producto no va. ⛔ Saberlo vale tanto como saber dónde sí. */
export interface DondeNoOfrecerlo {
  readonly necesidadId: Id;
  readonly dolor: string;
  readonly motivo: string;
}

export interface FichaInterna {
  readonly productoId: ProductoId;
  readonly nombreProducto: string;
  readonly familia: 'especifica' | 'integral';
  readonly logo: string;

  readonly queResuelve: ReadonlyArray<DolorQueAtiende>;
  readonly senales: ReadonlyArray<SenalDeOportunidad>;
  readonly preguntas: ReadonlyArray<PreguntaParaDescubrir>;
  readonly complementarios: ReadonlyArray<ProductoComplementario>;
  readonly noOfrecerlo: ReadonlyArray<DondeNoOfrecerlo>;

  /**
   * Qué mirar en la visita: las operaciones del negocio que llevan a los
   * dolores de este producto. ⛔ Es lo que hay que OBSERVAR, no lo que hay
   * que decir.
   */
  readonly queObservar: ReadonlyArray<string>;

  /** El precio de referencia del copy, para tenerlo a mano. Puede faltar. */
  readonly precioDeReferencia: string | null;

  /**
   * ⛔ `true` cuando la taxonomía no tiene NADA cargado para este producto.
   *    La pantalla lo dice y manda a Administración. No se rellena.
   */
  readonly sinTaxonomia: boolean;
}

/** Lo que hace falta para armar una ficha interna. Todo ya existe. */
export interface FuentesFichaInterna {
  readonly operaciones: ReadonlyArray<Operacion>;
  readonly necesidades: ReadonlyArray<Necesidad>;
  readonly relacionesOperacionNecesidad: ReadonlyArray<RelacionOperacionNecesidad>;
  readonly relacionesNecesidadProducto: ReadonlyArray<RelacionNecesidadProducto>;
  readonly nombresDeProducto: ReadonlyMap<ProductoId, string>;
}

/** Los encajes que se ofrecen. `adaptable` se muestra aparte; el resto, no. */
const SE_OFRECE: ReadonlySet<Encaje> = new Set<Encaje>(['directo', 'cercano', 'adaptable']);

/** Primero lo directo, después lo cercano, al final lo adaptable. */
const PESO_ENCAJE: Readonly<Record<Encaje, number>> = {
  directo: 0, cercano: 1, adaptable: 2, no_recomendado: 3,
};

/** Lo típico antes que lo frecuente, y eso antes que lo ocasional. */
const PESO_PROBABILIDAD: Readonly<Record<Probabilidad, number>> = {
  tipica: 0, frecuente: 1, ocasional: 2,
};

/**
 * Arma la ficha interna de un producto.
 *
 * ⛔ Nada de lo que devuelve fue escrito acá. Cada texto viene de la
 *    taxonomía (que Administración edita) o del copy aprobado.
 */
export function fichaInternaDe(
  fuentes: FuentesFichaInterna, productoId: ProductoId, oficial: FichaOficial,
): FichaInterna {
  const necesidadPorId = new Map(fuentes.necesidades.map((n) => [n.id, n]));
  const operacionPorId = new Map(fuentes.operaciones.map((o) => [o.id, o]));

  const delProducto = fuentes.relacionesNecesidadProducto
    .filter((r) => r.productoId === productoId);

  // --- A · Qué resuelve ----------------------------------------------------
  const queResuelve = delProducto
    .filter((r) => SE_OFRECE.has(r.encaje))
    .flatMap((r): DolorQueAtiende[] => {
      const n = necesidadPorId.get(r.necesidadId);
      if (!n) return [];
      return [{
        necesidadId: n.id,
        nombre: n.nombre,
        descripcion: n.descripcion,
        encaje: r.encaje,
        argumento: r.argumento,
        motivo: r.motivo,
        adaptacionRequerida: r.adaptacionRequerida,
      }];
    })
    .sort((a, b) => PESO_ENCAJE[a.encaje] - PESO_ENCAJE[b.encaje]);

  // --- B · Dónde NO ofrecerlo ---------------------------------------------
  const noOfrecerlo = delProducto
    .filter((r) => r.encaje === 'no_recomendado')
    .flatMap((r): DondeNoOfrecerlo[] => {
      const n = necesidadPorId.get(r.necesidadId);
      return n ? [{ necesidadId: n.id, dolor: n.nombre, motivo: r.motivo }] : [];
    });

  // --- C · Señales: operación → dolor que este producto atiende ------------
  const misNecesidades = new Set(queResuelve.map((d) => d.necesidadId));
  const senales = fuentes.relacionesOperacionNecesidad
    .filter((r) => misNecesidades.has(r.necesidadId))
    .flatMap((r): SenalDeOportunidad[] => {
      const op = operacionPorId.get(r.operacionId);
      const n = necesidadPorId.get(r.necesidadId);
      if (!op || !n) return [];
      return [{
        operacionId: op.id,
        operacion: op.nombre,
        necesidadId: n.id,
        dolor: n.nombre,
        probabilidad: r.probabilidad,
        motivo: r.motivo,
      }];
    })
    .sort((a, b) => PESO_PROBABILIDAD[a.probabilidad] - PESO_PROBABILIDAD[b.probabilidad]);

  // --- D · Preguntas -------------------------------------------------------
  //
  // Dos clases, y las dos ya escritas: la de la operación averigua si el
  // negocio HACE eso; la del dolor confirma si eso le DUELE. ⛔ No se repite
  // una pregunta aunque dos caminos lleven a ella.
  const vistas = new Set<string>();
  const preguntas: PreguntaParaDescubrir[] = [];

  for (const s of senales) {
    const op = operacionPorId.get(s.operacionId);
    if (!op || op.pregunta.trim() === '' || vistas.has(op.pregunta)) continue;
    vistas.add(op.pregunta);
    preguntas.push({ texto: op.pregunta, queValida: op.nombre, origen: 'operacion' });
  }
  for (const d of queResuelve) {
    const n = necesidadPorId.get(d.necesidadId);
    if (!n || n.preguntaConfirmacion.trim() === '' || vistas.has(n.preguntaConfirmacion)) continue;
    vistas.add(n.preguntaConfirmacion);
    preguntas.push({
      texto: n.preguntaConfirmacion, queValida: n.nombre, origen: 'necesidad',
    });
  }

  // --- E · Complementarios -------------------------------------------------
  //
  // Un negocio que hace la misma operación suele tener más de un dolor. El
  // complementario es el producto que cubre EL OTRO dolor de esa misma
  // operación. ⛔ No es "lo que también vendemos": es lo que el mismo hecho
  //    del negocio justifica.
  const misOperaciones = new Set(senales.map((s) => s.operacionId));
  const complementarios: ProductoComplementario[] = [];
  const yaPuesto = new Set<string>();

  for (const r of fuentes.relacionesOperacionNecesidad) {
    if (!misOperaciones.has(r.operacionId)) continue;
    if (misNecesidades.has(r.necesidadId)) continue;  // ése ya lo cubre éste

    const op = operacionPorId.get(r.operacionId);
    const n = necesidadPorId.get(r.necesidadId);
    if (!op || !n) continue;

    for (const rp of fuentes.relacionesNecesidadProducto) {
      if (rp.necesidadId !== r.necesidadId) continue;
      if (rp.productoId === productoId) continue;
      if (rp.encaje !== 'directo' && rp.encaje !== 'cercano') continue;

      const llave = `${rp.productoId}|${n.id}`;
      if (yaPuesto.has(llave)) continue;
      yaPuesto.add(llave);

      complementarios.push({
        productoId: rp.productoId,
        nombreProducto: fuentes.nombresDeProducto.get(rp.productoId) ?? rp.productoId,
        porLaOperacion: op.nombre,
        cubreElDolor: n.nombre,
        encaje: rp.encaje,
      });
    }
  }
  complementarios.sort((a, b) => PESO_ENCAJE[a.encaje] - PESO_ENCAJE[b.encaje]);

  // --- F · Qué observar ----------------------------------------------------
  const queObservar = [...new Set(senales.map((s) => s.operacion))];

  // --- G · El precio del copy, a mano --------------------------------------
  const bloquePrecio = oficial.bloques.find((b) => b.id === 'precioDeReferencia' && b.presente);

  return {
    productoId,
    nombreProducto: oficial.nombreProducto,
    familia: oficial.familia,
    logo: oficial.logo,
    queResuelve,
    senales,
    preguntas,
    complementarios,
    noOfrecerlo,
    queObservar,
    precioDeReferencia: bloquePrecio?.contenido ?? null,
    // ⛔ Sin dolores cargados no hay ficha interna. Se dice, no se rellena.
    sinTaxonomia: queResuelve.length === 0,
  };
}
