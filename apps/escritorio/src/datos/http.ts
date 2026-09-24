/**
 * Implementación HTTP de CapaDatos.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * Única responsabilidad: traducir HTTP ⇄ Resultado<T> según la tabla de
 * docs/API_CONTRACTS.md §1.
 *
 * ⛔ Ningún `mensajeAmable` puede contener un código HTTP, un nombre de tabla
 *    ni una traza. El usuario lee castellano, no errores de servidor.
 *
 * FORMA DEL TRANSPORTE
 * ────────────────────
 * El contrato fija la ENVOLTURA y la tabla de estados, no la forma de las URL.
 * Acá se usa una llamada por método: `POST {base}/{grupo}/{metodo}` con los
 * argumentos con nombre en el cuerpo JSON. La sesión viaja en cookie del
 * servidor (`credentials: 'include'`).
 *
 * ⛔ NINGUNA CREDENCIAL DE PROVEEDOR EXTERNO VIVE ACÁ. La investigación
 *    automática y el modelo de lenguaje corren en el servidor, detrás de
 *    proveedores intercambiables: el navegador sólo llama a
 *    `/motor/investigarObjetivo` (MASTER_SPEC §3.5, API_CONTRACTS §0 A11).
 */

import type {
  CapaDatos, CodigoError, ErrorApi, Resultado,
} from '@labia/compartido';

// ---------------------------------------------------------------------------
// Traducción de estados HTTP — API_CONTRACTS §1
// ---------------------------------------------------------------------------

/**
 * ⛔ Tabla literal de API_CONTRACTS §1. Cuando un estado admite más de un
 *    código, el servidor lo precisa en el cuerpo; acá queda el más probable.
 */
const POR_ESTADO: ReadonlyArray<readonly [number, CodigoError]> = [
  [400, 'validacion'],
  [401, 'no_autenticado'],
  [403, 'sin_permiso'],
  [404, 'no_encontrado'],
  [409, 'conflicto_version'],
  [410, 'enlace_vencido'],
  [422, 'regla_comercial'],
  [429, 'limite_excedido'],
];

/** Los códigos que el servidor puede precisar dentro de cada estado. */
const PRECISABLES: Readonly<Record<number, ReadonlyArray<CodigoError>>> = {
  400: ['validacion', 'monedas_mezcladas'],
  401: ['no_autenticado', 'credenciales_invalidas'],
  410: ['enlace_vencido', 'enlace_revocado', 'tope_aperturas'],
  422: ['regla_comercial', 'requiere_aprobacion', 'requiere_firma'],
};

export function codigoDesdeEstado(estado: number): CodigoError {
  const fila = POR_ESTADO.find(([e]) => e === estado);
  if (fila) return fila[1];
  if (estado >= 500) return 'servicio_no_disponible';
  return 'desconocido';
}

/** Mensajes en es-PY. ⛔ Ninguno nombra un estado, una tabla ni una traza. */
const MENSAJES: Readonly<Record<CodigoError, { readonly mensaje: string; readonly pista: string }>> = {
  credenciales_invalidas: {
    mensaje: 'Usuario o contraseña incorrectos.',
    pista: 'Revisá los datos e intentá otra vez.',
  },
  no_autenticado: { mensaje: 'Tu sesión terminó.', pista: 'Ingresá de nuevo para seguir.' },
  sin_permiso: {
    mensaje: 'Esta sección no corresponde a tu rol.',
    pista: 'Administración es sólo para el rol administrador.',
  },
  no_encontrado: { mensaje: 'No encontramos lo que buscabas.', pista: 'Puede que se haya movido o dado de baja.' },
  validacion: { mensaje: 'Faltan datos o hay algo mal escrito.', pista: 'Revisá los campos marcados.' },
  conflicto_version: {
    mensaje: 'Alguien más modificó esto mientras lo editabas.',
    pista: 'Volvé a cargarlo para no pisar el cambio del otro.',
  },
  regla_comercial: { mensaje: 'Esta operación no cumple una regla comercial.', pista: 'Revisá las condiciones antes de seguir.' },
  requiere_aprobacion: {
    mensaje: 'La cotización todavía no está aprobada.',
    pista: 'Enviala a revisión y esperá la aprobación.',
  },
  requiere_firma: { mensaje: 'Falta una firma vigente.', pista: 'Firmá la cotización antes de continuar.' },
  monedas_mezcladas: {
    mensaje: 'No se pueden sumar guaraníes con dólares.',
    pista: 'Usá una sola moneda por cotización.',
  },
  limite_excedido: { mensaje: 'Hiciste demasiadas peticiones seguidas.', pista: 'Esperá un momento y volvé a intentar.' },
  enlace_vencido: { mensaje: 'Este enlace venció.', pista: 'Pedí uno nuevo a tu vendedor.' },
  enlace_revocado: { mensaje: 'Este enlace ya no está disponible.', pista: 'Pedí uno nuevo a tu vendedor.' },
  tope_aperturas: { mensaje: 'Este enlace llegó a su tope de aperturas.', pista: 'Pedí uno nuevo a tu vendedor.' },
  servicio_no_disponible: {
    mensaje: 'No pudimos conectarnos en este momento.',
    pista: 'Probá de nuevo en unos segundos.',
  },
  tiempo_agotado: { mensaje: 'La respuesta está tardando demasiado.', pista: 'Probá otra vez.' },
  desconocido: { mensaje: 'Algo no salió como esperábamos.', pista: 'Probá de nuevo; si sigue, avisá a Administración.' },
};

/**
 * Detecta jerga que ⛔ nunca puede llegar a la pantalla: estados HTTP, trazas,
 * SQL y nombres de tabla. Si el servidor manda algo así, se descarta y se usa
 * el mensaje de la tabla de acá (QA_CHECKLIST §7.5.3).
 */
const JERGA = /\b(\d{3}\s*(error|status)|status\s*\d{3}|error\s*\d{3}|http|https?:\/\/|stack|traceback|at\s+\w+\.\w+|select\s|insert\s+into|update\s+\w+\s+set|from\s+\w+\s+where|undefined|null|exception|econn\w+|null pointer)\b/i;

export function mensajeSeguro(codigo: CodigoError, propuesto: unknown): { readonly mensaje: string; readonly pista: string } {
  const base = MENSAJES[codigo];
  if (typeof propuesto !== 'string') return base;
  const limpio = propuesto.trim();
  if (limpio.length === 0 || limpio.length > 200) return base;
  if (JERGA.test(limpio)) return base;
  return { mensaje: limpio, pista: base.pista };
}

function errorDe(codigo: CodigoError, cuerpo?: unknown): ErrorApi {
  const desdeServidor =
    typeof cuerpo === 'object' && cuerpo !== null
      ? (cuerpo as { readonly error?: { readonly mensajeAmable?: unknown; readonly campo?: unknown } }).error
      : undefined;
  const { mensaje, pista } = mensajeSeguro(codigo, desdeServidor?.mensajeAmable);
  const campo = typeof desdeServidor?.campo === 'string' ? desdeServidor.campo : undefined;
  return campo === undefined
    ? { codigo, mensajeAmable: mensaje, pista }
    : { codigo, mensajeAmable: mensaje, pista, campo };
}

/** Precisa el código dentro de un estado ambiguo, si el servidor lo mandó. */
function precisar(estado: number, cuerpo: unknown): CodigoError {
  const admitidos = PRECISABLES[estado];
  const base = codigoDesdeEstado(estado);
  if (!admitidos) return base;
  if (typeof cuerpo !== 'object' || cuerpo === null) return base;
  const propuesto = (cuerpo as { readonly error?: { readonly codigo?: unknown } }).error?.codigo;
  if (typeof propuesto !== 'string') return base;
  const encontrado = admitidos.find((c) => c === propuesto);
  return encontrado ?? base;
}

// ---------------------------------------------------------------------------
// Transporte
// ---------------------------------------------------------------------------

export interface OpcionesHttp {
  /** Raíz de la API. Ej.: `/api`. */
  readonly base: string;
  /** Tiempo máximo por llamada, en milisegundos. */
  readonly tiempoMaximoMs?: number;
  /** Operaciones largas (investigación, PDF definitivo). */
  readonly tiempoMaximoLargoMs?: number;
  /** Inyectable para las pruebas. */
  readonly buscar?: typeof fetch;
}

const TIEMPO_POR_DEFECTO_MS = 15_000;
/** `investigarObjetivo` admite p95 < 20 s; `emitirPdfDefinitivo`, < 10 s (§5). */
const TIEMPO_LARGO_POR_DEFECTO_MS = 30_000;

/** Métodos que corren en el servidor y pueden tardar: llevan el plazo largo. */
const LARGOS: ReadonlySet<string> = new Set([
  'investigarObjetivo', 'estadoInvestigacion', 'planDesdeInvestigacion',
  'generarPlan', 'recalcularPlan', 'procesarCaptura', 'subirAudio',
  'emitirPdfDefinitivo', 'emitirPresentacion', 'cronogramaComercial',
]);

export function crearCapaDatosHttp(opciones: OpcionesHttp): CapaDatos {
  const base = opciones.base.replace(/\/+$/, '');
  const buscar = opciones.buscar ?? ((entrada: RequestInfo | URL, inicio?: RequestInit) => fetch(entrada, inicio));
  const plazo = opciones.tiempoMaximoMs ?? TIEMPO_POR_DEFECTO_MS;
  const plazoLargo = opciones.tiempoMaximoLargoMs ?? TIEMPO_LARGO_POR_DEFECTO_MS;

  function limite(metodo: string): AbortSignal | undefined {
    const ms = LARGOS.has(metodo) ? plazoLargo : plazo;
    return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
  }

  /** Una llamada. Todo lo que puede salir mal termina en un `ErrorApi`. */
  async function llamar<T>(grupo: string, metodo: string, cuerpo: unknown): Promise<Resultado<T>> {
    const senal = limite(metodo);
    const esFormulario = cuerpo instanceof FormData;
    const inicio: RequestInit = {
      method: 'POST',
      credentials: 'include',
      headers: esFormulario ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: esFormulario ? cuerpo : JSON.stringify(cuerpo ?? {}),
      ...(senal ? { signal: senal } : {}),
    };

    let respuesta: Response;
    try {
      respuesta = await buscar(`${base}/${grupo}/${metodo}`, inicio);
    } catch (fallo: unknown) {
      const abortada = fallo instanceof Error && (fallo.name === 'TimeoutError' || fallo.name === 'AbortError');
      return { ok: false, error: errorDe(abortada ? 'tiempo_agotado' : 'servicio_no_disponible') };
    }

    let leido: unknown = null;
    try {
      const texto = await respuesta.text();
      leido = texto.length > 0 ? JSON.parse(texto) : null;
    } catch {
      leido = null;
    }

    if (!respuesta.ok) {
      return { ok: false, error: errorDe(precisar(respuesta.status, leido), leido) };
    }

    /**
     * El servidor ya responde la envoltura. Si no la respeta, se trata como un
     * fallo de servicio: ⛔ nunca se entrega un `datos` que nadie validó.
     */
    if (typeof leido === 'object' && leido !== null && 'ok' in leido) {
      const envoltura = leido as { readonly ok: unknown; readonly datos?: unknown; readonly error?: { readonly codigo?: unknown } };
      if (envoltura.ok === true) return { ok: true, datos: envoltura.datos as T };
      const codigo = typeof envoltura.error?.codigo === 'string'
        ? (envoltura.error.codigo as CodigoError)
        : 'desconocido';
      const conocido = codigo in MENSAJES ? codigo : 'desconocido';
      return { ok: false, error: errorDe(conocido, leido) };
    }
    return { ok: false, error: errorDe('desconocido') };
  }

  const sesion = <T,>(m: string, c?: unknown) => llamar<T>('sesion', m, c);
  const inicio = <T,>(m: string, c?: unknown) => llamar<T>('inicio', m, c);
  const motor = <T,>(m: string, c?: unknown) => llamar<T>('motor', m, c);
  const clientes = <T,>(m: string, c?: unknown) => llamar<T>('clientes', m, c);
  const agenda = <T,>(m: string, c?: unknown) => llamar<T>('agenda', m, c);
  const propuestas = <T,>(m: string, c?: unknown) => llamar<T>('propuestas', m, c);
  const fichas = <T,>(m: string, c?: unknown) => llamar<T>('fichas', m, c);
  const dinero = <T,>(m: string, c?: unknown) => llamar<T>('dinero', m, c);
  /**
   * ⛔ No hay nada acá que "oculte" administración: el servidor devuelve 403
   *    ⇒ `sin_permiso` aunque la interfaz jamás haya dibujado el enlace.
   */
  const admin = <T,>(m: string, c?: unknown) => llamar<T>('administracion', m, c);

  const capa: CapaDatos = {
    // --- S1 · Sesión --------------------------------------------------------
    ingresar: (usuario, clave) => sesion('ingresar', { usuario, clave }),
    sesionActual: () => sesion('sesionActual'),
    cerrarSesion: () => sesion('cerrarSesion'),
    cambiarClave: (actual, nueva) => sesion('cambiarClave', { actual, nueva }),
    capacidades: () => sesion('capacidades'),

    // --- S2 · Inicio --------------------------------------------------------
    resumenInicio: () => inicio('resumenInicio'),
    proximosSeguimientos: (limiteLista) => inicio('proximosSeguimientos', { limite: limiteLista }),
    resumenAgenda: () => inicio('resumenAgenda'),

    // --- S3 · Motor e investigación ----------------------------------------
    investigarObjetivo: (entrada) => motor('investigarObjetivo', { entrada }),
    estadoInvestigacion: (id) => motor('estadoInvestigacion', { id }),
    corregirInvestigacion: (investigacion, correcciones) => motor('corregirInvestigacion', { investigacion, correcciones }),
    planDesdeInvestigacion: (investigacion) => motor('planDesdeInvestigacion', { investigacion }),
    buscarActividad: (texto) => motor('buscarActividad', { texto }),
    resolverActividad: (texto, clave) => motor('resolverActividad', { texto, clave }),
    listarOperaciones: () => motor('listarOperaciones'),
    listarNecesidades: () => motor('listarNecesidades'),
    generarPlan: (entrada, eje) => motor('generarPlan', { entrada, eje }),
    recalcularPlan: (plan, ajustes) => motor('recalcularPlan', { plan, ajustes }),
    guardarPlan: (plan, clave) => motor('guardarPlan', { plan, clave }),
    obtenerPlan: (id) => motor('obtenerPlan', { id }),
    listarPlanes: (filtro, pagina) => motor('listarPlanes', { filtro, pagina }),
    crearPlanDeRubro: (plan, desde, hasta, meta, clave) => motor('crearPlanDeRubro', { plan, periodoDesde: desde, periodoHasta: hasta, metaGuaranies: meta, clave }),
    cerrarPlan: (id, motivo, comentario) => motor('cerrarPlan', { id, motivo, comentario }),
    objetivosSugeridos: (planId) => motor('objetivosSugeridos', { planId }),
    aceptarObjetivo: (objetivoId, clave) => motor('aceptarObjetivo', { objetivoId, clave }),
    listarProductos: (filtro) => motor('listarProductos', { filtro }),
    obtenerProducto: (id) => motor('obtenerProducto', { id }),
    preciosDeProducto: (id) => motor('preciosDeProducto', { id }),
    crearSugerencia: (datos, clave) => motor('crearSugerencia', { datos, clave }),
    listarMisSugerencias: (pagina) => motor('listarMisSugerencias', { pagina }),

    // --- S4 · Clientes, voz y seguimiento ----------------------------------
    listarClientes: (filtro, pagina) => clientes('listarClientes', { filtro, pagina }),
    obtenerCliente: (id) => clientes('obtenerCliente', { id }),
    crearCliente: (datos, clave) => clientes('crearCliente', { datos, clave }),
    actualizarCliente: (id, cambios, version) => clientes('actualizarCliente', { id, cambios, version }),
    listarContactos: (clienteId) => clientes('listarContactos', { clienteId }),
    lineaDeTiempo: (clienteId, pagina) => clientes('lineaDeTiempo', { clienteId, pagina }),
    soporteDictado: () => clientes('soporteDictado'),
    subirAudio: (archivo, clave) => {
      const formulario = new FormData();
      formulario.append('archivo', archivo);
      formulario.append('clave', clave);
      return clientes('subirAudio', formulario);
    },
    procesarCaptura: (entrada) => clientes('procesarCaptura', { entrada }),
    guardarSeguimiento: (datos, clave) => clientes('guardarSeguimiento', { datos, clave }),
    listarSeguimientos: (filtro, pagina) => clientes('listarSeguimientos', { filtro, pagina }),
    borrarAudio: (audioId, motivo) => clientes('borrarAudio', { audioId, motivo }),
    actualizarPaso: (pasoId, estado) => clientes('actualizarPaso', { pasoId, estado }),

    // --- S4 · Agenda --------------------------------------------------------
    agendaHoy: (fecha) => agenda('agendaHoy', { fecha }),
    agendaSemana: (desde) => agenda('agendaSemana', { desde }),
    agendaMes: (anio, mes) => agenda('agendaMes', { anio, mes }),
    cronogramaComercial: (desde, hasta) => agenda('cronogramaComercial', { desde, hasta }),
    listarEntradas: (filtro, pagina) => agenda('listarEntradas', { filtro, pagina }),
    entradasAtrasadas: (pagina) => agenda('entradasAtrasadas', { pagina }),
    crearEntradaManual: (datos, clave) => agenda('crearEntradaManual', { datos, clave }),
    ajustarEntrada: (ajuste) => agenda('ajustarEntrada', { ajuste }),
    completarEntrada: (entradaId, clave) => agenda('completarEntrada', { entradaId, clave }),
    descartarEntrada: (entradaId, motivo) => agenda('descartarEntrada', { entradaId, motivo }),

    // --- Fichas de producto --------------------------------------------------
    obtenerFichaOficial: (productoId) => fichas('obtenerFichaOficial', { productoId }),
    indicePortafolio: () => fichas('indicePortafolio'),
    fichasPorNecesidad: (necesidadId) => fichas('fichasPorNecesidad', { necesidadId }),
    fichaInternaDeProducto: (productoId) => fichas('fichaInternaDeProducto', { productoId }),
    listarFichasPersonalizadas: (clienteId, pagina) => fichas('listarFichasPersonalizadas', { clienteId, pagina }),
    obtenerFichaPersonalizada: (id) => fichas('obtenerFichaPersonalizada', { id }),
    prepararFicha: (datos, clave) => fichas('prepararFicha', { datos, clave }),
    actualizarFicha: (id, cambios, version) => fichas('actualizarFicha', { id, cambios, version }),
    descartarFicha: (id, motivo) => fichas('descartarFicha', { id, motivo }),
    revisarCopyDeFicha: (id) => fichas('revisarCopyDeFicha', { id }),
    compartirFicha: (id, opciones, clave) => fichas('compartirFicha', { id, opciones, clave }),
    revocarEnlaceFicha: (enlaceId, motivo) => fichas('revocarEnlaceFicha', { enlaceId, motivo }),
    aperturasDeFicha: (id, pagina) => fichas('aperturasDeFicha', { id, pagina }),

    // --- S5 · Presentaciones y cotizaciones --------------------------------
    listarPresentaciones: (filtro, pagina) => propuestas('listarPresentaciones', { filtro, pagina }),
    crearPresentacion: (datos, clave) => propuestas('crearPresentacion', { datos, clave }),
    actualizarPresentacion: (id, cambios, version) => propuestas('actualizarPresentacion', { id, cambios, version }),
    emitirPresentacion: (id, clave) => propuestas('emitirPresentacion', { id, clave }),
    listarCotizaciones: (filtro, pagina) => propuestas('listarCotizaciones', { filtro, pagina }),
    obtenerCotizacion: (id) => propuestas('obtenerCotizacion', { id }),
    crearCotizacion: (datos, clave) => propuestas('crearCotizacion', { datos, clave }),
    actualizarCotizacion: (id, cambios, version) => propuestas('actualizarCotizacion', { id, cambios, version }),
    previsualizarCotizacion: (productoId, precios, variante) => propuestas('previsualizarCotizacion', { productoId, precios, variante }),
    previsualizarTotales: (baseCalculo) => propuestas('previsualizarTotales', { base: baseCalculo }),
    compararConLista: (productoId, precios) => propuestas('compararConLista', { productoId, precios }),
    historialVersiones: (id) => propuestas('historialVersiones', { id }),
    firmarComoVendedor: (cotizacionId, clave) => propuestas('firmarComoVendedor', { cotizacionId, clave }),
    enviarARevision: (id, comentario, clave) => propuestas('enviarARevision', { id, comentario, clave }),
    emitirPdfDefinitivo: (cotizacionId, clave) => propuestas('emitirPdfDefinitivo', { cotizacionId, clave }),
    enviarAlCliente: (cotizacionId, clave) => propuestas('enviarAlCliente', { cotizacionId, clave }),
    marcarDesenlace: (id, desenlace, motivo) => propuestas('marcarDesenlace', { id, desenlace, motivo }),
    crearEnlace: (propuestaId, opcionesEnlace, clave) => propuestas('crearEnlace', { propuestaId, opciones: opcionesEnlace, clave }),
    revocarEnlace: (enlaceId, motivo) => propuestas('revocarEnlace', { enlaceId, motivo }),
    aperturasDePropuesta: (propuestaId, pagina) => propuestas('aperturasDePropuesta', { propuestaId, pagina }),
    constanciaDeCotizacion: (cotizacionId) => propuestas('constanciaDeCotizacion', { cotizacionId }),

    // --- S6 · Dinero del vendedor ------------------------------------------
    resumenDinero: (periodo) => dinero('resumenDinero', { periodo }),
    listarMensualidades: (filtro, pagina) => dinero('listarMensualidades', { filtro, pagina }),
    listarLineasParticipacion: (periodo, pagina) => dinero('listarLineasParticipacion', { periodo, pagina }),
    listarLiquidaciones: (pagina) => dinero('listarLiquidaciones', { pagina }),
    obtenerLiquidacion: (id) => dinero('obtenerLiquidacion', { id }),
    abrirObservacion: (datos, clave) => dinero('abrirObservacion', { datos, clave }),

    // --- S6 · Administración — el servidor devuelve 403 al vendedor --------
    controlFinanciero: (periodo) => admin('controlFinanciero', { periodo }),
    porCobrar: (vendedorId, pagina) => admin('porCobrar', { vendedorId, pagina }),
    rankingVendedores: (periodo) => admin('rankingVendedores', { periodo }),
    listarPresupuestos: (periodo) => admin('listarPresupuestos', { periodo }),
    definirPresupuesto: (datos, clave) => admin('definirPresupuesto', { datos, clave }),
    listarParticipacionesTodas: (periodo, pagina) => admin('listarParticipacionesTodas', { periodo, pagina }),
    verificarCierrePeriodo: (periodo) => admin('verificarCierrePeriodo', { periodo }),
    cerrarPeriodo: (periodo, clave) => admin('cerrarPeriodo', { periodo, clave }),
    crearAjuste: (datos, clave) => admin('crearAjuste', { datos, clave }),
    resolverObservacion: (id, estado, comentario) => admin('resolverObservacion', { id, estado, comentario }),
    listarTodosLosClientes: (filtro, pagina) => admin('listarTodosLosClientes', { filtro, pagina }),
    lineaDeTiempoDeCualquierCliente: (clienteId, pagina) => admin('lineaDeTiempoDeCualquierCliente', { clienteId, pagina }),
    colaDeRevision: (filtro, pagina) => admin('colaDeRevision', { filtro, pagina }),
    revisarCotizacion: (id, accion, comentario, clave, alternativasAprobadas) => admin('revisarCotizacion', { id, accion, comentario, clave, alternativasAprobadas }),
    recalcularCotizacion: (id) => admin('recalcularCotizacion', { id }),
    firmarComoCeo: (cotizacionId, clave) => admin('firmarComoCeo', { cotizacionId, clave }),
    firmasDeCotizacion: (cotizacionId) => admin('firmasDeCotizacion', { cotizacionId }),
    anulacionesDeFirma: (cotizacionId, rol) => admin('anulacionesDeFirma', { cotizacionId, rol }),
    listarConstancias: (pagina) => admin('listarConstancias', { pagina }),
    reintentarNotificaciones: (constanciaId) => admin('reintentarNotificaciones', { constanciaId }),
    listarParticipaciones: () => admin('listarParticipaciones'),
    publicarParticipacion: (datos, clave) => admin('publicarParticipacion', { datos, clave }),
    cargarPreciosLista: (precios, motivo) => admin('cargarPreciosLista', { precios, motivo }),
    publicarProducto: (id, publicado, motivo) => admin('publicarProducto', { id, publicado, motivo }),
    listarActividadesPendientes: (pagina) => admin('listarActividadesPendientes', { pagina }),
    confirmarActividad: (id) => admin('confirmarActividad', { id }),
    fusionarActividad: (origenId, destinoId, motivo) => admin('fusionarActividad', { origenId, destinoId, motivo }),
    editarTaxonomia: (cambio, clave) => admin('editarTaxonomia', { cambio, clave }),
    listarVendedores: (filtro, pagina) => admin('listarVendedores', { filtro, pagina }),
    crearVendedor: (datos, clave) => admin('crearVendedor', { datos, clave }),
    cambiarRol: (usuarioId, rol, motivo) => admin('cambiarRol', { usuarioId, rol, motivo }),
    desactivarVendedor: (id, motivo) => admin('desactivarVendedor', { id, motivo }),
    reasignarCartera: (datos, clave) => admin('reasignarCartera', { datos, clave }),
    obtenerParametros: () => admin('obtenerParametros'),
    actualizarParametros: (cambios, motivo) => admin('actualizarParametros', { cambios, motivo }),
    estadoProveedores: () => admin('estadoProveedores'),
    usoPorVendedor: (periodo) => admin('usoPorVendedor', { periodo }),
    listarRegistroAcceso: (filtro, pagina) => admin('listarRegistroAcceso', { filtro, pagina }),
    listarAperturasEnlace: (filtro, pagina) => admin('listarAperturasEnlace', { filtro, pagina }),
    listarSugerencias: (filtro, pagina) => admin('listarSugerencias', { filtro, pagina }),
    resolverSugerencia: (id, resolucion) => admin('resolverSugerencia', { id, resolucion }),
    agregadoSugerencias: () => admin('agregadoSugerencias'),
  };

  return capa;
}
