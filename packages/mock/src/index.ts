/**
 * Implementación mock de `CapaDatos`.
 *
 * ⛔ DUEÑO DE ESTE ARCHIVO: SESIÓN 1. Ensambla los módulos de cada sesión:
 *
 *   datos-sesion.ts        → Sesión 1   (ingreso, roles, capacidades)
 *   datos-inicio.ts        → Sesión 2   (las cuatro cifras, próximos seguimientos)
 *   datos-motor.ts         → Sesión 3   (taxonomía, planes, catálogo, sugerencias)
 *   datos-investigacion.ts → Sesión 3   (investigación automática y proveedores)
 *   datos-clientes.ts      → Sesión 4   (cartera, seguimientos, audios)
 *   datos-agenda.ts        → Sesión 4   (agenda que se puebla sola)
 *   datos-propuestas.ts    → Sesión 5   (presentaciones, cotizaciones, enlaces)
 *   datos-finanzas.ts      → Sesión 6   (participación, mensualidades, admin)
 *
 * ⛔ Mientras la app corra con mock, la interfaz muestra de forma permanente el
 *    chip "Datos de ejemplo". Nunca se presenta un dato ficticio como real.
 *
 * ⛔ El mock debe respetar la guardia de rol: un método de administración
 *    llamado con rol `vendedor` devuelve `sin_permiso`, igual que el servidor.
 *    Si el mock es permisivo, la guardia no se prueba nunca.
 *
 * ESTADO DE ENSAMBLADO
 * ────────────────────
 * Las seis sesiones trabajan en paralelo desde el mismo commit base. Los
 * módulos de dominio de las sesiones 2 a 6 se incorporan acá al integrar; hasta
 * entonces sus métodos responden un error explícito (`servicio_no_disponible`),
 * ⛔ nunca un dato vacío disfrazado de éxito: así la vista ejerce su estado de
 * error en lugar de mostrar una pantalla en blanco.
 *
 * ⛔ Lo que NO espera a la integración es la guardia: los 42 métodos de
 *    `CapaAdministracion` ya rechazan al vendedor acá, con el mismo
 *    `sin_permiso` del servidor (QA_CHECKLIST §1.6).
 */

import type {
  CapaDatos,
  CapaPublica, FiltroRegistroAcceso, FiltroUsuarios, OpcionesPagina, Pagina,
  RegistroAcceso, Resultado, Rol, Usuario,
} from '@labia/compartido';

import {
  crearNucleoMock, ERROR_SIN_PERMISO,
  type ConfiguracionMock, type NucleoMock,
} from './nucleo';
import { crearCapaSesionMock, type CapaSesionMock } from './datos-sesion';
import { crearCapaFichasMock } from './capa-fichas';
import { crearCapaMotorMock } from './capa-motor';
import { crearCapaInicioMock } from './datos-inicio';
import { crearCapaClientesMock } from './datos-clientes';
import { crearCapaAgendaMock } from './datos-agenda';
import { crearDatosPropuestas } from './datos-propuestas';
import { crearCapaFinanzas } from './datos-finanzas';

export * from './nucleo';
export * from './datos-sesion';
export * from '@labia/compartido';

export interface OpcionesCapaDatosMock {
  readonly configuracion?: Partial<ConfiguracionMock>;
}

export interface CapaDatosMock extends CapaDatos {
  /** Palancas del mock: latencia, falla forzada, modo vacío y rol. */
  readonly mock: NucleoMock;
  readonly sesion: CapaSesionMock;
  /**
   * La cara del CLIENTE, servida por enlace con token.
   * ⛔ No es parte de `CapaDatos` a propósito: el Escritorio no la consume.
   *    Quien abre un enlace no tiene sesión, y esta capa no expone ni un dato
   *    operativo del vendedor.
   */
  readonly publica: CapaPublica;
}

export function crearCapaDatosMock(opciones: OpcionesCapaDatosMock = {}): CapaDatosMock {
  const nucleo = crearNucleoMock(opciones.configuracion ?? {});
  const sesion = crearCapaSesionMock(nucleo);
  const fichas = crearCapaFichasMock(nucleo);
  const motor = crearCapaMotorMock(nucleo);
  const inicio = crearCapaInicioMock(nucleo);
  const clientes = crearCapaClientesMock(nucleo);
  const agenda = crearCapaAgendaMock(nucleo);
  /*
   * ⛔ Estas dos fábricas reciben la configuración UNA VEZ y la guardan en su
   *    cierre. Pero `nucleo.configurar()` y `nucleo.fijarRol()` REEMPLAZAN el
   *    objeto (`configuracion = { ...configuracion, ...cambios }`), así que
   *    una copia directa se queda con el rol viejo — y estas capas filtran
   *    datos por rol: un vendedor vería las liquidaciones de todos.
   *
   *    Por eso se les pasa una vista con `rol` y `forzarVacio` como getters:
   *    leen el valor vigente en cada llamada, no el del momento de crearse.
   */
  const configuracionViva: ConfiguracionMock = {
    get latenciaMs() { return nucleo.configuracion.latenciaMs; },
    get fallaForzada() { return nucleo.configuracion.fallaForzada; },
    get forzarVacio() { return nucleo.configuracion.forzarVacio; },
    get rol() { return nucleo.rol(); },
    get semilla() { return nucleo.configuracion.semilla; },
  };
  const { propuestas, publica } = crearDatosPropuestas(configuracionViva);
  const finanzas = crearCapaFinanzas(configuracionViva);

  /**
   * ⛔ LA GUARDIA. Envuelve todo método de `CapaAdministracion`: con rol
   *    `vendedor` devuelve `sin_permiso` ANTES de mirar ningún dato, igual
   *    que el servidor (API_CONTRACTS §0 A9).
   *
   * ⛔ Consulta `nucleo.exigirAdministrador()` EN CADA LLAMADA, no al
   *    construirse: es la guardia viva, y es la que prueba verificar-nucleo.
   *    La capa de finanzas trae la suya propia; ésta va por delante.
   */
  const soloAdministrador = <A extends unknown[], T>(
    metodo: (...args: A) => Promise<Resultado<T>>,
  ) => async (...args: A): Promise<Resultado<T>> => {
    const permiso = nucleo.exigirAdministrador();
    if (!permiso.ok) return nucleo.responderError<T>(ERROR_SIN_PERMISO);
    return metodo(...args);
  };

  const capa: CapaDatos = {
    // =======================================================================
    // S1 · Sesión y autenticación — implementada
    // =======================================================================
    ingresar: (usuario, clave) => sesion.ingresar(usuario, clave),
    sesionActual: () => sesion.sesionActual(),
    cerrarSesion: () => sesion.cerrarSesion(),
    cambiarClave: (actual, nueva) => sesion.cambiarClave(actual, nueva),
    capacidades: () => sesion.capacidades(),

    // =======================================================================
    // S2 · Inicio — pendiente de ensamblado
    // =======================================================================
    resumenInicio: () => inicio.resumenInicio(),
    proximosSeguimientos: (limite) => inicio.proximosSeguimientos(limite),
    resumenAgenda: () => inicio.resumenAgenda(),

    // =======================================================================
    // S3 · Motor de planificación e investigación — pendiente de ensamblado
    // =======================================================================
    investigarObjetivo: (entrada) => motor.investigarObjetivo(entrada),
    estadoInvestigacion: (id) => motor.estadoInvestigacion(id),
    corregirInvestigacion: (investigacion, correcciones) => motor.corregirInvestigacion(investigacion, correcciones),
    planDesdeInvestigacion: (investigacion) => motor.planDesdeInvestigacion(investigacion),
    buscarActividad: (texto) => motor.buscarActividad(texto),
    resolverActividad: (texto, clave) => motor.resolverActividad(texto, clave),
    listarOperaciones: () => motor.listarOperaciones(),
    listarNecesidades: () => motor.listarNecesidades(),
    generarPlan: (entrada, eje) => motor.generarPlan(entrada, eje),
    recalcularPlan: (plan, ajustes) => motor.recalcularPlan(plan, ajustes),
    guardarPlan: (plan, clave) => motor.guardarPlan(plan, clave),
    obtenerPlan: (id) => motor.obtenerPlan(id),
    listarPlanes: (filtro, pagina) => motor.listarPlanes(filtro, pagina),
    crearPlanDeRubro: (plan, periodoDesde, periodoHasta, metaGuaranies, clave) => motor.crearPlanDeRubro(plan, periodoDesde, periodoHasta, metaGuaranies, clave),
    cerrarPlan: (id, motivo, comentario) => motor.cerrarPlan(id, motivo, comentario),
    objetivosSugeridos: (planId) => motor.objetivosSugeridos(planId),
    aceptarObjetivo: (objetivoId, clave) => motor.aceptarObjetivo(objetivoId, clave),
    listarProductos: (filtro) => motor.listarProductos(filtro),
    obtenerProducto: (id) => motor.obtenerProducto(id),
    preciosDeProducto: (id) => motor.preciosDeProducto(id),
    crearSugerencia: (datos, clave) => motor.crearSugerencia(datos, clave),
    listarMisSugerencias: (pagina) => motor.listarMisSugerencias(pagina),

    // =======================================================================
    // S4 · Clientes, voz y seguimiento — pendiente de ensamblado
    // =======================================================================
    listarClientes: (filtro, pagina) => clientes.listarClientes(filtro, pagina),
    obtenerCliente: (id) => clientes.obtenerCliente(id),
    crearCliente: (datos, clave) => clientes.crearCliente(datos, clave),
    actualizarCliente: (id, cambios, version) => clientes.actualizarCliente(id, cambios, version),
    listarContactos: (clienteId) => clientes.listarContactos(clienteId),
    lineaDeTiempo: (clienteId, pagina) => clientes.lineaDeTiempo(clienteId, pagina),
    soporteDictado: () => clientes.soporteDictado(),
    subirAudio: (archivo, clave) => clientes.subirAudio(archivo, clave),
    procesarCaptura: (entrada) => clientes.procesarCaptura(entrada),
    guardarSeguimiento: (datos, clave) => clientes.guardarSeguimiento(datos, clave),
    listarSeguimientos: (filtro, pagina) => clientes.listarSeguimientos(filtro, pagina),
    borrarAudio: (audioId, motivo) => clientes.borrarAudio(audioId, motivo),
    actualizarPaso: (pasoId, estado) => clientes.actualizarPaso(pasoId, estado),

    // =======================================================================
    // S4 · Agenda operativa — pendiente de ensamblado
    // =======================================================================
    agendaHoy: (fecha) => agenda.agendaHoy(fecha),
    agendaSemana: (desde) => agenda.agendaSemana(desde),
    agendaMes: (anio, mes) => agenda.agendaMes(anio, mes),
    cronogramaComercial: (desde, hasta) => agenda.cronogramaComercial(desde, hasta),
    listarEntradas: (filtro, pagina) => agenda.listarEntradas(filtro, pagina),
    entradasAtrasadas: (pagina) => agenda.entradasAtrasadas(pagina),
    crearEntradaManual: (datos, clave) => agenda.crearEntradaManual(datos, clave),
    ajustarEntrada: (ajuste) => agenda.ajustarEntrada(ajuste),
    completarEntrada: (entradaId, clave) => agenda.completarEntrada(entradaId, clave),
    descartarEntrada: (entradaId, motivo) => agenda.descartarEntrada(entradaId, motivo),

    // =======================================================================
    // =======================================================================
    // Fichas de producto — ensambladas
    //
    // El eslabon entre el motor y la propuesta. La ficha oficial se sirve del
    // copy congelado; la personalizacion es una capa encima que sólo decide
    // presentacion. Ver packages/compartido/src/fichas.ts.
    // =======================================================================
    obtenerFichaOficial: (productoId) => fichas.obtenerFichaOficial(productoId),
    indicePortafolio: () => fichas.indicePortafolio(),
    fichasPorNecesidad: (necesidadId) => fichas.fichasPorNecesidad(necesidadId),
    listarFichasPersonalizadas: (clienteId, pagina) => fichas.listarFichasPersonalizadas(clienteId, pagina),
    obtenerFichaPersonalizada: (id) => fichas.obtenerFichaPersonalizada(id),
    prepararFicha: (datos, clave) => fichas.prepararFicha(datos, clave),
    actualizarFicha: (id, cambios, version) => fichas.actualizarFicha(id, cambios, version),
    descartarFicha: (id, motivo) => fichas.descartarFicha(id, motivo),
    revisarCopyDeFicha: (id) => fichas.revisarCopyDeFicha(id),
    compartirFicha: (id, opciones, clave) => fichas.compartirFicha(id, opciones, clave),
    revocarEnlaceFicha: (enlaceId, motivo) => fichas.revocarEnlaceFicha(enlaceId, motivo),
    aperturasDeFicha: (id, pagina) => fichas.aperturasDeFicha(id, pagina),

    // S5 · Presentaciones y cotizaciones — pendiente de ensamblado
    // =======================================================================
    listarPresentaciones: (filtro, pagina) => propuestas.listarPresentaciones(filtro, pagina),
    crearPresentacion: (datos, clave) => propuestas.crearPresentacion(datos, clave),
    actualizarPresentacion: (id, cambios, version) => propuestas.actualizarPresentacion(id, cambios, version),
    emitirPresentacion: (id, clave) => propuestas.emitirPresentacion(id, clave),
    listarCotizaciones: (filtro, pagina) => propuestas.listarCotizaciones(filtro, pagina),
    obtenerCotizacion: (id) => propuestas.obtenerCotizacion(id),
    crearCotizacion: (datos, clave) => propuestas.crearCotizacion(datos, clave),
    actualizarCotizacion: (id, cambios, version) => propuestas.actualizarCotizacion(id, cambios, version),
    previsualizarCotizacion: (productoId, precios, variante) =>
      propuestas.previsualizarCotizacion(productoId, precios, variante),
    previsualizarTotales: (base) => propuestas.previsualizarTotales(base),
    compararConLista: (productoId, precios) => propuestas.compararConLista(productoId, precios),
    historialVersiones: (id) => propuestas.historialVersiones(id),
    firmarComoVendedor: (cotizacionId, clave) => propuestas.firmarComoVendedor(cotizacionId, clave),
    enviarARevision: (id, comentario, clave) => propuestas.enviarARevision(id, comentario, clave),
    emitirPdfDefinitivo: (cotizacionId, clave) => propuestas.emitirPdfDefinitivo(cotizacionId, clave),
    enviarAlCliente: (cotizacionId, clave) => propuestas.enviarAlCliente(cotizacionId, clave),
    marcarDesenlace: (id, desenlace, motivo) => propuestas.marcarDesenlace(id, desenlace, motivo),
    crearEnlace: (propuestaId, opciones, clave) => propuestas.crearEnlace(propuestaId, opciones, clave),
    revocarEnlace: (enlaceId, motivo) => propuestas.revocarEnlace(enlaceId, motivo),
    aperturasDePropuesta: (propuestaId, pagina) => propuestas.aperturasDePropuesta(propuestaId, pagina),
    constanciaDeCotizacion: (cotizacionId) => propuestas.constanciaDeCotizacion(cotizacionId),

    // =======================================================================
    // S6 · Dinero del vendedor — pendiente de ensamblado
    // =======================================================================
    resumenDinero: (periodo) => finanzas.resumenDinero(periodo),
    listarMensualidades: (filtro, pagina) => finanzas.listarMensualidades(filtro, pagina),
    listarLineasParticipacion: (periodo, pagina) => finanzas.listarLineasParticipacion(periodo, pagina),
    listarLiquidaciones: (pagina) => finanzas.listarLiquidaciones(pagina),
    obtenerLiquidacion: (id) => finanzas.obtenerLiquidacion(id),
    abrirObservacion: (datos, clave) => finanzas.abrirObservacion(datos, clave),

    // =======================================================================
    // S6 · Administración — ⛔ los 42 métodos, con la guardia de rol puesta
    // =======================================================================
    controlFinanciero: soloAdministrador(finanzas.controlFinanciero),
    porCobrar: soloAdministrador(finanzas.porCobrar),
    rankingVendedores: soloAdministrador(finanzas.rankingVendedores),
    listarPresupuestos: soloAdministrador(finanzas.listarPresupuestos),
    definirPresupuesto: soloAdministrador(finanzas.definirPresupuesto),
    listarParticipacionesTodas: soloAdministrador(finanzas.listarParticipacionesTodas),
    verificarCierrePeriodo: soloAdministrador(finanzas.verificarCierrePeriodo),
    cerrarPeriodo: soloAdministrador(finanzas.cerrarPeriodo),
    crearAjuste: soloAdministrador(finanzas.crearAjuste),
    resolverObservacion: soloAdministrador(finanzas.resolverObservacion),
    listarTodosLosClientes: soloAdministrador(finanzas.listarTodosLosClientes),
    lineaDeTiempoDeCualquierCliente: soloAdministrador(finanzas.lineaDeTiempoDeCualquierCliente),
    colaDeRevision: soloAdministrador(finanzas.colaDeRevision),
    revisarCotizacion: soloAdministrador(finanzas.revisarCotizacion),
    recalcularCotizacion: soloAdministrador(finanzas.recalcularCotizacion),
    firmarComoCeo: soloAdministrador(finanzas.firmarComoCeo),
    firmasDeCotizacion: soloAdministrador(finanzas.firmasDeCotizacion),
    anulacionesDeFirma: soloAdministrador(finanzas.anulacionesDeFirma),
    listarConstancias: soloAdministrador(finanzas.listarConstancias),
    reintentarNotificaciones: soloAdministrador(finanzas.reintentarNotificaciones),
    listarParticipaciones: soloAdministrador(finanzas.listarParticipaciones),
    publicarParticipacion: soloAdministrador(finanzas.publicarParticipacion),
    cargarPreciosLista: soloAdministrador(finanzas.cargarPreciosLista),
    publicarProducto: soloAdministrador(finanzas.publicarProducto),
    listarActividadesPendientes: soloAdministrador(finanzas.listarActividadesPendientes),
    confirmarActividad: soloAdministrador(finanzas.confirmarActividad),
    fusionarActividad: soloAdministrador(finanzas.fusionarActividad),
    editarTaxonomia: soloAdministrador(finanzas.editarTaxonomia),
    crearVendedor: soloAdministrador(finanzas.crearVendedor),
    cambiarRol: soloAdministrador(finanzas.cambiarRol),
    desactivarVendedor: soloAdministrador(finanzas.desactivarVendedor),
    reasignarCartera: soloAdministrador(finanzas.reasignarCartera),
    obtenerParametros: soloAdministrador(finanzas.obtenerParametros),
    actualizarParametros: soloAdministrador(finanzas.actualizarParametros),
    estadoProveedores: soloAdministrador(finanzas.estadoProveedores),
    usoPorVendedor: soloAdministrador(finanzas.usoPorVendedor),
    listarAperturasEnlace: soloAdministrador(finanzas.listarAperturasEnlace),
    listarSugerencias: soloAdministrador(finanzas.listarSugerencias),
    resolverSugerencia: soloAdministrador(finanzas.resolverSugerencia),
    agregadoSugerencias: soloAdministrador(finanzas.agregadoSugerencias),

    /**
     * ⛔ Append-only y sólo administrador. Los registros de acceso salen de
     *    datos-sesion.ts (S1): el ingreso y el intento fallido ya quedan
     *    anotados desde el primer día.
     */
    listarRegistroAcceso: async (
      filtro: FiltroRegistroAcceso,
      pagina?: OpcionesPagina,
    ): Promise<Resultado<Pagina<RegistroAcceso>>> => {
      const permiso = nucleo.exigirAdministrador();
      if (!permiso.ok) return nucleo.responderError<Pagina<RegistroAcceso>>(ERROR_SIN_PERMISO);
      return nucleo.responder(sesion.registros(filtro, pagina?.cursor, pagina?.limite));
    },

    listarVendedores: async (
      filtro: FiltroUsuarios,
      pagina?: OpcionesPagina,
    ): Promise<Resultado<Pagina<Usuario>>> => {
      const permiso = nucleo.exigirAdministrador();
      if (!permiso.ok) return nucleo.responderError<Pagina<Usuario>>(ERROR_SIN_PERMISO);
      return nucleo.responder(nucleo.paginar(sesion.usuarios(filtro), pagina?.cursor, pagina?.limite));
    },
  };

  return { ...capa, mock: nucleo, sesion, publica };
}

/** Rol con el que responde el mock en este momento. Para pruebas y para QA §1.6. */
export function rolDelMock(capa: CapaDatosMock): Rol {
  return capa.mock.rol();
}
