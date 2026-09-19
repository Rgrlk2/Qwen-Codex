/**
 * Las fichas de producto, contra Supabase.
 *
 * ⛔ LA REGLA QUE ESTE ARCHIVO HACE CUMPLIR: la ficha oficial es fuente
 *    maestra y no se toca. Acá no hay ningún método que escriba en ella.
 *
 * ⛔ Y no se guarda en la base. El contenido sale del copy congelado de
 *    `content/copy/` en CADA lectura, con la misma función que usan los datos
 *    de ejemplo. Por eso no puede haber una copia vieja en el servidor, y por
 *    eso el enlace sirve siempre el copy VIGENTE.
 *
 * Lo único que vive en la base es la CAPA del vendedor: qué bloques se ven, en
 * qué orden, cuáles destacan, y sus dos textos propios. `personalizacion_bloque`
 * no tiene ninguna columna de texto —PF1 defendida por estructura, no por una
 * validación que alguien pueda saltear.
 */

import type {
  AccesoEnlace, AvisoCopyDesactualizado, CapaFichas, EnlaceCompartido,
  EntradaPorNecesidad, FichaOficial, FichaPersonalizada, Id, IndicePortafolio,
  NuevaFichaPersonalizada, OpcionesEnlaceFicha, OpcionesPagina,
  PersonalizacionBloque, ProductoId, Resultado, Version,
} from '@labia/compartido';
import {
  COPY_DE_LOS_TRECE, PRODUCTOS, fichaOficialDe, indiceDe, logoDe, porNecesidad,
  revisarCopy,
} from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';
import { COLUMNAS_TRAZADO, aTrazado, type FilaTrazado } from './trazado';

/**
 * Huella del copy: identifica la versión del texto servido.
 * ⛔ Se calcula del contenido. Si el copy cambia, la huella cambia sola y el
 *    aviso al vendedor aparece sin que nadie se acuerde de actualizar nada.
 */
function huellaDe(bruto: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bruto.length; i += 1) {
    h ^= bruto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Las trece fichas oficiales, armadas del copy. Una vez por carga. */
const FICHAS_OFICIALES: ReadonlyMap<ProductoId, FichaOficial> = new Map(
  COPY_DE_LOS_TRECE.map((copy) => [
    copy.productoId,
    fichaOficialDe(copy, logoDe(copy.productoId), huellaDe(copy.bruto), 1),
  ]),
);

/** ⛔ Los trece, ni uno más. Si el copy trajera otra cantidad, hay que saberlo. */
if (FICHAS_OFICIALES.size !== PRODUCTOS.length) {
  throw new Error(
    `El copy trae ${FICHAS_OFICIALES.size} fichas y el portafolio son ${PRODUCTOS.length}.`,
  );
}

interface FilaBloque {
  readonly bloque_id: PersonalizacionBloque['bloqueId'];
  readonly visible: boolean;
  readonly orden: number;
  readonly destacado: boolean;
}

interface FilaFicha extends FilaTrazado {
  readonly id: string;
  readonly producto_id: string;
  readonly cliente_id: string;
  readonly vendedor_id: string;
  readonly plan_id: string | null;
  readonly lo_que_conversamos: string | null;
  readonly nota_del_vendedor: string | null;
  readonly huella_copy: string;
  readonly personalizacion_bloque?: ReadonlyArray<FilaBloque>;
}

const COLUMNAS_FICHA = `id, producto_id, cliente_id, vendedor_id, plan_id,
  lo_que_conversamos, nota_del_vendedor, huella_copy, ${COLUMNAS_TRAZADO},
  personalizacion_bloque ( bloque_id, visible, orden, destacado )`;

function aFicha(f: FilaFicha): FichaPersonalizada {
  const bloques = (f.personalizacion_bloque ?? [])
    .map((b): PersonalizacionBloque => ({
      bloqueId: b.bloque_id, visible: b.visible, orden: b.orden, destacado: b.destacado,
    }))
    .sort((a, b) => a.orden - b.orden);

  return {
    ...aTrazado(f),
    id: f.id,
    productoId: f.producto_id as ProductoId,
    clienteId: f.cliente_id,
    vendedorId: f.vendedor_id,
    planId: f.plan_id,
    bloques,
    loQueConversamos: f.lo_que_conversamos,
    notaDelVendedor: f.nota_del_vendedor,
    huellaCopy: f.huella_copy,
    version: f.version,
  };
}

interface FilaEnlace {
  readonly id: string;
  readonly propuesta_id: string;
  readonly tipo_propuesta: EnlaceCompartido['tipoPropuesta'];
  readonly version_propuesta: number;
  readonly token: string;
  readonly creado_en: string;
  readonly creado_por: string | null;
  readonly vence_en: string;
  readonly tope_aperturas: number | null;
  readonly aperturas: number;
  readonly requiere_codigo: boolean;
  readonly revocado_en: string | null;
  readonly revocado_por: string | null;
  readonly respondido: boolean;
}

const COLUMNAS_ENLACE = `id, propuesta_id, tipo_propuesta, version_propuesta, token,
  creado_en, creado_por, vence_en, tope_aperturas, aperturas, requiere_codigo,
  revocado_en, revocado_por, respondido`;

function aEnlace(f: FilaEnlace): EnlaceCompartido {
  return {
    id: f.id,
    propuestaId: f.propuesta_id,
    tipoPropuesta: f.tipo_propuesta,
    versionPropuesta: f.version_propuesta,
    token: f.token,
    creadoEn: f.creado_en,
    creadoPor: f.creado_por ?? '',
    venceEn: f.vence_en,
    topeAperturas: f.tope_aperturas,
    aperturas: f.aperturas,
    requiereCodigo: f.requiere_codigo,
    revocadoEn: f.revocado_en,
    revocadoPor: f.revocado_por,
    respondido: f.respondido,
  };
}

interface FilaAcceso {
  readonly id: string;
  readonly enlace_id: string;
  readonly documento_id: string | null;
  readonly tipo_documento: AccesoEnlace['tipoDocumento'];
  readonly ocurrido_en: string;
  readonly tipo_dispositivo: AccesoEnlace['tipoDispositivo'];
  readonly pais_aproximado: string | null;
  readonly duracion_segundos: number | null;
  readonly resultado: AccesoEnlace['resultado'];
}

function aAcceso(f: FilaAcceso): AccesoEnlace {
  return {
    id: f.id,
    enlaceId: f.enlace_id,
    documentoId: f.documento_id,
    tipoDocumento: f.tipo_documento,
    ocurridoEn: f.ocurrido_en,
    tipoDispositivo: f.tipo_dispositivo,
    paisAproximado: f.pais_aproximado,
    duracionSegundos: f.duracion_segundos,
    resultado: f.resultado,
  };
}

// ---------------------------------------------------------------------------

export function crearCapaFichas(): CapaFichas {
  const sb = supabase();

  async function leerUna(id: Id): Promise<Resultado<FichaPersonalizada>> {
    const { data, error } = await sb
      .from('ficha_personalizada').select(COLUMNAS_FICHA).eq('id', id).maybeSingle();
    if (error) return fallo<FichaPersonalizada>(error);
    if (!data) {
      return { ok: false, error: {
        codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa ficha.',
      } };
    }
    return bien(aFicha(data as unknown as FilaFicha));
  }

  return {
    // --- La ficha oficial: del copy, no de la base -------------------------

    async obtenerFichaOficial(productoId: ProductoId) {
      const ficha = FICHAS_OFICIALES.get(productoId);
      if (!ficha) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const,
          mensajeAmable: 'Ese producto no está en el portafolio.',
        } };
      }
      return bien(ficha);
    },

    async indicePortafolio() {
      return bien<IndicePortafolio>(indiceDe([...FICHAS_OFICIALES.values()]));
    },

    async fichasPorNecesidad(necesidadId: Id) {
      // ⛔ Entrada por dolor, no por nombre de producto. Y sólo lo que encaja
      //    `directo` o `cercano`: ofrecer lo adaptable acá sería vender humo.
      const { data, error } = await sb
        .from('necesidad_producto')
        .select('producto_id, encaje, adaptacion_requerida, argumento, motivo, necesidad ( nombre )')
        .eq('necesidad_id', necesidadId);
      if (error) return fallo<EntradaPorNecesidad>(error);

      const filas = (data ?? []) as unknown as Array<{
        producto_id: string;
        encaje: 'directo' | 'cercano' | 'adaptable' | 'no_recomendado';
        adaptacion_requerida: string | null;
        argumento: string;
        motivo: string;
        necesidad: { nombre: string } | null;
      }>;

      const encajes = filas.flatMap((r) => {
        const ficha = FICHAS_OFICIALES.get(r.producto_id as ProductoId);
        return ficha ? [{ ficha, encaje: r.encaje }] : [];
      });
      return bien(porNecesidad(necesidadId, filas[0]?.necesidad?.nombre ?? '', encajes));
    },

    // --- La capa del vendedor ---------------------------------------------

    async listarFichasPersonalizadas(clienteId: Id, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('ficha_personalizada')
        .select(COLUMNAS_FICHA, { count: 'exact' })
        .eq('cliente_id', clienteId)
        .is('descartada_en', null)
        .order('creado_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<FichaPersonalizada>>>(error);
      const items = ((data ?? []) as unknown as FilaFicha[]).map(aFicha);
      return bien(armarPagina<FichaPersonalizada>(items, r, count ?? null));
    },

    obtenerFichaPersonalizada: (id) => leerUna(id),

    async prepararFicha(datos: NuevaFichaPersonalizada, clave) {
      const oficial = FICHAS_OFICIALES.get(datos.productoId);
      if (!oficial) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const,
          mensajeAmable: 'Ese producto no está en el portafolio.',
        } };
      }
      const { data, error } = await sb.rpc('preparar_ficha', {
        p_datos: {
          productoId: datos.productoId,
          clienteId: datos.clienteId,
          planId: datos.planId ?? null,
          loQueConversamos: datos.loQueConversamos ?? null,
          notaDelVendedor: datos.notaDelVendedor ?? null,
          // ⛔ La huella del copy VIGENTE al preparar. Con eso después se avisa
          //    si el texto cambió, antes de que el vendedor lo comparta.
          huellaCopy: oficial.huellaCopy,
          personalizacion: datos.bloques,
        },
        p_clave: clave,
      });
      if (error) return fallo<FichaPersonalizada>(error);
      return leerUna(data as string);
    },

    async actualizarFicha(id: Id, cambios: Partial<NuevaFichaPersonalizada>, version: Version) {
      // ⛔ No hay por dónde escribir el copy: `cambios` sólo puede traer los
      //    dos textos del vendedor y la presentación de los bloques.
      const parche: Record<string, unknown> = { version };
      if (cambios.loQueConversamos !== undefined) parche['lo_que_conversamos'] = cambios.loQueConversamos;
      if (cambios.notaDelVendedor !== undefined) parche['nota_del_vendedor'] = cambios.notaDelVendedor;
      if (cambios.planId !== undefined) parche['plan_id'] = cambios.planId;

      const { error } = await sb.from('ficha_personalizada').update(parche).eq('id', id);
      if (error) return fallo<FichaPersonalizada>(error);

      if (cambios.bloques) {
        const { error: errorBloques } = await sb.from('personalizacion_bloque').upsert(
          cambios.bloques.map((b) => ({
            ficha_id: id, bloque_id: b.bloqueId,
            visible: b.visible, orden: b.orden, destacado: b.destacado,
          })),
          { onConflict: 'ficha_id,bloque_id' },
        );
        if (errorBloques) return fallo<FichaPersonalizada>(errorBloques);
      }
      return leerUna(id);
    },

    async descartarFicha(id: Id, motivo: string) {
      // ⛔ Descarta LA CAPA, no la ficha oficial. El copy no se toca nunca, y
      //    la fila queda con el motivo escrito.
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué descartás esta ficha.',
          campo: 'motivo',
        } };
      }
      const { data: quien } = await sb.auth.getUser();
      const { error } = await sb
        .from('ficha_personalizada')
        .update({
          descartada_en: new Date().toISOString(),
          motivo_descarte: motivo,
          descartada_por: quien.user?.id ?? null,
        })
        .eq('id', id);
      if (error) return fallo<void>(error);
      return bien(undefined as void);
    },

    async revisarCopyDeFicha(id: Id) {
      const ficha = await leerUna(id);
      if (!ficha.ok) return ficha as Resultado<AvisoCopyDesactualizado | null>;
      const oficial = FICHAS_OFICIALES.get(ficha.datos.productoId);
      if (!oficial) return bien(null);
      // ⛔ Esto es sólo un aviso para el vendedor: el enlace sirve siempre el
      //    copy vigente. La idea es que no se entere delante del cliente.
      return bien(revisarCopy(oficial, ficha.datos));
    },

    // --- El enlace para el cliente ----------------------------------------

    async compartirFicha(id: Id, opciones: OpcionesEnlaceFicha, clave) {
      const { data, error } = await sb.rpc('compartir_ficha', {
        p_ficha: id,
        p_opciones: { venceEn: opciones.venceEn, topeAperturas: opciones.topeAperturas ?? null },
        p_clave: clave,
      });
      if (error) return fallo<EnlaceCompartido>(error);
      const filas = (data ?? []) as unknown as FilaEnlace[];
      const f = filas.length > 0 ? filas[0] : undefined;
      if (!f) {
        return { ok: false as const, error: {
          codigo: 'servicio_no_disponible' as const,
          mensajeAmable: 'No pudimos armar el enlace. Probá de nuevo.',
        } };
      }
      return bien(aEnlace(f));
    },

    async revocarEnlaceFicha(enlaceId: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué revocás el enlace.',
          campo: 'motivo',
        } };
      }
      const { data: quien } = await sb.auth.getUser();
      const { data, error } = await sb
        .from('enlace_compartido')
        .update({ revocado_en: new Date().toISOString(), revocado_por: quien.user?.id ?? null })
        .eq('id', enlaceId)
        .select(COLUMNAS_ENLACE)
        .maybeSingle();
      if (error) return fallo<EnlaceCompartido>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos ese enlace.',
        } };
      }
      return bien(aEnlace(data as unknown as FilaEnlace));
    },

    async aperturasDeFicha(id: Id, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data: enlaces, error: errorEnlaces } = await sb
        .from('enlace_compartido').select('id').eq('propuesta_id', id).eq('tipo_propuesta', 'ficha');
      if (errorEnlaces) return fallo<ReturnType<typeof armarPagina<AccesoEnlace>>>(errorEnlaces);

      const ids = ((enlaces ?? []) as unknown as Array<{ id: string }>).map((e) => e.id);
      if (ids.length === 0) return bien(armarPagina<AccesoEnlace>([], r, 0));

      const { data, error, count } = await sb
        .from('acceso_enlace')
        .select('id, enlace_id, documento_id, tipo_documento, ocurrido_en, tipo_dispositivo, pais_aproximado, duracion_segundos, resultado', { count: 'exact' })
        .in('enlace_id', ids)
        .order('ocurrido_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<AccesoEnlace>>>(error);
      const items = ((data ?? []) as unknown as FilaAcceso[]).map(aAcceso);
      return bien(armarPagina<AccesoEnlace>(items, r, count ?? null));
    },
  };
}
