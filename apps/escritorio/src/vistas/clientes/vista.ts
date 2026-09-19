/**
 * Vista 03 — Clientes.   Ruta: #/clientes   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 4. Ninguna otra sesión edita esta carpeta.
 *
 * Cartera, ficha, línea de tiempo y seguimiento por VOZ y por TEXTO.
 *
 * Voz y texto producen la misma entidad y el mismo procesamiento.
 *
 * ⛔ NADA derivado de voz o texto se persiste sin confirmación explícita del
 *    vendedor, ítem por ítem. El sistema propone; la persona guarda.
 * ⛔ Sin soporte de dictado: se informa y se ofrece el camino de texto.
 *    Nunca un botón inerte.
 * ⛔ Se avisa explícitamente que se está grabando.
 * ⛔ Las menciones fuera del catálogo no crean productos: se descartan o van a
 *    sugerencia.
 * ⛔ Las actividades se consumen de la taxonomía de S3; no se declaran acá.
 *
 * Obligatorio: los cuatro estados — cargando, vacío, error con reintento, con
 * datos. Y los cinco anchos: 360, 390, 768, 1024 y 1440 px, sin scroll
 * horizontal de página. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md · USER_FLOWS.md · API_CONTRACTS.md · DESIGN_SYSTEM.md · QA_CHECKLIST.md
 */

import './estilos.css';
import type {
  Cliente, ClienteDetalle, EtapaCliente, FiltroClientes, Id, ISODate, NuevoCliente,
  ProductoId, PropuestaDeSeguimiento, SeguimientoConfirmado, SoporteDictado,
} from '@labia/compartido';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import {
  plantillaCargando, plantillaCapturaInicial, plantillaCapturaTexto,
  plantillaCapturaVozDetenida, plantillaCapturaVozGrabando, plantillaCapturaVozInicio,
  plantillaError, plantillaFicha, plantillaFiltros, plantillaListaClientes,
  plantillaLineaTiempo, plantillaPropuesta, plantillaSeguimientos, plantillaShell,
  plantillaVacio,
} from './plantillas';
import { esc, generarClave } from './util';
import { montarTaller } from '../fichas/taller';
import { iniciarGrabacion, verificarSoporteDictado, type ControladorGrabacion } from './voz';

type ModoCaptura = 'texto' | 'voz';
type EstadoCaptura = 'inicial' | 'grabando' | 'grabada' | 'propuesta';

function quitarDiacriticos(texto: string): string {
  return Array.from(texto)
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < 0x0300 || codigo > 0x036f;
    })
    .join('');
}

function slugificar(texto: string): string {
  const normalizado = quitarDiacriticos(texto.trim().toLowerCase().normalize('NFD'));
  const conGuiones = normalizado.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return conGuiones || 'actividad';
}

function crearVistaClientes(): Vista {
  let ctx: ContextoVista | null = null;

  let clienteActualId: Id | null = null;
  let fichaActual: ClienteDetalle | null = null;
  let filtro: { texto: string; tipo: '' | 'empresa' | 'profesional'; etapa: string } = { texto: '', tipo: '', etapa: '' };
  let temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

  let capturaSoporte: SoporteDictado | null = null;
  let capturaModo: ModoCaptura = 'texto';
  let capturaEstado: EstadoCaptura = 'inicial';
  let capturaControlador: ControladorGrabacion | null = null;
  let capturaAudioId: Id | null = null;
  let capturaPropuesta: PropuestaDeSeguimiento | null = null;
  let capturaOcurridoEn: ISODate = new Date().toISOString();

  function requerido(): ContextoVista {
    if (!ctx) throw new Error('La vista Clientes no está montada.');
    return ctx;
  }

  function avisar(mensaje: string, esError = false): void {
    const contenedor = requerido().raiz.querySelector<HTMLElement>('#clientes-aviso');
    if (!contenedor) return;
    contenedor.innerHTML = mensaje ? `<p class="aviso${esError ? ' aviso--peligro' : ''}">${esc(mensaje)}</p>` : '';
  }

  function contenido(): HTMLElement {
    const el = requerido().raiz.querySelector<HTMLElement>('#clientes-contenido');
    if (!el) throw new Error('Falta el contenedor de contenido de Clientes.');
    return el;
  }

  function filtroActual(): FiltroClientes {
    return {
      ...(filtro.texto ? { texto: filtro.texto } : {}),
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
      ...(filtro.etapa ? { etapa: filtro.etapa as EtapaCliente } : {}),
    };
  }

  // -------------------------------------------------------------------------
  // Cartera
  // -------------------------------------------------------------------------

  async function cargarLista(): Promise<void> {
    const c = requerido();
    contenido().innerHTML = `${plantillaFiltros(filtro.texto, filtro.tipo, filtro.etapa)}<div id="clientes-lista-cuerpo">${plantillaCargando()}</div>`;
    const resultado = await c.datos.listarClientes(filtroActual(), { limite: 50 });
    if (c.senal.aborted) return;
    const cuerpo = requerido().raiz.querySelector<HTMLElement>('#clientes-lista-cuerpo');
    if (!cuerpo) return;
    if (!resultado.ok) {
      cuerpo.innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar-lista');
      return;
    }
    if (resultado.datos.items.length === 0) {
      cuerpo.innerHTML = plantillaVacio(
        filtro.texto || filtro.tipo || filtro.etapa
          ? 'Ningún cliente coincide con este filtro.'
          : 'Todavía no cargaste ningún cliente. Empezá por alguien que ya conocés.',
        'Nuevo cliente',
        'nuevo-cliente',
      );
      return;
    }
    cuerpo.innerHTML = plantillaListaClientes(resultado.datos.items as ReadonlyArray<Cliente>);
  }

  function mostrarFormularioNuevoCliente(): void {
    contenido().insertAdjacentHTML(
      'beforeend',
      `
      <dialog class="tarjeta" id="clientes-dialogo-nuevo" style="max-width:480px; width:90vw; border:1px solid var(--linea);">
        <form method="dialog" id="clientes-form-nuevo" style="display:flex; flex-direction:column; gap:1rem;">
          <h2 style="margin:0;">Nuevo cliente</h2>
          <div class="campo">
            <label for="clientes-nuevo-nombre">Nombre</label>
            <input class="entrada" id="clientes-nuevo-nombre" required placeholder="Nombre de la empresa o profesional" />
          </div>
          <div>
            <p style="margin:0 0 0.4rem; color:var(--texto-2); font-size:14px;">Tipo</p>
            <div class="chips" role="radiogroup" aria-label="Tipo de cliente">
              <label class="chip"><input type="radio" name="tipo" value="empresa" checked style="margin-right:0.4em;" />Empresa</label>
              <label class="chip"><input type="radio" name="tipo" value="profesional" style="margin-right:0.4em;" />Profesional</label>
            </div>
          </div>
          <div class="campo">
            <label for="clientes-nuevo-actividad">A qué se dedica</label>
            <input class="entrada" id="clientes-nuevo-actividad" required placeholder="Ej.: gomería, odontología, motel…" />
          </div>
          <div class="campo">
            <label for="clientes-nuevo-ciudad">Ciudad (opcional)</label>
            <input class="entrada" id="clientes-nuevo-ciudad" />
          </div>
          <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
            <button type="button" class="btn-borde" data-accion="cerrar-nuevo-cliente">Cancelar</button>
            <button type="submit" class="btn">Guardar</button>
          </div>
        </form>
      </dialog>
    `,
    );
    const dialogo = contenido().querySelector<HTMLDialogElement>('#clientes-dialogo-nuevo');
    const formulario = contenido().querySelector<HTMLFormElement>('#clientes-form-nuevo');
    dialogo?.showModal();
    formulario?.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const nombre = (contenido().querySelector<HTMLInputElement>('#clientes-nuevo-nombre')?.value ?? '').trim();
      const actividad = (contenido().querySelector<HTMLInputElement>('#clientes-nuevo-actividad')?.value ?? '').trim();
      const ciudad = (contenido().querySelector<HTMLInputElement>('#clientes-nuevo-ciudad')?.value ?? '').trim();
      const tipo = (contenido().querySelector<HTMLInputElement>('input[name="tipo"]:checked')?.value ?? 'empresa') as 'empresa' | 'profesional';
      if (!nombre || !actividad) return;
      const datos: NuevoCliente = { tipo, nombre, actividadId: slugificar(actividad), ...(ciudad ? { ciudad } : {}) };
      const resultado = await requerido().datos.crearCliente(datos, generarClave());
      dialogo?.close();
      dialogo?.remove();
      if (!resultado.ok) {
        avisar(resultado.error.mensajeAmable, true);
        return;
      }
      avisar(`Cliente "${resultado.datos.nombre}" guardado.`);
      await abrirFicha(resultado.datos.id);
    });
  }

  // -------------------------------------------------------------------------
  // Ficha
  // -------------------------------------------------------------------------

  async function abrirFicha(id: Id): Promise<void> {
    clienteActualId = id;
    contenido().innerHTML = plantillaCargando(3);
    const resultado = await requerido().datos.obtenerCliente(id);
    if (requerido().senal.aborted) return;
    if (!resultado.ok) {
      contenido().innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar-ficha');
      return;
    }
    fichaActual = resultado.datos;
    contenido().innerHTML = plantillaFicha(fichaActual);
    void cargarLineaDeTiempo(id);
    void cargarSeguimientos(id);
  }

  /**
   * Abre el taller de la ficha dentro de la ficha del cliente.
   *
   * ⛔ El taller es el mismo modulo que usa Planificar: no hay una segunda
   *    copia de la preparacion. Lo unico que cambia es de donde se entra.
   */
  async function abrirTallerDeFicha(productoId: ProductoId, boton: HTMLElement): Promise<void> {
    const c = requerido();
    const contenedor = c.raiz.querySelector<HTMLElement>('#clientes-ficha-taller');
    if (!contenedor || !clienteActualId) return;

    // El chip elegido queda marcado; los otros, sueltos.
    for (const otro of c.raiz.querySelectorAll<HTMLElement>('[data-accion="preparar-ficha"]')) {
      otro.setAttribute('aria-pressed', String(otro === boton));
    }

    const sesion = await c.datos.sesionActual();
    if (c.senal.aborted) return;
    const nombreVendedor = sesion.ok && sesion.datos ? sesion.datos.usuario.nombre : 'Tu vendedor';

    await montarTaller({
      datos: c.datos,
      contenedor,
      productoId,
      clienteId: clienteActualId,
      nombreVendedor,
      senal: c.senal,
    });
  }

  async function cargarLineaDeTiempo(id: Id): Promise<void> {
    const c = requerido();
    const objetivo = c.raiz.querySelector<HTMLElement>('#clientes-linea-tiempo');
    if (!objetivo) return;
    const resultado = await c.datos.lineaDeTiempo(id, { limite: 20 });
    if (c.senal.aborted) return;
    const destino = requerido().raiz.querySelector<HTMLElement>('#clientes-linea-tiempo');
    if (!destino) return;
    if (!resultado.ok) {
      destino.innerHTML = plantillaError(resultado.error.mensajeAmable, resultado.error.pista, 'reintentar-linea-tiempo');
      return;
    }
    destino.innerHTML = plantillaLineaTiempo(resultado.datos.items);
  }

  async function cargarSeguimientos(id: Id): Promise<void> {
    const c = requerido();
    const resultado = await c.datos.listarSeguimientos({ clienteId: id }, { limite: 20 });
    if (c.senal.aborted) return;
    const seccionCaptura = requerido().raiz.querySelector<HTMLElement>('#clientes-captura-seccion');
    if (!seccionCaptura || !resultado.ok) return;
    const previo = requerido().raiz.querySelector<HTMLElement>('#clientes-seguimientos-lista');
    previo?.remove();
    seccionCaptura.insertAdjacentHTML('beforebegin', `<div id="clientes-seguimientos-lista">${plantillaSeguimientos(resultado.datos.items)}</div>`);
  }

  // -------------------------------------------------------------------------
  // Captura de seguimiento
  // -------------------------------------------------------------------------

  function reiniciarCaptura(): void {
    capturaControlador?.cancelar();
    capturaControlador = null;
    capturaModo = 'texto';
    capturaEstado = 'inicial';
    capturaAudioId = null;
    capturaPropuesta = null;
  }

  async function abrirCaptura(): Promise<void> {
    reiniciarCaptura();
    const seccion = requerido().raiz.querySelector<HTMLElement>('#clientes-captura-seccion');
    const cuerpo = requerido().raiz.querySelector<HTMLElement>('#clientes-captura');
    if (!seccion || !cuerpo) return;
    seccion.hidden = false;
    cuerpo.innerHTML = plantillaCargando(1);
    capturaSoporte = await verificarSoporteDictado(requerido().datos);
    if (!capturaSoporte.disponible) capturaModo = 'texto';
    renderizarCaptura();
    seccion.scrollIntoView({ block: 'nearest' });
  }

  function renderizarCaptura(): void {
    const cuerpo = requerido().raiz.querySelector<HTMLElement>('#clientes-captura');
    if (!cuerpo || !capturaSoporte) return;
    cuerpo.innerHTML = plantillaCapturaInicial(capturaSoporte, capturaModo);
    renderizarCuerpoCaptura();
  }

  function renderizarCuerpoCaptura(): void {
    const destino = requerido().raiz.querySelector<HTMLElement>('#clientes-captura-cuerpo');
    if (!destino) return;
    if (capturaEstado === 'propuesta' && capturaPropuesta && fichaActual) {
      destino.innerHTML = plantillaPropuesta(capturaPropuesta, fichaActual.etapa);
      return;
    }
    if (capturaModo === 'voz') {
      if (capturaEstado === 'grabando') destino.innerHTML = plantillaCapturaVozGrabando('');
      else if (capturaEstado === 'grabada') destino.innerHTML = plantillaCapturaVozDetenida(textoDeCaptura());
      else destino.innerHTML = plantillaCapturaVozInicio();
      return;
    }
    destino.innerHTML = plantillaCapturaTexto(textoDeCaptura());
  }

  function textoDeCaptura(): string {
    return requerido().raiz.querySelector<HTMLTextAreaElement>('#clientes-captura-texto')?.value ?? '';
  }

  async function iniciarDictado(): Promise<void> {
    try {
      capturaControlador = await iniciarGrabacion(
        (texto) => {
          const area = requerido().raiz.querySelector<HTMLTextAreaElement>('#clientes-captura-texto');
          if (area) area.value = texto;
        },
        (mensaje) => avisar(mensaje, true),
      );
      capturaEstado = 'grabando';
      renderizarCuerpoCaptura();
    } catch {
      avisar('No pudimos acceder al micrófono. Podés seguir por texto.', true);
      capturaModo = 'texto';
      renderizarCaptura();
    }
  }

  async function detenerDictado(): Promise<void> {
    if (!capturaControlador) return;
    const textoPrevio = textoDeCaptura();
    const { blob } = await capturaControlador.detener();
    capturaControlador = null;
    capturaEstado = 'grabada';
    renderizarCuerpoCaptura();
    const area = requerido().raiz.querySelector<HTMLTextAreaElement>('#clientes-captura-texto');
    if (area) area.value = textoPrevio;
    const subida = await requerido().datos.subirAudio(blob, generarClave());
    if (subida.ok) capturaAudioId = subida.datos.id;
    else avisar('No pudimos guardar el audio, pero la transcripción sigue disponible.', true);
  }

  async function procesarCaptura(): Promise<void> {
    if (!clienteActualId) return;
    const texto = textoDeCaptura().trim();
    if (!texto) {
      avisar('Escribí o dictá algo antes de procesar.', true);
      return;
    }
    capturaOcurridoEn = new Date().toISOString();
    const resultado = await requerido().datos.procesarCaptura({
      clienteId: clienteActualId,
      origen: capturaModo,
      texto,
      ...(capturaAudioId ? { audioId: capturaAudioId } : {}),
    });
    if (!resultado.ok) {
      avisar(resultado.error.mensajeAmable, true);
      return;
    }
    capturaPropuesta = resultado.datos;
    capturaEstado = 'propuesta';
    renderizarCuerpoCaptura();
  }

  async function guardarSeguimiento(): Promise<void> {
    if (!clienteActualId || !capturaPropuesta) return;
    const raiz = requerido().raiz;
    const nota = raiz.querySelector<HTMLTextAreaElement>('#clientes-propuesta-nota')?.value.trim() ?? capturaPropuesta.notaEstructurada;
    const pasosAceptados = capturaPropuesta.pasosPropuestos.filter((_, i) => raiz.querySelector<HTMLInputElement>(`[data-paso="${i}"]`)?.checked)
      .map((p) => ({ titulo: p.titulo, venceEn: p.venceEn }));
    const aplicarEtapaSugerida = raiz.querySelector<HTMLInputElement>('#clientes-propuesta-etapa')?.checked ?? false;
    const confirmado: SeguimientoConfirmado = {
      clienteId: clienteActualId,
      origen: capturaModo,
      texto: nota,
      audioId: capturaAudioId,
      ocurridoEn: capturaOcurridoEn,
      productosMencionados: capturaPropuesta.productosMencionados,
      pasosAceptados,
      aplicarEtapaSugerida,
      confirmadoPorUsuario: true,
    };
    const resultado = await requerido().datos.guardarSeguimiento(confirmado, generarClave());
    if (!resultado.ok) {
      avisar(resultado.error.mensajeAmable, true);
      return;
    }
    const seccion = raiz.querySelector<HTMLElement>('#clientes-captura-seccion');
    if (seccion) seccion.hidden = true;
    reiniciarCaptura();
    avisar('Seguimiento guardado.');
    await abrirFicha(clienteActualId);
  }

  async function borrarAudio(audioId: Id): Promise<void> {
    if (!window.confirm('Esto borra el audio de forma permanente. La transcripción se conserva. ¿Continuar?')) return;
    const motivo = window.prompt('Contá brevemente por qué lo borrás:');
    if (!motivo) return;
    const resultado = await requerido().datos.borrarAudio(audioId, motivo);
    if (!resultado.ok) {
      avisar(resultado.error.mensajeAmable, true);
      return;
    }
    if (clienteActualId) await cargarSeguimientos(clienteActualId);
  }

  // -------------------------------------------------------------------------
  // Eventos
  // -------------------------------------------------------------------------

  function onClick(evento: MouseEvent): void {
    const objetivo = evento.target instanceof Element ? evento.target.closest<HTMLElement>('[data-accion]') : null;
    if (!objetivo) return;
    const accion = objetivo.dataset.accion;
    const valor = objetivo.dataset.valor;
    const id = objetivo.dataset.id;

    switch (accion) {
      case 'reintentar-lista':
        void cargarLista();
        return;
      case 'reintentar-ficha':
        if (clienteActualId) void abrirFicha(clienteActualId);
        return;
      case 'reintentar-linea-tiempo':
        if (clienteActualId) void cargarLineaDeTiempo(clienteActualId);
        return;
      case 'nuevo-cliente':
        mostrarFormularioNuevoCliente();
        return;
      case 'cerrar-nuevo-cliente':
        requerido().raiz.querySelector<HTMLDialogElement>('#clientes-dialogo-nuevo')?.close();
        requerido().raiz.querySelector<HTMLDialogElement>('#clientes-dialogo-nuevo')?.remove();
        return;
      case 'abrir-cliente':
        if (id) void abrirFicha(id);
        return;
      case 'volver-lista':
        clienteActualId = null;
        fichaActual = null;
        reiniciarCaptura();
        void cargarLista();
        return;
      case 'filtro-tipo':
        filtro = { ...filtro, tipo: (valor ?? '') as '' | 'empresa' | 'profesional' };
        void cargarLista();
        return;
      case 'filtro-etapa':
        filtro = { ...filtro, etapa: valor ?? '' };
        void cargarLista();
        return;
      case 'nuevo-seguimiento':
        void abrirCaptura();
        return;
      case 'preparar-ficha':
        if (valor) void abrirTallerDeFicha(valor as ProductoId, objetivo);
        return;
      case 'modo-captura':
        if (valor === 'voz' || valor === 'texto') {
          reiniciarCaptura();
          capturaModo = valor;
          renderizarCaptura();
        }
        return;
      case 'iniciar-grabacion':
        void iniciarDictado();
        return;
      case 'detener-grabacion':
        void detenerDictado();
        return;
      case 'procesar-captura':
        void procesarCaptura();
        return;
      case 'descartar-captura': {
        const seccion = requerido().raiz.querySelector<HTMLElement>('#clientes-captura-seccion');
        if (seccion) seccion.hidden = true;
        reiniciarCaptura();
        return;
      }
      case 'guardar-seguimiento':
        void guardarSeguimiento();
        return;
      case 'borrar-audio':
        if (id) void borrarAudio(id);
        return;
      default:
        return;
    }
  }

  function onInput(evento: Event): void {
    const objetivo = evento.target;
    if (!(objetivo instanceof HTMLInputElement)) return;
    if (objetivo.dataset.accion !== 'buscar') return;
    const valor = objetivo.value;
    if (temporizadorBusqueda) clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      filtro = { ...filtro, texto: valor };
      void cargarLista();
    }, 300);
  }

  return {
    montar(contexto: ContextoVista): void | Promise<void> {
      ctx = contexto;
      clienteActualId = null;
      fichaActual = null;
      filtro = { texto: '', tipo: '', etapa: '' };
      reiniciarCaptura();

      contexto.raiz.innerHTML = plantillaShell();
      contexto.raiz.addEventListener('click', onClick);
      contexto.raiz.addEventListener('input', onInput);
      contexto.senal.addEventListener('abort', () => {
        capturaControlador?.cancelar();
      });

      return cargarLista();
    },

    desmontar(): void {
      capturaControlador?.cancelar();
      capturaControlador = null;
      if (temporizadorBusqueda) clearTimeout(temporizadorBusqueda);
      if (ctx) {
        ctx.raiz.removeEventListener('click', onClick);
        ctx.raiz.removeEventListener('input', onInput);
      }
      ctx = null;
    },
  };
}

/**
 * ⛔ Convención única entre las seis sesiones (nucleo/contrato-vista.ts):
 *    `export function crearVista(): Vista`. El núcleo instancia una vista
 *    nueva por cada montaje.
 */
export function crearVista(): Vista {
  return crearVistaClientes();
}
