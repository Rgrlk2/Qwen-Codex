/**
 * Los avisos de una respuesta del cliente. NO1 a NO4.
 *
 * ⛔ NO1 · El celular personal del CEO no aparece en el enlace, ni en el PDF,
 *    ni en el código del navegador, ni en esta respuesta. La cola guarda
 *    `destino_protegido = 'ceo'`, una referencia; el número real se lee de una
 *    variable de entorno de esta función y no sale de acá.
 * ⛔ NO2 · Lo único que se puede consultar desde afuera es SI está configurado.
 * ⛔ NO3 · La constancia ya está escrita antes de que esto corra.
 * ⛔ NO4 · Un fallo de aviso reintenta y NUNCA toca la constancia.
 *
 * Ver MASTER_SPEC.md §11.3 y DATA_MODEL.md NO1–NO4.
 */

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const CABECERAS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

/** Espera creciente entre intentos, hasta rendirse a los seis. */
const ESPERA_MINUTOS = [1, 5, 15, 60, 240];
const INTENTOS_MAXIMOS = ESPERA_MINUTOS.length + 1;

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });
}

interface Destino { readonly numero: string | null; readonly comoSeLlama: string; }

/**
 * Resuelve a dónde va cada aviso. ⛔ El valor devuelto NO se registra ni se
 * devuelve: se usa para llamar al proveedor y se descarta.
 */
async function resolver(sb: SupabaseClient, referencia: string): Promise<Destino> {
  if (referencia === 'ceo') {
    return { numero: Deno.env.get('CELULAR_CEO') ?? null, comoSeLlama: 'celular del CEO' };
  }
  if (referencia === 'corporativo') {
    // Público y documentado en la guía de marca: no es un secreto.
    return { numero: Deno.env.get('WHATSAPP_CORPORATIVO') ?? null, comoSeLlama: 'WhatsApp corporativo' };
  }
  if (referencia.startsWith('vendedor:')) {
    const id = referencia.slice('vendedor:'.length);
    const { data } = await sb
      .from('usuario').select('nombre, telefono').eq('id', id).maybeSingle();
    const u = data as { nombre: string; telefono: string | null } | null;
    return {
      numero: u?.telefono ?? null,
      comoSeLlama: `celular de ${u?.nombre ?? 'el vendedor'}`,
    };
  }
  return { numero: null, comoSeLlama: referencia };
}

/**
 * Manda el mensaje por el proveedor configurado.
 *
 * ⛔ TODAVÍA NO HAY PROVEEDOR ELEGIDO, y no se simula uno. Marcar "enviada"
 *    una notificación que nadie mandó sería peor que dejarla pendiente: el
 *    vendedor creería que al cliente ya lo llamaron. Mientras no exista
 *    `PROVEEDOR_MENSAJES`, esto falla con un motivo claro y la cola reintenta.
 */
async function enviar(destino: Destino, texto: string): Promise<{ ok: boolean; error?: string }> {
  const proveedor = Deno.env.get('PROVEEDOR_MENSAJES');
  const clave = Deno.env.get('PROVEEDOR_MENSAJES_CLAVE');

  if (!proveedor || !clave) {
    return { ok: false, error: 'Sin proveedor de mensajería configurado.' };
  }
  if (destino.numero === null) {
    return { ok: false, error: `Sin destino configurado para ${destino.comoSeLlama}.` };
  }

  try {
    const r = await fetch(proveedor, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
      body: JSON.stringify({ to: destino.numero, text: texto }),
    });
    if (!r.ok) return { ok: false, error: `El proveedor contestó ${r.status}.` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `No se pudo contactar al proveedor: ${(e as Error).name}.` };
  }
}

Deno.serve(async (peticion) => {
  const url = Deno.env.get('SUPABASE_URL');
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !servicio) return responder({ ok: false }, 503);
  const sb = createClient(url, servicio, { auth: { persistSession: false } });

  // NO2 · Lo único consultable desde afuera: si está configurado, no cuál es.
  if (new URL(peticion.url).searchParams.get('estado') === 'destinos') {
    return responder({
      ok: true,
      datos: {
        celularCeoConfigurado: Boolean(Deno.env.get('CELULAR_CEO')),
        whatsappCorporativoConfigurado: Boolean(Deno.env.get('WHATSAPP_CORPORATIVO')),
        proveedorConfigurado: Boolean(Deno.env.get('PROVEEDOR_MENSAJES')),
      },
    });
  }

  const { data: pendientes } = await sb
    .from('notificacion')
    .select(`id, canal, destino_protegido, intentos, constancia_id,
             constancia_respuesta ( nombre_cliente, folio, version_cotizacion, opcion_seleccionada )`)
    .in('estado', ['pendiente', 'fallida'])
    .lt('intentos', INTENTOS_MAXIMOS)
    .or(`proximo_intento_en.is.null,proximo_intento_en.lte.${new Date().toISOString()}`)
    .limit(50);

  let enviadas = 0;
  let fallidas = 0;

  for (const n of (pendientes ?? []) as Array<Record<string, unknown>>) {
    const c = n.constancia_respuesta as Record<string, unknown> | null;
    const texto = c
      ? `${c.nombre_cliente} respondió la cotización ${c.folio} v${c.version_cotizacion}: `
        + `eligió "${c.opcion_seleccionada}".`
      : 'Un cliente respondió una cotización.';

    const destino = await resolver(sb, String(n.destino_protegido));
    const r = await enviar(destino, texto);
    const intentos = Number(n.intentos ?? 0) + 1;

    if (r.ok) {
      await sb.from('notificacion').update({
        estado: 'enviada', intentos,
        ultimo_intento_en: new Date().toISOString(),
        proximo_intento_en: null, error: null,
      }).eq('id', n.id as string);
      enviadas += 1;
    } else {
      // ⛔ NO4 · La constancia no se toca. Sólo la cola.
      const agotada = intentos >= INTENTOS_MAXIMOS;
      const espera = ESPERA_MINUTOS[Math.min(intentos - 1, ESPERA_MINUTOS.length - 1)];
      await sb.from('notificacion').update({
        estado: agotada ? 'agotada' : 'fallida',
        intentos,
        ultimo_intento_en: new Date().toISOString(),
        proximo_intento_en: agotada
          ? null
          : new Date(Date.now() + espera * 60_000).toISOString(),
        // ⛔ El motivo describe el fallo. Nunca incluye el número de destino.
        error: r.error ?? 'Fallo sin detalle.',
      }).eq('id', n.id as string);
      fallidas += 1;
    }
  }

  return responder({ ok: true, datos: { enviadas, fallidas, revisadas: (pendientes ?? []).length } });
});
