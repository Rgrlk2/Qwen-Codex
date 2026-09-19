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
  CapaDatos, FiltroRegistroAcceso, FiltroUsuarios, OpcionesPagina, Pagina,
  RegistroAcceso, Resultado, Rol, Usuario,
} from '@labia/compartido';

import {
  crearNucleoMock, errorPendiente, ERROR_SIN_PERMISO,
  type ConfiguracionMock, type NucleoMock,
} from './nucleo';
import { crearCapaSesionMock, type CapaSesionMock } from './datos-sesion';
import { crearCapaFichasMock } from './capa-fichas';

export * from './nucleo';
export * from './datos-sesion';
export * from './datos-fichas';

/**
 * Una respuesta pendiente respeta la latencia del mock y devuelve un error
 * tipado. `Resultado<never>` encaja en cualquier `Resultado<T>`: el compilador
 * comprueba que ningún método del contrato quede sin implementar.
 */
type Pendiente = () => Promise<Resultado<never>>;

export interface OpcionesCapaDatosMock {
  readonly configuracion?: Partial<ConfiguracionMock>;
}

export interface CapaDatosMock extends CapaDatos {
  /** Palancas del mock: latencia, falla forzada, modo vacío y rol. */
  readonly mock: NucleoMock;
  readonly sesion: CapaSesionMock;
}

export function crearCapaDatosMock(opciones: OpcionesCapaDatosMock = {}): CapaDatosMock {
  const nucleo = crearNucleoMock(opciones.configuracion ?? {});
  const sesion = crearCapaSesionMock(nucleo);
  const fichas = crearCapaFichasMock(nucleo);

  /** Método todavía no ensamblado: error explícito, con su sesión dueña. */
  const pendiente = (duena: string, metodo: string): Pendiente =>
    () => nucleo.responderError<never>(errorPendiente(duena, metodo));

  /**
   * ⛔ LA GUARDIA. Todo método de `CapaAdministracion` se envuelve acá:
   *    con rol `vendedor` devuelve `sin_permiso` ANTES de mirar ningún dato,
   *    exactamente como el servidor (API_CONTRACTS §0 A9).
   */
  const soloAdministrador = (metodo: string): Pendiente => async () => {
    const permiso = nucleo.exigirAdministrador();
    if (!permiso.ok) return nucleo.responderError<never>(ERROR_SIN_PERMISO);
    return nucleo.responderError<never>(errorPendiente('la Sesión 6', metodo));
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
    resumenInicio: pendiente('la Sesión 2', 'resumenInicio'),
    proximosSeguimientos: pendiente('la Sesión 2', 'proximosSeguimientos'),
    resumenAgenda: pendiente('la Sesión 2', 'resumenAgenda'),

    // =======================================================================
    // S3 · Motor de planificación e investigación — pendiente de ensamblado
    // =======================================================================
    investigarObjetivo: pendiente('la Sesión 3', 'investigarObjetivo'),
    estadoInvestigacion: pendiente('la Sesión 3', 'estadoInvestigacion'),
    corregirInvestigacion: pendiente('la Sesión 3', 'corregirInvestigacion'),
    planDesdeInvestigacion: pendiente('la Sesión 3', 'planDesdeInvestigacion'),
    buscarActividad: pendiente('la Sesión 3', 'buscarActividad'),
    resolverActividad: pendiente('la Sesión 3', 'resolverActividad'),
    listarOperaciones: pendiente('la Sesión 3', 'listarOperaciones'),
    listarNecesidades: pendiente('la Sesión 3', 'listarNecesidades'),
    generarPlan: pendiente('la Sesión 3', 'generarPlan'),
    recalcularPlan: pendiente('la Sesión 3', 'recalcularPlan'),
    guardarPlan: pendiente('la Sesión 3', 'guardarPlan'),
    obtenerPlan: pendiente('la Sesión 3', 'obtenerPlan'),
    listarPlanes: pendiente('la Sesión 3', 'listarPlanes'),
    crearPlanDeRubro: pendiente('la Sesión 3', 'crearPlanDeRubro'),
    cerrarPlan: pendiente('la Sesión 3', 'cerrarPlan'),
    objetivosSugeridos: pendiente('la Sesión 3', 'objetivosSugeridos'),
    aceptarObjetivo: pendiente('la Sesión 3', 'aceptarObjetivo'),
    listarProductos: pendiente('la Sesión 3', 'listarProductos'),
    obtenerProducto: pendiente('la Sesión 3', 'obtenerProducto'),
    preciosDeProducto: pendiente('la Sesión 3', 'preciosDeProducto'),
    crearSugerencia: pendiente('la Sesión 3', 'crearSugerencia'),
    listarMisSugerencias: pendiente('la Sesión 3', 'listarMisSugerencias'),

    // =======================================================================
    // S4 · Clientes, voz y seguimiento — pendiente de ensamblado
    // =======================================================================
    listarClientes: pendiente('la Sesión 4', 'listarClientes'),
    obtenerCliente: pendiente('la Sesión 4', 'obtenerCliente'),
    crearCliente: pendiente('la Sesión 4', 'crearCliente'),
    actualizarCliente: pendiente('la Sesión 4', 'actualizarCliente'),
    listarContactos: pendiente('la Sesión 4', 'listarContactos'),
    lineaDeTiempo: pendiente('la Sesión 4', 'lineaDeTiempo'),
    soporteDictado: pendiente('la Sesión 4', 'soporteDictado'),
    subirAudio: pendiente('la Sesión 4', 'subirAudio'),
    procesarCaptura: pendiente('la Sesión 4', 'procesarCaptura'),
    guardarSeguimiento: pendiente('la Sesión 4', 'guardarSeguimiento'),
    listarSeguimientos: pendiente('la Sesión 4', 'listarSeguimientos'),
    borrarAudio: pendiente('la Sesión 4', 'borrarAudio'),
    actualizarPaso: pendiente('la Sesión 4', 'actualizarPaso'),

    // =======================================================================
    // S4 · Agenda operativa — pendiente de ensamblado
    // =======================================================================
    agendaHoy: pendiente('la Sesión 4', 'agendaHoy'),
    agendaSemana: pendiente('la Sesión 4', 'agendaSemana'),
    agendaMes: pendiente('la Sesión 4', 'agendaMes'),
    cronogramaComercial: pendiente('la Sesión 4', 'cronogramaComercial'),
    listarEntradas: pendiente('la Sesión 4', 'listarEntradas'),
    entradasAtrasadas: pendiente('la Sesión 4', 'entradasAtrasadas'),
    crearEntradaManual: pendiente('la Sesión 4', 'crearEntradaManual'),
    ajustarEntrada: pendiente('la Sesión 4', 'ajustarEntrada'),
    completarEntrada: pendiente('la Sesión 4', 'completarEntrada'),
    descartarEntrada: pendiente('la Sesión 4', 'descartarEntrada'),

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
    listarPresentaciones: pendiente('la Sesión 5', 'listarPresentaciones'),
    crearPresentacion: pendiente('la Sesión 5', 'crearPresentacion'),
    actualizarPresentacion: pendiente('la Sesión 5', 'actualizarPresentacion'),
    emitirPresentacion: pendiente('la Sesión 5', 'emitirPresentacion'),
    listarCotizaciones: pendiente('la Sesión 5', 'listarCotizaciones'),
    obtenerCotizacion: pendiente('la Sesión 5', 'obtenerCotizacion'),
    crearCotizacion: pendiente('la Sesión 5', 'crearCotizacion'),
    actualizarCotizacion: pendiente('la Sesión 5', 'actualizarCotizacion'),
    previsualizarCotizacion: pendiente('la Sesión 5', 'previsualizarCotizacion'),
    previsualizarTotales: pendiente('la Sesión 5', 'previsualizarTotales'),
    compararConLista: pendiente('la Sesión 5', 'compararConLista'),
    historialVersiones: pendiente('la Sesión 5', 'historialVersiones'),
    firmarComoVendedor: pendiente('la Sesión 5', 'firmarComoVendedor'),
    enviarARevision: pendiente('la Sesión 5', 'enviarARevision'),
    emitirPdfDefinitivo: pendiente('la Sesión 5', 'emitirPdfDefinitivo'),
    enviarAlCliente: pendiente('la Sesión 5', 'enviarAlCliente'),
    marcarDesenlace: pendiente('la Sesión 5', 'marcarDesenlace'),
    crearEnlace: pendiente('la Sesión 5', 'crearEnlace'),
    revocarEnlace: pendiente('la Sesión 5', 'revocarEnlace'),
    aperturasDePropuesta: pendiente('la Sesión 5', 'aperturasDePropuesta'),
    constanciaDeCotizacion: pendiente('la Sesión 5', 'constanciaDeCotizacion'),

    // =======================================================================
    // S6 · Dinero del vendedor — pendiente de ensamblado
    // =======================================================================
    resumenDinero: pendiente('la Sesión 6', 'resumenDinero'),
    listarMensualidades: pendiente('la Sesión 6', 'listarMensualidades'),
    listarLineasParticipacion: pendiente('la Sesión 6', 'listarLineasParticipacion'),
    listarLiquidaciones: pendiente('la Sesión 6', 'listarLiquidaciones'),
    obtenerLiquidacion: pendiente('la Sesión 6', 'obtenerLiquidacion'),
    abrirObservacion: pendiente('la Sesión 6', 'abrirObservacion'),

    // =======================================================================
    // S6 · Administración — ⛔ los 42 métodos, con la guardia de rol puesta
    // =======================================================================
    controlFinanciero: soloAdministrador('controlFinanciero'),
    porCobrar: soloAdministrador('porCobrar'),
    rankingVendedores: soloAdministrador('rankingVendedores'),
    listarPresupuestos: soloAdministrador('listarPresupuestos'),
    definirPresupuesto: soloAdministrador('definirPresupuesto'),
    listarParticipacionesTodas: soloAdministrador('listarParticipacionesTodas'),
    verificarCierrePeriodo: soloAdministrador('verificarCierrePeriodo'),
    cerrarPeriodo: soloAdministrador('cerrarPeriodo'),
    crearAjuste: soloAdministrador('crearAjuste'),
    resolverObservacion: soloAdministrador('resolverObservacion'),
    listarTodosLosClientes: soloAdministrador('listarTodosLosClientes'),
    lineaDeTiempoDeCualquierCliente: soloAdministrador('lineaDeTiempoDeCualquierCliente'),
    colaDeRevision: soloAdministrador('colaDeRevision'),
    revisarCotizacion: soloAdministrador('revisarCotizacion'),
    recalcularCotizacion: soloAdministrador('recalcularCotizacion'),
    firmarComoCeo: soloAdministrador('firmarComoCeo'),
    firmasDeCotizacion: soloAdministrador('firmasDeCotizacion'),
    anulacionesDeFirma: soloAdministrador('anulacionesDeFirma'),
    listarConstancias: soloAdministrador('listarConstancias'),
    reintentarNotificaciones: soloAdministrador('reintentarNotificaciones'),
    listarParticipaciones: soloAdministrador('listarParticipaciones'),
    publicarParticipacion: soloAdministrador('publicarParticipacion'),
    cargarPreciosLista: soloAdministrador('cargarPreciosLista'),
    publicarProducto: soloAdministrador('publicarProducto'),
    listarActividadesPendientes: soloAdministrador('listarActividadesPendientes'),
    confirmarActividad: soloAdministrador('confirmarActividad'),
    fusionarActividad: soloAdministrador('fusionarActividad'),
    editarTaxonomia: soloAdministrador('editarTaxonomia'),
    crearVendedor: soloAdministrador('crearVendedor'),
    cambiarRol: soloAdministrador('cambiarRol'),
    desactivarVendedor: soloAdministrador('desactivarVendedor'),
    reasignarCartera: soloAdministrador('reasignarCartera'),
    obtenerParametros: soloAdministrador('obtenerParametros'),
    actualizarParametros: soloAdministrador('actualizarParametros'),
    estadoProveedores: soloAdministrador('estadoProveedores'),
    usoPorVendedor: soloAdministrador('usoPorVendedor'),
    listarAperturasEnlace: soloAdministrador('listarAperturasEnlace'),
    listarSugerencias: soloAdministrador('listarSugerencias'),
    resolverSugerencia: soloAdministrador('resolverSugerencia'),
    agregadoSugerencias: soloAdministrador('agregadoSugerencias'),

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

  return { ...capa, mock: nucleo, sesion };
}

/** Rol con el que responde el mock en este momento. Para pruebas y para QA §1.6. */
export function rolDelMock(capa: CapaDatosMock): Rol {
  return capa.mock.rol();
}
