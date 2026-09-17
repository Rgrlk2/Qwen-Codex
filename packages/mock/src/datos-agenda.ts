/**
 * Datos de ejemplo — dominio: agenda.
 *
 * ⛔ DUEÑA: Sesión 4. Ninguna otra sesión edita este archivo.
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin roles fuera de vendedor y administrador.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 *
 * LA AGENDA SE POBLÓ SOLA: casi todas las entradas de la semilla tienen un
 * `origen` distinto de `manual` (plan, seguimiento, presentación, cotización,
 * vencimiento, apertura de enlace, objetivo aceptado). La única excepción real
 * la crea el vendedor con `crearEntradaManual`, en tiempo de uso.
 *
 * Los clientes referenciados son los mismos de datos-clientes.ts
 * (`CLIENTES_REFERENCIA`), para que ambas vistas cuenten la misma historia.
 *
 * ⛔ `EntradaAgenda` no tiene un campo propio para "motivo de descarte": el
 *    contrato (packages/compartido/src/agenda.ts) sólo declara
 *    `motivoReprogramacion`, documentado para el ajuste de fecha. Este mock
 *    reutiliza ese mismo campo como bitácora del último motivo (ajuste o
 *    descarte) hasta que exista uno dedicado — ver docs/PEDIDOS.md.
 */

import type {
  AgendaHoy, AgendaMes, AgendaSemana, AjusteEntrada, BarraCronograma,
  CronogramaComercial, DiaDeMes, DiaDeSemana, EntradaAgenda, EstadoEntrada,
  FiltroAgenda, Id, ISODate, NuevaEntradaManual, OpcionesPagina, Pagina,
  Resultado, TipoEntradaAgenda,
} from '@labia/compartido';
import type { CapaAgenda } from '@labia/compartido';
import type { ConfiguracionMock } from './nucleo';
import { CLIENTES_REFERENCIA } from './datos-clientes';

const VENDEDOR_DEMO: Id = 'vendedor-demo-1';

// ---------------------------------------------------------------------------
// Utilidades locales — mismo criterio que datos-clientes.ts: sin depender de
// apps/escritorio/src/nucleo/formato.ts, todavía sin implementar (S1).
// ---------------------------------------------------------------------------

let contador = 0;
function generarId(prefijo: string): Id {
  contador += 1;
  return `${prefijo}-${contador.toString(36)}`;
}

function ahora(): ISODate {
  return new Date().toISOString();
}

function sumarDias(fecha: ISODate, dias: number): ISODate {
  const base = new Date(fecha);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString();
}

function inicioDelDia(fecha: ISODate): Date {
  const base = new Date(fecha);
  base.setUTCHours(0, 0, 0, 0);
  return base;
}

function finDelDia(fecha: ISODate): Date {
  const base = new Date(fecha);
  base.setUTCHours(23, 59, 59, 999);
  return base;
}

function mismoDia(a: ISODate, b: ISODate): boolean {
  return inicioDelDia(a).getTime() === inicioDelDia(b).getTime();
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function responder<T>(config: () => ConfiguracionMock, datos: T): Promise<Resultado<T>> {
  const actual = config();
  await esperar(actual.latenciaMs);
  if (actual.fallaForzada) {
    return { ok: false, error: actual.fallaForzada };
  }
  return { ok: true, datos };
}

function paginar<T>(items: ReadonlyArray<T>, opciones?: OpcionesPagina): Pagina<T> {
  const limite = opciones?.limite ?? 20;
  const inicio = opciones?.cursor ? Number.parseInt(opciones.cursor, 10) : 0;
  const pagina = items.slice(inicio, inicio + limite);
  const siguiente = inicio + limite;
  return {
    items: pagina,
    cursor: siguiente < items.length ? String(siguiente) : null,
    total: items.length,
  };
}

function nombreDeCliente(clienteId: Id | null): string | null {
  if (!clienteId) return null;
  return CLIENTES_REFERENCIA.find((c) => c.id === clienteId)?.nombre ?? null;
}

function idDeCliente(nombre: string): Id {
  const encontrado = CLIENTES_REFERENCIA.find((c) => c.nombre === nombre);
  if (!encontrado) throw new Error(`Cliente de ejemplo no encontrado: ${nombre}`);
  return encontrado.id;
}

// ---------------------------------------------------------------------------
// Semilla — la agenda ya poblada
// ---------------------------------------------------------------------------

interface EntradaInterna extends Omit<EntradaAgenda, 'atrasada' | 'diasDeAtraso'> {}

function entrada(
  datos: Omit<EntradaInterna, 'id' | 'vendedorId' | 'nombreCliente' | 'clienteId'> &
    { readonly clienteId?: Id | null; readonly clienteNombre?: string },
): EntradaInterna {
  const { clienteNombre, clienteId: clienteIdExplicito, ...resto } = datos;
  const clienteId = clienteIdExplicito ?? (clienteNombre ? idDeCliente(clienteNombre) : null);
  return {
    ...resto,
    id: generarId('agenda'),
    vendedorId: VENDEDOR_DEMO,
    clienteId,
    nombreCliente: nombreDeCliente(clienteId),
  };
}

const entradasSemilla: EntradaInterna[] = [
  entrada({
    tipo: 'vencimiento',
    origen: 'vencimiento',
    referenciaId: 'referencia-mensualidad-pame',
    clienteNombre: 'Pame Garelik Bags',
    titulo: 'Revisar la mensualidad de Smart Commerce',
    detalle: 'Vigencia mensual: confirmar que siga activa antes de la renovación.',
    productoId: 'smart-commerce',
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), 5),
    prioridad: 'media',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'cotizacion_en_revision',
    origen: 'cotizacion',
    referenciaId: 'referencia-cotizacion-repuestos',
    clienteNombre: 'Repuestos San Roque',
    titulo: 'Cotización de Radar Stock + Cotiza Fácil en revisión',
    detalle: 'Enviada al administrador. Todavía sin aprobación.',
    productoId: 'radar-stock',
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), 2),
    prioridad: 'media',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'proximo_paso',
    origen: 'seguimiento',
    referenciaId: 'referencia-seguimiento-repuestos',
    clienteNombre: 'Repuestos San Roque',
    titulo: 'Enviar la información conversada',
    detalle: 'Diego pidió una cotización de Radar Stock.',
    productoId: 'radar-stock',
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), 1),
    prioridad: 'alta',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'presentacion_enviada',
    origen: 'presentacion',
    referenciaId: 'referencia-presentacion-nandutii',
    clienteNombre: 'Parrillada Ñandutí',
    titulo: 'Presentación de Vendedor 24/7 y Ruta IA enviada',
    detalle: 'Recordatorio para preguntar si la vieron.',
    productoId: 'vendedor-24-7',
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), 2),
    prioridad: 'media',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'visita',
    origen: 'plan',
    referenciaId: 'referencia-plan-nandutii',
    clienteNombre: 'Parrillada Ñandutí',
    titulo: 'Visitar el local para ver el flujo de pedidos',
    detalle: null,
    productoId: null,
    inicioEn: sumarDias(ahora(), 7),
    finEn: sumarDias(ahora(), 7),
    venceEn: sumarDias(ahora(), 7),
    prioridad: 'baja',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'proximo_paso',
    origen: 'seguimiento',
    referenciaId: 'referencia-seguimiento-liz',
    clienteNombre: 'Dra. Liz Acosta — Odontología',
    titulo: 'Confirmar si le sirve Agendar IA para los turnos',
    detalle: 'Pierde turnos porque atiende el teléfono mientras trabaja con pacientes.',
    productoId: 'agendar-ia',
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), 2),
    prioridad: 'alta',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'llamada',
    origen: 'plan',
    referenciaId: 'referencia-plan-bella-imagen',
    clienteNombre: 'Peluquería Bella Imagen',
    titulo: 'Llamar para coordinar una demo',
    detalle: null,
    productoId: null,
    inicioEn: sumarDias(ahora(), -3),
    finEn: sumarDias(ahora(), -3),
    venceEn: sumarDias(ahora(), -3),
    prioridad: 'alta',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'apertura_enlace',
    origen: 'apertura_enlace',
    referenciaId: 'referencia-apertura-mercedes',
    clienteNombre: 'Hotel Las Mercedes',
    titulo: 'El cliente abrió tu cotización ayer a las 19:40',
    detalle: 'Es el momento de llamar.',
    productoId: 'precio-vivo',
    inicioEn: null,
    finEn: null,
    venceEn: ahora(),
    prioridad: 'alta',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'objetivo_aceptado',
    origen: 'objetivo_aceptado',
    referenciaId: 'referencia-objetivo-motel-luna',
    clienteNombre: 'Motel Luna',
    titulo: 'Primer contacto: presentarte y entender el negocio',
    detalle: null,
    productoId: null,
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), 1),
    prioridad: 'media',
    estado: 'pendiente',
    completadaEn: null,
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'hito_plan',
    origen: 'plan',
    referenciaId: 'referencia-plan-veterinaria',
    clienteNombre: 'Veterinaria San Francisco',
    titulo: 'Puesta en marcha de Agendar IA',
    detalle: null,
    productoId: 'agendar-ia',
    inicioEn: sumarDias(ahora(), -15),
    finEn: sumarDias(ahora(), -15),
    venceEn: sumarDias(ahora(), -15),
    prioridad: 'media',
    estado: 'completada',
    completadaEn: sumarDias(ahora(), -15),
    motivoReprogramacion: null,
    fechaAjustadaPorVendedor: false,
  }),
  entrada({
    tipo: 'proximo_paso',
    origen: 'seguimiento',
    referenciaId: 'referencia-seguimiento-gomeria',
    clienteNombre: 'Gomería El Rayo',
    titulo: 'Reintentar en un mes',
    detalle: 'Decidió seguir anotando los turnos a mano por ahora.',
    productoId: null,
    inicioEn: null,
    finEn: null,
    venceEn: sumarDias(ahora(), -25),
    prioridad: 'baja',
    estado: 'descartada',
    completadaEn: null,
    motivoReprogramacion: 'Descartada: el cliente prefiere retomar el contacto por su cuenta en unas semanas.',
    fechaAjustadaPorVendedor: false,
  }),
];

// ---------------------------------------------------------------------------
// Cronograma comercial — Gantt (con alternativa en lista a cargo de la vista)
// ---------------------------------------------------------------------------

const PROGRESO_POR_ETAPA: Readonly<Record<string, number>> = {
  sin_contactar: 5,
  contactado: 15,
  diagnostico: 30,
  presentacion: 50,
  cotizacion: 65,
  negociacion: 80,
  ganado: 100,
  perdido: 100,
  cliente_activo: 100,
};

function cronogramaSemilla(): ReadonlyArray<BarraCronograma> {
  const barras: Array<{
    clienteNombre: string;
    etapa: string;
    desdeHace: number;
    hastaEn: number;
    enRiesgo: boolean;
    motivoRiesgo: string | null;
    hitos: ReadonlyArray<{ titulo: string; enDias: number; cumplido: boolean; tipo: TipoEntradaAgenda }>;
  }> = [
    {
      clienteNombre: 'Pame Garelik Bags',
      etapa: 'cliente_activo',
      desdeHace: 40,
      hastaEn: 0,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [
        { titulo: 'Presentación de Smart Commerce', enDias: -20, cumplido: true, tipo: 'presentacion_enviada' },
        { titulo: 'Mensualidad vigente', enDias: -6, cumplido: true, tipo: 'vencimiento' },
      ],
    },
    {
      clienteNombre: 'Repuestos San Roque',
      etapa: 'negociacion',
      desdeHace: 10,
      hastaEn: 5,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [
        { titulo: 'Cotización enviada a revisión', enDias: -2, cumplido: true, tipo: 'cotizacion_en_revision' },
        { titulo: 'Enviar la información conversada', enDias: 1, cumplido: false, tipo: 'proximo_paso' },
      ],
    },
    {
      clienteNombre: 'Parrillada Ñandutí',
      etapa: 'presentacion',
      desdeHace: 8,
      hastaEn: 7,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [
        { titulo: 'Presentación enviada', enDias: -4, cumplido: true, tipo: 'presentacion_enviada' },
        { titulo: 'Visitar el local', enDias: 7, cumplido: false, tipo: 'visita' },
      ],
    },
    {
      clienteNombre: 'Hotel Las Mercedes',
      etapa: 'cotizacion',
      desdeHace: 12,
      hastaEn: 6,
      enRiesgo: true,
      motivoRiesgo: 'El cliente abrió la cotización y todavía no respondió.',
      hitos: [{ titulo: 'Apertura de la cotización', enDias: -1, cumplido: true, tipo: 'apertura_enlace' }],
    },
    {
      clienteNombre: 'Veterinaria San Francisco',
      etapa: 'ganado',
      desdeHace: 30,
      hastaEn: 0,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [{ titulo: 'Puesta en marcha de Agendar IA', enDias: -15, cumplido: true, tipo: 'hito_plan' }],
    },
  ];

  return barras.map((barra) => ({
    id: generarId('cronograma'),
    clienteId: idDeCliente(barra.clienteNombre),
    planId: null,
    titulo: barra.clienteNombre,
    desde: sumarDias(ahora(), -barra.desdeHace),
    hasta: sumarDias(ahora(), barra.hastaEn),
    etapa: barra.etapa,
    progreso: PROGRESO_POR_ETAPA[barra.etapa] ?? 0,
    enRiesgo: barra.enRiesgo,
    motivoRiesgo: barra.motivoRiesgo,
    hitos: barra.hitos.map((h) => ({
      id: generarId('hito'),
      titulo: h.titulo,
      fecha: sumarDias(ahora(), h.enDias),
      cumplido: h.cumplido,
      tipo: h.tipo,
      referenciaId: null,
    })),
  }));
}

// ---------------------------------------------------------------------------
// Estado en memoria
// ---------------------------------------------------------------------------

let entradas: EntradaInterna[] = entradasSemilla.map((e) => ({ ...e }));
const cronograma: ReadonlyArray<BarraCronograma> = cronogramaSemilla();
const clavesUsadas = new Map<string, unknown>();

function idempotente<T>(clave: string, crear: () => T): T {
  if (clavesUsadas.has(clave)) return clavesUsadas.get(clave) as T;
  const resultado = crear();
  clavesUsadas.set(clave, resultado);
  return resultado;
}

/** Recalcula `atrasada` y `diasDeAtraso` contra el reloj real en cada lectura. */
function conAtraso(e: EntradaInterna): EntradaAgenda {
  const fechaRelevante = e.venceEn ?? e.inicioEn;
  if (e.estado !== 'pendiente' || !fechaRelevante) {
    return { ...e, atrasada: false, diasDeAtraso: null };
  }
  const limite = inicioDelDia(ahora());
  const fecha = new Date(fechaRelevante);
  if (fecha >= limite) {
    return { ...e, atrasada: false, diasDeAtraso: null };
  }
  const dias = Math.max(1, Math.floor((limite.getTime() - fecha.getTime()) / 86_400_000));
  return { ...e, atrasada: true, diasDeAtraso: dias };
}

function fechaRelevante(e: EntradaAgenda): ISODate | null {
  return e.venceEn ?? e.inicioEn;
}

function coincideConDia(e: EntradaAgenda, dia: ISODate): boolean {
  const fecha = fechaRelevante(e);
  return fecha !== null && mismoDia(fecha, dia);
}

function esHastaHoy(e: EntradaAgenda, hoy: ISODate): boolean {
  const fecha = fechaRelevante(e);
  return fecha !== null && new Date(fecha) <= finDelDia(hoy);
}

function inicioDeSemana(fecha: ISODate): Date {
  const base = inicioDelDia(fecha);
  const diaSemana = base.getUTCDay();
  const desplazamiento = diaSemana === 0 ? 6 : diaSemana - 1;
  base.setUTCDate(base.getUTCDate() - desplazamiento);
  return base;
}

// ---------------------------------------------------------------------------
// Fábrica de la capa
// ---------------------------------------------------------------------------

export function crearCapaAgenda(obtenerConfiguracion: () => ConfiguracionMock): CapaAgenda {
  function todasVigentes(config: ReturnType<typeof obtenerConfiguracion>): EntradaAgenda[] {
    if (config.forzarVacio) return [];
    return entradas.map(conAtraso);
  }

  return {
    async agendaHoy(fecha?: ISODate) {
      const config = obtenerConfiguracion();
      const hoy = fecha ?? ahora();
      const vigentes = todasVigentes(config);
      const pendientes = vigentes.filter((e) => e.estado === 'pendiente');
      const atrasados = pendientes.filter((e) => e.atrasada);
      const noAtrasadosHastaHoy = pendientes.filter((e) => !e.atrasada && esHastaHoy(e, hoy));
      const respuesta: AgendaHoy = {
        fecha: hoy,
        visitas: noAtrasadosHastaHoy.filter((e) => e.tipo === 'visita'),
        llamadas: noAtrasadosHastaHoy.filter((e) => e.tipo === 'llamada'),
        proximosPasos: noAtrasadosHastaHoy.filter((e) => e.tipo === 'proximo_paso' || e.tipo === 'objetivo_aceptado'),
        vencimientos: noAtrasadosHastaHoy.filter((e) => e.tipo === 'vencimiento' || e.tipo === 'apertura_enlace' || e.tipo === 'cotizacion_en_revision' || e.tipo === 'presentacion_enviada'),
        atrasados,
        totalPendientes: pendientes.length,
      };
      return responder(obtenerConfiguracion, respuesta);
    },

    async agendaSemana(desde?: ISODate) {
      const config = obtenerConfiguracion();
      const vigentes = todasVigentes(config);
      const inicio = desde ? inicioDelDia(desde) : inicioDeSemana(ahora());
      const dias: DiaDeSemana[] = [];
      for (let i = 0; i < 7; i += 1) {
        const fechaDia = new Date(inicio);
        fechaDia.setUTCDate(fechaDia.getUTCDate() + i);
        const fechaISO = fechaDia.toISOString();
        const delDia = vigentes.filter((e) => e.estado === 'pendiente' && coincideConDia(e, fechaISO));
        dias.push({
          fecha: fechaISO,
          entradas: delDia,
          totalPendientes: delDia.length,
          totalAtrasados: delDia.filter((e) => e.atrasada).length,
        });
      }
      const ultimo = new Date(inicio);
      ultimo.setUTCDate(ultimo.getUTCDate() + 6);
      const respuesta: AgendaSemana = { desde: inicio.toISOString(), hasta: ultimo.toISOString(), dias };
      return responder(obtenerConfiguracion, respuesta);
    },

    async agendaMes(anio: number, mes: number) {
      const config = obtenerConfiguracion();
      const vigentes = todasVigentes(config);
      const primerDiaDelMes = new Date(Date.UTC(anio, mes - 1, 1));
      const inicioGrilla = inicioDeSemana(primerDiaDelMes.toISOString());
      const ultimoDiaDelMes = new Date(Date.UTC(anio, mes, 0));
      const finGrilla = inicioDeSemana(ultimoDiaDelMes.toISOString());
      finGrilla.setUTCDate(finGrilla.getUTCDate() + 6);

      const dias: DiaDeMes[] = [];
      const cursor = new Date(inicioGrilla);
      while (cursor.getTime() <= finGrilla.getTime()) {
        const fechaISO = cursor.toISOString();
        const delDia = vigentes.filter((e) => e.estado === 'pendiente' && coincideConDia(e, fechaISO));
        const cantidadPorTipo: Partial<Record<TipoEntradaAgenda, number>> = {};
        for (const e of delDia) cantidadPorTipo[e.tipo] = (cantidadPorTipo[e.tipo] ?? 0) + 1;
        dias.push({
          fecha: fechaISO,
          delMesActual: cursor.getUTCMonth() === mes - 1,
          cantidadPorTipo,
          tieneAtrasados: delDia.some((e) => e.atrasada),
          total: delDia.length,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      const semanas: DiaDeMes[][] = [];
      for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));

      const respuesta: AgendaMes = { anio, mes, semanas };
      return responder(obtenerConfiguracion, respuesta);
    },

    async cronogramaComercial(desde: ISODate, hasta: ISODate) {
      const config = obtenerConfiguracion();
      if (config.forzarVacio) {
        return responder(obtenerConfiguracion, { desde, hasta, barras: [] } satisfies CronogramaComercial);
      }
      const barras = cronograma.filter((b) => b.hasta >= desde && b.desde <= hasta);
      return responder(obtenerConfiguracion, { desde, hasta, barras } satisfies CronogramaComercial);
    },

    async listarEntradas(filtro: FiltroAgenda, pagina?: OpcionesPagina) {
      const config = obtenerConfiguracion();
      let items = todasVigentes(config);
      if (filtro.vendedorId) items = items.filter((e) => e.vendedorId === filtro.vendedorId);
      if (filtro.clienteId) items = items.filter((e) => e.clienteId === filtro.clienteId);
      if (filtro.tipo) items = items.filter((e) => e.tipo === filtro.tipo);
      if (filtro.estado) items = items.filter((e) => e.estado === filtro.estado);
      if (filtro.prioridad) items = items.filter((e) => e.prioridad === filtro.prioridad);
      if (filtro.desde) items = items.filter((e) => (fechaRelevante(e) ?? '') >= filtro.desde!);
      if (filtro.hasta) items = items.filter((e) => (fechaRelevante(e) ?? '') <= filtro.hasta!);
      if (filtro.soloAtrasados) items = items.filter((e) => e.atrasada);
      return responder(obtenerConfiguracion, paginar(items, pagina));
    },

    async entradasAtrasadas(pagina?: OpcionesPagina) {
      const config = obtenerConfiguracion();
      const items = todasVigentes(config).filter((e) => e.atrasada);
      return responder(obtenerConfiguracion, paginar(items, pagina));
    },

    async crearEntradaManual(datos: NuevaEntradaManual, clave) {
      return idempotente(clave, () => {
        const nueva: EntradaInterna = {
          id: generarId('agenda'),
          vendedorId: VENDEDOR_DEMO,
          tipo: datos.tipo,
          origen: 'manual',
          referenciaId: null,
          clienteId: datos.clienteId,
          nombreCliente: nombreDeCliente(datos.clienteId),
          titulo: datos.titulo,
          detalle: datos.detalle ?? null,
          productoId: null,
          inicioEn: datos.inicioEn,
          finEn: datos.finEn ?? null,
          venceEn: datos.finEn ?? datos.inicioEn,
          prioridad: datos.prioridad ?? 'media',
          estado: 'pendiente',
          completadaEn: null,
          motivoReprogramacion: null,
          fechaAjustadaPorVendedor: false,
        };
        entradas = [...entradas, nueva];
        return responder(obtenerConfiguracion, conAtraso(nueva));
      });
    },

    async ajustarEntrada(ajuste: AjusteEntrada) {
      if (!ajuste.motivo || ajuste.motivo.trim().length === 0) {
        return { ok: false, error: { codigo: 'validacion', mensajeAmable: 'Contá por qué movés la fecha antes de guardar.', campo: 'motivo' } };
      }
      const indice = entradas.findIndex((e) => e.id === ajuste.entradaId);
      if (indice === -1) {
        return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.' } };
      }
      const actual = entradas[indice]!;
      if (actual.estado === 'completada' || actual.estado === 'descartada') {
        return { ok: false, error: { codigo: 'regla_comercial', mensajeAmable: 'Esta entrada ya se resolvió: no se puede mover.' } };
      }
      const actualizada: EntradaInterna = {
        ...actual,
        inicioEn: ajuste.inicioEn ?? actual.inicioEn,
        finEn: ajuste.finEn ?? actual.finEn,
        venceEn: ajuste.venceEn ?? actual.venceEn,
        prioridad: ajuste.prioridad ?? actual.prioridad,
        estado: 'reprogramada' as EstadoEntrada,
        motivoReprogramacion: ajuste.motivo,
        fechaAjustadaPorVendedor: true,
      };
      entradas = entradas.map((e, i) => (i === indice ? actualizada : e));
      return responder(obtenerConfiguracion, conAtraso(actualizada));
    },

    async completarEntrada(entradaId: Id, clave) {
      const indice = entradas.findIndex((e) => e.id === entradaId);
      if (indice === -1) {
        return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.' } };
      }
      return idempotente(clave, () => {
        const actual = entradas[indice]!;
        const actualizada: EntradaInterna = { ...actual, estado: 'completada', completadaEn: ahora() };
        entradas = entradas.map((e, i) => (i === indice ? actualizada : e));
        return responder(obtenerConfiguracion, conAtraso(actualizada));
      });
    },

    async descartarEntrada(entradaId: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return { ok: false, error: { codigo: 'validacion', mensajeAmable: 'Contá por qué descartás esta entrada.', campo: 'motivo' } };
      }
      const indice = entradas.findIndex((e) => e.id === entradaId);
      if (indice === -1) {
        return { ok: false, error: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.' } };
      }
      const actual = entradas[indice]!;
      const actualizada: EntradaInterna = {
        ...actual,
        estado: 'descartada',
        motivoReprogramacion: `Descartada: ${motivo}`,
      };
      entradas = entradas.map((e, i) => (i === indice ? actualizada : e));
      return responder(obtenerConfiguracion, conAtraso(actualizada));
    },
  };
}
