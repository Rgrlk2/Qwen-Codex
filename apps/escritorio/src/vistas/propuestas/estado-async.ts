/**
 * Los cuatro estados de un bloque asíncrono, para esta vista.
 *
 * `apps/escritorio/src/nucleo/estados.ts` es de la Sesión 2 y todavía no
 * implementa nada: esta vista no puede esperarla, así que define su propia
 * versión local — cargando (esqueleto, role="status") · vacío (con la acción
 * que lo resuelve) · error (lenguaje claro + reintento, role="alert") · con
 * datos — hasta que la integración reemplace esto por el componente compartido.
 *
 * ⛔ Un bloque que falla no tumba el resto de la vista: el error queda
 * contenido en su propio contenedor.
 */

import type { Resultado } from '@labia/compartido';
import { crear, vaciar } from './dom';

export interface OpcionesBloqueAsync<T> {
  readonly contenedor: HTMLElement;
  readonly cargar: () => Promise<Resultado<T>>;
  readonly renderizarDatos: (contenedor: HTMLElement, datos: T) => void;
  readonly etiquetaCargando: string;
  readonly estaVacio?: (datos: T) => boolean;
  readonly renderizarVacio?: (contenedor: HTMLElement) => void;
  /** Si la vista se desmontó mientras se esperaba la respuesta, no se pinta nada. */
  readonly senal?: AbortSignal;
}

function renderizarCargando(contenedor: HTMLElement, etiqueta: string): void {
  vaciar(contenedor);
  const bloque = crear('div', { clase: 'propuestas-cargando', atributos: { role: 'status' } });
  bloque.append(crear('span', { clase: 'propuestas-hueso' }));
  bloque.append(crear('span', { clase: 'propuestas-hueso' }));
  bloque.append(crear('span', { clase: 'propuestas-hueso propuestas-hueso--corto' }));
  bloque.append(crear('span', { clase: 'propuestas-solo-lectura-visual', texto: etiqueta }));
  contenedor.append(bloque);
}

function renderizarErrorGenerico(
  contenedor: HTMLElement,
  mensaje: string,
  pista: string | undefined,
  reintentar: () => void,
): void {
  vaciar(contenedor);
  const bloque = crear('div', { clase: 'propuestas-error', atributos: { role: 'alert' } });
  bloque.append(crear('p', { texto: mensaje }));
  if (pista) bloque.append(crear('p', { clase: 'propuestas-error__pista', texto: pista }));
  const boton = crear('button', { clase: 'propuestas-btn-borde', texto: 'Volver a intentar' });
  boton.type = 'button';
  boton.addEventListener('click', reintentar);
  bloque.append(boton);
  contenedor.append(bloque);
}

function renderizarVacioGenerico(contenedor: HTMLElement): void {
  vaciar(contenedor);
  contenedor.append(crear('p', { clase: 'propuestas-vacio', texto: 'No hay nada para mostrar todavía.' }));
}

/**
 * Ejecuta `cargar`, muestra el estado "cargando" mientras tanto, y resuelve en
 * "vacío", "error" o "con datos" según corresponda. Reintentar vuelve a llamar
 * a esta misma función.
 */
export function cargarConEstados<T>(opciones: OpcionesBloqueAsync<T>): void {
  const { contenedor } = opciones;
  renderizarCargando(contenedor, opciones.etiquetaCargando);
  opciones.cargar().then(
    (resultado) => {
      if (opciones.senal?.aborted) return;
      if (!resultado.ok) {
        renderizarErrorGenerico(
          contenedor,
          resultado.error.mensajeAmable,
          resultado.error.pista,
          () => cargarConEstados(opciones),
        );
        return;
      }
      const { datos } = resultado;
      if (opciones.estaVacio?.(datos)) {
        vaciar(contenedor);
        if (opciones.renderizarVacio) opciones.renderizarVacio(contenedor);
        else renderizarVacioGenerico(contenedor);
        return;
      }
      vaciar(contenedor);
      opciones.renderizarDatos(contenedor, datos);
    },
    () => {
      if (opciones.senal?.aborted) return;
      renderizarErrorGenerico(
        contenedor,
        'Ocurrió un problema inesperado. Volvé a intentar en un momento.',
        undefined,
        () => cargarConEstados(opciones),
      );
    },
  );
}
