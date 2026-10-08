/**
 * Datos de ejemplo — dominio: clientes.
 *
 * ⛔ DUEÑO: Sesión 4. Ninguna otra sesión edita este archivo.
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse.
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 * Los tres salen de la MISMA implementación: dependen de `NucleoMock`
 * (packages/mock/src/nucleo.ts), que quien integre puede alternar en caliente.
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén en COMMERCIAL_RULES.md §2.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 * ⛔ Sin roles fuera de vendedor y administrador.
 *
 * ⛔ Los negocios de ejemplo son ficticios, salvo "Pame Garelik Bags", que es
 *    el caso real ya documentado en el copy aprobado de Smart Commerce
 *    (content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md). No se le
 *    inventa ninguna venta, reunión ni resultado que el copy no describa: la
 *    línea de tiempo de ese cliente es deliberadamente neutra. El resto de la
 *    cartera son negocios de ejemplo de los rubros citados en MASTER_SPEC.md
 *    §2.1 (repuestera, restaurante, odontología, peluquería, hotel, motel,
 *    veterinaria, gomería), siempre bajo el chip "Datos de ejemplo"
 *    (ContextoVista.datosDeEjemplo). La cartera se asigna a la vendedora de
 *    ejemplo real de Sesión 1 (`CUENTAS_DE_EJEMPLO` en datos-sesion.ts).
 * ⛔ `actividadId` todavía no puede referenciar la taxonomía real de Sesión 3
 *    (content/taxonomia/actividades.md está vacía — ver docs/PEDIDOS.md
 *    [S4] 2026-09-15). Se usan slugs propios, legibles, hasta que exista.
 */

import type {
  AudioSeguimiento, CapturaSeguimiento, Cliente, ClienteDetalle,
  EstadoPaso, EventoLineaTiempo, FiltroClientes, FiltroSeguimientos, Id,
  ISODate, NuevoCliente, OpcionesPagina, PasoSugerido, ProductoId,
  PropuestaDeSeguimiento, Seguimiento, SeguimientoConfirmado,
  SoporteDictado, Version,
} from '@labia/compartido';
import type { CapaClientes } from '@labia/compartido';
import type { NucleoMock } from './nucleo';
import { CUENTAS_DE_EJEMPLO } from './datos-sesion';

// ---------------------------------------------------------------------------
// Actor de ejemplo — la vendedora real de Sesión 1 (datos-sesion.ts).
// ---------------------------------------------------------------------------

const VENDEDOR_DEMO: Id = CUENTAS_DE_EJEMPLO.find((c) => c.rol === 'vendedor')?.id ?? 'usr-jpfdz';
const RETENCION_AUDIO_DIAS = 90;

/**
 * Momento de referencia del mock. Fijo (no `Date.now()`) para que el mock sea
 * reproducible, igual que `datos-sesion.ts` (Sesión 1): un atraso calculado
 * hoy se ve igual mañana.
 */
export const AHORA: ISODate = '2026-09-15T08:00:00-03:00';

function ahora(): ISODate {
  return AHORA;
}

function sumarDias(fecha: ISODate, dias: number): ISODate {
  const base = new Date(fecha);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString();
}

// ---------------------------------------------------------------------------
// Heurística de captura — mock del procesamiento que en producción corre en
// el servidor. Nunca inventa un producto fuera de los 13.
// ---------------------------------------------------------------------------

const PALABRAS_CLAVE_PRODUCTO: ReadonlyArray<readonly [ProductoId, ReadonlyArray<string>]> = [
  ['vendedor-24-7', ['whatsapp', 'consulta fuera de horario', 'atiende de noche']],
  ['radar-stock', ['stock', 'inventario', 'reponer']],
  ['precio-vivo', ['precio', 'lista de precios', 'actualizar precios']],
  ['ruta-ia', ['reparto', 'ruta', 'delivery', 'repartidor']],
  ['agendar-ia', ['turno', 'agenda de turnos', 'reserva']],
  ['smart-commerce', ['tienda online', 'ecommerce', 'venta online', 'sucursal digital']],
  ['park-ia', ['estacionamiento', 'playa de auto', 'parking']],
  ['exeq-ia', ['encuesta', 'experiencia del cliente', 'satisfacción']],
  ['merma-ia', ['merma', 'vencimiento de mercadería', 'pérdida de stock']],
  ['cotiza-facil', ['cotización', 'presupuesto rápido']],
  ['pulso-digital', ['reseña', 'opinión de clientes', 'reputación']],
  ['ojo-digital', ['cámara', 'vidriera', 'circulación de gente']],
  ['faro-digital', ['promoción', 'aviso', 'publicidad digital']],
];

function detectarProductos(texto: string): ProductoId[] {
  const minusculas = texto.toLowerCase();
  const detectados: ProductoId[] = [];
  for (const [id, claves] of PALABRAS_CLAVE_PRODUCTO) {
    if (claves.some((clave) => minusculas.includes(clave))) detectados.push(id);
  }
  return detectados;
}

const FRASES_FUERA_DE_CATALOGO = ['otro sistema', 'una app de', 'un software de', 'una planilla de'];

function detectarMencionesFueraDeCatalogo(texto: string): string[] {
  const minusculas = texto.toLowerCase();
  return FRASES_FUERA_DE_CATALOGO.filter((frase) => minusculas.includes(frase));
}

function sugerirEtapa(texto: string): ClienteDetalle['etapa'] | null {
  const minusculas = texto.toLowerCase();
  if (/cerr(ó|o)|acept(ó|o)|compr(ó|o)|firm(ó|o)/.test(minusculas)) return 'ganado';
  if (/no le interes(ó|a)|rechaz(ó|a)|se baj(ó|a)/.test(minusculas)) return 'perdido';
  if (/cotizaci(ó|o)n|presupuesto/.test(minusculas)) return 'cotizacion';
  if (/present(é|e)|mostr(é|e)|hicimos la demo/.test(minusculas)) return 'presentacion';
  if (/diagnostic|relevamiento|entendimos el negocio/.test(minusculas)) return 'diagnostico';
  return null;
}

function detectarPasos(texto: string): Array<Omit<PasoSugerido, 'id' | 'seguimientoId' | 'estado' | 'resueltoEn'>> {
  const minusculas = texto.toLowerCase();
  const pasos: Array<Omit<PasoSugerido, 'id' | 'seguimientoId' | 'estado' | 'resueltoEn'>> = [];
  if (/llamar|volver a llamar/.test(minusculas)) {
    pasos.push({ titulo: 'Llamar para seguir la conversación', venceEn: sumarDias(ahora(), 2) });
  }
  if (/enviar|mandar|compartir/.test(minusculas)) {
    pasos.push({ titulo: 'Enviar la información conversada', venceEn: sumarDias(ahora(), 1) });
  }
  if (/visitar|pasar por|ir al local/.test(minusculas)) {
    pasos.push({ titulo: 'Coordinar una visita', venceEn: sumarDias(ahora(), 5) });
  }
  if (pasos.length === 0) {
    pasos.push({ titulo: 'Retomar contacto', venceEn: sumarDias(ahora(), 3) });
  }
  return pasos;
}

// ---------------------------------------------------------------------------
// Semilla — cartera de ejemplo
// ---------------------------------------------------------------------------

interface ClienteInterno extends ClienteDetalle {}

function clienteBase(datos: Omit<ClienteInterno, 'creadoEn' | 'creadoPor' | 'actualizadoEn' | 'actualizadoPor' | 'version'>): ClienteInterno {
  return {
    ...datos,
    creadoEn: AHORA,
    creadoPor: VENDEDOR_DEMO,
    actualizadoEn: AHORA,
    actualizadoPor: VENDEDOR_DEMO,
    version: 1,
  };
}

const clientesSemilla: ClienteInterno[] = [
  clienteBase({
    id: 'cliente-pame-garelik-bags',
    tipo: 'empresa',
    nombre: 'Pame Garelik Bags',
    actividadId: 'boutique-carteras-accesorios',
    operacionesConfirmadas: ['catalogo-amplio', 'atiende-por-whatsapp'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'cliente_activo',
    ciudad: 'Asunción',
    ultimaInteraccionEn: sumarDias(ahora(), -6),
    proximoPasoEn: sumarDias(ahora(), 10),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-pame-1',
        clienteId: 'cliente-pame-garelik-bags',
        nombre: 'Pamela Garelik',
        cargo: 'Dueña',
        telefono: '+595 981 000 000',
        email: null,
        esDecisor: true,
        canalPreferido: 'whatsapp',
      },
    ],
    productosVigentes: ['smart-commerce'],
    productosPropuestos: [],
    planId: null,
    potencialPorMoneda: [{ monto: 0, moneda: 'PYG' }],
  }),
  clienteBase({
    id: 'cliente-repuestos-san-roque',
    tipo: 'empresa',
    nombre: 'Repuestos San Roque',
    actividadId: 'repuestera',
    operacionesConfirmadas: ['maneja-stock', 'compra-a-proveedores'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'negociacion',
    ciudad: 'Luque',
    ultimaInteraccionEn: sumarDias(ahora(), -2),
    proximoPasoEn: sumarDias(ahora(), 1),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-repuestos-1',
        clienteId: 'cliente-repuestos-san-roque',
        nombre: 'Diego Villalba',
        cargo: 'Encargado de local',
        telefono: '+595 982 111 222',
        email: 'diego@repuestossanroque.com.py',
        esDecisor: true,
        canalPreferido: 'telefono',
      },
    ],
    productosVigentes: [],
    productosPropuestos: ['radar-stock', 'cotiza-facil'],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-parrillada-nandutii',
    tipo: 'empresa',
    nombre: 'Parrillada Ñandutí',
    actividadId: 'restaurante',
    operacionesConfirmadas: ['atiende-por-whatsapp', 'reparte-a-domicilio'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'presentacion',
    ciudad: 'Fernando de la Mora',
    ultimaInteraccionEn: sumarDias(ahora(), -4),
    proximoPasoEn: sumarDias(ahora(), 3),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-parrillada-1',
        clienteId: 'cliente-parrillada-nandutii',
        nombre: 'Marta Ovelar',
        cargo: 'Dueña',
        telefono: '+595 983 222 333',
        email: null,
        esDecisor: true,
        canalPreferido: 'whatsapp',
      },
    ],
    productosVigentes: [],
    productosPropuestos: ['vendedor-24-7', 'ruta-ia'],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-dra-liz-acosta',
    tipo: 'profesional',
    nombre: 'Dra. Liz Acosta — Odontología',
    actividadId: 'odontologia',
    operacionesConfirmadas: ['trabaja-con-turnos'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'diagnostico',
    ciudad: 'Asunción',
    ultimaInteraccionEn: sumarDias(ahora(), -1),
    proximoPasoEn: sumarDias(ahora(), 2),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-liz-1',
        clienteId: 'cliente-dra-liz-acosta',
        nombre: 'Liz Acosta',
        cargo: 'Odontóloga',
        telefono: '+595 984 333 444',
        email: 'liz.acosta@example.com.py',
        esDecisor: true,
        canalPreferido: 'whatsapp',
      },
    ],
    productosVigentes: [],
    productosPropuestos: ['agendar-ia'],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-peluqueria-bella-imagen',
    tipo: 'empresa',
    nombre: 'Peluquería Bella Imagen',
    actividadId: 'peluqueria',
    operacionesConfirmadas: ['trabaja-con-turnos', 'varios-profesionales'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'contactado',
    ciudad: 'San Lorenzo',
    ultimaInteraccionEn: sumarDias(ahora(), -8),
    proximoPasoEn: sumarDias(ahora(), 4),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-bella-1',
        clienteId: 'cliente-peluqueria-bella-imagen',
        nombre: 'Rocío Benítez',
        cargo: 'Dueña',
        telefono: '+595 985 444 555',
        email: null,
        esDecisor: true,
        canalPreferido: 'whatsapp',
      },
    ],
    productosVigentes: [],
    productosPropuestos: [],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-hotel-las-mercedes',
    tipo: 'empresa',
    nombre: 'Hotel Las Mercedes',
    actividadId: 'hotel',
    operacionesConfirmadas: ['administra-espacios', 'precios-que-se-mueven'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'cotizacion',
    ciudad: 'Encarnación',
    ultimaInteraccionEn: sumarDias(ahora(), -3),
    proximoPasoEn: sumarDias(ahora(), 6),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-mercedes-1',
        clienteId: 'cliente-hotel-las-mercedes',
        nombre: 'Aníbal Duarte',
        cargo: 'Administrador',
        telefono: '+595 986 555 666',
        email: 'aduarte@hotellasmercedes.example',
        esDecisor: false,
        canalPreferido: 'email',
      },
    ],
    productosVigentes: [],
    productosPropuestos: ['precio-vivo', 'agendar-ia'],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-motel-luna',
    tipo: 'empresa',
    nombre: 'Motel Luna',
    actividadId: 'motel',
    operacionesConfirmadas: ['administra-espacios'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'sin_contactar',
    ciudad: 'Ñemby',
    ultimaInteraccionEn: null,
    proximoPasoEn: null,
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [],
    productosVigentes: [],
    productosPropuestos: [],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-veterinaria-san-francisco',
    tipo: 'empresa',
    nombre: 'Veterinaria San Francisco',
    actividadId: 'veterinaria',
    operacionesConfirmadas: ['trabaja-con-turnos', 'maneja-stock'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'ganado',
    ciudad: 'Lambaré',
    ultimaInteraccionEn: sumarDias(ahora(), -15),
    proximoPasoEn: sumarDias(ahora(), 20),
    motivoPerdida: null,
    archivadoEn: null,
    contactos: [
      {
        id: 'contacto-vet-1',
        clienteId: 'cliente-veterinaria-san-francisco',
        nombre: 'Gustavo Ríos',
        cargo: 'Veterinario a cargo',
        telefono: '+595 987 666 777',
        email: null,
        esDecisor: true,
        canalPreferido: 'telefono',
      },
    ],
    productosVigentes: ['agendar-ia'],
    productosPropuestos: [],
    planId: null,
    potencialPorMoneda: [],
  }),
  clienteBase({
    id: 'cliente-gomeria-el-rayo',
    tipo: 'empresa',
    nombre: 'Gomería El Rayo',
    actividadId: 'gomeria',
    operacionesConfirmadas: ['atiende-por-whatsapp'],
    vendedorId: VENDEDOR_DEMO,
    etapa: 'perdido',
    ciudad: 'Capiatá',
    ultimaInteraccionEn: sumarDias(ahora(), -30),
    proximoPasoEn: null,
    motivoPerdida: 'Decidió seguir anotando los turnos a mano por ahora.',
    archivadoEn: null,
    contactos: [],
    productosVigentes: [],
    productosPropuestos: [],
    planId: null,
    potencialPorMoneda: [],
  }),
];

const lineaDeTiempoSemilla: EventoLineaTiempo[] = [
  {
    id: 'evento-pame-presentacion',
    clienteId: 'cliente-pame-garelik-bags',
    tipo: 'presentacion',
    ocurridoEn: sumarDias(ahora(), -20),
    titulo: 'Presentación de Smart Commerce',
    detalle: 'Se mostró el dashboard gerencial con foco en artículos, pruebas y combinaciones.',
    referenciaId: 'referencia-presentacion-pame',
  },
  {
    id: 'evento-pame-mensualidad',
    clienteId: 'cliente-pame-garelik-bags',
    tipo: 'mensualidad',
    ocurridoEn: sumarDias(ahora(), -6),
    titulo: 'Mensualidad de Smart Commerce vigente',
    detalle: null,
    referenciaId: 'referencia-mensualidad-pame',
  },
  {
    id: 'evento-repuestos-etapa',
    clienteId: 'cliente-repuestos-san-roque',
    tipo: 'cambio_etapa',
    ocurridoEn: sumarDias(ahora(), -5),
    titulo: 'Pasó a Negociación',
    detalle: null,
    referenciaId: 'cliente-repuestos-san-roque',
  },
  {
    id: 'evento-repuestos-cotizacion',
    clienteId: 'cliente-repuestos-san-roque',
    tipo: 'cotizacion',
    ocurridoEn: sumarDias(ahora(), -2),
    titulo: 'Cotización enviada para revisión',
    detalle: 'Radar Stock + Cotiza Fácil.',
    referenciaId: 'referencia-cotizacion-repuestos',
  },
  {
    id: 'evento-mercedes-apertura',
    clienteId: 'cliente-hotel-las-mercedes',
    tipo: 'acceso_enlace',
    ocurridoEn: sumarDias(ahora(), -1),
    titulo: 'El cliente abrió la cotización',
    detalle: 'Abierta ayer. Es el momento de llamar.',
    referenciaId: 'referencia-apertura-mercedes',
  },
];

const seguimientosSemilla: Seguimiento[] = [
  {
    id: 'seguimiento-repuestos-1',
    clienteId: 'cliente-repuestos-san-roque',
    vendedorId: VENDEDOR_DEMO,
    origen: 'texto',
    ocurridoEn: sumarDias(ahora(), -2),
    registradoEn: sumarDias(ahora(), -2),
    texto: 'Diego pidió una cotización de Radar Stock. Quedé en enviarla esta semana.',
    audio: null,
    productosMencionados: ['radar-stock'],
    pasos: [
      {
        id: 'paso-repuestos-1',
        seguimientoId: 'seguimiento-repuestos-1',
        titulo: 'Enviar la información conversada',
        venceEn: sumarDias(ahora(), 1),
        estado: 'aceptado',
        resueltoEn: null,
      },
    ],
    adjuntos: [],
    confirmadoPorUsuario: true,
  },
  {
    id: 'seguimiento-liz-1',
    clienteId: 'cliente-dra-liz-acosta',
    vendedorId: VENDEDOR_DEMO,
    origen: 'voz',
    ocurridoEn: sumarDias(ahora(), -1),
    registradoEn: sumarDias(ahora(), -1),
    texto: 'La doctora comentó que pierde turnos porque atiende el teléfono mientras trabaja con pacientes.',
    audio: {
      id: 'audio-liz-1',
      duracionSegundos: 42,
      formato: 'audio/webm',
      almacenamientoRef: 'audio-demo-liz-1',
      retencionHasta: sumarDias(ahora(), RETENCION_AUDIO_DIAS - 1),
      borradoEn: null,
      borradoPor: null,
    },
    productosMencionados: ['agendar-ia'],
    pasos: [],
    adjuntos: [],
    confirmadoPorUsuario: true,
  },
];

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

let clientes: ClienteInterno[] = clientesSemilla.map((c) => ({ ...c }));
let lineaDeTiempo: EventoLineaTiempo[] = lineaDeTiempoSemilla.map((e) => ({ ...e }));
let seguimientos: Seguimiento[] = seguimientosSemilla.map((s) => ({ ...s }));
const clavesUsadas = new Map<string, unknown>();

/** Referencia estable a la semilla, para que datos-agenda.ts arme entradas coherentes. */
export const CLIENTES_REFERENCIA: ReadonlyArray<Pick<Cliente, 'id' | 'nombre' | 'vendedorId'>> =
  clientesSemilla.map((c) => ({ id: c.id, nombre: c.nombre, vendedorId: c.vendedorId }));

function idempotente<T>(clave: string, crear: () => T): T {
  if (clavesUsadas.has(clave)) return clavesUsadas.get(clave) as T;
  const resultado = crear();
  clavesUsadas.set(clave, resultado);
  return resultado;
}

function aClienteDetalle(interno: ClienteInterno): ClienteDetalle {
  return { ...interno };
}

function aCliente(interno: ClienteInterno): Cliente {
  return {
    id: interno.id,
    tipo: interno.tipo,
    nombre: interno.nombre,
    actividadId: interno.actividadId,
    operacionesConfirmadas: interno.operacionesConfirmadas,
    vendedorId: interno.vendedorId,
    etapa: interno.etapa,
    ciudad: interno.ciudad,
    ultimaInteraccionEn: interno.ultimaInteraccionEn,
    proximoPasoEn: interno.proximoPasoEn,
    motivoPerdida: interno.motivoPerdida,
    archivadoEn: interno.archivadoEn,
    creadoEn: interno.creadoEn,
    creadoPor: interno.creadoPor,
    actualizadoEn: interno.actualizadoEn,
    actualizadoPor: interno.actualizadoPor,
    version: interno.version,
  };
}

// ---------------------------------------------------------------------------
// Fábrica de la capa
// ---------------------------------------------------------------------------

export function crearCapaClientesMock(nucleo: NucleoMock): CapaClientes {
  return {
    async listarClientes(filtro: FiltroClientes, pagina?: OpcionesPagina) {
      let items = clientes.slice();
      if (filtro.tipo) items = items.filter((c) => c.tipo === filtro.tipo);
      if (filtro.actividadId) items = items.filter((c) => c.actividadId === filtro.actividadId);
      if (filtro.etapa) items = items.filter((c) => c.etapa === filtro.etapa);
      if (filtro.vendedorId) items = items.filter((c) => c.vendedorId === filtro.vendedorId);
      if (filtro.sinContactoDesde) {
        items = items.filter((c) => !c.ultimaInteraccionEn || c.ultimaInteraccionEn < filtro.sinContactoDesde!);
      }
      if (filtro.texto) {
        const texto = filtro.texto.toLowerCase();
        items = items.filter((c) => c.nombre.toLowerCase().includes(texto));
      }
      items = items.filter((c) => !c.archivadoEn);
      return nucleo.responder(nucleo.paginar(items.map(aCliente), pagina?.cursor, pagina?.limite));
    },

    async obtenerCliente(id: Id) {
      const encontrado = clientes.find((c) => c.id === id);
      if (!encontrado) {
        return nucleo.responderError<ClienteDetalle>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos ese cliente.' });
      }
      return nucleo.responder(aClienteDetalle(encontrado));
    },

    async crearCliente(datos: NuevoCliente, clave) {
      return idempotente(clave, () => {
        const nuevo = clienteBase({
          id: nucleo.identificador('cliente'),
          tipo: datos.tipo,
          nombre: datos.nombre,
          actividadId: datos.actividadId,
          operacionesConfirmadas: datos.operacionesConfirmadas ?? [],
          vendedorId: VENDEDOR_DEMO,
          etapa: 'sin_contactar',
          ciudad: datos.ciudad ?? null,
          ultimaInteraccionEn: null,
          proximoPasoEn: null,
          motivoPerdida: null,
          archivadoEn: null,
          contactos: (datos.contactos ?? []).map((c) => ({ ...c, id: nucleo.identificador('contacto'), clienteId: '' })),
          productosVigentes: [],
          productosPropuestos: [],
          planId: null,
          potencialPorMoneda: [],
        });
        const conClienteId = { ...nuevo, contactos: nuevo.contactos.map((c) => ({ ...c, clienteId: nuevo.id })) };
        clientes = [...clientes, conClienteId];
        return nucleo.responder(aCliente(conClienteId));
      });
    },

    async actualizarCliente(id: Id, cambios: Partial<NuevoCliente>, version: Version) {
      const indice = clientes.findIndex((c) => c.id === id);
      if (indice === -1) {
        return nucleo.responderError<Cliente>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos ese cliente.' });
      }
      const actual = clientes[indice]!;
      if (actual.version !== version) {
        return nucleo.responderError<Cliente>({
          codigo: 'conflicto_version',
          mensajeAmable: 'Este cliente cambió mientras lo editabas. Volvé a abrirlo para ver lo último.',
        });
      }
      const actualizado: ClienteInterno = {
        ...actual,
        tipo: cambios.tipo ?? actual.tipo,
        nombre: cambios.nombre ?? actual.nombre,
        actividadId: cambios.actividadId ?? actual.actividadId,
        operacionesConfirmadas: cambios.operacionesConfirmadas ?? actual.operacionesConfirmadas,
        ciudad: cambios.ciudad ?? actual.ciudad,
        version: actual.version + 1,
        actualizadoEn: ahora(),
        actualizadoPor: VENDEDOR_DEMO,
      };
      clientes = clientes.map((c, i) => (i === indice ? actualizado : c));
      return nucleo.responder(aCliente(actualizado));
    },

    async listarContactos(clienteId: Id) {
      const cliente = clientes.find((c) => c.id === clienteId);
      return nucleo.responder(nucleo.listar(cliente?.contactos ?? []));
    },

    async lineaDeTiempo(clienteId: Id, pagina?: OpcionesPagina) {
      const eventos = lineaDeTiempo
        .filter((e) => e.clienteId === clienteId)
        .slice()
        .sort((a, b) => (a.ocurridoEn < b.ocurridoEn ? 1 : -1));
      return nucleo.responder(nucleo.paginar(eventos, pagina?.cursor, pagina?.limite));
    },

    async soporteDictado() {
      const soporte: SoporteDictado = { disponible: true, motivoNoDisponible: null };
      return nucleo.responder(soporte);
    },

    async subirAudio(archivo: Blob, clave) {
      return idempotente(clave, () => {
        const audio: AudioSeguimiento = {
          id: nucleo.identificador('audio'),
          duracionSegundos: 0,
          formato: archivo.type || 'audio/webm',
          almacenamientoRef: nucleo.identificador('almacenamiento'),
          retencionHasta: sumarDias(ahora(), RETENCION_AUDIO_DIAS),
          borradoEn: null,
          borradoPor: null,
        };
        return nucleo.responder(audio);
      });
    },

    async procesarCaptura(entrada: CapturaSeguimiento) {
      const propuesta: PropuestaDeSeguimiento = {
        notaEstructurada: entrada.texto.trim(),
        pasosPropuestos: detectarPasos(entrada.texto),
        etapaSugerida: sugerirEtapa(entrada.texto),
        productosMencionados: detectarProductos(entrada.texto),
        mencionesFueraDeCatalogo: detectarMencionesFueraDeCatalogo(entrada.texto),
        borradorRespuesta:
          entrada.texto.trim().length > 0
            ? 'Gracias por la charla de hoy. Te comparto lo que conversamos y quedo atento/a a tu confirmación.'
            : null,
      };
      return nucleo.responder(propuesta);
    },

    async guardarSeguimiento(datos: SeguimientoConfirmado, clave) {
      if (datos.confirmadoPorUsuario !== true) {
        return nucleo.responderError<Seguimiento>({ codigo: 'validacion', mensajeAmable: 'Falta confirmar el seguimiento antes de guardarlo.' });
      }
      return idempotente(clave, () => {
        const audio = datos.audioId
          ? {
              id: datos.audioId,
              duracionSegundos: 0,
              formato: 'audio/webm',
              almacenamientoRef: datos.audioId,
              retencionHasta: sumarDias(ahora(), RETENCION_AUDIO_DIAS),
              borradoEn: null,
              borradoPor: null,
            }
          : null;
        const nuevo: Seguimiento = {
          id: nucleo.identificador('seguimiento'),
          clienteId: datos.clienteId,
          vendedorId: VENDEDOR_DEMO,
          origen: datos.origen,
          ocurridoEn: datos.ocurridoEn,
          registradoEn: ahora(),
          texto: datos.texto,
          audio,
          productosMencionados: datos.productosMencionados,
          pasos: datos.pasosAceptados.map((p) => ({
            id: nucleo.identificador('paso'),
            seguimientoId: '',
            titulo: p.titulo,
            venceEn: p.venceEn,
            estado: 'aceptado' as EstadoPaso,
            resueltoEn: null,
          })),
          adjuntos: [],
          confirmadoPorUsuario: true,
        };
        const conSeguimientoId = { ...nuevo, pasos: nuevo.pasos.map((p) => ({ ...p, seguimientoId: nuevo.id })) };
        seguimientos = [...seguimientos, conSeguimientoId];

        lineaDeTiempo = [
          ...lineaDeTiempo,
          {
            id: nucleo.identificador('evento'),
            clienteId: datos.clienteId,
            tipo: 'seguimiento',
            ocurridoEn: datos.ocurridoEn,
            titulo: datos.origen === 'voz' ? 'Seguimiento por voz' : 'Seguimiento por texto',
            detalle: datos.texto,
            referenciaId: conSeguimientoId.id,
          },
        ];

        const indiceCliente = clientes.findIndex((c) => c.id === datos.clienteId);
        if (indiceCliente !== -1) {
          const actual = clientes[indiceCliente]!;
          const proximoPasoEn = datos.pasosAceptados[0]?.venceEn ?? actual.proximoPasoEn;
          const etapaSugerida = datos.aplicarEtapaSugerida ? sugerirEtapa(datos.texto) : null;
          clientes = clientes.map((c, i) =>
            i === indiceCliente
              ? {
                  ...c,
                  ultimaInteraccionEn: datos.ocurridoEn,
                  proximoPasoEn,
                  etapa: etapaSugerida ?? c.etapa,
                  actualizadoEn: ahora(),
                  actualizadoPor: VENDEDOR_DEMO,
                  version: c.version + 1,
                }
              : c,
          );
        }

        return nucleo.responder(conSeguimientoId);
      });
    },

    async listarSeguimientos(filtro: FiltroSeguimientos, pagina?: OpcionesPagina) {
      let items = seguimientos.slice();
      if (filtro.clienteId) items = items.filter((s) => s.clienteId === filtro.clienteId);
      if (filtro.origen) items = items.filter((s) => s.origen === filtro.origen);
      if (filtro.desde) items = items.filter((s) => s.ocurridoEn >= filtro.desde!);
      if (filtro.hasta) items = items.filter((s) => s.ocurridoEn <= filtro.hasta!);
      if (filtro.conPasosAbiertos) items = items.filter((s) => s.pasos.some((p) => p.estado === 'propuesto' || p.estado === 'aceptado'));
      items = items.slice().sort((a, b) => (a.ocurridoEn < b.ocurridoEn ? 1 : -1));
      return nucleo.responder(nucleo.paginar(items, pagina?.cursor, pagina?.limite));
    },

    async borrarAudio(audioId: Id, _motivo: string) {
      const indice = seguimientos.findIndex((s) => s.audio?.id === audioId);
      if (indice === -1) {
        return nucleo.responderError<void>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos ese audio.' });
      }
      const actual = seguimientos[indice]!;
      const actualizado: Seguimiento = {
        ...actual,
        audio: actual.audio ? { ...actual.audio, borradoEn: ahora(), borradoPor: VENDEDOR_DEMO } : null,
      };
      seguimientos = seguimientos.map((s, i) => (i === indice ? actualizado : s));
      return nucleo.responder<void>(undefined);
    },

    async actualizarPaso(pasoId: Id, estado: EstadoPaso) {
      let encontrado: PasoSugerido | null = null;
      seguimientos = seguimientos.map((s) => {
        if (!s.pasos.some((p) => p.id === pasoId)) return s;
        const pasos = s.pasos.map((p) => {
          if (p.id !== pasoId) return p;
          const actualizado: PasoSugerido = {
            ...p,
            estado,
            resueltoEn: estado === 'resuelto' || estado === 'descartado' ? ahora() : p.resueltoEn,
          };
          encontrado = actualizado;
          return actualizado;
        });
        return { ...s, pasos };
      });
      if (!encontrado) {
        return nucleo.responderError<PasoSugerido>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos ese paso.' });
      }
      return nucleo.responder(encontrado);
    },
  };
}
