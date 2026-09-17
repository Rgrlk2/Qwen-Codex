/**
 * Plantillas (HTML como texto) de la vista Clientes.
 *
 * ⛔ DUEÑO: Sesión 4. Funciones puras: reciben datos, devuelven marcado.
 * Todo texto dinámico pasa por `esc()` antes de interpolarse.
 */

import type {
  Cliente, ClienteDetalle, EventoLineaTiempo, ProductoId, PropuestaDeSeguimiento,
  Seguimiento, SoporteDictado,
} from '@labia/compartido';
import { esc, etiquetaEtapa, etiquetaProducto, etiquetaTipoEvento, formatDinero, formatFecha, formatFechaHora } from './util';

export function plantillaShell(datosDeEjemplo: boolean): string {
  return `
    <a class="saltar" href="#clientes-contenido">Ir al contenido</a>
    <header style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
      <h1 tabindex="-1" id="clientes-titulo">Clientes</h1>
      ${datosDeEjemplo ? '<span class="chip-ejemplo">Datos de ejemplo</span>' : ''}
    </header>
    <div id="clientes-aviso" role="status" aria-live="polite"></div>
    <div id="clientes-contenido"></div>
  `;
}

export function plantillaCargando(filas = 4): string {
  return `
    <div class="cargando" role="status">
      <span style="position:absolute; left:-9999px;">Cargando clientes…</span>
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

const ETAPAS: ReadonlyArray<string> = [
  'sin_contactar', 'contactado', 'diagnostico', 'presentacion', 'cotizacion',
  'negociacion', 'ganado', 'perdido', 'cliente_activo',
];

export function plantillaFiltros(filtroTexto: string, filtroTipo: string, filtroEtapa: string): string {
  return `
    <div class="tarjeta" style="display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem;">
      <div class="campo">
        <label for="clientes-buscar">Buscar por nombre</label>
        <input class="entrada" type="search" id="clientes-buscar" data-accion="buscar" value="${esc(filtroTexto)}" placeholder="Ej.: Repuestos San Roque" />
      </div>
      <div>
        <p style="margin:0 0 0.4rem; color:var(--texto-2); font-size:14px;">Tipo</p>
        <div class="chips" role="group" aria-label="Filtrar por tipo">
          ${['', 'empresa', 'profesional']
            .map(
              (valor) => `
            <button type="button" class="chip" data-accion="filtro-tipo" data-valor="${valor}" aria-pressed="${filtroTipo === valor}">
              ${valor === '' ? 'Todos' : valor === 'empresa' ? 'Empresa' : 'Profesional'}
            </button>`,
            )
            .join('')}
        </div>
      </div>
      <div>
        <p style="margin:0 0 0.4rem; color:var(--texto-2); font-size:14px;">Etapa</p>
        <div class="chips" role="group" aria-label="Filtrar por etapa">
          <button type="button" class="chip" data-accion="filtro-etapa" data-valor="" aria-pressed="${filtroEtapa === ''}">Todas</button>
          ${ETAPAS.map(
            (etapa) => `
            <button type="button" class="chip" data-accion="filtro-etapa" data-valor="${etapa}" aria-pressed="${filtroEtapa === etapa}">
              ${esc(etiquetaEtapa(etapa))}
            </button>`,
          ).join('')}
        </div>
      </div>
    </div>
  `;
}

export function plantillaListaClientes(clientes: ReadonlyArray<Cliente>): string {
  return `
    <div class="clientes-rejilla" role="list">
      ${clientes
        .map(
          (c) => `
        <button type="button" class="tarjeta clientes-fila" role="listitem" data-accion="abrir-cliente" data-id="${esc(c.id)}">
          <div class="lista-item__cabecera">
            <span class="lista-item__titulo">${esc(c.nombre)}</span>
            <span class="etapa etapa--${esc(c.etapa)}">${esc(etiquetaEtapa(c.etapa))}</span>
          </div>
          <span class="lista-item__meta">${c.tipo === 'empresa' ? 'Empresa' : 'Profesional'}${c.ciudad ? ` · ${esc(c.ciudad)}` : ''}</span>
          <span class="lista-item__meta">
            Última interacción: ${c.ultimaInteraccionEn ? formatFecha(c.ultimaInteraccionEn) : 'sin registrar'}
            ${c.proximoPasoEn ? ` · Próximo paso: ${formatFecha(c.proximoPasoEn)}` : ''}
          </span>
        </button>`,
        )
        .join('')}
    </div>
  `;
}

export function plantillaFicha(detalle: ClienteDetalle): string {
  const potencial = detalle.potencialPorMoneda.length
    ? detalle.potencialPorMoneda.map((d) => formatDinero(d)).join(' · ')
    : 'Sin potencial documentado todavía';
  return `
    <div class="clientes-ficha">
      <div class="clientes-ficha__cabecera">
        <div>
          <button type="button" class="btn-texto" data-accion="volver-lista">&larr; Volver a la cartera</button>
          <h2 style="margin:0.4rem 0 0; font-size:clamp(22px,2.4vw,30px);">${esc(detalle.nombre)}</h2>
          <span class="etapa etapa--${esc(detalle.etapa)}">${esc(etiquetaEtapa(detalle.etapa))}</span>
        </div>
        <button type="button" class="btn" data-accion="nuevo-seguimiento">Nuevo seguimiento</button>
      </div>

      <div class="clientes-ficha__grilla">
        <section class="tarjeta" aria-labelledby="clientes-ficha-datos">
          <h3 id="clientes-ficha-datos" style="margin-top:0;">Datos</h3>
          <dl class="clientes-ficha__dl">
            <dt>Tipo</dt><dd>${detalle.tipo === 'empresa' ? 'Empresa' : 'Profesional'}</dd>
            <dt>Ciudad</dt><dd>${detalle.ciudad ? esc(detalle.ciudad) : 'Sin registrar'}</dd>
            <dt>Actividad</dt><dd>${esc(detalle.actividadId)}</dd>
            <dt>Plan asociado</dt><dd>${detalle.planId ? esc(detalle.planId) : 'Sin plan asociado todavía'}</dd>
            <dt>Potencial</dt><dd>${esc(potencial)}</dd>
            ${detalle.motivoPerdida ? `<dt>Motivo de pérdida</dt><dd>${esc(detalle.motivoPerdida)}</dd>` : ''}
          </dl>
        </section>

        <section class="tarjeta" aria-labelledby="clientes-ficha-contactos">
          <h3 id="clientes-ficha-contactos" style="margin-top:0;">Contactos</h3>
          ${
            detalle.contactos.length === 0
              ? '<p style="color:var(--texto-2);">Todavía no cargaste ningún contacto.</p>'
              : `<ul class="lista">
                  ${detalle.contactos
                    .map(
                      (c) => `
                    <li class="lista-item">
                      <span class="lista-item__titulo">${esc(c.nombre)}${c.esDecisor ? ' · decide' : ''}</span>
                      <span class="lista-item__meta">${c.cargo ? `${esc(c.cargo)} · ` : ''}${c.telefono ? esc(c.telefono) : 'sin teléfono'}${c.email ? ` · ${esc(c.email)}` : ''}</span>
                    </li>`,
                    )
                    .join('')}
                </ul>`
          }
        </section>

        <section class="tarjeta" aria-labelledby="clientes-ficha-productos">
          <h3 id="clientes-ficha-productos" style="margin-top:0;">Productos</h3>
          <p style="margin:0 0 0.4rem; color:var(--texto-2); font-size:14px;">Vigentes</p>
          ${plantillaChipsProducto(detalle.productosVigentes)}
          <p style="margin:0.8rem 0 0.4rem; color:var(--texto-2); font-size:14px;">Propuestos</p>
          ${plantillaChipsProducto(detalle.productosPropuestos)}
        </section>
      </div>

      <section class="tarjeta" aria-labelledby="clientes-ficha-linea">
        <h3 id="clientes-ficha-linea" style="margin-top:0;">Línea de tiempo</h3>
        <div id="clientes-linea-tiempo">${plantillaCargando(3)}</div>
      </section>

      <section class="tarjeta" id="clientes-captura-seccion" hidden>
        <h3 style="margin-top:0;">Nuevo seguimiento</h3>
        <div id="clientes-captura"></div>
      </section>
    </div>
  `;
}

function plantillaChipsProducto(ids: ReadonlyArray<ProductoId>): string {
  if (ids.length === 0) return '<p style="color:var(--texto-2); margin:0;">Ninguno todavía.</p>';
  return `<div class="chips">${ids.map((id) => `<span class="chip" aria-pressed="true">${esc(etiquetaProducto(id))}</span>`).join('')}</div>`;
}

export function plantillaLineaTiempo(eventos: ReadonlyArray<EventoLineaTiempo>): string {
  if (eventos.length === 0) {
    return '<p style="color:var(--texto-2);">Todavía no hay actividad registrada con este cliente.</p>';
  }
  return `
    <ul class="lista">
      ${eventos
        .map(
          (e) => `
        <li class="lista-item">
          <div class="lista-item__cabecera">
            <span class="lista-item__titulo">${esc(etiquetaTipoEvento(e.tipo))} · ${esc(e.titulo)}</span>
            <span class="lista-item__meta">${formatFechaHora(e.ocurridoEn)}</span>
          </div>
          ${e.detalle ? `<p style="margin:0; color:var(--texto-2);">${esc(e.detalle)}</p>` : ''}
        </li>`,
        )
        .join('')}
    </ul>
  `;
}

// ---------------------------------------------------------------------------
// Captura de seguimiento
// ---------------------------------------------------------------------------

export function plantillaCapturaInicial(soporte: SoporteDictado, modo: 'voz' | 'texto'): string {
  return `
    <div class="clientes-captura">
      ${
        soporte.disponible
          ? `<div class="pestanas" role="tablist" aria-label="Cómo registrar el seguimiento">
              <button type="button" class="pestana" role="tab" data-accion="modo-captura" data-valor="texto" aria-selected="${modo === 'texto'}">Escribir</button>
              <button type="button" class="pestana" role="tab" data-accion="modo-captura" data-valor="voz" aria-selected="${modo === 'voz'}">Dictar</button>
            </div>`
          : `<p class="aviso">${esc(soporte.motivoNoDisponible ?? 'Este dispositivo no admite dictado.')} Usá el camino de texto.</p>`
      }
      <div id="clientes-captura-cuerpo"></div>
    </div>
  `;
}

export function plantillaCapturaTexto(texto: string): string {
  return `
    <div class="campo">
      <label for="clientes-captura-texto">¿Qué pasó con este cliente?</label>
      <textarea id="clientes-captura-texto" data-campo="texto" placeholder="Ej.: Diego pidió una cotización de Radar Stock, quedé en enviarla esta semana.">${esc(texto)}</textarea>
    </div>
    <button type="button" class="btn" data-accion="procesar-captura">Procesar</button>
  `;
}

export function plantillaCapturaVozInicio(): string {
  return `
    <p style="color:var(--texto-2);">Vamos a pedir permiso de micrófono. Mientras dictás, vas a ver la transcripción en pantalla.</p>
    <button type="button" class="btn" data-accion="iniciar-grabacion">Empezar a dictar</button>
  `;
}

export function plantillaCapturaVozGrabando(transcripcion: string): string {
  return `
    <p class="clientes-captura__grabando" role="status">
      <span class="clientes-captura__punto" aria-hidden="true"></span>
      Grabando… se está guardando el audio y transcribiendo lo que decís.
    </p>
    <div class="campo">
      <label for="clientes-captura-texto">Transcripción (editable)</label>
      <textarea id="clientes-captura-texto" data-campo="texto">${esc(transcripcion)}</textarea>
    </div>
    <button type="button" class="btn" data-accion="detener-grabacion">Detener</button>
  `;
}

export function plantillaCapturaVozDetenida(texto: string): string {
  return `
    <p style="color:var(--texto-2);">Grabación guardada. Revisá y editá la transcripción antes de procesar.</p>
    <div class="campo">
      <label for="clientes-captura-texto">Transcripción (editable)</label>
      <textarea id="clientes-captura-texto" data-campo="texto">${esc(texto)}</textarea>
    </div>
    <button type="button" class="btn" data-accion="procesar-captura">Procesar</button>
  `;
}

export function plantillaPropuesta(propuesta: PropuestaDeSeguimiento, etapaActual: string): string {
  return `
    <div class="clientes-propuesta">
      <p style="color:var(--texto-2); margin:0;">Revisá lo que proponemos guardar. Nada se guarda todavía: confirmá ítem por ítem.</p>

      <div class="campo">
        <label for="clientes-propuesta-nota">Nota estructurada</label>
        <textarea id="clientes-propuesta-nota" data-campo="nota">${esc(propuesta.notaEstructurada)}</textarea>
      </div>

      ${
        propuesta.pasosPropuestos.length
          ? `<fieldset style="border:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.6rem;">
              <legend style="padding:0; margin-bottom:0.4rem; font-weight:600;">Pasos con vencimiento</legend>
              ${propuesta.pasosPropuestos
                .map(
                  (p, i) => `
                <label class="clientes-propuesta__paso">
                  <input type="checkbox" data-paso="${i}" checked />
                  <span>${esc(p.titulo)}${p.venceEn ? ` — vence ${formatFecha(p.venceEn)}` : ''}</span>
                </label>`,
                )
                .join('')}
            </fieldset>`
          : ''
      }

      ${
        propuesta.etapaSugerida
          ? `<label class="clientes-propuesta__paso">
              <input type="checkbox" id="clientes-propuesta-etapa" ${propuesta.etapaSugerida !== etapaActual ? 'checked' : ''} />
              <span>Aplicar cambio de etapa sugerido: de <strong>${esc(etiquetaEtapa(etapaActual))}</strong> a <strong>${esc(etiquetaEtapa(propuesta.etapaSugerida))}</strong></span>
            </label>`
          : ''
      }

      <div>
        <p style="margin:0 0 0.4rem; color:var(--texto-2); font-size:14px;">Productos mencionados (del catálogo)</p>
        ${plantillaChipsProducto(propuesta.productosMencionados)}
      </div>

      ${
        propuesta.mencionesFueraDeCatalogo.length
          ? `<p class="dato dato--no-encontrado">
              No corresponden a ningún producto del catálogo, se descartan: ${propuesta.mencionesFueraDeCatalogo.map((m) => esc(m)).join(', ')}
            </p>`
          : ''
      }

      ${
        propuesta.borradorRespuesta
          ? `<div class="campo">
              <label for="clientes-propuesta-borrador">Borrador de respuesta (referencia)</label>
              <textarea id="clientes-propuesta-borrador" readonly>${esc(propuesta.borradorRespuesta)}</textarea>
            </div>`
          : ''
      }

      <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
        <button type="button" class="btn" data-accion="guardar-seguimiento">Confirmar y guardar</button>
        <button type="button" class="btn-borde" data-accion="descartar-captura">Descartar</button>
      </div>
    </div>
  `;
}

export function plantillaSeguimientos(seguimientos: ReadonlyArray<Seguimiento>): string {
  if (seguimientos.length === 0) return '';
  return `
    <section class="tarjeta">
      <h3 style="margin-top:0;">Seguimientos registrados</h3>
      <ul class="lista">
        ${seguimientos
          .map(
            (s) => `
          <li class="lista-item">
            <div class="lista-item__cabecera">
              <span class="lista-item__titulo">${s.origen === 'voz' ? 'Voz' : 'Texto'} · ${formatFechaHora(s.ocurridoEn)}</span>
              ${s.audio && !s.audio.borradoEn ? `<button type="button" class="btn-texto" data-accion="borrar-audio" data-id="${esc(s.audio.id)}">Borrar audio</button>` : ''}
            </div>
            <p style="margin:0;">${esc(s.texto)}</p>
            ${s.audio?.borradoEn ? '<p style="margin:0; color:var(--texto-2); font-size:13px;">Audio borrado. La transcripción se conserva.</p>' : ''}
          </li>`,
          )
          .join('')}
      </ul>
    </section>
  `;
}
