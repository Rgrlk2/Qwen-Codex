/**
 * El motor de planificación, contra Supabase.
 *
 * ⛔ El razonamiento NO está acá. Está en `@labia/compartido/motor-logica` y es
 *    el mismo que usan los datos de ejemplo. Este archivo hace tres cosas:
 *    le da de comer la taxonomía que lee de la base, guarda lo que el vendedor
 *    decide conservar, y traduce errores. Si alguna vez aparece acá una regla
 *    sobre qué producto recomendar, está en el lugar equivocado.
 */

import type {
  Actividad, AjustePerfil, CapaMotor, CorreccionDato, Dinero, EjePlan,
  EntradaObjetivo, EntradaPlan, FiltroPlanes, FiltroProductos, Id,
  InvestigacionObjetivo, ISODate, MotivoCierrePlan,
  MotorDePlanificacion, Necesidad, NuevaSugerencia, ObjetivoSugerido,
  OpcionesPagina, Operacion, Plan, PlanDeRubro, PlanRecalculado, PrecioLista,
  Producto, ProductoDetalle, ProductoId, Resultado, SugerenciaProducto,
} from '@labia/compartido';
import { crearMotorDePlanificacion } from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';
import { olvidarTaxonomiaCargada, taxonomiaCargada } from './taxonomia';
import { aplicarCorrecciones, respaldoPorTaxonomia } from './investigacion';

// ---------------------------------------------------------------------------
// La taxonomía, una sola vez por carga
// ---------------------------------------------------------------------------

let motorCargado: Promise<MotorDePlanificacion> | null = null;

function cargarMotor(): Promise<MotorDePlanificacion> {
  motorCargado ??= taxonomiaCargada().then(crearMotorDePlanificacion);
  return motorCargado;
}

/**
 * Tras dar de alta un término nuevo, la taxonomía en memoria quedó vieja.
 * ⛔ Se olvidan LAS DOS: el motor armado y la taxonomía cruda que lo alimentó.
 *    Olvidar sólo una deja al sistema contestando dos cosas distintas.
 */
function olvidarTaxonomia(): void {
  motorCargado = null;
  olvidarTaxonomiaCargada();
}

// ---------------------------------------------------------------------------

interface FilaPlan {
  readonly id: string;
  readonly eje: EjePlan;
  readonly objetivo_id: string | null;
  readonly vendedor_id: string;
  readonly entrada: EntradaPlan;
  readonly razonamiento: Record<string, unknown>;
  readonly productos_destacados: ReadonlyArray<string>;
  readonly ningun_producto_encaja: boolean;
  readonly version_taxonomia: number;
  readonly version_catalogo: number;
  readonly generado_en: string;
  readonly periodo_desde: string | null;
  readonly periodo_hasta: string | null;
  readonly meta_guaranies: number | null;
  readonly estado: 'abierto' | 'cerrado';
  readonly motivo_cierre: MotivoCierrePlan | null;
}

const COLUMNAS_PLAN = `id, eje, objetivo_id, vendedor_id, entrada, razonamiento,
  productos_destacados, ningun_producto_encaja, version_taxonomia, version_catalogo,
  generado_en, periodo_desde, periodo_hasta, meta_guaranies, estado, motivo_cierre`;

function aPlan(f: FilaPlan): Plan {
  const r = f.razonamiento as unknown as Pick<Plan,
    'perfilOperativo' | 'doloresInferidos' | 'ranking' | 'combos' |
    'estrategiaEntrada' | 'argumentos' | 'preguntasConfirmacion'>;
  const [a, b, c] = f.productos_destacados as ReadonlyArray<ProductoId>;
  return {
    id: f.id,
    eje: f.eje,
    objetivoId: f.objetivo_id,
    vendedorId: f.vendedor_id,
    entrada: f.entrada,
    perfilOperativo: r.perfilOperativo,
    doloresInferidos: r.doloresInferidos,
    ranking: r.ranking,
    productosDestacados: [a as ProductoId, b as ProductoId, c as ProductoId],
    combos: r.combos,
    estrategiaEntrada: r.estrategiaEntrada,
    argumentos: r.argumentos,
    preguntasConfirmacion: r.preguntasConfirmacion,
    ningunProductoEncaja: f.ningun_producto_encaja,
    versionTaxonomia: f.version_taxonomia,
    versionCatalogo: f.version_catalogo,
    generadoEn: f.generado_en,
  };
}

function aPlanDeRubro(f: FilaPlan): PlanDeRubro {
  return {
    ...aPlan(f),
    eje: 'rubro',
    periodoDesde: f.periodo_desde ?? '',
    periodoHasta: f.periodo_hasta ?? '',
    metaGuaranies: { moneda: 'PYG', monto: f.meta_guaranies ?? 0 },
    estado: f.estado,
    motivoCierre: f.motivo_cierre,
  };
}

/** El plan, partido en lo que se consulta y la foto del razonamiento. */
function filaDesdePlan(plan: Plan): Record<string, unknown> {
  return {
    eje: plan.eje,
    objetivo_id: plan.objetivoId,
    entrada: plan.entrada,
    razonamiento: {
      perfilOperativo: plan.perfilOperativo,
      doloresInferidos: plan.doloresInferidos,
      ranking: plan.ranking,
      combos: plan.combos,
      estrategiaEntrada: plan.estrategiaEntrada,
      argumentos: plan.argumentos,
      preguntasConfirmacion: plan.preguntasConfirmacion,
    },
    productos_destacados: plan.productosDestacados,
    ningun_producto_encaja: plan.ningunProductoEncaja,
    version_taxonomia: plan.versionTaxonomia,
    version_catalogo: plan.versionCatalogo,
    generado_en: plan.generadoEn,
  };
}

interface FilaSugerencia {
  readonly id: string;
  readonly titulo: string;
  readonly problema_cliente: string;
  readonly cliente_id: string | null;
  readonly actividad_id: string | null;
  readonly frecuencia_observada: SugerenciaProducto['frecuenciaObservada'];
  readonly productos_que_no_alcanzan: ReadonlyArray<string>;
  readonly por_que_no_alcanzan: string;
  readonly creada_por: string;
  readonly creada_en: string;
  readonly estado: SugerenciaProducto['estado'];
  readonly resolucion: string | null;
  readonly producto_que_lo_cubre: string | null;
  readonly duplicada_de: string | null;
  readonly resuelta_por: string | null;
  readonly resuelta_en: string | null;
}

const COLUMNAS_SUGERENCIA = `id, titulo, problema_cliente, cliente_id, actividad_id,
  frecuencia_observada, productos_que_no_alcanzan, por_que_no_alcanzan, creada_por,
  creada_en, estado, resolucion, producto_que_lo_cubre, duplicada_de, resuelta_por, resuelta_en`;

function aSugerencia(f: FilaSugerencia): SugerenciaProducto {
  return {
    id: f.id,
    titulo: f.titulo,
    problemaCliente: f.problema_cliente,
    clienteId: f.cliente_id,
    actividadId: f.actividad_id,
    frecuenciaObservada: f.frecuencia_observada,
    productosQueNoAlcanzan: f.productos_que_no_alcanzan as ReadonlyArray<ProductoId>,
    porQueNoAlcanzan: f.por_que_no_alcanzan,
    // ⛔ No hay tabla de adjuntos todavia; nada los produce.
    adjuntos: [],
    creadaPor: f.creada_por,
    creadaEn: f.creada_en,
    estado: f.estado,
    resolucion: f.resolucion,
    productoQueLoCubre: f.producto_que_lo_cubre as ProductoId | null,
    duplicadaDe: f.duplicada_de,
    resueltaPor: f.resuelta_por,
    resueltaEn: f.resuelta_en,
  };
}

// ---------------------------------------------------------------------------

export function crearCapaMotor(): CapaMotor {
  const sb = supabase();
  /** Investigaciones de esta sesión, para poder consultarlas por id. */
  const investigaciones = new Map<Id, InvestigacionObjetivo>();

  async function yo(): Promise<string | null> {
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  }

  const sinSesion = <T,>(): Resultado<T> => ({
    ok: false,
    error: { codigo: 'no_autenticado', mensajeAmable: 'Tu sesión venció. Volvé a entrar.' },
  });

  return {
    // --- Investigación ---------------------------------------------------
    //
    // ⛔ MASTER_SPEC §1: toda la investigación externa y todo uso de modelo de
    //    lenguaje ocurren EN EL SERVIDOR, detrás de proveedores
    //    intercambiables. El navegador no lleva ninguna clave, así que esto no
    //    puede resolverse acá aunque se quisiera.
    //
    //    Todavía no hay proveedor elegido ni función de servidor desplegada.
    //    El contrato ya dice qué hacer en ese caso, y es lo que se hace: caer
    //    a la taxonomía, marcarlo y pedir el mínimo. Nunca inventar un dato
    //    ni mostrar un formulario largo vacío.

    async investigarObjetivo(entrada: EntradaObjetivo) {
      const quien = await yo();
      if (!quien) return sinSesion<InvestigacionObjetivo>();
      const motor = await cargarMotor();
      const investigacion = respaldoPorTaxonomia(entrada, quien, motor);
      investigaciones.set(investigacion.id, investigacion);
      return bien(investigacion);
    },

    async estadoInvestigacion(id: Id) {
      const encontrada = investigaciones.get(id);
      if (!encontrada) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const,
          mensajeAmable: 'No encontramos esa investigación. Volvé a empezarla.',
        } };
      }
      return bien(encontrada);
    },

    async corregirInvestigacion(inv: InvestigacionObjetivo, correcciones: ReadonlyArray<CorreccionDato>) {
      const motor = await cargarMotor();
      const corregida = aplicarCorrecciones(inv, correcciones, motor);
      investigaciones.set(corregida.investigacion.id, corregida.investigacion);
      return bien(corregida);
    },

    async planDesdeInvestigacion(inv: InvestigacionObjetivo) {
      const motor = await cargarMotor();
      const texto = inv.actividad.valorCorregido ?? inv.actividad.valor ?? '';
      const entrada: EntradaPlan = { tipo: 'rubro', nombre: texto, queHace: texto };
      return bien(motor.planDesdeResultadoInvestigacion(
        entrada, ejeDesde(inv.entrada), inv.vendedorId,
        inv.perfilOperativo, inv.doloresProbables, inv.productosRecomendados,
      ));
    },

    // --- Taxonomía --------------------------------------------------------

    async buscarActividad(texto: string) {
      const motor = await cargarMotor();
      return bien(motor.buscarActividad(texto));
    },

    async resolverActividad(texto: string, clave) {
      const quien = await yo();
      if (!quien) return sinSesion<Actividad>();

      const motor = await cargarMotor();
      const resolucion = motor.resolverActividad(texto, quien);
      if (!resolucion.esNueva) return bien(resolucion.actividad);

      // ⛔ Término nuevo: se guarda como `pendiente_de_revision` y se devuelve
      //    usable. El motor no frena al vendedor por un rubro que nadie curó.
      const { data, error } = await sb.rpc('crear_actividad_pendiente', {
        p_nombre: resolucion.actividad.nombre,
        p_sinonimos: resolucion.actividad.sinonimos,
        p_operaciones: resolucion.operaciones.map((o) => ({
          operacion_id: o.operacionId, probabilidad: o.probabilidad, motivo: o.motivo,
        })),
        p_clave: clave,
      });
      if (error) return fallo<Actividad>(error);

      olvidarTaxonomia();
      const fila = (data ?? []) as unknown as Array<{
        id: string; nombre: string; sinonimos: string[];
        estado: Actividad['estado']; creada_por: string | null;
        creada_en: string; fusionada_en: string | null;
      }>;
      const a = fila.length > 0 ? fila[0] : undefined;
      if (!a) return bien(resolucion.actividad);
      return bien<Actividad>({
        id: a.id, nombre: a.nombre, sinonimos: a.sinonimos, estado: a.estado,
        creadaPor: a.creada_por ?? quien, creadaEn: a.creada_en, fusionadaEn: a.fusionada_en,
      });
    },

    async listarOperaciones() {
      const motor = await cargarMotor();
      return bien<ReadonlyArray<Operacion>>(motor.listarOperaciones());
    },

    async listarNecesidades() {
      const motor = await cargarMotor();
      return bien<ReadonlyArray<Necesidad>>(motor.listarNecesidades());
    },

    // --- Planes -----------------------------------------------------------

    async generarPlan(entrada: EntradaPlan, eje: EjePlan) {
      const quien = await yo();
      if (!quien) return sinSesion<Plan>();
      const motor = await cargarMotor();
      // ⛔ No persiste: devuelve el plan para que el vendedor lo ajuste.
      return bien(motor.generarPlan(entrada, eje, quien));
    },

    async recalcularPlan(plan: Plan, ajustes: ReadonlyArray<AjustePerfil>) {
      const motor = await cargarMotor();
      return bien<PlanRecalculado>(motor.recalcularPlan(plan, ajustes));
    },

    async guardarPlan(plan: Plan, clave) {
      const quien = await yo();
      if (!quien) return sinSesion<Plan>();
      const { data, error } = await sb.rpc('guardar_plan', {
        p_plan: filaDesdePlan(plan),
        p_clave: clave,
      });
      if (error) return fallo<Plan>(error);

      const { data: fila, error: lectura } = await sb
        .from('plan').select(COLUMNAS_PLAN).eq('id', data as string).maybeSingle();
      if (lectura) return fallo<Plan>(lectura);
      if (!fila) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const,
          mensajeAmable: 'Guardamos el plan pero no pudimos volver a leerlo.',
        } };
      }
      return bien(aPlan(fila as unknown as FilaPlan));
    },

    async obtenerPlan(id: Id) {
      const { data, error } = await sb
        .from('plan').select(COLUMNAS_PLAN).eq('id', id).maybeSingle();
      if (error) return fallo<Plan>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos ese plan.',
        } };
      }
      return bien(aPlan(data as unknown as FilaPlan));
    },

    async listarPlanes(filtro: FiltroPlanes, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('plan').select(COLUMNAS_PLAN, { count: 'exact' });
      if (filtro.eje) consulta = consulta.eq('eje', filtro.eje);
      if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      if (filtro.objetivoId) consulta = consulta.eq('objetivo_id', filtro.objetivoId);

      const { data, error, count } = await consulta
        .order('generado_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Plan>>>(error);
      const items = ((data ?? []) as unknown as FilaPlan[]).map(aPlan);
      return bien(armarPagina<Plan>(items, r, count ?? null));
    },

    async crearPlanDeRubro(plan: Plan, periodoDesde: ISODate, periodoHasta: ISODate, metaGuaranies: Dinero, clave) {
      const quien = await yo();
      if (!quien) return sinSesion<PlanDeRubro>();
      const { data, error } = await sb.rpc('guardar_plan', {
        p_plan: {
          ...filaDesdePlan(plan),
          eje: 'rubro',
          periodo_desde: periodoDesde,
          periodo_hasta: periodoHasta,
          meta_guaranies: metaGuaranies.monto,
        },
        p_clave: clave,
      });
      if (error) return fallo<PlanDeRubro>(error);

      const { data: fila, error: lectura } = await sb
        .from('plan').select(COLUMNAS_PLAN).eq('id', data as string).maybeSingle();
      if (lectura) return fallo<PlanDeRubro>(lectura);
      if (!fila) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const,
          mensajeAmable: 'Guardamos el plan pero no pudimos volver a leerlo.',
        } };
      }
      return bien(aPlanDeRubro(fila as unknown as FilaPlan));
    },

    async cerrarPlan(id: Id, motivo: MotivoCierrePlan, comentario: string) {
      // ⛔ Sin comentario no se cierra. La restricción `cierre_con_motivo` de la
      //    base también lo frena; acá el mensaje explica qué falta.
      if (comentario.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Para cerrar un plan hace falta contar por qué se cierra.',
        } };
      }
      const { data, error } = await sb
        .from('plan')
        .update({ estado: 'cerrado', motivo_cierre: motivo, comentario_cierre: comentario })
        .eq('id', id)
        .select(COLUMNAS_PLAN)
        .maybeSingle();
      if (error) return fallo<PlanDeRubro>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos ese plan.',
        } };
      }
      return bien(aPlanDeRubro(data as unknown as FilaPlan));
    },

    async objetivosSugeridos(planId: Id) {
      const { data, error } = await sb
        .from('objetivo_sugerido')
        .select('id, plan_id, cliente_id, estado, cliente ( nombre )')
        .eq('plan_id', planId);
      if (error) return fallo<ReadonlyArray<ObjetivoSugerido>>(error);
      const filas = (data ?? []) as unknown as Array<{
        id: string; plan_id: string; cliente_id: string;
        estado: ObjetivoSugerido['estado'];
        cliente: { nombre: string } | null;
      }>;
      return bien(filas.map((f): ObjetivoSugerido => ({
        id: f.id, planId: f.plan_id, clienteId: f.cliente_id,
        nombreCliente: f.cliente?.nombre ?? '', estado: f.estado,
      })));
    },

    async aceptarObjetivo(objetivoId: Id, clave) {
      // ⛔ Aceptar un objetivo genera una TAREA en la agenda, nunca un cliente.
      //    Lo hace la base en una transacción, para que no quede un objetivo
      //    aceptado sin su tarea.
      const { data, error } = await sb.rpc('aceptar_objetivo', {
        p_objetivo: objetivoId, p_clave: clave,
      });
      if (error) return fallo<ObjetivoSugerido>(error);
      const filas = (data ?? []) as unknown as Array<{
        id: string; plan_id: string; cliente_id: string;
        estado: ObjetivoSugerido['estado']; nombre_cliente: string;
      }>;
      const f = filas.length > 0 ? filas[0] : undefined;
      if (!f) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos ese objetivo.',
        } };
      }
      return bien<ObjetivoSugerido>({
        id: f.id, planId: f.plan_id, clienteId: f.cliente_id,
        nombreCliente: f.nombre_cliente, estado: f.estado,
      });
    },

    // --- Catálogo ---------------------------------------------------------

    async listarProductos(filtro?: FiltroProductos) {
      const motor = await cargarMotor();
      // ⛔ Siempre ≤ 13: el portafolio es cerrado y la base lo impide crecer.
      let productos = (await leerCatalogo(motor)).slice();
      if (filtro?.familia) productos = productos.filter((p) => p.familia === filtro.familia);
      if (filtro?.soloPublicados === true) productos = productos.filter((p) => p.publicado);
      if (filtro?.texto && filtro.texto.trim().length > 0) {
        const t = filtro.texto.trim().toLowerCase();
        productos = productos.filter((p) => p.nombre.toLowerCase().includes(t));
      }
      return bien<ReadonlyArray<Producto>>(productos);
    },

    async obtenerProducto(id: ProductoId) {
      const precioLeido = await leerPrecios(sb, id);
      if (!precioLeido.ok) return precioLeido as Resultado<ProductoDetalle>;
      const precios = precioLeido.datos;

      const { data, error } = await sb
        .from('producto')
        .select('id, nombre, familia, orden, clave_copy, alias_historicos, publicado, necesidad_producto ( necesidad_id )')
        .eq('id', id)
        .maybeSingle();
      if (error) return fallo<ProductoDetalle>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos ese producto.',
        } };
      }
      const f = data as unknown as {
        id: string; nombre: string; familia: Producto['familia']; orden: number;
        clave_copy: string; alias_historicos: string[]; publicado: boolean;
        necesidad_producto: Array<{ necesidad_id: string }>;
      };
      // ⛔ Trae `claveCopy`, NO el texto del copy: el copy aprobado se lee de
      //    su archivo firmado, nunca de la base.
      return bien<ProductoDetalle>({
        id: f.id as ProductoId, nombre: f.nombre, familia: f.familia, orden: f.orden,
        claveCopy: f.clave_copy, aliasHistoricos: f.alias_historicos, publicado: f.publicado,
        necesidadesIds: f.necesidad_producto.map((n) => n.necesidad_id),
        precios,
      });
    },

    preciosDeProducto: (id: ProductoId) => leerPrecios(sb, id),

    // --- Sugerencias ------------------------------------------------------

    async crearSugerencia(datos: NuevaSugerencia, clave) {
      const quien = await yo();
      if (!quien) return sinSesion<SugerenciaProducto>();
      const { data, error } = await sb.rpc('crear_sugerencia', {
        p_datos: datos as unknown as Record<string, unknown>, p_clave: clave,
      });
      if (error) return fallo<SugerenciaProducto>(error);
      const filas = (data ?? []) as unknown as FilaSugerencia[];
      const f = filas.length > 0 ? filas[0] : undefined;
      if (!f) {
        return { ok: false as const, error: {
          codigo: 'servicio_no_disponible' as const,
          mensajeAmable: 'No pudimos guardar la sugerencia. Probá de nuevo.',
        } };
      }
      return bien(aSugerencia(f));
    },

    async listarMisSugerencias(pagina?: OpcionesPagina) {
      const quien = await yo();
      if (!quien) return sinSesion<ReturnType<typeof armarPagina<SugerenciaProducto>>>();
      const r = rango(pagina);
      const { data, error, count } = await sb
        .from('sugerencia_producto')
        .select(COLUMNAS_SUGERENCIA, { count: 'exact' })
        .eq('creada_por', quien)
        .order('creada_en', { ascending: false })
        .range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<SugerenciaProducto>>>(error);
      const items = ((data ?? []) as unknown as FilaSugerencia[]).map(aSugerencia);
      return bien(armarPagina<SugerenciaProducto>(items, r, count ?? null));
    },
  };
}

/** El catálogo ya viene con la taxonomía; no hace falta pedirlo de nuevo. */
async function leerCatalogo(motor: MotorDePlanificacion): Promise<ReadonlyArray<Producto>> {
  return motor.catalogo();
}

function ejeDesde(entrada: EntradaObjetivo): EjePlan {
  if (entrada.tipo === 'empresa') return 'empresa';
  if (entrada.tipo === 'profesional') return 'profesional';
  return 'rubro';
}

type Conexion = ReturnType<typeof supabase>;

/** ⛔ El texto documentado es lo que se muestra. El monto es para calcular. */
async function leerPrecios(sb: Conexion, id: ProductoId): Promise<Resultado<ReadonlyArray<PrecioLista>>> {
  const { data, error } = await sb
    .from('precio_lista')
    .select('id, producto_id, modalidad, plan, estado, moneda, monto_desde, monto_hasta, iva_incluido, texto_documentado, condicion, version_catalogo, vigente_desde, vigente_hasta')
    .eq('producto_id', id)
    .order('modalidad', { ascending: true });
  if (error) return fallo<ReadonlyArray<PrecioLista>>(error);
  const filas = (data ?? []) as unknown as Array<{
    id: string; producto_id: string; modalidad: PrecioLista['modalidad'];
    plan: string | null; estado: PrecioLista['estado'];
    moneda: 'PYG' | 'USD' | null; monto_desde: number | null; monto_hasta: number | null;
    iva_incluido: boolean | null; texto_documentado: string;
    condicion: string | null; version_catalogo: number;
    vigente_desde: string | null; vigente_hasta: string | null;
  }>;
  return bien(filas.map((f): PrecioLista => ({
    id: f.id,
    productoId: f.producto_id as ProductoId,
    modalidad: f.modalidad,
    plan: f.plan,
    estado: f.estado,
    // ⛔ Sin monto documentado no se inventa uno: queda en null y la vista
    //    muestra el texto literal del copy, que es lo que manda.
    moneda: f.moneda ?? 'PYG',
    montoDesde: f.monto_desde,
    montoHasta: f.monto_hasta,
    ivaIncluido: f.iva_incluido,
    textoDocumentado: f.texto_documentado,
    condicion: f.condicion,
    vigenteDesde: f.vigente_desde,
    vigenteHasta: f.vigente_hasta,
    versionCatalogo: f.version_catalogo,
  })));
}
