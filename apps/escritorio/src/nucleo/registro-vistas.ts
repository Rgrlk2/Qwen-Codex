/**
 * Registro de las SEIS vistas del vendedor.
 *
 * ⛔ COMPLETO DESDE FASE 0. NADIE LO EDITA.
 *
 * Éste es el archivo que, en un trabajo paralelo mal organizado, editan las seis
 * sesiones a la vez. Acá ya trae las seis rutas: por eso nadie necesita tocarlo
 * y el conflicto desaparece por construcción (docs/PARALLEL_SESSIONS.md §7).
 *
 * Cada sesión implementa su propio `vistas/<ruta>/vista.ts` y nada más.
 */

export interface EntradaVista {
  readonly ruta: string;
  readonly indice: string;
  readonly titulo: string;
  /** Módulo que implementa la vista. Lo escribe la sesión dueña. */
  readonly modulo: string;
  /** Sesión responsable, según docs/PARALLEL_SESSIONS.md §3. */
  readonly sesion: 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  /** Visible en la barra inferior de celular (5 destinos + "Más"). */
  readonly enBarraInferior: boolean;
}

export const VISTAS: ReadonlyArray<EntradaVista> = [
  { ruta: 'dia',         indice: '01', titulo: 'Mi Día',          modulo: '../vistas/dia/vista',         sesion: 'S2', enBarraInferior: true  },
  { ruta: 'cartera',     indice: '02', titulo: 'Mi Cartera',      modulo: '../vistas/cartera/vista',     sesion: 'S3', enBarraInferior: true  },
  { ruta: 'portafolio',  indice: '03', titulo: 'Mi Portafolio',   modulo: '../vistas/portafolio/vista',  sesion: 'S4', enBarraInferior: true  },
  { ruta: 'propuestas',  indice: '04', titulo: 'Mis Propuestas',  modulo: '../vistas/propuestas/vista',  sesion: 'S5', enBarraInferior: true  },
  { ruta: 'seguimiento', indice: '05', titulo: 'Mi Seguimiento',  modulo: '../vistas/seguimiento/vista', sesion: 'S2', enBarraInferior: false },
  { ruta: 'dinero',      indice: '06', titulo: 'Mi Dinero',       modulo: '../vistas/dinero/vista',      sesion: 'S6', enBarraInferior: false },
];

export const RUTA_POR_DEFECTO = 'dia';
