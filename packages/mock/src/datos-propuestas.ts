/**
 * Datos de ejemplo — dominio: propuestas.
 *
 * ⛔ DUEÑO: Sesión 5. Ninguna otra sesión edita este archivo.
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse.
 *
 * Implementa, en memoria y sin backend, las dos interfaces del dominio:
 *   `CapaPropuestas` — presentaciones, cotizaciones, firmas, enlaces
 *   `CapaPublica`    — lo que ve el cliente por el enlace, sin sesión
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén documentados: cuando no hay uno
 *    (todavía no hay catálogo de precios cargado en esta rama), se declara
 *    `sinPrecioDeLista: true` en vez de inventar un monto.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 * ⛔ Sin roles fuera de vendedor y administrador.
 *
 * Y para la cotización en particular:
 *
 * ⛔ **Sin ningún cliente real.** La cotización es una plantilla genérica: los
 *    nombres de ejemplo son inventados y evidentes, nunca los de un cliente de
 *    Lab.IA, y ninguna condición sale de una propuesta anterior.
 * ⛔ **Las cuatro alternativas no se escriben a mano.** Se calculan con
 *    `calcularAlternativas` de `@labia/compartido`.
 * ⛔ **Sin el celular del CEO**, ni de ejemplo, ni con dígitos cambiados.
 *    El único número que puede aparecer es el WhatsApp corporativo.
 * ⛔ **Sin rutas a imágenes de firma.** Las firmas se referencian por
 *    `referenciaProtegida`, que en el mock es una cadena opaca sin extensión.
 *
 * Nota sobre el destinatario: `NuevaCotizacion` sólo trae `clienteId` — el
 * nombre de contacto y la razón social se resuelven, en un backend real,
 * cruzando con el registro del cliente (dominio de clientes, otra sesión).
 * Este mock no tiene acceso a ese registro: para los identificadores del
 * pequeño directorio de ejemplo de más abajo devuelve datos coherentes: para
 * cualquier otro `clienteId` (el que venga de una integración futura) degrada
 * a un texto genérico en vez de inventar una razón social.
 */

import type {
  ClaveIdempotencia, CodigoError, ErrorApi, Id, ISODate, OpcionesPagina,
  Pagina, Resultado, TotalesPorMoneda,
} from '@labia/compartido';
import type { ProductoId } from '@labia/compartido';
import {
  type AccesoEnlace, type ComparacionConLista, type Cotizacion, type CotizacionDetalle,
  type DestinatarioCotizacion, type DocumentoEmitido, type EnlaceCompartido,
  type FiltroCotizaciones, type NuevaCotizacion, type NuevaPresentacion,
  type OpcionesEnlace, type PreciosCotizacion, type PreciosEntrada, type Presentacion,
  type PresentacionPublica, type PrevisualizacionCotizacion, type Revision,
  type TipoDestinatario,
  PERMANENCIA_MINIMA_MESES,
} from '@labia/compartido';
import {
  type AlternativaCalculada, type BaseCalculo, type CodigoAlternativa,
  calcularAlternativas,
} from '@labia/compartido';
import type {
  ConstanciaRespuesta, CotizacionPublica, Firma, ResultadoNotificaciones, RespuestaDelCliente,
} from '@labia/compartido';
import type { CapaPropuestas, CapaPublica } from '@labia/compartido';
import type { ConfiguracionMock } from './nucleo';

// ===========================================================================
// Utilidades del mock — latencia, falla forzada, paginación, ids e ids opacos
// ===========================================================================

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function ejecutar<T>(
  config: ConfiguracionMock,
  accion: () => Resultado<T>,
): Promise<Resultado<T>> {
  if (config.latenciaMs > 0) await esperar(config.latenciaMs);
  if (config.fallaForzada) return { ok: false, error: config.fallaForzada };
  return accion();
}

function ok<T>(datos: T): Resultado<T> {
  return { ok: true, datos };
}

function error(codigo: CodigoError, mensajeAmable: string, pista?: string): Resultado<never> {
  const detalle: ErrorApi = pista === undefined
    ? { codigo, mensajeAmable }
    : { codigo, mensajeAmable, pista };
  return { ok: false, error: detalle };
}

function paginar<T>(items: ReadonlyArray<T>, opciones?: OpcionesPagina): Pagina<T> {
  const limite = opciones?.limite ?? 20;
  const inicio = opciones?.cursor ? Number.parseInt(opciones.cursor, 10) : 0;
  const trozo = items.slice(inicio, inicio + limite);
  const siguiente = inicio + limite;
  return {
    items: trozo,
    cursor: siguiente < items.length ? String(siguiente) : null,
    total: items.length,
  };
}

let secuencia = 0;
function nuevoId(prefijo: string): Id {
  secuencia += 1;
  return `${prefijo}-${secuencia.toString(36)}`;
}

/** ⛔ Opaco: no deriva de ningún dato del cliente ni de la propuesta. */
function tokenOpaco(): string {
  const bytes = new Uint8Array(20);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function enDias(dias: number): ISODate {
  return new Date(Date.now() + dias * 86_400_000).toISOString();
}

function haceMinutos(minutos: number): ISODate {
  return new Date(Date.now() - minutos * 60_000).toISOString();
}

// ===========================================================================
// Nombres comerciales de los 13 productos — sólo el nombre, nunca el copy.
// ===========================================================================

const NOMBRES_PRODUCTO: Readonly<Record<ProductoId, string>> = {
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

export function nombreComercialDeProducto(id: ProductoId): string {
  return NOMBRES_PRODUCTO[id];
}

/**
 * Rutas de los logos oficiales, según la convención documentada en
 * INVENTARIO_ACTIVOS.md. La incorporación física de cada archivo a
 * `apps/escritorio/public/` es tarea de otra sesión; acá sólo se referencia
 * dónde va a vivir. El de Park.IA ya está incorporado y es el único cuyo
 * archivo existe hoy en el repositorio.
 */
function logosPara(productoId: ProductoId): {
  readonly labIa: string;
  readonly rgrlkGroup: string;
  readonly producto: string;
  readonly variante: string | null;
} {
  return {
    labIa: '/assets/marca/logo-labia.png',
    rgrlkGroup: '/assets/marca/rgrlk-group-horizontal.webp',
    producto: productoId === 'park-ia'
      ? '/assets/productos/park-ia/logo-park-ia.webp'
      : `/assets/productos/${productoId}/logo-${productoId}.png`,
    variante: null,
  };
}

// ===========================================================================
// Pequeño directorio de clientes de ejemplo — evidentemente inventados
// ===========================================================================

const CLIENTE_DEMO_1 = 'cli-demo-ferreteria';
const CLIENTE_DEMO_2 = 'cli-demo-clinica';

const DIRECTORIO_DEMO: Readonly<Record<string, DestinatarioCotizacion>> = {
  [CLIENTE_DEMO_1]: {
    clienteId: CLIENTE_DEMO_1,
    tipo: 'empresa',
    nombreCliente: 'Contacto de ejemplo (compras)',
    nombreEmpresaOProfesional: 'Ferretería Modelo S.R.L. (cliente de ejemplo)',
    profesion: null,
    ruc: null,
    ciudad: 'Asunción',
  },
  [CLIENTE_DEMO_2]: {
    clienteId: CLIENTE_DEMO_2,
    tipo: 'profesional',
    nombreCliente: 'Profesional de ejemplo',
    nombreEmpresaOProfesional: 'Consultorio de ejemplo',
    profesion: 'Odontología',
    ruc: null,
    ciudad: 'Luque',
  },
};

/** Directorio de ejemplo disponible para el selector de la vista. */
export const CLIENTES_DEMO: ReadonlyArray<DestinatarioCotizacion> = Object.values(DIRECTORIO_DEMO);

function resolverDestinatario(clienteId: Id, tipo: TipoDestinatario): DestinatarioCotizacion {
  const conocido = DIRECTORIO_DEMO[clienteId];
  if (conocido) return conocido;
  // Degradación honesta: sin acceso al registro real del cliente, no se
  // inventa una razón social. El backend real resuelve esto por join.
  return {
    clienteId,
    tipo,
    nombreCliente: 'Contacto principal del cliente',
    nombreEmpresaOProfesional: 'Registro del cliente (pendiente de sincronizar)',
    profesion: null,
    ruc: null,
    ciudad: null,
  };
}

const VENDEDOR_DEMO_ID = 'usr-demo-vendedor-1';
const VENDEDOR_DEMO_NOMBRE = 'Vendedor de ejemplo';
const OTRO_VENDEDOR_ID = 'usr-demo-vendedor-2';
const OTRO_VENDEDOR_NOMBRE = 'Vendedor de ejemplo dos';

// ===========================================================================
// Comparación con el catálogo — sin precio de lista documentado en esta rama
// ===========================================================================

function compararSinListaConocida(
  productoId: ProductoId,
  precios: PreciosEntrada,
): ComparacionConLista {
  return {
    productoId,
    precioListaSetup: null,
    setupEspecial: precios.setupEspecial,
    desviacionSetup: null,
    desviacionSetupPorcentaje: null,
    precioListaMensualidad: null,
    mensualEspecial: precios.mensualEspecial,
    desviacionMensualidad: null,
    desviacionMensualidadPorcentaje: null,
    sinPrecioDeLista: true,
  };
}

function preciosCotizacionSinLista(precios: PreciosEntrada): PreciosCotizacion {
  const moneda = precios.setupEspecial.moneda;
  return {
    setupLista: precios.setupEspecial,
    setupEspecial: precios.setupEspecial,
    ahorroSetup: { monto: 0, moneda },
    ahorroSetupPorcentaje: 0,
    mensualLista: precios.mensualEspecial,
    mensualEspecial: precios.mensualEspecial,
    ahorroMensual: { monto: 0, moneda },
    ahorroMensualPorcentaje: 0,
  };
}

function baseCalculoDesde(precios: PreciosCotizacion): BaseCalculo {
  return {
    setupLista: precios.setupLista,
    setupEspecial: precios.setupEspecial,
    mensualLista: precios.mensualLista,
    mensualEspecial: precios.mensualEspecial,
  };
}

function totalesDesde(alternativas: ReadonlyArray<AlternativaCalculada>): TotalesPorMoneda {
  const estandar = alternativas.find((a) => a.codigo === 'estandar');
  return estandar ? [estandar.totalFinal] : [];
}

// ===========================================================================
// Validación de los 25 campos obligatorios (§ COMMERCIAL_RULES.md — cotización)
// ===========================================================================

function camposFaltantes(c: CotizacionDetalle): ReadonlyArray<string> {
  const faltan: string[] = [];
  if (!c.destinatario.nombreCliente.trim()) faltan.push('nombre del cliente');
  if (!c.destinatario.nombreEmpresaOProfesional.trim()) faltan.push('empresa o profesional');
  if (!c.objeto.nombreProducto.trim()) faltan.push('nombre del producto');
  if (!c.nombreVendedor.trim()) faltan.push('nombre del vendedor');
  if (!c.fechaEmision) faltan.push('fecha de emisión');
  if (!c.fechaValidez) faltan.push('fecha de validez');
  if (!c.condiciones.instalacion.descripcion.trim()) faltan.push('condiciones de instalación');
  if (
    c.condiciones.instalacion.tiempoEstimadoDiasHabiles <= 0
    || !c.condiciones.instalacion.tiempoEstimadoTexto.trim()
  ) faltan.push('tiempo estimado de instalación');
  if (c.condiciones.instalacion.aportesDelCliente.length === 0) {
    faltan.push('insumos, accesos, cuentas, información y equipos que aporta el cliente');
  }
  if (c.condiciones.alcance.queIncluye.length === 0) faltan.push('qué incluye');
  if (c.condiciones.alcance.queNoIncluye.length === 0) faltan.push('qué no incluye');
  if (!c.condiciones.basesYCondiciones.trim()) faltan.push('bases y condiciones');
  return faltan;
}

function firmaVigente(c: CotizacionDetalle, rol: Firma['rol']): Firma | null {
  return c.firmas.find((f) => f.rol === rol && !f.anulada && f.versionFirmada === c.version) ?? null;
}

// ===========================================================================
// El almacén — estado en memoria, compartido por CapaPropuestas y CapaPublica
// ===========================================================================

interface AlmacenPropuestas {
  readonly presentaciones: Map<Id, Presentacion>;
  readonly cotizaciones: Map<Id, CotizacionDetalle>;
  readonly enlaces: Map<Id, EnlaceCompartido>;
  readonly aperturas: AccesoEnlace[];
  readonly constancias: Map<Id, ConstanciaRespuesta>;
  readonly claves: Set<string>;
}

function folioNuevo(numero: number): string {
  const anio = new Date().getFullYear();
  return `LAB-${anio}-${String(numero).padStart(4, '0')}`;
}

function crearAlmacenSemilla(): AlmacenPropuestas {
  const presentaciones = new Map<Id, Presentacion>();
  const cotizaciones = new Map<Id, CotizacionDetalle>();
  const enlaces = new Map<Id, EnlaceCompartido>();
  const constancias = new Map<Id, ConstanciaRespuesta>();

  // --- Una presentación de ejemplo, sin precio, sin aprobación -------------
  const presentacionId = nuevoId('pres');
  presentaciones.set(presentacionId, {
    id: presentacionId,
    tipo: 'presentacion',
    clienteId: CLIENTE_DEMO_1,
    vendedorId: VENDEDOR_DEMO_ID,
    titulo: 'Ojo Digital para Ferretería Modelo (ejemplo)',
    productosIncluidos: ['ojo-digital', 'radar-stock'],
    casosDeUsoIncluidos: ['Control de mostrador con cámaras existentes', 'Alerta de quiebre de stock'],
    planId: null,
    mostrarRangoDeReferencia: false,
    version: 1,
    creadoEn: haceMinutos(60 * 24 * 3),
    creadoPor: VENDEDOR_DEMO_ID,
    actualizadoEn: haceMinutos(60 * 24 * 3),
    actualizadoPor: VENDEDOR_DEMO_ID,
  });

  // --- Cotización 1: borrador, recién creada, sin firmar --------------------
  const idBorrador = nuevoId('cot');
  const preciosBorrador = preciosCotizacionSinLista({
    setupEspecial: { monto: 3_500_000, moneda: 'PYG' },
    mensualEspecial: { monto: 450_000, moneda: 'PYG' },
  });
  cotizaciones.set(idBorrador, {
    id: idBorrador,
    tipo: 'cotizacion',
    folio: folioNuevo(1),
    version: 1,
    creadoEn: haceMinutos(30),
    creadoPor: VENDEDOR_DEMO_ID,
    actualizadoEn: haceMinutos(30),
    actualizadoPor: VENDEDOR_DEMO_ID,
    estado: 'borrador',
    destinatario: DIRECTORIO_DEMO[CLIENTE_DEMO_1]!,
    objeto: { productoId: 'ojo-digital', nombreProducto: NOMBRES_PRODUCTO['ojo-digital'], variante: null },
    vendedorId: VENDEDOR_DEMO_ID,
    nombreVendedor: VENDEDOR_DEMO_NOMBRE,
    fechaEmision: enDias(0),
    fechaValidez: enDias(15),
    precios: preciosBorrador,
    alternativas: calcularAlternativas(baseCalculoDesde(preciosBorrador)),
    condiciones: {
      permanenciaMinimaMeses: PERMANENCIA_MINIMA_MESES,
      instalacion: {
        descripcion: 'Instalación en el local del cliente, coordinada con el equipo técnico de Lab.IA.',
        tiempoEstimadoDiasHabiles: 5,
        tiempoEstimadoTexto: 'Hasta 5 días hábiles desde la aceptación.',
        aportesDelCliente: [
          { tipo: 'acceso', descripcion: 'Acceso a las cámaras existentes del local.', bloqueante: true },
          { tipo: 'informacion', descripcion: 'Listado de productos críticos a monitorear.', bloqueante: false },
        ],
      },
      alcance: {
        queIncluye: ['Configuración inicial del sistema', 'Capacitación del personal del local'],
        queNoIncluye: ['Cableado de cámaras nuevas', 'Licencias de software de terceros'],
        limitesIncluidos: ['Hasta 4 cámaras monitoreadas'],
      },
      basesYCondiciones:
        'Oferta válida por el plazo indicado. Los importes no incluyen impuestos salvo que se indique lo contrario. La permanencia mínima aplica desde la fecha de aceptación.',
      tratamientoIva: 'IVA incluido en los importes especiales.',
      notasInternas: null,
    },
    logos: logosPara('ojo-digital'),
    totalesPorMoneda: totalesDesde(calcularAlternativas(baseCalculoDesde(preciosBorrador))),
    presentacionId,
    versionCatalogo: 1,
    motivoPerdida: null,
    revision: null,
    versiones: [{
      version: 1,
      estado: 'borrador',
      creadaEn: haceMinutos(30),
      creadaPor: VENDEDOR_DEMO_ID,
      totalesPorMoneda: totalesDesde(calcularAlternativas(baseCalculoDesde(preciosBorrador))),
      motivoCambio: null,
    }],
    documentos: [],
    enlaces: [],
    comparacion: compararSinListaConocida('ojo-digital', {
      setupEspecial: preciosBorrador.setupEspecial,
      mensualEspecial: preciosBorrador.mensualEspecial,
    }),
    firmas: [],
    avisos: ['Precio de lista no documentado para este producto en esta rama: se muestra sin descuento de referencia.'],
  });

  // --- Cotización 2: aprobada, con las dos firmas, enviada al cliente -------
  const idAprobada = nuevoId('cot');
  const preciosAprobada = preciosCotizacionSinLista({
    setupEspecial: { monto: 2_800_000, moneda: 'PYG' },
    mensualEspecial: { monto: 690_000, moneda: 'PYG' },
  });
  const alternativasAprobada = calcularAlternativas(baseCalculoDesde(preciosAprobada));
  const firmaVendedor: Firma = {
    id: nuevoId('firma'),
    rol: 'vendedor',
    firmanteId: VENDEDOR_DEMO_ID,
    nombreFirmante: VENDEDOR_DEMO_NOMBRE,
    aclaracion: 'Vendedor',
    referenciaProtegida: `firma-protegida-${nuevoId('ref')}`,
    firmadoEn: haceMinutos(60 * 24 * 2),
    versionFirmada: 1,
    anulada: false,
    anuladaEn: null,
    motivoAnulacion: null,
  };
  const firmaCeo: Firma = {
    id: nuevoId('firma'),
    rol: 'ceo',
    firmanteId: 'usr-ceo',
    nombreFirmante: 'Dirección Lab.IA',
    aclaracion: 'CEO',
    referenciaProtegida: `firma-protegida-${nuevoId('ref')}`,
    firmadoEn: haceMinutos(60 * 20),
    versionFirmada: 1,
    anulada: false,
    anuladaEn: null,
    motivoAnulacion: null,
  };
  const revisionAprobada: Revision = {
    id: nuevoId('rev'),
    cotizacionId: idAprobada,
    version: 1,
    vendedorId: VENDEDOR_DEMO_ID,
    revisorId: 'usr-ceo',
    estado: 'aprobada',
    creadoEn: haceMinutos(60 * 24),
    resueltoEn: haceMinutos(60 * 20),
    eventos: [
      { id: nuevoId('evt'), cotizacionId: idAprobada, version: 1, actorId: VENDEDOR_DEMO_ID, accion: 'enviar', comentario: 'Cliente listo para recibir la oferta.', ocurridoEn: haceMinutos(60 * 24) },
      { id: nuevoId('evt'), cotizacionId: idAprobada, version: 1, actorId: 'usr-ceo', accion: 'aprobar', comentario: 'Aprobado, condiciones estándar.', ocurridoEn: haceMinutos(60 * 20) },
    ],
    calculosRecalculados: true,
    alternativasAprobadas: [],
  };
  const documentoAprobada: DocumentoEmitido = {
    id: nuevoId('doc'),
    propuestaId: idAprobada,
    tipoPropuesta: 'cotizacion',
    versionPropuesta: 1,
    folio: folioNuevo(2),
    hashContenido: `hash-${idAprobada}-v1`,
    emitidoEn: haceMinutos(60 * 19),
    emitidoPor: 'usr-ceo',
    validoHasta: enDias(15),
    almacenamientoRef: `documentos/${idAprobada}/v1.pdf`,
  };
  cotizaciones.set(idAprobada, {
    id: idAprobada,
    tipo: 'cotizacion',
    folio: folioNuevo(2),
    version: 1,
    creadoEn: haceMinutos(60 * 24),
    creadoPor: VENDEDOR_DEMO_ID,
    actualizadoEn: haceMinutos(60 * 19),
    actualizadoPor: 'usr-ceo',
    estado: 'enviada_al_cliente',
    destinatario: DIRECTORIO_DEMO[CLIENTE_DEMO_2]!,
    objeto: { productoId: 'agendar-ia', nombreProducto: NOMBRES_PRODUCTO['agendar-ia'], variante: null },
    vendedorId: VENDEDOR_DEMO_ID,
    nombreVendedor: VENDEDOR_DEMO_NOMBRE,
    fechaEmision: haceMinutos(60 * 20),
    fechaValidez: enDias(20),
    precios: preciosAprobada,
    alternativas: alternativasAprobada,
    condiciones: {
      permanenciaMinimaMeses: PERMANENCIA_MINIMA_MESES,
      instalacion: {
        descripcion: 'Configuración remota de la agenda y capacitación por videollamada.',
        tiempoEstimadoDiasHabiles: 3,
        tiempoEstimadoTexto: 'Hasta 3 días hábiles desde la aceptación.',
        aportesDelCliente: [
          { tipo: 'cuenta', descripcion: 'Cuenta de WhatsApp Business del consultorio.', bloqueante: true },
        ],
      },
      alcance: {
        queIncluye: ['Configuración de la agenda', 'Recordatorios automáticos a pacientes'],
        queNoIncluye: ['Migración de historial clínico', 'Integración con sistemas de terceros'],
        limitesIncluidos: ['Un profesional agendado'],
      },
      basesYCondiciones:
        'Oferta válida por el plazo indicado. La permanencia mínima aplica desde la fecha de aceptación. Los importes especiales están sujetos a la alternativa elegida.',
      tratamientoIva: 'IVA incluido en los importes especiales.',
      notasInternas: null,
    },
    logos: logosPara('agendar-ia'),
    totalesPorMoneda: totalesDesde(alternativasAprobada),
    presentacionId: null,
    versionCatalogo: 1,
    motivoPerdida: null,
    revision: revisionAprobada,
    versiones: [{
      version: 1,
      estado: 'enviada_al_cliente',
      creadaEn: haceMinutos(60 * 24),
      creadaPor: VENDEDOR_DEMO_ID,
      totalesPorMoneda: totalesDesde(alternativasAprobada),
      motivoCambio: null,
    }],
    documentos: [documentoAprobada],
    enlaces: [],
    comparacion: compararSinListaConocida('agendar-ia', {
      setupEspecial: preciosAprobada.setupEspecial,
      mensualEspecial: preciosAprobada.mensualEspecial,
    }),
    firmas: [firmaVendedor, firmaCeo],
    avisos: [],
  });

  const enlaceId = nuevoId('enl');
  const token = tokenOpaco();
  enlaces.set(enlaceId, {
    id: enlaceId,
    propuestaId: idAprobada,
    tipoPropuesta: 'cotizacion',
    versionPropuesta: 1,
    token,
    creadoEn: haceMinutos(60 * 19),
    creadoPor: VENDEDOR_DEMO_ID,
    venceEn: enDias(20),
    topeAperturas: null,
    aperturas: 1,
    requiereCodigo: false,
    revocadoEn: null,
    revocadoPor: null,
    respondido: false,
  });

  const aperturas: AccesoEnlace[] = [{
    id: nuevoId('acc'),
    enlaceId,
    documentoId: documentoAprobada.id,
    tipoDocumento: 'cotizacion',
    ocurridoEn: haceMinutos(60 * 10),
    tipoDispositivo: 'celular',
    paisAproximado: 'Paraguay',
    duracionSegundos: 95,
    resultado: 'ok',
  }];

  // --- Cotización 3: vencida, para probar "sin importes, sin respuesta" ----
  const idVencida = nuevoId('cot');
  const preciosVencida = preciosCotizacionSinLista({
    setupEspecial: { monto: 1_900_000, moneda: 'PYG' },
    mensualEspecial: { monto: 320_000, moneda: 'PYG' },
  });
  cotizaciones.set(idVencida, {
    id: idVencida,
    tipo: 'cotizacion',
    folio: folioNuevo(3),
    version: 1,
    creadoEn: enDias(-40),
    creadoPor: OTRO_VENDEDOR_ID,
    actualizadoEn: enDias(-40),
    actualizadoPor: OTRO_VENDEDOR_ID,
    estado: 'vencida',
    destinatario: resolverDestinatario('cli-demo-otro', 'empresa'),
    objeto: { productoId: 'cotiza-facil', nombreProducto: NOMBRES_PRODUCTO['cotiza-facil'], variante: null },
    vendedorId: OTRO_VENDEDOR_ID,
    nombreVendedor: OTRO_VENDEDOR_NOMBRE,
    fechaEmision: enDias(-40),
    fechaValidez: enDias(-2),
    precios: preciosVencida,
    alternativas: calcularAlternativas(baseCalculoDesde(preciosVencida)),
    condiciones: {
      permanenciaMinimaMeses: PERMANENCIA_MINIMA_MESES,
      instalacion: {
        descripcion: 'Instalación remota.',
        tiempoEstimadoDiasHabiles: 2,
        tiempoEstimadoTexto: 'Hasta 2 días hábiles desde la aceptación.',
        aportesDelCliente: [{ tipo: 'informacion', descripcion: 'Lista de precios actual.', bloqueante: true }],
      },
      alcance: {
        queIncluye: ['Configuración inicial'],
        queNoIncluye: ['Carga manual de catálogos extensos'],
        limitesIncluidos: [],
      },
      basesYCondiciones: 'Oferta vencida: ya no acepta respuesta del cliente.',
      tratamientoIva: 'IVA incluido en los importes especiales.',
      notasInternas: null,
    },
    logos: logosPara('cotiza-facil'),
    totalesPorMoneda: totalesDesde(calcularAlternativas(baseCalculoDesde(preciosVencida))),
    presentacionId: null,
    versionCatalogo: 1,
    motivoPerdida: null,
    revision: null,
    versiones: [{
      version: 1,
      estado: 'vencida',
      creadaEn: enDias(-40),
      creadaPor: OTRO_VENDEDOR_ID,
      totalesPorMoneda: totalesDesde(calcularAlternativas(baseCalculoDesde(preciosVencida))),
      motivoCambio: null,
    }],
    documentos: [],
    enlaces: [],
    comparacion: compararSinListaConocida('cotiza-facil', {
      setupEspecial: preciosVencida.setupEspecial,
      mensualEspecial: preciosVencida.mensualEspecial,
    }),
    firmas: [],
    avisos: [],
  });

  return { presentaciones, cotizaciones, enlaces, aperturas, constancias, claves: new Set() };
}

let almacenSingleton: AlmacenPropuestas | null = null;
function obtenerAlmacen(): AlmacenPropuestas {
  if (!almacenSingleton) almacenSingleton = crearAlmacenSemilla();
  return almacenSingleton;
}

/** Sólo para pruebas: reinicia el almacén de ejemplo a su estado semilla. */
export function reiniciarAlmacenPropuestas(): void {
  almacenSingleton = null;
}

function propiaDelRol(item: { readonly vendedorId: Id }, config: ConfiguracionMock): boolean {
  if (config.rol === 'administrador') return true;
  return item.vendedorId === VENDEDOR_DEMO_ID;
}

function filtrarPropuestas<T extends { readonly vendedorId: Id; readonly clienteId?: Id }>(
  items: ReadonlyArray<T>,
  filtro: FiltroCotizaciones,
  config: ConfiguracionMock,
): ReadonlyArray<T> {
  return items.filter((item) => {
    if (!propiaDelRol(item, config)) return false;
    if (filtro.vendedorId && item.vendedorId !== filtro.vendedorId) return false;
    if (filtro.clienteId && item.clienteId !== filtro.clienteId) return false;
    return true;
  });
}

// ===========================================================================
// CapaPropuestas
// ===========================================================================

export function crearCapaPropuestas(config: ConfiguracionMock): CapaPropuestas {
  const almacen = obtenerAlmacen();

  return {
    // --- A · Presentaciones -------------------------------------------------
    listarPresentaciones(filtro, pagina) {
      return ejecutar(config, () => {
        if (config.forzarVacio) return ok(paginar([], pagina));
        const items = filtrarPropuestas([...almacen.presentaciones.values()], filtro, config)
          .filter(() => !filtro.estado); // las presentaciones no tienen estado de aprobación
        return ok(paginar(items, pagina));
      });
    },

    crearPresentacion(datos: NuevaPresentacion, clave: ClaveIdempotencia) {
      return ejecutar(config, () => {
        if (almacen.claves.has(clave)) {
          const existente = [...almacen.presentaciones.values()].find((p) => p.clienteId === datos.clienteId && p.titulo === datos.titulo);
          if (existente) return ok(existente);
        }
        if (!datos.titulo.trim()) return error('validacion', 'La presentación necesita un título.', 'Escribí un título antes de guardar.');
        if (datos.productosIncluidos.length === 0) {
          return error('validacion', 'Elegí al menos un producto para la presentación.');
        }
        almacen.claves.add(clave);
        const id = nuevoId('pres');
        const ahora = new Date().toISOString();
        const presentacion: Presentacion = {
          id,
          tipo: 'presentacion',
          clienteId: datos.clienteId,
          vendedorId: VENDEDOR_DEMO_ID,
          titulo: datos.titulo,
          productosIncluidos: datos.productosIncluidos,
          casosDeUsoIncluidos: datos.casosDeUsoIncluidos ?? [],
          planId: datos.planId ?? null,
          mostrarRangoDeReferencia: datos.mostrarRangoDeReferencia ?? false,
          version: 1,
          creadoEn: ahora,
          creadoPor: VENDEDOR_DEMO_ID,
          actualizadoEn: ahora,
          actualizadoPor: VENDEDOR_DEMO_ID,
        };
        almacen.presentaciones.set(id, presentacion);
        return ok(presentacion);
      });
    },

    actualizarPresentacion(id, cambios, version) {
      return ejecutar(config, () => {
        const actual = almacen.presentaciones.get(id);
        if (!actual) return error('no_encontrado', 'No se encontró la presentación.');
        if (actual.version !== version) {
          return error('conflicto_version', 'La presentación cambió desde que la abriste. Volvé a cargarla.');
        }
        const actualizada: Presentacion = {
          ...actual,
          ...(cambios.titulo !== undefined ? { titulo: cambios.titulo } : {}),
          ...(cambios.productosIncluidos !== undefined ? { productosIncluidos: cambios.productosIncluidos } : {}),
          ...(cambios.casosDeUsoIncluidos !== undefined ? { casosDeUsoIncluidos: cambios.casosDeUsoIncluidos } : {}),
          ...(cambios.mostrarRangoDeReferencia !== undefined ? { mostrarRangoDeReferencia: cambios.mostrarRangoDeReferencia } : {}),
          version: actual.version + 1,
          actualizadoEn: new Date().toISOString(),
          actualizadoPor: VENDEDOR_DEMO_ID,
        };
        almacen.presentaciones.set(id, actualizada);
        return ok(actualizada);
      });
    },

    emitirPresentacion(id, clave) {
      return ejecutar(config, () => {
        const presentacion = almacen.presentaciones.get(id);
        if (!presentacion) return error('no_encontrado', 'No se encontró la presentación.');
        almacen.claves.add(clave);
        const documento: DocumentoEmitido = {
          id: nuevoId('doc'),
          propuestaId: id,
          tipoPropuesta: 'presentacion',
          versionPropuesta: presentacion.version,
          folio: `PRES-${presentacion.id}`,
          hashContenido: `hash-${id}-v${presentacion.version}`,
          emitidoEn: new Date().toISOString(),
          emitidoPor: VENDEDOR_DEMO_ID,
          validoHasta: null,
          almacenamientoRef: `documentos/${id}/v${presentacion.version}.pdf`,
        };
        return ok(documento);
      });
    },

    // --- B · Cotizaciones -----------------------------------------------------
    listarCotizaciones(filtro, pagina) {
      return ejecutar(config, () => {
        if (config.forzarVacio) return ok(paginar([], pagina));
        let items: ReadonlyArray<CotizacionDetalle> = filtrarPropuestas(
          [...almacen.cotizaciones.values()],
          filtro,
          config,
        );
        if (filtro.estado) items = items.filter((c) => c.estado === filtro.estado);
        const comoCotizacion: ReadonlyArray<Cotizacion> = items;
        return ok(paginar(comoCotizacion, pagina));
      });
    },

    obtenerCotizacion(id) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(id);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (!propiaDelRol(cotizacion, config)) return error('sin_permiso', 'No tenés acceso a esta cotización.');
        return ok(cotizacion);
      });
    },

    crearCotizacion(datos: NuevaCotizacion, clave: ClaveIdempotencia) {
      return ejecutar(config, () => {
        if (almacen.claves.has(clave)) {
          const existente = [...almacen.cotizaciones.values()].find(
            (c) => c.destinatario.clienteId === datos.clienteId && c.objeto.productoId === datos.productoId && c.version === 1,
          );
          if (existente) return ok(existente);
        }
        if (datos.precios.setupEspecial.monto < 0 || datos.precios.mensualEspecial.monto < 0) {
          return error('validacion', 'Los importes especiales no pueden ser negativos.');
        }
        if (datos.precios.setupEspecial.moneda !== datos.precios.mensualEspecial.moneda) {
          return error('monedas_mezcladas', 'El setup y la mensualidad tienen que estar en la misma moneda.');
        }
        almacen.claves.add(clave);
        const id = nuevoId('cot');
        const ahora = new Date().toISOString();
        const precios = preciosCotizacionSinLista(datos.precios);
        const alternativas = calcularAlternativas(baseCalculoDesde(precios));
        const cotizacion: CotizacionDetalle = {
          id,
          tipo: 'cotizacion',
          folio: folioNuevo(almacen.cotizaciones.size + 1),
          version: 1,
          creadoEn: ahora,
          creadoPor: VENDEDOR_DEMO_ID,
          actualizadoEn: ahora,
          actualizadoPor: VENDEDOR_DEMO_ID,
          estado: 'borrador',
          destinatario: resolverDestinatario(datos.clienteId, 'empresa'),
          objeto: {
            productoId: datos.productoId,
            nombreProducto: NOMBRES_PRODUCTO[datos.productoId],
            variante: datos.variante ?? null,
          },
          vendedorId: VENDEDOR_DEMO_ID,
          nombreVendedor: VENDEDOR_DEMO_NOMBRE,
          fechaEmision: ahora,
          fechaValidez: datos.fechaValidez,
          precios,
          alternativas,
          condiciones: datos.condiciones,
          logos: logosPara(datos.productoId),
          totalesPorMoneda: totalesDesde(alternativas),
          presentacionId: datos.presentacionId ?? null,
          versionCatalogo: 1,
          motivoPerdida: null,
          revision: null,
          versiones: [{
            version: 1,
            estado: 'borrador',
            creadaEn: ahora,
            creadaPor: VENDEDOR_DEMO_ID,
            totalesPorMoneda: totalesDesde(alternativas),
            motivoCambio: null,
          }],
          documentos: [],
          enlaces: [],
          comparacion: compararSinListaConocida(datos.productoId, datos.precios),
          firmas: [],
          avisos: ['Precio de lista no documentado para este producto en esta rama: se muestra sin descuento de referencia.'],
        };
        almacen.cotizaciones.set(id, cotizacion);
        return ok(cotizacion);
      });
    },

    actualizarCotizacion(id, cambios, version) {
      return ejecutar(config, () => {
        const actual = almacen.cotizaciones.get(id);
        if (!actual) return error('no_encontrado', 'No se encontró la cotización.');
        if (actual.version !== version) {
          return error('conflicto_version', 'La cotización cambió desde que la abriste. Volvé a cargarla.');
        }
        const eraAprobada = actual.estado === 'aprobada' || actual.estado === 'enviada_al_cliente';
        const nuevaVersion = actual.version + 1;
        const nuevoEstado = eraAprobada ? 'borrador' : actual.estado;
        const precios = cambios.precios ? preciosCotizacionSinLista(cambios.precios) : actual.precios;
        const alternativas = cambios.precios ? calcularAlternativas(baseCalculoDesde(precios)) : actual.alternativas;
        const totalesPorMoneda = totalesDesde(alternativas);
        const ahora = new Date().toISOString();
        const actualizada: CotizacionDetalle = {
          ...actual,
          ...(cambios.variante !== undefined ? { objeto: { ...actual.objeto, variante: cambios.variante ?? null } } : {}),
          ...(cambios.condiciones !== undefined ? { condiciones: cambios.condiciones } : {}),
          ...(cambios.fechaValidez !== undefined ? { fechaValidez: cambios.fechaValidez } : {}),
          precios,
          alternativas,
          totalesPorMoneda,
          version: nuevaVersion,
          // ⛔ Editar una cotización aprobada caduca la aprobación y anula las firmas.
          estado: nuevoEstado,
          revision: eraAprobada ? null : actual.revision,
          firmas: eraAprobada
            ? actual.firmas.map((f) => (f.anulada ? f : {
              ...f, anulada: true, anuladaEn: ahora, motivoAnulacion: 'La cotización se editó después de la aprobación.',
            }))
            : actual.firmas,
          actualizadoEn: ahora,
          actualizadoPor: VENDEDOR_DEMO_ID,
          versiones: [
            ...actual.versiones,
            {
              version: nuevaVersion,
              estado: nuevoEstado,
              creadaEn: ahora,
              creadaPor: VENDEDOR_DEMO_ID,
              totalesPorMoneda,
              motivoCambio: eraAprobada ? 'Corrección posterior a la aprobación: versión nueva.' : 'Ajuste del vendedor.',
            },
          ],
        };
        almacen.cotizaciones.set(id, actualizada);
        return ok(actualizada as Cotizacion);
      });
    },

    previsualizarCotizacion(_productoId, precios, variante) {
      return ejecutar(config, () => {
        const preciosCotizacion = preciosCotizacionSinLista(precios);
        const base = baseCalculoDesde(preciosCotizacion);
        const alternativas = calcularAlternativas(base);
        const previsualizacion: PrevisualizacionCotizacion = {
          base,
          precios: preciosCotizacion,
          alternativas,
          totalesPorMoneda: totalesDesde(alternativas),
          avisos: [
            'Precio de lista no documentado para este producto en esta rama: se muestra sin descuento de referencia.',
            ...(variante ? [`Variante seleccionada: ${variante}.`] : []),
          ],
        };
        return ok(previsualizacion);
      });
    },

    previsualizarTotales(base: BaseCalculo) {
      return ejecutar(config, () => ok(totalesDesde(calcularAlternativas(base))));
    },

    compararConLista(productoId, precios) {
      return ejecutar(config, () => ok(compararSinListaConocida(productoId, precios)));
    },

    historialVersiones(id) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(id);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        return ok(cotizacion.versiones);
      });
    },

    firmarComoVendedor(cotizacionId, clave) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(cotizacionId);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        const vigente = firmaVigente(cotizacion, 'vendedor');
        if (vigente) return ok(vigente);
        if (cotizacion.estado !== 'borrador' && cotizacion.estado !== 'corregida') {
          return error('validacion', 'Sólo se firma una cotización en borrador.');
        }
        almacen.claves.add(clave);
        const firma: Firma = {
          id: nuevoId('firma'),
          rol: 'vendedor',
          firmanteId: cotizacion.vendedorId,
          nombreFirmante: cotizacion.nombreVendedor,
          aclaracion: 'Vendedor',
          referenciaProtegida: `firma-protegida-${nuevoId('ref')}`,
          firmadoEn: new Date().toISOString(),
          versionFirmada: cotizacion.version,
          anulada: false,
          anuladaEn: null,
          motivoAnulacion: null,
        };
        const actualizada: CotizacionDetalle = { ...cotizacion, firmas: [...cotizacion.firmas, firma] };
        almacen.cotizaciones.set(cotizacionId, actualizada);
        return ok(firma);
      });
    },

    enviarARevision(id, comentario, clave) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(id);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (cotizacion.estado !== 'borrador' && cotizacion.estado !== 'corregida') {
          return error('validacion', 'Esta cotización ya está en revisión o fue resuelta.');
        }
        if (!firmaVigente(cotizacion, 'vendedor')) {
          return error('requiere_firma', 'Falta la firma del vendedor.', 'Firmá la cotización antes de enviarla a revisión.');
        }
        const faltan = camposFaltantes(cotizacion);
        if (faltan.length > 0) {
          return error(
            'validacion',
            `Faltan campos obligatorios: ${faltan.join(', ')}.`,
            'Completá los campos señalados antes de enviar a revisión.',
          );
        }
        almacen.claves.add(clave);
        const ahora = new Date().toISOString();
        const revision: Revision = {
          id: nuevoId('rev'),
          cotizacionId: id,
          version: cotizacion.version,
          vendedorId: cotizacion.vendedorId,
          revisorId: null,
          estado: 'pendiente',
          creadoEn: ahora,
          resueltoEn: null,
          eventos: [{
            id: nuevoId('evt'),
            cotizacionId: id,
            version: cotizacion.version,
            actorId: cotizacion.vendedorId,
            accion: 'enviar',
            comentario,
            ocurridoEn: ahora,
          }],
          calculosRecalculados: false,
          alternativasAprobadas: [],
        };
        const actualizada: CotizacionDetalle = { ...cotizacion, estado: 'en_revision', revision };
        almacen.cotizaciones.set(id, actualizada);
        return ok(actualizada as Cotizacion);
      });
    },

    emitirPdfDefinitivo(cotizacionId, clave) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(cotizacionId);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (cotizacion.estado !== 'aprobada' && cotizacion.estado !== 'enviada_al_cliente') {
          return error('requiere_aprobacion', 'La cotización todavía no fue aprobada por administración.', 'Un administrador tiene que aprobarla primero.');
        }
        if (!firmaVigente(cotizacion, 'vendedor') || !firmaVigente(cotizacion, 'ceo')) {
          return error('requiere_firma', 'Faltan firmas vigentes.', 'Se necesitan la firma del vendedor y la del CEO.');
        }
        almacen.claves.add(clave);
        const documento: DocumentoEmitido = {
          id: nuevoId('doc'),
          propuestaId: cotizacionId,
          tipoPropuesta: 'cotizacion',
          versionPropuesta: cotizacion.version,
          folio: cotizacion.folio,
          hashContenido: `hash-${cotizacionId}-v${cotizacion.version}`,
          emitidoEn: new Date().toISOString(),
          emitidoPor: cotizacion.vendedorId,
          validoHasta: cotizacion.fechaValidez,
          almacenamientoRef: `documentos/${cotizacionId}/v${cotizacion.version}.pdf`,
        };
        const actualizada: CotizacionDetalle = { ...cotizacion, documentos: [...cotizacion.documentos, documento] };
        almacen.cotizaciones.set(cotizacionId, actualizada);
        return ok(documento);
      });
    },

    enviarAlCliente(cotizacionId, clave) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(cotizacionId);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (cotizacion.estado !== 'aprobada') {
          return error('requiere_aprobacion', 'La cotización todavía no fue aprobada por administración.', 'Un administrador tiene que aprobarla primero.');
        }
        almacen.claves.add(clave);
        const actualizada: CotizacionDetalle = { ...cotizacion, estado: 'enviada_al_cliente' };
        almacen.cotizaciones.set(cotizacionId, actualizada);
        return ok(actualizada as Cotizacion);
      });
    },

    marcarDesenlace(id, desenlace, motivo) {
      return ejecutar(config, () => {
        const cotizacion = almacen.cotizaciones.get(id);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (desenlace === 'perdida' && !motivo?.trim()) {
          return error('validacion', 'Marcar una cotización como perdida exige un motivo.');
        }
        const actualizada: CotizacionDetalle = {
          ...cotizacion,
          estado: desenlace,
          motivoPerdida: desenlace === 'perdida' ? (motivo ?? null) : null,
        };
        almacen.cotizaciones.set(id, actualizada);
        return ok(actualizada as Cotizacion);
      });
    },

    // --- Enlaces, aperturas y respuesta ---------------------------------------
    crearEnlace(propuestaId, opciones: OpcionesEnlace, clave) {
      return ejecutar(config, () => {
        const esCotizacion = almacen.cotizaciones.has(propuestaId);
        const esPresentacion = almacen.presentaciones.has(propuestaId);
        if (!esCotizacion && !esPresentacion) return error('no_encontrado', 'No se encontró la propuesta.');
        almacen.claves.add(clave);
        const id = nuevoId('enl');
        const enlace: EnlaceCompartido = {
          id,
          propuestaId,
          tipoPropuesta: esCotizacion ? 'cotizacion' : 'presentacion',
          versionPropuesta: esCotizacion ? almacen.cotizaciones.get(propuestaId)!.version : almacen.presentaciones.get(propuestaId)!.version,
          token: tokenOpaco(),
          creadoEn: new Date().toISOString(),
          creadoPor: VENDEDOR_DEMO_ID,
          venceEn: opciones.venceEn,
          topeAperturas: opciones.topeAperturas ?? null,
          aperturas: 0,
          requiereCodigo: opciones.requiereCodigo ?? false,
          revocadoEn: null,
          revocadoPor: null,
          respondido: false,
        };
        almacen.enlaces.set(id, enlace);
        return ok(enlace);
      });
    },

    revocarEnlace(enlaceId, motivo) {
      return ejecutar(config, () => {
        const enlace = almacen.enlaces.get(enlaceId);
        if (!enlace) return error('no_encontrado', 'No se encontró el enlace.');
        if (!motivo.trim()) return error('validacion', 'Revocar un enlace exige un motivo.');
        const actualizado: EnlaceCompartido = {
          ...enlace, revocadoEn: new Date().toISOString(), revocadoPor: VENDEDOR_DEMO_ID,
        };
        almacen.enlaces.set(enlaceId, actualizado);
        return ok(actualizado);
      });
    },

    aperturasDePropuesta(propuestaId, pagina) {
      return ejecutar(config, () => {
        const enlacesDeLaPropuesta = new Set(
          [...almacen.enlaces.values()].filter((e) => e.propuestaId === propuestaId).map((e) => e.id),
        );
        const items = almacen.aperturas.filter((a) => enlacesDeLaPropuesta.has(a.enlaceId));
        return ok(paginar(items, pagina));
      });
    },

    constanciaDeCotizacion(cotizacionId) {
      return ejecutar(config, () => ok(almacen.constancias.get(cotizacionId) ?? null));
    },
  };
}

// ===========================================================================
// CapaPublica — enlace de respuesta del cliente, sin sesión
// ===========================================================================

function resolverEnlace(almacen: AlmacenPropuestas, token: string): Resultado<EnlaceCompartido> {
  const enlace = [...almacen.enlaces.values()].find((e) => e.token === token);
  if (!enlace) return error('no_encontrado', 'Este enlace no existe o ya no está disponible.');
  if (enlace.revocadoEn) return error('enlace_revocado', 'Este enlace fue revocado.');
  if (new Date(enlace.venceEn).getTime() < Date.now()) return error('enlace_vencido', 'Este enlace venció.');
  if (enlace.topeAperturas !== null && enlace.aperturas >= enlace.topeAperturas) {
    return error('tope_aperturas', 'Este enlace alcanzó su límite de aperturas.');
  }
  return ok(enlace);
}

function alternativaPublica(a: AlternativaCalculada) {
  return {
    codigo: a.codigo,
    nombre: a.nombre,
    totalFinal: a.totalFinal,
    setupAPagar: a.setupAPagar,
    importeCuota: a.importeCuota,
    cantidadCuotas: a.cantidadCuotas,
    mesesServicio: a.mesesServicio,
    permanenciaMinimaMeses: a.permanenciaMinimaMeses,
    formaDePago: a.formaDePago,
  };
}

export function crearCapaPublica(config: ConfiguracionMock): CapaPublica {
  const almacen = obtenerAlmacen();

  return {
    obtenerPresentacionPublica(token, _codigo) {
      return ejecutar(config, () => {
        const resultadoEnlace = resolverEnlace(almacen, token);
        if (!resultadoEnlace.ok) return resultadoEnlace;
        const enlace = resultadoEnlace.datos;
        if (enlace.tipoPropuesta !== 'presentacion') return error('no_encontrado', 'Este enlace no es de una presentación.');
        const presentacion = almacen.presentaciones.get(enlace.propuestaId);
        if (!presentacion) return error('no_encontrado', 'No se encontró la presentación.');
        const publica: PresentacionPublica = {
          tipo: 'presentacion',
          titulo: presentacion.titulo,
          nombreCliente: resolverDestinatario(presentacion.clienteId, 'empresa').nombreEmpresaOProfesional,
          nombreVendedor: VENDEDOR_DEMO_NOMBRE,
          emitidaEn: presentacion.creadoEn,
          productos: presentacion.productosIncluidos,
          casosDeUso: presentacion.casosDeUsoIncluidos,
          rangoDeReferencia: null,
          pdfDisponible: true,
        };
        return ok(publica);
      });
    },

    obtenerCotizacionPublica(token, _codigo) {
      return ejecutar(config, () => {
        const resultadoEnlace = resolverEnlace(almacen, token);
        if (!resultadoEnlace.ok) return resultadoEnlace;
        const enlace = resultadoEnlace.datos;
        if (enlace.tipoPropuesta !== 'cotizacion') return error('no_encontrado', 'Este enlace no es de una cotización.');
        const cotizacion = almacen.cotizaciones.get(enlace.propuestaId);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (cotizacion.estado !== 'aprobada' && cotizacion.estado !== 'enviada_al_cliente' && cotizacion.estado !== 'aceptada' && cotizacion.estado !== 'vencida') {
          return error('no_encontrado', 'Esta cotización todavía no está disponible.');
        }
        const vencida = new Date(cotizacion.fechaValidez).getTime() < Date.now();
        const aprobadas = cotizacion.revision?.alternativasAprobadas ?? [];
        const visibles: ReadonlyArray<CodigoAlternativa> = aprobadas.length > 0
          ? aprobadas
          : cotizacion.alternativas.map((a) => a.codigo);
        const publica: CotizacionPublica = {
          nombreCliente: cotizacion.destinatario.nombreCliente,
          nombreProducto: cotizacion.objeto.nombreProducto,
          variante: cotizacion.objeto.variante,
          folio: cotizacion.folio,
          version: cotizacion.version,
          emitidaEn: cotizacion.fechaEmision,
          venceEn: cotizacion.fechaValidez,
          alternativas: vencida ? [] : cotizacion.alternativas.filter((a) => visibles.includes(a.codigo)).map(alternativaPublica),
          basesYCondiciones: cotizacion.condiciones.basesYCondiciones,
          pdfDisponible: cotizacion.documentos.length > 0,
          vencida,
        };
        return ok(publica);
      });
    },

    descargarPdfPublico(token) {
      return ejecutar(config, () => {
        const resultadoEnlace = resolverEnlace(almacen, token);
        if (!resultadoEnlace.ok) return resultadoEnlace;
        const enlace = resultadoEnlace.datos;
        return ok({ url: `/documentos-publicos/${enlace.token}.pdf`, venceEn: enlace.venceEn });
      });
    },

    responderCotizacion(token, respuesta: RespuestaDelCliente, clave: ClaveIdempotencia) {
      return ejecutar(config, () => {
        const resultadoEnlace = resolverEnlace(almacen, token);
        if (!resultadoEnlace.ok) return resultadoEnlace;
        const enlace = resultadoEnlace.datos;
        if (enlace.tipoPropuesta !== 'cotizacion') return error('no_encontrado', 'Este enlace no es de una cotización.');
        const cotizacion = almacen.cotizaciones.get(enlace.propuestaId);
        if (!cotizacion) return error('no_encontrado', 'No se encontró la cotización.');
        if (new Date(cotizacion.fechaValidez).getTime() < Date.now()) {
          return error('validacion', 'Esta oferta venció y ya no acepta respuesta.');
        }
        if (respuesta.aceptacionMarcada !== true) {
          return error('validacion', 'Tenés que marcar la casilla de aceptación antes de enviar.');
        }
        const existente = almacen.constancias.get(cotizacion.id);
        if (existente && almacen.claves.has(clave)) return ok(existente);

        almacen.claves.add(clave);
        const importesAceptados = respuesta.opcion === 'estandar' || respuesta.opcion === 'adelantado_12'
          || respuesta.opcion === 'adelantado_24' || respuesta.opcion === 'diferido'
          ? cotizacion.alternativas.filter((a) => a.codigo === respuesta.opcion).map(alternativaPublica)[0] ?? null
          : null;
        const constancia: ConstanciaRespuesta = {
          id: nuevoId('const'),
          clienteId: cotizacion.destinatario.clienteId,
          nombreCliente: cotizacion.destinatario.nombreCliente,
          cotizacionId: cotizacion.id,
          folio: cotizacion.folio,
          versionCotizacion: cotizacion.version,
          opcionSeleccionada: respuesta.opcion,
          importesAceptados,
          respondidaEn: new Date().toISOString(),
          venceEn: cotizacion.fechaValidez,
          textoAceptacion: TEXTO_ACEPTACION_LOCAL,
          enlaceId: enlace.id,
          huellaDocumento: cotizacion.documentos.at(-1)?.hashContenido ?? `hash-${cotizacion.id}-v${cotizacion.version}`,
          naturaleza: 'constancia_comercial',
        };
        // ⛔ La constancia se guarda ANTES de intentar los avisos: nunca se pierde
        //    la elección del cliente aunque el aviso falle. Este mock no envía
        //    avisos reales; los cuatro destinos son responsabilidad del servidor.
        almacen.constancias.set(cotizacion.id, constancia);
        almacen.enlaces.set(enlace.id, { ...enlace, respondido: true });
        return ok(constancia);
      });
    },

    obtenerConstanciaPublica(token) {
      return ejecutar(config, () => {
        const enlace = [...almacen.enlaces.values()].find((e) => e.token === token);
        if (!enlace) return error('no_encontrado', 'Este enlace no existe o ya no está disponible.');
        return ok(almacen.constancias.get(enlace.propuestaId) ?? null);
      });
    },
  };
}

/** El texto exacto de la casilla, tal como lo definió `aceptacion.ts`. */
const TEXTO_ACEPTACION_LOCAL =
  'He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos.';

/** Resultado combinado, listo para mezclar en el ensamblado de `@labia/mock`. */
export function crearDatosPropuestas(config: ConfiguracionMock): { propuestas: CapaPropuestas; publica: CapaPublica } {
  return { propuestas: crearCapaPropuestas(config), publica: crearCapaPublica(config) };
}

export type { ResultadoNotificaciones };
