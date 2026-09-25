/**
 * Presentaciones y cotizaciones, contra Supabase.
 *
 * Acá vive el circuito comercial completo:
 *
 *   borrador → firma del vendedor → revisión → aprobación del CEO
 *   → firma del CEO → PDF definitivo → enlace → respuesta
 *
 * ⛔ NINGUNO de esos pasos se defiende desde este archivo. Todos viven en la
 *    base: que una cotización sólo se envíe al cliente después de aprobada,
 *    que nadie apruebe la suya, que sin firma no vaya a revisión, que sin las
 *    dos firmas no salga el PDF, y que editar lo aprobado anule las firmas.
 *    Si alguien llamara a la API sin pasar por el Escritorio, todo eso
 *    seguiría en pie.
 *
 * ⛔ El vendedor escribe DOS importes: el setup especial y el mensual
 *    especial. Los precios de lista salen del catálogo en el servidor y los
 *    ahorros son columnas generadas. No hay por dónde mandar una lista
 *    inflada para fabricar un descuento que no existe.
 */

import type {
  AccesoEnlace, AlternativaCalculada, AporteDelCliente, BaseCalculo,
  CapaPropuestas, ComparacionConLista, ConstanciaRespuesta, Cotizacion,
  CotizacionDetalle, Dinero, DocumentoEmitido, EnlaceCompartido, EstadoCotizacion,
  FiltroCotizaciones, Firma, Id, Moneda, NuevaCotizacion, NuevaPresentacion,
  OpcionesEnlace, OpcionesPagina, Presentacion, PreciosCotizacion, PreciosEntrada,
  PrevisualizacionCotizacion, ProductoId, Resultado, TotalesPorMoneda,
  Version, VersionCotizacion,
} from '@labia/compartido';
import { calcularAlternativas, monedaDeLaBase } from '@labia/compartido';
import { supabase } from './conexion';
import { bien, fallo } from './errores';
import { armarPagina, rango } from './paginacion';
import { COLUMNAS_TRAZADO, aTrazado, type FilaTrazado } from './trazado';

const BASES_Y_CONDICIONES =
  'Esta cotización es una propuesta comercial de Lab.IA. Los importes se '
  + 'expresan en la moneda indicada y mantienen validez hasta la fecha de '
  + 'validez consignada. La permanencia mínima aplica desde la puesta en '
  + 'marcha del servicio.';

function logosPara(productoId: ProductoId) {
  return {
    labIa: '/assets/marca/logo-labia.png',
    rgrlkGroup: '/assets/marca/rgrlk-group-horizontal.webp',
    producto: productoId === 'park-ia'
      ? '/assets/productos/park-ia/logo-park-ia.webp'
      : `/assets/productos/${productoId}/logo-${productoId}.png`,
    variante: null,
  };
}

const plata = (moneda: Moneda, monto: number): Dinero => ({ moneda, monto });

/** ⛔ Una entrada por moneda. Nunca un total consolidado. */
function totalesDe(alternativas: ReadonlyArray<AlternativaCalculada>): TotalesPorMoneda {
  const porMoneda = new Map<Moneda, number>();
  for (const a of alternativas) {
    porMoneda.set(a.totalFinal.moneda, Math.max(porMoneda.get(a.totalFinal.moneda) ?? 0, a.totalFinal.monto));
  }
  return [...porMoneda].map(([moneda, monto]) => plata(moneda, monto));
}

function porcentaje(ahorro: number, lista: number): number {
  return lista > 0 ? Math.round((ahorro / lista) * 1000) / 10 : 0;
}

// ---------------------------------------------------------------------------

interface FilaCotizacion extends FilaTrazado {
  readonly id: string;
  readonly folio: string;
  readonly estado: EstadoCotizacion;
  readonly cliente_id: string;
  readonly tipo_cliente: 'empresa' | 'profesional';
  readonly nombre_cliente: string;
  readonly nombre_empresa_o_profesional: string;
  readonly profesion: string | null;
  readonly ruc: string | null;
  readonly ciudad: string | null;
  readonly producto_id: string;
  readonly nombre_producto: string;
  readonly variante: string | null;
  readonly vendedor_id: string;
  readonly nombre_vendedor: string;
  readonly fecha_emision: string;
  readonly fecha_validez: string;
  readonly moneda: Moneda;
  readonly setup_lista: number | null;
  readonly setup_especial: number;
  readonly mensual_lista: number | null;
  readonly mensual_especial: number;
  readonly ahorro_setup: number | null;
  readonly ahorro_mensual: number | null;
  readonly permanencia_minima_meses: number;
  readonly tratamiento_iva: string | null;
  readonly notas_internas: string | null;
  readonly instalacion_descripcion: string | null;
  readonly instalacion_dias_habiles: number | null;
  readonly instalacion_texto: string | null;
  readonly presentacion_id: string | null;
  readonly version_catalogo: number;
  readonly motivo_perdida: string | null;
  readonly cotizacion_alcance?: ReadonlyArray<{ clase: string; texto: string }>;
  readonly aporte_del_cliente?: ReadonlyArray<{
    tipo: AporteDelCliente['tipo']; descripcion: string; bloqueante: boolean;
  }>;
}

const COLUMNAS_COTIZACION = `id, folio, estado, cliente_id, tipo_cliente, nombre_cliente,
  nombre_empresa_o_profesional, profesion, ruc, ciudad, producto_id, nombre_producto,
  variante, vendedor_id, nombre_vendedor, fecha_emision, fecha_validez, moneda,
  setup_lista, setup_especial, mensual_lista, mensual_especial, ahorro_setup, ahorro_mensual,
  permanencia_minima_meses, tratamiento_iva, notas_internas, instalacion_descripcion,
  instalacion_dias_habiles, instalacion_texto, presentacion_id, version_catalogo,
  motivo_perdida, ${COLUMNAS_TRAZADO},
  cotizacion_alcance ( clase, texto ),
  aporte_del_cliente ( tipo, descripcion, bloqueante )`;

/**
 * ⛔ Sin precio de lista documentado, la lista se iguala al especial: el
 *    ahorro queda en cero y el documento no anuncia un descuento que no
 *    existe. Quién no tiene lista lo dice `ComparacionConLista.sinPrecioDeLista`,
 *    que es lo que mira Administración.
 */
function baseDe(f: FilaCotizacion): BaseCalculo {
  const m = f.moneda;
  return {
    setupLista: plata(m, f.setup_lista ?? f.setup_especial),
    setupEspecial: plata(m, f.setup_especial),
    mensualLista: plata(m, f.mensual_lista ?? f.mensual_especial),
    mensualEspecial: plata(m, f.mensual_especial),
  };
}

function preciosDe(f: FilaCotizacion): PreciosCotizacion {
  const m = f.moneda;
  const listaSetup = f.setup_lista ?? f.setup_especial;
  const listaMensual = f.mensual_lista ?? f.mensual_especial;
  const ahorroSetup = f.ahorro_setup ?? 0;
  const ahorroMensual = f.ahorro_mensual ?? 0;
  return {
    setupLista: plata(m, listaSetup),
    setupEspecial: plata(m, f.setup_especial),
    ahorroSetup: plata(m, ahorroSetup),
    ahorroSetupPorcentaje: porcentaje(ahorroSetup, listaSetup),
    mensualLista: plata(m, listaMensual),
    mensualEspecial: plata(m, f.mensual_especial),
    ahorroMensual: plata(m, ahorroMensual),
    ahorroMensualPorcentaje: porcentaje(ahorroMensual, listaMensual),
  };
}

function comparacionDe(f: FilaCotizacion): ComparacionConLista {
  const m = f.moneda;
  const sinLista = f.setup_lista === null && f.mensual_lista === null;
  return {
    productoId: f.producto_id as ProductoId,
    precioListaSetup: f.setup_lista === null ? null : plata(m, f.setup_lista),
    setupEspecial: plata(m, f.setup_especial),
    desviacionSetup: f.ahorro_setup === null ? null : plata(m, -f.ahorro_setup),
    desviacionSetupPorcentaje: f.setup_lista === null ? null : -porcentaje(f.ahorro_setup ?? 0, f.setup_lista),
    precioListaMensualidad: f.mensual_lista === null ? null : plata(m, f.mensual_lista),
    mensualEspecial: plata(m, f.mensual_especial),
    desviacionMensualidad: f.ahorro_mensual === null ? null : plata(m, -f.ahorro_mensual),
    desviacionMensualidadPorcentaje: f.mensual_lista === null ? null : -porcentaje(f.ahorro_mensual ?? 0, f.mensual_lista),
    sinPrecioDeLista: sinLista,
  };
}

function aCotizacion(f: FilaCotizacion): Cotizacion {
  const alcance = f.cotizacion_alcance ?? [];
  // ⛔ Las cuatro alternativas se calculan; no se guardan. Guardarlas seria
  //    tener dos verdades sobre el mismo precio.
  const alternativas = calcularAlternativas(baseDe(f));
  return {
    ...aTrazado(f),
    id: f.id,
    tipo: 'cotizacion',
    folio: f.folio,
    version: f.version,
    estado: f.estado,
    destinatario: {
      clienteId: f.cliente_id,
      tipo: f.tipo_cliente,
      nombreCliente: f.nombre_cliente,
      nombreEmpresaOProfesional: f.nombre_empresa_o_profesional,
      profesion: f.profesion,
      ruc: f.ruc,
      ciudad: f.ciudad,
    },
    objeto: {
      productoId: f.producto_id as ProductoId,
      nombreProducto: f.nombre_producto,
      variante: f.variante,
    },
    vendedorId: f.vendedor_id,
    nombreVendedor: f.nombre_vendedor,
    fechaEmision: f.fecha_emision,
    fechaValidez: f.fecha_validez,
    precios: preciosDe(f),
    alternativas,
    condiciones: {
      permanenciaMinimaMeses: f.permanencia_minima_meses,
      instalacion: {
        descripcion: f.instalacion_descripcion ?? '',
        tiempoEstimadoDiasHabiles: f.instalacion_dias_habiles ?? 0,
        tiempoEstimadoTexto: f.instalacion_texto ?? '',
        aportesDelCliente: (f.aporte_del_cliente ?? []).map((a): AporteDelCliente => ({
          tipo: a.tipo, descripcion: a.descripcion, bloqueante: a.bloqueante,
        })),
      },
      alcance: {
        queIncluye: alcance.filter((a) => a.clase === 'incluye').map((a) => a.texto),
        queNoIncluye: alcance.filter((a) => a.clase === 'no_incluye').map((a) => a.texto),
        limitesIncluidos: alcance.filter((a) => a.clase === 'limite').map((a) => a.texto),
      },
      basesYCondiciones: BASES_Y_CONDICIONES,
      tratamientoIva: f.tratamiento_iva ?? '',
      notasInternas: f.notas_internas,
    },
    logos: logosPara(f.producto_id as ProductoId),
    totalesPorMoneda: totalesDe(alternativas),
    presentacionId: f.presentacion_id,
    versionCatalogo: f.version_catalogo,
    motivoPerdida: f.motivo_perdida,
  };
}

interface FilaPresentacion extends FilaTrazado {
  readonly id: string;
  readonly cliente_id: string;
  readonly vendedor_id: string;
  readonly titulo: string;
  readonly plan_id: string | null;
  readonly lo_que_conversamos: string | null;
  readonly nota_del_vendedor: string | null;
  readonly mostrar_rango_referencia: boolean;
  readonly descartada_en: string | null;
  readonly presentacion_producto?: ReadonlyArray<{ producto_id: string }>;
}

const COLUMNAS_PRESENTACION = `id, cliente_id, vendedor_id, titulo, plan_id,
  lo_que_conversamos, nota_del_vendedor, mostrar_rango_referencia, descartada_en,
  ${COLUMNAS_TRAZADO}, presentacion_producto ( producto_id )`;

function aPresentacion(f: FilaPresentacion): Presentacion {
  return {
    ...aTrazado(f),
    id: f.id,
    tipo: 'presentacion',
    clienteId: f.cliente_id,
    vendedorId: f.vendedor_id,
    titulo: f.titulo,
    productosIncluidos: (f.presentacion_producto ?? []).map((p) => p.producto_id as ProductoId),
    planId: f.plan_id,
    loQueConversamos: f.lo_que_conversamos,
    notaDelVendedor: f.nota_del_vendedor,
    // ⛔ Una presentación nunca lleva precio definitivo. Cuando muestra un
    //    rango, va marcado como referencia y sale del copy aprobado.
    mostrarRangoDeReferencia: f.mostrar_rango_referencia,
    descartadaEn: f.descartada_en,
    version: f.version,
  };
}

interface FilaFirma {
  readonly id: string;
  readonly cotizacion_id: string;
  readonly rol: Firma['rol'];
  readonly firmante_id: string;
  readonly nombre_firmante: string;
  readonly aclaracion: string | null;
  readonly referencia_protegida: string;
  readonly firmado_en: string;
  readonly version_firmada: number;
  readonly anulada: boolean;
  readonly anulada_en: string | null;
  readonly motivo_anulacion: string | null;
}

function aFirma(f: FilaFirma): Firma {
  return {
    id: f.id,
    rol: f.rol,
    firmanteId: f.firmante_id,
    nombreFirmante: f.nombre_firmante,
    aclaracion: f.aclaracion ?? '',
    // ⛔ Referencia opaca al activo protegido. NO es una URL ni un archivo:
    //    la imagen de la firma no se sirve por ninguna dirección pública.
    referenciaProtegida: f.referencia_protegida,
    firmadoEn: f.firmado_en,
    versionFirmada: f.version_firmada,
    anulada: f.anulada,
    anuladaEn: f.anulada_en,
    motivoAnulacion: f.motivo_anulacion,
  };
}

// ---------------------------------------------------------------------------

export function crearCapaPropuestas(): CapaPropuestas {
  const sb = supabase();

  async function leerCotizacion(id: Id): Promise<Resultado<Cotizacion>> {
    const { data, error } = await sb
      .from('cotizacion').select(COLUMNAS_COTIZACION).eq('id', id).maybeSingle();
    if (error) return fallo<Cotizacion>(error);
    if (!data) {
      return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa cotización.' } };
    }
    return bien(aCotizacion(data as unknown as FilaCotizacion));
  }

  async function leerPresentacion(id: Id): Promise<Resultado<Presentacion>> {
    const { data, error } = await sb
      .from('presentacion').select(COLUMNAS_PRESENTACION).eq('id', id).maybeSingle();
    if (error) return fallo<Presentacion>(error);
    if (!data) {
      return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa presentación.' } };
    }
    return bien(aPresentacion(data as unknown as FilaPresentacion));
  }

  return {
    // --- A · Presentación --------------------------------------------------

    async listarPresentaciones(filtro: FiltroCotizaciones, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('presentacion').select(COLUMNAS_PRESENTACION, { count: 'exact' });
      if (filtro.clienteId) consulta = consulta.eq('cliente_id', filtro.clienteId);
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      const { data, error, count } = await consulta
        .order('creado_en', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Presentacion>>>(error);
      const items = ((data ?? []) as unknown as FilaPresentacion[]).map(aPresentacion);
      return bien(armarPagina<Presentacion>(items, r, count ?? null));
    },

    async crearPresentacion(datos: NuevaPresentacion, clave) {
      const { data, error } = await sb.rpc('crear_presentacion', {
        p_datos: {
          clienteId: datos.clienteId,
          titulo: datos.titulo,
          planId: datos.planId ?? null,
          productos: datos.productosIncluidos,
          loQueConversamos: datos.loQueConversamos ?? null,
          notaDelVendedor: datos.notaDelVendedor ?? null,
          mostrarRangoDeReferencia: datos.mostrarRangoDeReferencia ?? false,
        },
        p_clave: clave,
      });
      if (error) return fallo<Presentacion>(error);
      return leerPresentacion(data as string);
    },

    async actualizarPresentacion(id: Id, cambios: Partial<NuevaPresentacion>, version: Version) {
      const parche: Record<string, unknown> = { version };
      if (cambios.titulo !== undefined) parche['titulo'] = cambios.titulo;
      if (cambios.planId !== undefined) parche['plan_id'] = cambios.planId;
      if (cambios.loQueConversamos !== undefined) parche['lo_que_conversamos'] = cambios.loQueConversamos;
      if (cambios.notaDelVendedor !== undefined) parche['nota_del_vendedor'] = cambios.notaDelVendedor;
      if (cambios.mostrarRangoDeReferencia !== undefined) {
        parche['mostrar_rango_referencia'] = cambios.mostrarRangoDeReferencia;
      }
      const { error } = await sb.from('presentacion').update(parche).eq('id', id);
      if (error) return fallo<Presentacion>(error);
      return leerPresentacion(id);
    },

    async descartarPresentacion(id: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué descartás esta presentación.',
          campo: 'motivo',
        } };
      }
      const { data: quien } = await sb.auth.getUser();
      // ⛔ Desde ese momento el enlace deja de abrir, aunque no haya vencido.
      const { error } = await sb.from('presentacion').update({
        descartada_en: new Date().toISOString(),
        motivo_descarte: motivo.trim(),
        descartada_por: quien.user?.id ?? null,
      }).eq('id', id);
      if (error) return fallo<void>(error);
      return bien(undefined as void);
    },

    async emitirPresentacion(id: Id, clave) {
      const { data, error } = await sb.rpc('emitir_documento', {
        p_propuesta: id, p_tipo: 'presentacion', p_clave: clave,
      });
      if (error) return fallo<DocumentoEmitido>(error);
      return bien(data as unknown as DocumentoEmitido);
    },

    // --- B · Cotización ----------------------------------------------------

    async listarCotizaciones(filtro: FiltroCotizaciones, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      let consulta = sb.from('cotizacion').select(COLUMNAS_COTIZACION, { count: 'exact' });
      if (filtro.estado) consulta = consulta.eq('estado', filtro.estado);
      if (filtro.clienteId) consulta = consulta.eq('cliente_id', filtro.clienteId);
      if (filtro.vendedorId) consulta = consulta.eq('vendedor_id', filtro.vendedorId);
      if (filtro.desde) consulta = consulta.gte('fecha_emision', filtro.desde);
      if (filtro.hasta) consulta = consulta.lte('fecha_emision', filtro.hasta);
      const { data, error, count } = await consulta
        .order('fecha_emision', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<Cotizacion>>>(error);
      const items = ((data ?? []) as unknown as FilaCotizacion[]).map(aCotizacion);
      return bien(armarPagina<Cotizacion>(items, r, count ?? null));
    },

    async obtenerCotizacion(id: Id) {
      const base = await leerCotizacion(id);
      if (!base.ok) return base as Resultado<CotizacionDetalle>;

      const [firmas, versiones, documentos, enlaces] = await Promise.all([
        sb.from('firma').select('*').eq('cotizacion_id', id).order('firmado_en'),
        sb.from('version_cotizacion').select('*').eq('cotizacion_id', id).order('version'),
        sb.from('documento_emitido').select('*').eq('propuesta_id', id).order('emitido_en'),
        sb.from('enlace_compartido').select('*').eq('propuesta_id', id).order('creado_en'),
      ]);

      const fila = (await sb.from('cotizacion').select(COLUMNAS_COTIZACION).eq('id', id).maybeSingle()).data;
      const avisos: string[] = [];
      if (base.datos.estado === 'aprobada') {
        const vigentes = ((firmas.data ?? []) as unknown as FilaFirma[])
          .filter((f) => !f.anulada && f.version_firmada === base.datos.version);
        if (vigentes.length < 2) {
          avisos.push('Falta la firma del CEO para poder emitir el PDF definitivo.');
        }
      }

      return bien<CotizacionDetalle>({
        ...base.datos,
        revision: null,
        versiones: ((versiones.data ?? []) as unknown as Array<{
          version: number; estado: EstadoCotizacion; creada_en: string;
          creada_por: string; motivo_cambio: string | null;
        }>).map((v): VersionCotizacion => ({
          version: v.version,
          estado: v.estado,
          creadaEn: v.creada_en,
          creadaPor: v.creada_por,
          totalesPorMoneda: base.datos.totalesPorMoneda,
          motivoCambio: v.motivo_cambio,
        })),
        documentos: (documentos.data ?? []) as unknown as ReadonlyArray<DocumentoEmitido>,
        enlaces: (enlaces.data ?? []) as unknown as ReadonlyArray<EnlaceCompartido>,
        comparacion: comparacionDe(fila as unknown as FilaCotizacion),
        firmas: ((firmas.data ?? []) as unknown as FilaFirma[]).map(aFirma),
        avisos,
      });
    },

    async crearCotizacion(datos: NuevaCotizacion, clave) {
      // ⛔ De `precios` sólo viajan los DOS especiales. Los de lista los pone
      //    el servidor desde el catálogo: si los eligiera el navegador,
      //    elegiría también el ahorro que se le muestra al cliente.
      const { data, error } = await sb.rpc('crear_cotizacion', {
        p_datos: {
          clienteId: datos.clienteId,
          productoId: datos.productoId,
          variante: datos.variante ?? null,
          presentacionId: datos.presentacionId ?? null,
          fechaValidez: datos.fechaValidez,
          moneda: datos.precios.setupEspecial.moneda,
          setupEspecial: datos.precios.setupEspecial.monto,
          mensualEspecial: datos.precios.mensualEspecial.monto,
          permanenciaMinimaMeses: datos.condiciones.permanenciaMinimaMeses,
          tratamientoIva: datos.condiciones.tratamientoIva,
          notasInternas: datos.condiciones.notasInternas,
          instalacionDescripcion: datos.condiciones.instalacion.descripcion,
          instalacionDiasHabiles: datos.condiciones.instalacion.tiempoEstimadoDiasHabiles,
          instalacionTexto: datos.condiciones.instalacion.tiempoEstimadoTexto,
          alcance: [
            ...datos.condiciones.alcance.queIncluye.map((t) => ({ clase: 'incluye', texto: t })),
            ...datos.condiciones.alcance.queNoIncluye.map((t) => ({ clase: 'no_incluye', texto: t })),
            ...datos.condiciones.alcance.limitesIncluidos.map((t) => ({ clase: 'limite', texto: t })),
          ],
          aportesDelCliente: datos.condiciones.instalacion.aportesDelCliente,
        },
        p_clave: clave,
      });
      if (error) return fallo<Cotizacion>(error);
      return leerCotizacion(data as string);
    },

    async actualizarCotizacion(id: Id, cambios: Partial<NuevaCotizacion>, version: Version) {
      // ⛔ Sobre una cotización aprobada, esto crea versión nueva en borrador
      //    y CADUCA la aprobación: el disparador de la base anula las dos
      //    firmas de la versión anterior. No hay forma de editar lo aprobado
      //    sin que se note.
      const parche: Record<string, unknown> = { version };
      if (cambios.precios) {
        parche['setup_especial'] = cambios.precios.setupEspecial.monto;
        parche['mensual_especial'] = cambios.precios.mensualEspecial.monto;
      }
      if (cambios.fechaValidez !== undefined) parche['fecha_validez'] = cambios.fechaValidez;
      if (cambios.condiciones) {
        parche['permanencia_minima_meses'] = cambios.condiciones.permanenciaMinimaMeses;
        parche['tratamiento_iva'] = cambios.condiciones.tratamientoIva;
        parche['notas_internas'] = cambios.condiciones.notasInternas;
      }
      const { error } = await sb.rpc('actualizar_cotizacion', { p_id: id, p_cambios: parche });
      if (error) return fallo<Cotizacion>(error);
      return leerCotizacion(id);
    },

    // --- Cálculo -----------------------------------------------------------
    //
    // ⛔ Esto es previsualización, y lo dice el nombre. Lo que vale es lo que
    //    guarda el servidor: los precios de lista salen del catálogo y los
    //    ahorros son columnas generadas. Acá se usa la MISMA función que usa
    //    el resto del sistema, así que lo previsualizado y lo guardado no
    //    pueden discrepar por tener dos cálculos distintos.

    async previsualizarCotizacion(productoId: ProductoId, precios: PreciosEntrada) {
      const { data, error } = await sb
        .from('precio_lista')
        .select('modalidad, moneda, monto_desde, estado')
        .eq('producto_id', productoId);
      if (error) return fallo<PrevisualizacionCotizacion>(error);

      const filas = (data ?? []) as unknown as Array<{
        modalidad: string; moneda: Moneda | null; monto_desde: number | null; estado: string;
      }>;
      const deLista = (modalidad: string): number | null => {
        const f = filas.find((x) => x.modalidad === modalidad && x.estado !== 'no_documentado');
        return f?.monto_desde ?? null;
      };

      const m = precios.setupEspecial.moneda;
      const avisos: string[] = [];
      const listaSetup = deLista('setup');
      const listaMensual = deLista('mensualidad');
      if (listaSetup === null && listaMensual === null) {
        avisos.push('Este producto no tiene precio de lista documentado: se cotiza personalizado y no se muestra ningún ahorro.');
      }
      if (precios.setupEspecial.moneda !== precios.mensualEspecial.moneda) {
        return { ok: false as const, error: {
          codigo: 'monedas_mezcladas' as const,
          mensajeAmable: 'El setup y la mensualidad tienen que estar en la misma moneda.',
        } };
      }

      const base: BaseCalculo = {
        setupLista: plata(m, listaSetup ?? precios.setupEspecial.monto),
        setupEspecial: precios.setupEspecial,
        mensualLista: plata(m, listaMensual ?? precios.mensualEspecial.monto),
        mensualEspecial: precios.mensualEspecial,
      };
      const alternativas = calcularAlternativas(base);
      const ahorroSetup = base.setupLista.monto - precios.setupEspecial.monto;
      const ahorroMensual = base.mensualLista.monto - precios.mensualEspecial.monto;

      return bien<PrevisualizacionCotizacion>({
        base,
        precios: {
          setupLista: base.setupLista,
          setupEspecial: precios.setupEspecial,
          ahorroSetup: plata(m, ahorroSetup),
          ahorroSetupPorcentaje: porcentaje(ahorroSetup, base.setupLista.monto),
          mensualLista: base.mensualLista,
          mensualEspecial: precios.mensualEspecial,
          ahorroMensual: plata(m, ahorroMensual),
          ahorroMensualPorcentaje: porcentaje(ahorroMensual, base.mensualLista.monto),
        },
        alternativas,
        totalesPorMoneda: totalesDe(alternativas),
        avisos,
      });
    },

    async previsualizarTotales(base: BaseCalculo) {
      // ⛔ `monedaDeLaBase` lanza si se mezclan monedas. Un total que suma
      //    guaraníes con dólares no es un total: es un número inventado.
      try {
        monedaDeLaBase(base);
      } catch {
        return { ok: false as const, error: {
          codigo: 'monedas_mezcladas' as const,
          mensajeAmable: 'No se pueden sumar importes en monedas distintas.',
        } };
      }
      return bien(totalesDe(calcularAlternativas(base)));
    },

    async compararConLista(productoId: ProductoId, precios: PreciosEntrada) {
      const vista = await this.previsualizarCotizacion(productoId, precios);
      if (!vista.ok) return vista as Resultado<ComparacionConLista>;
      const m = precios.setupEspecial.moneda;
      const p = vista.datos.precios;
      const sinLista = vista.datos.avisos.length > 0;
      return bien<ComparacionConLista>({
        productoId,
        precioListaSetup: sinLista ? null : p.setupLista,
        setupEspecial: precios.setupEspecial,
        desviacionSetup: sinLista ? null : plata(m, -p.ahorroSetup.monto),
        desviacionSetupPorcentaje: sinLista ? null : -p.ahorroSetupPorcentaje,
        precioListaMensualidad: sinLista ? null : p.mensualLista,
        mensualEspecial: precios.mensualEspecial,
        desviacionMensualidad: sinLista ? null : plata(m, -p.ahorroMensual.monto),
        desviacionMensualidadPorcentaje: sinLista ? null : -p.ahorroMensualPorcentaje,
        sinPrecioDeLista: sinLista,
      });
    },

    async historialVersiones(id: Id) {
      const base = await leerCotizacion(id);
      if (!base.ok) return base as Resultado<ReadonlyArray<VersionCotizacion>>;
      const { data, error } = await sb
        .from('version_cotizacion').select('*').eq('cotizacion_id', id).order('version');
      if (error) return fallo<ReadonlyArray<VersionCotizacion>>(error);
      return bien(((data ?? []) as unknown as Array<{
        version: number; estado: EstadoCotizacion; creada_en: string;
        creada_por: string; motivo_cambio: string | null;
      }>).map((v): VersionCotizacion => ({
        version: v.version, estado: v.estado, creadaEn: v.creada_en,
        creadaPor: v.creada_por, totalesPorMoneda: base.datos.totalesPorMoneda,
        motivoCambio: v.motivo_cambio,
      })));
    },

    // --- Firma y revisión --------------------------------------------------

    async firmarComoVendedor(cotizacionId: Id, clave) {
      // ⛔ El navegador manda la INTENCIÓN de firmar. Nada más. La referencia
      //    al activo protegido la resuelve el servidor, y no es una URL ni un
      //    nombre de archivo.
      const { data, error } = await sb.rpc('firmar_como_vendedor', {
        p_cotizacion: cotizacionId, p_clave: clave,
      });
      if (error) return fallo<Firma>(error);
      const filas = (data ?? []) as unknown as FilaFirma[];
      const f = filas.length > 0 ? filas[0] : undefined;
      if (!f) {
        return { ok: false as const, error: {
          codigo: 'servicio_no_disponible' as const,
          mensajeAmable: 'No pudimos registrar la firma. Probá de nuevo.',
        } };
      }
      return bien(aFirma(f));
    },

    async enviarARevision(id: Id, comentario: string, clave) {
      // ⛔ Sin firma de vendedor vigente la base lo frena con `requiere_firma`.
      const { error } = await sb.rpc('enviar_a_revision', {
        p_cotizacion: id, p_comentario: comentario, p_clave: clave,
      });
      if (error) return fallo<Cotizacion>(error);
      return leerCotizacion(id);
    },

    // --- Sólo después de aprobar -------------------------------------------

    async emitirPdfDefinitivo(cotizacionId: Id, clave) {
      // ⛔ Estado distinto de `aprobada` ⇒ la base devuelve regla_comercial.
      // ⛔ Sin las DOS firmas vigentes, tampoco sale.
      const { data, error } = await sb.rpc('emitir_documento', {
        p_propuesta: cotizacionId, p_tipo: 'cotizacion', p_clave: clave,
      });
      if (error) return fallo<DocumentoEmitido>(error);
      return bien(data as unknown as DocumentoEmitido);
    },

    async enviarAlCliente(cotizacionId: Id, _clave) {
      const { error } = await sb
        .from('cotizacion').update({ estado: 'enviada_al_cliente' }).eq('id', cotizacionId);
      if (error) return fallo<Cotizacion>(error);
      return leerCotizacion(cotizacionId);
    },

    async marcarDesenlace(id: Id, desenlace: 'aceptada' | 'perdida', motivo?: string) {
      // ⛔ Perder una cotización exige decir por qué.
      if (desenlace === 'perdida' && (!motivo || motivo.trim().length === 0)) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué se perdió antes de cerrarla.',
          campo: 'motivo',
        } };
      }
      const parche: Record<string, unknown> = { estado: desenlace };
      if (desenlace === 'perdida') parche['motivo_perdida'] = motivo;
      const { error } = await sb.from('cotizacion').update(parche).eq('id', id);
      if (error) return fallo<Cotizacion>(error);
      return leerCotizacion(id);
    },

    // --- Enlaces y respuesta -----------------------------------------------

    async crearEnlace(propuestaId: Id, opciones: OpcionesEnlace, clave) {
      const { data, error } = await sb.rpc('crear_enlace', {
        p_propuesta: propuestaId,
        p_opciones: {
          venceEn: opciones.venceEn,
          topeAperturas: opciones.topeAperturas ?? null,
          requiereCodigo: opciones.requiereCodigo ?? false,
        },
        p_clave: clave,
      });
      if (error) return fallo<EnlaceCompartido>(error);
      const filas = (data ?? []) as unknown as ReadonlyArray<EnlaceCompartido>;
      const e = filas.length > 0 ? filas[0] : undefined;
      if (!e) {
        return { ok: false as const, error: {
          codigo: 'servicio_no_disponible' as const,
          mensajeAmable: 'No pudimos armar el enlace. Probá de nuevo.',
        } };
      }
      return bien(e);
    },

    async revocarEnlace(enlaceId: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false as const, error: {
          codigo: 'validacion' as const,
          mensajeAmable: 'Contá por qué revocás el enlace.', campo: 'motivo',
        } };
      }
      const { data: quien } = await sb.auth.getUser();
      const { data, error } = await sb
        .from('enlace_compartido')
        .update({ revocado_en: new Date().toISOString(), revocado_por: quien.user?.id ?? null })
        .eq('id', enlaceId).select('*').maybeSingle();
      if (error) return fallo<EnlaceCompartido>(error);
      if (!data) {
        return { ok: false as const, error: {
          codigo: 'no_encontrado' as const, mensajeAmable: 'No encontramos ese enlace.',
        } };
      }
      return bien(data as unknown as EnlaceCompartido);
    },

    async aperturasDePropuesta(propuestaId: Id, pagina?: OpcionesPagina) {
      const r = rango(pagina);
      const { data: enlaces } = await sb
        .from('enlace_compartido').select('id').eq('propuesta_id', propuestaId);
      const ids = ((enlaces ?? []) as unknown as Array<{ id: string }>).map((e) => e.id);
      if (ids.length === 0) return bien(armarPagina<AccesoEnlace>([], r, 0));

      const { data, error, count } = await sb
        .from('acceso_enlace').select('*', { count: 'exact' })
        .in('enlace_id', ids)
        .order('ocurrido_en', { ascending: false }).range(r.desde, r.hasta);
      if (error) return fallo<ReturnType<typeof armarPagina<AccesoEnlace>>>(error);
      return bien(armarPagina<AccesoEnlace>(
        (data ?? []) as unknown as ReadonlyArray<AccesoEnlace>, r, count ?? null,
      ));
    },

    async constanciaDeCotizacion(cotizacionId: Id) {
      const { data, error } = await sb
        .from('constancia_respuesta')
        .select('*, importe_aceptado ( concepto, moneda, monto )')
        .eq('cotizacion_id', cotizacionId).maybeSingle();
      if (error) return fallo<ConstanciaRespuesta | null>(error);
      if (!data) return bien(null);
      return bien(data as unknown as ConstanciaRespuesta);
    },
  };
}
