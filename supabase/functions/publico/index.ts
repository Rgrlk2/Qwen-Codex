/**
 * El enlace del cliente. La única puerta del sistema que se abre sin sesión.
 *
 * ⛔ POR QUÉ ESTO ES UNA FUNCIÓN DE SERVIDOR Y NO UNA CONSULTA DEL NAVEGADOR:
 *    el cliente no tiene cuenta. Para leer su cotización haría falta una
 *    política que deje leer cotizaciones sin sesión, y eso abre la tabla
 *    entera. Acá el servidor valida el token, resuelve QUÉ fila corresponde y
 *    devuelve SÓLO los campos que el cliente puede ver.
 *
 * ⛔ Lo que nunca sale por acá, aunque esté en la misma fila: notas internas
 *    del vendedor, precios de lista, comisiones, el plan que lo originó, el
 *    ranking de productos, el teléfono del CEO y la imagen de las firmas.
 *
 * ⛔ La clave de servicio vive sólo en el entorno de esta función. No se
 *    escribe en el repositorio ni llega jamás al navegador.
 *
 * Ver MASTER_SPEC.md §11.2 y §11.3.
 */

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import {
  calcularAlternativas, TEXTO_ACEPTACION, TEXTOS_OPCION, type BaseCalculo,
} from './_compartido/calculo.ts';

const OPCIONES = Object.keys(TEXTOS_OPCION);
/** Las cuatro económicas congelan importes; las dos últimas no eligen plan. */
const OPCIONES_CON_IMPORTE = ['estandar', 'adelantado_12', 'adelantado_24', 'diferido'];

/** Los datos de la cotización que hacen falta para recalcular la alternativa. */
interface BaseCotizacion {
  moneda: 'PYG' | 'USD';
  setup_lista: number | null;
  setup_especial: number | null;
  mensual_lista: number | null;
  mensual_especial: number | null;
}

function baseDe(c: BaseCotizacion): BaseCalculo {
  const moneda = c.moneda;
  return {
    setupLista: { moneda, monto: Number(c.setup_lista ?? 0) },
    setupEspecial: { moneda, monto: Number(c.setup_especial ?? 0) },
    mensualLista: { moneda, monto: Number(c.mensual_lista ?? 0) },
    mensualEspecial: { moneda, monto: Number(c.mensual_especial ?? 0) },
  };
}

const CABECERAS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // ⛔ Lo que se le muestra a un cliente no se guarda en ninguna caché
  //    intermedia: una cotización revocada tiene que dejar de verse ya.
  'Cache-Control': 'no-store',
};

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });
}

/**
 * ⛔ Un solo mensaje para token inexistente, vencido, revocado y agotado.
 *    Distinguirlos le diría a quien prueba tokens al azar cuáles existieron.
 */
function enlaceNoDisponible(): Response {
  return responder({
    ok: false,
    error: {
      codigo: 'no_encontrado',
      mensajeAmable: 'Este enlace ya no está disponible. Pedile uno nuevo a quien te lo compartió.',
    },
  }, 404);
}

function validacion(mensaje: string, campo?: string): Response {
  return responder({ ok: false, error: { codigo: 'validacion', mensajeAmable: mensaje, campo } }, 400);
}

function servidor(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !clave) throw new Error('Falta la configuración del servidor.');
  return createClient(url, clave, { auth: { persistSession: false } });
}

/** El dispositivo sale del encabezado del navegador. Si no se sabe, no se inventa. */
function dispositivoDe(peticion: Request): string {
  const ua = (peticion.headers.get('user-agent') ?? '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'celular';
  if (/mozilla|chrome|safari|firefox|edge/.test(ua)) return 'escritorio';
  return 'desconocido';
}

/** País aproximado, si la red lo informa. ⛔ Nunca se guarda la IP. */
function paisDe(peticion: Request): string | null {
  const pais = peticion.headers.get('cf-ipcountry') ?? peticion.headers.get('x-vercel-ip-country');
  return pais && /^[A-Z]{2}$/.test(pais) ? pais : null;
}

interface Enlace {
  id: string;
  propuesta_id: string;
  tipo_propuesta: string;
  version_propuesta: number;
  vence_en: string;
  tope_aperturas: number | null;
  aperturas: number;
  requiere_codigo: boolean;
  revocado_en: string | null;
  respondido: boolean;
}

/**
 * Resuelve el token y decide si se puede abrir.
 *
 * Devuelve el motivo exacto para el registro de aperturas —que sí distingue—
 * y un solo mensaje para afuera.
 */
async function abrir(
  sb: SupabaseClient, token: string, codigo: string | null,
): Promise<{ enlace: Enlace } | { resultado: string }> {
  const { data } = await sb
    .from('enlace_compartido')
    .select('id, propuesta_id, tipo_propuesta, version_propuesta, vence_en, tope_aperturas, aperturas, revocado_en, requiere_codigo, respondido')
    .eq('token', token)
    .maybeSingle();

  if (!data) return { resultado: 'codigo_invalido' };
  const e = data as Enlace;

  if (e.revocado_en !== null) return { resultado: 'revocado' };
  if (new Date(e.vence_en).getTime() < Date.now()) return { resultado: 'vencido' };
  if (e.tope_aperturas !== null && e.aperturas >= e.tope_aperturas) return { resultado: 'tope_superado' };
  if (e.requiere_codigo && (codigo ?? '').trim() === '') return { resultado: 'codigo_invalido' };

  return { enlace: e };
}

/** Toda apertura queda registrada, la que salió bien y la que no. */
async function anotarApertura(
  sb: SupabaseClient, peticion: Request,
  enlaceId: string | null, tipo: string, resultado: string,
): Promise<void> {
  if (enlaceId === null) return;
  await sb.from('acceso_enlace').insert({
    enlace_id: enlaceId,
    tipo_documento: tipo,
    tipo_dispositivo: dispositivoDe(peticion),
    pais_aproximado: paisDe(peticion),
    resultado,
  });
  if (resultado === 'ok') {
    await sb.rpc('sumar_apertura', { p_enlace: enlaceId });
  }
}

// ---------------------------------------------------------------------------
// La cotización que ve el cliente
// ---------------------------------------------------------------------------

async function cotizacionPublica(
  sb: SupabaseClient, peticion: Request, token: string, codigo: string | null,
): Promise<Response> {
  const r = await abrir(sb, token, codigo);
  if ('resultado' in r) {
    const { data } = await sb.from('enlace_compartido').select('id').eq('token', token).maybeSingle();
    await anotarApertura(sb, peticion, (data as { id: string } | null)?.id ?? null, 'cotizacion', r.resultado);
    return enlaceNoDisponible();
  }
  const e = r.enlace;

  const { data: cot } = await sb
    .from('cotizacion')
    .select(`id, folio, version, estado, nombre_cliente, nombre_empresa_o_profesional,
             nombre_producto, variante, moneda, setup_lista, setup_especial,
             mensual_lista, mensual_especial, fecha_emision, fecha_validez,
             permanencia_minima_meses, tratamiento_iva, instalacion_texto,
             cotizacion_alcance ( clase, texto )`)
    .eq('id', e.propuesta_id)
    .maybeSingle();

  if (!cot) {
    await anotarApertura(sb, peticion, e.id, 'cotizacion', 'codigo_invalido');
    return enlaceNoDisponible();
  }
  const c = cot as Record<string, unknown>;

  // ⛔ G8 por tercera vez, ahora del lado del cliente: sólo lo aprobado sale.
  const estado = c.estado as string;
  if (!['aprobada', 'enviada_al_cliente', 'aceptada'].includes(estado)) {
    await anotarApertura(sb, peticion, e.id, 'cotizacion', 'codigo_invalido');
    return enlaceNoDisponible();
  }

  await anotarApertura(sb, peticion, e.id, 'cotizacion', 'ok');

  const vencida = new Date(c.fecha_validez as string).getTime() < Date.now();
  const base = baseDe(c as unknown as BaseCotizacion);

  // ⛔ Las mismas cuatro alternativas, con el mismo código que usó el vendedor.
  //    Y si la oferta venció, se muestran SIN importes: un precio vencido que
  //    se sigue viendo es una promesa que ya no se puede cumplir.
  const alternativas = vencida ? [] : calcularAlternativas(base).map((a) => ({
    codigo: a.codigo,
    nombre: a.nombre,
    totalFinal: a.totalFinal,
    setupAPagar: a.setupAPagar,
    importeCuota: a.importeCuota,
    cantidadCuotas: a.cantidadCuotas,
    mesesServicio: a.mesesServicio,
    permanenciaMinimaMeses: a.permanenciaMinimaMeses,
    formaDePago: a.formaDePago,
  }));

  const alcance = (c.cotizacion_alcance ?? []) as Array<{ clase: string; texto: string }>;
  const { data: doc } = await sb
    .from('documento_emitido')
    .select('almacenamiento_ref')
    .eq('propuesta_id', e.propuesta_id)
    .eq('version_propuesta', e.version_propuesta)
    .maybeSingle();

  const { data: constancia } = await sb
    .from('constancia_respuesta').select('id').eq('enlace_id', e.id).maybeSingle();

  return responder({
    ok: true,
    datos: {
      tipo: 'cotizacion',
      nombreCliente: (c.nombre_empresa_o_profesional as string) || (c.nombre_cliente as string),
      nombreProducto: c.nombre_producto,
      variante: c.variante,
      folio: c.folio,
      version: c.version,
      emitidaEn: c.fecha_emision,
      venceEn: c.fecha_validez,
      alternativas,
      // ⛔ El alcance viaja ENTERO y con su etiqueta. Filtrarlo por una clase
      //    ('condicion') que la base no usa dejaba al cliente sin saber qué
      //    incluye y qué no: las clases reales son incluye, no_incluye y
      //    limite.
      basesYCondiciones: [
        ...alcance.map((a) => (
          a.clase === 'incluye' ? `Incluye: ${a.texto}`
            : a.clase === 'no_incluye' ? `No incluye: ${a.texto}`
              : a.texto)),
        c.tratamiento_iva ? `IVA: ${c.tratamiento_iva}.` : null,
        c.instalacion_texto as string | null,
        c.permanencia_minima_meses
          ? `Permanencia mínima: ${c.permanencia_minima_meses} meses.`
          : null,
      ].filter(Boolean).join('\n'),
      pdfDisponible: Boolean((doc as { almacenamiento_ref: string | null } | null)?.almacenamiento_ref),
      vencida,
      // Si ya respondió, la pantalla muestra su constancia en vez del formulario.
      yaRespondio: e.respondido || constancia !== null,
    },
  });
}

// ---------------------------------------------------------------------------
// La respuesta del cliente
// ---------------------------------------------------------------------------

async function responderCotizacion(
  sb: SupabaseClient, peticion: Request, cuerpo: Record<string, unknown>,
): Promise<Response> {
  const token = String(cuerpo.token ?? '');
  const opcion = String(cuerpo.opcion ?? '');
  const clave = String(cuerpo.clave ?? '');

  // ⛔ La casilla es obligatoria y literal. Sin esto no hay constancia.
  if (cuerpo.aceptacionMarcada !== true) {
    return validacion(
      'Marcá la casilla para confirmar que revisaste la opción.', 'aceptacionMarcada',
    );
  }
  if (!OPCIONES.includes(opcion)) {
    return validacion('Elegí una de las opciones.', 'opcion');
  }
  if (clave.trim() === '') {
    return validacion('Falta la clave de la operación.', 'clave');
  }

  const r = await abrir(sb, token, String(cuerpo.codigo ?? '') || null);
  if ('resultado' in r) return enlaceNoDisponible();
  const e = r.enlace;

  // ⛔ Los importes que se congelan NO vienen del navegador: el servidor los
  //    vuelve a calcular acá, con el mismo código que usó el vendedor, sobre
  //    los precios que tiene la base. Si viajaran en el cuerpo de la petición,
  //    cualquiera podría aceptar por el monto que quisiera.
  let importes: Array<{ concepto: string; moneda: string; monto: number }> = [];
  if (OPCIONES_CON_IMPORTE.includes(opcion)) {
    const { data: cot } = await sb
      .from('cotizacion')
      .select('moneda, setup_lista, setup_especial, mensual_lista, mensual_especial')
      .eq('id', e.propuesta_id).maybeSingle();
    if (!cot) return enlaceNoDisponible();
    const elegida = calcularAlternativas(baseDe(cot as unknown as BaseCotizacion))
      .find((a) => a.codigo === opcion);
    if (!elegida) return validacion('Esa opción no existe para esta cotización.', 'opcion');
    importes = [
      { concepto: 'setup', moneda: elegida.setupAPagar.moneda, monto: elegida.setupAPagar.monto },
      { concepto: 'mensualidades', moneda: elegida.mensualidadesAPagar.moneda, monto: elegida.mensualidadesAPagar.monto },
      { concepto: 'cuota', moneda: elegida.importeCuota.moneda, monto: elegida.importeCuota.monto },
      { concepto: 'total', moneda: elegida.totalFinal.moneda, monto: elegida.totalFinal.monto },
    ];
  }

  // ⛔ NO3 · La constancia se guarda ANTES de intentar cualquier aviso, y en
  //    una sola transacción del lado de la base. Un aviso que falla no puede
  //    llevarse puesta la elección del cliente.
  const { data, error } = await sb.rpc('registrar_respuesta_del_cliente', {
    p_enlace: e.id,
    p_opcion: opcion,
    p_texto_aceptacion: TEXTO_ACEPTACION,
    p_clave: clave,
    p_importes: importes,
  });

  if (error) {
    return responder({
      ok: false,
      error: { codigo: 'servidor', mensajeAmable: 'No pudimos registrar tu elección. Probá de nuevo.' },
    }, 500);
  }

  await anotarApertura(sb, peticion, e.id, 'cotizacion', 'ok');

  // ⛔ NO4 · `constanciaGuardada` es literal `true`. Los avisos van aparte y
  //    se reintentan; su estado no cambia este campo.
  const constancia = data as Record<string, unknown>;
  return responder({
    ok: true,
    datos: {
      ...constancia,
      constanciaGuardada: true,
      naturaleza: 'constancia_comercial',
    },
  });
}

// ---------------------------------------------------------------------------
// El PDF
// ---------------------------------------------------------------------------

async function pdfPublico(
  sb: SupabaseClient, peticion: Request, token: string,
): Promise<Response> {
  const r = await abrir(sb, token, null);
  if ('resultado' in r) return enlaceNoDisponible();
  const e = r.enlace;

  const { data: doc } = await sb
    .from('documento_emitido')
    .select('almacenamiento_ref, valido_hasta')
    .eq('propuesta_id', e.propuesta_id)
    .eq('version_propuesta', e.version_propuesta)
    .maybeSingle();

  const ref = (doc as { almacenamiento_ref: string | null } | null)?.almacenamiento_ref;
  if (!ref) {
    return responder({
      ok: false,
      error: {
        codigo: 'no_encontrado',
        mensajeAmable: 'El documento todavía no está listo. Escribinos y te lo mandamos.',
      },
    }, 404);
  }

  // ⛔ Enlace firmado y de vida corta. El archivo vive en un depósito privado:
  //    no hay ninguna URL pública que sirva un PDF con firmas adentro.
  const { data: firmado, error } = await sb.storage
    .from('documentos').createSignedUrl(ref, 300);
  if (error || !firmado) return enlaceNoDisponible();

  await anotarApertura(sb, peticion, e.id, 'cotizacion', 'ok');
  return responder({
    ok: true,
    datos: { url: firmado.signedUrl, venceEn: new Date(Date.now() + 300000).toISOString() },
  });
}

// ---------------------------------------------------------------------------
// Ruteo
// ---------------------------------------------------------------------------

/**
 * La ficha que el vendedor preparó para este prospecto.
 *
 * ⛔ ACÁ NO VIAJA NI UNA LÍNEA DE COPY. El texto aprobado vive en el archivo
 *    congelado (`content/copy/`, con su huella) y llega al navegador con la
 *    propia aplicación. Lo que devuelve esta función es SÓLO la capa que armó
 *    el vendedor: qué bloques se ven, en qué orden y cuál se destaca, más lo
 *    que conversaron y su nota. Si el copy pasara por acá habría dos fuentes
 *    del mismo texto, y una de las dos se iba a quedar vieja.
 */
async function fichaPublica(
  sb: SupabaseClient, peticion: Request, token: string, codigo: string | null,
): Promise<Response> {
  const r = await abrir(sb, token, codigo);
  if ('resultado' in r) {
    const { data } = await sb.from('enlace_compartido').select('id').eq('token', token).maybeSingle();
    await anotarApertura(sb, peticion, (data as { id: string } | null)?.id ?? null, 'ficha', r.resultado);
    return enlaceNoDisponible();
  }
  const e = r.enlace;
  if (e.tipo_propuesta !== 'ficha') return enlaceNoDisponible();

  const { data: ficha } = await sb
    .from('ficha_personalizada')
    .select('id, producto_id, lo_que_conversamos, nota_del_vendedor, descartada_en, vendedor_id, personalizacion_bloque ( bloque_id, visible, orden, destacado )')
    .eq('id', e.propuesta_id)
    .maybeSingle();

  if (!ficha) {
    await anotarApertura(sb, peticion, e.id, 'ficha', 'codigo_invalido');
    return enlaceNoDisponible();
  }
  const f = ficha as Record<string, unknown>;

  // ⛔ Una ficha descartada deja de estar disponible, aunque el enlace siga
  //    vivo: el vendedor la descartó por algo.
  if (f.descartada_en !== null) {
    await anotarApertura(sb, peticion, e.id, 'ficha', 'revocado');
    return enlaceNoDisponible();
  }

  const { data: vendedor } = await sb
    .from('usuario').select('nombre').eq('id', f.vendedor_id as string).maybeSingle();

  await anotarApertura(sb, peticion, e.id, 'ficha', 'ok');

  // Nombre de pila: el cliente tiene que saber con quién habla, no leer un
  // legajo. ⛔ Ni el correo, ni el teléfono, ni el rol.
  const nombre = ((vendedor as { nombre: string } | null)?.nombre ?? '').split(' ')[0] ?? '';

  return responder({
    ok: true,
    datos: {
      productoId: f.producto_id,
      bloques: ((f.personalizacion_bloque ?? []) as Array<Record<string, unknown>>)
        .map((b) => ({
          bloqueId: b.bloque_id,
          visible: b.visible,
          orden: b.orden,
          destacado: b.destacado,
        })),
      loQueConversamos: f.lo_que_conversamos ?? null,
      notaDelVendedor: f.nota_del_vendedor ?? null,
      nombreVendedor: nombre,
    },
  });
}

Deno.serve(async (peticion) => {
  if (peticion.method === 'OPTIONS') return new Response(null, { headers: CABECERAS });

  const url = new URL(peticion.url);
  const accion = url.pathname.split('/').filter(Boolean).pop() ?? '';
  const token = url.searchParams.get('t') ?? '';
  const codigo = url.searchParams.get('c');

  let sb: SupabaseClient;
  try {
    sb = servidor();
  } catch {
    return responder({
      ok: false,
      error: { codigo: 'servidor', mensajeAmable: 'El servicio no está disponible.' },
    }, 503);
  }

  try {
    if (peticion.method === 'POST' && accion === 'respuesta') {
      return await responderCotizacion(sb, peticion, await peticion.json());
    }
    if (peticion.method !== 'GET') return responder({ ok: false }, 405);
    if (token.trim() === '') return enlaceNoDisponible();

    switch (accion) {
      case 'cotizacion': return await cotizacionPublica(sb, peticion, token, codigo);
      case 'ficha':      return await fichaPublica(sb, peticion, token, codigo);
      case 'pdf':        return await pdfPublico(sb, peticion, token);
      case 'constancia': {
        const r = await abrir(sb, token, codigo);
        if ('resultado' in r) return enlaceNoDisponible();
        const { data } = await sb
          .from('constancia_respuesta')
          .select('*, importe_aceptado ( concepto, moneda, monto )')
          .eq('enlace_id', r.enlace.id).maybeSingle();
        return responder({ ok: true, datos: data ?? null });
      }
      default: return responder({ ok: false }, 404);
    }
  } catch {
    // ⛔ Nunca se devuelve el error crudo: al cliente no le sirve y al que
    //    prueba tokens le dice de más.
    return responder({
      ok: false,
      error: { codigo: 'servidor', mensajeAmable: 'Algo falló de nuestro lado. Probá de nuevo.' },
    }, 500);
  }
});
