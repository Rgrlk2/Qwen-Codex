/**
 * Los cuatro estados, versión local a Dinero y Administración.
 *
 * ⛔ DUEÑO: Sesión 6. `apps/escritorio/src/nucleo/estados.ts` es de Sesión 2 y
 * todavía no tiene implementación en la base: estas dos vistas resuelven sus
 * propios bloques de estado, dentro de su ámbito, con las mismas clases
 * documentadas en DESIGN_SYSTEM.md §5 para que hereden el estilo cuando
 * `packages/ui/src/base.css` las implemente.
 */

import type { Dinero, Moneda, Resultado } from '@labia/compartido';

/** Busca el importe de una moneda dentro de un `TotalesPorMoneda`. `0` si no está. */
export function buscarMonto(totales: readonly Dinero[], moneda: Moneda): number {
  return totales.find((d) => d.moneda === moneda)?.monto ?? 0;
}

export function crearElemento<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K, clase?: string, texto?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

export function crearEsqueleto(filas = 3): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'cargando';
  contenedor.setAttribute('role', 'status');
  contenedor.setAttribute('aria-label', 'Cargando');
  for (let i = 0; i < filas; i += 1) {
    const hueso = document.createElement('div');
    hueso.className = 'hueso';
    contenedor.appendChild(hueso);
  }
  return contenedor;
}

export function crearVacio(mensaje: string, accion?: { readonly texto: string; readonly onClick: () => void }): HTMLElement {
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
    boton.addEventListener('click', accion.onClick);
    contenedor.appendChild(boton);
  }
  return contenedor;
}

export function crearError(mensaje: string, reintentar: () => void): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'error';
  contenedor.setAttribute('role', 'alert');
  const parrafo = document.createElement('p');
  parrafo.textContent = mensaje;
  contenedor.appendChild(parrafo);
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-borde';
  boton.textContent = 'Volver a intentar';
  boton.addEventListener('click', reintentar);
  contenedor.appendChild(boton);
  return contenedor;
}

export function vaciarNodo(nodo: HTMLElement): void {
  while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
}

/**
 * Clave de idempotencia simple. `crypto.randomUUID` está disponible en todos
 * los navegadores objetivo (Chrome/Safari/Firefox recientes, docs/QA_CHECKLIST §9).
 */
export function nuevaClaveIdempotencia(): string {
  return crypto.randomUUID();
}

/** Una tabla genérica, siempre dentro de `.tabla-contenedor` (scroll propio, nunca de la página). */
export function crearTabla(
  columnas: ReadonlyArray<string>,
  filas: ReadonlyArray<ReadonlyArray<string | HTMLElement>>,
): HTMLElement {
  const envoltorio = crearElemento('div', 'tabla-contenedor');
  const tabla = crearElemento('table', 'tabla');
  const thead = crearElemento('thead');
  const filaCabecera = crearElemento('tr');
  for (const columna of columnas) filaCabecera.appendChild(crearElemento('th', undefined, columna));
  thead.appendChild(filaCabecera);
  tabla.appendChild(thead);
  const tbody = crearElemento('tbody');
  for (const fila of filas) {
    const tr = crearElemento('tr');
    for (const celda of fila) {
      const td = crearElemento('td');
      if (typeof celda === 'string') td.textContent = celda;
      else td.appendChild(celda);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  tabla.appendChild(tbody);
  envoltorio.appendChild(tabla);
  return envoltorio;
}

export interface OpcionesBloque<T> {
  readonly contenedor: HTMLElement;
  readonly cargar: () => Promise<Resultado<T>>;
  readonly esVacio: (datos: T) => boolean;
  readonly mensajeVacio: string;
  readonly accionVacio?: { readonly texto: string; readonly onClick: () => void };
  readonly renderizar: (datos: T, contenedor: HTMLElement) => void;
  readonly filasEsqueleto?: number;
}

/**
 * Un bloque asíncrono con sus cuatro estados. Cada bloque de una vista se
 * carga y falla de forma independiente: un bloque que falla no tumba el resto.
 */
export function crearBloque<T>(senal: AbortSignal, opciones: OpcionesBloque<T>): { readonly cargar: () => void } {
  async function ejecutar(): Promise<void> {
    vaciarNodo(opciones.contenedor);
    opciones.contenedor.appendChild(crearEsqueleto(opciones.filasEsqueleto ?? 3));
    const resultado = await opciones.cargar();
    if (senal.aborted) return;
    vaciarNodo(opciones.contenedor);
    if (!resultado.ok) {
      opciones.contenedor.appendChild(crearError(resultado.error.mensajeAmable, () => { void ejecutar(); }));
      return;
    }
    if (opciones.esVacio(resultado.datos)) {
      opciones.contenedor.appendChild(crearVacio(opciones.mensajeVacio, opciones.accionVacio));
      return;
    }
    opciones.renderizar(resultado.datos, opciones.contenedor);
  }
  return { cargar: () => void ejecutar() };
}
