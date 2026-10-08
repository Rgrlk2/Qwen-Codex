/**
 * Guardia de rol del ruteo.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * ESTO ES LA MITAD DE LA PROTECCIÓN, NO TODA.
 * La otra mitad está en el servidor: todo método de `CapaAdministracion`
 * llamado por un vendedor devuelve `sin_permiso`, aunque la interfaz nunca
 * haya mostrado el enlace. Ocultar un enlace no protege una ruta.
 *
 * Comportamiento esperado ante una ruta no permitida:
 *   - NO pantalla en blanco;
 *   - NO redirección silenciosa que confunda;
 *   - mensaje claro de que esa sección no corresponde a su rol, y vuelta a Inicio.
 */

import type { Rol } from '@labia/compartido';
import { RUTAS, RUTA_INGRESO, RUTA_POR_DEFECTO, type Ruta } from './rutas';

/**
 * Lo que la guardia decide. Es una unión discriminada a propósito: el llamador
 * no puede "olvidarse" de tratar el rechazo, porque no hay un `boolean` que
 * ignorar.
 */
export type Acceso =
  /** La pantalla de ingreso: pública, sin rol. */
  | { readonly tipo: 'ingreso' }
  | { readonly tipo: 'permitida'; readonly ruta: Ruta }
  /** Existe, pero no para este rol. ⛔ Se informa; no se redirige en silencio. */
  | { readonly tipo: 'sin_permiso'; readonly ruta: Ruta; readonly rol: Rol; readonly mensaje: string; readonly pista: string }
  /** No existe ninguna ruta con ese nombre. */
  | { readonly tipo: 'desconocida'; readonly solicitada: string; readonly mensaje: string; readonly pista: string };

export const MENSAJE_SIN_PERMISO = 'Esta sección no corresponde a tu rol.';
export const PISTA_SIN_PERMISO =
  'Administración es sólo para el rol administrador. Podés volver a Inicio y seguir trabajando.';
export const MENSAJE_RUTA_DESCONOCIDA = 'Esa dirección no existe en el Escritorio.';
export const PISTA_RUTA_DESCONOCIDA = 'Revisá el enlace o volvé a Inicio.';

/** Extrae el nombre de ruta de un hash: `#/agenda?x=1` ⇒ `agenda`. */
export function rutaDesdeHash(hash: string): string {
  const sinNumeral = hash.replace(/^#/, '');
  const sinBarra = sinNumeral.replace(/^\/+/, '');
  const limpio = sinBarra.split('?')[0] ?? '';
  return limpio.split('/')[0] ?? '';
}

export function buscarRuta(nombre: string): Ruta | null {
  return RUTAS.find((r) => r.ruta === nombre) ?? null;
}

/** ⛔ Única fuente de verdad de "¿este rol puede entrar acá?". */
export function rolPuedeEntrar(ruta: Ruta, rol: Rol): boolean {
  return ruta.roles.includes(rol);
}

/**
 * Las rutas que la interfaz puede dibujar para este rol.
 *
 * ⛔ Esto decide QUÉ SE DIBUJA, nada más. No es la protección: un vendedor que
 *    escribe #/administracion a mano pasa por `resolverAcceso`, y una llamada a
 *    `CapaAdministracion` pasa por el servidor. Las tres capas dicen lo mismo.
 */
export function rutasVisibles(rol: Rol): ReadonlyArray<Ruta> {
  return RUTAS.filter((r) => rolPuedeEntrar(r, rol));
}

/**
 * Resuelve un hash contra un rol.
 *
 * `rol === null` significa "sin sesión": todo cae a la pantalla de ingreso.
 */
export function resolverAcceso(hash: string, rol: Rol | null): Acceso {
  const solicitada = rutaDesdeHash(hash);

  if (rol === null) return { tipo: 'ingreso' };
  if (solicitada === RUTA_INGRESO) return { tipo: 'ingreso' };

  const nombre = solicitada === '' ? RUTA_POR_DEFECTO : solicitada;
  const ruta = buscarRuta(nombre);

  if (!ruta) {
    return {
      tipo: 'desconocida',
      solicitada: nombre,
      mensaje: MENSAJE_RUTA_DESCONOCIDA,
      pista: PISTA_RUTA_DESCONOCIDA,
    };
  }

  if (!rolPuedeEntrar(ruta, rol)) {
    return {
      tipo: 'sin_permiso',
      ruta,
      rol,
      mensaje: MENSAJE_SIN_PERMISO,
      pista: PISTA_SIN_PERMISO,
    };
  }

  return { tipo: 'permitida', ruta };
}

/** Hash canónico de una ruta, para construir enlaces. */
export function hashDeRuta(nombre: string): string {
  return `#/${nombre}`;
}

export const HASH_INGRESO = hashDeRuta(RUTA_INGRESO);
export const HASH_POR_DEFECTO = hashDeRuta(RUTA_POR_DEFECTO);
