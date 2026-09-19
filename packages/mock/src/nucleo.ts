/**
 * Núcleo del mock: latencia simulada, falla forzada, paginación y rol.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * Existe para que los cuatro estados de interfaz se puedan probar SIN backend.
 * Una vista que no puede mostrar su estado de error no está terminada.
 */

import type { ErrorApi, Pagina, Resultado, Rol } from '@labia/compartido';

export interface ConfiguracionMock {
  readonly latenciaMs: number;
  /** Fuerza el error indicado en la próxima llamada. `null` = sin falla forzada. */
  readonly fallaForzada: ErrorApi | null;
  /** Devuelve listados vacíos, para probar el estado vacío. */
  readonly forzarVacio: boolean;
  /** Rol con el que responde el mock: permite probar la guardia sin dos cuentas. */
  readonly rol: Rol;
  /** Semilla: el mock es reproducible. */
  readonly semilla: number;
}

export const CONFIGURACION_POR_DEFECTO: ConfiguracionMock = {
  latenciaMs: 350,
  fallaForzada: null,
  forzarVacio: false,
  rol: 'vendedor',
  semilla: 20260914,
};

export type Responder = <T>(datos: T) => Promise<Resultado<T>>;
export type Paginar = <T>(items: ReadonlyArray<T>, cursor?: string, limite?: number) => Pagina<T>;

/**
 * ⛔ Todo método de `CapaAdministracion` pasa por acá antes de responder.
 * Si el mock es permisivo, la guardia de rol nunca se prueba.
 */
export type ExigirAdministrador = () => Resultado<void>;

// ---------------------------------------------------------------------------
// Errores del mock, en castellano y sin jerga técnica
// ---------------------------------------------------------------------------

export const ERROR_SIN_PERMISO: ErrorApi = {
  codigo: 'sin_permiso',
  mensajeAmable: 'Esta sección no corresponde a tu rol.',
  pista: 'Administración es sólo para el rol administrador.',
};

export const ERROR_NO_AUTENTICADO: ErrorApi = {
  codigo: 'no_autenticado',
  mensajeAmable: 'Tu sesión terminó.',
  pista: 'Ingresá de nuevo con tu usuario y contraseña.',
};

export const ERROR_CREDENCIALES: ErrorApi = {
  codigo: 'credenciales_invalidas',
  /** ⛔ Genérico a propósito: no revela si el usuario existe (MASTER_SPEC §1.3). */
  mensajeAmable: 'Usuario o contraseña incorrectos.',
  pista: 'Revisá los datos e intentá otra vez.',
};

export const ERROR_SERVICIO: ErrorApi = {
  codigo: 'servicio_no_disponible',
  mensajeAmable: 'No pudimos conectarnos en este momento.',
  pista: 'Probá de nuevo en unos segundos.',
};

/**
 * Lo que devuelve un método que todavía no tiene datos de ejemplo.
 *
 * ⛔ No es un dato vacío disfrazado de éxito: es un error explícito, para que
 *    la vista muestre su estado de error en lugar de una pantalla en blanco.
 */
export function errorPendiente(sesionDuena: string, metodo: string): ErrorApi {
  return {
    codigo: 'servicio_no_disponible',
    mensajeAmable: 'Esta parte del Escritorio todavía no está disponible.',
    pista: `Los datos de ejemplo de ${sesionDuena} se incorporan al integrar.`,
    detalle: { metodo, sesionDuena },
  };
}

// ---------------------------------------------------------------------------
// Núcleo
// ---------------------------------------------------------------------------

export interface NucleoMock {
  readonly configuracion: ConfiguracionMock;
  /** Cambia la configuración en caliente: latencia, falla, vacío y rol. */
  configurar(cambios: Partial<ConfiguracionMock>): void;
  /** Rol con el que responde el mock. La guardia lo consulta en cada llamada. */
  rol(): Rol;
  fijarRol(rol: Rol): void;
  responder: Responder;
  /** Responde un error concreto, respetando la latencia. */
  responderError<T>(error: ErrorApi): Promise<Resultado<T>>;
  paginar: Paginar;
  /** Listado sensible a `forzarVacio`: devuelve `[]` cuando se prueba el vacío. */
  listar<T>(items: ReadonlyArray<T>): ReadonlyArray<T>;
  exigirAdministrador: ExigirAdministrador;
  /** Aleatoriedad reproducible: misma semilla, misma secuencia. */
  aleatorio(): number;
  identificador(prefijo: string): string;
}

/** PRNG determinístico (mulberry32): el mock es reproducible. */
function generador(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const esperar = (ms: number): Promise<void> =>
  ms <= 0 ? Promise.resolve() : new Promise((listo) => { setTimeout(listo, ms); });

const LIMITE_POR_DEFECTO = 20;

export function crearNucleoMock(inicial: Partial<ConfiguracionMock> = {}): NucleoMock {
  let configuracion: ConfiguracionMock = { ...CONFIGURACION_POR_DEFECTO, ...inicial };
  let azar = generador(configuracion.semilla);
  let contador = 0;

  /**
   * La falla forzada se consume UNA vez: así se prueba "error y después
   * reintento en verde" sin tener que reconfigurar el mock en el medio.
   */
  function tomarFallaForzada(): ErrorApi | null {
    const falla = configuracion.fallaForzada;
    if (!falla) return null;
    configuracion = { ...configuracion, fallaForzada: null };
    return falla;
  }

  const responder: Responder = async <T,>(datos: T): Promise<Resultado<T>> => {
    await esperar(configuracion.latenciaMs);
    const falla = tomarFallaForzada();
    if (falla) return { ok: false, error: falla };
    return { ok: true, datos };
  };

  async function responderError<T>(error: ErrorApi): Promise<Resultado<T>> {
    await esperar(configuracion.latenciaMs);
    tomarFallaForzada();
    return { ok: false, error };
  }

  const paginar: Paginar = <T,>(
    items: ReadonlyArray<T>,
    cursor?: string,
    limite?: number,
  ): Pagina<T> => {
    const fuente = configuracion.forzarVacio ? [] : items;
    const tamano = Math.max(1, limite ?? LIMITE_POR_DEFECTO);
    const desde = cursor ? Number.parseInt(cursor, 10) : 0;
    const inicio = Number.isFinite(desde) && desde > 0 ? desde : 0;
    const trozo = fuente.slice(inicio, inicio + tamano);
    const siguiente = inicio + tamano;
    return {
      items: trozo,
      cursor: siguiente < fuente.length ? String(siguiente) : null,
      total: fuente.length,
    };
  };

  return {
    get configuracion() { return configuracion; },
    configurar(cambios) {
      configuracion = { ...configuracion, ...cambios };
      if (cambios.semilla !== undefined) azar = generador(cambios.semilla);
    },
    rol: () => configuracion.rol,
    fijarRol(rol) { configuracion = { ...configuracion, rol }; },
    responder,
    responderError,
    paginar,
    listar: <T,>(items: ReadonlyArray<T>): ReadonlyArray<T> =>
      (configuracion.forzarVacio ? [] : items),
    /**
     * ⛔ La guardia del mock es la misma que la del servidor. Si acá fuera
     *    permisiva, QA §1.6 quedaría sin probar hasta producción.
     */
    exigirAdministrador: (): Resultado<void> =>
      configuracion.rol === 'administrador'
        ? { ok: true, datos: undefined }
        : { ok: false, error: ERROR_SIN_PERMISO },
    aleatorio: () => azar(),
    identificador(prefijo) {
      contador += 1;
      return `${prefijo}-${String(contador).padStart(4, '0')}`;
    },
  };
}
