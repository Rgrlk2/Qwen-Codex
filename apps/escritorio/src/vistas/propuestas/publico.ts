/**
 * La vista pública del cliente — sin sesión, superficie mínima.
 *
 * Ésta es la pantalla que abre el cliente desde el enlace que le mandó el
 * vendedor. No hay navegación al Escritorio, no hay otros clientes, no hay
 * precios de terceros, y nunca se revela cuántas veces se abrió el enlace.
 *
 * Integración pendiente (fuera de esta sesión): el punto de entrada público
 * — detectar el token en la URL antes de levantar el ruteo autenticado — es
 * responsabilidad de `apps/escritorio/src/main.ts` (Sesión 1). Este módulo
 * sólo expone las dos funciones de montaje que ese punto de entrada tiene que
 * invocar con el `token` (y el `codigo`, si el enlace lo exige).
 */

import type { CapaPublica, ConstanciaRespuesta, OpcionRespuesta, RespuestaDelCliente } from '@labia/compartido';
import {
  COPY_DE_LOS_TRECE, NOTA_PRECIO_REFERENCIAL, TEXTOS_OPCION, TEXTO_ACEPTACION,
  TEXTO_BOTON_ENVIO, fichasOficialesDelCopy, logoDe,
} from '@labia/compartido';
import { crear, vaciar } from './dom';
import { formatearDinero, formatearFecha } from './formato';
import { nuevaClaveIdempotencia } from './ids';

const ORDEN_OPCIONES: ReadonlyArray<OpcionRespuesta> = [
  'estandar', 'adelantado_12', 'adelantado_24', 'diferido', 'contactar_antes', 'no_continuar',
];

function pantallaError(raiz: HTMLElement, mensaje: string): void {
  vaciar(raiz);
  const bloque = crear('div', { clase: 'propuestas-publico propuestas-error', atributos: { role: 'alert' } });
  bloque.append(crear('p', { texto: mensaje }));
  raiz.append(bloque);
}

function pieDeMarca(raiz: HTMLElement): void {
  raiz.append(crear('p', { clase: 'propuestas-publico__pie', texto: 'Lab.IA — RGrlk Group' }));
}

export function montarPresentacionPublica(raiz: HTMLElement, capa: CapaPublica, token: string, codigo?: string): void {
  vaciar(raiz);
  const cargando = crear('div', { clase: 'propuestas-cargando', atributos: { role: 'status' } });
  cargando.append(crear('span', { texto: 'Cargando…' }));
  raiz.append(cargando);

  capa.obtenerPresentacionPublica(token, codigo).then((resultado) => {
    if (!resultado.ok) {
      pantallaError(raiz, resultado.error.mensajeAmable);
      return;
    }
    const presentacion = resultado.datos;
    vaciar(raiz);
    const pagina = crear('div', { clase: 'propuestas-publico propuestas-ficha' });

    pagina.append(crear('h1', { texto: presentacion.titulo }));
    pagina.append(crear('p', {
      clase: 'propuestas-meta',
      texto: `Preparado por ${presentacion.nombreVendedor} · ${formatearFecha(presentacion.emitidaEn)}`,
    }));

    // ⛔ Lo que dice el vendedor va ARRIBA y separado de lo que dice Lab.IA.
    //    El cliente tiene que poder distinguir una cosa de la otra.
    if (presentacion.loQueConversamos) {
      const bloque = crear('section', { clase: 'propuestas-ficha__conversado' });
      bloque.append(
        crear('h2', { texto: 'Lo que conversamos' }),
        crear('p', { texto: presentacion.loQueConversamos }),
      );
      pagina.append(bloque);
    }

    // ⛔ ACÁ NO LLEGÓ NI UNA LÍNEA DE COPY DEL SERVIDOR: del enlace vinieron
    //    los identificadores de los productos, y el texto aprobado sale del
    //    archivo congelado que ya trae esta aplicación. Una sola fuente.
    const oficiales = fichasOficialesDelCopy(COPY_DE_LOS_TRECE, logoDe);
    let algunoSeMostro = false;

    for (const productoId of presentacion.productos) {
      const oficial = oficiales.get(productoId);
      // Un producto que este portafolio no tiene no se dibuja a medias.
      if (!oficial) continue;
      algunoSeMostro = true;

      const seccion = crear('section', { clase: 'propuestas-presentacion__producto' });
      const cabecera = crear('div', { clase: 'propuestas-presentacion__cabecera' });
      const logo = crear('img', { clase: 'propuestas-ficha__logo' });
      logo.src = oficial.logo;
      logo.alt = oficial.nombreProducto;
      cabecera.append(logo, crear('h2', { texto: oficial.nombreProducto }));
      seccion.append(cabecera);

      for (const bloque of oficial.bloques) {
        if (!bloque.presente) continue;
        // ⛔ El precio SÓLO si el vendedor lo decidió, y siempre como rango de
        //    referencia: una presentación no lleva precio cerrado.
        if (bloque.sensibleAlPrecio && !presentacion.mostrarRangoDeReferencia) continue;

        const caja = crear('div', { clase: 'propuestas-ficha__bloque' });
        caja.append(crear('h3', { texto: bloque.titulo }));
        dibujarCopy(caja, bloque.contenido);
        if (bloque.sensibleAlPrecio) {
          caja.append(crear('p', {
            clase: 'propuestas-ficha__nota-precio', texto: NOTA_PRECIO_REFERENCIAL,
          }));
        }
        seccion.append(caja);
      }
      pagina.append(seccion);
    }

    // ⛔ Antes que mostrarle al cliente una página con el título y nada más,
    //    se dice. Una presentación vacía es un enlace roto con buena letra.
    if (!algunoSeMostro) {
      pantallaError(raiz, 'No pudimos abrir esta presentación. Pedile una nueva a quien te la compartió.');
      return;
    }

    if (presentacion.notaDelVendedor) {
      const nota = crear('section', { clase: 'propuestas-ficha__nota' });
      nota.append(
        crear('h2', { texto: `Nota de ${presentacion.nombreVendedor}` }),
        crear('p', { texto: presentacion.notaDelVendedor }),
      );
      pagina.append(nota);
    }

    // ⛔ La única acción, igual que en la ficha: hablar con su vendedor. No
    //    hay formulario de datos, ni pasarela, ni nada que pida información.
    const cierre = crear('section', { clase: 'propuestas-ficha__cierre' });
    cierre.append(crear('p', { texto: presentacion.llamadoALaAccion }));
    pagina.append(cierre);

    pieDeMarca(pagina);
    raiz.append(pagina);
  });
}

/**
 * El copy aprobado viene con el marcado que usó quien lo escribió: `**negrita**`
 * y líneas que empiezan con `- `.
 *
 * ⛔ Esto NO reescribe el copy: lo dibuja como está escrito. Dejar los
 *    asteriscos a la vista del cliente no es "literal", es mal dibujado. Y no
 *    se interpreta nada más que esas dos marcas: ni enlaces, ni HTML, ni
 *    imágenes. Lo que no se reconoce, se muestra tal cual.
 */
function conNegritas(texto: string): DocumentFragment {
  const trozo = document.createDocumentFragment();
  for (const parte of texto.split(/(\*\*[^*]+\*\*)/g)) {
    if (parte === '') continue;
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      const fuerte = document.createElement('strong');
      fuerte.textContent = parte.slice(2, -2);
      trozo.append(fuerte);
    } else {
      trozo.append(document.createTextNode(parte));
    }
  }
  return trozo;
}

/** Los párrafos y las listas del copy, cada uno como lo que es. */
function dibujarCopy(destino: HTMLElement, contenido: string): void {
  for (const bruto of contenido.split(/\n{2,}/)) {
    const parrafo = bruto.trim();
    if (parrafo === '') continue;

    const lineas = parrafo.split('\n').map((l) => l.trim()).filter((l) => l !== '');
    // Un bloque puede ser: puras viñetas, o una frase que las introduce y
    // después las viñetas. Las dos formas aparecen en el copy aprobado.
    const primerItem = lineas.findIndex((l) => l.startsWith('- '));
    const todoLoDemasSonItems = primerItem >= 0
      && lineas.slice(primerItem).every((l) => l.startsWith('- '));

    if (todoLoDemasSonItems) {
      if (primerItem > 0) {
        const entrada = document.createElement('p');
        entrada.append(conNegritas(lineas.slice(0, primerItem).join(' ')));
        destino.append(entrada);
      }
      const lista = document.createElement('ul');
      for (const item of lineas.slice(primerItem)) {
        const li = document.createElement('li');
        li.append(conNegritas(item.slice(2)));
        lista.append(li);
      }
      destino.append(lista);
      continue;
    }

    const p = document.createElement('p');
    p.append(conNegritas(parrafo.replace(/\n/g, ' ')));
    destino.append(p);
  }
}


/**
 * La ficha que el vendedor preparó, tal como la ve el prospecto.
 *
 * ⛔ El copy sale del archivo congelado y se dibuja LITERAL: ni resumido, ni
 *    reescrito, ni acortado para que entre. Lo que el vendedor decidió es qué
 *    bloques se ven, en qué orden y cuáles pesan más.
 *
 * ⛔ "Lo que conversamos" y la nota del vendedor van SEPARADOS y marcados como
 *    suyos, para que el cliente distinga qué dice Lab.IA y qué dice la persona
 *    con la que habló.
 *
 * ⛔ Una sola acción: "Hablemos". No hay formulario de datos, no hay pasarela
 *    de pago, no hay precios de otros productos, no hay nada del Escritorio.
 */
export function montarFichaPublica(
  raiz: HTMLElement, capa: CapaPublica, token: string,
): void {
  vaciar(raiz);
  const cargando = crear('div', { clase: 'propuestas-cargando', atributos: { role: 'status' } });
  cargando.append(crear('span', { texto: 'Cargando…' }));
  raiz.append(cargando);

  void capa.obtenerFichaPublica(token).then((resultado) => {
    if (!resultado.ok) {
      pantallaError(raiz, resultado.error.mensajeAmable);
      return;
    }
    const ficha = resultado.datos;
    vaciar(raiz);
    const pagina = crear('div', { clase: 'propuestas-publico propuestas-ficha' });

    const logo = crear('img', {
      clase: 'propuestas-ficha__logo',
      atributos: { src: ficha.logo, alt: ficha.nombreProducto, loading: 'lazy' },
    });
    pagina.append(logo, crear('h1', { texto: ficha.nombreProducto }));

    // Lo del vendedor va primero y marcado: es la razón por la que el cliente
    // está mirando esto.
    if (ficha.loQueConversamos) {
      const bloque = crear('section', { clase: 'propuestas-ficha__conversado' });
      bloque.append(
        crear('h2', { texto: 'Lo que conversamos' }),
        crear('p', { texto: ficha.loQueConversamos }),
      );
      pagina.append(bloque);
    }

    const destacados = new Set(ficha.destacados);
    for (const bloque of ficha.bloques) {
      const seccion = crear('section', {
        clase: destacados.has(bloque.id)
          ? 'propuestas-ficha__bloque propuestas-ficha__bloque--destacado'
          : 'propuestas-ficha__bloque',
      });
      seccion.append(crear('h2', { texto: bloque.titulo }));
      dibujarCopy(seccion, bloque.contenido);
      // ⛔ Una ficha nunca es una oferta cerrada. Lo diga el copy o lo diga el
      //    vendedor, el precio de acá es de referencia: lo que compromete a
      //    Lab.IA es la cotización, con su aprobación y su firma. Se lo
      //    decimos al cliente en la misma pantalla donde lee el número.
      if (bloque.id === 'precioDeReferencia') {
        seccion.append(crear('p', {
          clase: 'propuestas-ficha__nota-precio', texto: NOTA_PRECIO_REFERENCIAL,
        }));
      }
      pagina.append(seccion);
    }

    if (ficha.notaDelVendedor) {
      const nota = crear('section', { clase: 'propuestas-ficha__nota' });
      nota.append(
        crear('h2', { texto: `Nota de ${ficha.nombreVendedor}` }),
        crear('p', { texto: ficha.notaDelVendedor }),
      );
      pagina.append(nota);
    }

    // ⛔ La única acción. Y no lleva a ningún lado que pida datos: le dice al
    //    cliente con quién hablar.
    const cierre = crear('section', { clase: 'propuestas-ficha__cierre' });
    cierre.append(
      crear('p', { texto: `${ficha.nombreVendedor} preparó esta ficha para vos.` }),
      crear('p', { clase: 'propuestas-ficha__accion', texto: ficha.llamadoALaAccion }),
    );
    pagina.append(cierre);

    pieDeMarca(pagina);
    raiz.append(pagina);
  });
}

function mostrarConstancia(raiz: HTMLElement, constancia: ConstanciaRespuesta): void {
  vaciar(raiz);
  const pagina = crear('div', { clase: 'propuestas-publico' });
  pagina.append(crear('h1', { texto: 'Gracias — tu elección quedó registrada' }));
  pagina.append(crear('p', { texto: TEXTOS_OPCION[constancia.opcionSeleccionada] }));
  if (constancia.importesAceptados) {
    pagina.append(crear('p', { texto: `Total: ${formatearDinero(constancia.importesAceptados.totalFinal)}` }));
  }
  pagina.append(crear('p', {
    clase: 'propuestas-aviso',
    texto: 'Esto es una constancia comercial (un aval de intención). No es un contrato ni una firma electrónica legal.',
  }));
  pieDeMarca(pagina);
  raiz.append(pagina);
}

export function montarCotizacionPublica(raiz: HTMLElement, capa: CapaPublica, token: string, codigo?: string): void {
  vaciar(raiz);
  const cargando = crear('div', { clase: 'propuestas-cargando', atributos: { role: 'status' } });
  cargando.append(crear('span', { texto: 'Cargando…' }));
  raiz.append(cargando);

  Promise.all([capa.obtenerCotizacionPublica(token, codigo), capa.obtenerConstanciaPublica(token)]).then(
    ([resultadoCotizacion, resultadoConstancia]) => {
      if (!resultadoCotizacion.ok) {
        pantallaError(raiz, resultadoCotizacion.error.mensajeAmable);
        return;
      }
      if (resultadoConstancia.ok && resultadoConstancia.datos) {
        mostrarConstancia(raiz, resultadoConstancia.datos);
        return;
      }
      const cotizacion = resultadoCotizacion.datos;
      vaciar(raiz);
      const pagina = crear('div', { clase: 'propuestas-publico' });
      pagina.append(crear('h1', { texto: `Cotización ${cotizacion.folio} · versión ${cotizacion.version}` }));
      pagina.append(crear('p', { texto: `Para: ${cotizacion.nombreCliente}` }));
      pagina.append(crear('p', { texto: `Producto: ${cotizacion.nombreProducto}${cotizacion.variante ? ` — ${cotizacion.variante}` : ''}` }));
      pagina.append(crear('p', { clase: 'propuestas-meta', texto: `Emitida el ${formatearFecha(cotizacion.emitidaEn)} · válida hasta el ${formatearFecha(cotizacion.venceEn)}` }));

      if (cotizacion.vencida) {
        pagina.append(crear('p', { clase: 'propuestas-error', atributos: { role: 'alert' }, texto: 'Esta oferta venció y ya no acepta respuesta. Comunicate con tu vendedor para una cotización nueva.' }));
        pieDeMarca(pagina);
        raiz.append(pagina);
        return;
      }

      const alternativasDisponibles = new Map(cotizacion.alternativas.map((a) => [a.codigo, a] as const));
      if (alternativasDisponibles.size > 0) {
        const tabla = crear('div', { clase: 'propuestas-tabla-contenedor' });
        const lista = crear('ul', { clase: 'propuestas-alternativas-publicas' });
        for (const alternativa of cotizacion.alternativas) {
          lista.append(crear('li', { texto: `${alternativa.nombre}: total ${formatearDinero(alternativa.totalFinal)} — ${alternativa.formaDePago}` }));
        }
        tabla.append(lista);
        pagina.append(tabla);
      }

      const formulario = crear('form', { clase: 'propuestas-formulario' });
      const grupoOpciones = crear('fieldset');
      grupoOpciones.append(crear('legend', { texto: 'Elegí una opción' }));
      const entradas: HTMLInputElement[] = [];
      for (const opcion of ORDEN_OPCIONES) {
        const esAlternativaFinanciera = opcion === 'estandar' || opcion === 'adelantado_12' || opcion === 'adelantado_24' || opcion === 'diferido';
        if (esAlternativaFinanciera && !alternativasDisponibles.has(opcion)) continue;
        const etiqueta = crear('label', { clase: 'propuestas-opcion-radio' });
        const radio = crear('input', { atributos: { type: 'radio', name: 'opcion-respuesta', value: opcion } });
        entradas.push(radio);
        etiqueta.append(radio, document.createTextNode(TEXTOS_OPCION[opcion]));
        grupoOpciones.append(etiqueta);
      }
      formulario.append(grupoOpciones);

      const etiquetaCasilla = crear('label', { clase: 'propuestas-checkbox' });
      const casillaAceptacion = crear('input', { atributos: { type: 'checkbox' } });
      etiquetaCasilla.append(casillaAceptacion, document.createTextNode(TEXTO_ACEPTACION));
      formulario.append(etiquetaCasilla);

      const zonaAviso = crear('p', { clase: 'propuestas-aviso', atributos: { role: 'alert' } });
      zonaAviso.hidden = true;
      formulario.append(zonaAviso);

      const botonEnviar = crear('button', { clase: 'propuestas-btn', texto: TEXTO_BOTON_ENVIO });
      botonEnviar.type = 'submit';
      botonEnviar.disabled = true;
      formulario.append(botonEnviar);

      function actualizarHabilitado(): void {
        const hayOpcion = entradas.some((e) => e.checked);
        botonEnviar.disabled = !(hayOpcion && casillaAceptacion.checked);
      }
      casillaAceptacion.addEventListener('change', actualizarHabilitado);
      for (const entrada of entradas) entrada.addEventListener('change', actualizarHabilitado);

      formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        if (!casillaAceptacion.checked) return;
        const elegida = entradas.find((e) => e.checked);
        if (!elegida) return;
        const respuesta: RespuestaDelCliente = { opcion: elegida.value as OpcionRespuesta, aceptacionMarcada: true };
        botonEnviar.disabled = true;
        capa.responderCotizacion(token, respuesta, nuevaClaveIdempotencia()).then((resultadoRespuesta) => {
          if (!resultadoRespuesta.ok) {
            zonaAviso.textContent = resultadoRespuesta.error.mensajeAmable;
            zonaAviso.hidden = false;
            actualizarHabilitado();
            return;
          }
          mostrarConstancia(raiz, resultadoRespuesta.datos);
        });
      });

      pagina.append(crear('h2', { texto: 'Bases y condiciones' }));
      pagina.append(crear('p', { texto: cotizacion.basesYCondiciones }));
      pagina.append(formulario);
      pieDeMarca(pagina);
      raiz.append(pagina);
    },
  );
}
