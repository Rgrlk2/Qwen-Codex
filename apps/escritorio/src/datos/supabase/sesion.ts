/**
 * Sesión contra Supabase Auth — contraseñas de verdad.
 *
 * Lo que cambia respecto de los datos de ejemplo: la contraseña ahora SE
 * VERIFICA. El mock aceptaba cualquiera que no estuviera vacía; acá la
 * comprueba el servidor contra un resumen criptográfico, y el navegador nunca
 * ve nada parecido a una clave guardada.
 *
 * ⛔ MASTER_SPEC §1.3 · El error de ingreso es GENÉRICO. Nunca se revela si el
 *    usuario existe: "usuario o contraseña incorrectos" para los dos casos.
 *    Decir "ese usuario no existe" le regala a un atacante la mitad del
 *    trabajo.
 */

import type { Capacidades, Resultado, Rol, Sesion, Usuario } from '@labia/compartido';
import { capacidadesDeRol } from '@labia/mock';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { COLUMNAS_TRAZADO, aTrazado, type FilaTrazado } from './trazado';

/** Fila de `public.usuario` tal como la devuelve la base. */
interface FilaUsuario extends FilaTrazado {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
  readonly usuario: string;
  readonly rol: Rol;
  readonly activo: boolean;
  readonly debe_cambiar_clave: boolean;
  readonly ultimo_ingreso_en: string | null;
}

const COLUMNAS_USUARIO =
  `id, nombre, email, usuario, rol, activo, debe_cambiar_clave, ultimo_ingreso_en, ${COLUMNAS_TRAZADO}`;

function aUsuario(f: FilaUsuario): Usuario {
  return {
    ...aTrazado(f),
    id: f.id,
    nombre: f.nombre,
    email: f.email,
    usuario: f.usuario,
    rol: f.rol,
    activo: f.activo,
    debeCambiarClave: f.debe_cambiar_clave,
    ultimoIngresoEn: f.ultimo_ingreso_en,
  };
}

/**
 * ⛔ El mensaje de ingreso fallido, uno solo para todos los casos.
 *    Usuario inexistente, contraseña equivocada o cuenta desactivada dan
 *    exactamente la misma respuesta.
 */
const CREDENCIALES_INVALIDAS: Resultado<never> = {
  ok: false,
  error: {
    codigo: 'credenciales_invalidas',
    mensajeAmable: 'Usuario o contraseña incorrectos.',
    pista: 'Revisá que no tengas activado el bloqueo de mayúsculas.',
  },
};

/**
 * Dominio interno de las credenciales. ⛔ No es un correo que exista ni al
 * que se le mande nada: es sólo la forma que Supabase Auth necesita para
 * identificar una cuenta. El correo real de la persona vive en
 * `public.usuario.email` y se usa para mostrar y para avisos.
 */
const DOMINIO_DE_CREDENCIALES = '@usuarios.labia.local';

/**
 * El vendedor escribe su USUARIO (`JPFdz`), no un correo. Supabase Auth
 * trabaja con correo, así que se DERIVA del usuario.
 *
 * ⛔ Se deriva, no se consulta. Una consulta "¿qué correo tiene este
 *    usuario?" sería un oráculo: cualquiera podría averiguar qué usuarios
 *    existen probando nombres, y eso es la mitad del trabajo de entrar.
 *    Derivándolo, un usuario inexistente y una contraseña equivocada
 *    recorren exactamente el mismo camino y tardan lo mismo.
 */
function correoDe(usuario: string): string {
  return `${usuario.trim().toLowerCase()}${DOMINIO_DE_CREDENCIALES}`;
}

export interface CapaSesionSupabase {
  ingresar(usuario: string, clave: string): Promise<Resultado<Sesion>>;
  sesionActual(): Promise<Resultado<Sesion>>;
  cerrarSesion(): Promise<Resultado<void>>;
  cambiarClave(actual: string, nueva: string): Promise<Resultado<void>>;
  capacidades(): Promise<Resultado<Capacidades>>;
}

export function crearCapaSesionSupabase(): CapaSesionSupabase {
  async function perfilDeLaSesion(): Promise<Resultado<Sesion>> {
    const sb = supabase();
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) {
      return { ok: false, error: { codigo: 'no_autenticado', mensajeAmable: 'Tu sesión venció. Volvé a entrar.' } };
    }

    const { data, error } = await sb
      .from('usuario')
      .select(COLUMNAS_USUARIO)
      .eq('id', auth.user.id)
      .maybeSingle();

    if (error) return fallo<Sesion>(error);
    if (!data) {
      // Tiene credencial pero no perfil: la cuenta no está habilitada en el
      // Escritorio. Se cierra la sesión para no dejarlo en un limbo.
      await sb.auth.signOut();
      return { ok: false, error: {
        codigo: 'sin_permiso',
        mensajeAmable: 'Tu cuenta todavía no está habilitada en el Escritorio.',
        pista: 'Avisale a Administración para que te dé de alta.',
      } };
    }

    const fila = data as FilaUsuario;
    if (!fila.activo) {
      await sb.auth.signOut();
      return { ok: false, error: {
        codigo: 'sin_permiso',
        mensajeAmable: 'Tu cuenta está desactivada.',
      } };
    }

    return bien<Sesion>({
      usuario: aUsuario(fila),
      rol: fila.rol,
      iniciadaEn: new Date().toISOString(),
      // ⛔ Con servidor real esto es FALSO, y por eso desaparece el chip
      //    "Datos de ejemplo". Es la señal de que lo que se ve es real.
      datosDeEjemplo: false,
    });
  }

  return {
    async ingresar(usuario, clave) {
      const sb = supabase();

      if (usuario.trim().length === 0 || clave.length === 0) {
        return { ok: false, error: {
          codigo: 'validacion',
          mensajeAmable: 'Completá usuario y contraseña.',
        } };
      }

      const { error } = await sb.auth.signInWithPassword({
        email: correoDe(usuario),
        password: clave,
      });
      // ⛔ Mismo resultado para usuario inexistente y contraseña equivocada.
      if (error) return CREDENCIALES_INVALIDAS;

      const sesion = await perfilDeLaSesion();
      if (sesion.ok) {
        // El registro de ingresos es append-only y lo escribe la base.
        await sb.rpc('registrar_ingreso');
      }
      return sesion;
    },

    sesionActual: perfilDeLaSesion,

    async cerrarSesion() {
      const { error } = await supabase().auth.signOut();
      if (error) return fallo<void>(error);
      return bien(undefined as void);
    },

    async cambiarClave(actual, nueva) {
      const sb = supabase();

      if (nueva.length < 8) {
        return { ok: false, error: {
          codigo: 'validacion',
          mensajeAmable: 'La contraseña nueva tiene que tener al menos 8 caracteres.',
        } };
      }
      if (nueva === actual) {
        return { ok: false, error: {
          codigo: 'validacion',
          mensajeAmable: 'La contraseña nueva tiene que ser distinta de la actual.',
        } };
      }

      // ⛔ Se comprueba la actual antes de cambiarla: sin esto, quien
      //    encuentre una sesión abierta se queda con la cuenta.
      const { data: auth } = await sb.auth.getUser();
      const persona = auth?.user;
      const correo = persona?.email;
      if (!persona || !correo) {
        return { ok: false, error: { codigo: 'no_autenticado', mensajeAmable: 'Tu sesión venció. Volvé a entrar.' } };
      }
      const { error: verificacion } = await sb.auth.signInWithPassword({ email: correo, password: actual });
      if (verificacion) {
        return { ok: false, error: {
          codigo: 'credenciales_invalidas',
          mensajeAmable: 'La contraseña actual no es correcta.',
        } };
      }

      const { error } = await sb.auth.updateUser({ password: nueva });
      if (error) return fallo<void>(error);

      await sb.from('usuario').update({ debe_cambiar_clave: false }).eq('id', persona.id);
      return bien(undefined as void);
    },

    async capacidades() {
      const sesion = await perfilDeLaSesion();
      if (!sesion.ok) return sesion as Resultado<Capacidades>;
      // ⛔ Las capacidades dibujan la interfaz. NO son la guardia: la de
      //    verdad está en las políticas de la base, y no se puede engañar
      //    devolviendo `true` acá.
      return bien(capacidadesDeRol(sesion.datos.rol));
    },
  };
}
