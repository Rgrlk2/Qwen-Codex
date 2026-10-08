/**
 * Datos de ejemplo — dominio: sesion.
 *
 * ⛔ DUEÑO: Sesión 1. Ninguna otra sesión edita este archivo.
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse.
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén en COMMERCIAL_RULES.md §2.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 * ⛔ Sin roles fuera de vendedor y administrador.
 */

import type {
  AccionRegistrada, Capacidades, EntidadRegistrada, FiltroRegistroAcceso, FiltroUsuarios,
  Id, Pagina, RegistroAcceso, Resultado, Rol, Sesion, Usuario,
} from '@labia/compartido';

import {
  ERROR_CREDENCIALES, ERROR_NO_AUTENTICADO, type NucleoMock,
} from './nucleo';

const AHORA = '2026-09-15T08:00:00-03:00';

/**
 * Las cuentas de ejemplo del Escritorio.
 *
 * ⛔ NINGUNA CONTRASEÑA VIVE EN EL REPOSITORIO.
 *    Ni acá, ni en los mocks, ni en las pruebas, ni en el HTML, ni comentada.
 *
 * Con mock, `ingresar` acepta **cualquier clave no vacía** para una cuenta
 * activa. No es una puerta abierta por descuido: es que el mock **no guarda
 * contraseñas**, así que no hay nada contra qué comparar. Cuando se conecte la
 * autenticación real, la comparación ocurre en el servidor y esta capa no
 * cambia de forma — sólo deja de aceptar cualquier cosa.
 *
 * Las seis cuentas de vendedor y la de administración nacen con
 * `debeCambiarClave: true`: la clave inicial se entrega por fuera del código y
 * el primer ingreso real obliga a cambiarla.
 *
 * ⛔ Sólo los dos roles del sistema: vendedor y administrador.
 */
function usuarioDeEjemplo(
  id: Id, nombre: string, email: string, usuario: string, rol: Rol, ultimoIngresoEn: string | null,
): Usuario {
  return {
    id, nombre, email, usuario, rol,
    activo: true,
    /** ⛔ Todas arrancan con la clave inicial sin cambiar. */
    debeCambiarClave: true,
    ultimoIngresoEn,
    creadoEn: '2026-01-05T09:00:00-03:00',
    creadoPor: 'usr-sistema',
    actualizadoEn: '2026-09-01T09:00:00-03:00',
    actualizadoPor: 'usr-sistema',
    version: 1,
  };
}

/**
 * ⛔ Una cuenta es un `Usuario` y nada más. No existe un campo `clave`, y no
 *    debe agregarse: la verificación del repositorio lo rechaza.
 */
export const CUENTAS_DE_EJEMPLO: ReadonlyArray<Usuario> = [
  usuarioDeEjemplo(
    'usr-jpfdz', 'Juan Pablo Fernandez', 'jpfernandez@labia.com.py',
    'JPFdz', 'vendedor', '2026-09-16T17:20:00-03:00',
  ),
  usuarioDeEjemplo(
    'usr-pcrrs', 'Pablo Carreras', 'pcarreras@labia.com.py',
    'PCrrs', 'vendedor', '2026-09-16T11:40:00-03:00',
  ),
  usuarioDeEjemplo(
    'usr-ntpns', 'Natalia Pellens', 'npellens@labia.com.py',
    'NTPns', 'vendedor', '2026-09-17T09:05:00-03:00',
  ),
  usuarioDeEjemplo(
    'usr-ctrrz', 'Carlos Torres', 'ctorres@labia.com.py',
    'CTrrz', 'vendedor', '2026-09-15T16:10:00-03:00',
  ),
  usuarioDeEjemplo(
    'usr-strrz', 'Sebastián Torres', 'storres@labia.com.py',
    'STrrz', 'vendedor', null,
  ),
  usuarioDeEjemplo(
    'usr-respn', 'Ramón Espinola', 'respinola@labia.com.py',
    'REspn', 'vendedor', null,
  ),
  /**
   * La cuenta de administración. Es quien aprueba cotizaciones, firma como CEO
   * y cierra períodos: por eso existe una sola y es nominal, no genérica.
   */
  usuarioDeEjemplo(
    'usr-rgrlk', 'Rodrigo Garelik', 'rgarelik@labia.com.py',
    'RGrlk', 'administrador', '2026-09-17T19:05:00-03:00',
  ),
];

/** La cuenta con la que arranca el mock, según el rol configurado. */
function cuentaPorRol(rol: Rol): Usuario {
  const encontrada = CUENTAS_DE_EJEMPLO.find((c) => c.rol === rol);
  if (!encontrada) throw new Error(`Falta una cuenta de ejemplo para el rol ${rol}.`);
  return encontrada;
}

/**
 * Capacidades derivadas del rol.
 *
 * ⛔ Esto decide QUÉ SE DIBUJA. No es la protección: la guardia vive en el
 *    ruteo y en la capa de datos (MASTER_SPEC §1.3).
 */
export function capacidadesDeRol(rol: Rol): Capacidades {
  const admin = rol === 'administrador';
  return {
    verAdministracion: admin,
    aprobarCotizaciones: admin,
    configurarComercial: admin,
    verTodosLosClientes: admin,
    verAccesosDeVendedores: admin,
    administrarVendedores: admin,
    cerrarPeriodo: admin,
  };
}

// ---------------------------------------------------------------------------
// Registro de acceso — ⛔ append-only: sin edición ni borrado
// ---------------------------------------------------------------------------

export interface CapaSesionMock {
  ingresar(usuario: string, clave: string): Promise<Resultado<Sesion>>;
  sesionActual(): Promise<Resultado<Sesion>>;
  cerrarSesion(): Promise<Resultado<void>>;
  cambiarClave(actual: string, nueva: string): Promise<Resultado<void>>;
  capacidades(): Promise<Resultado<Capacidades>>;
  /** Sólo lectura, para Administración (§2.8) y para las pruebas de la guardia. */
  registros(filtro: FiltroRegistroAcceso, cursor?: string, limite?: number): Pagina<RegistroAcceso>;
  usuarios(filtro: FiltroUsuarios): ReadonlyArray<Usuario>;
  /** Rol de la sesión abierta; `null` sin sesión. */
  rolDeSesion(): Rol | null;
}

export function crearCapaSesionMock(nucleo: NucleoMock): CapaSesionMock {
  /** ⛔ Append-only: se agrega al final y nunca se modifica ni se borra. */
  const registro: RegistroAcceso[] = [];
  let abierta: Sesion | null = null;

  function anotar(
    accion: AccionRegistrada,
    entidadTipo: EntidadRegistrada,
    actor: { readonly id: Id; readonly nombre: string; readonly rol: Rol },
    entidadId: Id | null,
  ): void {
    registro.push({
      id: nucleo.identificador('acc'),
      actorId: actor.id,
      nombreActor: actor.nombre,
      rol: actor.rol,
      accion,
      entidadTipo,
      entidadId,
      valorAnterior: null,
      valorPosterior: null,
      ocurridoEn: new Date().toISOString(),
      origenSesion: { tipoDispositivo: 'escritorio', paisAproximado: 'PY' },
    });
  }

  /**
   * Actor de un intento fallido. ⛔ No se guarda la contraseña tecleada, y el
   * nombre queda como el texto escrito: no se resuelve contra la base, porque
   * eso mismo revelaría si el usuario existe.
   */
  const ACTOR_DESCONOCIDO = { id: 'usr-desconocido', nombre: 'desconocido', rol: 'vendedor' as const };

  function aSesion(usuario: Usuario): Sesion {
    return {
      usuario,
      rol: usuario.rol,
      iniciadaEn: new Date().toISOString(),
      /** ⛔ Con mock siempre `true`: la interfaz muestra "Datos de ejemplo". */
      datosDeEjemplo: true,
    };
  }

  return {
    async ingresar(usuario, clave) {
      const buscado = usuario.trim().toLowerCase();
      const cuenta = CUENTAS_DE_EJEMPLO.find((c) => c.usuario.toLowerCase() === buscado);
      /**
       * ⛔ El mock NO guarda contraseñas, así que no hay nada contra qué
       *    comparar: alcanza con que la clave no esté vacía. Lo que sí se
       *    conserva es la propiedad que importa — el resultado y el mensaje
       *    son idénticos exista o no la cuenta, así que ni el texto ni el
       *    tiempo de respuesta revelan si el usuario existe.
       *
       * Al conectar la autenticación real, la comparación ocurre en el
       * servidor y esta función no cambia de forma.
       */
      const hayClave = clave.trim().length > 0;
      const valida = cuenta !== undefined && hayClave && cuenta.activo;
      if (!valida) {
        anotar('intento_fallido', 'usuario', ACTOR_DESCONOCIDO, null);
        return nucleo.responderError<Sesion>(ERROR_CREDENCIALES);
      }
      const sesion = aSesion(cuenta);
      abierta = sesion;
      nucleo.fijarRol(cuenta.rol);
      anotar('ingreso', 'usuario', cuenta, cuenta.id);
      return nucleo.responder(sesion);
    },

    async sesionActual() {
      if (!abierta) return nucleo.responderError<Sesion>(ERROR_NO_AUTENTICADO);
      return nucleo.responder(abierta);
    },

    async cerrarSesion() {
      if (abierta) {
        anotar('cierre_sesion', 'usuario', abierta.usuario, abierta.usuario.id);
      }
      abierta = null;
      return nucleo.responder<void>(undefined);
    },

    async cambiarClave(actual, nueva) {
      if (!abierta) return nucleo.responderError<void>(ERROR_NO_AUTENTICADO);
      if (nueva.trim().length < 8) {
        return nucleo.responderError<void>({
          codigo: 'validacion',
          mensajeAmable: 'La contraseña nueva es demasiado corta.',
          pista: 'Usá al menos 8 caracteres.',
          campo: 'nueva',
        });
      }
      /**
       * ⛔ Tampoco acá hay una clave guardada contra la cual comparar. Se exige
       *    que la actual venga escrita y que la nueva sea distinta: el resto lo
       *    valida el servidor cuando exista.
       */
      const cuenta = CUENTAS_DE_EJEMPLO.find((c) => c.id === abierta?.usuario.id);
      if (!cuenta || actual.trim().length === 0) {
        return nucleo.responderError<void>(ERROR_CREDENCIALES);
      }
      if (nueva === actual) {
        return nucleo.responderError<void>({
          codigo: 'validacion',
          mensajeAmable: 'La contraseña nueva tiene que ser distinta de la actual.',
          campo: 'nueva',
        });
      }
      return nucleo.responder<void>(undefined);
    },

    async capacidades() {
      if (!abierta) return nucleo.responderError<Capacidades>(ERROR_NO_AUTENTICADO);
      return nucleo.responder(capacidadesDeRol(abierta.rol));
    },

    registros(filtro, cursor, limite) {
      const filtrados = registro.filter((r) => {
        if (filtro.actorId && r.actorId !== filtro.actorId) return false;
        if (filtro.accion && r.accion !== filtro.accion) return false;
        if (filtro.entidadTipo && r.entidadTipo !== filtro.entidadTipo) return false;
        if (filtro.entidadId && r.entidadId !== filtro.entidadId) return false;
        if (filtro.desde && r.ocurridoEn < filtro.desde) return false;
        if (filtro.hasta && r.ocurridoEn > filtro.hasta) return false;
        return true;
      });
      return nucleo.paginar(filtrados, cursor, limite);
    },

    usuarios(filtro) {
      return CUENTAS_DE_EJEMPLO.filter((u) => {
        if (filtro.rol && u.rol !== filtro.rol) return false;
        if (filtro.activo !== undefined && u.activo !== filtro.activo) return false;
        if (filtro.texto) {
          const texto = filtro.texto.toLowerCase();
          if (!`${u.nombre} ${u.usuario} ${u.email}`.toLowerCase().includes(texto)) return false;
        }
        return true;
      });
    },

    rolDeSesion: () => abierta?.rol ?? null,
  };
}

/** Sesión de ejemplo lista para usar, sin pasar por el ingreso. Para pruebas. */
export function sesionDeEjemplo(rol: Rol): Sesion {
  return {
    usuario: cuentaPorRol(rol),
    rol,
    iniciadaEn: AHORA,
    datosDeEjemplo: true,
  };
}
