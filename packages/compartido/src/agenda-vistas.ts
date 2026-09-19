/**
 * Las vistas de la agenda: de una lista de entradas a Hoy, Semana y Mes.
 *
 * ⛔ Esto es derivación pura. No lee, no escribe y no decide nada del dominio:
 *    agrupa lo que ya existe. Vive acá, y no en el mock, por la misma razón
 *    que el motor: la usan las dos capas de datos, y con dos copias la agenda
 *    del servidor terminaría agrupando distinto que la de los datos de
 *    ejemplo.
 *
 * ⛔ "Atrasada" no es un campo que alguien escriba: se calcula contra la fecha
 *    de hoy cada vez que se lee. Guardarlo seria tener que recorrer la tabla
 *    todas las noches para que no mienta.
 */

import type {
  AgendaHoy, AgendaMes, AgendaSemana, DiaDeMes, DiaDeSemana, EntradaAgenda,
  TipoEntradaAgenda,
} from './agenda';
import type { ISODate } from './core';

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


/** ⛔ Una entrada vencida y todavia pendiente esta atrasada. Se calcula, no se guarda. */
export function marcarAtraso(
  e: Omit<EntradaAgenda, 'atrasada' | 'diasDeAtraso'>,
  ahora: ISODate,
): EntradaAgenda {
  const fecha = e.venceEn ?? e.inicioEn;
  if (e.estado !== 'pendiente' || !fecha) {
    return { ...e, atrasada: false, diasDeAtraso: null };
  }
  const limite = inicioDelDia(ahora);
  const cuando = new Date(fecha);
  if (cuando >= limite) {
    return { ...e, atrasada: false, diasDeAtraso: null };
  }
  const dias = Math.max(1, Math.floor((limite.getTime() - cuando.getTime()) / 86_400_000));
  return { ...e, atrasada: true, diasDeAtraso: dias };
}

export function armarAgendaHoy(vigentes: ReadonlyArray<EntradaAgenda>, hoy: ISODate): AgendaHoy {
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
  return respuesta;
}

export function armarAgendaSemana(vigentes: ReadonlyArray<EntradaAgenda>, desde: ISODate): AgendaSemana {
  const inicio = inicioDeSemana(desde);
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
  return respuesta;
}

export function armarAgendaMes(vigentes: ReadonlyArray<EntradaAgenda>, anio: number, mes: number): AgendaMes {
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
  return respuesta;
}

export { fechaRelevante, inicioDeSemana, coincideConDia, esHastaHoy };
