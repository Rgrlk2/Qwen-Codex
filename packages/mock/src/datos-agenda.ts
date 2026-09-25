/**
 * Datos de ejemplo — dominio: agenda.
 *
 * ⛔ DUEÑA: Sesión 4. Ninguna otra sesión edita este archivo.
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 * Los tres salen de la MISMA implementación: dependen de `NucleoMock`
 * (packages/mock/src/nucleo.ts).
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
 * Los clientes y la vendedora referenciados son los mismos de
 * datos-clientes.ts y datos-sesion.ts, para que las tres vistas cuenten la
 * misma historia con la misma fecha de referencia (`AHORA`).
 *
 * ⛔ `EntradaAgenda` no tiene un campo propio para "motivo de descarte": el
 *    contrato (packages/compartido/src/agenda.ts) sólo declara
 *    `motivoReprogramacion`, documentado para el ajuste de fecha. Este mock
 *    reutiliza ese mismo campo como bitácora del último motivo (ajuste o
 *    descarte) hasta que exista uno dedicado — ver docs/PEDIDOS.md.
 */

import type {
  AjusteEntrada, BarraCronograma,
  CronogramaComercial, EntradaAgenda, EstadoEntrada,
  FiltroAgenda, Id, ISODate, NuevaEntradaManual, OpcionesPagina, TipoEntradaAgenda,
} from '@labia/compartido';
import type { CapaAgenda } from '@labia/compartido';
import {
  armarAgendaHoy, armarAgendaMes, armarAgendaSemana, marcarAtraso,
} from '@labia/compartido';
import type { NucleoMock } from './nucleo';
import { AHORA, CLIENTES_REFERENCIA } from './datos-clientes';
import { CUENTAS_DE_EJEMPLO } from './datos-sesion';

const VENDEDOR_DEMO: Id = CUENTAS_DE_EJEMPLO.find((c) => c.rol === 'vendedor')?.id ?? 'usr-jpfdz';

function ahora(): ISODate {
  return AHORA;
}

function sumarDias(fecha: ISODate, dias: number): ISODate {
  const base = new Date(fecha);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString();
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
  datos: Omit<EntradaInterna, 'vendedorId' | 'nombreCliente' | 'clienteId'> &
    { readonly clienteId?: Id | null; readonly clienteNombre?: string },
): EntradaInterna {
  const { clienteNombre, clienteId: clienteIdExplicito, ...resto } = datos;
  const clienteId = clienteIdExplicito ?? (clienteNombre ? idDeCliente(clienteNombre) : null);
  return {
    ...resto,
    vendedorId: VENDEDOR_DEMO,
    clienteId,
    nombreCliente: nombreDeCliente(clienteId),
  };
}

const entradasSemilla: EntradaInterna[] = [
  entrada({
    id: 'agenda-pame-vencimiento',
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
    id: 'agenda-repuestos-cotizacion',
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
    id: 'agenda-repuestos-proximo-paso',
    tipo: 'proximo_paso',
    origen: 'seguimiento',
    referenciaId: 'seguimiento-repuestos-1',
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
    id: 'agenda-nandutii-presentacion',
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
    id: 'agenda-nandutii-visita',
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
    id: 'agenda-liz-proximo-paso',
    tipo: 'proximo_paso',
    origen: 'seguimiento',
    referenciaId: 'seguimiento-liz-1',
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
    id: 'agenda-bella-imagen-llamada',
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
    id: 'agenda-mercedes-apertura',
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
    id: 'agenda-motel-luna-objetivo',
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
    id: 'agenda-veterinaria-hito',
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
    id: 'agenda-gomeria-proximo-paso',
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
    id: string;
    clienteNombre: string;
    etapa: string;
    desdeHace: number;
    hastaEn: number;
    enRiesgo: boolean;
    motivoRiesgo: string | null;
    hitos: ReadonlyArray<{ id: string; titulo: string; enDias: number; cumplido: boolean; tipo: TipoEntradaAgenda }>;
  }> = [
    {
      id: 'cronograma-pame',
      clienteNombre: 'Pame Garelik Bags',
      etapa: 'cliente_activo',
      desdeHace: 40,
      hastaEn: 0,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [
        { id: 'hito-pame-presentacion', titulo: 'Presentación de Smart Commerce', enDias: -20, cumplido: true, tipo: 'presentacion_enviada' },
        { id: 'hito-pame-mensualidad', titulo: 'Mensualidad vigente', enDias: -6, cumplido: true, tipo: 'vencimiento' },
      ],
    },
    {
      id: 'cronograma-repuestos',
      clienteNombre: 'Repuestos San Roque',
      etapa: 'negociacion',
      desdeHace: 10,
      hastaEn: 5,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [
        { id: 'hito-repuestos-cotizacion', titulo: 'Cotización enviada a revisión', enDias: -2, cumplido: true, tipo: 'cotizacion_en_revision' },
        { id: 'hito-repuestos-proximo-paso', titulo: 'Enviar la información conversada', enDias: 1, cumplido: false, tipo: 'proximo_paso' },
      ],
    },
    {
      id: 'cronograma-nandutii',
      clienteNombre: 'Parrillada Ñandutí',
      etapa: 'presentacion',
      desdeHace: 8,
      hastaEn: 7,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [
        { id: 'hito-nandutii-presentacion', titulo: 'Presentación enviada', enDias: -4, cumplido: true, tipo: 'presentacion_enviada' },
        { id: 'hito-nandutii-visita', titulo: 'Visitar el local', enDias: 7, cumplido: false, tipo: 'visita' },
      ],
    },
    {
      id: 'cronograma-mercedes',
      clienteNombre: 'Hotel Las Mercedes',
      etapa: 'cotizacion',
      desdeHace: 12,
      hastaEn: 6,
      enRiesgo: true,
      motivoRiesgo: 'El cliente abrió la cotización y todavía no respondió.',
      hitos: [{ id: 'hito-mercedes-apertura', titulo: 'Apertura de la cotización', enDias: -1, cumplido: true, tipo: 'apertura_enlace' }],
    },
    {
      id: 'cronograma-veterinaria',
      clienteNombre: 'Veterinaria San Francisco',
      etapa: 'ganado',
      desdeHace: 30,
      hastaEn: 0,
      enRiesgo: false,
      motivoRiesgo: null,
      hitos: [{ id: 'hito-veterinaria-puesta-marcha', titulo: 'Puesta en marcha de Agendar IA', enDias: -15, cumplido: true, tipo: 'hito_plan' }],
    },
  ];

  return barras.map((barra) => ({
    id: barra.id,
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
      id: h.id,
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

/** Recalcula `atrasada` y `diasDeAtraso` contra la fecha de referencia del mock (`AHORA`). */
/** El de compartido, con el reloj congelado de los datos de ejemplo. */
function conAtraso(e: EntradaInterna): EntradaAgenda {
  return marcarAtraso(e, ahora());
}

function fechaRelevante(e: EntradaAgenda): ISODate | null {
  return e.venceEn ?? e.inicioEn;
}

// ---------------------------------------------------------------------------
// Fábrica de la capa
// ---------------------------------------------------------------------------

export function crearCapaAgendaMock(nucleo: NucleoMock): CapaAgenda {
  function todasVigentes(): ReadonlyArray<EntradaAgenda> {
    return nucleo.listar(entradas.map((e) => marcarAtraso(e, ahora())));
  }

  return {
    async agendaHoy(fecha?: ISODate) {
      return nucleo.responder(armarAgendaHoy(todasVigentes(), fecha ?? ahora()));
    },

    async agendaSemana(desde?: ISODate) {
      return nucleo.responder(armarAgendaSemana(todasVigentes(), desde ?? ahora()));
    },

    async agendaMes(anio: number, mes: number) {
      return nucleo.responder(armarAgendaMes(todasVigentes(), anio, mes));
    },

    async cronogramaComercial(desde: ISODate, hasta: ISODate) {
      const barras = nucleo.listar(cronograma.filter((b) => b.hasta >= desde && b.desde <= hasta));
      return nucleo.responder({ desde, hasta, barras } satisfies CronogramaComercial);
    },

    async listarEntradas(filtro: FiltroAgenda, pagina?: OpcionesPagina) {
      let items = todasVigentes();
      if (filtro.vendedorId) items = items.filter((e) => e.vendedorId === filtro.vendedorId);
      if (filtro.clienteId) items = items.filter((e) => e.clienteId === filtro.clienteId);
      if (filtro.tipo) items = items.filter((e) => e.tipo === filtro.tipo);
      if (filtro.estado) items = items.filter((e) => e.estado === filtro.estado);
      if (filtro.prioridad) items = items.filter((e) => e.prioridad === filtro.prioridad);
      if (filtro.desde) items = items.filter((e) => (fechaRelevante(e) ?? '') >= filtro.desde!);
      if (filtro.hasta) items = items.filter((e) => (fechaRelevante(e) ?? '') <= filtro.hasta!);
      if (filtro.soloAtrasados) items = items.filter((e) => e.atrasada);
      return nucleo.responder(nucleo.paginar(items, pagina?.cursor, pagina?.limite));
    },

    async entradasAtrasadas(pagina?: OpcionesPagina) {
      const items = todasVigentes().filter((e) => e.atrasada);
      return nucleo.responder(nucleo.paginar(items, pagina?.cursor, pagina?.limite));
    },

    async crearEntradaManual(datos: NuevaEntradaManual, clave) {
      return idempotente(clave, () => {
        const nueva: EntradaInterna = {
          id: nucleo.identificador('agenda'),
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
        return nucleo.responder(conAtraso(nueva));
      });
    },

    async ajustarEntrada(ajuste: AjusteEntrada) {
      if (!ajuste.motivo || ajuste.motivo.trim().length === 0) {
        return nucleo.responderError<EntradaAgenda>({ codigo: 'validacion', mensajeAmable: 'Contá por qué movés la fecha antes de guardar.', campo: 'motivo' });
      }
      const indice = entradas.findIndex((e) => e.id === ajuste.entradaId);
      if (indice === -1) {
        return nucleo.responderError<EntradaAgenda>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.' });
      }
      const actual = entradas[indice]!;
      if (actual.estado === 'completada' || actual.estado === 'descartada') {
        return nucleo.responderError<EntradaAgenda>({ codigo: 'regla_comercial', mensajeAmable: 'Esta entrada ya se resolvió: no se puede mover.' });
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
      return nucleo.responder(conAtraso(actualizada));
    },

    async completarEntrada(entradaId: Id, clave) {
      const indice = entradas.findIndex((e) => e.id === entradaId);
      if (indice === -1) {
        return nucleo.responderError<EntradaAgenda>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.' });
      }
      return idempotente(clave, () => {
        const actual = entradas[indice]!;
        const actualizada: EntradaInterna = { ...actual, estado: 'completada', completadaEn: ahora() };
        entradas = entradas.map((e, i) => (i === indice ? actualizada : e));
        return nucleo.responder(conAtraso(actualizada));
      });
    },

    async descartarEntrada(entradaId: Id, motivo: string) {
      if (!motivo || motivo.trim().length === 0) {
        return nucleo.responderError<EntradaAgenda>({ codigo: 'validacion', mensajeAmable: 'Contá por qué descartás esta entrada.', campo: 'motivo' });
      }
      const indice = entradas.findIndex((e) => e.id === entradaId);
      if (indice === -1) {
        return nucleo.responderError<EntradaAgenda>({ codigo: 'no_encontrado', mensajeAmable: 'No encontramos esa entrada de agenda.' });
      }
      const actual = entradas[indice]!;
      const actualizada: EntradaInterna = {
        ...actual,
        estado: 'descartada',
        motivoReprogramacion: `Descartada: ${motivo}`,
      };
      entradas = entradas.map((e, i) => (i === indice ? actualizada : e));
      return nucleo.responder(conAtraso(actualizada));
    },
  };
}
