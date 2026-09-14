/**
 * Mi Día — vista 01.
 *
 * ⛔ Mi Día enlaza; no ejecuta. No crea cotizaciones, no cambia precios, no aprueba nada.
 * ⛔ La conversación es de SÓLO LECTURA y toda respuesta cita su fuente.
 *
 * Ver MASTER_SPEC.md §2.1, USER_FLOWS.md F1.
 */

import type { Id, ISODate } from './core';
import type { CanalPreferido } from './cartera';

export interface IndicadorDia {
  readonly clave:
    | 'compromisos_hoy'
    | 'pendientes_vencidos'
    | 'cotizaciones_esperando_aprobacion'
    | 'cotizaciones_esperando_cliente';
  readonly etiqueta: string;
  /** `null` = sin dato. Se muestra con la variante vacía, nunca como cero. */
  readonly valor: number | null;
  readonly pista: string;
}

export interface CompromisoAgenda {
  readonly id: Id;
  readonly inicioEn: ISODate;
  readonly titulo: string;
  readonly cuentaId: Id | null;
  readonly nombreCuenta: string | null;
  readonly canal: CanalPreferido | null;
}

export interface Pendiente {
  readonly id: Id;
  readonly titulo: string;
  readonly venceEn: ISODate | null;
  readonly vencido: boolean;
  readonly cuentaId: Id | null;
  readonly nombreCuenta: string | null;
  readonly origen: 'paso_seguimiento' | 'hito_plan' | 'objetivo_sugerido' | 'manual';
  readonly referenciaId: Id;
  readonly resuelto: boolean;
}

export interface FiltroPendientes {
  readonly soloVencidos?: boolean;
  readonly cuentaId?: Id;
  readonly hasta?: ISODate;
}

/**
 * Señales calculadas con datos propios. ⛔ Nunca inventadas, nunca estimadas.
 * Cada señal declara la regla que la disparó.
 */
export type ReglaSenal =
  | 'cuenta_sin_contacto'
  | 'cotizacion_sin_apertura'
  | 'cotizacion_aprobada_sin_enviar'
  | 'vigencia_por_vencer'
  | 'mensualidad_atrasada';

export interface SenalAtencion {
  readonly id: Id;
  readonly regla: ReglaSenal;
  readonly titulo: string;
  readonly detalle: string;
  readonly severidad: 'informativa' | 'alerta';
  readonly cuentaId: Id | null;
  readonly referenciaId: Id | null;
  readonly detectadaEn: ISODate;
}

export interface SerieGrafico {
  readonly etiqueta: string;
  readonly valor: number;
}

export interface GraficosDia {
  readonly propuestasPorEstado: ReadonlyArray<SerieGrafico>;
  readonly cotizacionesPorEtapa: ReadonlyArray<SerieGrafico>;
  readonly seguimientosPorSemana: ReadonlyArray<SerieGrafico>;
  readonly mezclaDeProductosCotizados: ReadonlyArray<SerieGrafico>;
}

export interface ReferenciaFuente {
  readonly tipo: 'cuenta' | 'cotizacion' | 'seguimiento' | 'mensualidad' | 'plan';
  readonly id: Id;
  readonly etiqueta: string;
}

/**
 * Respuesta de la conversación de Mi Día.
 * ⛔ `fuentes` NO puede estar vacío: una respuesta sin fuente es un error, no una respuesta.
 * ⛔ Sin datos suficientes, se responde que no los hay. No se estima ni se completa.
 */
export interface RespuestaConsulta {
  readonly texto: string;
  readonly fuentes: ReadonlyArray<ReferenciaFuente>;
  readonly sinDatosSuficientes: boolean;
}
