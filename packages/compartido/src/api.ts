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
  CorreccionDato, EntradaObjetivo, EstadoProveedores,
  InvestigacionCorregida, InvestigacionObjetivo,
} from './investigacion';

import type {
  AgendaHoy, AgendaMes, AgendaSemana, AjusteEntrada, CronogramaComercial,
  EntradaAgenda, FiltroAgenda, NuevaEntradaManual, ResumenAgenda,
} from './agenda';

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
  NuevaCotizacion, NuevaPresentacion, OpcionesEnlace, PreciosEntrada, Presentacion,
  PresentacionPublica, PrevisualizacionCotizacion, VersionCotizacion,
} from './propuestas';

import type { AlternativaCalculada, BaseCalculo, CodigoAlternativa } from './alternativas';

import type {
  AvisoCopyDesactualizado, EntradaPorNecesidad, FichaOficial, FichaPersonalizada,
  FichaPublica, IndicePortafolio, NuevaFichaPersonalizada, OpcionesEnlaceFicha,
} from './fichas';
import type { FichaInterna } from './fichas-internas';

import type {
  ConstanciaRespuesta, CotizacionPublica, Firma, ResultadoNotificaciones,
  RespuestaDelCliente, RolFirmante,
} from './aceptacion';

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
  /** ⛔ Lista CORTA. El detalle vive en #/agenda. */
  proximosSeguimientos(limite?: number): R<ReadonlyArray<ProximoSeguimiento>>;
  /** Contador para el acceso a Agenda. ⛔ No es la agenda: es el acceso. */
  resumenAgenda(): R<ResumenAgenda>;
}

// ===========================================================================
// S3 · Motor de planificación
// ===========================================================================

export interface CapaMotor {
  // --- Investigación automática ---
  /**
   * Investiga un objetivo a partir del dato mínimo: un RUC, una razón social,
   * un nombre comercial; o nombre + profesión para un profesional.
   *
   * ⛔ El vendedor NO investiga ni completa el perfil a mano: sólo confirma,
   *    corrige o agrega sobre lo que vuelve de acá.
   * ⛔ Toda la investigación y todo uso de modelo de lenguaje ocurren en el
   *    SERVIDOR, detrás de proveedores intercambiables. Ninguna clave ni
   *    llamada sensible vive en el navegador.
   * ⛔ Si las fuentes externas fallan, cae a la taxonomía, marca
   *    `usoRespaldoTaxonomia` y devuelve `datosMinimosFaltantes` — sólo los
   *    campos imprescindibles, nunca un formulario largo vacío.
   * ⛔ No persiste: el vendedor confirma primero.
   */
  investigarObjetivo(entrada: EntradaObjetivo): R<InvestigacionObjetivo>;
  /** Estado de una investigación en curso (puede tardar). */
  estadoInvestigacion(id: Id): R<InvestigacionObjetivo>;
  /** El vendedor confirma, corrige o agrega; el sistema recalcula y dice qué cambió. */
  corregirInvestigacion(
    investigacion: InvestigacionObjetivo,
    correcciones: ReadonlyArray<CorreccionDato>,
  ): R<InvestigacionCorregida>;
  /** Convierte una investigación confirmada en un plan. */
  planDesdeInvestigacion(investigacion: InvestigacionObjetivo): R<Plan>;

  // --- Taxonomía ---
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
// S4 · Agenda operativa
// ===========================================================================

/**
 * ⛔ La agenda SE POBLA SOLA desde planes, objetivos aceptados, seguimientos,
 *    presentaciones, cotizaciones, vencimientos y aperturas de enlace.
 *    El vendedor ajusta fechas y completa acciones; no reconstruye nada.
 *
 * Por eso la única escritura de creación es `crearEntradaManual`, y es la
 * excepción: todo lo demás llega derivado.
 */
export interface CapaAgenda {
  agendaHoy(fecha?: ISODate): R<AgendaHoy>;
  agendaSemana(desde?: ISODate): R<AgendaSemana>;
  agendaMes(anio: number, mes: number): R<AgendaMes>;
  cronogramaComercial(desde: ISODate, hasta: ISODate): R<CronogramaComercial>;
  listarEntradas(filtro: FiltroAgenda, pagina?: OpcionesPagina): R<Pagina<EntradaAgenda>>;
  /** Seguimientos atrasados: lo que se pasó de fecha y sigue pendiente. */
  entradasAtrasadas(pagina?: OpcionesPagina): R<Pagina<EntradaAgenda>>;

  /** ⛔ Excepción: casi todas las entradas llegan solas. */
  crearEntradaManual(datos: NuevaEntradaManual, clave: ClaveIdempotencia): R<EntradaAgenda>;
  /** ⛔ Mover una fecha exige motivo. */
  ajustarEntrada(ajuste: AjusteEntrada): R<EntradaAgenda>;
  completarEntrada(entradaId: Id, clave: ClaveIdempotencia): R<EntradaAgenda>;
  descartarEntrada(entradaId: Id, motivo: string): R<EntradaAgenda>;
}

// ===========================================================================
// Fichas de producto — el eslabon entre el motor y la propuesta
// ===========================================================================

/**
 * ⛔ Metodos que deliberadamente NO EXISTEN, y no deben agregarse:
 *
 *   editarBloqueFicha, reescribirFicha, guardarCopyDeFicha
 *       → la ficha oficial es fuente maestra. La personalizacion es una capa
 *         encima y sólo decide presentacion: visible, orden, destacado.
 *         No hay por donde escribir el contenido de un bloque.
 *
 * La regla no se defiende con una validacion: se defiende porque el metodo
 * no existe y `PersonalizacionBloque` no tiene campo de texto.
 */
export interface CapaFichas {
  /** La ficha oficial, servida desde el copy congelado. ⛔ Sólo lectura. */
  obtenerFichaOficial(productoId: ProductoId): R<FichaOficial>;
  /** El indice "Soluciones Lab.IA": nueve especificas y cuatro integrales. */
  indicePortafolio(): R<IndicePortafolio>;
  /** Entrada por dolor, no por nombre de producto. ⛔ Sólo `directo` y `cercano`. */
  fichasPorNecesidad(necesidadId: Id): R<EntradaPorNecesidad>;

  /**
   * La ficha INTERNA: la que lee el vendedor para saber CÓMO vender este
   * producto —señales, preguntas, con qué se combina y dónde no ofrecerlo—.
   *
   * ⛔ NUNCA sale al cliente: no hay enlace, ni PDF, ni nada que la comparta.
   *    Es conocimiento comercial interno.
   * ⛔ Y no inventa nada: se arma con lo que Administración cargó en la
   *    taxonomía. Si no hay nada cargado, lo dice (`sinTaxonomia`).
   */
  fichaInternaDeProducto(productoId: ProductoId): R<FichaInterna>;

  // La capa del vendedor, para un prospecto
  listarFichasPersonalizadas(clienteId: Id, pagina?: OpcionesPagina): R<Pagina<FichaPersonalizada>>;
  obtenerFichaPersonalizada(id: Id): R<FichaPersonalizada>;
  prepararFicha(datos: NuevaFichaPersonalizada, clave: ClaveIdempotencia): R<FichaPersonalizada>;
  actualizarFicha(id: Id, cambios: Partial<NuevaFichaPersonalizada>, version: Version): R<FichaPersonalizada>;
  /** ⛔ No borra la ficha oficial: descarta la capa. */
  descartarFicha(id: Id, motivo: string): R<void>;

  /**
   * Avisa si el copy cambio desde que el vendedor preparo la ficha.
   * ⛔ El enlace sirve siempre el copy VIGENTE; esto es para que el vendedor
   *    no se entere delante del cliente.
   */
  revisarCopyDeFicha(id: Id): R<AvisoCopyDesactualizado | null>;

  /** Enlace responsive para WhatsApp o correo. Token opaco, igual que el resto. */
  compartirFicha(id: Id, opciones: OpcionesEnlaceFicha, clave: ClaveIdempotencia): R<EnlaceCompartido>;
  revocarEnlaceFicha(enlaceId: Id, motivo: string): R<EnlaceCompartido>;
  aperturasDeFicha(id: Id, pagina?: OpcionesPagina): R<Pagina<AccesoEnlace>>;
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

  /**
   * Las cuatro alternativas y los seis importes, calculados por el SERVIDOR.
   *
   * El navegador puede previsualizar con `calcularAlternativas` de
   * alternativas.ts, pero lo que vale es esto: ⛔ el servidor vuelve a ejecutar
   * los cuatro cálculos antes de aprobar y su resultado prevalece.
   * ⛔ Monedas distintas en la base ⇒ `monedas_mezcladas`.
   */
  previsualizarCotizacion(
    productoId: ProductoId,
    precios: PreciosEntrada,
    variante?: string,
  ): R<PrevisualizacionCotizacion>;
  /** ⛔ Un Dinero por moneda. Nunca un total consolidado. */
  previsualizarTotales(base: BaseCalculo): R<TotalesPorMoneda>;
  compararConLista(productoId: ProductoId, precios: PreciosEntrada): R<ComparacionConLista>;
  historialVersiones(id: Id): R<ReadonlyArray<VersionCotizacion>>;

  // Firma del vendedor y envío a revisión
  /**
   * ⛔ Se registra ANTES de enviar a revisión.
   * ⛔ `referenciaProtegida` la resuelve el servidor: el navegador manda la
   *    intención de firmar, nunca la imagen ni su ubicación.
   */
  firmarComoVendedor(cotizacionId: Id, clave: ClaveIdempotencia): R<Firma>;
  /** ⛔ Sin firma de vendedor vigente ⇒ `requiere_firma`. */
  enviarARevision(id: Id, comentario: string, clave: ClaveIdempotencia): R<Cotizacion>;

  // Sólo después de aprobar
  /**
   * ⛔ Estado distinto de `aprobada` ⇒ `requiere_aprobacion`.
   * ⛔ Sin las DOS firmas vigentes ⇒ `requiere_firma`.
   * Idempotente por (id, version).
   */
  emitirPdfDefinitivo(cotizacionId: Id, clave: ClaveIdempotencia): R<DocumentoEmitido>;
  /** ⛔ Estado distinto de `aprobada` ⇒ `requiere_aprobacion`. */
  enviarAlCliente(cotizacionId: Id, clave: ClaveIdempotencia): R<Cotizacion>;
  marcarDesenlace(id: Id, desenlace: 'aceptada' | 'perdida', motivo?: string): R<Cotizacion>;

  // Enlaces, aperturas y respuesta
  crearEnlace(propuestaId: Id, opciones: OpcionesEnlace, clave: ClaveIdempotencia): R<EnlaceCompartido>;
  revocarEnlace(enlaceId: Id, motivo: string): R<EnlaceCompartido>;
  aperturasDePropuesta(propuestaId: Id, pagina?: OpcionesPagina): R<Pagina<AccesoEnlace>>;
  /** La constancia del cliente, si ya respondió. */
  constanciaDeCotizacion(cotizacionId: Id): R<ConstanciaRespuesta | null>;
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
    /**
     * Alternativas que quedan visibles para el cliente. Vacío = las cuatro.
     * ⛔ Sólo se usa al `aprobar`.
     */
    alternativasAprobadas?: ReadonlyArray<CodigoAlternativa>,
  ): R<Cotizacion>;
  /**
   * Los cuatro cálculos, ejecutados de nuevo en el servidor.
   * ⛔ `revisarCotizacion('aprobar', …)` lo corre siempre antes de aprobar;
   *    este método existe para poder verlos antes de decidir.
   */
  recalcularCotizacion(id: Id): R<ReadonlyArray<AlternativaCalculada>>;
  /**
   * Incorpora la firma del CEO. ⛔ Sucede AL APROBAR, no antes.
   * ⛔ La imagen se resuelve y se incrusta en el servidor. No hay URL pública
   *    de la firma del CEO, ni en el enlace, ni en el PDF, ni en el navegador.
   */
  firmarComoCeo(cotizacionId: Id, clave: ClaveIdempotencia): R<Firma>;
  /** Firmas de una cotización, con su estado de anulación. */
  firmasDeCotizacion(cotizacionId: Id): R<ReadonlyArray<Firma>>;
  /**
   * ⛔ Una modificación posterior anula la aprobación Y las firmas anteriores.
   *    Lo hace `actualizarCotizacion`; esto sólo lo deja consultar.
   */
  anulacionesDeFirma(cotizacionId: Id, rol?: RolFirmante): R<ReadonlyArray<Firma>>;

  // Constancias y avisos
  listarConstancias(pagina?: OpcionesPagina): R<Pagina<ConstanciaRespuesta>>;
  /** ⛔ Reintento manual. La constancia ya está guardada: esto sólo reenvía el aviso. */
  reintentarNotificaciones(constanciaId: Id): R<ResultadoNotificaciones>;

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

  /**
   * Estado de los proveedores de investigación y de modelo de lenguaje.
   * ⛔ Sólo lectura: la configuración de proveedores y sus claves viven en el
   *    servidor. Acá se ve si responden y si el sistema está en modo respaldo.
   */
  estadoProveedores(): R<EstadoProveedores>;

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
  /**
   * La ficha que el vendedor compartio. ⛔ Sin datos operativos del vendedor:
   * ni comisiones, ni plan interno, ni ranking, ni por que se eligio este
   * producto. Unica accion: "Hablemos".
   */
  obtenerFichaPublica(token: string): R<FichaPublica>;
  /** El portafolio publico, navegable por producto o por necesidad. */
  obtenerIndicePublico(): R<IndicePortafolio>;
  obtenerPresentacionPublica(token: string, codigo?: string): R<PresentacionPublica>;
  /** ⛔ Sólo de cotizaciones `aprobada` o `enviada_al_cliente`. */
  obtenerCotizacionPublica(token: string, codigo?: string): R<CotizacionPublica>;
  descargarPdfPublico(token: string): R<{ readonly url: string; readonly venceEn: ISODate }>;

  /**
   * La elección del cliente.
   *
   * ⛔ `aceptacionMarcada` es literal `true`: sin la casilla marcada el tipo no
   *    compila y el servidor devuelve `validacion`.
   * ⛔ Una sola opción: las alternativas son excluyentes (botones de opción).
   * ⛔ La constancia se guarda ANTES de intentar los avisos. Si un aviso falla,
   *    `constanciaGuardada` sigue siendo `true` y el envío se reintenta.
   *    Nunca se pierde la elección del cliente.
   * ⛔ Es una constancia comercial, no un contrato ni una firma electrónica legal.
   */
  responderCotizacion(
    token: string,
    respuesta: RespuestaDelCliente,
    clave: ClaveIdempotencia,
  ): R<ConstanciaRespuesta>;
  /** Lo que el cliente ve después de enviar: su propia constancia, nada más. */
  obtenerConstanciaPublica(token: string): R<ConstanciaRespuesta | null>;
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
    CapaAgenda,
    CapaFichas,
    CapaPropuestas,
    CapaDinero,
    CapaAdministracion {}
