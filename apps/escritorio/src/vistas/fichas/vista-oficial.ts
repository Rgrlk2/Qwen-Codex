/**
 * La ficha oficial, tal cual. Sólo lectura.
 *
 * Es lo que el vendedor consulta desde Planificar para estudiar el producto o
 * apoyarse durante la reunión. ⛔ No se edita desde ninguna vista: el texto
 * sale del copy aprobado y congelado.
 */

import type { CapaDatos, FichaOficial, Id, ProductoId } from '@labia/compartido';
import { crear, parrafosDeTexto, vaciar } from './dom';
import './estilos.css';

export interface OpcionesFichaOficial {
  readonly datos: CapaDatos;
  readonly contenedor: HTMLElement;
  readonly productoId: ProductoId;
  readonly senal: AbortSignal;
  /** Si hay un cliente a mano, se ofrece prepararla para él. */
  readonly clienteId?: Id;
  readonly alPrepararPara?: (clienteId: Id, productoId: ProductoId) => void;
}

export async function montarFichaOficial(opciones: OpcionesFichaOficial): Promise<void> {
  const { datos, contenedor, productoId, senal } = opciones;

  vaciar(contenedor);
  contenedor.append(crear('div', {
    clase: 'fichas-cargando', texto: 'Abriendo la ficha oficial…', atributos: { role: 'status' },
  }));

  const resultado = await datos.obtenerFichaOficial(productoId);
  if (senal.aborted) return;
  vaciar(contenedor);

  if (!resultado.ok) {
    const error = crear('div', { clase: 'fichas-error', atributos: { role: 'alert' } });
    error.append(crear('p', { texto: resultado.error.mensajeAmable }));
    const reintentar = crear('button', { clase: 'fichas-btn', texto: 'Volver a intentar', atributos: { type: 'button' } });
    reintentar.addEventListener('click', () => void montarFichaOficial(opciones));
    error.append(reintentar);
    contenedor.append(error);
    return;
  }

  pintarFichaOficial(contenedor, resultado.datos);

  if (opciones.clienteId && opciones.alPrepararPara) {
    const barra = crear('div', { clase: 'fichas-barra' });
    const preparar = crear('button', {
      clase: 'fichas-btn fichas-btn--activo',
      texto: 'Prepararla para este cliente',
      atributos: { type: 'button' },
    });
    const clienteId = opciones.clienteId;
    preparar.addEventListener('click', () => opciones.alPrepararPara?.(clienteId, productoId));
    barra.append(preparar);
    contenedor.append(barra);
  }
}

export function pintarFichaOficial(contenedor: HTMLElement, ficha: FichaOficial): void {
  const pagina = crear('article', { clase: 'ficha-publica' });

  const cabecera = crear('header', { clase: 'ficha-publica-cabecera' });
  const logo = crear('img', { clase: 'ficha-publica-logo' });
  logo.src = ficha.logo;
  logo.alt = ficha.nombreProducto;
  logo.loading = 'lazy';
  cabecera.append(logo, crear('h1', { texto: ficha.nombreProducto }));
  pagina.append(cabecera);

  for (const bloque of ficha.bloques) {
    if (!bloque.presente) continue;
    if (bloque.id === 'slogan') {
      pagina.append(crear('p', {
        clase: 'ficha-publica-slogan',
        texto: bloque.contenido.replace(/\*+/g, '').trim(),
      }));
      continue;
    }
    const seccion = crear('section', { clase: 'ficha-publica-bloque' });
    seccion.append(crear('h2', { texto: bloque.titulo }));
    seccion.append(...parrafosDeTexto(bloque.contenido));
    pagina.append(seccion);
  }

  contenedor.append(pagina);
}
