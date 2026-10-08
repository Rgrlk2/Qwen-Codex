/**
 * La agenda operativa, contra Supabase.
 *
 * ⛔ La agenda SE POBLA SOLA desde planes, objetivos aceptados, seguimientos,
 *    presentaciones, cotizaciones, vencimientos y aperturas de enlace. Por eso
 *    la única escritura de creación es `crearEntradaManual`, y es la
 *    excepción: todo lo demás llega derivado de otra cosa que ya pasó.
 *
 * ⛔ Las vistas —Hoy, Semana, Mes— no se calculan acá: son derivación pura y
 *    viven en `@labia/compartido/agenda-vistas`, compartidas con los datos de
 *    ejemplo. Acá sólo se leen las entradas y se les pasa el reloj.
 *
 * ⛔ "Atrasada" tampoco se guarda: se calcula contra hoy cada vez que se lee.
 *    Una columna `atrasada` habría que recorrerla todas las noches para que no
 *    mienta.
 */

import type {
  AgendaHoy, AgendaMes, AgendaSemana, AjusteEntrada, CapaAgenda,
  CronogramaComercial, EntradaAgenda, FiltroAgenda, Id, ISODate,
  NuevaEntradaManual, OpcionesPagina, Prioridad, Resultado,
} from '@labia/compartido';
import { armarAgendaHoy, armarAgendaMes, armarAgendaSemana, marcarAtraso } from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';

/**
 * La base guarda la prioridad como 1, 2 o 3 (con su `check`), y el contrato la
 * nombra. 1 es lo que va primero.
 */
const PRIORIDAD_DESDE: Readonly<Record<number, Prioridad>> = { 1: 'alta', 2: 'media', 3: 'baja' };
const PRIORIDAD_HACIA: Readonly<Record<Prioridad, number>> = { alta: 1, media: 2, baja: 3 };

interface FilaEntrada {
  readonly id: string;
  readonly vendedor_id: string;
  readonly tipo: EntradaAgenda['tipo'];
  readonly origen: EntradaAgenda['origen'];
  readonly referencia_id: string | null;
  readonly cliente_id: string | null;
  readonly titulo: string;
  readonly detalle: string | null;
  readonly producto_id: string | null;
  readonly inicio_en: string | null;
  readonly fin_en: string | null;
  readonly vence_en: string | null;
  readonly prioridad: number;
  readonly estado: EntradaAgenda['estado'];
  readonly completada_en: string | null;
  readonly motivo_reprogramacion: string | null;
  readonly fecha_ajustada_por_vendedor: boolean;
  readonly cliente?: { readonly nombre: string } | null;
}

const COLUMNAS = `id, vendedor_id, tipo, origen, referencia_id, cliente_id, titulo, detalle,
  producto_id, inicio_en, fin_en, vence_en, prioridad, estado, completada_en,
  motivo_reprogramacion, fecha_ajustada_por_vendedor, cliente ( nombre )`;

function aEntrada(f: FilaEntrada, ahora: ISODate): EntradaAgenda {
  return marcarAtraso({
    id: f.id,
    vendedorId: f.vendedor_id,
    tipo: f.tipo,
    origen: f.origen,
    referenciaId: f.referencia_id,
    clienteId: f.cliente_id,
    nombreCliente: f.cliente?.nombre ?? null,
    titulo: f.titulo,
    detalle: f.detalle,
    productoId: f.producto_id as EntradaAgenda['productoId'],
    inicioEn: f.inicio_en,
    finEn: f.fin_en,
    venceEn: f.vence_en,
    prioridad: PRIORIDAD_DESDE[f.prioridad] ?? 'media',
    estado: f.estado,
    completadaEn: f.completada_en,
    motivoReprogramacion: f.motivo_reprogramacion,
    fechaAjustadaPorVendedor: f.fecha_ajustada_por_vendedor,
  }, ahora);
}

export function crearCapaAgenda(): CapaAgenda {
  const sb = supabase();
  const ahora = (): ISODate => new Date().toISOString();

  /**
   * Las entradas vigentes. Las vistas de calendario agrupan todo lo que hay,
   * así que se traen de una y se agrupan en memoria: son las de un vendedor,
   * no las de la empresa entera.
   */
  async function vigentes(desde?: ISODate, hasta?: ISODate): Promise<Resultado<ReadonlyArray<EntradaAgenda>>> {
    let consulta = sb.from('entrada_agenda').select(COLUMNAS);
    // Un rango se aplica sobre la fecha que manda: `vence_en` si la hay,
    // `inicio_en` si no. Las atrasadas quedan siempre dentro.
    if (desde) consulta = consulta.or(`vence_en.gte.${desde},inicio_en.gte.${desde},vence_en.lt.${ahora()}`);
    if (hasta) consulta = consulta.or(`vence_en.lte.${hasta},inicio_en.lte.${hasta}`);

    const { data, error } = await consulta.order('vence_en', { ascending: true, nullsFirst: false });
    if (error) return fallo<ReadonlyArray<EntradaAgenda>>(error);
    const reloj = ahora();
    return bien(((data ?? []) as unknown as FilaEntrada[]).map((f) => aEntrada(f, reloj)));
  }

  async function leerUna(id: Id): Promise<Resultado<EntradaAgenda>> {
    const { data, error } = await sb.from('entrada_agenda').select(COLUMNAS).eq('id', id).maybeSingle();
    if (error) return fallo<EntradaAgenda>(error);
    if (!data) {
      return { ok: false, error: {
        codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.',
      } };
    }
    return bien(aEntrada(data as unknown as FilaEntrada, ahora()));
  }

  return {
    async agendaHoy(fecha?: ISODate) {
      const todas = await vigentes();
      if (!todas.ok) return todas as Resultado<AgendaHoy>;
      return bien(armarAgendaHoy(todas.datos, fecha ?? ahora()));
    },

    async agendaSemana(desde?: ISODate) {
      const todas = await vigentes();
      if (!todas.ok) return todas as Resultado<AgendaSemana>;
      return bien(armarAgendaSemana(todas.datos, desde ?? ahora()));
    },

    async agendaMes(anio: number, mes: number) {
      const todas = await vigentes();
      if (!todas.ok) return todas as Resultado<AgendaMes>;
      return bien(armarAgendaMes(todas.datos, anio, mes));
    },

    async cronogramaComercial(desde: ISODate, hasta: ISODate) {
      // El cronograma es la vida comercial de cada cliente: se arma sobre
      // presentaciones y cotizaciones, que son de la capa de propuestas.
      // Hasta que esa capa exista contra el servidor, no hay de qué sacarlo.
      // ⛔ Devolver barras inventadas sería peor que devolver ninguna.
      return bien<CronogramaComercial>({ desde, hasta, barras: [] });
    },

    async listarEntradas(filtro: FiltroAgenda, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('entrada_agenda').select(COLUMNAS, { count: 'exact' });
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      if (filtro.clienteId) consulta = consulta.eq('cliente_id', filtro.clienteId);
      if (filtro.tipo) consulta = consulta.eq('tipo', filtro.tipo);
      if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);
      if (filtro.prioridad) consulta = consulta.eq('prioridad', PRIORIDAD_HACIA[filtro.prioridad]);
      if (filtro.desde) consulta = consulta.gte('vence_en', filtro.desde);
      if (filtro.hasta) consulta = consulta.lte('vence_en', filtro.hasta);

      const { data, error, count } = await consulta
        .order('vence_en', { ascending: true, nullsFirst: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<EntradaAgenda>>>(error);

      const reloj = ahora();
      let items = ((data ?? []) as unknown as FilaEntrada[]).map((f) => aEntrada(f, reloj));
      // ⛔ "Atrasada" se calcula, así que este filtro se resuelve acá. Filtrar
      //    después de paginar descuadraría el total, así que deja de informarse.
      const recorta = filtro.soloAtrasados === true;
      if (recorta) items = items.filter((e) => e.atrasada);
      return bien(armarPagina<EntradaAgenda>(items, r, recorta ? null : (count ?? null)));
    },

    async entradasAtrasadas(pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error } = await sb
        .from('entrada_agenda')
        .select(COLUMNAS)
        .eq('estado', 'pendiente')
        .lt('vence_en', ahora())
        .order('vence_en', { ascending: true })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<EntradaAgenda>>>(error);
      const reloj = ahora();
      const items = ((data ?? []) as unknown as FilaEntrada[]).map((f) => aEntrada(f, reloj));
      return bien(armarPagina<EntradaAgenda>(items, r, null));
    },

    async crearEntradaManual(datos: NuevaEntradaManual, clave) {
      // ⛔ La única creación a mano. La restricción `agenda_manual_acotada` de
      //    la base limita los tipos: visita, llamada o próximo paso. Lo demás
      //    llega derivado de algo que pasó, no de alguien que lo tipeó.
      const { data, error } = await sb.rpc('crear_entrada_manual', {
        p_datos: {
          tipo: datos.tipo,
          cliente_id: datos.clienteId,
          titulo: datos.titulo,
          detalle: datos.detalle ?? null,
          inicio_en: datos.inicioEn,
          fin_en: datos.finEn ?? null,
          prioridad: PRIORIDAD_HACIA[datos.prioridad ?? 'media'],
        },
        p_clave: clave,
      });
      if (error) return fallo<EntradaAgenda>(error);
      return leerUna(data as string);
    },

    async ajustarEntrada(ajuste: AjusteEntrada) {
      // ⛔ Mover una fecha exige motivo. La base también lo frena; acá el
      //    mensaje dice qué falta antes de gastar un viaje al servidor.
      if (!ajuste.motivo || ajuste.motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué movés la fecha antes de guardar.',
          campo: 'motivo',
        } };
      }

      const parche: Record<string, unknown> = {
        estado: 'reprogramada',
        motivo_reprogramacion: ajuste.motivo,
        fecha_ajustada_por_vendedor: true,
      };
      if (ajuste.inicioEn !== undefined) parche['inicio_en'] = ajuste.inicioEn;
      if (ajuste.finEn !== undefined) parche['fin_en'] = ajuste.finEn;
      if (ajuste.venceEn !== undefined) parche['vence_en'] = ajuste.venceEn;
      if (ajuste.prioridad !== undefined) parche['prioridad'] = PRIORIDAD_HACIA[ajuste.prioridad];

      const { error } = await sb.from('entrada_agenda').update(parche).eq('id', ajuste.entradaId);
      if (error) return fallo<EntradaAgenda>(error);
      return leerUna(ajuste.entradaId);
    },

    async completarEntrada(entradaId: Id, _clave) {
      const { error } = await sb
        .from('entrada_agenda')
        .update({ estado: 'completada', completada_en: new Date().toISOString() })
        .eq('id', entradaId);
      if (error) return fallo<EntradaAgenda>(error);
      return leerUna(entradaId);
    },

    async descartarEntrada(entradaId: Id, motivo: string) {
      // ⛔ AG4 · La agenda no se borra: se descarta, y con motivo. No hay
      //    política de `delete` sobre la tabla, así que no hay otra forma.
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué sacás esto de la agenda.',
          campo: 'motivo',
        } };
      }
      const { error } = await sb
        .from('entrada_agenda')
        .update({ estado: 'descartada', motivo_descarte: motivo })
        .eq('id', entradaId);
      if (error) return fallo<EntradaAgenda>(error);
      return leerUna(entradaId);
    },
  };
}
