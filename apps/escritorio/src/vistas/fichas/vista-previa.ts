/**
 * Vista previa: lo que va a ver el cliente.
 *
 * ⛔ Se arma con `fichaPublicaDe`, la MISMA función que usa el enlace real.
 *    No es una maqueta parecida: si acá no se filtra un dato interno, tampoco
 *    se filtra allá, y al revés. Una vista previa que use otro camino miente.
 *
 * ⛔ Superficie mínima: sin datos operativos del vendedor, sin navegación al
 *    Escritorio, y un solo llamado a la acción.
 */

import type { FichaPublica } from '@labia/compartido';
import { NOTA_PRECIO_REFERENCIAL } from '@labia/compartido';
import { crear, parrafosDeTexto, vaciar } from './dom';

export interface OpcionesVistaPrevia {
  readonly contenedor: HTMLElement;
  readonly ficha: FichaPublica;
  /** `true` dentro del Escritorio: rotula el marco como ensayo. */
  readonly esEnsayo: boolean;
}

export function pintarVistaPrevia({ contenedor, ficha, esEnsayo }: OpcionesVistaPrevia): void {
  vaciar(contenedor);
  const pagina = crear('article', { clase: 'ficha-publica' });

  if (esEnsayo) {
    pagina.append(crear('p', {
      clase: 'ficha-publica-ensayo',
      texto: 'Así la va a ver tu cliente',
      atributos: { role: 'status' },
    }));
  }

  // --- Encabezado ---------------------------------------------------------
  const cabecera = crear('header', { clase: 'ficha-publica-cabecera' });
  const logo = crear('img', { clase: 'ficha-publica-logo' });
  logo.src = ficha.logo;
  logo.alt = ficha.nombreProducto;
  logo.loading = 'lazy';
  cabecera.append(logo, crear('h1', { texto: ficha.nombreProducto }));
  pagina.append(cabecera);

  // --- Lo que conversamos, arriba: es lo que hace propia la ficha ---------
  if (ficha.loQueConversamos) {
    const bloque = crear('section', { clase: 'ficha-publica-vendedor' });
    bloque.append(crear('h2', { texto: 'Lo que conversamos' }));
    bloque.append(...parrafosDeTexto(ficha.loQueConversamos));
    bloque.append(crear('p', {
      clase: 'ficha-publica-firma',
      texto: `— ${ficha.nombreVendedor}`,
    }));
    pagina.append(bloque);
  }

  // --- Los bloques oficiales ----------------------------------------------
  const destacados = new Set(ficha.destacados);
  for (const bloque of ficha.bloques) {
    if (bloque.id === 'slogan') {
      pagina.append(crear('p', { clase: 'ficha-publica-slogan', texto: limpiar(bloque.contenido) }));
      continue;
    }
    const seccion = crear('section', {
      clase: `ficha-publica-bloque${destacados.has(bloque.id) ? ' ficha-publica-bloque--destacado' : ''}`,
    });
    seccion.append(crear('h2', { texto: bloque.titulo }));
    seccion.append(...parrafosDeTexto(bloque.contenido));
    // ⛔ El precio de una ficha SIEMPRE es referencial, lo escriba el copy o
    //    lo escriba el vendedor. La nota va acá, aparte, y no dentro del
    //    texto: el copy aprobado se sigue sirviendo sin agregarle un renglón.
    if (bloque.id === 'precioDeReferencia') {
      seccion.append(crear('p', {
        clase: 'ficha-publica-nota-precio', texto: NOTA_PRECIO_REFERENCIAL,
      }));
    }
    pagina.append(seccion);
  }

  // --- La nota del vendedor, al cierre ------------------------------------
  if (ficha.notaDelVendedor) {
    const bloque = crear('section', { clase: 'ficha-publica-vendedor' });
    bloque.append(...parrafosDeTexto(ficha.notaDelVendedor));
    bloque.append(crear('p', { clase: 'ficha-publica-firma', texto: `— ${ficha.nombreVendedor}` }));
    pagina.append(bloque);
  }

  // --- Un solo llamado a la acción ----------------------------------------
  const cierre = crear('div', { clase: 'ficha-publica-cierre' });
  const boton = crear('button', {
    clase: 'ficha-publica-cta',
    texto: ficha.llamadoALaAccion,
    atributos: { type: 'button' },
  });
  if (esEnsayo) {
    boton.disabled = true;
    boton.title = 'En el enlace real abre la conversación con el vendedor.';
  }
  cierre.append(boton);
  pagina.append(cierre);

  contenedor.append(pagina);
}

function limpiar(texto: string): string {
  return texto.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();
}
