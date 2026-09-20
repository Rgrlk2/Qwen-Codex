/**
 * `CapaPublica` contra la función de servidor `publico`.
 *
 * ⛔ POR QUÉ NO CONSULTA LA BASE DIRECTO, COMO EL RESTO DE LAS CAPAS: el
 *    cliente no tiene sesión. Dejarle leer la tabla de cotizaciones sin
 *    sesión abriría la tabla entera. El servidor valida el token y devuelve
 *    sólo lo que ese cliente puede ver.
 *
 * ⛔ Lo único que este archivo sabe es el token que viene en la URL. No conoce
 *    ningún identificador interno, y por eso no puede pedir nada más.
 */

import type {
  CapaPublica, ClaveIdempotencia, ConstanciaRespuesta, CotizacionPublica,
  FichaPublica, IndicePortafolio, ISODate, PresentacionPublica,
  RespuestaDelCliente, Resultado,
} from '@labia/compartido';

interface EntornoPublico {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

function entorno(): EntornoPublico {
  return (import.meta as unknown as { readonly env?: EntornoPublico }).env ?? {};
}

const NO_DISPONIBLE = {
  codigo: 'no_encontrado' as const,
  mensajeAmable: 'Este enlace ya no está disponible. Pedile uno nuevo a quien te lo compartió.',
};

/**
 * Una llamada a la función. ⛔ Nunca propaga el error crudo del servidor: al
 * cliente no le sirve, y a quien prueba tokens le diría de más.
 */
async function llamar<T>(
  ruta: string, opciones?: { readonly cuerpo?: unknown },
): Promise<Resultado<T>> {
  const env = entorno();
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    return { ok: false, error: {
      codigo: 'servicio_no_disponible',
      mensajeAmable: 'No pudimos abrir el documento. Escribinos y te lo mandamos.',
    } };
  }

  try {
    const respuesta = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/publico/${ruta}`, {
      method: opciones?.cuerpo === undefined ? 'GET' : 'POST',
      headers: {
        // ⛔ Una sola cabecera, y es la clave PUBLICABLE (`sb_publishable_…`):
        //    está pensada para viajar al navegador y por sí sola no abre
        //    ningún dato. Quien decide qué se ve es el servidor, con el token.
        //
        // ⛔ No se arma ninguna cabecera de autorización a mano. En este
        //    archivo no hay —ni puede haber— nada que se parezca a una
        //    credencial: `npm run verificar:portafolio` falla si aparece.
        apikey: env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      ...(opciones?.cuerpo === undefined ? {} : { body: JSON.stringify(opciones.cuerpo) }),
    });

    const datos = await respuesta.json() as
      { ok: true; datos: T } | { ok: false; error: { codigo: string; mensajeAmable: string } };

    if (datos.ok) return { ok: true, datos: datos.datos };
    return { ok: false, error: {
      codigo: (datos.error.codigo ?? 'desconocido') as ConstanciaError,
      mensajeAmable: datos.error.mensajeAmable ?? NO_DISPONIBLE.mensajeAmable,
    } };
  } catch {
    return { ok: false, error: {
      codigo: 'servicio_no_disponible',
      mensajeAmable: 'No pudimos conectarnos. Probá de nuevo en un momento.',
    } };
  }
}

type ConstanciaError = Resultado<unknown> extends { ok: false; error: infer E }
  ? E extends { codigo: infer C } ? C : never : never;

function todaviaNo<T>(mensaje: string): Resultado<T> {
  return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: mensaje } };
}

export function crearCapaPublicaSupabase(): CapaPublica {
  return {
    async obtenerCotizacionPublica(token: string, codigo?: string) {
      const c = codigo ? `&c=${encodeURIComponent(codigo)}` : '';
      return llamar<CotizacionPublica>(`cotizacion?t=${encodeURIComponent(token)}${c}`);
    },

    async responderCotizacion(
      token: string, respuesta: RespuestaDelCliente, clave: ClaveIdempotencia,
    ) {
      // ⛔ La casilla viaja tal cual la marcó el cliente. El servidor la vuelve
      //    a exigir: acá no se completa ni se asume.
      return llamar<ConstanciaRespuesta>('respuesta', {
        cuerpo: {
          token,
          opcion: respuesta.opcion,
          aceptacionMarcada: respuesta.aceptacionMarcada,
          clave,
        },
      });
    },

    async obtenerConstanciaPublica(token: string) {
      return llamar<ConstanciaRespuesta | null>(`constancia?t=${encodeURIComponent(token)}`);
    },

    async descargarPdfPublico(token: string) {
      // El servidor devuelve un enlace firmado de cinco minutos. ⛔ Nunca una
      // URL pública: el PDF lleva las firmas incrustadas.
      return llamar<{ url: string; venceEn: ISODate }>(`pdf?t=${encodeURIComponent(token)}`);
    },

    async obtenerPresentacionPublica(_token: string, _codigo?: string) {
      // ⛔ Una presentación no es una cotización: no lleva precios cerrados ni
      //    firmas, y su documento público todavía no está armado. Antes que
      //    mostrarle al cliente una pantalla a medias, se dice.
      return todaviaNo<PresentacionPublica>(
        'Esta presentación todavía no se puede ver por enlace. Pedísela a quien te la compartió.',
      );
    },

    async obtenerFichaPublica(_token: string) {
      return todaviaNo<FichaPublica>(
        'Esta ficha todavía no se puede ver por enlace. Pedísela a quien te la compartió.',
      );
    },

    async obtenerIndicePublico() {
      return todaviaNo<IndicePortafolio>('El portafolio público todavía no está publicado.');
    },
  };
}
