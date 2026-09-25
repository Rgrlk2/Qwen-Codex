/**
 * Vista 04 — Agenda operativa.   Ruta: #/agenda   Roles: vendedor + administrador
 *
 * ⛔ DUEÑA: Sesión 4 (junto con Clientes y Seguimiento).
 *
 * LA AGENDA SE POBLA SOLA. El vendedor ajusta fechas y completa acciones;
 * ⛔ no reconstruye nada a mano.
 *
 * Se alimenta automáticamente de:
 *   planes · objetivos aceptados · seguimientos · presentaciones ·
 *   cotizaciones · vencimientos · aperturas de enlace que sugieren contactar
 *
 * Cinco vistas internas:
 *   · Hoy            visitas, llamadas, próximos pasos, vencimientos, atrasados
 *   · Semana         siete días con su carga
 *   · Mes            calendario mensual
 *   · Cronograma     Gantt comercial: la vida de cada cliente y cada plan
 *   · Atrasados      lo que se pasó de fecha y sigue pendiente
 *
 * ⛔ Mover una fecha exige motivo.
 * ⛔ Crear a mano es la excepción: casi todo llega derivado.
 *
 * Obligatorio: los cuatro estados y los cinco anchos (360, 390, 768, 1024, 1440),
 * sin scroll horizontal de página. El cronograma va dentro de su propio
 * contenedor con overflow-x: auto. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md §2.4 · USER_FLOWS.md F8 · API_CONTRACTS.md §2.4
 */

import './estilos.css';
import type { EntradaAgenda, Id, NuevaEntradaManual, Prioridad, TipoEntradaAgenda, VistaAgenda } from '@labia/compartido';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import {
  plantillaAtrasados, plantillaCargando, plantillaCronograma, plantillaError,
  plantillaHoy, plantillaMes, plantillaSemana, plantillaShell, plantillaVacio,
} from './plantillas';
import { aInputFechaHora, esc, generarClave } from './util';

const TIPOS_MANUALES: ReadonlyArray<{ valor: Extract<TipoEntradaAgenda, 'visita' | 'llamada' | 'proximo_paso'>; etiqueta: string }> = [
  { valor: 'visita', etiqueta: 'Visita' },
  { valor: 'llamada', etiqueta: 'Llamada' },
  { valor: 'proximo_paso', etiqueta: 'Próximo paso' },
];

function crearVistaAgenda(): Vista {
  let ctx: ContextoVista | null = null;
  let pestana: VistaAgenda = 'hoy';
  let semanaDesde: string | undefined;
  const hoyReferencia = new Date();
  let mesActual = { anio: hoyReferencia.getFullYear(), mes: hoyReferencia.getMonth() + 1 };
  const indiceEntradas = new Map<Id, EntradaAgenda>();
  let clientesCache: ReadonlyArray<{ id: Id; nombre: string }> | null = null;

  function requerido(): ContextoVista {
    if (!ctx) throw new Error('La vista Agenda no está montada.');
    return ctx;
  }

  function contenido(): HTMLElement {
    const el = requerido().raiz.querySelector<HTMLElement>('#agenda-contenido');
    if (!el) throw new Error('Falta el contenedor de contenido de Agenda.');
    return el;
  }

  function avisar(mensaje: string, esError = false): void {
    const el = requerido().raiz.querySelector<HTMLElement>('#agenda-aviso');
    if (!el) return;
    el.innerHTML = mensaje ? `<p class="aviso${esError ? ' aviso--peligro' : ''}">${esc(mensaje)}</p>` : '';
  }

  function registrarEntradas(entradas: ReadonlyArray<EntradaAgenda>): void {
    for (const e of entradas) indiceEntradas.set(e.id, e);
  }

  // -------------------------------------------------------------------------
  // Carga por pestaña
  // -------------------------------------------------------------------------

  async function cargarPestanaActual(): Promise<void> {
    contenido().innerHTML = plantillaCargando();
    if (pestana === 'hoy') return cargarHoy();
    if (pestana === 'semana') return cargarSemana();
    if (pestana === 'mes') return cargarMes();
    if (pestana === 'cronograma') return cargarCronograma();
    return cargarAtrasados();
  }

  async function cargarHoy(): Promise<void> {
    const c = requerido();
    const resultado = await c.datos.agendaHoy();
    if (c.senal.aborted) return;
    if (!resultado.ok) {
      contenido().innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar');
      return;
    }
    const { visitas, llamadas, proximosPasos, vencimientos, atrasados } = resultado.datos;
    registrarEntradas([...visitas, ...llamadas, ...proximosPasos, ...vencimientos, ...atrasados]);
    if (resultado.datos.totalPendientes === 0) {
      contenido().innerHTML = plantillaVacio(
        'Todavía no tenés nada pendiente hoy. La agenda se completa sola a medida que planificás, seguís clientes y enviás propuestas.',
        'Crear una entrada manual',
        'nueva-entrada',
      );
      return;
    }
    contenido().innerHTML = plantillaHoy(resultado.datos);
  }

  async function cargarSemana(): Promise<void> {
    const c = requerido();
    const resultado = await c.datos.agendaSemana(semanaDesde);
    if (c.senal.aborted) return;
    if (!resultado.ok) {
      contenido().innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar');
      return;
    }
    semanaDesde = resultado.datos.desde;
    registrarEntradas(resultado.datos.dias.flatMap((d) => d.entradas));
    const totalSemana = resultado.datos.dias.reduce((acc, d) => acc + d.totalPendientes, 0);
    const nav = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <button type="button" class="btn-borde" data-accion="semana-anterior">&larr; Semana anterior</button>
        <span style="color:var(--texto-2);">Del ${new Date(resultado.datos.desde).toLocaleDateString('es-PY')} al ${new Date(resultado.datos.hasta).toLocaleDateString('es-PY')}</span>
        <button type="button" class="btn-borde" data-accion="semana-siguiente">Semana siguiente &rarr;</button>
      </div>
    `;
    contenido().innerHTML = totalSemana === 0
      ? nav + plantillaVacio('No hay nada agendado esta semana.', 'Crear una entrada manual', 'nueva-entrada')
      : nav + plantillaSemana(resultado.datos);
  }

  async function cargarMes(): Promise<void> {
    const c = requerido();
    const resultado = await c.datos.agendaMes(mesActual.anio, mesActual.mes);
    if (c.senal.aborted) return;
    if (!resultado.ok) {
      contenido().innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar');
      return;
    }
    contenido().innerHTML = plantillaMes(resultado.datos);
  }

  async function cargarCronograma(): Promise<void> {
    const c = requerido();
    const desde = new Date();
    desde.setUTCMonth(desde.getUTCMonth() - 2);
    const hasta = new Date();
    hasta.setUTCMonth(hasta.getUTCMonth() + 3);
    const resultado = await c.datos.cronogramaComercial(desde.toISOString(), hasta.toISOString());
    if (c.senal.aborted) return;
    if (!resultado.ok) {
      contenido().innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar');
      return;
    }
    if (resultado.datos.barras.length === 0) {
      contenido().innerHTML = plantillaVacio('Todavía no hay clientes con historia suficiente para el cronograma.', 'Ir a Clientes', 'sin-accion');
      return;
    }
    contenido().innerHTML = plantillaCronograma(resultado.datos.barras);
  }

  async function cargarAtrasados(): Promise<void> {
    const c = requerido();
    const resultado = await c.datos.entradasAtrasadas({ limite: 50 });
    if (c.senal.aborted) return;
    if (!resultado.ok) {
      contenido().innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar');
      return;
    }
    registrarEntradas(resultado.datos.items);
    if (resultado.datos.items.length === 0) {
      contenido().innerHTML = plantillaVacio('No hay nada atrasado ahora mismo. Así se ve una agenda al día.', 'Ver Hoy', 'ir-hoy');
      return;
    }
    contenido().innerHTML = plantillaAtrasados(resultado.datos.items);
  }

  function cambiarPestana(valor: VistaAgenda): void {
    pestana = valor;
    for (const boton of requerido().raiz.querySelectorAll<HTMLElement>('[data-accion="pestana"]')) {
      boton.setAttribute('aria-selected', String(boton.dataset.valor === valor));
    }
    void cargarPestanaActual();
  }

  // -------------------------------------------------------------------------
  // Acciones sobre una entrada
  // -------------------------------------------------------------------------

  async function completar(id: Id): Promise<void> {
    const resultado = await requerido().datos.completarEntrada(id, generarClave());
    if (!resultado.ok) {
      avisar(resultado.error.mensajeAmable, true);
      return;
    }
    avisar('Marcada como completada.');
    await cargarPestanaActual();
  }

  function abrirDialogoAjustar(id: Id): void {
    const entrada = indiceEntradas.get(id);
    if (!entrada) return;
    const fechaActual = entrada.venceEn ?? entrada.inicioEn ?? new Date().toISOString();
    mostrarDialogo(`
      <form method="dialog" id="agenda-form-ajustar" style="display:flex; flex-direction:column; gap:1rem;">
        <h2 style="margin:0;">Ajustar fecha</h2>
        <p style="margin:0; color:var(--texto-2);">${esc(entrada.titulo)}</p>
        <div class="campo">
          <label for="agenda-ajustar-fecha">Nueva fecha</label>
          <input class="entrada" type="datetime-local" id="agenda-ajustar-fecha" value="${aInputFechaHora(fechaActual)}" required />
        </div>
        <div class="campo">
          <label for="agenda-ajustar-motivo">Motivo del cambio (obligatorio)</label>
          <textarea id="agenda-ajustar-motivo" required></textarea>
        </div>
        <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
          <button type="button" class="btn-borde" data-accion="cerrar-dialogo">Cancelar</button>
          <button type="submit" class="btn">Guardar</button>
        </div>
      </form>
    `, async () => {
      const raiz = requerido().raiz;
      const valorFecha = raiz.querySelector<HTMLInputElement>('#agenda-ajustar-fecha')?.value;
      const motivo = raiz.querySelector<HTMLTextAreaElement>('#agenda-ajustar-motivo')?.value.trim();
      if (!valorFecha || !motivo) return false;
      const nuevaFecha = new Date(valorFecha).toISOString();
      const resultado = await requerido().datos.ajustarEntrada({
        entradaId: id,
        motivo,
        venceEn: nuevaFecha,
        ...(entrada.inicioEn ? { inicioEn: nuevaFecha } : {}),
      });
      if (!resultado.ok) {
        avisar(resultado.error.mensajeAmable, true);
        return false;
      }
      avisar('Fecha ajustada.');
      await cargarPestanaActual();
      return true;
    });
  }

  function abrirDialogoDescartar(id: Id): void {
    const entrada = indiceEntradas.get(id);
    if (!entrada) return;
    mostrarDialogo(`
      <form method="dialog" id="agenda-form-descartar" style="display:flex; flex-direction:column; gap:1rem;">
        <h2 style="margin:0;">Descartar entrada</h2>
        <p style="margin:0; color:var(--texto-2);">${esc(entrada.titulo)} — esto no se borra, queda en la historia como descartada.</p>
        <div class="campo">
          <label for="agenda-descartar-motivo">Motivo (obligatorio)</label>
          <textarea id="agenda-descartar-motivo" required></textarea>
        </div>
        <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
          <button type="button" class="btn-borde" data-accion="cerrar-dialogo">Cancelar</button>
          <button type="submit" class="btn">Descartar</button>
        </div>
      </form>
    `, async () => {
      const motivo = requerido().raiz.querySelector<HTMLTextAreaElement>('#agenda-descartar-motivo')?.value.trim();
      if (!motivo) return false;
      const resultado = await requerido().datos.descartarEntrada(id, motivo);
      if (!resultado.ok) {
        avisar(resultado.error.mensajeAmable, true);
        return false;
      }
      avisar('Entrada descartada.');
      await cargarPestanaActual();
      return true;
    });
  }

  async function abrirDialogoNuevaEntrada(): Promise<void> {
    if (!clientesCache) {
      const resultado = await requerido().datos.listarClientes({}, { limite: 100 });
      clientesCache = resultado.ok ? resultado.datos.items.map((c) => ({ id: c.id, nombre: c.nombre })) : [];
    }
    const opcionesCliente = clientesCache
      .map((c) => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`)
      .join('');
    mostrarDialogo(`
      <form method="dialog" id="agenda-form-nueva" style="display:flex; flex-direction:column; gap:1rem;">
        <h2 style="margin:0;">Nueva entrada</h2>
        <p style="margin:0; color:var(--texto-2);">Sólo para visitas, llamadas o próximos pasos: el resto de la agenda se completa sola.</p>
        <div class="campo">
          <label for="agenda-nueva-tipo">Tipo</label>
          <select id="agenda-nueva-tipo">
            ${TIPOS_MANUALES.map((t) => `<option value="${t.valor}">${t.etiqueta}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label for="agenda-nueva-cliente">Cliente (opcional)</label>
          <select id="agenda-nueva-cliente"><option value="">Sin cliente asociado</option>${opcionesCliente}</select>
        </div>
        <div class="campo">
          <label for="agenda-nueva-titulo">Título</label>
          <input class="entrada" id="agenda-nueva-titulo" required placeholder="Ej.: Llamar para coordinar la visita" />
        </div>
        <div class="campo">
          <label for="agenda-nueva-fecha">Fecha</label>
          <input class="entrada" type="datetime-local" id="agenda-nueva-fecha" value="${aInputFechaHora(new Date().toISOString())}" required />
        </div>
        <div class="campo">
          <label for="agenda-nueva-prioridad">Prioridad</label>
          <select id="agenda-nueva-prioridad">
            <option value="alta">Alta</option>
            <option value="media" selected>Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
          <button type="button" class="btn-borde" data-accion="cerrar-dialogo">Cancelar</button>
          <button type="submit" class="btn">Crear</button>
        </div>
      </form>
    `, async () => {
      const raiz = requerido().raiz;
      const tipo = raiz.querySelector<HTMLSelectElement>('#agenda-nueva-tipo')?.value as NuevaEntradaManual['tipo'] | undefined;
      const clienteId = raiz.querySelector<HTMLSelectElement>('#agenda-nueva-cliente')?.value || null;
      const titulo = raiz.querySelector<HTMLInputElement>('#agenda-nueva-titulo')?.value.trim();
      const valorFecha = raiz.querySelector<HTMLInputElement>('#agenda-nueva-fecha')?.value;
      const prioridad = raiz.querySelector<HTMLSelectElement>('#agenda-nueva-prioridad')?.value as Prioridad | undefined;
      if (!tipo || !titulo || !valorFecha) return false;
      const datos: NuevaEntradaManual = {
        tipo,
        clienteId,
        titulo,
        inicioEn: new Date(valorFecha).toISOString(),
        ...(prioridad ? { prioridad } : {}),
      };
      const resultado = await requerido().datos.crearEntradaManual(datos, generarClave());
      if (!resultado.ok) {
        avisar(resultado.error.mensajeAmable, true);
        return false;
      }
      avisar('Entrada creada.');
      await cargarPestanaActual();
      return true;
    });
  }

  function mostrarDialogo(contenidoHtml: string, alEnviar: () => Promise<boolean>): void {
    const raiz = requerido().raiz;
    raiz.querySelector('#agenda-dialogo')?.remove();
    raiz.insertAdjacentHTML('beforeend', `<dialog class="tarjeta" id="agenda-dialogo" style="max-width:480px; width:90vw; border:1px solid var(--linea);">${contenidoHtml}</dialog>`);
    const dialogo = raiz.querySelector<HTMLDialogElement>('#agenda-dialogo');
    const formulario = dialogo?.querySelector('form');
    dialogo?.showModal();
    formulario?.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const ok = await alEnviar();
      if (ok) {
        dialogo?.close();
        dialogo?.remove();
      }
    });
  }

  function cerrarDialogo(): void {
    const dialogo = requerido().raiz.querySelector<HTMLDialogElement>('#agenda-dialogo');
    dialogo?.close();
    dialogo?.remove();
  }

  // -------------------------------------------------------------------------
  // Navegación de calendario por teclado (AC13)
  // -------------------------------------------------------------------------

  function onKeydownCalendario(evento: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(evento.key)) return;
    const objetivo = evento.target;
    if (!(objetivo instanceof HTMLElement) || !objetivo.classList.contains('calendario-dia')) return;
    const celdas = Array.from(requerido().raiz.querySelectorAll<HTMLElement>('.calendario-dia'));
    const indice = celdas.indexOf(objetivo);
    if (indice === -1) return;
    const salto = evento.key === 'ArrowLeft' ? -1 : evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowUp' ? -7 : 7;
    const siguiente = celdas[indice + salto];
    if (siguiente) {
      evento.preventDefault();
      siguiente.focus();
    }
  }

  // -------------------------------------------------------------------------
  // Delegación de eventos
  // -------------------------------------------------------------------------

  function onClick(evento: MouseEvent): void {
    const objetivo = evento.target instanceof Element ? evento.target.closest<HTMLElement>('[data-accion]') : null;
    if (!objetivo) return;
    const accion = objetivo.dataset.accion;
    const valor = objetivo.dataset.valor;
    const id = objetivo.dataset.id;

    switch (accion) {
      case 'pestana':
        if (valor) cambiarPestana(valor as VistaAgenda);
        return;
      case 'reintentar':
      case 'ir-hoy':
        if (accion === 'ir-hoy') cambiarPestana('hoy');
        else void cargarPestanaActual();
        return;
      case 'nueva-entrada':
        void abrirDialogoNuevaEntrada();
        return;
      case 'cerrar-dialogo':
        cerrarDialogo();
        return;
      case 'completar':
        if (id) void completar(id);
        return;
      case 'ajustar':
        if (id) abrirDialogoAjustar(id);
        return;
      case 'descartar':
        if (id) abrirDialogoDescartar(id);
        return;
      case 'mes-anterior':
        mesActual = mesActual.mes === 1 ? { anio: mesActual.anio - 1, mes: 12 } : { anio: mesActual.anio, mes: mesActual.mes - 1 };
        void cargarMes();
        return;
      case 'mes-siguiente':
        mesActual = mesActual.mes === 12 ? { anio: mesActual.anio + 1, mes: 1 } : { anio: mesActual.anio, mes: mesActual.mes + 1 };
        void cargarMes();
        return;
      case 'semana-anterior':
        if (semanaDesde) {
          const fecha = new Date(semanaDesde);
          fecha.setUTCDate(fecha.getUTCDate() - 7);
          semanaDesde = fecha.toISOString();
        }
        void cargarSemana();
        return;
      case 'semana-siguiente':
        if (semanaDesde) {
          const fecha = new Date(semanaDesde);
          fecha.setUTCDate(fecha.getUTCDate() + 7);
          semanaDesde = fecha.toISOString();
        }
        void cargarSemana();
        return;
      default:
        return;
    }
  }

  return {
    montar(contexto: ContextoVista): void | Promise<void> {
      ctx = contexto;
      pestana = 'hoy';
      semanaDesde = undefined;
      const referencia = new Date();
      mesActual = { anio: referencia.getFullYear(), mes: referencia.getMonth() + 1 };
      indiceEntradas.clear();
      clientesCache = null;

      contexto.raiz.innerHTML = plantillaShell();
      contexto.raiz.addEventListener('click', onClick);
      contexto.raiz.addEventListener('keydown', onKeydownCalendario);

      return cargarPestanaActual();
    },

    desmontar(): void {
      if (ctx) {
        ctx.raiz.removeEventListener('click', onClick);
        ctx.raiz.removeEventListener('keydown', onKeydownCalendario);
      }
      ctx = null;
      indiceEntradas.clear();
    },
  };
}

/**
 * ⛔ Convención única entre las seis sesiones (nucleo/contrato-vista.ts):
 *    `export function crearVista(): Vista`. El núcleo instancia una vista
 *    nueva por cada montaje.
 */
export function crearVista(): Vista {
  return crearVistaAgenda();
}
