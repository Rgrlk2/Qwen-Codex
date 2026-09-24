/**
 * Administración, contra Supabase. ⛔ Sólo el rol `administrador`.
 *
 * Acá se decide: se aprueban cotizaciones, se cierran períodos, se publican
 * participaciones y se dan de alta vendedores.
 *
 * ⛔ Ninguna de esas reglas vive en este archivo. Nadie aprueba lo suyo —ni el
 *    CEO—, un período no se cierra con observaciones abiertas, una
 *    participación no se edita sino que se publica en versión nueva, y un
 *    período cerrado no se reabre. Todo eso lo hace cumplir la base.
 *
 * ⛔ Y hay métodos que deliberadamente NO EXISTEN, porque su ausencia ES la
 *    regla: `crearProducto` (el portafolio está cerrado en 13),
 *    `editarParticipacion` (sólo se publica una versión nueva),
 *    `reabrirPeriodo` (sólo se crea un ajuste), `autoaprobarCotizacion`.
 */

import type {
  AccesoEnlace, AccionRevision, Actividad, Ajuste, AltaDeUsuario, AlternativaCalculada,
  CambioTaxonomia, CapaAdministracion, Cliente, CodigoAlternativa,
  ConstanciaRespuesta, ControlFinanciero, Cotizacion, CotizacionDetalle, Dinero,
  EstadoObservacion, EstadoProveedores, EventoLineaTiempo, FilaRanking,
  FiltroAperturas, FiltroClientes, FiltroColaRevision, FiltroRegistroAcceso,
  FiltroSugerencias, FiltroUsuarios, Firma, Id, LineaParticipacion,
  LineaPorCobrar, Liquidacion, Moneda, NuevaParticipacion, NuevoAjuste,
  NuevoPresupuesto, NuevoUsuario, Observacion, OpcionesPagina, ParametrosSistema,
  ParticipacionProducto, PeriodoMensual, PrecioListaEntrada, Presupuesto,
  Producto, ProductoId, ReasignacionCartera, RegistroAcceso, Resultado,
  ResultadoNotificaciones, ResultadoReasignacion, ResolucionSugerencia, Rol,
  RolFirmante, SugerenciaProducto, TotalesPorMoneda, Usuario, VerificacionCierre,
  AgregadoSugerencias, UsoPorVendedor, ISODate, TipoDispositivo,
} from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';

const plata = (moneda: Moneda, monto: number): Dinero => ({ moneda, monto });

function sumarPorMoneda(filas: ReadonlyArray<{ moneda: Moneda; monto: number }>): TotalesPorMoneda {
  const por = new Map<Moneda, number>();
  for (const f of filas) por.set(f.moneda, (por.get(f.moneda) ?? 0) + f.monto);
  return [...por].map(([moneda, monto]) => plata(moneda, monto));
}

/** Lo que no se pudo hacer todavía se dice, no se simula. */
function todaviaNo<T>(que: string): Resultado<T> {
  return {
    ok: false,
    error: {
      codigo: 'servicio_no_disponible',
      mensajeAmable: que,
      pista: 'Esto queda pendiente del lado del servidor. No es un error tuyo.',
    },
  };
}

/**
 * Las filas llegan en `snake_case` y el contrato habla `camelCase`. Castear
 * una por la otra compila y miente: `entidadTipo` sería `undefined` en tiempo
 * de ejecución. Estos tres mapeos son el puente, escrito a mano campo a campo.
 */
function registroDeFila(f: Record<string, unknown>): RegistroAcceso {
  return {
    id: f['id'] as Id,
    actorId: f['actor_id'] as Id,
    nombreActor: f['nombre_actor'] as string,
    rol: f['rol'] as Rol,
    accion: f['accion'] as RegistroAcceso['accion'],
    entidadTipo: f['entidad_tipo'] as RegistroAcceso['entidadTipo'],
    entidadId: (f['entidad_id'] as Id | null) ?? null,
    valorAnterior: f['valor_anterior'] ?? null,
    valorPosterior: f['valor_posterior'] ?? null,
    ocurridoEn: f['ocurrido_en'] as ISODate,
    origenSesion: {
      tipoDispositivo: f['tipo_dispositivo'] as TipoDispositivo,
      paisAproximado: (f['pais_aproximado'] as string | null) ?? null,
    },
  };
}

function aperturaDeFila(f: Record<string, unknown>): AccesoEnlace {
  return {
    id: f['id'] as Id,
    enlaceId: f['enlace_id'] as Id,
    documentoId: (f['documento_id'] as Id | null) ?? null,
    tipoDocumento: f['tipo_documento'] as AccesoEnlace['tipoDocumento'],
    ocurridoEn: f['ocurrido_en'] as ISODate,
    tipoDispositivo: f['tipo_dispositivo'] as TipoDispositivo,
    paisAproximado: (f['pais_aproximado'] as string | null) ?? null,
    duracionSegundos: (f['duracion_segundos'] as number | null) ?? null,
    resultado: f['resultado'] as AccesoEnlace['resultado'],
  };
}

function sugerenciaDeFila(f: Record<string, unknown>): SugerenciaProducto {
  return {
    id: f['id'] as Id,
    titulo: f['titulo'] as string,
    problemaCliente: f['problema_cliente'] as string,
    clienteId: (f['cliente_id'] as Id | null) ?? null,
    actividadId: (f['actividad_id'] as Id | null) ?? null,
    frecuenciaObservada: f['frecuencia_observada'] as SugerenciaProducto['frecuenciaObservada'],
    productosQueNoAlcanzan: (f['productos_que_no_alcanzan'] as ReadonlyArray<ProductoId>) ?? [],
    porQueNoAlcanzan: (f['por_que_no_alcanzan'] as string | null) ?? '',
    // Los adjuntos viven en su propia tabla: el listado no los trae.
    adjuntos: [],
    creadaPor: f['creada_por'] as Id,
    creadaEn: f['creada_en'] as ISODate,
    estado: f['estado'] as SugerenciaProducto['estado'],
    resolucion: (f['resolucion'] as string | null) ?? null,
    productoQueLoCubre: (f['producto_que_lo_cubre'] as ProductoId | null) ?? null,
    duplicadaDe: (f['duplicada_de'] as Id | null) ?? null,
    resueltaPor: (f['resuelta_por'] as Id | null) ?? null,
    resueltaEn: (f['resuelta_en'] as ISODate | null) ?? null,
  };
}

export function crearCapaAdministracion(): CapaAdministracion {
  const sb = supabase();

  async function yo(): Promise<string | null> {
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  }

  return {
    // --- Control financiero -----------------------------------------------

    async controlFinanciero(periodo: PeriodoMensual) {
      const [lineas, cobros, activas, bajas, revision, sugerencias] = await Promise.all([
        sb.from('linea_participacion').select('moneda, parte_labia, parte_vendedor, estado').eq('periodo', periodo),
        sb.from('cobro_mensualidad').select('moneda, importe, estado').eq('periodo', periodo),
        sb.from('mensualidad').select('id', { count: 'exact', head: true }).eq('estado', 'activa'),
        sb.from('mensualidad').select('id', { count: 'exact', head: true }).eq('estado', 'baja'),
        sb.from('cotizacion').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision'),
        sb.from('sugerencia_producto').select('id', { count: 'exact', head: true }).eq('estado', 'abierta'),
      ]);
      if (lineas.error) return fallo<ControlFinanciero>(lineas.error);
      if (cobros.error) return fallo<ControlFinanciero>(cobros.error);

      const ls = (lineas.data ?? []) as unknown as Array<{
        moneda: Moneda; parte_labia: number; parte_vendedor: number; estado: string;
      }>;
      const cs = (cobros.data ?? []) as unknown as Array<{
        moneda: Moneda; importe: number; estado: string;
      }>;
      const vivas = ls.filter((l) => l.estado !== 'anulada');

      return bien<ControlFinanciero>({
        periodo,
        vendido: sumarPorMoneda(cs.map((c) => ({ moneda: c.moneda, monto: c.importe }))),
        cobrado: sumarPorMoneda(cs.filter((c) => c.estado === 'cobrado').map((c) => ({ moneda: c.moneda, monto: c.importe }))),
        porCobrar: sumarPorMoneda(cs.filter((c) => c.estado === 'pendiente' || c.estado === 'atrasado').map((c) => ({ moneda: c.moneda, monto: c.importe }))),
        parteLabIA: sumarPorMoneda(vivas.map((l) => ({ moneda: l.moneda, monto: l.parte_labia }))),
        parteVendedores: sumarPorMoneda(vivas.map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor }))),
        comisionPendiente: sumarPorMoneda(vivas.filter((l) => l.estado === 'devengada').map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor }))),
        comisionPagada: sumarPorMoneda(vivas.filter((l) => l.estado === 'liquidada').map((l) => ({ moneda: l.moneda, monto: l.parte_vendedor }))),
        mensualidadesActivas: activas.count ?? 0,
        bajasDelPeriodo: bajas.count ?? 0,
        cotizacionesEnRevision: revision.count ?? 0,
        sugerenciasSinResponder: sugerencias.count ?? 0,
      });
    },

    async porCobrar(vendedorId: Id | null, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb
        .from('cobro_mensualidad')
        .select('id, periodo, moneda, importe, estado, mensualidad ( id, cliente_id, producto_id, vendedor_id, dia_cobro, cliente ( nombre ), usuario ( nombre ) )', { count: 'exact' })
        .in('estado', ['pendiente', 'atrasado']);
      if (vendedorId) consulta = consulta.eq('mensualidad.vendedor_id', vendedorId);

      const { data, error, count } = await consulta.order('periodo').range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<LineaPorCobrar>>>(error);

      const hoy = Date.now();
      const items = ((data ?? []) as unknown as Array<{
        id: string; periodo: string; moneda: Moneda; importe: number;
        estado: LineaPorCobrar['estado'];
        mensualidad: {
          id: string; cliente_id: string; producto_id: string; vendedor_id: string;
          dia_cobro: number | null;
          cliente: { nombre: string } | null; usuario: { nombre: string } | null;
        } | null;
      }>).flatMap((c): LineaPorCobrar[] => {
        const m = c.mensualidad;
        if (!m) return [];
        const vence = m.dia_cobro ? `${c.periodo}-${String(m.dia_cobro).padStart(2, '0')}` : null;
        return [{
          id: c.id,
          clienteId: m.cliente_id,
          nombreCliente: m.cliente?.nombre ?? '',
          vendedorId: m.vendedor_id,
          nombreVendedor: m.usuario?.nombre ?? '',
          productoId: m.producto_id as ProductoId,
          origen: 'mensualidad',
          importe: plata(c.moneda, c.importe),
          venceEn: vence,
          diasDeAntiguedad: vence
            ? Math.max(0, Math.floor((hoy - new Date(vence).getTime()) / 86_400_000))
            : 0,
          estado: c.estado,
        }];
      });
      return bien(armarPagina<LineaPorCobrar>(items, r, count ?? null));
    },

    async rankingVendedores(periodo: PeriodoMensual) {
      const [cobros, metas, usuarios] = await Promise.all([
        sb.from('cobro_mensualidad').select('moneda, importe, estado, mensualidad ( vendedor_id )').eq('periodo', periodo),
        sb.from('presupuesto').select('vendedor_id, moneda, meta_vendido').eq('periodo', periodo),
        sb.from('usuario').select('id, nombre').eq('rol', 'vendedor'),
      ]);
      if (cobros.error) return fallo<ReadonlyArray<FilaRanking>>(cobros.error);

      const nombres = new Map(
        ((usuarios.data ?? []) as unknown as Array<{ id: string; nombre: string }>)
          .map((u) => [u.id, u.nombre]),
      );
      const porMeta = new Map(
        ((metas.data ?? []) as unknown as Array<{ vendedor_id: string; moneda: Moneda; meta_vendido: number }>)
          .map((m) => [m.vendedor_id, plata(m.moneda, m.meta_vendido)]),
      );

      const acum = new Map<string, { vendido: number; cobrado: number }>();
      for (const c of (cobros.data ?? []) as unknown as Array<{
        moneda: Moneda; importe: number; estado: string; mensualidad: { vendedor_id: string } | null;
      }>) {
        // ⛔ El ranking ordena por guaraníes. Un cobro en otra moneda no se
        //    convierte: no hay tipo de cambio institucional definido.
        if (!c.mensualidad || c.moneda !== 'PYG') continue;
        const a = acum.get(c.mensualidad.vendedor_id) ?? { vendido: 0, cobrado: 0 };
        a.vendido += c.importe;
        if (c.estado === 'cobrado') a.cobrado += c.importe;
        acum.set(c.mensualidad.vendedor_id, a);
      }

      const filas = [...acum]
        .sort((a, b) => b[1].vendido - a[1].vendido)
        .map(([vendedorId, a], i): FilaRanking => {
          const meta = porMeta.get(vendedorId) ?? null;
          return {
            posicion: i + 1,
            vendedorId,
            nombreVendedor: nombres.get(vendedorId) ?? '',
            vendido: plata('PYG', a.vendido),
            cobrado: plata('PYG', a.cobrado),
            metaVendido: meta,
            cumplimientoGuaranies: meta ? plata('PYG', a.vendido - meta.monto) : null,
            cumplimientoPorcentaje: meta && meta.monto > 0
              ? Math.round((a.vendido / meta.monto) * 1000) / 10
              : null,
          };
        });
      return bien<ReadonlyArray<FilaRanking>>(filas);
    },

    // --- Presupuesto -------------------------------------------------------

    async listarPresupuestos(periodo: PeriodoMensual) {
      const { data, error } = await sb
        .from('presupuesto')
        .select('id, vendedor_id, periodo, meta_vendido, meta_cobrado, moneda, definido_por, definido_en, version, usuario ( nombre )')
        .eq('periodo', periodo)
        .order('meta_vendido', { ascending: false });
      if (error) return fallo<ReadonlyArray<Presupuesto>>(error);
      return bien(((data ?? []) as unknown as Array<{
        id: string; vendedor_id: string; periodo: string; meta_vendido: number;
        meta_cobrado: number | null; moneda: Moneda; definido_por: string;
        definido_en: string; version: number; usuario: { nombre: string } | null;
      }>).map((p): Presupuesto => ({
        id: p.id,
        vendedorId: p.vendedor_id,
        nombreVendedor: p.usuario?.nombre ?? '',
        periodo: p.periodo,
        metaVendido: plata(p.moneda, p.meta_vendido),
        metaCobrado: p.meta_cobrado === null ? null : plata(p.moneda, p.meta_cobrado),
        definidoPor: p.definido_por,
        definidoEn: p.definido_en,
        version: p.version,
      })));
    },

    async definirPresupuesto(datos: NuevoPresupuesto, clave) {
      const quien = await yo();
      if (!quien) return todaviaNo<Presupuesto>('Tu sesión venció. Volvé a entrar.');
      const { data, error } = await sb.rpc('definir_presupuesto', {
        p_datos: {
          vendedorId: datos.vendedorId,
          periodo: datos.periodo,
          moneda: datos.metaVendido.moneda,
          metaVendido: datos.metaVendido.monto,
          metaCobrado: datos.metaCobrado?.monto ?? null,
        },
        p_clave: clave,
      });
      if (error) return fallo<Presupuesto>(error);
      const filas = (data ?? []) as unknown as Array<{
        id: string; vendedor_id: string; periodo: string; meta_vendido: number;
        meta_cobrado: number | null; moneda: Moneda; definido_por: string;
        definido_en: string; version: number;
      }>;
      const p = filas.length > 0 ? filas[0] : undefined;
      if (!p) return todaviaNo<Presupuesto>('No pudimos guardar el presupuesto.');
      return bien<Presupuesto>({
        id: p.id, vendedorId: p.vendedor_id, nombreVendedor: '',
        periodo: p.periodo, metaVendido: plata(p.moneda, p.meta_vendido),
        metaCobrado: p.meta_cobrado === null ? null : plata(p.moneda, p.meta_cobrado),
        definidoPor: p.definido_por, definidoEn: p.definido_en, version: p.version,
      });
    },

    // --- Comisiones --------------------------------------------------------

    async listarParticipacionesTodas(periodo: PeriodoMensual, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('linea_participacion')
        .select('*, cliente ( nombre )', { count: 'exact' })
        .eq('periodo', periodo)
        .order('creado_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<LineaParticipacion>>>(error);
      const items = ((data ?? []) as unknown as Array<Record<string, unknown> & {
        moneda: Moneda; base_cobrada: number; parte_labia: number; parte_vendedor: number;
        cliente: { nombre: string } | null;
      }>).map((f): LineaParticipacion => ({
        id: f['id'] as string,
        vendedorId: f['vendedor_id'] as string,
        clienteId: f['cliente_id'] as string,
        nombreCliente: f.cliente?.nombre ?? '',
        productoId: f['producto_id'] as ProductoId,
        origen: f['origen'] as LineaParticipacion['origen'],
        referenciaId: f['referencia_id'] as string,
        baseCobrada: plata(f.moneda, f.base_cobrada),
        participacionId: f['participacion_id'] as string,
        participacionVersion: f['participacion_version'] as number,
        porcentajeVendedorAplicado: f['porcentaje_vendedor_aplicado'] as number,
        parteLabIA: plata(f.moneda, f.parte_labia),
        parteVendedor: plata(f.moneda, f.parte_vendedor),
        periodo: f['periodo'] as string,
        estado: f['estado'] as LineaParticipacion['estado'],
        liquidacionId: (f['liquidacion_id'] as string | null) ?? null,
        devengadaEn: f['creado_en'] as string,
      }));
      return bien(armarPagina<LineaParticipacion>(items, r, count ?? null));
    },

    async verificarCierrePeriodo(periodo: PeriodoMensual) {
      // ⛔ Las mismas tres condiciones que mira `cerrar_periodo` en la base.
      //    Acá sólo se muestran antes de decidir; quien manda es la base.
      const [revision, cobros, observaciones] = await Promise.all([
        sb.from('cotizacion').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision'),
        sb.from('cobro_mensualidad').select('id', { count: 'exact', head: true })
          .eq('periodo', periodo).in('estado', ['pendiente', 'atrasado']),
        sb.from('observacion').select('id, linea_participacion!inner ( periodo )', { count: 'exact', head: true })
          .eq('estado', 'abierta').eq('linea_participacion.periodo', periodo),
      ]);

      const bloqueos: Array<VerificacionCierre['bloqueos'][number]> = [];
      if ((revision.count ?? 0) > 0) {
        bloqueos.push({
          tipo: 'cotizaciones_sin_resolver', cantidad: revision.count ?? 0,
          detalle: 'Hay cotizaciones esperando tu respuesta.',
        });
      }
      if ((cobros.count ?? 0) > 0) {
        bloqueos.push({
          tipo: 'cobros_sin_confirmar', cantidad: cobros.count ?? 0,
          detalle: 'Hay cobros del período sin confirmar ni marcar incobrables.',
        });
      }
      if ((observaciones.count ?? 0) > 0) {
        bloqueos.push({
          tipo: 'observaciones_abiertas', cantidad: observaciones.count ?? 0,
          detalle: 'Un vendedor observó una comisión y todavía no tiene respuesta.',
        });
      }
      return bien<VerificacionCierre>({ periodo, puedeCerrar: bloqueos.length === 0, bloqueos });
    },

    async cerrarPeriodo(periodo: PeriodoMensual, clave) {
      // ⛔ IRREVERSIBLE. Un período cerrado no se reabre: lo que se corrija
      //    después se corrige con un ajuste, que deja constancia.
      const { data, error } = await sb.rpc('cerrar_periodo', { p_periodo: periodo, p_clave: clave });
      if (error) return fallo<ReadonlyArray<Liquidacion>>(error);
      return bien(((data ?? []) as unknown as Array<{
        id: string; vendedor_id: string; periodo: string;
        estado: 'borrador' | 'cerrada'; cerrada_en: string | null;
        cerrada_por: string | null; comprobante_documento_id: string | null;
      }>).map((l): Liquidacion => ({
        id: l.id, vendedorId: l.vendedor_id, periodo: l.periodo,
        totalesPorMoneda: [], estado: l.estado, cerradaEn: l.cerrada_en,
        cerradaPor: l.cerrada_por, comprobanteDocumentoId: l.comprobante_documento_id,
      })));
    },

    async crearAjuste(datos: NuevoAjuste, clave) {
      if (!datos.motivo || datos.motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Un ajuste sin motivo no se puede explicar después.',
          campo: 'motivo',
        } };
      }
      const { data, error } = await sb.rpc('crear_ajuste', {
        p_datos: {
          liquidacionOrigenId: datos.liquidacionOrigenId ?? null,
          periodoAplicacion: datos.periodoAplicacion,
          vendedorId: datos.vendedorId,
          moneda: datos.importe.moneda,
          importe: datos.importe.monto,
          motivo: datos.motivo,
          observacionId: datos.observacionId ?? null,
        },
        p_clave: clave,
      });
      if (error) return fallo<Ajuste>(error);
      const filas = (data ?? []) as unknown as Array<{
        id: string; liquidacion_origen_id: string | null; periodo_aplicacion: string;
        vendedor_id: string; moneda: Moneda; importe: number; motivo: string;
        observacion_id: string | null; creado_por: string; creado_en: string;
      }>;
      const a = filas.length > 0 ? filas[0] : undefined;
      if (!a) return todaviaNo<Ajuste>('No pudimos registrar el ajuste.');
      return bien<Ajuste>({
        id: a.id, liquidacionOrigenId: a.liquidacion_origen_id,
        periodoAplicacion: a.periodo_aplicacion, vendedorId: a.vendedor_id,
        importe: plata(a.moneda, a.importe), motivo: a.motivo,
        observacionId: a.observacion_id, creadoPor: a.creado_por, creadoEn: a.creado_en,
      });
    },

    async resolverObservacion(id: Id, estado: EstadoObservacion, comentario: string) {
      // ⛔ El silencio no es una resolución válida.
      if (!comentario || comentario.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contestale al vendedor: una observación no se cierra sin respuesta.',
          campo: 'comentario',
        } };
      }
      const quien = await yo();
      const { data, error } = await sb
        .from('observacion')
        .update({ estado, resolucion: comentario, resuelta_por: quien, resuelta_en: new Date().toISOString() })
        .eq('id', id).select('*').maybeSingle();
      if (error) return fallo<Observacion>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos esa observación.',
        } };
      }
      const o = data as unknown as {
        id: string; linea_participacion_id: string; abierta_por: string;
        descripcion: string; estado: EstadoObservacion; resolucion: string | null;
        resuelta_por: string | null; resuelta_en: string | null; abierta_en: string;
      };
      return bien<Observacion>({
        id: o.id, lineaParticipacionId: o.linea_participacion_id,
        abiertaPor: o.abierta_por, descripcion: o.descripcion, estado: o.estado,
        resolucion: o.resolucion, resueltaPor: o.resuelta_por,
        resueltaEn: o.resuelta_en, abiertaEn: o.abierta_en,
      });
    },

    // --- Todos los clientes ------------------------------------------------

    async listarTodosLosClientes(filtro: FiltroClientes, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('cliente')
        .select('*, cliente_operacion_confirmada ( operacion_id )', { count: 'exact' })
        .is('archivado_en', null);
      if (filtro.tipo) consulta = consulta.eq('tipo', filtro.tipo);
      if (filtro.etapa) consulta = consulta.eq('etapa', filtro.etapa);
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      const { data, error, count } = await consulta.order('nombre').range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Cliente>>>(error);
      const items = ((data ?? []) as unknown as Array<Record<string, unknown> & {
        cliente_operacion_confirmada: Array<{ operacion_id: string }>;
      }>).map((f): Cliente => ({
        id: f['id'] as string,
        tipo: f['tipo'] as Cliente['tipo'],
        nombre: f['nombre'] as string,
        actividadId: f['actividad_id'] as string,
        operacionesConfirmadas: f.cliente_operacion_confirmada.map((o) => o.operacion_id),
        vendedorId: f['vendedor_id'] as string,
        etapa: f['etapa'] as Cliente['etapa'],
        ciudad: (f['ciudad'] as string | null) ?? null,
        ultimaInteraccionEn: (f['ultima_interaccion_en'] as string | null) ?? null,
        proximoPasoEn: (f['proximo_paso_en'] as string | null) ?? null,
        motivoPerdida: (f['motivo_perdida'] as string | null) ?? null,
        archivadoEn: (f['archivado_en'] as string | null) ?? null,
        creadoEn: f['creado_en'] as string,
        creadoPor: (f['creado_por'] as string | null) ?? 'sistema',
        actualizadoEn: f['actualizado_en'] as string,
        actualizadoPor: (f['actualizado_por'] as string | null) ?? 'sistema',
        version: f['version'] as number,
      }));
      return bien(armarPagina<Cliente>(items, r, count ?? null));
    },

    async lineaDeTiempoDeCualquierCliente(clienteId: Id, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('evento_linea_tiempo')
        .select('*', { count: 'exact' })
        .eq('cliente_id', clienteId)
        .order('ocurrido_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<EventoLineaTiempo>>>(error);
      const items = ((data ?? []) as unknown as Array<{
        id: string; cliente_id: string; tipo: EventoLineaTiempo['tipo'];
        ocurrido_en: string; titulo: string; detalle: string | null; referencia_id: string;
      }>).map((e): EventoLineaTiempo => ({
        id: e.id, clienteId: e.cliente_id, tipo: e.tipo, ocurridoEn: e.ocurrido_en,
        titulo: e.titulo, detalle: e.detalle, referenciaId: e.referencia_id,
      }));
      return bien(armarPagina<EventoLineaTiempo>(items, r, count ?? null));
    },

    // --- Aprobación de cotizaciones ---------------------------------------

    async colaDeRevision(filtro: FiltroColaRevision, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('cotizacion')
        .select('*, cotizacion_alcance ( clase, texto ), aporte_del_cliente ( tipo, descripcion, bloqueante )', { count: 'exact' })
        .eq('estado', 'en_revision');
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      if (filtro.desde) consulta = consulta.gte('fecha_emision', filtro.desde);

      const orden = filtro.ordenarPor === 'monto' ? 'setup_especial' : 'fecha_emision';
      const { data, error, count } = await consulta
        .order(orden, { ascending: filtro.ordenarPor !== 'monto' })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<CotizacionDetalle>>>(error);
      // La cola muestra lo esencial para decidir; el detalle completo se pide
      // con `obtenerCotizacion` de la capa de propuestas.
      return bien(armarPagina<CotizacionDetalle>(
        (data ?? []) as unknown as ReadonlyArray<CotizacionDetalle>, r, count ?? null,
      ));
    },

    async revisarCotizacion(
      id: Id,
      accion: Extract<AccionRevision, 'aprobar' | 'corregir' | 'rechazar'>,
      comentario: string,
      clave,
      alternativasAprobadas?: ReadonlyArray<CodigoAlternativa>,
    ) {
      // ⛔ Comentario vacío ⇒ validación. Y nadie aprueba lo suyo: eso lo
      //    frena la base, que es donde tiene que estar.
      if (!comentario || comentario.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Escribí un comentario: es lo que el vendedor va a leer.',
          campo: 'comentario',
        } };
      }
      const { error } = await sb.rpc('revisar_cotizacion', {
        p_cotizacion: id,
        p_accion: accion,
        p_comentario: comentario,
        p_clave: clave,
        p_alternativas: alternativasAprobadas ?? null,
      });
      if (error) return fallo<Cotizacion>(error);

      const { data, error: lectura } = await sb
        .from('cotizacion').select('*').eq('id', id).maybeSingle();
      if (lectura) return fallo<Cotizacion>(lectura);
      return bien(data as unknown as Cotizacion);
    },

    async recalcularCotizacion(id: Id) {
      // Los cuatro cálculos, para poder verlos antes de decidir. Al aprobar,
      // la base los vuelve a correr igual: esto no los reemplaza.
      const { data, error } = await sb
        .from('cotizacion')
        .select('moneda, setup_lista, setup_especial, mensual_lista, mensual_especial')
        .eq('id', id).maybeSingle();
      if (error) return fallo<ReadonlyArray<AlternativaCalculada>>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos esa cotización.',
        } };
      }
      const f = data as unknown as {
        moneda: Moneda; setup_lista: number | null; setup_especial: number;
        mensual_lista: number | null; mensual_especial: number;
      };
      const { calcularAlternativas } = await import('@labia/compartido');
      return bien(calcularAlternativas({
        setupLista: plata(f.moneda, f.setup_lista ?? f.setup_especial),
        setupEspecial: plata(f.moneda, f.setup_especial),
        mensualLista: plata(f.moneda, f.mensual_lista ?? f.mensual_especial),
        mensualEspecial: plata(f.moneda, f.mensual_especial),
      }));
    },

    async firmarComoCeo(cotizacionId: Id, clave) {
      // ⛔ Sucede AL APROBAR, no antes. Y la referencia al activo protegido la
      //    resuelve el servidor: acá no viaja la imagen ni su ubicación.
      const { data, error } = await sb.rpc('firmar_como_ceo', {
        p_cotizacion: cotizacionId, p_clave: clave,
      });
      if (error) return fallo<Firma>(error);
      const filas = (data ?? []) as unknown as ReadonlyArray<Record<string, unknown>>;
      const f = filas.length > 0 ? filas[0] : undefined;
      if (!f) return todaviaNo<Firma>('No pudimos registrar la firma.');
      return bien<Firma>({
        id: f['id'] as string,
        rol: f['rol'] as Firma['rol'],
        firmanteId: f['firmante_id'] as string,
        nombreFirmante: f['nombre_firmante'] as string,
        aclaracion: (f['aclaracion'] as string | null) ?? '',
        referenciaProtegida: f['referencia_protegida'] as string,
        firmadoEn: f['firmado_en'] as string,
        versionFirmada: f['version_firmada'] as number,
        anulada: f['anulada'] as boolean,
        anuladaEn: (f['anulada_en'] as string | null) ?? null,
        motivoAnulacion: (f['motivo_anulacion'] as string | null) ?? null,
      });
    },

    async firmasDeCotizacion(cotizacionId: Id) {
      const { data, error } = await sb
        .from('firma').select('*').eq('cotizacion_id', cotizacionId).order('firmado_en');
      if (error) return fallo<ReadonlyArray<Firma>>(error);
      return bien((data ?? []) as unknown as ReadonlyArray<Firma>);
    },

    async anulacionesDeFirma(cotizacionId: Id, rol?: RolFirmante) {
      let consulta = sb.from('firma').select('*')
        .eq('cotizacion_id', cotizacionId).eq('anulada', true);
      if (rol) consulta = consulta.eq('rol', rol);
      const { data, error } = await consulta.order('anulada_en', { ascending: false });
      if (error) return fallo<ReadonlyArray<Firma>>(error);
      return bien((data ?? []) as unknown as ReadonlyArray<Firma>);
    },

    // --- Constancias y avisos ----------------------------------------------

    async listarConstancias(pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('constancia_respuesta')
        .select('*, importe_aceptado ( concepto, moneda, monto )', { count: 'exact' })
        .order('respondida_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<ConstanciaRespuesta>>>(error);
      return bien(armarPagina<ConstanciaRespuesta>(
        (data ?? []) as unknown as ReadonlyArray<ConstanciaRespuesta>, r, count ?? null,
      ));
    },

    async reintentarNotificaciones(_constanciaId: Id) {
      // ⛔ El envío de avisos vive en el servidor, con los destinos —incluido
      //    el celular del CEO— que nunca salen de ahí. Todavía no hay función
      //    de servidor desplegada, y no se simula un envío que no ocurrió.
      return todaviaNo<ResultadoNotificaciones>(
        'El reenvío de avisos todavía no está conectado. La constancia ya está guardada: no se perdió nada.',
      );
    },

    // --- Configuración comercial -------------------------------------------

    async listarParticipaciones() {
      const { data, error } = await sb
        .from('participacion_producto').select('*')
        .order('producto_id').order('version', { ascending: false });
      if (error) return fallo<ReadonlyArray<ParticipacionProducto>>(error);
      return bien(((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map((p): ParticipacionProducto => ({
          id: p['id'] as string,
          productoId: p['producto_id'] as ProductoId,
          porcentajeLabIA: p['porcentaje_labia'] as number,
          porcentajeVendedor: p['porcentaje_vendedor'] as number,
          aplicaASetup: p['aplica_a_setup'] as boolean,
          aplicaAMensualidad: p['aplica_a_mensualidad'] as boolean,
          mesesParticipacionVendedor: (p['meses_participacion_vendedor'] as number | null) ?? null,
          version: p['version'] as number,
          vigenteDesde: p['vigente_desde'] as string,
          publicadaPor: p['publicada_por'] as string,
          publicadaEn: p['publicada_en'] as string,
        })));
    },

    async publicarParticipacion(datos: NuevaParticipacion, clave) {
      // ⛔ Los porcentajes suman 100. Y esto NO edita: publica una versión
      //    nueva. Las líneas ya devengadas guardan con qué versión se
      //    calcularon, así que cambiar la regla no reescribe el pasado.
      if (datos.porcentajeLabIA + datos.porcentajeVendedor !== 100) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: `Los porcentajes tienen que sumar 100. Van ${datos.porcentajeLabIA} + ${datos.porcentajeVendedor}.`,
        } };
      }
      const { data, error } = await sb.rpc('publicar_participacion', {
        p_datos: datos as unknown as Record<string, unknown>, p_clave: clave,
      });
      if (error) return fallo<ParticipacionProducto>(error);
      const filas = (data ?? []) as unknown as Array<Record<string, unknown>>;
      const p = filas.length > 0 ? filas[0] : undefined;
      if (!p) return todaviaNo<ParticipacionProducto>('No pudimos publicar la participación.');
      return bien<ParticipacionProducto>({
        id: p['id'] as string,
        productoId: p['producto_id'] as ProductoId,
        porcentajeLabIA: p['porcentaje_labia'] as number,
        porcentajeVendedor: p['porcentaje_vendedor'] as number,
        aplicaASetup: p['aplica_a_setup'] as boolean,
        aplicaAMensualidad: p['aplica_a_mensualidad'] as boolean,
        mesesParticipacionVendedor: (p['meses_participacion_vendedor'] as number | null) ?? null,
        version: p['version'] as number,
        vigenteDesde: p['vigente_desde'] as string,
        publicadaPor: p['publicada_por'] as string,
        publicadaEn: p['publicada_en'] as string,
      });
    },

    async cargarPreciosLista(_precios: ReadonlyArray<PrecioListaEntrada>, _motivo: string) {
      // ⛔ Los precios son transcripción literal de COMMERCIAL_RULES §2 y se
      //    cargan con `npm run exportar:taxonomia`, del mismo archivo que usa
      //    el Escritorio. Cargarlos a mano desde una pantalla abriría la
      //    puerta a que la base y el documento aprobado digan cosas distintas.
      return todaviaNo<{ readonly versionCatalogo: number }>(
        'Los precios de lista se cargan del documento aprobado, no desde una pantalla.',
      );
    },

    async publicarProducto(id: ProductoId, publicado: boolean, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Decí por qué cambia la publicación del producto.', campo: 'motivo',
        } };
      }
      const { data, error } = await sb
        .from('producto').update({ publicado }).eq('id', id).select('*').maybeSingle();
      if (error) return fallo<Producto>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'Ese producto no está en el portafolio.',
        } };
      }
      const p = data as unknown as Record<string, unknown>;
      return bien<Producto>({
        id: p['id'] as ProductoId, nombre: p['nombre'] as string,
        familia: p['familia'] as Producto['familia'], orden: p['orden'] as number,
        claveCopy: p['clave_copy'] as string,
        aliasHistoricos: p['alias_historicos'] as ReadonlyArray<string>,
        publicado: p['publicado'] as boolean,
      });
    },

    // --- Taxonomía ----------------------------------------------------------

    async listarActividadesPendientes(pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('actividad').select('*', { count: 'exact' })
        .eq('estado', 'pendiente_de_revision')
        .order('creada_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Actividad>>>(error);
      const items = ((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map((a): Actividad => ({
          id: a['id'] as string, nombre: a['nombre'] as string,
          sinonimos: a['sinonimos'] as ReadonlyArray<string>,
          estado: a['estado'] as Actividad['estado'],
          creadaPor: (a['creada_por'] as string | null) ?? 'sistema',
          creadaEn: a['creada_en'] as string,
          fusionadaEn: (a['fusionada_en'] as string | null) ?? null,
        }));
      return bien(armarPagina<Actividad>(items, r, count ?? null));
    },

    async confirmarActividad(id: Id) {
      const { data, error } = await sb
        .from('actividad').update({ estado: 'confirmada' }).eq('id', id)
        .select('*').maybeSingle();
      if (error) return fallo<Actividad>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos esa actividad.',
        } };
      }
      const a = data as unknown as Record<string, unknown>;
      return bien<Actividad>({
        id: a['id'] as string, nombre: a['nombre'] as string,
        sinonimos: a['sinonimos'] as ReadonlyArray<string>,
        estado: a['estado'] as Actividad['estado'],
        creadaPor: (a['creada_por'] as string | null) ?? 'sistema',
        creadaEn: a['creada_en'] as string,
        fusionadaEn: (a['fusionada_en'] as string | null) ?? null,
      });
    },

    async fusionarActividad(origenId: Id, destinoId: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Decí por qué son la misma actividad.', campo: 'motivo',
        } };
      }
      const { data, error } = await sb.rpc('fusionar_actividad', {
        p_origen: origenId, p_destino: destinoId, p_motivo: motivo,
      });
      if (error) return fallo<Actividad>(error);
      const filas = (data ?? []) as unknown as Array<Record<string, unknown>>;
      const a = filas.length > 0 ? filas[0] : undefined;
      if (!a) return todaviaNo<Actividad>('No pudimos fusionar la actividad.');
      return bien<Actividad>({
        id: a['id'] as string, nombre: a['nombre'] as string,
        sinonimos: a['sinonimos'] as ReadonlyArray<string>,
        estado: a['estado'] as Actividad['estado'],
        creadaPor: (a['creada_por'] as string | null) ?? 'sistema',
        creadaEn: a['creada_en'] as string,
        fusionadaEn: (a['fusionada_en'] as string | null) ?? null,
      });
    },

    async editarTaxonomia(_cambio: CambioTaxonomia, _clave) {
      // ⛔ La taxonomía se genera del mismo archivo que usa el motor
      //    (`npm run exportar:taxonomia`). Editarla desde una pantalla haría
      //    que la base y el motor razonen sobre cosas distintas.
      return todaviaNo<void>(
        'La taxonomía se regenera del código del motor, no se edita desde una pantalla.',
      );
    },

    // --- Vendedores ---------------------------------------------------------

    async listarVendedores(filtro: FiltroUsuarios, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('usuario').select('*', { count: 'exact' });
      if (filtro.rol) consulta = consulta.eq('rol', filtro.rol);
      if (filtro.activo !== undefined) consulta = consulta.eq('activo', filtro.activo);
      if (filtro.texto && filtro.texto.trim().length > 0) {
        consulta = consulta.ilike('nombre', `%${filtro.texto.trim().replace(/[%,()]/g, ' ')}%`);
      }
      const { data, error, count } = await consulta.order('nombre').range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Usuario>>>(error);
      const items = ((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map((u): Usuario => ({
          id: u['id'] as string, nombre: u['nombre'] as string,
          email: u['email'] as string, usuario: u['usuario'] as string,
          rol: u['rol'] as Rol, activo: u['activo'] as boolean,
          debeCambiarClave: u['debe_cambiar_clave'] as boolean,
          ultimoIngresoEn: (u['ultimo_ingreso_en'] as string | null) ?? null,
          creadoEn: u['creado_en'] as string,
          creadoPor: (u['creado_por'] as string | null) ?? 'sistema',
          actualizadoEn: u['actualizado_en'] as string,
          actualizadoPor: (u['actualizado_por'] as string | null) ?? 'sistema',
          version: u['version'] as number,
        }));
      return bien(armarPagina<Usuario>(items, r, count ?? null));
    },

    async crearVendedor(datos: NuevoUsuario, _clave) {
      // ⛔ La contraseña inicial la genera la base al azar y se devuelve UNA
      //    sola vez. No se guarda en ningún lado del repositorio ni viaja de
      //    vuelta en ninguna otra llamada.
      const { data, error } = await sb.rpc('alta_de_usuario', {
        p_nombre: datos.nombre,
        p_usuario: datos.usuario,
        p_email_real: datos.email,
        p_rol: datos.rol,
      });
      if (error) return fallo<AltaDeUsuario>(error);
      const filas = (data ?? []) as unknown as Array<{ usuario: string; clave_inicial: string }>;
      const alta = filas.length > 0 ? filas[0] : undefined;
      if (!alta) return todaviaNo<AltaDeUsuario>('No pudimos dar de alta al vendedor.');

      const { data: creado } = await sb
        .from('usuario').select('*').eq('usuario', alta.usuario).maybeSingle();
      const u = (creado ?? {}) as unknown as Record<string, unknown>;
      return bien<AltaDeUsuario>({
        usuario: {
          id: u['id'] as string, nombre: u['nombre'] as string,
          email: u['email'] as string, usuario: u['usuario'] as string,
          rol: u['rol'] as Rol, activo: u['activo'] as boolean,
          debeCambiarClave: u['debe_cambiar_clave'] as boolean,
          ultimoIngresoEn: null,
          creadoEn: u['creado_en'] as string,
          creadoPor: (u['creado_por'] as string | null) ?? 'sistema',
          actualizadoEn: u['actualizado_en'] as string,
          actualizadoPor: (u['actualizado_por'] as string | null) ?? 'sistema',
          version: u['version'] as number,
        },
        // ⛔ Única vez que esta clave existe fuera de la base. Si no se
        //    muestra acá, el vendedor nuevo queda creado y sin poder entrar.
        claveInicial: alta.clave_inicial,
      });
    },

    async cambiarRol(usuarioId: Id, rol: Rol, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Decí por qué cambia el rol.', campo: 'motivo',
        } };
      }
      const { error } = await sb.from('usuario').update({ rol }).eq('id', usuarioId);
      if (error) return fallo<Usuario>(error);
      const { data } = await sb.from('usuario').select('*').eq('id', usuarioId).maybeSingle();
      const u = (data ?? {}) as unknown as Record<string, unknown>;
      return bien<Usuario>({
        id: u['id'] as string, nombre: u['nombre'] as string,
        email: u['email'] as string, usuario: u['usuario'] as string,
        rol: u['rol'] as Rol, activo: u['activo'] as boolean,
        debeCambiarClave: u['debe_cambiar_clave'] as boolean,
        ultimoIngresoEn: (u['ultimo_ingreso_en'] as string | null) ?? null,
        creadoEn: u['creado_en'] as string,
        creadoPor: (u['creado_por'] as string | null) ?? 'sistema',
        actualizadoEn: u['actualizado_en'] as string,
        actualizadoPor: (u['actualizado_por'] as string | null) ?? 'sistema',
        version: u['version'] as number,
      });
    },

    async desactivarVendedor(id: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Decí por qué se desactiva.', campo: 'motivo',
        } };
      }
      // ⛔ Se desactiva, no se borra: sus cotizaciones, comisiones y
      //    seguimientos siguen existiendo y siguen siendo suyos.
      const { error } = await sb.from('usuario').update({ activo: false }).eq('id', id);
      if (error) return fallo<Usuario>(error);
      const { data } = await sb.from('usuario').select('*').eq('id', id).maybeSingle();
      const u = (data ?? {}) as unknown as Record<string, unknown>;
      return bien<Usuario>({
        id: u['id'] as string, nombre: u['nombre'] as string,
        email: u['email'] as string, usuario: u['usuario'] as string,
        rol: u['rol'] as Rol, activo: u['activo'] as boolean,
        debeCambiarClave: u['debe_cambiar_clave'] as boolean,
        ultimoIngresoEn: (u['ultimo_ingreso_en'] as string | null) ?? null,
        creadoEn: u['creado_en'] as string,
        creadoPor: (u['creado_por'] as string | null) ?? 'sistema',
        actualizadoEn: u['actualizado_en'] as string,
        actualizadoPor: (u['actualizado_por'] as string | null) ?? 'sistema',
        version: u['version'] as number,
      });
    },

    async reasignarCartera(datos: ReasignacionCartera, clave) {
      if (!datos.motivo || datos.motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Decí por qué se reasigna la cartera.', campo: 'motivo',
        } };
      }
      const { data, error } = await sb.rpc('reasignar_cartera', {
        p_datos: datos as unknown as Record<string, unknown>, p_clave: clave,
      });
      if (error) return fallo<ResultadoReasignacion>(error);
      return bien(data as unknown as ResultadoReasignacion);
    },

    // --- Parámetros ---------------------------------------------------------

    async obtenerParametros() {
      const { data, error } = await sb.from('parametros_sistema').select('*').maybeSingle();
      if (error) return fallo<ParametrosSistema>(error);
      const p = (data ?? {}) as unknown as Record<string, unknown>;
      return bien<ParametrosSistema>({
        diasSinContactoParaSenal: p['dias_sin_contacto_para_senal'] as number,
        diasSinAperturaParaSenal: p['dias_sin_apertura_para_senal'] as number,
        diasSinEntrarParaInactivo: p['dias_sin_entrar_para_inactivo'] as number,
        vigenciaCotizacionDias: p['vigencia_cotizacion_dias'] as number,
        vigenciaEnlaceDias: p['vigencia_enlace_dias'] as number,
        retencionAudioDias: (p['retencion_audio_dias'] as number | null) ?? null,
        monedasHabilitadas: p['monedas_habilitadas'] as ReadonlyArray<Moneda>,
        // ⛔ No existe un tipo de cambio institucional, y por eso el tipo lo
        //    fija en `null`. No se inventa uno para poder consolidar totales.
        tipoCambioInstitucional: null,
      });
    },

    async actualizarParametros(cambios: Partial<ParametrosSistema>, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Decí por qué cambia el parámetro: queda en el historial.',
          campo: 'motivo',
        } };
      }
      const quien = await yo();
      const parche: Record<string, unknown> = {
        actualizado_por: quien, actualizado_en: new Date().toISOString(),
        motivo_ultimo_cambio: motivo,
      };
      if (cambios.diasSinContactoParaSenal !== undefined) parche['dias_sin_contacto_para_senal'] = cambios.diasSinContactoParaSenal;
      if (cambios.diasSinAperturaParaSenal !== undefined) parche['dias_sin_apertura_para_senal'] = cambios.diasSinAperturaParaSenal;
      if (cambios.diasSinEntrarParaInactivo !== undefined) parche['dias_sin_entrar_para_inactivo'] = cambios.diasSinEntrarParaInactivo;
      if (cambios.vigenciaCotizacionDias !== undefined) parche['vigencia_cotizacion_dias'] = cambios.vigenciaCotizacionDias;
      if (cambios.vigenciaEnlaceDias !== undefined) parche['vigencia_enlace_dias'] = cambios.vigenciaEnlaceDias;
      if (cambios.retencionAudioDias !== undefined) parche['retencion_audio_dias'] = cambios.retencionAudioDias;

      const { error } = await sb.from('parametros_sistema').update(parche).eq('id', true);
      if (error) return fallo<ParametrosSistema>(error);
      return this.obtenerParametros();
    },

    async estadoProveedores() {
      // ⛔ La configuración de proveedores y sus claves viven en el servidor.
      //    Todavía no hay ninguno elegido, y se dice: el sistema está en modo
      //    respaldo por taxonomía. Mostrar proveedores "en verde" que no
      //    existen sería peor que mostrar la lista vacía.
      return bien<EstadoProveedores>({
        busqueda: [],
        registrosPublicos: [],
        modeloLenguaje: [],
        modoRespaldo: true,
        verificadoEn: new Date().toISOString(),
      });
    },

    // --- Uso y registros ----------------------------------------------------

    async usoPorVendedor(periodo: PeriodoMensual) {
      const { data, error } = await sb.rpc('uso_por_vendedor', { p_periodo: periodo });
      if (error) return fallo<ReadonlyArray<UsoPorVendedor>>(error);
      return bien(((data ?? []) as unknown as Array<Record<string, unknown>>)
        .map((u): UsoPorVendedor => ({
          vendedorId: u['vendedor_id'] as string,
          nombreVendedor: u['nombre_vendedor'] as string,
          ultimoIngresoEn: (u['ultimo_ingreso_en'] as string | null) ?? null,
          ingresosEnPeriodo: u['ingresos_en_periodo'] as number,
          diasSinEntrar: (u['dias_sin_entrar'] as number | null) ?? null,
          planesCreados: u['planes_creados'] as number,
          seguimientosRegistrados: u['seguimientos_registrados'] as number,
          cotizacionesEnviadas: u['cotizaciones_enviadas'] as number,
          marcadoInactivo: u['marcado_inactivo'] as boolean,
        })));
    },

    async listarRegistroAcceso(filtro: FiltroRegistroAcceso, pagina?: OpcionesPagina) {
      // ⛔ Dos registros, nunca mezclados: éste es quién hizo qué DENTRO del
      //    Escritorio. Las aperturas de enlace del cliente son otra cosa.
      const r = rango(pagina);
      let consulta = sb.from('registro_acceso').select('*', { count: 'exact' });
      if (filtro.actorId) consulta = consulta.eq('actor_id', filtro.actorId);
      if (filtro.accion) consulta = consulta.eq('accion', filtro.accion);
      if (filtro.entidadTipo) consulta = consulta.eq('entidad_tipo', filtro.entidadTipo);
      if (filtro.entidadId) consulta = consulta.eq('entidad_id', filtro.entidadId);
      if (filtro.desde) consulta = consulta.gte('ocurrido_en', filtro.desde);
      if (filtro.hasta) consulta = consulta.lte('ocurrido_en', filtro.hasta);
      const { data, error, count } = await consulta
        .order('ocurrido_en', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<RegistroAcceso>>>(error);
      return bien(armarPagina<RegistroAcceso>(
        ((data ?? []) as Array<Record<string, unknown>>).map(registroDeFila),
        r, count ?? null,
      ));
    },

    async listarAperturasEnlace(filtro: FiltroAperturas, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('acceso_enlace').select('*', { count: 'exact' });
      if (filtro.enlaceId) consulta = consulta.eq('enlace_id', filtro.enlaceId);
      const { data, error, count } = await consulta
        .order('ocurrido_en', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<AccesoEnlace>>>(error);
      return bien(armarPagina<AccesoEnlace>(
        ((data ?? []) as Array<Record<string, unknown>>).map(aperturaDeFila),
        r, count ?? null,
      ));
    },

    // --- Sugerencias --------------------------------------------------------

    async listarSugerencias(filtro: FiltroSugerencias, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('sugerencia_producto').select('*', { count: 'exact' });
      if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);
      if (filtro.actividadId) consulta = consulta.eq('actividad_id', filtro.actividadId);
      if (filtro.creadaPor) consulta = consulta.eq('creada_por', filtro.creadaPor);
      if (filtro.frecuencia) consulta = consulta.eq('frecuencia_observada', filtro.frecuencia);
      const { data, error, count } = await consulta
        .order('creada_en', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<SugerenciaProducto>>>(error);
      return bien(armarPagina<SugerenciaProducto>(
        ((data ?? []) as Array<Record<string, unknown>>).map(sugerenciaDeFila),
        r, count ?? null,
      ));
    },

    async resolverSugerencia(id: Id, resolucion: ResolucionSugerencia) {
      // ⛔ El silencio no es una respuesta válida: la resolución es obligatoria.
      //    Un vendedor que reporta un hueco del portafolio merece una respuesta.
      if (!resolucion.resolucion || resolucion.resolucion.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Escribí la resolución: el vendedor que la abrió la va a leer.',
          campo: 'resolucion',
        } };
      }
      const quien = await yo();
      const { data, error } = await sb
        .from('sugerencia_producto')
        .update({
          estado: resolucion.estado,
          resolucion: resolucion.resolucion,
          producto_que_lo_cubre: resolucion.productoQueLoCubre ?? null,
          duplicada_de: resolucion.duplicadaDe ?? null,
          resuelta_por: quien,
          resuelta_en: new Date().toISOString(),
        })
        .eq('id', id).select('*').maybeSingle();
      if (error) return fallo<SugerenciaProducto>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos esa sugerencia.',
        } };
      }
      return bien(sugerenciaDeFila(data as Record<string, unknown>));
    },

    async agregadoSugerencias() {
      const { data, error } = await sb
        .from('sugerencia_producto')
        .select('actividad_id, estado, frecuencia_observada');
      if (error) return fallo<ReadonlyArray<AgregadoSugerencias>>(error);

      const por = new Map<string, AgregadoSugerencias>();
      for (const s of (data ?? []) as unknown as Array<{
        actividad_id: string | null; estado: string; frecuencia_observada: string;
      }>) {
        const clave = s.actividad_id ?? 'sin-actividad';
        const a = por.get(clave) ?? {
          actividadId: clave, total: 0,
          porEstado: {} as AgregadoSugerencias['porEstado'],
          porFrecuencia: {} as AgregadoSugerencias['porFrecuencia'],
        };
        const estados = a.porEstado as Record<string, number>;
        const frecuencias = a.porFrecuencia as Record<string, number>;
        estados[s.estado] = (estados[s.estado] ?? 0) + 1;
        frecuencias[s.frecuencia_observada] = (frecuencias[s.frecuencia_observada] ?? 0) + 1;
        por.set(clave, { ...a, total: a.total + 1 });
      }
      return bien<ReadonlyArray<AgregadoSugerencias>>([...por.values()]);
    },
  };
}
