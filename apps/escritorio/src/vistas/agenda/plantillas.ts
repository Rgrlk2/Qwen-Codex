/**
 * Plantillas (HTML como texto) de la vista Agenda.
 *
 * ⛔ DUEÑA: Sesión 4. Funciones puras: reciben datos, devuelven marcado.
 * Todo texto dinámico pasa por `esc()` antes de interpolarse.
 */

import type {
  AgendaHoy, AgendaMes, AgendaSemana, BarraCronograma, DiaDeMes, DiaDeSemana, EntradaAgenda,
} from '@labia/compartido';
import { esc, etiquetaPrioridad, etiquetaTipo, formatDiaCorto, formatFecha, formatFechaHora, nombreMes } from './util';

/* Ya no recibe `datosDeEjemplo`: el chip lo pone la cáscara. */
export function plantillaShell(): string {
  return `
    <a class="saltar" href="#agenda-contenido">Ir al contenido</a>
    <!-- ⛔ El título y el chip "Datos de ejemplo" los pone la cáscara, una sola
         vez, en su encabezado fijo. Ver nucleo/disposicion.ts. -->
    <div id="agenda-aviso" role="status" aria-live="polite"></div>
    <div class="pestanas" role="tablist" aria-label="Vistas de la agenda">
      <button type="button" class="pestana" role="tab" data-accion="pestana" data-valor="hoy" aria-selected="true">Hoy</button>
      <button type="button" class="pestana" role="tab" data-accion="pestana" data-valor="semana" aria-selected="false">Semana</button>
      <button type="button" class="pestana" role="tab" data-accion="pestana" data-valor="mes" aria-selected="false">Mes</button>
      <button type="button" class="pestana" role="tab" data-accion="pestana" data-valor="cronograma" aria-selected="false">Cronograma</button>
      <button type="button" class="pestana" role="tab" data-accion="pestana" data-valor="atrasados" aria-selected="false">Atrasados</button>
      <button type="button" class="btn" data-accion="nueva-entrada" style="margin-left:auto;">Nueva entrada</button>
    </div>
    <div id="agenda-contenido"></div>
  `;
}

export function plantillaCargando(filas = 3): string {
  return `
    <div class="cargando" role="status">
      <span style="position:absolute; left:-9999px;">Cargando agenda…</span>
      ${Array.from({ length: filas }, () => '<div class="hueso"></div>').join('')}
    </div>
  `;
}

export function plantillaVacio(mensaje: string, accionTexto: string, accion: string): string {
  return `
    <div class="vacio">
      <p>${esc(mensaje)}</p>
      <button type="button" class="btn" data-accion="${esc(accion)}">${esc(accionTexto)}</button>
    </div>
  `;
}

export function plantillaError(mensaje: string, pista: string | undefined, accionReintentar: string): string {
  return `
    <div class="error" role="alert">
      <p>${esc(mensaje)}</p>
      ${pista ? `<p>${esc(pista)}</p>` : ''}
      <button type="button" class="btn" data-accion="${esc(accionReintentar)}">Volver a intentar</button>
    </div>
  `;
}

export function plantillaEntrada(e: EntradaAgenda, mostrarCliente = true): string {
  const fecha = e.venceEn ?? e.inicioEn;
  const puedeActuar = e.estado === 'pendiente' || e.estado === 'reprogramada';
  return `
    <li class="entrada-agenda${e.atrasada ? ' entrada-agenda--atrasada' : ''}" data-id="${esc(e.id)}">
      <div class="entrada-agenda__cabecera">
        <span class="entrada-agenda__titulo">${esc(etiquetaTipo(e.tipo))} · ${esc(e.titulo)}</span>
        <span class="entrada-agenda__meta">${esc(etiquetaPrioridad(e.prioridad))}</span>
      </div>
      ${mostrarCliente && e.nombreCliente ? `<span class="entrada-agenda__meta">${esc(e.nombreCliente)}</span>` : ''}
      ${e.detalle ? `<p style="margin:0; color:var(--texto-2);">${esc(e.detalle)}</p>` : ''}
      <span class="entrada-agenda__meta">${fecha ? formatFechaHora(fecha) : 'Sin fecha asignada'}</span>
      ${e.atrasada && e.diasDeAtraso !== null ? `<span class="entrada-agenda__atraso">Atrasada hace ${e.diasDeAtraso} día${e.diasDeAtraso === 1 ? '' : 's'}</span>` : ''}
      ${e.estado === 'completada' ? `<span class="entrada-agenda__meta">Completada${e.completadaEn ? ` el ${formatFecha(e.completadaEn)}` : ''}</span>` : ''}
      ${e.estado === 'descartada' ? `<span class="entrada-agenda__meta">${e.motivoReprogramacion ? esc(e.motivoReprogramacion) : 'Descartada.'}</span>` : ''}
      ${e.estado === 'reprogramada' && e.motivoReprogramacion ? `<span class="entrada-agenda__meta">Movida por el vendedor: ${esc(e.motivoReprogramacion)}</span>` : ''}
      ${
        puedeActuar
          ? `<div class="entrada-agenda__acciones">
              <button type="button" class="btn-borde" data-accion="completar" data-id="${esc(e.id)}">Completar</button>
              <button type="button" class="btn-borde" data-accion="ajustar" data-id="${esc(e.id)}">Ajustar fecha</button>
              <button type="button" class="btn-texto" data-accion="descartar" data-id="${esc(e.id)}">Descartar</button>
            </div>`
          : ''
      }
    </li>
  `;
}

function plantillaListaEntradas(entradas: ReadonlyArray<EntradaAgenda>, vacioTexto: string): string {
  if (entradas.length === 0) return `<p style="color:var(--texto-2); margin:0;">${esc(vacioTexto)}</p>`;
  return `<ul class="lista">${entradas.map((e) => plantillaEntrada(e)).join('')}</ul>`;
}

export function plantillaHoy(hoy: AgendaHoy): string {
  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      ${
        hoy.atrasados.length
          ? `<section class="tarjeta" aria-labelledby="agenda-atrasados-hoy">
              <h2 id="agenda-atrasados-hoy" style="margin-top:0; font-size:20px;">Atrasados (${hoy.atrasados.length})</h2>
              ${plantillaListaEntradas(hoy.atrasados, 'Nada atrasado.')}
            </section>`
          : ''
      }
      <div class="agenda-secciones">
        <section class="tarjeta" aria-labelledby="agenda-visitas">
          <h2 id="agenda-visitas" style="margin-top:0; font-size:18px;">Visitas</h2>
          ${plantillaListaEntradas(hoy.visitas, 'Sin visitas para hoy.')}
        </section>
        <section class="tarjeta" aria-labelledby="agenda-llamadas">
          <h2 id="agenda-llamadas" style="margin-top:0; font-size:18px;">Llamadas</h2>
          ${plantillaListaEntradas(hoy.llamadas, 'Sin llamadas para hoy.')}
        </section>
        <section class="tarjeta" aria-labelledby="agenda-proximos-pasos">
          <h2 id="agenda-proximos-pasos" style="margin-top:0; font-size:18px;">Próximos pasos</h2>
          ${plantillaListaEntradas(hoy.proximosPasos, 'Sin próximos pasos para hoy.')}
        </section>
        <section class="tarjeta" aria-labelledby="agenda-vencimientos">
          <h2 id="agenda-vencimientos" style="margin-top:0; font-size:18px;">Vencimientos</h2>
          ${plantillaListaEntradas(hoy.vencimientos, 'Sin vencimientos para hoy.')}
        </section>
      </div>
    </div>
  `;
}

export function plantillaSemana(semana: AgendaSemana): string {
  return `
    <div class="agenda-semana">
      ${semana.dias.map((dia: DiaDeSemana) => `
        <div class="agenda-semana__dia">
          <div class="agenda-semana__cabecera">
            <span>${esc(formatDiaCorto(dia.fecha))}</span>
            <span>${dia.totalPendientes} pendiente${dia.totalPendientes === 1 ? '' : 's'}${dia.totalAtrasados ? ` · ${dia.totalAtrasados} atrasada${dia.totalAtrasados === 1 ? '' : 's'}` : ''}</span>
          </div>
          ${plantillaListaEntradas(dia.entradas, 'Sin entradas.')}
        </div>
      `).join('')}
    </div>
  `;
}

export function plantillaMes(mes: AgendaMes): string {
  const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button type="button" class="btn-borde" data-accion="mes-anterior">&larr; Mes anterior</button>
        <h2 style="margin:0; font-size:20px;">${esc(nombreMes(mes.mes))} ${mes.anio}</h2>
        <button type="button" class="btn-borde" data-accion="mes-siguiente">Mes siguiente &rarr;</button>
      </div>
      <div class="calendario" role="grid" aria-label="Calendario de ${esc(nombreMes(mes.mes))} de ${mes.anio}">
        ${nombresDias.map((n) => `<div class="calendario-encabezado" role="columnheader">${n}</div>`).join('')}
        ${mes.semanas
          .flat()
          .map(
            (dia: DiaDeMes) => `
          <button type="button" role="gridcell" class="calendario-dia${dia.delMesActual ? '' : ' calendario-dia--fuera-de-mes'}${dia.tieneAtrasados ? ' calendario-dia--atrasados' : ''}"
            data-fecha="${esc(dia.fecha)}" aria-label="${esc(formatFecha(dia.fecha))}${dia.total ? `, ${dia.total} entradas` : ', sin entradas'}${dia.tieneAtrasados ? ', con atrasos' : ''}">
            <span class="calendario-dia__numero">${new Date(dia.fecha).getUTCDate()}</span>
            ${dia.total ? `<span>${dia.total} entrada${dia.total === 1 ? '' : 's'}</span>` : ''}
            ${dia.tieneAtrasados ? '<span style="color:var(--peligro);">Atrasos</span>' : ''}
          </button>
        `,
          )
          .join('')}
      </div>
    </div>
  `;
}

export function plantillaAtrasados(entradas: ReadonlyArray<EntradaAgenda>): string {
  const ordenadas = [...entradas].sort((a, b) => (b.diasDeAtraso ?? 0) - (a.diasDeAtraso ?? 0));
  return `<section class="tarjeta">${plantillaListaEntradas(ordenadas, 'No hay nada atrasado ahora mismo.')}</section>`;
}

const PROGRESO_ETIQUETA: Readonly<Record<string, string>> = {
  sin_contactar: 'Sin contactar', contactado: 'Contactado', diagnostico: 'Diagnóstico',
  presentacion: 'Presentación', cotizacion: 'Cotización', negociacion: 'Negociación',
  ganado: 'Ganado', perdido: 'Perdido', cliente_activo: 'Cliente activo',
};

export function plantillaCronograma(barras: ReadonlyArray<BarraCronograma>): string {
  if (barras.length === 0) {
    return '<p style="color:var(--texto-2);">Todavía no hay planes ni clientes con actividad para mostrar en el cronograma.</p>';
  }
  const listaAccesible = `
    <ul class="lista">
      ${barras
        .map(
          (b) => `
        <li class="entrada-agenda">
          <div class="entrada-agenda__cabecera">
            <span class="entrada-agenda__titulo">${esc(b.titulo)}</span>
            <span class="entrada-agenda__meta">${esc(PROGRESO_ETIQUETA[b.etapa] ?? b.etapa)} · ${b.progreso}%</span>
          </div>
          <span class="entrada-agenda__meta">Del ${formatFecha(b.desde)} al ${formatFecha(b.hasta)}</span>
          ${b.enRiesgo ? `<span class="entrada-agenda__atraso">En riesgo${b.motivoRiesgo ? `: ${esc(b.motivoRiesgo)}` : ''}</span>` : ''}
          ${
            b.hitos.length
              ? `<ul class="lista" style="margin-left:1rem;">
                  ${b.hitos.map((h) => `<li class="entrada-agenda__meta">${h.cumplido ? '✓' : '·'} ${esc(h.titulo)} — ${formatFecha(h.fecha)}</li>`).join('')}
                </ul>`
              : ''
          }
        </li>`,
        )
        .join('')}
    </ul>
  `;

  const minimo = Math.min(...barras.map((b) => new Date(b.desde).getTime()));
  const maximo = Math.max(...barras.map((b) => new Date(b.hasta).getTime()));
  const totalDias = Math.max(1, Math.round((maximo - minimo) / 86_400_000));
  const anchoMinimo = Math.max(640, totalDias * 14);
  const posicion = (iso: string) => ((new Date(iso).getTime() - minimo) / (maximo - minimo || 1)) * 100;

  const visual = `
    <div class="cronograma-contenedor" aria-hidden="true" role="presentation">
      <div class="cronograma" style="min-width:${anchoMinimo}px;">
        ${barras
          .map((b) => {
            const izquierda = posicion(b.desde);
            const ancho = Math.max(2, posicion(b.hasta) - izquierda);
            return `
            <div class="cronograma-fila">
              <span>${esc(b.titulo)}</span>
              <div class="cronograma-pista">
                <div class="cronograma-barra" style="left:${izquierda}%; width:${ancho}%;" title="${esc(b.titulo)} — ${b.progreso}%"></div>
                ${b.hitos.map((h) => `<div class="cronograma-hito" style="left:${posicion(h.fecha)}%;" title="${esc(h.titulo)}"></div>`).join('')}
              </div>
            </div>`;
          })
          .join('')}
      </div>
    </div>
  `;

  return `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      <section class="tarjeta" aria-labelledby="agenda-cronograma-lista">
        <h2 id="agenda-cronograma-lista" style="margin-top:0; font-size:18px;">Detalle del cronograma</h2>
        ${listaAccesible}
      </section>
      <section aria-hidden="true">
        <p style="color:var(--texto-2); font-size:13px; margin:0 0 0.5rem;">Vista visual (de referencia)</p>
        ${visual}
      </section>
    </div>
  `;
}
