/**
 * Los cuatro estados, compartidos por todas las vistas.
 *
 * ⛔ DUEÑO: SESIÓN 2.
 *
 *   cargando  → esqueletos con la forma del contenido real. role="status".
 *               ⛔ Nunca pantalla en blanco.
 *   vacío     → explica qué falta Y ofrece la acción que lo resuelve.
 *   error     → causa en lenguaje claro + "Volver a intentar". role="alert".
 *               ⛔ Sin códigos HTTP, sin nombres de tabla, sin trazas.
 *   con datos → importes con moneda, fechas en es-PY.
 *
 * ⛔ Un bloque que falla NO tumba la vista: el resto sigue usable.
 *
 * Ver docs/DESIGN_SYSTEM.md §5.1 y docs/QA_CHECKLIST.md §7.5.
 */

import type { ErrorApi, Resultado } from '@labia/compartido';

// ---------------------------------------------------------------------------
// Piezas sueltas: por si una vista arma su propio orquestador.
// ---------------------------------------------------------------------------

/** Esqueleto de una cifra grande (las cuatro de Inicio, las ocho de Dinero). */
export function esqueletoCifra(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'hueso hueso--cifra';
  return el;
}

/** Esqueleto de una línea de texto. `corta` imita el último renglón de un párrafo. */
export function esqueletoLinea(corta = false): HTMLElement {
  const el = document.createElement('div');
  el.className = corta ? 'hueso hueso--linea-corta' : 'hueso hueso--linea';
  return el;
}

/** Esqueleto de bloque completo (tarjeta, lista, acción protagonista). */
export function esqueletoTarjeta(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'hueso hueso--tarjeta';
  return el;
}

/**
 * Contenedor "cargando": agrupa esqueletos con `role="status"` y el texto
 * accesible que anuncia que hay contenido en camino.
 */
export function contenedorCargando(hijos: ReadonlyArray<HTMLElement>, etiqueta: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'cargando bloque-estado';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', `Cargando ${etiqueta}`);
  for (const hijo of hijos) el.appendChild(hijo);
  return el;
}

export interface OpcionesVacio {
  readonly titulo: string;
  /** Qué falta. */
  readonly mensaje: string;
  /** La acción que lo resuelve. Sin acción, el vacío queda incompleto. */
  readonly accionTexto?: string;
  readonly accionHref?: string;
  readonly alAccionar?: () => void;
}

/** Estado vacío: explica qué falta y ofrece la acción que lo resuelve. */
export function estadoVacio(opciones: OpcionesVacio): HTMLElement {
  const el = document.createElement('div');
  el.className = 'vacio bloque-estado';

  const titulo = document.createElement('p');
  titulo.className = 'vacio-titulo';
  titulo.textContent = opciones.titulo;
  el.appendChild(titulo);

  const mensaje = document.createElement('p');
  mensaje.className = 'vacio-mensaje';
  mensaje.textContent = opciones.mensaje;
  el.appendChild(mensaje);

  if (opciones.accionTexto) {
    if (opciones.accionHref) {
      const enlace = document.createElement('a');
      enlace.className = 'btn-borde btn';
      enlace.href = opciones.accionHref;
      enlace.textContent = opciones.accionTexto;
      el.appendChild(enlace);
    } else if (opciones.alAccionar) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-borde btn';
      boton.textContent = opciones.accionTexto;
      boton.addEventListener('click', opciones.alAccionar);
      el.appendChild(boton);
    }
  }

  return el;
}

export interface OpcionesError {
  /** Causa en lenguaje claro. ⛔ Nunca un código HTTP, una tabla ni una traza. */
  readonly mensaje: string;
  readonly alReintentar: () => void;
}

/** Estado de error: causa clara + "Volver a intentar". `role="alert"`. */
export function estadoError(opciones: OpcionesError): HTMLElement {
  const el = document.createElement('div');
  el.className = 'error bloque-estado';
  el.setAttribute('role', 'alert');

  const titulo = document.createElement('p');
  titulo.className = 'error-titulo';
  titulo.textContent = 'Esto no cargó';
  el.appendChild(titulo);

  const mensaje = document.createElement('p');
  mensaje.className = 'error-mensaje';
  mensaje.textContent = opciones.mensaje;
  el.appendChild(mensaje);

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn';
  boton.textContent = 'Volver a intentar';
  boton.addEventListener('click', opciones.alReintentar);
  el.appendChild(boton);

  return el;
}

/**
 * Traduce un `ErrorApi` al texto que ve el vendedor.
 * ⛔ `mensajeAmable` ya viene en castellano y sin jerga: acá sólo se agrega la
 * pista, cuando existe. Nunca se muestra `error.detalle`.
 */
export function textoDeError(error: ErrorApi): string {
  return error.pista ? `${error.mensajeAmable} ${error.pista}` : error.mensajeAmable;
}

// ---------------------------------------------------------------------------
// Orquestador: un bloque asíncrono completo, con sus cuatro estados.
// ---------------------------------------------------------------------------

export interface OpcionesBloqueAsincrono<T> {
  /** Dónde se monta el bloque. Se reemplaza su contenido en cada estado. */
  readonly contenedor: HTMLElement;
  /** Nombre del bloque, para el `aria-label` del estado de carga. */
  readonly etiqueta: string;
  /** Pide los datos. Nunca lanza: el contrato de la app resuelve en `Resultado`. */
  readonly cargar: () => Promise<Resultado<T>>;
  /** Esqueleto a mostrar mientras carga. */
  readonly renderCargando: () => ReadonlyArray<HTMLElement>;
  /**
   * `null` o `undefined` ⇒ no está vacío, se pasa a "con datos".
   * Devuelto ⇒ se muestra como estado vacío.
   */
  readonly detectarVacio?: (datos: T) => OpcionesVacio | null;
  /** Con datos: arma el contenido final. */
  readonly renderConDatos: (datos: T, contenedor: HTMLElement) => void;
  /** Se cancela si la vista se desmonta antes de que la carga termine. */
  readonly senal?: AbortSignal;
}

export interface BloqueAsincrono {
  /** Vuelve a pedir los datos y redibuja el bloque. */
  readonly recargar: () => void;
}

/**
 * Monta un bloque asíncrono completo: cargando → (vacío | error | con datos).
 * ⛔ Un bloque que falla queda con su propio estado de error: el resto de la
 * vista sigue usable (docs/DESIGN_SYSTEM.md §5.1).
 */
export function montarBloqueAsincrono<T>(opciones: OpcionesBloqueAsincrono<T>): BloqueAsincrono {
  const { contenedor } = opciones;

  function limpiar(): void {
    contenedor.replaceChildren();
  }

  function mostrarCargando(): void {
    limpiar();
    contenedor.appendChild(contenedorCargando(opciones.renderCargando(), opciones.etiqueta));
  }

  async function cargarYRenderizar(): Promise<void> {
    mostrarCargando();
    let resultado: Resultado<T>;
    try {
      resultado = await opciones.cargar();
    } catch {
      resultado = {
        ok: false,
        error: {
          codigo: 'desconocido',
          mensajeAmable: 'Esto no cargó. Probá de nuevo en un momento.',
        },
      };
    }

    if (opciones.senal?.aborted) return;

    limpiar();

    if (!resultado.ok) {
      contenedor.appendChild(
        estadoError({
          mensaje: textoDeError(resultado.error),
          alReintentar: () => void cargarYRenderizar(),
        }),
      );
      return;
    }

    const vacio = opciones.detectarVacio?.(resultado.datos);
    if (vacio) {
      contenedor.appendChild(estadoVacio(vacio));
      return;
    }

    opciones.renderConDatos(resultado.datos, contenedor);
  }

  void cargarYRenderizar();

  return { recargar: () => void cargarYRenderizar() };
}
