/**
 * El dinero del vendedor, contra Supabase.
 *
 * ⛔ LA REGLA QUE ESTE ARCHIVO HACE CUMPLIR: el vendedor OBSERVA, no edita.
 *    En toda esta capa hay una sola escritura —abrir una observación— y no
 *    toca ningún importe: le avisa al administrador que algo no cuadra.
 *
 * ⛔ Y no se defiende desde acá. Las políticas de la base dan a `mensualidad`,
 *    `linea_participacion`, `liquidacion` y `participacion_producto` lectura
 *    de lo propio y escritura sólo a Administración. Un vendedor no puede
 *    fijarse su propia comisión aunque llame a la API a mano.
 *
 * ⛔ Nunca hay un total consolidado: las ocho cifras son `TotalesPorMoneda`,
 *    una entrada por moneda. Sumar guaraníes con dólares daría un número que
 *    no significa nada.
 */

import type {
  Ajuste, CapaDinero, Dinero, EstadoLinea, EstadoMensualidad, FiltroMensualidades,
  Id, LineaParticipacion, Liquidacion, LiquidacionDetalle, Mensualidad, Moneda,
  NuevaObservacion, Observacion, OpcionesPagina, PeriodoMensual, ProductoId,
  ResumenDinero, TotalesPorMoneda,
} from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';

const plata = (moneda: Moneda, monto: number): Dinero => ({ moneda, monto });

/** ⛔ Una entrada por moneda. Nunca un total consolidado. */
function sumarPorMoneda(filas: ReadonlyArray<{ moneda: Moneda; monto: number }>): TotalesPorMoneda {
  const por = new Map<Moneda, number>();
  for (const f of filas) por.set(f.moneda, (por.get(f.moneda) ?? 0) + f.monto);
  return [...por].map(([moneda, monto]) => plata(moneda, monto));
}

interface FilaMensualidad {
  readonly id: string;
  readonly cliente_id: string;
  readonly producto_id: string;
  readonly plan: string | null;
  readonly moneda: Moneda;
  readonly importe: number;
  readonly vendedor_id: string;
  readonly cotizacion_id: string;
  readonly alta_en: string;
  readonly baja_en: string | null;
  readonly motivo_baja: string | null;
  readonly estado: EstadoMensualidad;
  readonly dia_cobro: number | null;
  readonly cliente?: { readonly nombre: string } | null;
  readonly cobro_mensualidad?: ReadonlyArray<{ readonly estado: string }>;
}

const COLUMNAS_MENSUALIDAD = `id, cliente_id, producto_id, plan, moneda, importe, vendedor_id,
  cotizacion_id, alta_en, baja_en, motivo_baja, estado, dia_cobro,
  cliente ( nombre ), cobro_mensualidad ( estado )`;

/**
 * `mesesAcumulados` y `mesesDeParticipacionRestantes` no son columnas: se
 * cuentan. Guardarlos obligaria a recalcularlos cada vez que entra un cobro,
 * y bastaria un olvido para que el vendedor vea mal cuánto le queda.
 */
function aMensualidad(
  f: FilaMensualidad,
  mesesDeParticipacion: number | null,
): Mensualidad {
  const cobrados = (f.cobro_mensualidad ?? []).filter((c) => c.estado === 'cobrado').length;
  return {
    id: f.id,
    clienteId: f.cliente_id,
    nombreCliente: f.cliente?.nombre ?? '',
    productoId: f.producto_id as ProductoId,
    plan: f.plan,
    importe: plata(f.moneda, f.importe),
    vendedorId: f.vendedor_id,
    cotizacionId: f.cotizacion_id,
    altaEn: f.alta_en,
    bajaEn: f.baja_en,
    motivoBaja: f.motivo_baja,
    estado: f.estado,
    diaCobro: f.dia_cobro,
    mesesAcumulados: cobrados,
    // `null` = la participación no vence.
    mesesDeParticipacionRestantes:
      mesesDeParticipacion === null ? null : Math.max(0, mesesDeParticipacion - cobrados),
  };
}

interface FilaLinea {
  readonly id: string;
  readonly vendedor_id: string;
  readonly cliente_id: string;
  readonly producto_id: string;
  readonly origen: LineaParticipacion['origen'];
  readonly referencia_id: string;
  readonly moneda: Moneda;
  readonly base_cobrada: number;
  readonly participacion_id: string;
  readonly participacion_version: number;
  readonly porcentaje_vendedor_aplicado: number;
  readonly parte_labia: number;
  readonly parte_vendedor: number;
  readonly periodo: string;
  readonly estado: EstadoLinea;
  readonly liquidacion_id: string | null;
  readonly creado_en: string;
  readonly cliente?: { readonly nombre: string } | null;
}

const COLUMNAS_LINEA = `id, vendedor_id, cliente_id, producto_id, origen, referencia_id,
  moneda, base_cobrada, participacion_id, participacion_version, porcentaje_vendedor_aplicado,
  parte_labia, parte_vendedor, periodo, estado, liquidacion_id, creado_en,
  cliente ( nombre )`;

function aLinea(f: FilaLinea): LineaParticipacion {
  return {
    id: f.id,
    vendedorId: f.vendedor_id,
    clienteId: f.cliente_id,
    nombreCliente: f.cliente?.nombre ?? '',
    productoId: f.producto_id as ProductoId,
    origen: f.origen,
    referenciaId: f.referencia_id,
    baseCobrada: plata(f.moneda, f.base_cobrada),
    participacionId: f.participacion_id,
    participacionVersion: f.participacion_version,
    porcentajeVendedorAplicado: f.porcentaje_vendedor_aplicado,
    parteLabIA: plata(f.moneda, f.parte_labia),
    parteVendedor: plata(f.moneda, f.parte_vendedor),
    periodo: f.periodo,
    estado: f.estado,
    liquidacionId: f.liquidacion_id,
    devengadaEn: f.creado_en,
  };
}

interface FilaLiquidacion {
  readonly id: string;
  readonly vendedor_id: string;
  readonly periodo: string;
  readonly estado: 'borrador' | 'cerrada';
  readonly cerrada_en: string | null;
  readonly cerrada_por: string | null;
  readonly comprobante_documento_id: string | null;
  readonly linea_participacion?: ReadonlyArray<{ moneda: Moneda; parte_vendedor: number }>;
}

const COLUMNAS_LIQUIDACION = `id, vendedor_id, periodo, estado, cerrada_en, cerrada_por,
  comprobante_documento_id, linea_participacion ( moneda, parte_vendedor )`;

function aLiquidacion(f: FilaLiquidacion): Liquidacion {
  return {
    id: f.id,
    vendedorId: f.vendedor_id,
    periodo: f.periodo,
    // El total sale de sus lineas: no hay una columna que pueda quedar vieja.
    totalesPorMoneda: sumarPorMoneda(
      (f.linea_participacion ?? []).map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor })),
    ),
    estado: f.estado,
    cerradaEn: f.cerrada_en,
    cerradaPor: f.cerrada_por,
    comprobanteDocumentoId: f.comprobante_documento_id,
  };
}

interface FilaObservacion {
  readonly id: string;
  readonly linea_participacion_id: string;
  readonly abierta_por: string;
  readonly descripcion: string;
  readonly estado: Observacion['estado'];
  readonly resolucion: string | null;
  readonly resuelta_por: string | null;
  readonly resuelta_en: string | null;
  readonly abierta_en: string;
}

function aObservacion(f: FilaObservacion): Observacion {
  return {
    id: f.id,
    lineaParticipacionId: f.linea_participacion_id,
    abiertaPor: f.abierta_por,
    descripcion: f.descripcion,
    estado: f.estado,
    resolucion: f.resolucion,
    resueltaPor: f.resuelta_por,
    resueltaEn: f.resuelta_en,
    abiertaEn: f.abierta_en,
  };
}

// ---------------------------------------------------------------------------

export function crearCapaDinero(): CapaDinero {
  const sb = supabase();

  /** Meses de participación por producto, de la versión vigente. */
  async function mesesPorProducto(): Promise<Map<string, number | null>> {
    const { data } = await sb
      .from('participacion_producto')
      .select('producto_id, version, meses_participacion_vendedor')
      .order('version', { ascending: true });
    const mapa = new Map<string, number | null>();
    for (const p of (data ?? []) as unknown as Array<{
      producto_id: string; meses_participacion_vendedor: number | null;
    }>) {
      mapa.set(p.producto_id, p.meses_participacion_vendedor);
    }
    return mapa;
  }

  return {
    async resumenDinero(periodo: PeriodoMensual) {
      // Las ocho cifras salen de las lineas y los cobros del periodo. Ninguna
      // se guarda: un resumen guardado es un resumen que puede quedar viejo.
      const [lineas, cobros, mensualidades] = await Promise.all([
        sb.from('linea_participacion')
          .select('moneda, base_cobrada, parte_labia, parte_vendedor, estado')
          .eq('periodo', periodo),
        sb.from('cobro_mensualidad').select('moneda, importe, estado').eq('periodo', periodo),
        sb.from('mensualidad').select('moneda, importe, estado').eq('estado', 'activa'),
      ]);
      if (lineas.error) return fallo<ResumenDinero>(lineas.error);
      if (cobros.error) return fallo<ResumenDinero>(cobros.error);
      if (mensualidades.error) return fallo<ResumenDinero>(mensualidades.error);

      const ls = (lineas.data ?? []) as unknown as Array<{
        moneda: Moneda; base_cobrada: number; parte_labia: number;
        parte_vendedor: number; estado: EstadoLinea;
      }>;
      const cs = (cobros.data ?? []) as unknown as Array<{
        moneda: Moneda; importe: number; estado: string;
      }>;
      const ms = (mensualidades.data ?? []) as unknown as Array<{
        moneda: Moneda; importe: number;
      }>;

      const vivas = ls.filter((l) => l.estado !== 'anulada');
      return bien<ResumenDinero>({
        periodo,
        vendido: sumarPorMoneda(cs.map((c) => ({ moneda: c.moneda, monto: c.importe }))),
        cobrado: sumarPorMoneda(
          cs.filter((c) => c.estado === 'cobrado').map((c) => ({ moneda: c.moneda, monto: c.importe })),
        ),
        porCobrar: sumarPorMoneda(
          cs.filter((c) => c.estado === 'pendiente' || c.estado === 'atrasado')
            .map((c) => ({ moneda: c.moneda, monto: c.importe })),
        ),
        parteLabIA: sumarPorMoneda(vivas.map((l) => ({ moneda: l.moneda, monto: l.parte_labia }))),
        parteVendedor: sumarPorMoneda(vivas.map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor }))),
        comisionPendiente: sumarPorMoneda(
          vivas.filter((l) => l.estado === 'devengada')
            .map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor })),
        ),
        comisionPagada: sumarPorMoneda(
          vivas.filter((l) => l.estado === 'liquidada')
            .map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor })),
        ),
        mensualidadesVigentes: {
          cantidad: ms.length,
          importe: sumarPorMoneda(ms.map((m) => ({ moneda: m.moneda, monto: m.importe }))),
        },
      });
    },

    async listarMensualidades(filtro: FiltroMensualidades, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('mensualidad').select(COLUMNAS_MENSUALIDAD, { count: 'exact' });
      if (filtro.clienteId) consulta = consulta.eq('cliente_id', filtro.clienteId);
      if (filtro.productoId) consulta = consulta.eq('producto_id', filtro.productoId);
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);

      const { data, error, count } = await consulta
        .order('alta_en', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Mensualidad>>>(error);

      const meses = await mesesPorProducto();
      const items = ((data ?? []) as unknown as FilaMensualidad[])
        .map((f) => aMensualidad(f, meses.get(f.producto_id) ?? null));
      return bien(armarPagina<Mensualidad>(items, r, count ?? null));
    },

    async listarLineasParticipacion(periodo: PeriodoMensual, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('linea_participacion')
        .select(COLUMNAS_LINEA, { count: 'exact' })
        .eq('periodo', periodo)
        .order('creado_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<LineaParticipacion>>>(error);
      const items = ((data ?? []) as unknown as FilaLinea[]).map(aLinea);
      return bien(armarPagina<LineaParticipacion>(items, r, count ?? null));
    },

    async listarLiquidaciones(pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('liquidacion')
        .select(COLUMNAS_LIQUIDACION, { count: 'exact' })
        .order('periodo', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Liquidacion>>>(error);
      const items = ((data ?? []) as unknown as FilaLiquidacion[]).map(aLiquidacion);
      return bien(armarPagina<Liquidacion>(items, r, count ?? null));
    },

    async obtenerLiquidacion(id: Id) {
      const { data, error } = await sb
        .from('liquidacion').select(COLUMNAS_LIQUIDACION).eq('id', id).maybeSingle();
      if (error) return fallo<LiquidacionDetalle>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos esa liquidación.',
        } };
      }
      const base = aLiquidacion(data as unknown as FilaLiquidacion);

      const [lineas, ajustes] = await Promise.all([
        sb.from('linea_participacion').select(COLUMNAS_LINEA).eq('liquidacion_id', id),
        sb.from('ajuste').select('*').eq('periodo_aplicacion', base.periodo).eq('vendedor_id', base.vendedorId),
      ]);
      if (lineas.error) return fallo<LiquidacionDetalle>(lineas.error);
      if (ajustes.error) return fallo<LiquidacionDetalle>(ajustes.error);

      return bien<LiquidacionDetalle>({
        ...base,
        lineas: ((lineas.data ?? []) as unknown as FilaLinea[]).map(aLinea),
        ajustes: ((ajustes.data ?? []) as unknown as Array<{
          id: string; liquidacion_origen_id: string | null; periodo_aplicacion: string;
          vendedor_id: string; moneda: Moneda; importe: number; motivo: string;
          observacion_id: string | null; creado_por: string; creado_en: string;
        }>).map((a): Ajuste => ({
          id: a.id,
          liquidacionOrigenId: a.liquidacion_origen_id,
          periodoAplicacion: a.periodo_aplicacion,
          vendedorId: a.vendedor_id,
          // ⛔ Con signo: un ajuste puede restar. Por eso no se guarda un total
          //    en la liquidación: se suma con sus ajustes cada vez.
          importe: plata(a.moneda, a.importe),
          motivo: a.motivo,
          observacionId: a.observacion_id,
          creadoPor: a.creado_por,
          creadoEn: a.creado_en,
        })),
      });
    },

    async abrirObservacion(datos: NuevaObservacion, clave) {
      // ⛔ LA ÚNICA ESCRITURA DE ESTA CAPA. No modifica ningún importe: deja
      //    dicho que algo no cuadra para que lo mire Administración. Que no
      //    pueda tocar plata no es una decisión de este archivo: es que no hay
      //    ningún otro método, y las políticas de la base dan escritura sobre
      //    los importes sólo a Administración.
      if (!datos.descripcion || datos.descripcion.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá qué no te cuadra antes de abrir la observación.',
          campo: 'descripcion',
        } };
      }
      const { data, error } = await sb.rpc('abrir_observacion', {
        p_linea: datos.lineaParticipacionId,
        p_descripcion: datos.descripcion,
        p_clave: clave,
      });
      if (error) return fallo<Observacion>(error);
      const filas = (data ?? []) as unknown as FilaObservacion[];
      const o = filas.length > 0 ? filas[0] : undefined;
      if (!o) {
        return { ok: false as const, error: {
          codigo: 'servicio_no_disponible' as const,
          mensajeAmable: 'No pudimos abrir la observación. Probá de nuevo.',
        } };
      }
      return bien(aObservacion(o));
    },
  };
}
