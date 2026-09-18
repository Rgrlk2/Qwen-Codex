/**
 * Datos de ejemplo — dominio: finanzas y administración.
 *
 * ⛔ DUEÑO: Sesión 6. Ninguna otra sesión edita este archivo.
 *
 * Expone `crearCapaFinanzas`, que arma un objeto `CapaDinero & CapaAdministracion`
 * completo contra datos de ejemplo en memoria. Es lo que Sesión 1 mezcla dentro
 * del resto de `CapaDatos` en `packages/mock/src/index.ts`.
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén en COMMERCIAL_RULES.md §2.
 * ⛔ Sin copy aprobado duplicado acá: sólo nombres comerciales de referencia.
 * ⛔ Sin roles fuera de vendedor y administrador.
 *
 * SUPUESTO DE MODELADO (porque `ResumenDinero`/`ControlFinanciero` llevan un
 * único `periodo` y no un rango): las cifras son **acumuladas hasta el período
 * pedido**, no un corte aislado de ese mes. Así `Cobrado ≤ Vendido` y
 * `ComisiónPendiente + ComisiónPagada = ParteVendedor` valen siempre, sin
 * inventar un segundo parámetro de rango que el contrato no pide.
 */

import type {
  AccesoEnlace, Actividad, AgregadoSugerencias, Ajuste, ClaveIdempotencia, Cliente,
  ComparacionConLista, ConstanciaRespuesta, Cotizacion, CotizacionDetalle,
  Dinero, EstadoProveedores, EstadoTermino, EventoLineaTiempo, FilaRanking, Firma, Id, ISODate,
  LineaParticipacion, LineaPorCobrar, Liquidacion, LiquidacionDetalle, Mensualidad, Moneda,
  Observacion, OpcionesPagina, Pagina, ParametrosSistema, ParticipacionProducto, PeriodoMensual,
  Presupuesto, Producto, ProductoId, RegistroAcceso, Resultado, ResultadoNotificaciones,
  ResultadoReasignacion, SugerenciaProducto, TotalesPorMoneda, Usuario, VerificacionCierre,
} from '@labia/compartido';

import type { CapaAdministracion, CapaDinero } from '@labia/compartido';

import { calcularAlternativas } from '@labia/compartido';

import type { ConfiguracionMock } from './nucleo';
import { CONFIGURACION_POR_DEFECTO } from './nucleo';

// ---------------------------------------------------------------------------
// Utilidades locales — nunca se suman monedas distintas, nunca se pierde
// el resto del monto al partir en dos.
// ---------------------------------------------------------------------------

function dinero(monto: number, moneda: Moneda = 'PYG'): Dinero {
  return { monto, moneda };
}

/** Reparte una base entre Lab.IA y el vendedor. `labIA + vendedor === base`, siempre. */
function partir(base: Dinero, porcentajeVendedor: number): { readonly labIA: Dinero; readonly vendedor: Dinero } {
  const parteVendedor = Math.round((base.monto * porcentajeVendedor) / 100);
  return {
    vendedor: dinero(parteVendedor, base.moneda),
    labIA: dinero(base.monto - parteVendedor, base.moneda),
  };
}

/** Agrupa importes por moneda. Nunca produce un total consolidado entre monedas. */
function agrupar(items: ReadonlyArray<Dinero>): TotalesPorMoneda {
  const mapa = new Map<Moneda, number>();
  for (const item of items) mapa.set(item.moneda, (mapa.get(item.moneda) ?? 0) + item.monto);
  return [...mapa.entries()].map(([moneda, monto]) => ({ moneda, monto }));
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function responder<T>(config: ConfiguracionMock, datos: T): Promise<Resultado<T>> {
  if (config.latenciaMs > 0) await esperar(config.latenciaMs);
  if (config.fallaForzada) return { ok: false, error: config.fallaForzada };
  return { ok: true, datos };
}

function paginar<T>(items: ReadonlyArray<T>, opciones?: OpcionesPagina): Pagina<T> {
  const limite = opciones?.limite ?? 20;
  const inicio = opciones?.cursor ? Number(opciones.cursor) : 0;
  const pagina = items.slice(inicio, inicio + limite);
  const siguiente = inicio + limite;
  return { items: pagina, cursor: siguiente < items.length ? String(siguiente) : null, total: items.length };
}

function sinPermiso(mensaje: string): Resultado<never> {
  return { ok: false, error: { codigo: 'sin_permiso', mensajeAmable: mensaje } };
}

function validacion(mensaje: string, campo?: string): Resultado<never> {
  return campo
    ? { ok: false, error: { codigo: 'validacion', mensajeAmable: mensaje, campo } }
    : { ok: false, error: { codigo: 'validacion', mensajeAmable: mensaje } };
}

function noEncontrado(mensaje: string): Resultado<never> {
  return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: mensaje } };
}

/** Fecha de referencia del mock: "hoy" dentro de los datos de ejemplo. */
const HOY = '2026-09-15';
const PERIODO_ACTUAL: PeriodoMensual = '2026-09';
const PERIODO_ANTERIOR: PeriodoMensual = '2026-08';

function diasEntre(desde: ISODate, hasta: ISODate): number {
  const ms = new Date(`${hasta}T00:00:00`).getTime() - new Date(`${desde}T00:00:00`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function periodoOAnterior(periodo: PeriodoMensual, referencia: PeriodoMensual): boolean {
  return periodo <= referencia;
}

// ---------------------------------------------------------------------------
// Vendedores y administrador
// ---------------------------------------------------------------------------

const VD_MARTA: Id = 'usr-v-marta';
const VD_DIEGO: Id = 'usr-v-diego';
const VD_LAURA: Id = 'usr-v-laura';
const ADMIN: Id = 'usr-admin-1';

let usuarios: Usuario[] = [
  {
    id: VD_MARTA, nombre: 'Marta Rojas', email: 'mrojas@labia.example', usuario: 'mrojas',
    rol: 'vendedor', activo: true, ultimoIngresoEn: `${HOY}T08:12:00-04:00`,
    creadoEn: '2026-03-02T09:00:00-04:00', creadoPor: ADMIN,
    actualizadoEn: `${HOY}T08:12:00-04:00`, actualizadoPor: VD_MARTA, version: 4,
  },
  {
    id: VD_DIEGO, nombre: 'Diego Fernández', email: 'dfernandez@labia.example', usuario: 'dfernandez',
    rol: 'vendedor', activo: true, ultimoIngresoEn: '2026-09-12T14:40:00-04:00',
    creadoEn: '2026-04-14T09:00:00-04:00', creadoPor: ADMIN,
    actualizadoEn: '2026-09-12T14:40:00-04:00', actualizadoPor: VD_DIEGO, version: 3,
  },
  {
    id: VD_LAURA, nombre: 'Laura Bogado', email: 'lbogado@labia.example', usuario: 'lbogado',
    rol: 'vendedor', activo: true, ultimoIngresoEn: '2026-08-08T09:20:00-04:00',
    creadoEn: '2026-01-20T09:00:00-04:00', creadoPor: ADMIN,
    actualizadoEn: '2026-08-08T09:20:00-04:00', actualizadoPor: VD_LAURA, version: 2,
  },
  {
    id: ADMIN, nombre: 'Valeria Duarte', email: 'vduarte@labia.example', usuario: 'vduarte',
    rol: 'administrador', activo: true, ultimoIngresoEn: `${HOY}T07:50:00-04:00`,
    creadoEn: '2026-01-05T09:00:00-04:00', creadoPor: ADMIN,
    actualizadoEn: `${HOY}T07:50:00-04:00`, actualizadoPor: ADMIN, version: 6,
  },
];

function nombreVendedor(id: Id): string {
  return usuarios.find((u) => u.id === id)?.nombre ?? 'Vendedor';
}

// ---------------------------------------------------------------------------
// Nombres comerciales (para mostrar en tablas). Referencia, no copy: el copy
// aprobado vive en content/copy/ y se sirve tal cual desde ahí.
// ---------------------------------------------------------------------------

const NOMBRE_PRODUCTO: Readonly<Record<ProductoId, string>> = {
  'ojo-digital': 'Ojo Digital',
  'pulso-digital': 'Pulso Digital',
  'vendedor-24-7': 'Vendedor 24/7',
  'radar-stock': 'Radar Stock',
  'faro-digital': 'Faro Digital',
  'merma-ia': 'Merma IA',
  'cotiza-facil': 'Cotiza Fácil',
  'precio-vivo': 'Precio Vivo',
  'ruta-ia': 'Ruta IA',
  'park-ia': 'Park.IA',
  'smart-commerce': 'Smart Commerce',
  'agendar-ia': 'Agendar.IA',
  'exeq-ia': 'Exeq.IA',
};

// ---------------------------------------------------------------------------
// Participación por producto — 50/50 por defecto, dos casos configurados
// ---------------------------------------------------------------------------

let participaciones: ParticipacionProducto[] = [
  {
    id: 'pp-agendar-ia-1', productoId: 'agendar-ia', porcentajeLabIA: 50, porcentajeVendedor: 50,
    aplicaASetup: true, aplicaAMensualidad: true, mesesParticipacionVendedor: null,
    version: 1, vigenteDesde: '2026-01-01', publicadaPor: ADMIN, publicadaEn: '2026-01-01T09:00:00-04:00',
  },
  {
    id: 'pp-park-ia-1', productoId: 'park-ia', porcentajeLabIA: 50, porcentajeVendedor: 50,
    aplicaASetup: true, aplicaAMensualidad: true, mesesParticipacionVendedor: null,
    version: 1, vigenteDesde: '2026-01-01', publicadaPor: ADMIN, publicadaEn: '2026-01-01T09:00:00-04:00',
  },
  {
    id: 'pp-cotiza-facil-1', productoId: 'cotiza-facil', porcentajeLabIA: 50, porcentajeVendedor: 50,
    aplicaASetup: true, aplicaAMensualidad: true, mesesParticipacionVendedor: null,
    version: 1, vigenteDesde: '2026-01-01', publicadaPor: ADMIN, publicadaEn: '2026-01-01T09:00:00-04:00',
  },
  {
    // Ejemplo de meses de participación configurados: a partir del mes 13, 100 % a Lab.IA.
    id: 'pp-ojo-digital-1', productoId: 'ojo-digital', porcentajeLabIA: 50, porcentajeVendedor: 50,
    aplicaASetup: true, aplicaAMensualidad: true, mesesParticipacionVendedor: 12,
    version: 1, vigenteDesde: '2026-01-01', publicadaPor: ADMIN, publicadaEn: '2026-01-01T09:00:00-04:00',
  },
  {
    // Ejemplo de porcentaje distinto del 50/50 por defecto.
    id: 'pp-merma-ia-1', productoId: 'merma-ia', porcentajeLabIA: 55, porcentajeVendedor: 45,
    aplicaASetup: false, aplicaAMensualidad: true, mesesParticipacionVendedor: null,
    version: 1, vigenteDesde: '2026-02-01', publicadaPor: ADMIN, publicadaEn: '2026-02-01T09:00:00-04:00',
  },
  {
    id: 'pp-precio-vivo-1', productoId: 'precio-vivo', porcentajeLabIA: 50, porcentajeVendedor: 50,
    aplicaASetup: true, aplicaAMensualidad: true, mesesParticipacionVendedor: null,
    version: 1, vigenteDesde: '2026-01-01', publicadaPor: ADMIN, publicadaEn: '2026-01-01T09:00:00-04:00',
  },
];

function participacionVigente(productoId: ProductoId): ParticipacionProducto {
  const encontrada = participaciones.find((p) => p.productoId === productoId);
  if (encontrada) return encontrada;
  return {
    id: `pp-defecto-${productoId}`, productoId, porcentajeLabIA: 50, porcentajeVendedor: 50,
    aplicaASetup: true, aplicaAMensualidad: true, mesesParticipacionVendedor: null,
    version: 1, vigenteDesde: '2026-01-01', publicadaPor: ADMIN, publicadaEn: '2026-01-01T09:00:00-04:00',
  };
}

// ---------------------------------------------------------------------------
// Mensualidades
// ---------------------------------------------------------------------------

let mensualidades: Mensualidad[] = [
  {
    id: 'me-1', clienteId: 'cl-repuestos-anibal', nombreCliente: 'Repuestos Don Aníbal',
    productoId: 'agendar-ia', plan: null, importe: dinero(790_000), vendedorId: VD_MARTA,
    cotizacionId: 'cot-hist-1', altaEn: '2026-08-03', bajaEn: null, motivoBaja: null,
    estado: 'activa', diaCobro: 5, mesesAcumulados: 2, mesesDeParticipacionRestantes: null,
  },
  {
    id: 'me-2', clienteId: 'cl-clinica-san-roque', nombreCliente: 'Clínica Odontológica San Roque',
    productoId: 'park-ia', plan: 'Control', importe: dinero(790_000), vendedorId: VD_MARTA,
    cotizacionId: 'cot-hist-2', altaEn: '2026-07-10', bajaEn: null, motivoBaja: null,
    estado: 'activa', diaCobro: 10, mesesAcumulados: 3, mesesDeParticipacionRestantes: null,
  },
  {
    id: 'me-3', clienteId: 'cl-ferreteria-central', nombreCliente: 'Ferretería Central',
    productoId: 'cotiza-facil', plan: null, importe: dinero(690_000), vendedorId: VD_DIEGO,
    cotizacionId: 'cot-hist-3', altaEn: '2026-08-20', bajaEn: null, motivoBaja: null,
    estado: 'activa', diaCobro: 20, mesesAcumulados: 1, mesesDeParticipacionRestantes: null,
  },
  {
    id: 'me-4', clienteId: 'cl-hotel-palmeras', nombreCliente: 'Hotel Las Palmeras',
    productoId: 'ojo-digital', plan: null, importe: dinero(600_000), vendedorId: VD_DIEGO,
    cotizacionId: 'cot-hist-4', altaEn: '2025-11-15', bajaEn: null, motivoBaja: null,
    estado: 'activa', diaCobro: 15, mesesAcumulados: 10,
    // participación limitada a 12 meses: quedan 2.
    mesesDeParticipacionRestantes: 2,
  },
  {
    id: 'me-5', clienteId: 'cl-farmacia-bogado', nombreCliente: 'Farmacia Bogado',
    productoId: 'merma-ia', plan: null, importe: dinero(150_000), vendedorId: VD_MARTA,
    cotizacionId: 'cot-hist-5', altaEn: '2026-04-01', bajaEn: '2026-08-31',
    motivoBaja: 'El cliente cerró la sucursal analizada.',
    estado: 'baja', diaCobro: null, mesesAcumulados: 4, mesesDeParticipacionRestantes: null,
  },
  {
    id: 'me-6', clienteId: 'cl-distribuidora-abc', nombreCliente: 'Distribuidora ABC',
    productoId: 'precio-vivo', plan: null, importe: dinero(200_00, 'USD'), vendedorId: VD_DIEGO,
    cotizacionId: 'cot-hist-6', altaEn: '2026-08-05', bajaEn: null, motivoBaja: null,
    estado: 'activa', diaCobro: 5, mesesAcumulados: 2, mesesDeParticipacionRestantes: null,
  },
];

// ---------------------------------------------------------------------------
// Líneas de participación — nacen sólo contra cobro confirmado
// ---------------------------------------------------------------------------

let contadorLinea = 0;
function nuevaLinea(datos: {
  readonly vendedorId: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly productoId: ProductoId;
  readonly origen: LineaParticipacion['origen'];
  readonly referenciaId: Id;
  readonly base: Dinero;
  readonly periodo: PeriodoMensual;
  readonly devengadaEn: ISODate;
  readonly liquidacionId?: Id;
}): LineaParticipacion {
  contadorLinea += 1;
  const participacion = participacionVigente(datos.productoId);
  const { labIA, vendedor } = partir(datos.base, participacion.porcentajeVendedor);
  return {
    id: `ln-${contadorLinea}`,
    vendedorId: datos.vendedorId,
    clienteId: datos.clienteId,
    nombreCliente: datos.nombreCliente,
    productoId: datos.productoId,
    origen: datos.origen,
    referenciaId: datos.referenciaId,
    baseCobrada: datos.base,
    participacionId: participacion.id,
    participacionVersion: participacion.version,
    porcentajeVendedorAplicado: participacion.porcentajeVendedor,
    parteLabIA: labIA,
    parteVendedor: vendedor,
    periodo: datos.periodo,
    estado: datos.liquidacionId ? 'liquidada' : 'devengada',
    liquidacionId: datos.liquidacionId ?? null,
    devengadaEn: datos.devengadaEn,
  };
}

let lineasParticipacion: LineaParticipacion[] = [
  // Repuestos Don Aníbal — setup cobrado en agosto, ya liquidado.
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-repuestos-anibal', nombreCliente: 'Repuestos Don Aníbal',
    productoId: 'agendar-ia', origen: 'setup', referenciaId: 'cot-hist-1',
    base: dinero(3_000_000), periodo: PERIODO_ANTERIOR, devengadaEn: '2026-08-03T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-marta',
  }),
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-repuestos-anibal', nombreCliente: 'Repuestos Don Aníbal',
    productoId: 'agendar-ia', origen: 'mensualidad', referenciaId: 'me-1',
    base: dinero(790_000), periodo: PERIODO_ANTERIOR, devengadaEn: '2026-08-05T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-marta',
  }),
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-repuestos-anibal', nombreCliente: 'Repuestos Don Aníbal',
    productoId: 'agendar-ia', origen: 'mensualidad', referenciaId: 'me-1',
    base: dinero(790_000), periodo: PERIODO_ACTUAL, devengadaEn: '2026-09-05T10:00:00-04:00',
  }),
  // Clínica San Roque — setup y mensualidades.
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-clinica-san-roque', nombreCliente: 'Clínica Odontológica San Roque',
    productoId: 'park-ia', origen: 'setup', referenciaId: 'cot-hist-2',
    base: dinero(4_900_000), periodo: '2026-07', devengadaEn: '2026-07-10T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-marta',
  }),
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-clinica-san-roque', nombreCliente: 'Clínica Odontológica San Roque',
    productoId: 'park-ia', origen: 'mensualidad', referenciaId: 'me-2',
    base: dinero(790_000), periodo: PERIODO_ANTERIOR, devengadaEn: '2026-08-10T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-marta',
  }),
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-clinica-san-roque', nombreCliente: 'Clínica Odontológica San Roque',
    productoId: 'park-ia', origen: 'mensualidad', referenciaId: 'me-2',
    base: dinero(790_000), periodo: PERIODO_ACTUAL, devengadaEn: '2026-09-10T10:00:00-04:00',
  }),
  // Ferretería Central — sólo la primera mensualidad está cobrada; el setup sigue pendiente.
  nuevaLinea({
    vendedorId: VD_DIEGO, clienteId: 'cl-ferreteria-central', nombreCliente: 'Ferretería Central',
    productoId: 'cotiza-facil', origen: 'mensualidad', referenciaId: 'me-3',
    base: dinero(690_000), periodo: PERIODO_ACTUAL, devengadaEn: '2026-09-20T10:00:00-04:00',
  }),
  // Hotel Las Palmeras — dentro del plazo de participación configurado (12 meses).
  nuevaLinea({
    vendedorId: VD_DIEGO, clienteId: 'cl-hotel-palmeras', nombreCliente: 'Hotel Las Palmeras',
    productoId: 'ojo-digital', origen: 'mensualidad', referenciaId: 'me-4',
    base: dinero(600_000), periodo: PERIODO_ANTERIOR, devengadaEn: '2026-08-15T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-diego',
  }),
  nuevaLinea({
    vendedorId: VD_DIEGO, clienteId: 'cl-hotel-palmeras', nombreCliente: 'Hotel Las Palmeras',
    productoId: 'ojo-digital', origen: 'mensualidad', referenciaId: 'me-4',
    base: dinero(600_000), periodo: PERIODO_ACTUAL, devengadaEn: '2026-09-15T10:00:00-04:00',
  }),
  // Farmacia Bogado — histórico antes de la baja, con la participación 55/45 de Merma IA.
  nuevaLinea({
    vendedorId: VD_MARTA, clienteId: 'cl-farmacia-bogado', nombreCliente: 'Farmacia Bogado',
    productoId: 'merma-ia', origen: 'mensualidad', referenciaId: 'me-5',
    base: dinero(150_000), periodo: PERIODO_ANTERIOR, devengadaEn: '2026-08-01T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-marta',
  }),
  // Distribuidora ABC — en dólares. Nunca se mezcla con las líneas en guaraníes.
  nuevaLinea({
    vendedorId: VD_DIEGO, clienteId: 'cl-distribuidora-abc', nombreCliente: 'Distribuidora ABC',
    productoId: 'precio-vivo', origen: 'setup', referenciaId: 'cot-hist-6',
    base: dinero(50_000, 'USD'), periodo: PERIODO_ANTERIOR, devengadaEn: '2026-08-05T10:00:00-04:00',
    liquidacionId: 'liq-2026-08-diego',
  }),
  nuevaLinea({
    vendedorId: VD_DIEGO, clienteId: 'cl-distribuidora-abc', nombreCliente: 'Distribuidora ABC',
    productoId: 'precio-vivo', origen: 'mensualidad', referenciaId: 'me-6',
    base: dinero(20_000, 'USD'), periodo: PERIODO_ACTUAL, devengadaEn: '2026-09-05T10:00:00-04:00',
  }),
];

// ---------------------------------------------------------------------------
// Ajustes y observaciones
// ---------------------------------------------------------------------------

let ajustes: Ajuste[] = [
  {
    id: 'aj-1', liquidacionOrigenId: 'liq-2026-08-diego', periodoAplicacion: PERIODO_ACTUAL,
    vendedorId: VD_DIEGO, importe: dinero(35_000), motivo:
      'Diferencia a favor del vendedor: la mensualidad de agosto de Hotel Las Palmeras se cobró con un ajuste de precio que la línea original no reflejaba.',
    observacionId: 'ob-1', creadoPor: ADMIN, creadoEn: '2026-09-02T11:00:00-04:00',
  },
];

let observaciones: Observacion[] = [
  {
    id: 'ob-1', lineaParticipacionId: 'ln-8', abiertaPor: VD_DIEGO,
    descripcion: 'El cobro de agosto de Hotel Las Palmeras incluyó Gs. 70.000 adicionales que la línea no reconoce.',
    estado: 'procede', resolucion: 'Confirmado con administración. Se emite el ajuste aj-1 en el período siguiente.',
    resueltaPor: ADMIN, resueltaEn: '2026-09-02T11:00:00-04:00', abiertaEn: '2026-09-01T09:30:00-04:00',
  },
  {
    id: 'ob-2', lineaParticipacionId: 'ln-6', abiertaPor: VD_DIEGO,
    descripcion: 'La mensualidad de Ferretería Central figura devengada pero el cliente todavía no pagó el setup: ¿corresponde separar los dos cobros?',
    estado: 'abierta', resolucion: null, resueltaPor: null, resueltaEn: null,
    abiertaEn: '2026-09-10T16:00:00-04:00',
  },
];

// ---------------------------------------------------------------------------
// Presupuesto de ventas
// ---------------------------------------------------------------------------

let presupuestos: Presupuesto[] = [
  {
    id: 'pr-marta-2026-09', vendedorId: VD_MARTA, nombreVendedor: nombreVendedor(VD_MARTA),
    periodo: PERIODO_ACTUAL, metaVendido: dinero(15_000_000), metaCobrado: dinero(12_000_000),
    definidoPor: ADMIN, definidoEn: '2026-08-25T09:00:00-04:00', version: 1,
  },
  {
    id: 'pr-diego-2026-09', vendedorId: VD_DIEGO, nombreVendedor: nombreVendedor(VD_DIEGO),
    periodo: PERIODO_ACTUAL, metaVendido: dinero(10_000_000), metaCobrado: null,
    definidoPor: ADMIN, definidoEn: '2026-08-25T09:00:00-04:00', version: 1,
  },
  {
    id: 'pr-laura-2026-09', vendedorId: VD_LAURA, nombreVendedor: nombreVendedor(VD_LAURA),
    periodo: PERIODO_ACTUAL, metaVendido: dinero(5_000_000), metaCobrado: null,
    definidoPor: ADMIN, definidoEn: '2026-08-25T09:00:00-04:00', version: 1,
  },
];

// ---------------------------------------------------------------------------
// Vendido y por cobrar
// ---------------------------------------------------------------------------

let lineasPorCobrar: LineaPorCobrar[] = [
  {
    id: 'pc-1', clienteId: 'cl-ferreteria-central', nombreCliente: 'Ferretería Central',
    vendedorId: VD_DIEGO, nombreVendedor: nombreVendedor(VD_DIEGO), productoId: 'cotiza-facil',
    origen: 'setup', importe: dinero(4_900_000), venceEn: '2026-09-05',
    diasDeAntiguedad: diasEntre('2026-08-20', HOY), estado: 'atrasado',
  },
];

// ---------------------------------------------------------------------------
// Liquidaciones — período 2026-08 cerrado para Marta y Diego
// ---------------------------------------------------------------------------

function totalesLiquidacion(vendedorId: Id, periodo: PeriodoMensual): TotalesPorMoneda {
  return agrupar(
    lineasParticipacion
      .filter((l) => l.vendedorId === vendedorId && l.periodo === periodo && l.estado === 'liquidada')
      .map((l) => l.parteVendedor),
  );
}

let liquidaciones: Liquidacion[] = [
  {
    id: 'liq-2026-08-marta', vendedorId: VD_MARTA, periodo: PERIODO_ANTERIOR,
    totalesPorMoneda: totalesLiquidacion(VD_MARTA, PERIODO_ANTERIOR),
    estado: 'cerrada', cerradaEn: '2026-09-01T10:00:00-04:00', cerradaPor: ADMIN,
    comprobanteDocumentoId: 'doc-liq-2026-08-marta',
  },
  {
    id: 'liq-2026-08-diego', vendedorId: VD_DIEGO, periodo: PERIODO_ANTERIOR,
    totalesPorMoneda: totalesLiquidacion(VD_DIEGO, PERIODO_ANTERIOR),
    estado: 'cerrada', cerradaEn: '2026-09-01T10:00:00-04:00', cerradaPor: ADMIN,
    comprobanteDocumentoId: 'doc-liq-2026-08-diego',
  },
];

// ---------------------------------------------------------------------------
// Clientes (vista completa de administración)
// ---------------------------------------------------------------------------

const ACTIVIDAD_GENERICA = 'act-generica';

let clientesTodos: Cliente[] = [
  { id: 'cl-repuestos-anibal', tipo: 'empresa', nombre: 'Repuestos Don Aníbal', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_MARTA, etapa: 'cliente_activo', ciudad: 'Asunción',
    ultimaInteraccionEn: '2026-09-10T09:00:00-04:00', proximoPasoEn: null, motivoPerdida: null,
    archivadoEn: null, creadoEn: '2026-07-20T09:00:00-04:00', creadoPor: VD_MARTA,
    actualizadoEn: '2026-09-10T09:00:00-04:00', actualizadoPor: VD_MARTA, version: 5 },
  { id: 'cl-clinica-san-roque', tipo: 'profesional', nombre: 'Clínica Odontológica San Roque', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_MARTA, etapa: 'cliente_activo', ciudad: 'Luque',
    ultimaInteraccionEn: '2026-09-08T09:00:00-04:00', proximoPasoEn: null, motivoPerdida: null,
    archivadoEn: null, creadoEn: '2026-06-25T09:00:00-04:00', creadoPor: VD_MARTA,
    actualizadoEn: '2026-09-08T09:00:00-04:00', actualizadoPor: VD_MARTA, version: 6 },
  { id: 'cl-ferreteria-central', tipo: 'empresa', nombre: 'Ferretería Central', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_DIEGO, etapa: 'cliente_activo', ciudad: 'San Lorenzo',
    ultimaInteraccionEn: '2026-09-11T09:00:00-04:00', proximoPasoEn: '2026-09-19T09:00:00-04:00', motivoPerdida: null,
    archivadoEn: null, creadoEn: '2026-08-01T09:00:00-04:00', creadoPor: VD_DIEGO,
    actualizadoEn: '2026-09-11T09:00:00-04:00', actualizadoPor: VD_DIEGO, version: 4 },
  { id: 'cl-hotel-palmeras', tipo: 'empresa', nombre: 'Hotel Las Palmeras', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_DIEGO, etapa: 'cliente_activo', ciudad: 'Encarnación',
    ultimaInteraccionEn: '2026-09-01T09:00:00-04:00', proximoPasoEn: null, motivoPerdida: null,
    archivadoEn: null, creadoEn: '2025-11-01T09:00:00-04:00', creadoPor: VD_DIEGO,
    actualizadoEn: '2026-09-01T09:00:00-04:00', actualizadoPor: VD_DIEGO, version: 9 },
  { id: 'cl-farmacia-bogado', tipo: 'empresa', nombre: 'Farmacia Bogado', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_MARTA, etapa: 'perdido', ciudad: 'Asunción',
    ultimaInteraccionEn: '2026-08-31T09:00:00-04:00', proximoPasoEn: null,
    motivoPerdida: 'Cerró la sucursal donde se usaba Merma IA.', archivadoEn: null,
    creadoEn: '2026-03-15T09:00:00-04:00', creadoPor: VD_MARTA,
    actualizadoEn: '2026-08-31T09:00:00-04:00', actualizadoPor: VD_MARTA, version: 7 },
  { id: 'cl-distribuidora-abc', tipo: 'empresa', nombre: 'Distribuidora ABC', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_DIEGO, etapa: 'cliente_activo', ciudad: 'Ciudad del Este',
    ultimaInteraccionEn: '2026-09-05T09:00:00-04:00', proximoPasoEn: null, motivoPerdida: null,
    archivadoEn: null, creadoEn: '2026-07-28T09:00:00-04:00', creadoPor: VD_DIEGO,
    actualizadoEn: '2026-09-05T09:00:00-04:00', actualizadoPor: VD_DIEGO, version: 3 },
  { id: 'cl-panaderia-espiga', tipo: 'empresa', nombre: 'Panadería La Espiga', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_DIEGO, etapa: 'cotizacion', ciudad: 'Fernando de la Mora',
    ultimaInteraccionEn: '2026-09-13T09:00:00-04:00', proximoPasoEn: '2026-09-18T09:00:00-04:00', motivoPerdida: null,
    archivadoEn: null, creadoEn: '2026-09-01T09:00:00-04:00', creadoPor: VD_DIEGO,
    actualizadoEn: '2026-09-13T09:00:00-04:00', actualizadoPor: VD_DIEGO, version: 3 },
  { id: 'cl-veterinaria-san-francisco', tipo: 'empresa', nombre: 'Veterinaria San Francisco', actividadId: ACTIVIDAD_GENERICA,
    operacionesConfirmadas: [], vendedorId: VD_MARTA, etapa: 'cotizacion', ciudad: 'Lambaré',
    ultimaInteraccionEn: '2026-09-14T09:00:00-04:00', proximoPasoEn: '2026-09-20T09:00:00-04:00', motivoPerdida: null,
    archivadoEn: null, creadoEn: '2026-08-22T09:00:00-04:00', creadoPor: VD_MARTA,
    actualizadoEn: '2026-09-14T09:00:00-04:00', actualizadoPor: VD_MARTA, version: 4 },
];

let lineasDeTiempo: Record<Id, EventoLineaTiempo[]> = {
  'cl-repuestos-anibal': [
    { id: 'ev-1', clienteId: 'cl-repuestos-anibal', tipo: 'cotizacion', ocurridoEn: '2026-08-02T09:00:00-04:00',
      titulo: 'Cotización aprobada — Agendar.IA', detalle: 'Setup y mensualidad aceptados.', referenciaId: 'cot-hist-1' },
    { id: 'ev-2', clienteId: 'cl-repuestos-anibal', tipo: 'mensualidad', ocurridoEn: '2026-09-05T09:00:00-04:00',
      titulo: 'Mensualidad de septiembre cobrada', detalle: null, referenciaId: 'me-1' },
  ],
  'cl-ferreteria-central': [
    { id: 'ev-3', clienteId: 'cl-ferreteria-central', tipo: 'cotizacion', ocurridoEn: '2026-08-20T09:00:00-04:00',
      titulo: 'Cotización aprobada — Cotiza Fácil', detalle: 'El setup sigue pendiente de cobro.', referenciaId: 'cot-hist-3' },
  ],
  'cl-panaderia-espiga': [
    { id: 'ev-4', clienteId: 'cl-panaderia-espiga', tipo: 'cotizacion', ocurridoEn: '2026-09-13T09:00:00-04:00',
      titulo: 'Cotización enviada a revisión — Agendar.IA', detalle: null, referenciaId: 'cot-rev-1' },
  ],
  'cl-veterinaria-san-francisco': [
    { id: 'ev-5', clienteId: 'cl-veterinaria-san-francisco', tipo: 'cotizacion', ocurridoEn: '2026-09-14T09:00:00-04:00',
      titulo: 'Cotización corregida, reenviada a revisión — Park.IA Base', detalle: 'Versión 2 tras observaciones del CEO.', referenciaId: 'cot-rev-2' },
  ],
};

// ---------------------------------------------------------------------------
// Cola de aprobación de cotizaciones
// ---------------------------------------------------------------------------

function baseParaAlternativas(setupEspecial: number, mensualEspecial: number, moneda: Moneda = 'PYG') {
  return {
    setupLista: dinero(setupEspecial, moneda),
    setupEspecial: dinero(setupEspecial, moneda),
    mensualLista: dinero(mensualEspecial, moneda),
    mensualEspecial: dinero(mensualEspecial, moneda),
  };
}

function comparacion(productoId: ProductoId, setupEspecial: Dinero, mensualEspecial: Dinero): ComparacionConLista {
  return {
    productoId, precioListaSetup: null, setupEspecial, desviacionSetup: null, desviacionSetupPorcentaje: null,
    precioListaMensualidad: null, mensualEspecial, desviacionMensualidad: null, desviacionMensualidadPorcentaje: null,
    sinPrecioDeLista: true,
  };
}

let cotizacionesEnCola: CotizacionDetalle[] = [
  {
    id: 'cot-rev-1', tipo: 'cotizacion', folio: 'COT-2026-0041', version: 1, estado: 'en_revision',
    destinatario: {
      clienteId: 'cl-panaderia-espiga', tipo: 'empresa', nombreCliente: 'Rosa Espínola',
      nombreEmpresaOProfesional: 'Panadería La Espiga', profesion: null, ruc: null, ciudad: 'Fernando de la Mora',
    },
    objeto: { productoId: 'agendar-ia', nombreProducto: NOMBRE_PRODUCTO['agendar-ia'], variante: null },
    vendedorId: VD_DIEGO, nombreVendedor: nombreVendedor(VD_DIEGO),
    fechaEmision: '2026-09-13', fechaValidez: '2026-09-27',
    precios: {
      setupLista: dinero(3_000_000), setupEspecial: dinero(2_700_000), ahorroSetup: dinero(300_000), ahorroSetupPorcentaje: 10,
      mensualLista: dinero(790_000), mensualEspecial: dinero(750_000), ahorroMensual: dinero(40_000), ahorroMensualPorcentaje: 5.06,
    },
    alternativas: calcularAlternativas(baseParaAlternativas(2_700_000, 750_000)),
    condiciones: {
      permanenciaMinimaMeses: 12,
      instalacion: {
        descripcion: 'Instalación remota con una visita técnica al local para configurar cámaras y accesos.',
        tiempoEstimadoDiasHabiles: 7, tiempoEstimadoTexto: 'hasta 7 días hábiles desde la aceptación',
        aportesDelCliente: [
          { tipo: 'acceso', descripcion: 'Acceso a la red WiFi del local', bloqueante: true },
          { tipo: 'informacion', descripcion: 'Horarios de atención y turnos del personal', bloqueante: false },
        ],
      },
      alcance: {
        queIncluye: ['Configuración inicial de la agenda', 'Capacitación al personal', 'Soporte durante el primer mes'],
        queNoIncluye: ['Compra de equipos adicionales', 'Integraciones con sistemas de terceros no listados'],
        limitesIncluidos: ['Hasta 3 usuarios administradores'],
      },
      basesYCondiciones: 'Cotización sujeta a disponibilidad de agenda de instalación. Precios en guaraníes.',
      tratamientoIva: 'IVA no especificado en la lista vigente.',
      notasInternas: null,
    },
    logos: { labIa: 'labia', rgrlkGroup: 'rgrlk-group', producto: 'agendar-ia', variante: null },
    totalesPorMoneda: agrupar([dinero(2_700_000), dinero(750_000)]),
    presentacionId: 'pre-1', versionCatalogo: 1, motivoPerdida: null,
    creadoEn: '2026-09-13T09:00:00-04:00', creadoPor: VD_DIEGO,
    actualizadoEn: '2026-09-13T09:00:00-04:00', actualizadoPor: VD_DIEGO,
    revision: {
      id: 'rev-1', cotizacionId: 'cot-rev-1', version: 1, vendedorId: VD_DIEGO, revisorId: null,
      estado: 'pendiente', creadoEn: '2026-09-13T09:05:00-04:00', resueltoEn: null,
      eventos: [
        { id: 'evr-1', cotizacionId: 'cot-rev-1', version: 1, actorId: VD_DIEGO, accion: 'enviar',
          comentario: 'Primera cotización para Panadería La Espiga.', ocurridoEn: '2026-09-13T09:05:00-04:00' },
      ],
      calculosRecalculados: false, alternativasAprobadas: [],
    },
    versiones: [
      { version: 1, estado: 'en_revision', creadaEn: '2026-09-13T09:00:00-04:00', creadaPor: VD_DIEGO,
        totalesPorMoneda: agrupar([dinero(2_700_000), dinero(750_000)]), motivoCambio: null },
    ],
    documentos: [], enlaces: [],
    comparacion: comparacion('agendar-ia', dinero(2_700_000), dinero(750_000)),
    firmas: [
      { id: 'firma-1', rol: 'vendedor', firmanteId: VD_DIEGO, nombreFirmante: nombreVendedor(VD_DIEGO),
        aclaracion: `${nombreVendedor(VD_DIEGO)} — Vendedor`, referenciaProtegida: 'firma-protegida-diego-1',
        firmadoEn: '2026-09-13T09:04:00-04:00', versionFirmada: 1, anulada: false, anuladaEn: null, motivoAnulacion: null },
    ],
    avisos: [],
  },
  {
    id: 'cot-rev-2', tipo: 'cotizacion', folio: 'COT-2026-0038', version: 2, estado: 'en_revision',
    destinatario: {
      clienteId: 'cl-veterinaria-san-francisco', tipo: 'empresa', nombreCliente: 'Julio César Ayala',
      nombreEmpresaOProfesional: 'Veterinaria San Francisco', profesion: null, ruc: null, ciudad: 'Lambaré',
    },
    objeto: { productoId: 'park-ia', nombreProducto: NOMBRE_PRODUCTO['park-ia'], variante: 'Base' },
    vendedorId: VD_MARTA, nombreVendedor: nombreVendedor(VD_MARTA),
    fechaEmision: '2026-09-14', fechaValidez: '2026-09-28',
    precios: {
      setupLista: dinero(2_900_000), setupEspecial: dinero(2_900_000), ahorroSetup: dinero(0), ahorroSetupPorcentaje: 0,
      mensualLista: dinero(490_000), mensualEspecial: dinero(450_000), ahorroMensual: dinero(40_000), ahorroMensualPorcentaje: 8.16,
    },
    alternativas: calcularAlternativas(baseParaAlternativas(2_900_000, 450_000)),
    condiciones: {
      permanenciaMinimaMeses: 12,
      instalacion: {
        descripcion: 'Instalación en el estacionamiento del local, con provisión de cámaras por parte de Lab.IA.',
        tiempoEstimadoDiasHabiles: 10, tiempoEstimadoTexto: 'hasta 10 días hábiles desde la aceptación',
        aportesDelCliente: [
          { tipo: 'acceso', descripcion: 'Acceso al tablero eléctrico del estacionamiento', bloqueante: true },
          { tipo: 'equipo', descripcion: 'Conexión a internet cableada disponible en el lugar de instalación', bloqueante: true },
        ],
      },
      alcance: {
        queIncluye: ['Control de acceso vehicular', 'Reportes mensuales de ocupación'],
        queNoIncluye: ['Obra civil', 'Reposición de cámaras dañadas por terceros'],
        limitesIncluidos: ['Hasta 2 accesos vehiculares'],
      },
      basesYCondiciones: 'Cotización corregida tras observación del CEO sobre el alcance de la instalación.',
      tratamientoIva: 'IVA no especificado en la lista vigente.',
      notasInternas: 'Versión 2: se agregó el requisito de conexión cableada a pedido de revisión.',
    },
    logos: { labIa: 'labia', rgrlkGroup: 'rgrlk-group', producto: 'park-ia', variante: null },
    totalesPorMoneda: agrupar([dinero(2_900_000), dinero(450_000)]),
    presentacionId: 'pre-2', versionCatalogo: 1, motivoPerdida: null,
    creadoEn: '2026-09-08T09:00:00-04:00', creadoPor: VD_MARTA,
    actualizadoEn: '2026-09-14T09:00:00-04:00', actualizadoPor: VD_MARTA,
    revision: {
      id: 'rev-2', cotizacionId: 'cot-rev-2', version: 2, vendedorId: VD_MARTA, revisorId: null,
      estado: 'pendiente', creadoEn: '2026-09-14T09:10:00-04:00', resueltoEn: null,
      eventos: [
        { id: 'evr-2', cotizacionId: 'cot-rev-2', version: 1, actorId: VD_MARTA, accion: 'enviar',
          comentario: 'Primer envío.', ocurridoEn: '2026-09-08T09:00:00-04:00' },
        { id: 'evr-3', cotizacionId: 'cot-rev-2', version: 1, actorId: ADMIN, accion: 'corregir',
          comentario: 'Falta especificar quién aporta la conexión a internet para la instalación.', ocurridoEn: '2026-09-10T09:00:00-04:00' },
        { id: 'evr-4', cotizacionId: 'cot-rev-2', version: 2, actorId: VD_MARTA, accion: 'enviar',
          comentario: 'Corregido: se agregó el aporte de conexión cableada.', ocurridoEn: '2026-09-14T09:10:00-04:00' },
      ],
      calculosRecalculados: false, alternativasAprobadas: [],
    },
    versiones: [
      { version: 1, estado: 'corregida', creadaEn: '2026-09-08T09:00:00-04:00', creadaPor: VD_MARTA,
        totalesPorMoneda: agrupar([dinero(2_900_000), dinero(450_000)]), motivoCambio: null },
      { version: 2, estado: 'en_revision', creadaEn: '2026-09-14T09:10:00-04:00', creadaPor: VD_MARTA,
        totalesPorMoneda: agrupar([dinero(2_900_000), dinero(450_000)]), motivoCambio: 'Se agregó el aporte de conexión cableada.' },
    ],
    documentos: [], enlaces: [],
    comparacion: comparacion('park-ia', dinero(2_900_000), dinero(450_000)),
    firmas: [
      { id: 'firma-2', rol: 'vendedor', firmanteId: VD_MARTA, nombreFirmante: nombreVendedor(VD_MARTA),
        aclaracion: `${nombreVendedor(VD_MARTA)} — Vendedora`, referenciaProtegida: 'firma-protegida-marta-2',
        firmadoEn: '2026-09-14T09:09:00-04:00', versionFirmada: 2, anulada: false, anuladaEn: null, motivoAnulacion: null },
    ],
    avisos: [],
  },
];

let firmasCeo: Firma[] = [];

// ---------------------------------------------------------------------------
// Constancias
// ---------------------------------------------------------------------------

let constancias: ConstanciaRespuesta[] = [
  {
    id: 'ct-1', clienteId: 'cl-hotel-palmeras', nombreCliente: 'Hotel Las Palmeras', cotizacionId: 'cot-hist-4',
    folio: 'COT-2025-0190', versionCotizacion: 1, opcionSeleccionada: 'estandar',
    importesAceptados: {
      codigo: 'estandar', nombre: 'Plan estándar', totalFinal: dinero(7_800_000), setupAPagar: dinero(600_000),
      importeCuota: dinero(600_000), cantidadCuotas: 12, mesesServicio: 12, permanenciaMinimaMeses: 12,
      formaDePago: 'Setup al inicio y 12 mensualidades.',
    },
    respondidaEn: '2025-11-14T15:30:00-04:00', venceEn: '2025-11-21T15:30:00-04:00',
    textoAceptacion: 'He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos.',
    enlaceId: 'enl-1', huellaDocumento: 'huella-doc-cot-hist-4-v1', naturaleza: 'constancia_comercial',
  },
];

let notificacionesPorConstancia: Record<Id, ResultadoNotificaciones> = {
  'ct-1': {
    constanciaId: 'ct-1',
    notificaciones: [
      { id: 'no-1', constanciaId: 'ct-1', canal: 'celular_vendedor', destinoProtegido: 'destino-vendedor-diego',
        estado: 'enviada', intentos: 1, ultimoIntentoEn: '2025-11-14T15:31:00-04:00', proximoIntentoEn: null, error: null },
      { id: 'no-2', constanciaId: 'ct-1', canal: 'whatsapp_corporativo', destinoProtegido: 'destino-whatsapp-corporativo',
        estado: 'enviada', intentos: 1, ultimoIntentoEn: '2025-11-14T15:31:00-04:00', proximoIntentoEn: null, error: null },
      { id: 'no-3', constanciaId: 'ct-1', canal: 'celular_ceo', destinoProtegido: 'destino-celular-ceo',
        estado: 'fallida', intentos: 2, ultimoIntentoEn: '2025-11-14T15:32:00-04:00',
        proximoIntentoEn: '2025-11-14T16:32:00-04:00', error: 'El servicio de mensajería no respondió a tiempo.' },
      { id: 'no-4', constanciaId: 'ct-1', canal: 'panel_administracion', destinoProtegido: 'destino-panel',
        estado: 'enviada', intentos: 1, ultimoIntentoEn: '2025-11-14T15:31:00-04:00', proximoIntentoEn: null, error: null },
    ],
    constanciaGuardada: true, avisosPendientes: 1,
  },
};

// ---------------------------------------------------------------------------
// Taxonomía pendiente (sólo lo que ve Configuración comercial)
// ---------------------------------------------------------------------------

let actividadesPendientes: Actividad[] = [
  { id: 'act-criadero-pollos', nombre: 'Criadero de pollos', sinonimos: ['avícola'],
    estado: 'pendiente_de_revision', creadaPor: VD_DIEGO, creadaEn: '2026-09-09T10:00:00-04:00', fusionadaEn: null },
  { id: 'act-gomeria-movil', nombre: 'Gomería móvil', sinonimos: [],
    estado: 'pendiente_de_revision', creadaPor: VD_MARTA, creadaEn: '2026-09-11T10:00:00-04:00', fusionadaEn: null },
];

// ---------------------------------------------------------------------------
// Sugerencias de nuevos productos
// ---------------------------------------------------------------------------

let sugerencias: SugerenciaProducto[] = [
  {
    id: 'sg-1', titulo: 'Control de stock para taller mecánico', problemaCliente: 'No sabe qué repuestos tiene en el depósito hasta que los busca.',
    clienteId: 'cl-repuestos-anibal', actividadId: ACTIVIDAD_GENERICA, frecuenciaObservada: 'ocasional',
    productosQueNoAlcanzan: ['radar-stock'], porQueNoAlcanzan: 'Radar Stock está pensado para comercio minorista, no para repuestos por número de pieza.',
    adjuntos: [], creadaPor: VD_MARTA, creadaEn: '2026-08-28T10:00:00-04:00',
    estado: 'en_evaluacion', resolucion: null, productoQueLoCubre: null, duplicadaDe: null, resueltaPor: null, resueltaEn: null,
  },
  {
    id: 'sg-2', titulo: 'Recordatorios de vacunación para veterinarias', problemaCliente: 'Se olvida de avisarle al dueño de la mascota cuándo toca la próxima vacuna.',
    clienteId: 'cl-veterinaria-san-francisco', actividadId: ACTIVIDAD_GENERICA, frecuenciaObservada: 'frecuente',
    productosQueNoAlcanzan: ['vendedor-24-7'], porQueNoAlcanzan: 'Vendedor 24/7 atiende consultas pero no programa recordatorios periódicos.',
    adjuntos: [], creadaPor: VD_MARTA, creadaEn: '2026-09-01T10:00:00-04:00',
    estado: 'recibida', resolucion: null, productoQueLoCubre: null, duplicadaDe: null, resueltaPor: null, resueltaEn: null,
  },
  {
    id: 'sg-3', titulo: 'Agenda de turnos para peluquería', problemaCliente: 'Quiere que los clientes reserven turno solos.',
    clienteId: null, actividadId: ACTIVIDAD_GENERICA, frecuenciaObservada: 'unica',
    productosQueNoAlcanzan: [], porQueNoAlcanzan: 'El vendedor no revisó Agendar.IA antes de sugerir.',
    adjuntos: [], creadaPor: VD_DIEGO, creadaEn: '2026-08-15T10:00:00-04:00',
    estado: 'ya_cubierta_por_producto_existente',
    resolucion: 'Agendar.IA ya resuelve reservas de turno con recordatorios automáticos.',
    productoQueLoCubre: 'agendar-ia', duplicadaDe: null, resueltaPor: ADMIN, resueltaEn: '2026-08-16T10:00:00-04:00',
  },
];

// ---------------------------------------------------------------------------
// Accesos y frecuencia de uso
// ---------------------------------------------------------------------------

let usoPorVendedor: Array<{
  readonly vendedorId: Id; readonly ultimoIngresoEn: ISODate | null; readonly ingresosEnPeriodo: number;
  readonly planesCreados: number; readonly seguimientosRegistrados: number; readonly cotizacionesEnviadas: number;
}> = [
  { vendedorId: VD_MARTA, ultimoIngresoEn: `${HOY}T08:12:00-04:00`, ingresosEnPeriodo: 22, planesCreados: 6, seguimientosRegistrados: 14, cotizacionesEnviadas: 3 },
  { vendedorId: VD_DIEGO, ultimoIngresoEn: '2026-09-12T14:40:00-04:00', ingresosEnPeriodo: 9, planesCreados: 3, seguimientosRegistrados: 7, cotizacionesEnviadas: 2 },
  { vendedorId: VD_LAURA, ultimoIngresoEn: '2026-08-08T09:20:00-04:00', ingresosEnPeriodo: 1, planesCreados: 0, seguimientosRegistrados: 1, cotizacionesEnviadas: 0 },
];

let registroAcceso: RegistroAcceso[] = [
  { id: 'ra-1', actorId: VD_MARTA, nombreActor: nombreVendedor(VD_MARTA), rol: 'vendedor', accion: 'ingreso',
    entidadTipo: 'usuario', entidadId: VD_MARTA, valorAnterior: null, valorPosterior: null,
    ocurridoEn: `${HOY}T08:12:00-04:00`, origenSesion: { tipoDispositivo: 'escritorio', paisAproximado: 'Paraguay' } },
  { id: 'ra-2', actorId: VD_DIEGO, nombreActor: nombreVendedor(VD_DIEGO), rol: 'vendedor', accion: 'ingreso',
    entidadTipo: 'usuario', entidadId: VD_DIEGO, valorAnterior: null, valorPosterior: null,
    ocurridoEn: '2026-09-12T14:40:00-04:00', origenSesion: { tipoDispositivo: 'celular', paisAproximado: 'Paraguay' } },
  { id: 'ra-3', actorId: 'desconocido', nombreActor: 'Intento no identificado', rol: 'vendedor', accion: 'intento_fallido',
    entidadTipo: 'usuario', entidadId: null, valorAnterior: null, valorPosterior: null,
    ocurridoEn: '2026-09-14T02:15:00-04:00', origenSesion: { tipoDispositivo: 'desconocido', paisAproximado: null } },
  { id: 'ra-4', actorId: ADMIN, nombreActor: nombreVendedor(ADMIN), rol: 'administrador', accion: 'cambio_participacion',
    entidadTipo: 'participacion', entidadId: 'pp-ojo-digital-1', valorAnterior: null, valorPosterior: null,
    ocurridoEn: '2026-01-01T09:00:00-04:00', origenSesion: { tipoDispositivo: 'escritorio', paisAproximado: 'Paraguay' } },
];

let aperturasEnlace: AccesoEnlace[] = [
  { id: 'ae-1', enlaceId: 'enl-1', documentoId: 'doc-cot-hist-4', tipoDocumento: 'cotizacion',
    ocurridoEn: '2025-11-14T15:20:00-04:00', tipoDispositivo: 'celular', paisAproximado: 'Paraguay',
    duracionSegundos: 95, resultado: 'ok' },
  { id: 'ae-2', enlaceId: 'enl-2', documentoId: 'doc-pre-1', tipoDocumento: 'presentacion',
    ocurridoEn: '2026-09-13T18:40:00-04:00', tipoDispositivo: 'celular', paisAproximado: 'Paraguay',
    duracionSegundos: 210, resultado: 'ok' },
];

// ---------------------------------------------------------------------------
// Parámetros del sistema y proveedores
// ---------------------------------------------------------------------------

let parametros: ParametrosSistema = {
  diasSinContactoParaSenal: 7,
  diasSinAperturaParaSenal: 3,
  diasSinEntrarParaInactivo: 30,
  vigenciaCotizacionDias: 14,
  vigenciaEnlaceDias: 30,
  retencionAudioDias: 90,
  monedasHabilitadas: ['PYG', 'USD'],
  tipoCambioInstitucional: null,
};

const estadoProveedores: EstadoProveedores = {
  busqueda: [{ nombre: 'Proveedor de búsqueda (contrato)', tipo: 'buscador', disponible: true }],
  registrosPublicos: [{ nombre: 'Proveedor de registros públicos (contrato)', pais: 'Paraguay', identificadoresSoportados: ['ruc', 'razon_social'], disponible: true }],
  modeloLenguaje: [{ nombre: 'Proveedor de modelo de lenguaje (contrato)', usos: ['inferir', 'clasificar', 'redactar'], disponible: true }],
  modoRespaldo: false,
  verificadoEn: `${HOY}T07:00:00-04:00`,
};

// ---------------------------------------------------------------------------
// Catálogo — sólo publicación (los 13, cerrado)
// ---------------------------------------------------------------------------

let productos: Producto[] = (Object.keys(NOMBRE_PRODUCTO) as ProductoId[]).map((id, indice) => ({
  id,
  nombre: NOMBRE_PRODUCTO[id],
  familia: indice < 9 ? 'especifica' : 'integral',
  orden: indice + 1,
  claveCopy: id,
  aliasHistoricos: id === 'faro-digital' ? ['FARO Inteligente'] : [],
  publicado: true,
}));

// ---------------------------------------------------------------------------
// Derivación de las cifras
// ---------------------------------------------------------------------------

function lineasHasta(periodo: PeriodoMensual): LineaParticipacion[] {
  return lineasParticipacion.filter((l) => periodoOAnterior(l.periodo, periodo));
}

function calcularVerificacionCierre(periodo: PeriodoMensual): VerificacionCierre {
  const cotizacionesSinResolver = cotizacionesEnCola.filter((c) => c.estado === 'en_revision').length;
  const observacionesAbiertas = observaciones.filter((o) => o.estado === 'abierta').length;
  const cobrosSinConfirmar = lineasPorCobrar.length;
  const bloqueos: Array<VerificacionCierre['bloqueos'][number]> = [];
  if (cotizacionesSinResolver > 0) {
    bloqueos.push({ tipo: 'cotizaciones_sin_resolver', cantidad: cotizacionesSinResolver, detalle: 'Hay cotizaciones esperando aprobación, corrección o rechazo.' });
  }
  if (cobrosSinConfirmar > 0) {
    bloqueos.push({ tipo: 'cobros_sin_confirmar', cantidad: cobrosSinConfirmar, detalle: 'Hay ventas por cobrar sin confirmar el ingreso del dinero.' });
  }
  if (observacionesAbiertas > 0) {
    bloqueos.push({ tipo: 'observaciones_abiertas', cantidad: observacionesAbiertas, detalle: 'Hay observaciones de vendedores todavía sin resolver.' });
  }
  return { periodo, puedeCerrar: bloqueos.length === 0, bloqueos };
}

function resumenParaVendedor(vendedorId: Id, periodo: PeriodoMensual) {
  const lineas = lineasHasta(periodo).filter((l) => l.vendedorId === vendedorId);
  const vendido = agrupar(lineas.map((l) => l.baseCobrada));
  const cobrado = vendido; // en este modelo, toda línea nace de un cobro confirmado
  const porCobrarLineas = lineasPorCobrar.filter((l) => l.vendedorId === vendedorId);
  const porCobrar = agrupar(porCobrarLineas.map((l) => l.importe));
  const parteLabIA = agrupar(lineas.map((l) => l.parteLabIA));
  const parteVendedor = agrupar(lineas.map((l) => l.parteVendedor));
  const comisionPendiente = agrupar(lineas.filter((l) => l.estado === 'devengada').map((l) => l.parteVendedor));
  const comisionPagada = agrupar(lineas.filter((l) => l.estado === 'liquidada').map((l) => l.parteVendedor));
  const mensualidadesDelVendedor = mensualidades.filter((m) => m.vendedorId === vendedorId && m.estado === 'activa');
  return {
    vendido, cobrado, porCobrar, parteLabIA, parteVendedor, comisionPendiente, comisionPagada,
    mensualidadesVigentes: {
      cantidad: mensualidadesDelVendedor.length,
      importe: agrupar(mensualidadesDelVendedor.map((m) => m.importe)),
    },
  };
}

// ---------------------------------------------------------------------------
// Contador para ids generados en escrituras
// ---------------------------------------------------------------------------

let contadorId = 1000;
function id(prefijo: string): Id {
  contadorId += 1;
  return `${prefijo}-${contadorId}`;
}

/** Doble emisión con la misma clave de idempotencia ⇒ misma entidad. */
const clavesUsadas = new Map<ClaveIdempotencia, unknown>();
function conIdempotencia<T>(clave: ClaveIdempotencia, crear: () => T): T {
  if (clavesUsadas.has(clave)) return clavesUsadas.get(clave) as T;
  const resultado = crear();
  clavesUsadas.set(clave, resultado);
  return resultado;
}

// ===========================================================================
// Fábrica
// ===========================================================================

/**
 * Arma la implementación mock de `CapaDinero & CapaAdministracion`.
 *
 * `actorId` simula al usuario administrador autenticado: hace falta para
 * defender "nadie aprueba su propia cotización" sin que el contrato de
 * `revisarCotizacion` reciba el actor como parámetro explícito.
 */
export function crearCapaFinanzas(
  config: ConfiguracionMock = CONFIGURACION_POR_DEFECTO,
  actorId: Id = config.rol === 'administrador' ? ADMIN : VD_MARTA,
): CapaDinero & CapaAdministracion {
  const exigirAdministrador = (): Resultado<void> => {
    if (config.rol !== 'administrador') return sinPermiso('Esta sección es sólo para administradores.') as Resultado<void>;
    return { ok: true, datos: undefined };
  };

  return {
    // -----------------------------------------------------------------
    // CapaDinero
    // -----------------------------------------------------------------
    async resumenDinero(periodo) {
      if (config.forzarVacio) {
        const vacio: TotalesPorMoneda = [];
        return responder(config, {
          periodo, vendido: vacio, cobrado: vacio, porCobrar: vacio, parteLabIA: vacio, parteVendedor: vacio,
          comisionPendiente: vacio, comisionPagada: vacio, mensualidadesVigentes: { cantidad: 0, importe: vacio },
        });
      }
      const r = resumenParaVendedor(actorId, periodo);
      return responder(config, { periodo, ...r });
    },

    async listarMensualidades(filtro, pagina) {
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = mensualidades.filter((m) => m.vendedorId === actorId || config.rol === 'administrador');
      if (filtro.clienteId) items = items.filter((m) => m.clienteId === filtro.clienteId);
      if (filtro.productoId) items = items.filter((m) => m.productoId === filtro.productoId);
      if (filtro.vendedorId) items = items.filter((m) => m.vendedorId === filtro.vendedorId);
      if (filtro.estado) items = items.filter((m) => m.estado === filtro.estado);
      if (config.rol !== 'administrador') items = items.filter((m) => m.vendedorId === actorId);
      return responder(config, paginar(items, pagina));
    },

    async listarLineasParticipacion(periodo, pagina) {
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = lineasParticipacion.filter((l) => l.periodo === periodo);
      if (config.rol !== 'administrador') items = items.filter((l) => l.vendedorId === actorId);
      return responder(config, paginar(items, pagina));
    },

    async listarLiquidaciones(pagina) {
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      const items = config.rol === 'administrador' ? liquidaciones : liquidaciones.filter((l) => l.vendedorId === actorId);
      return responder(config, paginar(items, pagina));
    },

    async obtenerLiquidacion(idLiquidacion) {
      const liquidacion = liquidaciones.find((l) => l.id === idLiquidacion);
      if (!liquidacion) return noEncontrado('No encontramos esa liquidación.');
      if (config.rol !== 'administrador' && liquidacion.vendedorId !== actorId) {
        return sinPermiso('No podés ver la liquidación de otro vendedor.');
      }
      const detalle: LiquidacionDetalle = {
        ...liquidacion,
        lineas: lineasParticipacion.filter((l) => l.liquidacionId === idLiquidacion),
        ajustes: ajustes.filter((a) => a.liquidacionOrigenId === idLiquidacion),
      };
      return responder(config, detalle);
    },

    async abrirObservacion(datos, clave) {
      const linea = lineasParticipacion.find((l) => l.id === datos.lineaParticipacionId);
      if (!linea) return validacion('La línea que querés observar no existe.', 'lineaParticipacionId');
      const nueva = conIdempotencia(clave, (): Observacion => ({
        id: id('ob'), lineaParticipacionId: datos.lineaParticipacionId, abiertaPor: actorId,
        descripcion: datos.descripcion, estado: 'abierta', resolucion: null, resueltaPor: null,
        resueltaEn: null, abiertaEn: `${HOY}T12:00:00-04:00`,
      }));
      if (!observaciones.some((o) => o.id === nueva.id)) observaciones = [...observaciones, nueva];
      return responder(config, nueva);
    },

    // -----------------------------------------------------------------
    // CapaAdministracion — Control financiero
    // -----------------------------------------------------------------
    async controlFinanciero(periodo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) {
        const vacio: TotalesPorMoneda = [];
        return responder(config, {
          periodo, vendido: vacio, cobrado: vacio, porCobrar: vacio, parteLabIA: vacio, parteVendedores: vacio,
          comisionPendiente: vacio, comisionPagada: vacio, mensualidadesActivas: 0, bajasDelPeriodo: 0,
          cotizacionesEnRevision: 0, sugerenciasSinResponder: 0,
        });
      }
      const lineas = lineasHasta(periodo);
      const vendido = agrupar(lineas.map((l) => l.baseCobrada));
      const cobrado = vendido;
      const porCobrar = agrupar(lineasPorCobrar.map((l) => l.importe));
      const parteLabIA = agrupar(lineas.map((l) => l.parteLabIA));
      const parteVendedores = agrupar(lineas.map((l) => l.parteVendedor));
      const comisionPendiente = agrupar(lineas.filter((l) => l.estado === 'devengada').map((l) => l.parteVendedor));
      const comisionPagada = agrupar(lineas.filter((l) => l.estado === 'liquidada').map((l) => l.parteVendedor));
      const bajasDelPeriodo = mensualidades.filter((m) => m.estado === 'baja' && m.bajaEn?.startsWith(periodo)).length;
      return responder(config, {
        periodo, vendido, cobrado, porCobrar, parteLabIA, parteVendedores, comisionPendiente, comisionPagada,
        mensualidadesActivas: mensualidades.filter((m) => m.estado === 'activa').length,
        bajasDelPeriodo,
        cotizacionesEnRevision: cotizacionesEnCola.filter((c) => c.estado === 'en_revision').length,
        sugerenciasSinResponder: sugerencias.filter((s) => s.estado === 'recibida' || s.estado === 'en_evaluacion').length,
      });
    },

    async porCobrar(vendedorId, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      const items = vendedorId ? lineasPorCobrar.filter((l) => l.vendedorId === vendedorId) : lineasPorCobrar;
      return responder(config, paginar(items, pagina));
    },

    async rankingVendedores(periodo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, []);
      const vendedores = usuarios.filter((u) => u.rol === 'vendedor');
      const filas: FilaRanking[] = vendedores
        .map((v) => {
          const lineas = lineasHasta(periodo).filter((l) => l.vendedorId === v.id && l.baseCobrada.moneda === 'PYG');
          const vendidoPyg = lineas.reduce((suma, l) => suma + l.baseCobrada.monto, 0);
          const cobradoPyg = vendidoPyg;
          const presupuesto = presupuestos.find((p) => p.vendedorId === v.id && p.periodo === periodo) ?? null;
          const meta = presupuesto?.metaVendido.monto ?? null;
          return {
            posicion: 0, vendedorId: v.id, nombreVendedor: v.nombre,
            vendido: dinero(vendidoPyg), cobrado: dinero(cobradoPyg),
            metaVendido: presupuesto ? presupuesto.metaVendido : null,
            cumplimientoGuaranies: meta !== null ? dinero(vendidoPyg - meta) : null,
            cumplimientoPorcentaje: meta ? Math.round((vendidoPyg / meta) * 1000) / 10 : null,
          };
        })
        .sort((a, b) => b.vendido.monto - a.vendido.monto)
        .map((fila, indice) => ({ ...fila, posicion: indice + 1 }));
      return responder(config, filas);
    },

    // -- Presupuesto --
    async listarPresupuestos(periodo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, []);
      return responder(config, presupuestos.filter((p) => p.periodo === periodo));
    },

    async definirPresupuesto(datos, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const nuevo = conIdempotencia(clave, (): Presupuesto => {
        const existente = presupuestos.find((p) => p.vendedorId === datos.vendedorId && p.periodo === datos.periodo);
        return {
          id: existente?.id ?? id('pr'),
          vendedorId: datos.vendedorId, nombreVendedor: nombreVendedor(datos.vendedorId), periodo: datos.periodo,
          metaVendido: datos.metaVendido, metaCobrado: datos.metaCobrado ?? null,
          definidoPor: actorId, definidoEn: `${HOY}T12:00:00-04:00`, version: (existente?.version ?? 0) + 1,
        };
      });
      presupuestos = [...presupuestos.filter((p) => p.id !== nuevo.id), nuevo];
      return responder(config, nuevo);
    },

    // -- Comisiones --
    async listarParticipacionesTodas(periodo, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      return responder(config, paginar(lineasParticipacion.filter((l) => l.periodo === periodo), pagina));
    },

    async verificarCierrePeriodo(periodo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      return responder(config, calcularVerificacionCierre(periodo));
    },

    async cerrarPeriodo(periodo, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const verificacion = calcularVerificacionCierre(periodo);
      if (!verificacion.puedeCerrar) {
        return {
          ok: false,
          error: { codigo: 'regla_comercial', mensajeAmable: 'No se puede cerrar el período: hay pendientes sin resolver.', detalle: verificacion.bloqueos },
        };
      }
      const nuevas = conIdempotencia(clave, (): Liquidacion[] => {
        const vendedores = [...new Set(lineasParticipacion.filter((l) => l.periodo === periodo && l.estado === 'devengada').map((l) => l.vendedorId))];
        return vendedores.map((vendedorId) => ({
          id: id('liq'), vendedorId, periodo,
          totalesPorMoneda: agrupar(lineasParticipacion.filter((l) => l.periodo === periodo && l.vendedorId === vendedorId).map((l) => l.parteVendedor)),
          estado: 'cerrada', cerradaEn: `${HOY}T12:00:00-04:00`, cerradaPor: actorId,
          comprobanteDocumentoId: id('doc'),
        }));
      });
      lineasParticipacion = lineasParticipacion.map((l) => {
        if (l.periodo !== periodo || l.estado !== 'devengada') return l;
        const liquidacion = nuevas.find((n) => n.vendedorId === l.vendedorId);
        return liquidacion ? { ...l, estado: 'liquidada', liquidacionId: liquidacion.id } : l;
      });
      liquidaciones = [...liquidaciones, ...nuevas.filter((n) => !liquidaciones.some((l) => l.id === n.id))];
      return responder(config, nuevas);
    },

    async crearAjuste(datos, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!datos.motivo.trim()) return validacion('El ajuste necesita un motivo.', 'motivo');
      const nuevo = conIdempotencia(clave, (): Ajuste => ({
        id: id('aj'), liquidacionOrigenId: datos.liquidacionOrigenId ?? null, periodoAplicacion: datos.periodoAplicacion,
        vendedorId: datos.vendedorId, importe: datos.importe, motivo: datos.motivo,
        observacionId: datos.observacionId ?? null, creadoPor: actorId, creadoEn: `${HOY}T12:00:00-04:00`,
      }));
      if (!ajustes.some((a) => a.id === nuevo.id)) ajustes = [...ajustes, nuevo];
      return responder(config, nuevo);
    },

    async resolverObservacion(idObservacion, estado, comentario) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const existente = observaciones.find((o) => o.id === idObservacion);
      if (!existente) return noEncontrado('No encontramos esa observación.');
      if (!comentario.trim()) return validacion('Resolver una observación exige un comentario.', 'comentario');
      const resuelta: Observacion = {
        ...existente, estado, resolucion: comentario, resueltaPor: actorId, resueltaEn: `${HOY}T12:00:00-04:00`,
      };
      observaciones = observaciones.map((o) => (o.id === idObservacion ? resuelta : o));
      return responder(config, resuelta);
    },

    // -- Todos los clientes --
    async listarTodosLosClientes(filtro, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = clientesTodos;
      if (filtro.tipo) items = items.filter((c) => c.tipo === filtro.tipo);
      if (filtro.etapa) items = items.filter((c) => c.etapa === filtro.etapa);
      if (filtro.vendedorId) items = items.filter((c) => c.vendedorId === filtro.vendedorId);
      if (filtro.texto) {
        const texto = filtro.texto.toLowerCase();
        items = items.filter((c) => c.nombre.toLowerCase().includes(texto));
      }
      return responder(config, paginar(items, pagina));
    },

    async lineaDeTiempoDeCualquierCliente(clienteId, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      return responder(config, paginar(lineasDeTiempo[clienteId] ?? [], pagina));
    },

    // -- Aprobación de cotizaciones --
    async colaDeRevision(filtro, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = cotizacionesEnCola.filter((c) => c.estado === 'en_revision');
      if (filtro.vendedorId) items = items.filter((c) => c.vendedorId === filtro.vendedorId);
      if (filtro.ordenarPor === 'monto') {
        items = [...items].sort((a, b) => (b.totalesPorMoneda[0]?.monto ?? 0) - (a.totalesPorMoneda[0]?.monto ?? 0));
      } else {
        items = [...items].sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime());
      }
      return responder(config, paginar(items, pagina));
    },

    async recalcularCotizacion(idCotizacion) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const cotizacion = cotizacionesEnCola.find((c) => c.id === idCotizacion);
      if (!cotizacion) return noEncontrado('No encontramos esa cotización.');
      const base = baseParaAlternativas(cotizacion.precios.setupEspecial.monto, cotizacion.precios.mensualEspecial.monto, cotizacion.precios.setupEspecial.moneda);
      return responder(config, calcularAlternativas(base));
    },

    async revisarCotizacion(idCotizacion, accion, comentario, clave, alternativasAprobadas) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const cotizacion = cotizacionesEnCola.find((c) => c.id === idCotizacion);
      if (!cotizacion) return noEncontrado('No encontramos esa cotización.');
      if (!comentario.trim()) return validacion('Aprobar, corregir o rechazar exige un comentario.', 'comentario');
      if (accion === 'aprobar' && actorId === cotizacion.vendedorId) {
        return sinPermiso('Nadie puede aprobar su propia cotización.');
      }
      const firmaVendedorVigente = cotizacion.firmas.some((f) => f.rol === 'vendedor' && !f.anulada && f.versionFirmada === cotizacion.version);
      if (accion === 'aprobar' && !firmaVendedorVigente) {
        return { ok: false, error: { codigo: 'requiere_firma', mensajeAmable: 'La cotización necesita la firma del vendedor antes de aprobarse.' } };
      }
      const actualizada = conIdempotencia(clave, () => {
        const nuevoEstado = accion === 'aprobar' ? 'aprobada' : accion === 'corregir' ? 'borrador' : 'rechazada';
        const evento = {
          id: id('evr'), cotizacionId: idCotizacion, version: cotizacion.version, actorId, accion,
          comentario, ocurridoEn: `${HOY}T12:00:00-04:00`,
        };
        const revisionResuelta = cotizacion.revision
          ? {
              ...cotizacion.revision,
              estado: accion === 'aprobar' ? ('aprobada' as const) : accion === 'corregir' ? ('corregida' as const) : ('rechazada' as const),
              revisorId: actorId, resueltoEn: `${HOY}T12:00:00-04:00`,
              eventos: [...cotizacion.revision.eventos, evento],
              calculosRecalculados: true,
              alternativasAprobadas: accion === 'aprobar' ? (alternativasAprobadas ?? ['estandar', 'adelantado_12', 'adelantado_24', 'diferido']) : [],
            }
          : null;
        const nueva: CotizacionDetalle = { ...cotizacion, estado: nuevoEstado, revision: revisionResuelta };
        return nueva;
      });
      cotizacionesEnCola = cotizacionesEnCola.map((c) => (c.id === idCotizacion ? actualizada : c));
      return responder(config, actualizada as Cotizacion);
    },

    async firmarComoCeo(cotizacionId, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const cotizacion = cotizacionesEnCola.find((c) => c.id === cotizacionId);
      if (!cotizacion) return noEncontrado('No encontramos esa cotización.');
      if (cotizacion.estado !== 'aprobada') {
        return { ok: false, error: { codigo: 'requiere_aprobacion', mensajeAmable: 'La cotización tiene que estar aprobada antes de incorporar la firma del CEO.' } };
      }
      const firma = conIdempotencia(clave, (): Firma => ({
        id: id('firma'), rol: 'ceo', firmanteId: actorId, nombreFirmante: nombreVendedor(actorId),
        aclaracion: `${nombreVendedor(actorId)} — CEO`, referenciaProtegida: id('firma-protegida'),
        firmadoEn: `${HOY}T12:00:00-04:00`, versionFirmada: cotizacion.version, anulada: false, anuladaEn: null, motivoAnulacion: null,
      }));
      firmasCeo = [...firmasCeo, firma];
      cotizacionesEnCola = cotizacionesEnCola.map((c) => (c.id === cotizacionId ? { ...c, firmas: [...c.firmas, firma] } : c));
      return responder(config, firma);
    },

    async firmasDeCotizacion(cotizacionId) {
      const cotizacion = cotizacionesEnCola.find((c) => c.id === cotizacionId);
      return responder(config, cotizacion?.firmas ?? []);
    },

    async anulacionesDeFirma(cotizacionId, rol) {
      const cotizacion = cotizacionesEnCola.find((c) => c.id === cotizacionId);
      const firmas = (cotizacion?.firmas ?? []).filter((f) => f.anulada && (!rol || f.rol === rol));
      return responder(config, firmas);
    },

    async listarConstancias(pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      return responder(config, paginar(constancias, pagina));
    },

    async reintentarNotificaciones(constanciaId) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const actual = notificacionesPorConstancia[constanciaId];
      if (!actual) return noEncontrado('No encontramos esa constancia.');
      const reintentado: ResultadoNotificaciones = {
        ...actual,
        notificaciones: actual.notificaciones.map((n) =>
          n.estado === 'fallida'
            ? { ...n, estado: 'enviada' as const, intentos: n.intentos + 1, ultimoIntentoEn: `${HOY}T12:00:00-04:00`, proximoIntentoEn: null, error: null }
            : n,
        ),
        avisosPendientes: 0,
      };
      notificacionesPorConstancia = { ...notificacionesPorConstancia, [constanciaId]: reintentado };
      return responder(config, reintentado);
    },

    // -- Configuración comercial --
    async listarParticipaciones() {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      return responder(config, participaciones);
    },

    async publicarParticipacion(datos, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (datos.porcentajeLabIA + datos.porcentajeVendedor !== 100) {
        return validacion('El porcentaje de Lab.IA y el del vendedor tienen que sumar 100.', 'porcentajeVendedor');
      }
      const nueva = conIdempotencia(clave, (): ParticipacionProducto => {
        const anterior = participaciones.find((p) => p.productoId === datos.productoId);
        return {
          id: id('pp'), productoId: datos.productoId, porcentajeLabIA: datos.porcentajeLabIA,
          porcentajeVendedor: datos.porcentajeVendedor, aplicaASetup: datos.aplicaASetup,
          aplicaAMensualidad: datos.aplicaAMensualidad, mesesParticipacionVendedor: datos.mesesParticipacionVendedor,
          version: (anterior?.version ?? 0) + 1, vigenteDesde: datos.vigenteDesde, publicadaPor: actorId,
          publicadaEn: `${HOY}T12:00:00-04:00`,
        };
      });
      participaciones = [...participaciones.filter((p) => p.productoId !== datos.productoId), nueva];
      return responder(config, nueva);
    },

    async cargarPreciosLista(_precios, motivo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!motivo.trim()) return validacion('Cargar precios de lista exige un motivo.', 'motivo');
      return responder(config, { versionCatalogo: 2 });
    },

    async publicarProducto(idProducto, publicado, motivo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!motivo.trim()) return validacion('Publicar o despublicar un producto exige un motivo.', 'motivo');
      const actual = productos.find((p) => p.id === idProducto);
      if (!actual) return noEncontrado('Ese producto no existe en el catálogo cerrado.');
      const actualizado = { ...actual, publicado };
      productos = productos.map((p) => (p.id === idProducto ? actualizado : p));
      return responder(config, actualizado);
    },

    async listarActividadesPendientes(pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      return responder(config, paginar(actividadesPendientes.filter((a) => a.estado === 'pendiente_de_revision'), pagina));
    },

    async confirmarActividad(idActividad) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const actual = actividadesPendientes.find((a) => a.id === idActividad);
      if (!actual) return noEncontrado('No encontramos esa actividad.');
      const confirmada: Actividad = { ...actual, estado: 'confirmada' as EstadoTermino };
      actividadesPendientes = actividadesPendientes.map((a) => (a.id === idActividad ? confirmada : a));
      return responder(config, confirmada);
    },

    async fusionarActividad(origenId, destinoId, motivo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!motivo.trim()) return validacion('Fusionar actividades exige un motivo.', 'motivo');
      const origen = actividadesPendientes.find((a) => a.id === origenId);
      if (!origen) return noEncontrado('No encontramos la actividad de origen.');
      const fusionada: Actividad = { ...origen, fusionadaEn: destinoId, estado: 'confirmada' as EstadoTermino };
      actividadesPendientes = actividadesPendientes.map((a) => (a.id === origenId ? fusionada : a));
      return responder(config, fusionada);
    },

    async editarTaxonomia(_cambio, _clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      return responder(config, undefined);
    },

    async listarVendedores(filtro, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      let items = usuarios;
      if (filtro.rol) items = items.filter((u) => u.rol === filtro.rol);
      if (filtro.activo !== undefined) items = items.filter((u) => u.activo === filtro.activo);
      if (filtro.texto) {
        const texto = filtro.texto.toLowerCase();
        items = items.filter((u) => u.nombre.toLowerCase().includes(texto) || u.usuario.toLowerCase().includes(texto));
      }
      return responder(config, paginar(items, pagina));
    },

    async crearVendedor(datos, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (usuarios.some((u) => u.usuario === datos.usuario)) {
        return validacion('Ya existe un usuario con ese nombre de ingreso.', 'usuario');
      }
      const nuevo = conIdempotencia(clave, (): Usuario => ({
        id: id('usr'), nombre: datos.nombre, email: datos.email, usuario: datos.usuario, rol: datos.rol,
        activo: true, ultimoIngresoEn: null, creadoEn: `${HOY}T12:00:00-04:00`, creadoPor: actorId,
        actualizadoEn: `${HOY}T12:00:00-04:00`, actualizadoPor: actorId, version: 1,
      }));
      if (!usuarios.some((u) => u.id === nuevo.id)) usuarios = [...usuarios, nuevo];
      return responder(config, nuevo);
    },

    async cambiarRol(usuarioId, rol, motivo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!motivo.trim()) return validacion('Cambiar el rol de un usuario exige un motivo.', 'motivo');
      const actual = usuarios.find((u) => u.id === usuarioId);
      if (!actual) return noEncontrado('No encontramos ese usuario.');
      const actualizado: Usuario = { ...actual, rol, actualizadoEn: `${HOY}T12:00:00-04:00`, actualizadoPor: actorId, version: actual.version + 1 };
      usuarios = usuarios.map((u) => (u.id === usuarioId ? actualizado : u));
      return responder(config, actualizado);
    },

    async desactivarVendedor(idVendedor, motivo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!motivo.trim()) return validacion('Dar de baja a un vendedor exige un motivo.', 'motivo');
      const actual = usuarios.find((u) => u.id === idVendedor);
      if (!actual) return noEncontrado('No encontramos ese vendedor.');
      const actualizado: Usuario = { ...actual, activo: false, actualizadoEn: `${HOY}T12:00:00-04:00`, actualizadoPor: actorId, version: actual.version + 1 };
      usuarios = usuarios.map((u) => (u.id === idVendedor ? actualizado : u));
      return responder(config, actualizado);
    },

    async reasignarCartera(datos, clave) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!datos.motivo.trim()) return validacion('Reasignar cartera exige un motivo.', 'motivo');
      const resultado = conIdempotencia(clave, (): ResultadoReasignacion => {
        const clientesAReasignar =
          datos.alcance === 'cartera_completa'
            ? clientesTodos.filter((c) => c.vendedorId === datos.origenVendedorId)
            : clientesTodos.filter((c) => (datos.clientesIds ?? []).includes(c.id));
        clientesTodos = clientesTodos.map((c) =>
          clientesAReasignar.some((r) => r.id === c.id) ? { ...c, vendedorId: datos.destinoVendedorId } : c,
        );
        return {
          clientesMovidos: clientesAReasignar.length,
          cotizacionesAfectadas: cotizacionesEnCola.filter((c) => clientesAReasignar.some((cl) => cl.id === c.destinatario.clienteId)).length,
          mensualidadesAfectadas: mensualidades.filter((m) => clientesAReasignar.some((cl) => cl.id === m.clienteId)).length,
          planesAfectados: 0,
          lineasDevengadasIntactas: lineasParticipacion.filter((l) => clientesAReasignar.some((cl) => cl.id === l.clienteId)).length,
        };
      });
      return responder(config, resultado);
    },

    async obtenerParametros() {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      return responder(config, parametros);
    },

    async actualizarParametros(cambios, motivo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!motivo.trim()) return validacion('Cambiar los parámetros del sistema exige un motivo.', 'motivo');
      parametros = { ...parametros, ...cambios };
      return responder(config, parametros);
    },

    async estadoProveedores() {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      return responder(config, estadoProveedores);
    },

    // -- Accesos y frecuencia de uso --
    async usoPorVendedor(periodo) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, []);
      const filas = usoPorVendedor.map((u) => {
        const diasSinEntrar = u.ultimoIngresoEn ? diasEntre(u.ultimoIngresoEn.slice(0, 10), HOY) : null;
        return {
          vendedorId: u.vendedorId, nombreVendedor: nombreVendedor(u.vendedorId), ultimoIngresoEn: u.ultimoIngresoEn,
          ingresosEnPeriodo: periodo === PERIODO_ACTUAL ? u.ingresosEnPeriodo : 0,
          diasSinEntrar, planesCreados: u.planesCreados, seguimientosRegistrados: u.seguimientosRegistrados,
          cotizacionesEnviadas: u.cotizacionesEnviadas,
          marcadoInactivo: diasSinEntrar !== null && diasSinEntrar >= parametros.diasSinEntrarParaInactivo,
        };
      });
      return responder(config, filas);
    },

    async listarRegistroAcceso(filtro, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = registroAcceso;
      if (filtro.actorId) items = items.filter((r) => r.actorId === filtro.actorId);
      if (filtro.accion) items = items.filter((r) => r.accion === filtro.accion);
      if (filtro.entidadTipo) items = items.filter((r) => r.entidadTipo === filtro.entidadTipo);
      return responder(config, paginar([...items].sort((a, b) => (a.ocurridoEn < b.ocurridoEn ? 1 : -1)), pagina));
    },

    async listarAperturasEnlace(filtro, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = aperturasEnlace;
      if (filtro.resultado) items = items.filter((a) => a.resultado === filtro.resultado);
      return responder(config, paginar(items, pagina));
    },

    // -- Sugerencias --
    async listarSugerencias(filtro, pagina) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (config.forzarVacio) return responder(config, paginar([], pagina));
      let items = sugerencias;
      if (filtro.estado) items = items.filter((s) => s.estado === filtro.estado);
      if (filtro.frecuencia) items = items.filter((s) => s.frecuenciaObservada === filtro.frecuencia);
      return responder(config, paginar(items, pagina));
    },

    async resolverSugerencia(idSugerencia, resolucion) {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      if (!resolucion.resolucion.trim()) return validacion('Resolver una sugerencia exige explicar la resolución.', 'resolucion');
      const actual = sugerencias.find((s) => s.id === idSugerencia);
      if (!actual) return noEncontrado('No encontramos esa sugerencia.');
      const resuelta: SugerenciaProducto = {
        ...actual, estado: resolucion.estado, resolucion: resolucion.resolucion,
        productoQueLoCubre: resolucion.productoQueLoCubre ?? null, duplicadaDe: resolucion.duplicadaDe ?? null,
        resueltaPor: actorId, resueltaEn: `${HOY}T12:00:00-04:00`,
      };
      sugerencias = sugerencias.map((s) => (s.id === idSugerencia ? resuelta : s));
      return responder(config, resuelta);
    },

    async agregadoSugerencias() {
      const permiso = exigirAdministrador();
      if (!permiso.ok) return permiso;
      const porActividad = new Map<Id, SugerenciaProducto[]>();
      for (const s of sugerencias) {
        if (!s.actividadId) continue;
        porActividad.set(s.actividadId, [...(porActividad.get(s.actividadId) ?? []), s]);
      }
      const salida: AgregadoSugerencias[] = [...porActividad.entries()].map(([actividadId, items]) => ({
        actividadId, total: items.length,
        porEstado: {
          recibida: items.filter((s) => s.estado === 'recibida').length,
          en_evaluacion: items.filter((s) => s.estado === 'en_evaluacion').length,
          aceptada_para_estudio: items.filter((s) => s.estado === 'aceptada_para_estudio').length,
          rechazada: items.filter((s) => s.estado === 'rechazada').length,
          duplicada: items.filter((s) => s.estado === 'duplicada').length,
          ya_cubierta_por_producto_existente: items.filter((s) => s.estado === 'ya_cubierta_por_producto_existente').length,
        },
        porFrecuencia: {
          unica: items.filter((s) => s.frecuenciaObservada === 'unica').length,
          ocasional: items.filter((s) => s.frecuenciaObservada === 'ocasional').length,
          frecuente: items.filter((s) => s.frecuenciaObservada === 'frecuente').length,
        },
      }));
      return responder(config, salida);
    },
  };
}
