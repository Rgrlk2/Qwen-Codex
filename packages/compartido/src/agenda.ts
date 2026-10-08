/**
 * Agenda operativa — ruta protegida #/agenda, para vendedor y administrador.
 *
 * EL PRINCIPIO: la agenda SE POBLA SOLA. El vendedor ajusta fechas y completa
 * acciones; ⛔ no reconstruye nada a mano.
 *
 * Se alimenta automáticamente de:
 *   planes · objetivos aceptados · seguimientos · presentaciones ·
 *   cotizaciones · vencimientos · aperturas de enlace que sugieren contactar
 *
 * Inicio conserva sólo la lista corta de próximos seguimientos y un acceso acá.
 *
 * Ver MASTER_SPEC.md §2.4, USER_FLOWS.md F8.
 */

import type { Id, ISODate } from './core';
import type { ProductoId } from './catalogo';

// ---------------------------------------------------------------------------
// La entrada de agenda
// ---------------------------------------------------------------------------

export type TipoEntradaAgenda =
  | 'visita'
  | 'llamada'
  | 'proximo_paso'
  | 'vencimiento'
  | 'seguimiento_atrasado'
  | 'hito_plan'
  | 'objetivo_aceptado'
  | 'presentacion_enviada'
  | 'cotizacion_en_revision'
  | 'apertura_enlace';

/** De dónde salió. ⛔ `manual` es la excepción, no la regla. */
export type OrigenEntrada =
  | 'plan'
  | 'objetivo_aceptado'
  | 'seguimiento'
  | 'presentacion'
  | 'cotizacion'
  | 'vencimiento'
  | 'apertura_enlace'
  | 'manual';

export type EstadoEntrada = 'pendiente' | 'completada' | 'reprogramada' | 'descartada';

export type Prioridad = 'alta' | 'media' | 'baja';

export interface EntradaAgenda {
  readonly id: Id;
  readonly vendedorId: Id;
  readonly tipo: TipoEntradaAgenda;
  /** ⛔ Casi siempre automático: la agenda se puebla sola. */
  readonly origen: OrigenEntrada;
  /** Id de la entidad que la generó, para navegar hasta ella. */
  readonly referenciaId: Id | null;
  readonly clienteId: Id | null;
  readonly nombreCliente: string | null;
  readonly titulo: string;
  readonly detalle: string | null;
  readonly productoId: ProductoId | null;

  /** Cuándo. `null` en entradas sin fecha todavía asignada. */
  readonly inicioEn: ISODate | null;
  readonly finEn: ISODate | null;
  readonly venceEn: ISODate | null;
  /** `true` cuando `venceEn` ya pasó y sigue `pendiente`. */
  readonly atrasada: boolean;
  readonly diasDeAtraso: number | null;

  readonly prioridad: Prioridad;
  readonly estado: EstadoEntrada;
  readonly completadaEn: ISODate | null;
  /** Obligatorio al reprogramar: por qué se movió. */
  readonly motivoReprogramacion: string | null;
  /** `true` si el vendedor movió la fecha sugerida por el sistema. */
  readonly fechaAjustadaPorVendedor: boolean;
}

/** Lo único que el vendedor crea a mano. El resto llega solo. */
export interface NuevaEntradaManual {
  readonly tipo: Extract<TipoEntradaAgenda, 'visita' | 'llamada' | 'proximo_paso'>;
  readonly clienteId: Id | null;
  readonly titulo: string;
  readonly detalle?: string;
  readonly inicioEn: ISODate;
  readonly finEn?: ISODate;
  readonly prioridad?: Prioridad;
}

export interface AjusteEntrada {
  readonly entradaId: Id;
  readonly inicioEn?: ISODate;
  readonly finEn?: ISODate;
  readonly venceEn?: ISODate;
  readonly prioridad?: Prioridad;
  /** Obligatorio cuando se mueve una fecha. */
  readonly motivo: string;
}

// ---------------------------------------------------------------------------
// Las cinco vistas de la agenda
// ---------------------------------------------------------------------------

export type VistaAgenda = 'hoy' | 'semana' | 'mes' | 'cronograma' | 'atrasados';

export interface AgendaHoy {
  readonly fecha: ISODate;
  readonly visitas: ReadonlyArray<EntradaAgenda>;
  readonly llamadas: ReadonlyArray<EntradaAgenda>;
  readonly proximosPasos: ReadonlyArray<EntradaAgenda>;
  readonly vencimientos: ReadonlyArray<EntradaAgenda>;
  readonly atrasados: ReadonlyArray<EntradaAgenda>;
  readonly totalPendientes: number;
}

export interface DiaDeSemana {
  readonly fecha: ISODate;
  readonly entradas: ReadonlyArray<EntradaAgenda>;
  readonly totalPendientes: number;
  readonly totalAtrasados: number;
}

export interface AgendaSemana {
  readonly desde: ISODate;
  readonly hasta: ISODate;
  readonly dias: ReadonlyArray<DiaDeSemana>;
}

export interface DiaDeMes {
  readonly fecha: ISODate;
  readonly delMesActual: boolean;
  readonly cantidadPorTipo: Readonly<Partial<Record<TipoEntradaAgenda, number>>>;
  readonly tieneAtrasados: boolean;
  readonly total: number;
}

export interface AgendaMes {
  readonly anio: number;
  readonly mes: number;
  /** Semanas completas, de lunes a domingo, incluidos los días de relleno. */
  readonly semanas: ReadonlyArray<ReadonlyArray<DiaDeMes>>;
}

// ---------------------------------------------------------------------------
// Cronograma comercial (Gantt)
// ---------------------------------------------------------------------------

/**
 * Una barra del cronograma: la vida comercial de un cliente o de un plan,
 * desde el primer contacto hasta el cierre.
 */
export interface BarraCronograma {
  readonly id: Id;
  readonly clienteId: Id | null;
  readonly planId: Id | null;
  readonly titulo: string;
  readonly desde: ISODate;
  readonly hasta: ISODate;
  readonly etapa: string;
  readonly progreso: number;
  readonly hitos: ReadonlyArray<HitoCronograma>;
  readonly enRiesgo: boolean;
  readonly motivoRiesgo: string | null;
}

export interface HitoCronograma {
  readonly id: Id;
  readonly titulo: string;
  readonly fecha: ISODate;
  readonly cumplido: boolean;
  readonly tipo: TipoEntradaAgenda;
  readonly referenciaId: Id | null;
}

export interface CronogramaComercial {
  readonly desde: ISODate;
  readonly hasta: ISODate;
  readonly barras: ReadonlyArray<BarraCronograma>;
}

// ---------------------------------------------------------------------------
// Filtros y resumen
// ---------------------------------------------------------------------------

export interface FiltroAgenda {
  readonly vendedorId?: Id;
  readonly clienteId?: Id;
  readonly tipo?: TipoEntradaAgenda;
  readonly estado?: EstadoEntrada;
  readonly prioridad?: Prioridad;
  readonly desde?: ISODate;
  readonly hasta?: ISODate;
  readonly soloAtrasados?: boolean;
}

/** Lo que Inicio muestra: la lista corta y el acceso a la agenda. */
export interface ResumenAgenda {
  readonly pendientesHoy: number;
  readonly atrasados: number;
  readonly proximaEntrada: EntradaAgenda | null;
}
