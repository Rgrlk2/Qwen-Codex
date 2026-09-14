/**
 * CapaDatos — contrato único entre las vistas y los datos.
 *
 * ⛔ Las vistas NUNCA llaman `fetch` directo. Todo pasa por esta interfaz.
 * ⛔ Este archivo es propiedad de la Sesión 1. Ninguna otra sesión lo edita.
 *    Protocolo de cambio: docs/PARALLEL_SESSIONS.md §6.
 *
 * Dos implementaciones del mismo contrato:
 *   - `packages/mock`              → desarrollo en paralelo, sin backend
 *   - `apps/<app>/src/datos/http.ts`   → producción
 *
 * Ver docs/API_CONTRACTS.md.
 */

import type {
  ClaveIdempotencia,
  Dinero,
  Id,
  ISODate,
  OpcionesPagina,
  Pagina,
  PeriodoMensual,
  Resultado,
  TotalesPorMoneda,
  Version,
} from './core';

import type {
  FiltroProductos,
  Producto,
  ProductoDetalle,
  ProductoId,
  PrecioCatalogo,
  ResumenRubro,
  Rubro,
} from './catalogo';

import type { Sesion, Usuario } from './identidad';

import type {
  Contacto,
  Cuenta,
  CuentaDetalle,
  EventoLineaTiempo,
  FiltroCuentas,
  FiltroPlanes,
  MotivoCierrePlan,
  NuevaCuenta,
  NuevoPlan,
  ObjetivoSugerido,
  PlanDeAccion,
} from './cartera';

import type {
  CompromisoAgenda,
  FiltroPendientes,
  GraficosDia,
  IndicadorDia,
  Pendiente,
  RespuestaConsulta,
  SenalAtencion,
} from './dia';

import type {
  AudioSeguimiento,
  CapturaSeguimiento,
  EstadoPaso,
  FiltroSeguimientos,
  PasoSugerido,
  PropuestaDeSeguimiento,
  Seguimiento,
  SeguimientoConfirmado,
} from './seguimiento';

import type {
  AccesoEnlace,
  AccionAprobacion,
  Cotizacion,
  CotizacionDetalle,
  DocumentoEmitido,
  EnlaceCompartido,
  FiltroAccesos,
  FiltroColaAprobacion,
  FiltroCotizaciones,
  ItemCotizacionEntrada,
  NuevaCotizacion,
  NuevaPresentacion,
  OpcionesEnlace,
  Presentacion,
  PropuestaPublica,
  SolicitudAprobacion,
  VersionCotizacion,
} from './propuestas';

import type {
  Discrepancia,
  FiltroMensualidades,
  LineaComision,
  Liquidacion,
  LiquidacionDetalle,
  Mensualidad,
  NuevaDiscrepancia,
  NuevaReglaComision,
  NuevoAjuste,
  AjusteComision,
  ReglaComision,
  ResumenDinero,
  SimulacionComision,
  VerificacionCierre,
} from './dinero';

import type {
  AgregadoSugerencias,
  FiltroSugerencias,
  NuevaSugerencia,
  ResolucionSugerencia,
  SugerenciaProducto,
} from './sugerencias';

import type { FiltroAuditoria, RegistroAuditoria } from './registros';

import type {
  FiltroUsuarios,
  PanelAdmin,
  ParametrosSistema,
  PrecioCatalogoEntrada,
  ReasignacionCartera,
  ResultadoReasignacion,
} from './admin';

// ---------------------------------------------------------------------------

type R<T> = Promise<Resultado<T>>;

/** Sesión e identidad. */
export interface CapaSesion {
  sesionActual(): R<Sesion>;
  cerrarSesion(): R<void>;
}

/** Vista 01 — Mi Día. Dueño: Sesión 2. */
export interface CapaDia {
  indicadoresDelDia(): R<ReadonlyArray<IndicadorDia>>;
  agendaDelDia(fecha?: ISODate): R<ReadonlyArray<CompromisoAgenda>>;
  pendientes(filtro?: FiltroPendientes, pagina?: OpcionesPagina): R<Pagina<Pendiente>>;
  requierenAtencion(): R<ReadonlyArray<SenalAtencion>>;
  graficosDelDia(): R<GraficosDia>;
  resolverPendiente(id: Id, clave: ClaveIdempotencia): R<Pendiente>;
  /** ⛔ Sólo lectura. No crea, no modifica, no dispara acciones. Siempre cita fuentes. */
  consultarMiDia(pregunta: string): R<RespuestaConsulta>;
}

/** Vista 02 — Mi Cartera. Dueño: Sesión 3. */
export interface CapaCartera {
  listarCuentas(filtro: FiltroCuentas, pagina?: OpcionesPagina): R<Pagina<Cuenta>>;
  obtenerCuenta(id: Id): R<CuentaDetalle>;
  crearCuenta(datos: NuevaCuenta, clave: ClaveIdempotencia): R<Cuenta>;
  actualizarCuenta(id: Id, cambios: Partial<NuevaCuenta>, version: Version): R<Cuenta>;
  listarContactos(cuentaId: Id): R<ReadonlyArray<Contacto>>;
  lineaDeTiempo(cuentaId: Id, pagina?: OpcionesPagina): R<Pagina<EventoLineaTiempo>>;

  listarRubros(): R<ReadonlyArray<Rubro>>;
  resumenPorRubro(rubroId: Id): R<ResumenRubro>;

  listarPlanes(filtro: FiltroPlanes, pagina?: OpcionesPagina): R<Pagina<PlanDeAccion>>;
  /** ⛔ `eje: 'rubro'` con `cuentaId` ⇒ error `validacion`. */
  crearPlan(datos: NuevoPlan, clave: ClaveIdempotencia): R<PlanDeAccion>;
  /** ⛔ Sin motivo ⇒ error `validacion`. */
  cerrarPlan(id: Id, motivo: MotivoCierrePlan, comentario: string): R<PlanDeAccion>;
  objetivosSugeridos(planId: Id): R<ReadonlyArray<ObjetivoSugerido>>;
  aceptarObjetivo(objetivoId: Id, clave: ClaveIdempotencia): R<ObjetivoSugerido>;
}

/** Vista 03 — Mi Portafolio. Dueño: Sesión 4. */
export interface CapaPortafolio {
  /** ⛔ Devuelve como máximo 13 ítems, todos del catálogo cerrado. */
  listarProductos(filtro?: FiltroProductos): R<ReadonlyArray<Producto>>;
  /** ⛔ Trae `claveCopy`, NO el texto del copy. */
  obtenerProducto(id: ProductoId): R<ProductoDetalle>;
  preciosDeProducto(id: ProductoId): R<ReadonlyArray<PrecioCatalogo>>;
  /** Mapeo literal contra "Dónde tiene más sentido". Sin scoring. */
  productosRecomendados(cuentaId: Id): R<ReadonlyArray<ProductoId>>;
  crearSugerenciaProducto(datos: NuevaSugerencia, clave: ClaveIdempotencia): R<SugerenciaProducto>;
  listarMisSugerencias(pagina?: OpcionesPagina): R<Pagina<SugerenciaProducto>>;
}

/** Vista 04 — Mis Propuestas. Dueño: Sesión 5. */
export interface CapaPropuestas {
  listarPresentaciones(filtro: FiltroCotizaciones, pagina?: OpcionesPagina): R<Pagina<Presentacion>>;
  crearPresentacion(datos: NuevaPresentacion, clave: ClaveIdempotencia): R<Presentacion>;
  actualizarPresentacion(id: Id, cambios: Partial<NuevaPresentacion>, version: Version): R<Presentacion>;

  listarCotizaciones(filtro: FiltroCotizaciones, pagina?: OpcionesPagina): R<Pagina<Cotizacion>>;
  obtenerCotizacion(id: Id): R<CotizacionDetalle>;
  crearCotizacion(datos: NuevaCotizacion, clave: ClaveIdempotencia): R<Cotizacion>;
  /** ⛔ Sobre estado `aprobada` crea versión nueva en borrador y caduca la aprobación. */
  actualizarCotizacion(id: Id, cambios: Partial<NuevaCotizacion>, version: Version): R<Cotizacion>;
  /** ⛔ Devuelve un `Dinero` por moneda. Nunca un total consolidado. */
  previsualizarTotales(items: ReadonlyArray<ItemCotizacionEntrada>): R<TotalesPorMoneda>;
  enviarAAprobacion(id: Id, comentario: string, clave: ClaveIdempotencia): R<Cotizacion>;
  /** ⛔ Falla si la cotización requiere aprobación y no la tiene. */
  enviarAlCliente(id: Id, clave: ClaveIdempotencia): R<Cotizacion>;
  marcarDesenlace(id: Id, desenlace: 'aceptada' | 'perdida', motivo?: string): R<Cotizacion>;
  historialVersiones(id: Id): R<ReadonlyArray<VersionCotizacion>>;

  /** Idempotente por `(propuestaId, versionPropuesta)`: dos llamadas, el mismo documento. */
  emitirPdf(propuestaId: Id, clave: ClaveIdempotencia): R<DocumentoEmitido>;
  crearEnlace(propuestaId: Id, opciones: OpcionesEnlace, clave: ClaveIdempotencia): R<EnlaceCompartido>;
  revocarEnlace(enlaceId: Id, motivo: string): R<EnlaceCompartido>;
  accesosDePropuesta(propuestaId: Id, pagina?: OpcionesPagina): R<Pagina<AccesoEnlace>>;
}

/** Vista 05 — Mi Seguimiento. Dueño: Sesión 2. */
export interface CapaSeguimiento {
  listarSeguimientos(filtro: FiltroSeguimientos, pagina?: OpcionesPagina): R<Pagina<Seguimiento>>;
  /** ⛔ NO persiste nada. Devuelve una propuesta para que el usuario confirme. */
  procesarCaptura(entrada: CapturaSeguimiento): R<PropuestaDeSeguimiento>;
  /** ⛔ Exige `confirmadoPorUsuario: true`; sin eso devuelve `validacion`. */
  guardarSeguimiento(datos: SeguimientoConfirmado, clave: ClaveIdempotencia): R<Seguimiento>;
  subirAudio(archivo: Blob, clave: ClaveIdempotencia): R<AudioSeguimiento>;
  /** Borra el audio. ⛔ NO borra la transcripción ni el seguimiento. */
  borrarAudio(audioId: Id, motivo: string): R<void>;
  actualizarPaso(pasoId: Id, estado: EstadoPaso): R<PasoSugerido>;
}

/** Vista 06 — Mi Dinero. Dueño: Sesión 6. ⛔ Sin ninguna ruta de escritura sobre comisiones. */
export interface CapaDinero {
  resumenDinero(periodo: PeriodoMensual): R<ResumenDinero>;
  listarMensualidades(filtro: FiltroMensualidades, pagina?: OpcionesPagina): R<Pagina<Mensualidad>>;
  listarComisiones(periodo: PeriodoMensual, pagina?: OpcionesPagina): R<Pagina<LineaComision>>;
  listarLiquidaciones(pagina?: OpcionesPagina): R<Pagina<Liquidacion>>;
  obtenerLiquidacion(id: Id): R<LiquidacionDetalle>;
  /** ⛔ No modifica ningún importe: abre una observación para el administrador. */
  abrirDiscrepancia(datos: NuevaDiscrepancia, clave: ClaveIdempotencia): R<Discrepancia>;
}

/**
 * Administración. Dueño: Sesión 6.
 *
 * Métodos que deliberadamente NO EXISTEN, y no deben agregarse:
 *   crearProducto · eliminarProducto   → el portafolio está cerrado en 13
 *   editarReglaComision                → sólo se publica una versión nueva
 *   reabrirPeriodo                     → sólo se crea un ajuste
 *   escribirAuditoria · borrarAcceso   → los registros son append-only
 */
export interface CapaAdmin {
  panel(periodo: PeriodoMensual): R<PanelAdmin>;

  listarUsuarios(filtro: FiltroUsuarios, pagina?: OpcionesPagina): R<Pagina<Usuario>>;
  crearUsuario(datos: Omit<Usuario, 'id' | 'creadoEn' | 'creadoPor' | 'actualizadoEn' | 'actualizadoPor' | 'version' | 'ultimoIngresoEn'>, clave: ClaveIdempotencia): R<Usuario>;
  actualizarUsuario(id: Id, cambios: Partial<Usuario>, version: Version): R<Usuario>;
  desactivarUsuario(id: Id, motivo: string): R<Usuario>;
  fijarLimiteDescuento(usuarioId: Id, limite: Dinero | null, motivo: string): R<Usuario>;
  reasignarCartera(datos: ReasignacionCartera, clave: ClaveIdempotencia): R<ResultadoReasignacion>;

  publicarProducto(id: ProductoId, publicado: boolean, motivo: string): R<Producto>;
  cargarPrecios(precios: ReadonlyArray<PrecioCatalogoEntrada>, motivo: string): R<{ readonly versionCatalogo: number }>;

  colaAprobacion(filtro: FiltroColaAprobacion, pagina?: OpcionesPagina): R<Pagina<SolicitudAprobacion>>;
  /** ⛔ `actorId === solicitanteId` ⇒ `sin_permiso`. Comentario obligatorio. */
  resolverAprobacion(id: Id, accion: AccionAprobacion, comentario: string, clave: ClaveIdempotencia): R<SolicitudAprobacion>;
  delegarAprobacion(id: Id, aprobadorId: Id, motivo: string): R<SolicitudAprobacion>;

  listarReglasComision(pagina?: OpcionesPagina): R<Pagina<ReglaComision>>;
  /** ⛔ Publica una versión nueva. Una regla vigente nunca se edita. */
  publicarReglaComision(datos: NuevaReglaComision, clave: ClaveIdempotencia): R<ReglaComision>;
  simularRegla(datos: NuevaReglaComision, periodo: PeriodoMensual): R<SimulacionComision>;
  verificarCierrePeriodo(periodo: PeriodoMensual): R<VerificacionCierre>;
  /** ⛔ Exige `verificarCierrePeriodo` en verde. Irreversible. */
  cerrarPeriodo(periodo: PeriodoMensual, clave: ClaveIdempotencia): R<ReadonlyArray<Liquidacion>>;
  crearAjuste(datos: NuevoAjuste, clave: ClaveIdempotencia): R<AjusteComision>;
  resolverDiscrepancia(id: Id, resolucion: Discrepancia['estado'], comentario: string): R<Discrepancia>;

  listarSugerencias(filtro: FiltroSugerencias, pagina?: OpcionesPagina): R<Pagina<SugerenciaProducto>>;
  /** ⛔ Resolución obligatoria: el silencio no es una respuesta válida. */
  resolverSugerencia(id: Id, resolucion: ResolucionSugerencia): R<SugerenciaProducto>;
  agregadoSugerencias(): R<ReadonlyArray<AgregadoSugerencias>>;

  /** Registro de material compartido. Sólo lectura. */
  listarAccesosEnlace(filtro: FiltroAccesos, pagina?: OpcionesPagina): R<Pagina<AccesoEnlace>>;
  /** Registro de auditoría del sistema. Sólo lectura. Nunca se mezcla con el anterior. */
  listarAuditoria(filtro: FiltroAuditoria, pagina?: OpcionesPagina): R<Pagina<RegistroAuditoria>>;
  /** ⛔ Se registra a sí misma en auditoría. */
  exportarAuditoria(filtro: FiltroAuditoria): R<DocumentoEmitido>;

  obtenerParametros(): R<ParametrosSistema>;
  actualizarParametros(cambios: Partial<ParametrosSistema>, motivo: string): R<ParametrosSistema>;
}

/**
 * Enlace público — sin sesión.
 * ⛔ Superficie mínima: sin datos de otras cuentas, sin navegación, sin listados.
 * ⛔ Nunca revela cuántos accesos hubo.
 */
export interface CapaPublica {
  obtenerPropuestaPublica(token: string, codigo?: string): R<PropuestaPublica>;
  descargarPdfPublico(token: string): R<{ readonly url: string; readonly venceEn: ISODate }>;
}

/** El puerto completo. Toda vista consume esto y sólo esto. */
export interface CapaDatos
  extends CapaSesion,
    CapaDia,
    CapaCartera,
    CapaPortafolio,
    CapaPropuestas,
    CapaSeguimiento,
    CapaDinero {}

/** Puerto de la app de administración. */
export interface CapaDatosAdmin extends CapaSesion, CapaAdmin {}
