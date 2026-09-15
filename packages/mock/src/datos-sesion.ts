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
 * Las credenciales de ejemplo. Existen sólo mientras el Escritorio corre con
 * mock, y por eso la interfaz muestra el chip permanente "Datos de ejemplo".
 * ⛔ Sólo los dos roles del sistema: vendedor y administrador.
 */
interface CuentaDeEjemplo {
  readonly usuario: Usuario;
  readonly clave: string;
}

function usuarioDeEjemplo(
  id: Id, nombre: string, email: string, usuario: string, rol: Rol, ultimoIngresoEn: string | null,
): Usuario {
  return {
    id, nombre, email, usuario, rol,
    activo: true,
    ultimoIngresoEn,
    creadoEn: '2026-01-05T09:00:00-03:00',
    creadoPor: 'usr-sistema',
    actualizadoEn: '2026-09-01T09:00:00-03:00',
    actualizadoPor: 'usr-sistema',
    version: 1,
  };
}

export const CUENTAS_DE_EJEMPLO: ReadonlyArray<CuentaDeEjemplo> = [
  {
    usuario: usuarioDeEjemplo(
      'usr-vendedora', 'Vendedora de ejemplo', 'vendedora@ejemplo.labia',
      'vendedora', 'vendedor', '2026-09-14T17:20:00-03:00',
    ),
    clave: 'ejemplo-vendedora',
  },
  {
    usuario: usuarioDeEjemplo(
      'usr-administrador', 'Administrador de ejemplo', 'administracion@ejemplo.labia',
      'administracion', 'administrador', '2026-09-14T19:05:00-03:00',
    ),
    clave: 'ejemplo-administracion',
  },
];

/** La cuenta con la que arranca el mock, según el rol configurado. */
function cuentaPorRol(rol: Rol): CuentaDeEjemplo {
  const encontrada = CUENTAS_DE_EJEMPLO.find((c) => c.usuario.rol === rol);
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
      const cuenta = CUENTAS_DE_EJEMPLO.find(
        (c) => c.usuario.usuario === usuario.trim().toLowerCase(),
      );
      /**
       * ⛔ La comparación se hace igual exista o no la cuenta, y el error es
       *    exactamente el mismo en los dos casos: ni el mensaje ni el tiempo
       *    de respuesta pueden revelar si el usuario existe.
       */
      const valida = cuenta !== undefined && cuenta.clave === clave && cuenta.usuario.activo;
      if (!valida) {
        anotar('intento_fallido', 'usuario', ACTOR_DESCONOCIDO, null);
        return nucleo.responderError<Sesion>(ERROR_CREDENCIALES);
      }
      const sesion = aSesion(cuenta.usuario);
      abierta = sesion;
      nucleo.fijarRol(cuenta.usuario.rol);
      anotar('ingreso', 'usuario', cuenta.usuario, cuenta.usuario.id);
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
      const cuenta = CUENTAS_DE_EJEMPLO.find((c) => c.usuario.id === abierta?.usuario.id);
      if (!cuenta || cuenta.clave !== actual) {
        return nucleo.responderError<void>(ERROR_CREDENCIALES);
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
      return CUENTAS_DE_EJEMPLO.map((c) => c.usuario).filter((u) => {
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
    usuario: cuentaPorRol(rol).usuario,
    rol,
    iniciadaEn: AHORA,
    datosDeEjemplo: true,
  };
}
