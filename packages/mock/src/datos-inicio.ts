/**
 * Datos de ejemplo — dominio: inicio.
 *
 * ⛔ DUEÑO: Sesión 2. Ninguna otra sesión edita este archivo.
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse.
 *
 * Ofrece los tres escenarios que la vista Inicio necesita para probar sus
 * cuatro estados:
 *   1. con datos    2. vacío (cuenta nueva, sinDatosTodavia: true)    3. error
 *
 * `crearCapaInicioMock` implementa `CapaInicio` completo, con la misma
 * latencia simulada, falla forzada y modo vacío que el resto del mock
 * (mismo patrón que `datos-sesion.ts` → `crearCapaSesionMock`).
 * `packages/mock/src/index.ts` (Sesión 1) lo incorpora a `CapaDatos` al integrar.
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén en COMMERCIAL_RULES.md §2.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 * ⛔ Sin roles fuera de vendedor y administrador.
 */

import type {
  CapaInicio, EntradaAgenda, ProximoSeguimiento, Resultado, ResumenAgenda, ResumenInicio,
} from '@labia/compartido';

import type { NucleoMock } from './nucleo';

// ---------------------------------------------------------------------------
// Escenario 1 — con datos
// ---------------------------------------------------------------------------

export const RESUMEN_INICIO_CON_DATOS: ResumenInicio = {
  dineroVendido: [
    { monto: 48_500_000, moneda: 'PYG' },
    { monto: 320_000, moneda: 'USD' },
  ],
  dineroCobrado: [
    { monto: 31_200_000, moneda: 'PYG' },
    { monto: 180_000, moneda: 'USD' },
  ],
  comisionAcumulada: [
    { monto: 15_600_000, moneda: 'PYG' },
    { monto: 90_000, moneda: 'USD' },
  ],
  comisionPendiente: [
    { monto: 6_400_000, moneda: 'PYG' },
    { monto: 30_000, moneda: 'USD' },
  ],
  sinDatosTodavia: false,
  periodo: '2026-09',
};

export const PROXIMOS_SEGUIMIENTOS_CON_DATOS: ReadonlyArray<ProximoSeguimiento> = [
  {
    id: 'seg-001',
    clienteId: 'cli-001',
    nombreCliente: 'Repuestera del Este',
    titulo: 'Confirmar alcance de Radar Stock',
    venceEn: '2026-09-16T13:00:00-03:00',
    vencido: false,
    canal: 'whatsapp',
    origen: 'paso_seguimiento',
    referenciaId: 'pas-001',
  },
  {
    id: 'seg-002',
    clienteId: 'cli-002',
    nombreCliente: 'Dra. Marta Ayala — Odontología',
    titulo: 'Enviar presentación de Agendar.IA',
    venceEn: '2026-09-15T18:30:00-03:00',
    vencido: true,
    canal: 'telefono',
    origen: 'objetivo_plan',
    referenciaId: 'obj-014',
  },
  {
    id: 'seg-003',
    clienteId: 'cli-003',
    nombreCliente: 'Hotel Costanera',
    titulo: 'Llamar: abrió el enlace de la cotización',
    venceEn: '2026-09-16T09:00:00-03:00',
    vencido: false,
    canal: 'telefono',
    origen: 'apertura_enlace',
    referenciaId: 'cot-007',
  },
  {
    id: 'seg-004',
    clienteId: 'cli-004',
    nombreCliente: 'Comercial San Miguel S.A.',
    titulo: 'Retomar contacto tras la presentación',
    venceEn: '2026-09-18T10:00:00-03:00',
    vencido: false,
    canal: 'email',
    origen: 'paso_seguimiento',
    referenciaId: 'pas-009',
  },
];

const PROXIMA_ENTRADA_AGENDA: EntradaAgenda = {
  id: 'age-101',
  vendedorId: 'usr-vendedora',
  tipo: 'seguimiento_atrasado',
  origen: 'seguimiento',
  referenciaId: 'obj-014',
  clienteId: 'cli-002',
  nombreCliente: 'Dra. Marta Ayala — Odontología',
  titulo: 'Enviar presentación de Agendar.IA',
  detalle: null,
  productoId: 'agendar-ia',
  inicioEn: null,
  finEn: null,
  venceEn: '2026-09-15T18:30:00-03:00',
  atrasada: true,
  diasDeAtraso: 1,
  prioridad: 'alta',
  estado: 'pendiente',
  completadaEn: null,
  motivoReprogramacion: null,
  fechaAjustadaPorVendedor: false,
};

export const RESUMEN_AGENDA_CON_DATOS: ResumenAgenda = {
  pendientesHoy: 3,
  atrasados: 1,
  proximaEntrada: PROXIMA_ENTRADA_AGENDA,
};

// ---------------------------------------------------------------------------
// Escenario 2 — vacío: el vendedor arranca hoy, sin ventas ni seguimientos.
// ---------------------------------------------------------------------------

export const RESUMEN_INICIO_VACIO: ResumenInicio = {
  dineroVendido: [],
  dineroCobrado: [],
  comisionAcumulada: [],
  comisionPendiente: [],
  sinDatosTodavia: true,
  periodo: '2026-09',
};

export const RESUMEN_AGENDA_VACIO: ResumenAgenda = {
  pendientesHoy: 0,
  atrasados: 0,
  proximaEntrada: null,
};

// ---------------------------------------------------------------------------
// Escenario 3 — error: lo dispara `nucleo.configuracion.fallaForzada`, que
// `nucleo.responder` consume solo. No hace falta un dato acá.
// ---------------------------------------------------------------------------

/**
 * Implementación mock de `CapaInicio`.
 *
 * ⛔ No existe ningún método de analítica: sin embudos, sin tasas de
 *    conversión, sin mezcla de productos. Lo que no está en el contrato no
 *    se puede dibujar (packages/compartido/src/api.ts, sección S2).
 */
export function crearCapaInicioMock(nucleo: NucleoMock): CapaInicio {
  return {
    resumenInicio(): Promise<Resultado<ResumenInicio>> {
      const datos = nucleo.configuracion.forzarVacio ? RESUMEN_INICIO_VACIO : RESUMEN_INICIO_CON_DATOS;
      return nucleo.responder(datos);
    },

    proximosSeguimientos(limite?: number): Promise<Resultado<ReadonlyArray<ProximoSeguimiento>>> {
      const todos = nucleo.listar(PROXIMOS_SEGUIMIENTOS_CON_DATOS);
      return nucleo.responder(limite ? todos.slice(0, limite) : todos);
    },

    resumenAgenda(): Promise<Resultado<ResumenAgenda>> {
      const datos = nucleo.configuracion.forzarVacio ? RESUMEN_AGENDA_VACIO : RESUMEN_AGENDA_CON_DATOS;
      return nucleo.responder(datos);
    },
  };
}
