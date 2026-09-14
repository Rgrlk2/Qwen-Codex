/**
 * CapaDatos — contrato único entre las vistas y los datos.
 *
 * ⛔ Las vistas NUNCA llaman `fetch` directo.
 * ⛔ Propiedad de la Sesión 1. Ninguna otra sesión edita este archivo.
 *    Protocolo de cambio: docs/PARALLEL_SESSIONS.md §6.
 *
 * UNA SOLA APLICACIÓN. DOS ROLES. El rol se verifica en el servidor:
 * un método de administración llamado por un vendedor devuelve `sin_permiso`,
 * siempre, aunque la interfaz haya ocultado el enlace.
 *
 * Ver docs/API_CONTRACTS.md.
 */

import type {
  ClaveIdempotencia, Dinero, Id, ISODate, OpcionesPagina, Pagina,
  PeriodoMensual, Resultado, TotalesPorMoneda, Version,
} from './core';

import type { FiltroProductos, PrecioLista, Producto, ProductoDetalle, ProductoId } from './catalogo';
import type { Capacidades, FiltroUsuarios, NuevoUsuario, Rol, Sesion, Usuario } from './identidad';

import type {
  Actividad, AjustePerfil, CambioTaxonomia, EjePlan, EntradaPlan, FiltroPlanes,
  MotivoCierrePlan, Necesidad, ObjetivoSugerido, Operacion, Plan, PlanDeRubro, PlanRecalculado,
} from './motor';

import type {
  Cliente, ClienteDetalle, Contacto, EventoLineaTiempo, FiltroClientes, NuevoCliente,
} from './clientes';

import type { ProximoSeguimiento, ResumenInicio } from './inicio';

import type {
  AudioSeguimiento, CapturaSeguimiento, EstadoPaso, FiltroSeguimientos,
  PasoSugerido, PropuestaDeSeguimiento, Seguimiento, SeguimientoConfirmado, SoporteDictado,
} from './seguimiento';

import type {
  AccesoEnlace, AccionRevision, ComparacionConLista, Cotizacion, CotizacionDetalle,
  DocumentoEmitido, EnlaceCompartido, FiltroAperturas, FiltroColaRevision, FiltroCotizaciones,
  ItemCotizacionEntrada, NuevaCotizacion, NuevaPresentacion, OpcionesEnlace, Presentacion,
  PropuestaPublica, VersionCotizacion,
} from './propuestas';

import type {
  Ajuste, EstadoObservacion, FiltroMensualidades, LineaParticipacion, LineaPorCobrar,
  Liquidacion, LiquidacionDetalle, Mensualidad, NuevaObservacion, NuevaParticipacion,
  NuevoAjuste, NuevoPresupuesto, Observacion, ParticipacionProducto, Presupuesto,
  ResumenDinero, VerificacionCierre,
} from './dinero';

import type {
  ControlFinanciero, FilaRanking, ParametrosSistema, PrecioListaEntrada,
  ReasignacionCartera, ResultadoReasignacion, UsoPorVendedor,
} from './administracion';

import type {
  AgregadoSugerencias, FiltroSugerencias, NuevaSugerencia, ResolucionSugerencia, SugerenciaProducto,
} from './sugerencias';

import type { FiltroRegistroAcceso, RegistroAcceso } from './registros';

type R<T> = Promise<Resultado<T>>;

// ===========================================================================
// S1 · Sesión y autenticación
// ===========================================================================

export interface CapaSesion {
  /** Un solo login, usuario y contraseña. */
  ingresar(usuario: string, clave: string): R<Sesion>;
  sesionActual(): R<Sesion>;
  cerrarSesion(): R<void>;
  cambiarClave(actual: string, nueva: string): R<void>;
  /** Qué dibuja la interfaz. ⛔ NO reemplaza a la guardia del servidor. */
  capacidades(): R<Capacidades>;
}

// ===========================================================================
// S2 · Inicio
// ===========================================================================

/**
 * ⛔ No existe ningún método de analítica: sin embudos, sin tasas de conversión,
 *    sin mezcla de productos, sin series para gráficos decorativos.
 *    Lo que no está en el contrato no se puede dibujar.
 */
export interface CapaInicio {
  /** Las cuatro cifras. */
  resumenInicio(): R<ResumenInicio>;
  proximosSeguimientos(limite?: number): R<ReadonlyArray<ProximoSeguimiento>>;
}

// ===========================================================================
// S3 · Motor de planificación
// ===========================================================================

export interface CapaMotor {
  buscarActividad(texto: string): R<ReadonlyArray<Actividad>>;
  /**
   * ⛔ NUNCA devuelve `no_encontrado`: si el término no existe, lo crea como
   *    `pendiente_de_revision` y lo devuelve usable. El motor no frena al vendedor.
   */
  resolverActividad(texto: string, clave: ClaveIdempotencia): R<Actividad>;
  listarOperaciones(): R<ReadonlyArray<Operacion>>;
  listarNecesidades(): R<ReadonlyArray<Necesidad>>;

  /** ⛔ NO persiste. Devuelve el plan para que el vendedor lo ajuste. */
  generarPlan(entrada: EntradaPlan, eje: EjePlan): R<Plan>;
  /** Devuelve además qué cambió y por qué. */
  recalcularPlan(plan: Plan, ajustes: ReadonlyArray<AjustePerfil>): R<PlanRecalculado>;
  guardarPlan(plan: Plan, clave: ClaveIdempotencia): R<Plan>;
  obtenerPlan(id: Id): R<Plan>;
  listarPlanes(filtro: FiltroPlanes, pagina?: OpcionesPagina): R<Pagina<Plan>>;
  crearPlanDeRubro(
    plan: Plan,
    periodoDesde: ISODate,
    periodoHasta: ISODate,
    metaGuaranies: Dinero,
    clave: ClaveIdempotencia,
  ): R<PlanDeRubro>;
  /** ⛔ Sin motivo ⇒ `validacion`. */
  cerrarPlan(id: Id, motivo: MotivoCierrePlan, comentario: string): R<PlanDeRubro>;
  objetivosSugeridos(planId: Id): R<ReadonlyArray<ObjetivoSugerido>>;
  /** ⛔ Genera una tarea, NO un cliente. */
  aceptarObjetivo(objetivoId: Id, clave: ClaveIdempotencia): R<ObjetivoSugerido>;

  /** ⛔ Siempre ≤ 13 ítems, todos del catálogo cerrado. */
  listarProductos(filtro?: FiltroProductos): R<ReadonlyArray<Producto>>;
  /** ⛔ Trae `claveCopy`, NO el texto del copy. */
  obtenerProducto(id: ProductoId): R<ProductoDetalle>;
  preciosDeProducto(id: ProductoId): R<ReadonlyArray<PrecioLista>>;

  crearSugerencia(datos: NuevaSugerencia, clave: ClaveIdempotencia): R<SugerenciaProducto>;
  listarMisSugerencias(pagina?: OpcionesPagina): R<Pagina<SugerenciaProducto>>;
}

// ===========================================================================
// S4 · Clientes, voz y seguimiento
// ===========================================================================

export interface CapaClientes {
  listarClientes(filtro: FiltroClientes, pagina?: OpcionesPagina): R<Pagina<Cliente>>;
  obtenerCliente(id: Id): R<ClienteDetalle>;
  crearCliente(datos: NuevoCliente, clave: ClaveIdempotencia): R<Cliente>;
  actualizarCliente(id: Id, cambios: Partial<NuevoCliente>, version: Version): R<Cliente>;
  listarContactos(clienteId: Id): R<ReadonlyArray<Contacto>>;
  lineaDeTiempo(clienteId: Id, pagina?: OpcionesPagina): R<Pagina<EventoLineaTiempo>>;

  /** Sin soporte, la vista informa y ofrece texto. ⛔ Nunca un botón inerte. */
  soporteDictado(): R<SoporteDictado>;
  subirAudio(archivo: Blob, clave: ClaveIdempotencia): R<AudioSeguimiento>;
  /** ⛔ NO persiste nada: devuelve una propuesta para que el usuario confirme. */
  procesarCaptura(entrada: CapturaSeguimiento): R<PropuestaDeSeguimiento>;
  /** ⛔ Exige `confirmadoPorUsuario: true`; sin eso ⇒ `validacion`. */
  guardarSeguimiento(datos: SeguimientoConfirmado, clave: ClaveIdempotencia): R<Seguimiento>;
  listarSeguimientos(filtro: FiltroSeguimientos, pagina?: OpcionesPagina): R<Pagina<Seguimiento>>;
  /** Borra el audio. ⛔ NO borra la transcripción ni el seguimiento. */
  borrarAudio(audioId: Id, motivo: string): R<void>;
  actualizarPaso(pasoId: Id, estado: EstadoPaso): R<PasoSugerido>;
}

// ===========================================================================
// S5 · Presentaciones y cotizaciones
// ===========================================================================

/**
 * ⛔ NO existe `aprobarCotizacion` en esta capa. Aprobar es de administración.
 * ⛔ `emitirPdfDefinitivo` y `enviarAlCliente` sobre una cotización que no está
 *    `aprobada` devuelven `requiere_aprobacion`. Es la regla comercial central
 *    y se defiende en el contrato, no en una validación de interfaz.
 */
export interface CapaPropuestas {
  // A · Presentación: sin precio definitivo, sin aprobación
  listarPresentaciones(filtro: FiltroCotizaciones, pagina?: OpcionesPagina): R<Pagina<Presentacion>>;
  crearPresentacion(datos: NuevaPresentacion, clave: ClaveIdempotencia): R<Presentacion>;
  actualizarPresentacion(id: Id, cambios: Partial<NuevaPresentacion>, version: Version): R<Presentacion>;
  emitirPresentacion(id: Id, clave: ClaveIdempotencia): R<DocumentoEmitido>;

  // B · Cotización: precio propuesto por el vendedor
  listarCotizaciones(filtro: FiltroCotizaciones, pagina?: OpcionesPagina): R<Pagina<Cotizacion>>;
  obtenerCotizacion(id: Id): R<CotizacionDetalle>;
  crearCotizacion(datos: NuevaCotizacion, clave: ClaveIdempotencia): R<Cotizacion>;
  /** Sobre `aprobada` crea versión nueva en borrador y CADUCA la aprobación. */
  actualizarCotizacion(id: Id, cambios: Partial<NuevaCotizacion>, version: Version): R<Cotizacion>;
  /** ⛔ Un Dinero por moneda. Nunca un total consolidado. */
  previsualizarTotales(items: ReadonlyArray<ItemCotizacionEntrada>): R<TotalesPorMoneda>;
  compararConLista(items: ReadonlyArray<ItemCotizacionEntrada>): R<ComparacionConLista>;
  enviarARevision(id: Id, comentario: string, clave: ClaveIdempotencia): R<Cotizacion>;
  historialVersiones(id: Id): R<ReadonlyArray<VersionCotizacion>>;

  // Sólo después de aprobar
  /** ⛔ Estado distinto de `aprobada` ⇒ `requiere_aprobacion`. Idempotente por (id, version). */
  emitirPdfDefinitivo(cotizacionId: Id, clave: ClaveIdempotencia): R<DocumentoEmitido>;
  /** ⛔ Estado distinto de `aprobada` ⇒ `requiere_aprobacion`. */
  enviarAlCliente(cotizacionId: Id, clave: ClaveIdempotencia): R<Cotizacion>;
  marcarDesenlace(id: Id, desenlace: 'aceptada' | 'perdida', motivo?: string): R<Cotizacion>;

  // Enlaces y aperturas
  crearEnlace(propuestaId: Id, opciones: OpcionesEnlace, clave: ClaveIdempotencia): R<EnlaceCompartido>;
  revocarEnlace(enlaceId: Id, motivo: string): R<EnlaceCompartido>;
  aperturasDePropuesta(propuestaId: Id, pagina?: OpcionesPagina): R<Pagina<AccesoEnlace>>;
}

// ===========================================================================
// S6 · Dinero del vendedor
// ===========================================================================

/**
 * ⛔ NO existe ningún método de escritura sobre participaciones, líneas ni
 *    liquidaciones en esta capa. El vendedor observa; no edita.
 */
export interface CapaDinero {
  /** Las ocho cifras, por moneda. */
  resumenDinero(periodo: PeriodoMensual): R<ResumenDinero>;
  listarMensualidades(filtro: FiltroMensualidades, pagina?: OpcionesPagina): R<Pagina<Mensualidad>>;
  listarLineasParticipacion(periodo: PeriodoMensual, pagina?: OpcionesPagina): R<Pagina<LineaParticipacion>>;
  listarLiquidaciones(pagina?: OpcionesPagina): R<Pagina<Liquidacion>>;
  obtenerLiquidacion(id: Id): R<LiquidacionDetalle>;
  /** ⛔ No modifica ningún importe: abre una observación para el administrador. */
  abrirObservacion(datos: NuevaObservacion, clave: ClaveIdempotencia): R<Observacion>;
}

// ===========================================================================
// S6 · Administración — sólo rol `administrador`
// ===========================================================================

/**
 * Métodos que deliberadamente NO EXISTEN, y no deben agregarse:
 *
 *   crearProducto · eliminarProducto     → el portafolio está cerrado en 13
 *   editarParticipacion                  → sólo se publica una versión nueva
 *   reabrirPeriodo                       → sólo se crea un ajuste
 *   autoaprobarCotizacion                → toda cotización pasa por una persona
 *   editarCopy · editarPrecioLista       → son sólo lectura
 *   cualquier escritura sobre RegistroAcceso o AccesoEnlace → son append-only
 */
export interface CapaAdministracion {
  // Control financiero
  controlFinanciero(periodo: PeriodoMensual): R<ControlFinanciero>;
  porCobrar(vendedorId: Id | null, pagina?: OpcionesPagina): R<Pagina<LineaPorCobrar>>;
  /** ⛔ Ordenado por monto en guaraníes. */
  rankingVendedores(periodo: PeriodoMensual): R<ReadonlyArray<FilaRanking>>;

  // Presupuesto
  listarPresupuestos(periodo: PeriodoMensual): R<ReadonlyArray<Presupuesto>>;
  definirPresupuesto(datos: NuevoPresupuesto, clave: ClaveIdempotencia): R<Presupuesto>;

  // Comisiones
  listarParticipacionesTodas(periodo: PeriodoMensual, pagina?: OpcionesPagina): R<Pagina<LineaParticipacion>>;
  verificarCierrePeriodo(periodo: PeriodoMensual): R<VerificacionCierre>;
  /** ⛔ Exige verificación en verde. Irreversible: el período no se reabre. */
  cerrarPeriodo(periodo: PeriodoMensual, clave: ClaveIdempotencia): R<ReadonlyArray<Liquidacion>>;
  crearAjuste(datos: NuevoAjuste, clave: ClaveIdempotencia): R<Ajuste>;
  resolverObservacion(id: Id, estado: EstadoObservacion, comentario: string): R<Observacion>;

  // Todos los clientes
  listarTodosLosClientes(filtro: FiltroClientes, pagina?: OpcionesPagina): R<Pagina<Cliente>>;
  lineaDeTiempoDeCualquierCliente(clienteId: Id, pagina?: OpcionesPagina): R<Pagina<EventoLineaTiempo>>;

  // Aprobación de cotizaciones
  colaDeRevision(filtro: FiltroColaRevision, pagina?: OpcionesPagina): R<Pagina<CotizacionDetalle>>;
  /**
   * ⛔ `actorId === cotizacion.vendedorId` ⇒ `sin_permiso`.
   * ⛔ Comentario vacío ⇒ `validacion`.
   */
  revisarCotizacion(
    id: Id,
    accion: Extract<AccionRevision, 'aprobar' | 'corregir' | 'rechazar'>,
    comentario: string,
    clave: ClaveIdempotencia,
  ): R<Cotizacion>;

  // Configuración comercial
  listarParticipaciones(): R<ReadonlyArray<ParticipacionProducto>>;
  /** ⛔ Porcentajes que no suman 100 ⇒ `validacion`. Publica versión nueva. */
  publicarParticipacion(datos: NuevaParticipacion, clave: ClaveIdempotencia): R<ParticipacionProducto>;
  cargarPreciosLista(precios: ReadonlyArray<PrecioListaEntrada>, motivo: string): R<{ readonly versionCatalogo: number }>;
  publicarProducto(id: ProductoId, publicado: boolean, motivo: string): R<Producto>;

  listarActividadesPendientes(pagina?: OpcionesPagina): R<Pagina<Actividad>>;
  confirmarActividad(id: Id): R<Actividad>;
  fusionarActividad(origenId: Id, destinoId: Id, motivo: string): R<Actividad>;
  editarTaxonomia(cambio: CambioTaxonomia, clave: ClaveIdempotencia): R<void>;

  listarVendedores(filtro: FiltroUsuarios, pagina?: OpcionesPagina): R<Pagina<Usuario>>;
  crearVendedor(datos: NuevoUsuario, clave: ClaveIdempotencia): R<Usuario>;
  cambiarRol(usuarioId: Id, rol: Rol, motivo: string): R<Usuario>;
  desactivarVendedor(id: Id, motivo: string): R<Usuario>;
  reasignarCartera(datos: ReasignacionCartera, clave: ClaveIdempotencia): R<ResultadoReasignacion>;

  obtenerParametros(): R<ParametrosSistema>;
  actualizarParametros(cambios: Partial<ParametrosSistema>, motivo: string): R<ParametrosSistema>;

  // Accesos y frecuencia de uso — ⛔ dos registros, nunca mezclados
  usoPorVendedor(periodo: PeriodoMensual): R<ReadonlyArray<UsoPorVendedor>>;
  listarRegistroAcceso(filtro: FiltroRegistroAcceso, pagina?: OpcionesPagina): R<Pagina<RegistroAcceso>>;
  listarAperturasEnlace(filtro: FiltroAperturas, pagina?: OpcionesPagina): R<Pagina<AccesoEnlace>>;

  // Sugerencias
  listarSugerencias(filtro: FiltroSugerencias, pagina?: OpcionesPagina): R<Pagina<SugerenciaProducto>>;
  /** ⛔ Resolución obligatoria: el silencio no es una respuesta válida. */
  resolverSugerencia(id: Id, resolucion: ResolucionSugerencia): R<SugerenciaProducto>;
  agregadoSugerencias(): R<ReadonlyArray<AgregadoSugerencias>>;
}

// ===========================================================================
// Enlace público — sin sesión
// ===========================================================================

/**
 * ⛔ Superficie mínima: sin datos de otros clientes, sin navegación, sin listados.
 * ⛔ Nunca revela cuántas aperturas hubo.
 */
export interface CapaPublica {
  obtenerPropuestaPublica(token: string, codigo?: string): R<PropuestaPublica>;
  descargarPdfPublico(token: string): R<{ readonly url: string; readonly venceEn: ISODate }>;
}

// ===========================================================================
// El puerto
// ===========================================================================

/**
 * Una sola aplicación ⇒ un solo puerto.
 * La administración está incluida: el servidor la protege por rol, no por
 * tener una capa aparte. Un vendedor que llama un método de `CapaAdministracion`
 * recibe `sin_permiso`.
 */
export interface CapaDatos
  extends CapaSesion,
    CapaInicio,
    CapaMotor,
    CapaClientes,
    CapaPropuestas,
    CapaDinero,
    CapaAdministracion {}
