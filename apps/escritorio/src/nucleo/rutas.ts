/**
 * Registro de rutas de la ÚNICA aplicación.
 *
 * ⛔ CONGELADO EN EL COMMIT BASE. NADIE LO EDITA.
 *    Éste es el archivo que, en un trabajo paralelo mal organizado, editan las
 *    seis sesiones a la vez. Acá ya trae las siete rutas con su rol: por eso
 *    nadie necesita tocarlo (docs/PARALLEL_SESSIONS.md §1).
 *
 * UNA SOLA APLICACIÓN, UN SOLO LOGIN, DOS ROLES.
 * El administrador ve las mismas seis vistas del vendedor, más #/administracion.
 *
 * ⛔ Ocultar el enlace de administración NO es protegerlo: la guardia vive en
 *    guardia-rol.ts Y en el servidor (ver api.ts).
 */

import type { Rol } from '@labia/compartido';

export interface Ruta {
  readonly ruta: string;
  readonly indice: string;
  readonly titulo: string;
  readonly modulo: string;
  /** Roles que pueden entrar. */
  readonly roles: ReadonlyArray<Rol>;
  /** Sesión responsable (docs/PARALLEL_SESSIONS.md §3). */
  readonly sesion: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  /**
   * Visible en la barra inferior de celular: 5 destinos + "Más".
   * Los cuatro de uso diario (Inicio, Planificar, Clientes, Agenda) van fijos;
   * "Más" agrupa Propuestas, Dinero y, si el rol lo permite, Administración.
   */
  readonly enBarraInferior: boolean;
}

export const RUTAS: ReadonlyArray<Ruta> = [
  { ruta: 'inicio',         indice: '01', titulo: 'Inicio',          modulo: '../vistas/inicio/vista',         roles: ['vendedor', 'administrador'], sesion: 'S2', enBarraInferior: true  },
  { ruta: 'planificar',     indice: '02', titulo: 'Planificar',      modulo: '../vistas/planificar/vista',     roles: ['vendedor', 'administrador'], sesion: 'S3', enBarraInferior: true  },
  { ruta: 'clientes',       indice: '03', titulo: 'Clientes',        modulo: '../vistas/clientes/vista',       roles: ['vendedor', 'administrador'], sesion: 'S4', enBarraInferior: true  },
  { ruta: 'agenda',         indice: '04', titulo: 'Agenda',          modulo: '../vistas/agenda/vista',         roles: ['vendedor', 'administrador'], sesion: 'S4', enBarraInferior: true  },
  { ruta: 'propuestas',     indice: '05', titulo: 'Propuestas',      modulo: '../vistas/propuestas/vista',     roles: ['vendedor', 'administrador'], sesion: 'S5', enBarraInferior: false },
  { ruta: 'dinero',         indice: '06', titulo: 'Dinero',          modulo: '../vistas/dinero/vista',         roles: ['vendedor', 'administrador'], sesion: 'S6', enBarraInferior: false },
  // ⛔ Ruta protegida: sólo administrador.
  { ruta: 'administracion', indice: '07', titulo: 'Administración',  modulo: '../vistas/administracion/vista', roles: ['administrador'],             sesion: 'S6', enBarraInferior: false },
];

/** Pantalla de ingreso: fuera del menú, sin rol requerido. */
export const RUTA_INGRESO = 'ingreso';
export const RUTA_POR_DEFECTO = 'inicio';
