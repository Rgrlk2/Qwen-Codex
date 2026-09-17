/**
 * Los cuatro estados, versión local de Planificar.
 *
 * ⛔ DUEÑO: Sesión 3. `apps/escritorio/src/nucleo/estados.ts` es de S2 y
 *    todavía no expone nada reusable en este commit base; en vez de bloquear
 *    esta vista esperándolo, esta versión local implementa lo mínimo con las
 *    MISMAS clases compartidas (`.cargando`/`.hueso`, `.vacio`, `.error`) que
 *    define `packages/ui/src/base.css`. Cuando S2 publique los suyos, este
 *    archivo puede delegar en ellos sin cambiar ninguna otra vista.
 *
 *   cargando  → esqueletos con la forma del contenido real. role="status".
 *   vacío     → explica qué falta Y ofrece la acción que lo resuelve.
 *   error     → causa clara + "Volver a intentar". role="alert".
 *   con datos → lo construye cada módulo de Planificar.
 */

import type { ErrorApi } from '@labia/compartido';

export function crearBloqueCargando(etiqueta: string, huesos = 3): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'cargando';
  contenedor.setAttribute('role', 'status');
  contenedor.setAttribute('aria-live', 'polite');
  const texto = document.createElement('p');
  texto.textContent = etiqueta;
  contenedor.appendChild(texto);
  for (let i = 0; i < huesos; i += 1) {
    const hueso = document.createElement('div');
    hueso.className = 'hueso';
    contenedor.appendChild(hueso);
  }
  return contenedor;
}

export function crearBloqueVacio(mensaje: string, accion?: { readonly texto: string; readonly onActivar: () => void }): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'vacio';
  const parrafo = document.createElement('p');
  parrafo.textContent = mensaje;
  contenedor.appendChild(parrafo);
  if (accion) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn';
    boton.textContent = accion.texto;
    boton.addEventListener('click', accion.onActivar);
    contenedor.appendChild(boton);
  }
  return contenedor;
}

/** ⛔ Sin códigos HTTP, nombres de tabla ni trazas: sólo `mensajeAmable` y `pista`. */
export function crearBloqueError(error: ErrorApi, onReintentar: () => void): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'error';
  contenedor.setAttribute('role', 'alert');
  const parrafo = document.createElement('p');
  parrafo.textContent = error.mensajeAmable;
  contenedor.appendChild(parrafo);
  if (error.pista) {
    const pista = document.createElement('p');
    pista.className = 'texto-3';
    pista.textContent = error.pista;
    contenedor.appendChild(pista);
  }
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-borde';
  boton.textContent = 'Volver a intentar';
  boton.addEventListener('click', onReintentar);
  contenedor.appendChild(boton);
  return contenedor;
}

export function vaciarNodo(nodo: HTMLElement): void {
  nodo.replaceChildren();
}
