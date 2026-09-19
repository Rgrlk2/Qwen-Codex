/**
 * Cartera, ficha del cliente, contactos, línea de tiempo y seguimientos,
 * contra Supabase.
 *
 * Dos decisiones que explican la forma de este archivo:
 *
 * 1. **Las altas van por función de base, no por PostgREST.** Dar de alta un
 *    cliente escribe en tres tablas y guardar un seguimiento en cinco.
 *    PostgREST no sabe hacer eso de forma atómica: serían tres o cinco
 *    llamadas, y si la tercera falla queda un cliente a medio crear. Las
 *    funciones `crear_cliente` y `guardar_seguimiento` lo hacen en una
 *    transacción, y de paso cumplen la `ClaveIdempotencia` del contrato:
 *    apretar "Guardar" dos veces deja UNA fila, no dos.
 *
 * 2. **Acá no hay reglas de negocio.** Que un seguimiento exija confirmación
 *    humana, que un cliente perdido exija motivo, que nadie vea la cartera
 *    de otro: eso lo decide la base. Este archivo traduce, pagina y nada más.
 *    Si alguien llamara a la API sin pasar por el Escritorio, las reglas
 *    seguirían en pie.
 */

import type {
  AudioSeguimiento, CapaClientes, CapturaSeguimiento, Cliente, ClienteDetalle,
  Contacto, EstadoPaso, EventoLineaTiempo, FiltroClientes, FiltroSeguimientos,
  Id, NuevoCliente, OpcionesPagina, PasoSugerido, ProductoId,
  PropuestaDeSeguimiento, Resultado, Seguimiento, SeguimientoConfirmado,
  SoporteDictado, Version,
} from '@labia/compartido';
import { estructurarCaptura } from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';
import { COLUMNAS_TRAZADO, aTrazado, type FilaTrazado } from './trazado';

// ---------------------------------------------------------------------------
// Filas de la base → tipos del contrato
// ---------------------------------------------------------------------------

interface FilaCliente extends FilaTrazado {
  readonly id: string;
  readonly tipo: Cliente['tipo'];
  readonly nombre: string;
  readonly actividad_id: string;
  readonly vendedor_id: string;
  readonly etapa: Cliente['etapa'];
  readonly ciudad: string | null;
  readonly ultima_interaccion_en: string | null;
  readonly proximo_paso_en: string | null;
  readonly motivo_perdida: string | null;
  readonly archivado_en: string | null;
  readonly plan_id?: string | null;
  readonly cliente_operacion_confirmada?: ReadonlyArray<{ readonly operacion_id: string }>;
  readonly contacto?: ReadonlyArray<FilaContacto>;
  readonly cliente_producto?: ReadonlyArray<{ readonly producto_id: string; readonly relacion: string }>;
}

interface FilaContacto {
  readonly id: string;
  readonly cliente_id: string;
  readonly nombre: string;
  readonly cargo: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly es_decisor: boolean;
  readonly canal_preferido: Contacto['canalPreferido'];
}

const COLUMNAS_CLIENTE = `id, tipo, nombre, actividad_id, vendedor_id, etapa, ciudad,
  ultima_interaccion_en, proximo_paso_en, motivo_perdida, archivado_en, ${COLUMNAS_TRAZADO},
  cliente_operacion_confirmada ( operacion_id )`;

const COLUMNAS_CONTACTO = 'id, cliente_id, nombre, cargo, telefono, email, es_decisor, canal_preferido';

function aCliente(f: FilaCliente): Cliente {
  return {
    ...aTrazado(f),
    id: f.id,
    tipo: f.tipo,
    nombre: f.nombre,
    actividadId: f.actividad_id,
    operacionesConfirmadas: (f.cliente_operacion_confirmada ?? []).map((o) => o.operacion_id),
    vendedorId: f.vendedor_id,
    etapa: f.etapa,
    ciudad: f.ciudad,
    ultimaInteraccionEn: f.ultima_interaccion_en,
    proximoPasoEn: f.proximo_paso_en,
    motivoPerdida: f.motivo_perdida,
    archivadoEn: f.archivado_en,
  };
}

function aContacto(f: FilaContacto): Contacto {
  return {
    id: f.id,
    clienteId: f.cliente_id,
    nombre: f.nombre,
    cargo: f.cargo,
    telefono: f.telefono,
    email: f.email,
    esDecisor: f.es_decisor,
    canalPreferido: f.canal_preferido,
  };
}

interface FilaEvento {
  readonly id: string;
  readonly cliente_id: string;
  readonly tipo: EventoLineaTiempo['tipo'];
  readonly ocurrido_en: string;
  readonly titulo: string;
  readonly detalle: string | null;
  readonly referencia_id: string;
}

function aEvento(f: FilaEvento): EventoLineaTiempo {
  return {
    id: f.id,
    clienteId: f.cliente_id,
    tipo: f.tipo,
    ocurridoEn: f.ocurrido_en,
    titulo: f.titulo,
    detalle: f.detalle,
    referenciaId: f.referencia_id,
  };
}

interface FilaAudio {
  readonly id: string;
  readonly duracion_segundos: number;
  readonly formato: string;
  readonly almacenamiento_ref: string | null;
  readonly retencion_hasta: string;
  readonly borrado_en: string | null;
  readonly borrado_por: string | null;
}

function aAudio(f: FilaAudio): AudioSeguimiento {
  return {
    id: f.id,
    duracionSegundos: f.duracion_segundos,
    formato: f.formato,
    // Borrado el audio, la referencia se anula en la base (restricción
    // `borrado_sin_referencia`). Acá queda vacía: ya no apunta a ningún lado.
    almacenamientoRef: f.almacenamiento_ref ?? '',
    retencionHasta: f.retencion_hasta,
    borradoEn: f.borrado_en,
    borradoPor: f.borrado_por,
  };
}

interface FilaPaso {
  readonly id: string;
  readonly seguimiento_id: string;
  readonly titulo: string;
  readonly vence_en: string | null;
  readonly estado: EstadoPaso;
  readonly resuelto_en: string | null;
}

function aPaso(f: FilaPaso): PasoSugerido {
  return {
    id: f.id,
    seguimientoId: f.seguimiento_id,
    titulo: f.titulo,
    venceEn: f.vence_en,
    estado: f.estado,
    resueltoEn: f.resuelto_en,
  };
}

interface FilaSeguimiento {
  readonly id: string;
  readonly cliente_id: string;
  readonly vendedor_id: string;
  readonly origen: Seguimiento['origen'];
  readonly ocurrido_en: string;
  readonly registrado_en: string;
  readonly texto: string;
  readonly audio_seguimiento?: ReadonlyArray<FilaAudio>;
  readonly seguimiento_producto?: ReadonlyArray<{ readonly producto_id: string }>;
  readonly paso_sugerido?: ReadonlyArray<FilaPaso>;
}

const COLUMNAS_SEGUIMIENTO = `id, cliente_id, vendedor_id, origen, ocurrido_en, registrado_en, texto,
  audio_seguimiento ( id, duracion_segundos, formato, almacenamiento_ref, retencion_hasta, borrado_en, borrado_por ),
  seguimiento_producto ( producto_id ),
  paso_sugerido ( id, seguimiento_id, titulo, vence_en, estado, resuelto_en )`;

function aSeguimiento(f: FilaSeguimiento): Seguimiento {
  const audios = f.audio_seguimiento ?? [];
  const primero = audios.length > 0 ? audios[0] : undefined;
  return {
    id: f.id,
    clienteId: f.cliente_id,
    vendedorId: f.vendedor_id,
    origen: f.origen,
    ocurridoEn: f.ocurrido_en,
    registradoEn: f.registrado_en,
    texto: f.texto,
    audio: primero ? aAudio(primero) : null,
    productosMencionados: (f.seguimiento_producto ?? []).map((p) => p.producto_id as ProductoId),
    pasos: (f.paso_sugerido ?? []).map(aPaso),
    // ⛔ No hay tabla de adjuntos ni método para subir uno: el contrato
    //    declara el campo, pero nada lo produce todavía. Devolver una lista
    //    vacía es lo honesto; inventar una tabla que nadie escribe, no.
    adjuntos: [],
    confirmadoPorUsuario: true,
  };
}

// ---------------------------------------------------------------------------

export function crearCapaClientes(): CapaClientes {
  const sb = supabase();

  /** Trae el cliente con todo lo que cuelga de él, para la ficha. */
  async function detalle(id: Id): Promise<Resultado<ClienteDetalle>> {
    const { data, error } = await sb
      .from('cliente')
      .select(`${COLUMNAS_CLIENTE}, plan_id,
        contacto ( ${COLUMNAS_CONTACTO} ),
        cliente_producto ( producto_id, relacion )`)
      .eq('id', id)
      .maybeSingle();

    if (error) return fallo<ClienteDetalle>(error);
    if (!data) {
      return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos ese cliente.' } };
    }

    const f = data as unknown as FilaCliente;
    const productos = f.cliente_producto ?? [];
    return bien<ClienteDetalle>({
      ...aCliente(f),
      contactos: (f.contacto ?? []).map(aContacto),
      productosVigentes: productos.filter((p) => p.relacion === 'vigente').map((p) => p.producto_id as ProductoId),
      productosPropuestos: productos.filter((p) => p.relacion === 'propuesto').map((p) => p.producto_id as ProductoId),
      planId: f.plan_id ?? null,
      // ⛔ El potencial se compone de precios documentados, nunca estimado.
      //    Mientras no estén las cotizaciones del cliente, es una lista vacía:
      //    un número inventado acá sería peor que no mostrar ninguno.
      potencialPorMoneda: [],
    });
  }

  return {
    async listarClientes(filtro: FiltroClientes, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb
        .from('cliente')
        .select(COLUMNAS_CLIENTE, { count: 'exact' })
        .is('archivado_en', null);

      if (filtro.tipo) consulta = consulta.eq('tipo', filtro.tipo);
      if (filtro.actividadId) consulta = consulta.eq('actividad_id', filtro.actividadId);
      if (filtro.etapa) consulta = consulta.eq('etapa', filtro.etapa);
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      if (filtro.sinContactoDesde) {
        consulta = consulta.or(
          `ultima_interaccion_en.lt.${filtro.sinContactoDesde},ultima_interaccion_en.is.null`,
        );
      }
      if (filtro.texto && filtro.texto.trim().length > 0) {
        // `%` y `,` romperían el filtro de PostgREST; se van.
        const limpio = filtro.texto.trim().replace(/[%,()]/g, ' ');
        consulta = consulta.ilike('nombre', `%${limpio}%`);
      }

      const { data, error, count } = await consulta
        .order('ultima_interaccion_en', { ascending: false, nullsFirst: false })
        .order('nombre', { ascending: true })
        .range(r.desde, r.hasta);

      if (error) return fallo<ReturnType<typeof armarPagina<Cliente>>>(error);
      const items = ((data ?? []) as unknown as FilaCliente[]).map(aCliente);
      return bien(armarPagina<Cliente>(items, r, count ?? null));
    },

    obtenerCliente: (id) => detalle(id),

    async crearCliente(datos: NuevoCliente, clave) {
      const { data, error } = await sb.rpc('crear_cliente', {
        p_datos: datos as unknown as Record<string, unknown>,
        p_clave: clave,
      });
      if (error) return fallo<Cliente>(error);
      return detalle(data as string);
    },

    async actualizarCliente(id: Id, cambios: Partial<NuevoCliente>, version: Version) {
      const parche: Record<string, unknown> = { version };
      if (cambios.tipo !== undefined) parche['tipo'] = cambios.tipo;
      if (cambios.nombre !== undefined) parche['nombre'] = cambios.nombre;
      if (cambios.actividadId !== undefined) parche['actividad_id'] = cambios.actividadId;
      if (cambios.ciudad !== undefined) parche['ciudad'] = cambios.ciudad;

      // ⛔ `version` viaja para que la base frene una escritura basada en una
      //    lectura vieja. No la escribe: el disparador `sella_trazado` la sube.
      const { error } = await sb.from('cliente').update(parche).eq('id', id);
      if (error) return fallo<Cliente>(error);
      return detalle(id);
    },

    async listarContactos(clienteId: Id) {
      const { data, error } = await sb
        .from('contacto')
        .select(COLUMNAS_CONTACTO)
        .eq('cliente_id', clienteId)
        .order('es_decisor', { ascending: false })
        .order('nombre', { ascending: true });
      if (error) return fallo<ReadonlyArray<Contacto>>(error);
      return bien(((data ?? []) as unknown as FilaContacto[]).map(aContacto));
    },

    async lineaDeTiempo(clienteId: Id, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('evento_linea_tiempo')
        .select('id, cliente_id, tipo, ocurrido_en, titulo, detalle, referencia_id', { count: 'exact' })
        .eq('cliente_id', clienteId)
        .order('ocurrido_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<EventoLineaTiempo>>>(error);
      const items = ((data ?? []) as unknown as FilaEvento[]).map(aEvento);
      return bien(armarPagina<EventoLineaTiempo>(items, r, count ?? null));
    },

    async soporteDictado() {
      // ⛔ Esto es del dispositivo, no del servidor: preguntárselo a la base
      //    sería inventar una respuesta. Sin soporte se informa y se ofrece
      //    texto; nunca queda un botón que no hace nada.
      const hayMedios = typeof navigator !== 'undefined'
        && typeof navigator.mediaDevices?.getUserMedia === 'function';
      const hayGrabador = typeof globalThis.MediaRecorder === 'function';
      const disponible = hayMedios && hayGrabador;
      return bien<SoporteDictado>({
        disponible,
        motivoNoDisponible: disponible
          ? null
          : 'Este dispositivo o navegador no permite grabar. Podés escribir el seguimiento.',
      });
    },

    async subirAudio(archivo: Blob, clave) {
      // ⛔ El nombre del archivo NO es la clave de idempotencia.
      //
      //    Dos razones. Una: la clave la genera la vista, y su camino de
      //    respaldo usa `Math.random()`, que es adivinable. Dos: el balde se
      //    sirve por CDN, y una vez borrado el archivo el borde sigue
      //    entregando la copia cacheada un rato. Con un nombre adivinable eso
      //    sería una grabación comercial al alcance de quien pruebe rutas;
      //    con uno aleatorio, sólo la alcanza quien ya tenía la dirección.
      const nombre = `${crypto.randomUUID()}.webm`;
      const tipo = archivo.type || 'audio/webm';

      const { error: subida } = await sb.storage
        .from('audios-seguimiento')
        .upload(nombre, archivo, { contentType: tipo, upsert: false });
      if (subida) return fallo<AudioSeguimiento>(subida);

      const { data, error } = await sb.rpc('registrar_audio', {
        p_ref: nombre,
        p_formato: tipo,
        p_clave: clave,
      });
      if (error) return fallo<AudioSeguimiento>(error);

      const filas = (data ?? []) as unknown as FilaAudio[];
      const fila = filas.length > 0 ? filas[0] : undefined;
      if (!fila) {
        return { ok: false, error: { codigo: 'servicio_no_disponible', mensajeAmable: 'No pudimos registrar el audio. Probá de nuevo.' } };
      }

      // Reintento: la base devolvió el audio de la primera vez, así que lo
      // que se acaba de subir sobra. Se borra, para no dejar una grabación
      // suelta en el balde que nadie va a volver a mirar.
      if (fila.almacenamiento_ref !== nombre) {
        await sb.storage.from('audios-seguimiento').remove([nombre]);
      }
      return bien(aAudio(fila));
    },

    async procesarCaptura(entrada: CapturaSeguimiento) {
      // ⛔ No escribe nada: devuelve una propuesta para que la persona
      //    confirme. La lógica vive en @labia/compartido y es la misma que
      //    usan los datos de ejemplo, así el Escritorio se comporta igual
      //    contra los dos.
      return bien<PropuestaDeSeguimiento>(estructurarCaptura(entrada));
    },

    async guardarSeguimiento(datos: SeguimientoConfirmado, clave) {
      const { data, error } = await sb.rpc('guardar_seguimiento', {
        p_datos: datos as unknown as Record<string, unknown>,
        p_clave: clave,
      });
      if (error) return fallo<Seguimiento>(error);

      const { data: fila, error: lectura } = await sb
        .from('seguimiento')
        .select(COLUMNAS_SEGUIMIENTO)
        .eq('id', data as string)
        .maybeSingle();
      if (lectura) return fallo<Seguimiento>(lectura);
      if (!fila) {
        return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'Guardamos el seguimiento pero no pudimos volver a leerlo.' } };
      }
      return bien(aSeguimiento(fila as unknown as FilaSeguimiento));
    },

    async listarSeguimientos(filtro: FiltroSeguimientos, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('seguimiento').select(COLUMNAS_SEGUIMIENTO, { count: 'exact' });

      if (filtro.clienteId) consulta = consulta.eq('cliente_id', filtro.clienteId);
      if (filtro.origen) consulta = consulta.eq('origen', filtro.origen);
      if (filtro.desde) consulta = consulta.gte('ocurrido_en', filtro.desde);
      if (filtro.hasta) consulta = consulta.lte('ocurrido_en', filtro.hasta);

      const { data, error, count } = await consulta
        .order('ocurrido_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Seguimiento>>>(error);

      let items = ((data ?? []) as unknown as FilaSeguimiento[]).map(aSeguimiento);
      // Los pasos vienen anidados, así que este filtro se resuelve acá.
      // ⛔ Filtrar después de paginar descuadraría el total, así que el total
      //    deja de informarse cuando el filtro está puesto.
      const recorta = filtro.conPasosAbiertos === true;
      if (recorta) {
        items = items.filter((s) => s.pasos.some((p) => p.estado === 'propuesto' || p.estado === 'aceptado'));
      }
      return bien(armarPagina<Seguimiento>(items, r, recorta ? null : (count ?? null)));
    },

    async borrarAudio(audioId: Id, motivo: string) {
      // ⛔ Borra el audio DE VERDAD: suelta la referencia en la base y borra
      //    el archivo del balde. Vaciar sólo la referencia dejaba la
      //    grabación guardada y recuperable.
      //
      // ⛔ NO borra la transcripción ni el seguimiento: el texto es el
      //    registro comercial y sobrevive al archivo.
      const { data, error } = await sb.rpc('borrar_audio', { p_audio: audioId, p_motivo: motivo });
      if (error) return fallo<void>(error);

      const referencia = data as string | null;
      if (referencia) {
        const { error: borradoDelArchivo } = await sb.storage
          .from('audios-seguimiento')
          .remove([referencia]);
        // La base ya dice que este audio está borrado. Si el archivo quedó,
        // es basura sin referencia, no un audio accesible: no se le devuelve
        // un error al vendedor por eso.
        if (borradoDelArchivo) return bien(undefined as void);
      }
      return bien(undefined as void);
    },

    async actualizarPaso(pasoId: Id, estado: EstadoPaso) {
      const { data, error } = await sb
        .from('paso_sugerido')
        .update({ estado })
        .eq('id', pasoId)
        .select('id, seguimiento_id, titulo, vence_en, estado, resuelto_en')
        .maybeSingle();
      if (error) return fallo<PasoSugerido>(error);
      if (!data) {
        return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos ese paso.' } };
      }
      return bien(aPaso(data as unknown as FilaPaso));
    },
  };
}
