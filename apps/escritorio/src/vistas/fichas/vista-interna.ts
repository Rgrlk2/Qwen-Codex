/**
 * La ficha INTERNA, en pantalla: lo que el vendedor lee antes de la reunión.
 *
 * ⛔ ESTO NO SALE NUNCA AL CLIENTE. No tiene enlace, no tiene botón de
 *    compartir y no entra en ningún documento. Está en la pantalla del
 *    vendedor y ahí se queda.
 *
 * ⛔ Y NO INVENTA NADA: cada texto que aparece acá lo escribió Administración
 *    en la taxonomía. Si no hay nada cargado, esta pantalla lo dice y manda a
 *    pedirlo, en vez de rellenar con el copy comercial —que responde otra
 *    pregunta: el copy dice qué ES el producto; esto, cómo se vende.
 *
 * Arranca PLEGADA. El vendedor entró a preparar una ficha, no a estudiar: se
 * abre cuando la quiere.
 */

import type { FichaInterna, Probabilidad } from '@labia/compartido';
import { crear, parrafosDeTexto, vaciar } from './dom';

/** Cómo se lee cada probabilidad en la pantalla del vendedor. */
const TEXTO_PROBABILIDAD: Readonly<Record<Probabilidad, string>> = {
  tipica: 'casi siempre',
  frecuente: 'seguido',
  ocasional: 'a veces',
};

const TEXTO_ENCAJE: Readonly<Record<string, string>> = {
  directo: 'encaje directo',
  cercano: 'encaje cercano',
  adaptable: 'hay que adaptarlo',
  no_recomendado: 'no recomendado',
};

function seccion(titulo: string, ayuda: string): HTMLElement {
  const s = crear('section', { clase: 'interna-seccion' });
  s.append(
    crear('h4', { clase: 'interna-titulo', texto: titulo }),
    crear('p', { clase: 'interna-ayuda', texto: ayuda }),
  );
  return s;
}

export interface OpcionesVistaInterna {
  readonly contenedor: HTMLElement;
  readonly ficha: FichaInterna;
}

export function pintarFichaInterna(opciones: OpcionesVistaInterna): void {
  const { contenedor, ficha } = opciones;
  vaciar(contenedor);

  const caja = crear('details', { clase: 'interna' });
  const resumen = crear('summary', { clase: 'interna-resumen' });
  resumen.append(
    crear('span', { clase: 'interna-resumen-titulo', texto: `Cómo se vende ${ficha.nombreProducto}` }),
    crear('span', {
      clase: 'interna-resumen-nota',
      texto: 'Sólo para vos. El cliente no ve nada de esto.',
    }),
  );
  caja.append(resumen);

  const cuerpo = crear('div', { clase: 'interna-cuerpo' });
  caja.append(cuerpo);

  // ⛔ El estado honesto: sin taxonomía cargada no hay ficha interna.
  if (ficha.sinTaxonomia) {
    cuerpo.append(crear('p', {
      clase: 'interna-vacio',
      texto: 'Todavía no está cargado el conocimiento de venta de este producto: '
        + 'qué dolores resuelve, qué preguntar y con qué se combina. '
        + 'Pedíselo a Administración, que lo carga desde Taxonomía. '
        + 'No lo inventamos acá.',
      atributos: { role: 'status' },
    }));
    contenedor.append(caja);
    return;
  }

  // --- A quién le sirve ----------------------------------------------------
  const resuelve = seccion(
    'A quién le sirve',
    'Los dolores que este producto resuelve, con el argumento aprobado.',
  );
  const listaResuelve = crear('ul', { clase: 'interna-lista' });
  for (const d of ficha.queResuelve) {
    const li = crear('li', { clase: 'interna-item' });
    li.append(
      crear('p', { clase: 'interna-item-titulo', texto: d.nombre }),
      crear('span', { clase: 'interna-etiqueta', texto: TEXTO_ENCAJE[d.encaje] ?? d.encaje }),
      crear('p', { clase: 'interna-argumento', texto: d.argumento }),
      crear('p', { clase: 'interna-motivo', texto: d.motivo }),
    );
    if (d.adaptacionRequerida) {
      li.append(crear('p', {
        clase: 'interna-adaptacion', texto: `Hay que adaptarlo: ${d.adaptacionRequerida}`,
      }));
    }
    listaResuelve.append(li);
  }
  resuelve.append(listaResuelve);
  cuerpo.append(resuelve);

  // --- Qué mirar -----------------------------------------------------------
  if (ficha.queObservar.length > 0) {
    const observar = seccion(
      'Qué mirar en la visita',
      'Si el negocio hace esto, el producto tiene sentido. Es para observar, no para decir.',
    );
    const lista = crear('ul', { clase: 'interna-chips' });
    for (const o of ficha.queObservar) {
      lista.append(crear('li', { clase: 'interna-chip', texto: o }));
    }
    observar.append(lista);
    cuerpo.append(observar);
  }

  // --- Señales -------------------------------------------------------------
  if (ficha.senales.length > 0) {
    const senales = seccion(
      'Señales',
      'Si hacen lo de la izquierda, suele dolerles lo de la derecha.',
    );
    const lista = crear('ul', { clase: 'interna-lista' });
    for (const s of ficha.senales) {
      const li = crear('li', { clase: 'interna-senal' });
      li.append(
        crear('span', { clase: 'interna-senal-op', texto: s.operacion }),
        crear('span', { clase: 'interna-senal-flecha', texto: '→' }),
        crear('span', { clase: 'interna-senal-dolor', texto: s.dolor }),
        crear('span', {
          clase: 'interna-etiqueta', texto: TEXTO_PROBABILIDAD[s.probabilidad],
        }),
        crear('p', { clase: 'interna-motivo', texto: s.motivo }),
      );
      lista.append(li);
    }
    senales.append(lista);
    cuerpo.append(senales);
  }

  // --- Preguntas -----------------------------------------------------------
  if (ficha.preguntas.length > 0) {
    const preguntas = seccion(
      'Qué preguntar',
      'Para descubrir el problema sin adelantar la solución.',
    );
    const lista = crear('ol', { clase: 'interna-lista' });
    for (const p of ficha.preguntas) {
      const li = crear('li', { clase: 'interna-item' });
      li.append(
        crear('p', { clase: 'interna-pregunta', texto: p.texto }),
        crear('p', { clase: 'interna-motivo', texto: `Sirve para saber: ${p.queValida}` }),
      );
      lista.append(li);
    }
    preguntas.append(lista);
    cuerpo.append(preguntas);
  }

  // --- Con qué se combina --------------------------------------------------
  if (ficha.complementarios.length > 0) {
    const combina = seccion(
      'Con qué se combina',
      'El mismo hecho del negocio justifica los dos. No es "lo que también vendemos".',
    );
    const lista = crear('ul', { clase: 'interna-lista' });
    for (const c of ficha.complementarios) {
      const li = crear('li', { clase: 'interna-item' });
      li.append(
        crear('p', { clase: 'interna-item-titulo', texto: c.nombreProducto }),
        crear('p', {
          clase: 'interna-motivo',
          texto: `Porque ${c.porLaOperacion.toLowerCase()}, y eso también trae: ${c.cubreElDolor}.`,
        }),
      );
      lista.append(li);
    }
    combina.append(lista);
    cuerpo.append(combina);
  }

  // --- Dónde NO ofrecerlo --------------------------------------------------
  //
  // ⛔ Esto vale tanto como lo demás: ofrecer un producto donde no va quema el
  //    cliente y quema el portafolio entero.
  if (ficha.noOfrecerlo.length > 0) {
    const no = seccion(
      'Dónde NO ofrecerlo',
      'Está documentado que acá no va. Ofrecerlo igual cuesta el cliente.',
    );
    const lista = crear('ul', { clase: 'interna-lista' });
    for (const n of ficha.noOfrecerlo) {
      const li = crear('li', { clase: 'interna-item interna-item--no' });
      li.append(
        crear('p', { clase: 'interna-item-titulo', texto: n.dolor }),
        crear('p', { clase: 'interna-motivo', texto: n.motivo }),
      );
      lista.append(li);
    }
    no.append(lista);
    cuerpo.append(no);
  }

  // --- El precio de referencia, a mano -------------------------------------
  if (ficha.precioDeReferencia) {
    const precio = seccion(
      'Precio de referencia',
      'El del copy aprobado. En la ficha del cliente podés poner el de ese cliente.',
    );
    precio.append(...parrafosDeTexto(ficha.precioDeReferencia));
    cuerpo.append(precio);
  }

  contenedor.append(caja);
}
