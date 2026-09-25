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
  BloqueFichaId, CapaPublica, ClaveIdempotencia, ConstanciaRespuesta,
  CotizacionPublica, FichaPublica, ISODate, Moneda,
  PersonalizacionBloque, PrecioPreparado, PresentacionPublica, ProductoId,
  RespuestaDelCliente, Resultado,
} from '@labia/compartido';
import {
  COPY_DE_LOS_TRECE, fichaOficialDe, fichaPublicaDe, huellaDelCopy, indiceDe, logoDe,
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

function bien<T>(datos: T): Resultado<T> {
  return { ok: true, datos };
}

/** Lo que el servidor manda de una ficha: la capa, nunca el texto. */
interface CapaDeFicha {
  readonly productoId: ProductoId;
  readonly bloques: ReadonlyArray<{
    readonly bloqueId: string;
    readonly visible: boolean;
    readonly orden: number;
    readonly destacado: boolean;
  }>;
  readonly loQueConversamos: string | null;
  readonly notaDelVendedor: string | null;
  /** El precio referencial del vendedor. Nulo ⇒ se muestra el del copy. */
  readonly precio: {
    readonly moneda: Moneda;
    readonly setup: number | null;
    readonly mensual: number | null;
    readonly aclaracion: string | null;
  } | null;
  readonly nombreVendedor: string;
}

/** Del sobre del servidor al tipo del dominio. ⛔ Sin moneda no hay precio. */
function aPrecioPreparado(p: CapaDeFicha['precio']): PrecioPreparado | null {
  if (!p) return null;
  const moneda = p.moneda;
  return {
    setup: p.setup === null ? null : { monto: p.setup, moneda },
    mensual: p.mensual === null ? null : { monto: p.mensual, moneda },
    aclaracion: p.aclaracion,
  };
}

/**
 * Las trece fichas oficiales, armadas del copy congelado.
 *
 * ⛔ La huella la calcula la misma función que la capa autenticada: si el copy
 *    cambiara, cambia la huella, y el vendedor se entera. Acá no se recalcula
 *    nada ni se reescribe una coma.
 */
const FICHAS_OFICIALES: ReadonlyMap<ProductoId, ReturnType<typeof fichaOficialDe>> = new Map(
  COPY_DE_LOS_TRECE.map((copy) => [
    copy.productoId,
    fichaOficialDe(copy, logoDe(copy.productoId), huellaDelCopy(copy.bruto), 1),
  ]),
);


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

    async obtenerPresentacionPublica(token: string, codigo?: string) {
      // ⛔ Del servidor vienen los IDENTIFICADORES de los productos y los dos
      //    textos del vendedor. El copy aprobado lo pone esta aplicación desde
      //    el archivo congelado: una sola fuente del texto, igual que la ficha.
      const c = codigo ? `&c=${encodeURIComponent(codigo)}` : '';
      return llamar<PresentacionPublica>(
        `presentacion?t=${encodeURIComponent(token)}${c}`,
      );
    },

    async obtenerFichaPublica(token: string) {
      // ⛔ Del servidor viene SÓLO la capa que armó el vendedor. El copy sale
      //    del archivo congelado que ya trae la aplicación: una sola fuente
      //    del texto aprobado, y no una copia en la base que se quede vieja.
      const capa = await llamar<CapaDeFicha>(`ficha?t=${encodeURIComponent(token)}`);
      if (!capa.ok) return capa as Resultado<FichaPublica>;

      const oficial = FICHAS_OFICIALES.get(capa.datos.productoId);
      if (!oficial) {
        // El enlace nombra un producto que este portafolio no tiene. No se
        // improvisa una ficha: se dice.
        return todaviaNo<FichaPublica>(
          'No pudimos abrir esta ficha. Pedile una nueva a quien te la compartió.',
        );
      }

      return bien(fichaPublicaDe(
        oficial,
        {
          id: '', productoId: capa.datos.productoId, clienteId: '', vendedorId: '',
          planId: null,
          bloques: capa.datos.bloques.map((b): PersonalizacionBloque => ({
            bloqueId: b.bloqueId as BloqueFichaId,
            visible: b.visible,
            orden: b.orden,
            destacado: b.destacado,
          })),
          loQueConversamos: capa.datos.loQueConversamos,
          notaDelVendedor: capa.datos.notaDelVendedor,
          precio: aPrecioPreparado(capa.datos.precio),
          huellaCopy: oficial.huellaCopy,
          // ⛔ La trazabilidad de la ficha es del Escritorio, no del cliente:
          //    acá se arma sólo lo que `fichaPublicaDe` necesita para elegir y
          //    ordenar bloques. Nada de esto se le muestra a nadie.
          version: oficial.versionCatalogo,
          creadoEn: '', creadoPor: '', actualizadoEn: '', actualizadoPor: '',
        },
        capa.datos.nombreVendedor,
      ));
    },

    async obtenerIndicePublico() {
      // El índice sale del mismo copy congelado: es público por definición y
      // no necesita ni token ni servidor.
      return bien(indiceDe([...FICHAS_OFICIALES.values()]));
    },
  };
}
