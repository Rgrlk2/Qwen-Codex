/**
 * El PDF definitivo de una cotización aprobada.
 *
 * ⛔ POR QUÉ ESTO NO PUEDE VIVIR EN EL NAVEGADOR (A12): el PDF lleva la imagen
 *    de la firma del CEO incrustada. Generarlo en el navegador obligaría a
 *    mandarle esa imagen a cualquiera que abra la pantalla. Acá la imagen se
 *    lee del depósito privado, se incrusta, y lo único que sale es el PDF.
 *
 * ⛔ A4 · Sale después de aprobar y con las DOS firmas vigentes. Esa regla no
 *    se comprueba acá: la hace cumplir el disparador `pdf_solo_si_aprobada` de
 *    la base. Esta función llama a `emitir_documento` CON LA SESIÓN DE QUIEN
 *    PIDE, así que también corren las políticas por fila.
 *
 * ⛔ NO INVENTA ACTIVOS. Si falta la imagen de una firma, el documento sale
 *    con el nombre y la aclaración de quien firmó y una línea que lo dice.
 *    Dibujar un garabato en lugar de una firma que no está sería una
 *    falsificación.
 */

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1';
import { calcularAlternativas, type BaseCalculo } from './_compartido/calculo.ts';

const CABECERAS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};

/** ⛔ Texto obligatorio. El documento dice lo que es y lo que no es. */
const NATURALEZA =
  'Esta cotizacion y la constancia de respuesta funcionan como constancia comercial '
  + 'o aval de intencion. No constituyen un contrato ni una firma electronica legal.';

const TINTA = rgb(0.08, 0.10, 0.15);
const GRIS = rgb(0.42, 0.45, 0.52);
const LINEA = rgb(0.85, 0.87, 0.90);

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: CABECERAS });
}

function error(codigo: string, mensaje: string, estado: number): Response {
  return responder({ ok: false, error: { codigo, mensajeAmable: mensaje } }, estado);
}

const gs = (n: number, moneda: string): string =>
  (moneda === 'USD' ? 'US$ ' : 'Gs. ')
  + Math.round(n).toLocaleString('es-PY').replace(/,/g, '.');

/** Corta un parrafo en lineas sin partir palabras. */
function partir(texto: string, ancho: number): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    if ((actual + ' ' + p).trim().length > ancho) { lineas.push(actual.trim()); actual = p; }
    else { actual += ' ' + p; }
  }
  if (actual.trim() !== '') lineas.push(actual.trim());
  return lineas;
}

Deno.serve(async (peticion) => {
  if (peticion.method === 'OPTIONS') return new Response(null, { headers: CABECERAS });
  if (peticion.method !== 'POST') return responder({ ok: false }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const publicable = Deno.env.get('SUPABASE_ANON_KEY');
  const servicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const autorizacion = peticion.headers.get('Authorization') ?? '';
  if (!url || !publicable || !servicio) return error('servidor', 'El servicio no esta disponible.', 503);
  if (autorizacion === '') return error('sin_permiso', 'Tu sesion vencio. Volve a entrar.', 401);

  // Dos clientes, cada uno con lo justo:
  //   `deQuienPide`  → corre con la sesión del vendedor: RLS y disparadores.
  //   `deServicio`   → sólo para leer las firmas del depósito privado y subir
  //                    el PDF. Nunca se usa para saltear una regla de negocio.
  const deQuienPide: SupabaseClient = createClient(url, publicable, {
    global: { headers: { Authorization: autorizacion } },
    auth: { persistSession: false },
  });
  const deServicio: SupabaseClient = createClient(url, servicio, { auth: { persistSession: false } });

  let cuerpo: Record<string, unknown>;
  try { cuerpo = await peticion.json(); } catch { return error('validacion', 'Peticion invalida.', 400); }

  const cotizacionId = String(cuerpo.cotizacionId ?? '');
  const clave = String(cuerpo.clave ?? '');
  if (cotizacionId === '' || clave === '') {
    return error('validacion', 'Faltan datos de la peticion.', 400);
  }

  // 1. La base decide si esto puede emitirse. Si no, corta acá con su mensaje.
  const { data: doc, error: fallo } = await deQuienPide.rpc('emitir_documento', {
    p_propuesta: cotizacionId, p_tipo: 'cotizacion', p_clave: clave,
  });
  if (fallo) {
    return error('validacion', fallo.message ?? 'No se pudo emitir el documento.', 400);
  }
  const emitido = doc as Record<string, unknown>;

  // Ya estaba generado: el mismo folio no se vuelve a fabricar.
  if (emitido.almacenamiento_ref) {
    return responder({ ok: true, datos: { documentoId: emitido.id, yaExistia: true } });
  }

  // 2. Los datos del documento.
  const { data: c } = await deQuienPide
    .from('cotizacion')
    .select(`id, folio, version, nombre_cliente, nombre_empresa_o_profesional, ruc, ciudad,
             nombre_producto, variante, nombre_vendedor, fecha_emision, fecha_validez,
             moneda, setup_lista, setup_especial, mensual_lista, mensual_especial,
             permanencia_minima_meses, tratamiento_iva, instalacion_texto,
             cotizacion_alcance ( clase, texto )`)
    .eq('id', cotizacionId).maybeSingle();
  if (!c) return error('no_encontrado', 'No encontramos esa cotizacion.', 404);
  const cot = c as Record<string, unknown>;

  const { data: firmas } = await deQuienPide
    .from('firma')
    .select('rol, nombre_firmante, aclaracion, firmado_en')
    .eq('cotizacion_id', cotizacionId)
    .eq('version_firmada', cot.version)
    .eq('anulada', false);

  const moneda = cot.moneda as string;
  const base: BaseCalculo = {
    setupLista: { moneda: moneda as 'PYG', monto: Number(cot.setup_lista ?? 0) },
    setupEspecial: { moneda: moneda as 'PYG', monto: Number(cot.setup_especial ?? 0) },
    mensualLista: { moneda: moneda as 'PYG', monto: Number(cot.mensual_lista ?? 0) },
    mensualEspecial: { moneda: moneda as 'PYG', monto: Number(cot.mensual_especial ?? 0) },
  };
  const alternativas = calcularAlternativas(base);

  // 3. El papel.
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${cot.folio} v${cot.version}`);
  pdf.setProducer('Escritorio Vendedores Lab.IA');
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  let pagina: PDFPage = pdf.addPage([595, 842]); // A4
  let y = 790;
  const MARGEN = 48;

  const escribir = (texto: string, x: number, tam: number, fuente: PDFFont, color = TINTA) => {
    pagina.drawText(texto, { x, y, size: tam, font: fuente, color });
  };
  const salto = (alto: number) => {
    y -= alto;
    if (y < 90) { pagina = pdf.addPage([595, 842]); y = 790; }
  };
  const regla = () => {
    pagina.drawLine({
      start: { x: MARGEN, y: y + 6 }, end: { x: 547, y: y + 6 },
      thickness: 0.7, color: LINEA,
    });
  };

  escribir('Lab.IA', MARGEN, 20, negrita);
  escribir(`${cot.folio}  ·  version ${cot.version}`, 400, 10, normal, GRIS);
  salto(18);
  escribir('Cotizacion', MARGEN, 12, normal, GRIS);
  salto(26); regla(); salto(12);

  const cliente = (cot.nombre_empresa_o_profesional as string) || (cot.nombre_cliente as string);
  escribir(cliente, MARGEN, 14, negrita);
  salto(16);
  const detalle = [cot.ruc, cot.ciudad].filter(Boolean).join('  ·  ');
  if (detalle) { escribir(detalle, MARGEN, 9, normal, GRIS); salto(14); }
  escribir(`${cot.nombre_producto}${cot.variante ? ` — ${cot.variante}` : ''}`, MARGEN, 11, negrita);
  salto(14);
  escribir(
    `Emitida ${String(cot.fecha_emision).slice(0, 10)}   ·   Valida hasta ${String(cot.fecha_validez).slice(0, 10)}`,
    MARGEN, 9, normal, GRIS,
  );
  salto(24);

  escribir('Alternativas de pago', MARGEN, 11, negrita);
  salto(6); regla(); salto(16);
  escribir('Opcion', MARGEN, 8, negrita, GRIS);
  escribir('Cuotas', 250, 8, negrita, GRIS);
  escribir('Cuota', 330, 8, negrita, GRIS);
  escribir('Total', 450, 8, negrita, GRIS);
  salto(14);

  for (const a of alternativas) {
    escribir(a.nombre, MARGEN, 9, normal);
    escribir(String(a.cantidadCuotas), 250, 9, normal);
    escribir(gs(a.importeCuota.monto, moneda), 330, 9, normal);
    escribir(gs(a.totalFinal.monto, moneda), 450, 9, negrita);
    salto(13);
    escribir(a.formaDePago, MARGEN + 8, 7.5, normal, GRIS);
    salto(15);
  }

  salto(6); regla(); salto(16);
  escribir('Bases y condiciones', MARGEN, 11, negrita);
  salto(16);

  const condiciones = [
    ...((cot.cotizacion_alcance ?? []) as Array<{ clase: string; texto: string }>)
      .map((a) => `${a.clase === 'incluye' ? '+' : a.clase === 'no_incluye' ? '-' : '·'} ${a.texto}`),
    cot.tratamiento_iva ? `· IVA: ${cot.tratamiento_iva}.` : null,
    cot.instalacion_texto ? `· ${cot.instalacion_texto}` : null,
    cot.permanencia_minima_meses ? `· Permanencia minima: ${cot.permanencia_minima_meses} meses.` : null,
  ].filter(Boolean) as string[];

  for (const linea of condiciones) {
    for (const trozo of partir(linea, 108)) { escribir(trozo, MARGEN, 8.5, normal); salto(12); }
  }

  salto(14);
  for (const trozo of partir(NATURALEZA, 104)) { escribir(trozo, MARGEN, 8, normal, GRIS); salto(11); }

  // 4. Las firmas.
  salto(24); regla(); salto(20);
  let x = MARGEN;
  for (const rol of ['vendedor', 'ceo'] as const) {
    const f = (firmas ?? []).find((s: Record<string, unknown>) => s.rol === rol) as
      Record<string, unknown> | undefined;
    if (!f) { x += 250; continue; }

    // ⛔ La imagen sale del depósito PRIVADO, por la clave de servicio. No hay
    //    ninguna URL pública que la sirva.
    const { data: archivo } = await deServicio.storage
      .from('firmas').download(rol === 'ceo' ? 'ceo.png' : `vendedor-${cot.nombre_vendedor}.png`);

    if (archivo) {
      try {
        const png = await pdf.embedPng(await archivo.arrayBuffer());
        const escala = Math.min(150 / png.width, 46 / png.height);
        pagina.drawImage(png, {
          x, y: y - 6, width: png.width * escala, height: png.height * escala,
        });
      } catch { /* si no se puede incrustar, queda la línea de abajo */ }
    } else {
      // ⛔ No se dibuja un garabato inventado. Se dice que la firma está
      //    registrada en el sistema, que es lo cierto.
      pagina.drawText('(firma registrada en el sistema)', {
        x, y: y + 6, size: 7.5, font: normal, color: GRIS,
      });
    }

    pagina.drawLine({
      start: { x, y: y - 14 }, end: { x: x + 170, y: y - 14 },
      thickness: 0.7, color: LINEA,
    });
    pagina.drawText(String(f.nombre_firmante ?? ''), {
      x, y: y - 26, size: 9, font: negrita, color: TINTA,
    });
    pagina.drawText(String(f.aclaracion ?? (rol === 'ceo' ? 'Lab.IA' : 'Vendedor')), {
      x, y: y - 37, size: 7.5, font: normal, color: GRIS,
    });
    pagina.drawText(String(f.firmado_en ?? '').slice(0, 10), {
      x, y: y - 47, size: 7, font: normal, color: GRIS,
    });
    x += 250;
  }

  // 5. Al deposito privado, y la referencia a la base.
  //
  // ⛔ Ruta determinista, una por (cotizacion, version). Un reintento
  //    sobrescribe el mismo archivo en vez de dejar otro colgando: un PDF en
  //    el deposito que ninguna fila referencia es un documento que existe y
  //    que nadie puede encontrar.
  const bytes = await pdf.save();
  const ruta = `${cot.id}/v${cot.version}.pdf`;
  const { error: subida } = await deServicio.storage
    .from('documentos').upload(ruta, bytes, { contentType: 'application/pdf', upsert: true });
  if (subida) return error('servidor', 'No pudimos guardar el documento.', 500);

  // La fila es inmutable salvo por esto: completar donde quedo el archivo, y
  // una sola vez. ⛔ Si eso falla hay que ENTERARSE. Antes se ignoraba el
  // error y la funcion contestaba que todo habia salido bien mientras el PDF
  // quedaba huerfano en el deposito.
  const { error: guardado } = await deServicio.from('documento_emitido')
    .update({ almacenamiento_ref: ruta }).eq('id', emitido.id as string);
  if (guardado) {
    await deServicio.storage.from('documentos').remove([ruta]);
    return error('servidor',
      'Generamos el documento pero no pudimos registrarlo. Proba de nuevo.', 500);
  }

  // Limpieza de intentos viejos con nombre al azar, de antes de la ruta fija.
  const { data: enCarpeta } = await deServicio.storage
    .from('documentos').list(String(cot.id));
  const sobrantes = (enCarpeta ?? [])
    .map((f: { name: string }) => `${cot.id}/${f.name}`)
    .filter((n: string) => n !== ruta);
  if (sobrantes.length > 0) await deServicio.storage.from('documentos').remove(sobrantes);

  return responder({ ok: true, datos: { documentoId: emitido.id, yaExistia: false } });
});
