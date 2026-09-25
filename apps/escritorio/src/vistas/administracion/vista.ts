/**
 * Vista 06 — Administración.   Ruta: #/administracion   Roles: SÓLO administrador
 *
 * ⛔ DUEÑO: Sesión 6. Ninguna otra sesión edita esta carpeta.
 *
 * ⛔ RUTA PROTEGIDA. Una sola vista con SECCIONES INTERNAS, no nueve pantallas.
 *
 * Secciones: control financiero · presupuesto de ventas · vendido, cobrado y
 * por cobrar · comisiones · ranking en guaraníes · accesos y frecuencia de uso ·
 * todos los clientes e historiales · aprobación de cotizaciones ·
 * configuración comercial · sugerencias de nuevos productos.
 *
 * ⛔ ELIMINADO: analítica genérica de conversión, mezcla de productos, embudos,
 *    tasas de cierre y gráficos decorativos. Lo que no sirve para decidir hoy,
 *    no se muestra.
 * ⛔ Nadie aprueba su propia cotización. No hay autoaprobación por tiempo,
 *    monto ni antigüedad.
 * ⛔ La guardia de rol vive en el ruteo Y en el servidor: esta vista además
 *    verifica el rol antes de pedir un solo dato.
 *
 * MASTER_SPEC.md §5 · USER_FLOWS.md F15 a F19 · API_CONTRACTS.md §2.8
 */

import type {
  AccesoEnlace, Actividad, Cliente, ConstanciaRespuesta, ControlFinanciero,
  CotizacionDetalle, Dinero, EstadoObservacion, FilaRanking, LineaParticipacion, LineaPorCobrar,
  Moneda, ParametrosSistema, ParticipacionProducto, PeriodoMensual, Presupuesto, ProductoId,
  RegistroAcceso, Rol, SugerenciaProducto, Usuario,
} from '@labia/compartido';
import type { CodigoAlternativa, TipoPropuesta } from '@labia/compartido';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import {
  crearBloque, crearElemento, crearError, crearTabla, nuevaClaveIdempotencia, vaciarNodo,
} from '../dinero/estados';
import {
  formatearDinero, formatearFecha, formatearFechaHora, formatearPeriodo, formatearPorcentaje,
  periodoActual, periodoAnterior, periodoSiguiente,
} from '../dinero/formato';
import './vista.css';

// ---------------------------------------------------------------------------
// Utilidades locales
// ---------------------------------------------------------------------------

/**
 * Etiqueta legible del documento de una apertura.
 *
 * ⛔ Un `switch` exhaustivo, no un ternario: cuando `TipoPropuesta` sume un
 *    tipo, esto deja de compilar en vez de etiquetarlo mal en silencio. Así
 *    pasó al sumarse las fichas, que se mostraban como "Presentación".
 */
function etiquetaDocumento(tipo: TipoPropuesta): string {
  switch (tipo) {
    case 'cotizacion': return 'Cotización';
    case 'presentacion': return 'Presentación';
    case 'ficha': return 'Ficha';
  }
}

function buscarMonto(totales: readonly Dinero[], moneda: Moneda): number {
  return totales.find((d) => d.moneda === moneda)?.monto ?? 0;
}

function monedasDe(grupos: ReadonlyArray<readonly Dinero[]>): Moneda[] {
  const monedas = new Set<Moneda>();
  for (const grupo of grupos) for (const d of grupo) monedas.add(d.moneda);
  return [...monedas];
}

interface GrupoCifra {
  readonly etiqueta: string;
  readonly valores: readonly Dinero[];
}

function renderizarCifrasPorMoneda(contenedor: HTMLElement, grupos: ReadonlyArray<GrupoCifra>): void {
  const monedas = monedasDe(grupos.map((g) => g.valores));
  if (monedas.length === 0) monedas.push('PYG');
  for (const moneda of monedas) {
    const bloqueMoneda = crearElemento('section', 'admin-moneda');
    bloqueMoneda.appendChild(crearElemento('h3', 'admin-moneda-titulo', moneda === 'PYG' ? 'Guaraníes' : 'Dólares'));
    const rejilla = crearElemento('div', 'rejilla admin-cifras');
    for (const grupo of grupos) {
      const tarjeta = crearElemento('div', 'tarjeta cifra');
      tarjeta.appendChild(crearElemento('p', 'cifra-etiqueta', grupo.etiqueta));
      tarjeta.appendChild(crearElemento('p', 'cifra-valor', formatearDinero({ monto: buscarMonto(grupo.valores, moneda), moneda })));
      rejilla.appendChild(tarjeta);
    }
    bloqueMoneda.appendChild(rejilla);
    contenedor.appendChild(bloqueMoneda);
  }
}

function campoTexto(etiqueta: string, id: string, opciones?: { readonly tipo?: string; readonly valor?: string; readonly requerido?: boolean }): { readonly campo: HTMLElement; readonly entrada: HTMLInputElement } {
  const campo = crearElemento('div', 'campo');
  const label = crearElemento('label', undefined, etiqueta);
  label.setAttribute('for', id);
  const entrada = document.createElement('input');
  entrada.id = id;
  entrada.className = 'entrada';
  entrada.type = opciones?.tipo ?? 'text';
  if (opciones?.valor !== undefined) entrada.value = opciones.valor;
  if (opciones?.requerido) entrada.required = true;
  campo.appendChild(label);
  campo.appendChild(entrada);
  return { campo, entrada };
}

function campoSelect(etiqueta: string, id: string, opciones: ReadonlyArray<{ readonly valor: string; readonly texto: string }>): { readonly campo: HTMLElement; readonly select: HTMLSelectElement } {
  const campo = crearElemento('div', 'campo');
  const label = crearElemento('label', undefined, etiqueta);
  label.setAttribute('for', id);
  const select = document.createElement('select');
  select.id = id;
  select.className = 'entrada';
  for (const opcion of opciones) {
    const option = document.createElement('option');
    option.value = opcion.valor;
    option.textContent = opcion.texto;
    select.appendChild(option);
  }
  campo.appendChild(label);
  campo.appendChild(select);
  return { campo, select };
}

function campoTextarea(etiqueta: string, id: string, requerido = true): { readonly campo: HTMLElement; readonly area: HTMLTextAreaElement } {
  const campo = crearElemento('div', 'campo');
  const label = crearElemento('label', undefined, etiqueta);
  label.setAttribute('for', id);
  const area = document.createElement('textarea');
  area.id = id;
  area.className = 'entrada';
  area.rows = 3;
  area.required = requerido;
  campo.appendChild(label);
  campo.appendChild(area);
  return { campo, area };
}

function crearAviso(): HTMLElement {
  const aviso = crearElemento('p', 'aviso');
  aviso.setAttribute('role', 'status');
  aviso.hidden = true;
  return aviso;
}

function mostrarAviso(aviso: HTMLElement, texto: string): void {
  aviso.hidden = false;
  aviso.textContent = texto;
}

// ---------------------------------------------------------------------------
// Sección: Control financiero
// ---------------------------------------------------------------------------

function renderControlFinanciero(panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(panel);
  const bloque = crearBloque<ControlFinanciero>(ctx.senal, {
    contenedor: panel,
    cargar: () => ctx.datos.controlFinanciero(periodo),
    esVacio: (c) => c.vendido.length === 0 && c.mensualidadesActivas === 0 && c.cotizacionesEnRevision === 0,
    mensajeVacio: 'Todavía no hay actividad comercial registrada en este período.',
    filasEsqueleto: 4,
    renderizar: (c, contenedor) => {
      renderizarCifrasPorMoneda(contenedor, [
        { etiqueta: 'Vendido', valores: c.vendido },
        { etiqueta: 'Cobrado', valores: c.cobrado },
        { etiqueta: 'Por cobrar', valores: c.porCobrar },
        { etiqueta: 'Parte de Lab.IA', valores: c.parteLabIA },
        { etiqueta: 'Parte de los vendedores', valores: c.parteVendedores },
        { etiqueta: 'Comisión pendiente', valores: c.comisionPendiente },
        { etiqueta: 'Comisión pagada', valores: c.comisionPagada },
      ]);
      const rejillaContadores = crearElemento('div', 'rejilla admin-contadores');
      const contador = (etiqueta: string, valor: number) => {
        const tarjeta = crearElemento('div', 'tarjeta cifra');
        tarjeta.appendChild(crearElemento('p', 'cifra-etiqueta', etiqueta));
        tarjeta.appendChild(crearElemento('p', 'cifra-valor', String(valor)));
        rejillaContadores.appendChild(tarjeta);
      };
      contador('Mensualidades activas', c.mensualidadesActivas);
      contador('Bajas del período', c.bajasDelPeriodo);
      contador('Cotizaciones en revisión', c.cotizacionesEnRevision);
      contador('Sugerencias sin responder', c.sugerenciasSinResponder);
      contenedor.appendChild(rejillaContadores);
    },
  });
  bloque.cargar();
}

// ---------------------------------------------------------------------------
// Sección: Presupuesto de ventas
// ---------------------------------------------------------------------------

function renderPresupuesto(panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(panel);
  const contenedorTabla = crearElemento('div');
  const contenedorFormulario = crearElemento('div', 'admin-formulario');
  panel.appendChild(contenedorTabla);
  panel.appendChild(contenedorFormulario);

  const bloque = crearBloque<readonly Presupuesto[]>(ctx.senal, {
    contenedor: contenedorTabla,
    cargar: () => ctx.datos.listarPresupuestos(periodo),
    esVacio: (items) => items.length === 0,
    mensajeVacio: 'Todavía no se definió presupuesto para este período.',
    renderizar: (items, contenedor) => {
      contenedor.appendChild(crearTabla(
        ['Vendedor', 'Meta vendido', 'Meta cobrado', 'Definido por', 'Versión'],
        items.map((p) => [
          p.nombreVendedor,
          formatearDinero(p.metaVendido),
          p.metaCobrado ? formatearDinero(p.metaCobrado) : 'Sin meta de cobro',
          formatearFecha(p.definidoEn),
          String(p.version),
        ]),
      ));
    },
  });
  bloque.cargar();

  renderFormularioPresupuesto(contenedorFormulario, ctx, periodo, () => bloque.cargar());
}

function renderFormularioPresupuesto(contenedor: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual, alGuardar: () => void): void {
  vaciarNodo(contenedor);
  contenedor.appendChild(crearElemento('h3', undefined, 'Definir presupuesto'));
  const selectVendedor = crearElemento('div', 'campo');
  const labelVendedor = crearElemento('label', undefined, 'Vendedor');
  labelVendedor.setAttribute('for', 'presupuesto-vendedor');
  const select = document.createElement('select');
  select.id = 'presupuesto-vendedor';
  select.className = 'entrada';
  selectVendedor.appendChild(labelVendedor);
  selectVendedor.appendChild(select);
  contenedor.appendChild(selectVendedor);

  const { campo: campoMeta, entrada: entradaMeta } = campoTexto('Meta vendido (Gs.)', 'presupuesto-meta-vendido', { tipo: 'number', requerido: true });
  const { campo: campoMetaCobrado, entrada: entradaMetaCobrado } = campoTexto('Meta cobrado (Gs., opcional)', 'presupuesto-meta-cobrado', { tipo: 'number' });
  contenedor.appendChild(campoMeta);
  contenedor.appendChild(campoMetaCobrado);

  const aviso = crearAviso();
  contenedor.appendChild(aviso);

  const boton = crearElemento('button', 'btn', 'Guardar presupuesto');
  boton.type = 'button';
  contenedor.appendChild(boton);

  void (async () => {
    const vendedores = await ctx.datos.listarVendedores({ rol: 'vendedor', activo: true }, { limite: 100 });
    if (ctx.senal.aborted) return;
    if (!vendedores.ok) {
      mostrarAviso(aviso, vendedores.error.mensajeAmable);
      boton.disabled = true;
      return;
    }
    for (const v of vendedores.datos.items) {
      const option = document.createElement('option');
      option.value = v.id;
      option.textContent = v.nombre;
      select.appendChild(option);
    }
  })();

  boton.addEventListener('click', () => {
    void (async () => {
      const metaVendido = Number(entradaMeta.value);
      if (!select.value || !Number.isFinite(metaVendido) || metaVendido <= 0) {
        mostrarAviso(aviso, 'Elegí un vendedor y escribí una meta vendida mayor que cero.');
        return;
      }
      const metaCobradoTexto = entradaMetaCobrado.value.trim();
      boton.disabled = true;
      const resultado = await ctx.datos.definirPresupuesto({
        vendedorId: select.value,
        periodo,
        metaVendido: { monto: metaVendido, moneda: 'PYG' },
        ...(metaCobradoTexto ? { metaCobrado: { monto: Number(metaCobradoTexto), moneda: 'PYG' as const } } : {}),
      }, nuevaClaveIdempotencia());
      if (ctx.senal.aborted) return;
      boton.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      mostrarAviso(aviso, `Presupuesto guardado para ${resultado.datos.nombreVendedor}.`);
      alGuardar();
    })();
  });
}

// ---------------------------------------------------------------------------
// Sección: Vendido, cobrado y por cobrar
// ---------------------------------------------------------------------------

function renderVendidoCobradoPorCobrar(panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(panel);
  const seccionLineas = crearElemento('section', 'admin-subseccion');
  seccionLineas.appendChild(crearElemento('h3', undefined, 'Operaciones cobradas del período'));
  const contenedorLineas = crearElemento('div');
  seccionLineas.appendChild(contenedorLineas);
  panel.appendChild(seccionLineas);

  const seccionPorCobrar = crearElemento('section', 'admin-subseccion');
  seccionPorCobrar.appendChild(crearElemento('h3', undefined, 'Por cobrar, con antigüedad'));
  const contenedorPorCobrar = crearElemento('div');
  seccionPorCobrar.appendChild(contenedorPorCobrar);
  panel.appendChild(seccionPorCobrar);

  const bloqueLineas = crearBloque<{ readonly items: readonly LineaParticipacion[] }>(ctx.senal, {
    contenedor: contenedorLineas,
    cargar: () => ctx.datos.listarParticipacionesTodas(periodo, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay operaciones cobradas en este período.',
    renderizar: (p, contenedor) => {
      contenedor.appendChild(crearTabla(
        ['Cliente', 'Producto', 'Vendedor', 'Origen', 'Base cobrada', 'Estado'],
        p.items.map((l) => [
          l.nombreCliente, l.productoId, l.vendedorId,
          l.origen === 'setup' ? 'Setup' : l.origen === 'mensualidad' ? 'Mensualidad' : l.origen,
          formatearDinero(l.baseCobrada),
          l.estado === 'devengada' ? 'Comisión pendiente' : l.estado === 'liquidada' ? 'Comisión pagada' : l.estado,
        ]),
      ));
    },
  });
  bloqueLineas.cargar();

  const bloquePorCobrar = crearBloque<{ readonly items: readonly LineaPorCobrar[] }>(ctx.senal, {
    contenedor: contenedorPorCobrar,
    cargar: () => ctx.datos.porCobrar(null, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay ventas pendientes de cobro.',
    renderizar: (p, contenedor) => {
      contenedor.appendChild(crearTabla(
        ['Cliente', 'Producto', 'Vendedor', 'Importe', 'Vence', 'Antigüedad', 'Estado'],
        p.items.map((l) => [
          l.nombreCliente, l.productoId, l.nombreVendedor, formatearDinero(l.importe),
          l.venceEn ? formatearFecha(l.venceEn) : 'Sin vencimiento',
          `${l.diasDeAntiguedad} días`,
          l.estado === 'atrasado' ? 'Atrasado' : l.estado === 'pendiente' ? 'Pendiente' : l.estado,
        ]),
      ));
    },
  });
  bloquePorCobrar.cargar();
}

// ---------------------------------------------------------------------------
// Sección: Comisiones
// ---------------------------------------------------------------------------

function renderComisiones(panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(panel);

  const seccionResumen = crearElemento('section', 'admin-subseccion');
  seccionResumen.appendChild(crearElemento('h3', undefined, 'Devengado, pendiente y pagado'));
  const contenedorResumen = crearElemento('div');
  seccionResumen.appendChild(contenedorResumen);
  panel.appendChild(seccionResumen);

  const bloqueResumen = crearBloque<{ readonly items: readonly LineaParticipacion[] }>(ctx.senal, {
    contenedor: contenedorResumen,
    cargar: () => ctx.datos.listarParticipacionesTodas(periodo, { limite: 200 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay comisiones devengadas en este período.',
    renderizar: (p, contenedor) => {
      const devengado = p.items.map((l) => l.parteVendedor);
      const pendiente = p.items.filter((l) => l.estado === 'devengada').map((l) => l.parteVendedor);
      const pagado = p.items.filter((l) => l.estado === 'liquidada').map((l) => l.parteVendedor);
      renderizarCifrasPorMoneda(contenedor, [
        { etiqueta: 'Devengado', valores: devengado },
        { etiqueta: 'Pendiente', valores: pendiente },
        { etiqueta: 'Pagado', valores: pagado },
      ]);
    },
  });
  bloqueResumen.cargar();

  const seccionCierre = crearElemento('section', 'admin-subseccion');
  seccionCierre.appendChild(crearElemento('h3', undefined, 'Cierre de período'));
  const contenedorCierre = crearElemento('div');
  seccionCierre.appendChild(contenedorCierre);
  panel.appendChild(seccionCierre);
  renderCierrePeriodo(contenedorCierre, ctx, periodo);

  const seccionAjuste = crearElemento('section', 'admin-subseccion');
  seccionAjuste.appendChild(crearElemento('h3', undefined, 'Crear ajuste'));
  seccionAjuste.appendChild(crearElemento('p', 'admin-ayuda', 'Un ajuste corrige un período ya cerrado sin reabrirlo. Va con motivo obligatorio.'));
  panel.appendChild(seccionAjuste);
  renderFormularioAjuste(seccionAjuste, ctx, periodo);

  const seccionObservacion = crearElemento('section', 'admin-subseccion');
  seccionObservacion.appendChild(crearElemento('h3', undefined, 'Resolver una observación'));
  seccionObservacion.appendChild(crearElemento(
    'p', 'admin-ayuda',
    'El vendedor abre la observación desde Dinero y esta vista todavía no lista las abiertas por id (ver docs/PEDIDOS.md, pedido S6 2026-09-17). Mientras tanto, se resuelve con el id de la observación.',
  ));
  panel.appendChild(seccionObservacion);
  renderFormularioObservacion(seccionObservacion, ctx);
}

function renderCierrePeriodo(contenedor: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(contenedor);
  const bloque = crearBloque(ctx.senal, {
    contenedor,
    cargar: () => ctx.datos.verificarCierrePeriodo(periodo),
    esVacio: () => false,
    mensajeVacio: '',
    renderizar: (v, cont) => {
      if (v.puedeCerrar) {
        cont.appendChild(crearElemento('p', undefined, `El período ${formatearPeriodo(periodo)} no tiene bloqueos: se puede cerrar.`));
        const boton = crearElemento('button', 'btn', `Cerrar ${formatearPeriodo(periodo)}`);
        boton.type = 'button';
        boton.addEventListener('click', () => abrirDialogoCierre(ctx, periodo, () => renderCierrePeriodo(contenedor, ctx, periodo)));
        cont.appendChild(boton);
        return;
      }
      cont.appendChild(crearElemento('p', undefined, `El período ${formatearPeriodo(periodo)} tiene pendientes: no se puede cerrar todavía.`));
      const lista = crearElemento('ul', 'admin-lista-bloqueos');
      for (const b of v.bloqueos) {
        lista.appendChild(crearElemento('li', undefined, `${b.detalle} (${b.cantidad})`));
      }
      cont.appendChild(lista);
    },
  });
  bloque.cargar();
}

function abrirDialogoCierre(ctx: ContextoVista, periodo: PeriodoMensual, alCerrar: () => void): void {
  const dialogo = crearElemento('dialog', 'dialogo');
  dialogo.appendChild(crearElemento('h2', undefined, `Cerrar el período ${formatearPeriodo(periodo)}`));
  dialogo.appendChild(crearElemento('p', undefined, 'Esta acción es irreversible: un período cerrado no se puede reabrir. Toda corrección posterior es un ajuste en el período siguiente.'));
  const confirmacion = crearElemento('div', 'campo');
  const label = crearElemento('label', undefined, `Escribí "cerrar" para confirmar`);
  const idEntrada = 'confirmar-cierre';
  label.setAttribute('for', idEntrada);
  const entrada = document.createElement('input');
  entrada.id = idEntrada;
  entrada.className = 'entrada';
  confirmacion.appendChild(label);
  confirmacion.appendChild(entrada);
  dialogo.appendChild(confirmacion);
  const aviso = crearAviso();
  dialogo.appendChild(aviso);
  const acciones = crearElemento('div', 'admin-dialogo-acciones');
  const cancelar = crearElemento('button', 'btn-borde', 'Cancelar');
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close());
  const confirmar = crearElemento('button', 'btn', 'Cerrar período');
  confirmar.type = 'button';
  confirmar.addEventListener('click', () => {
    void (async () => {
      if (entrada.value.trim().toLowerCase() !== 'cerrar') {
        mostrarAviso(aviso, 'Escribí exactamente "cerrar" para confirmar.');
        return;
      }
      confirmar.disabled = true;
      const resultado = await ctx.datos.cerrarPeriodo(periodo, nuevaClaveIdempotencia());
      if (ctx.senal.aborted) return;
      confirmar.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      dialogo.close();
      alCerrar();
    })();
  });
  acciones.appendChild(cancelar);
  acciones.appendChild(confirmar);
  dialogo.appendChild(acciones);
  dialogo.addEventListener('close', () => dialogo.remove());
  document.body.appendChild(dialogo);
  dialogo.showModal();
  entrada.focus();
}

function renderFormularioAjuste(contenedor: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  const { campo: campoVendedor, entrada: entradaVendedor } = campoTexto('Id del vendedor', 'ajuste-vendedor', { requerido: true });
  const { campo: campoImporte, entrada: entradaImporte } = campoTexto('Importe (con signo, Gs.)', 'ajuste-importe', { tipo: 'number', requerido: true });
  const { campo: campoMotivo, area: areaMotivo } = campoTextarea('Motivo', 'ajuste-motivo');
  contenedor.appendChild(campoVendedor);
  contenedor.appendChild(campoImporte);
  contenedor.appendChild(campoMotivo);
  const aviso = crearAviso();
  contenedor.appendChild(aviso);
  const boton = crearElemento('button', 'btn', 'Crear ajuste');
  boton.type = 'button';
  boton.addEventListener('click', () => {
    void (async () => {
      const importe = Number(entradaImporte.value);
      if (!entradaVendedor.value.trim() || !Number.isFinite(importe) || !areaMotivo.value.trim()) {
        mostrarAviso(aviso, 'Completá vendedor, importe y motivo.');
        return;
      }
      boton.disabled = true;
      const resultado = await ctx.datos.crearAjuste({
        periodoAplicacion: periodo, vendedorId: entradaVendedor.value.trim(),
        importe: { monto: importe, moneda: 'PYG' }, motivo: areaMotivo.value.trim(),
      }, nuevaClaveIdempotencia());
      if (ctx.senal.aborted) return;
      boton.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      mostrarAviso(aviso, 'Ajuste creado.');
      entradaVendedor.value = '';
      entradaImporte.value = '';
      areaMotivo.value = '';
    })();
  });
  contenedor.appendChild(boton);
}

const ESTADOS_OBSERVACION: ReadonlyArray<{ readonly valor: EstadoObservacion; readonly texto: string }> = [
  { valor: 'procede', texto: 'Procede' },
  { valor: 'no_procede', texto: 'No procede' },
  { valor: 'parcial', texto: 'Procede parcialmente' },
];

function renderFormularioObservacion(contenedor: HTMLElement, ctx: ContextoVista): void {
  const { campo: campoId, entrada: entradaId } = campoTexto('Id de la observación', 'observacion-id', { requerido: true });
  const { campo: campoEstado, select } = campoSelect('Resolución', 'observacion-estado', ESTADOS_OBSERVACION.map((e) => ({ valor: e.valor, texto: e.texto })));
  const { campo: campoComentario, area } = campoTextarea('Comentario', 'observacion-comentario');
  contenedor.appendChild(campoId);
  contenedor.appendChild(campoEstado);
  contenedor.appendChild(campoComentario);
  const aviso = crearAviso();
  contenedor.appendChild(aviso);
  const boton = crearElemento('button', 'btn', 'Resolver observación');
  boton.type = 'button';
  boton.addEventListener('click', () => {
    void (async () => {
      if (!entradaId.value.trim() || !area.value.trim()) {
        mostrarAviso(aviso, 'Completá el id de la observación y el comentario.');
        return;
      }
      boton.disabled = true;
      const resultado = await ctx.datos.resolverObservacion(entradaId.value.trim(), select.value as EstadoObservacion, area.value.trim());
      if (ctx.senal.aborted) return;
      boton.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      mostrarAviso(aviso, 'Observación resuelta.');
      entradaId.value = '';
      area.value = '';
    })();
  });
  contenedor.appendChild(boton);
}

// ---------------------------------------------------------------------------
// Sección: Ranking
// ---------------------------------------------------------------------------

function renderRanking(panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(panel);
  const bloque = crearBloque<readonly FilaRanking[]>(ctx.senal, {
    contenedor: panel,
    cargar: () => ctx.datos.rankingVendedores(periodo),
    esVacio: (items) => items.every((f) => f.vendido.monto === 0),
    mensajeVacio: 'Todavía no hay ventas para armar el ranking de este período.',
    renderizar: (items, contenedor) => {
      const lista = crearElemento('ol', 'ranking');
      for (const fila of items) {
        const li = crearElemento('li', 'ranking-fila');
        li.appendChild(crearElemento('span', 'ranking-posicion', `${fila.posicion}.º`));
        li.appendChild(crearElemento('span', 'ranking-nombre', fila.nombreVendedor));
        li.appendChild(crearElemento('span', 'ranking-monto', formatearDinero(fila.vendido)));
        if (fila.metaVendido) {
          li.appendChild(crearElemento(
            'span', 'ranking-meta',
            `Meta: ${formatearDinero(fila.metaVendido)}${fila.cumplimientoPorcentaje !== null ? ` · ${formatearPorcentaje(fila.cumplimientoPorcentaje)} cumplido` : ''}`,
          ));
        }
        lista.appendChild(li);
      }
      contenedor.appendChild(lista);
    },
  });
  bloque.cargar();
}

// ---------------------------------------------------------------------------
// Sección: Accesos y frecuencia de uso
// ---------------------------------------------------------------------------

function renderAccesosYUso(panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual): void {
  vaciarNodo(panel);

  const seccionUso = crearElemento('section', 'admin-subseccion');
  seccionUso.appendChild(crearElemento('h3', undefined, 'Frecuencia de uso por vendedor'));
  const contenedorUso = crearElemento('div');
  seccionUso.appendChild(contenedorUso);
  panel.appendChild(seccionUso);

  const bloqueUso = crearBloque(ctx.senal, {
    contenedor: contenedorUso,
    cargar: () => ctx.datos.usoPorVendedor(periodo),
    esVacio: (items) => items.length === 0,
    mensajeVacio: 'No hay vendedores para mostrar.',
    renderizar: (items, contenedor) => {
      contenedor.appendChild(crearTabla(
        ['Vendedor', 'Último ingreso', 'Ingresos en el período', 'Días sin entrar', 'Planes creados', 'Seguimientos', 'Cotizaciones enviadas', 'Estado'],
        items.map((u) => [
          u.nombreVendedor,
          u.ultimoIngresoEn ? formatearFechaHora(u.ultimoIngresoEn) : 'Nunca ingresó',
          String(u.ingresosEnPeriodo), u.diasSinEntrar === null ? '—' : String(u.diasSinEntrar),
          String(u.planesCreados), String(u.seguimientosRegistrados), String(u.cotizacionesEnviadas),
          u.marcadoInactivo ? 'Inactivo' : 'Activo',
        ]),
      ));
    },
  });
  bloqueUso.cargar();

  const seccionRegistro = crearElemento('section', 'admin-subseccion');
  seccionRegistro.appendChild(crearElemento('h3', undefined, 'Registro de accesos al sistema'));
  seccionRegistro.appendChild(crearElemento('p', 'admin-ayuda', 'Sólo lectura: quién entró, cuándo y qué acción registró. No se edita ni se borra.'));
  const contenedorRegistro = crearElemento('div');
  seccionRegistro.appendChild(contenedorRegistro);
  panel.appendChild(seccionRegistro);

  const bloqueRegistro = crearBloque<{ readonly items: readonly RegistroAcceso[] }>(ctx.senal, {
    contenedor: contenedorRegistro,
    cargar: () => ctx.datos.listarRegistroAcceso({}, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'Todavía no hay registro de accesos.',
    renderizar: (p, contenedor) => {
      contenedor.appendChild(crearTabla(
        ['Cuándo', 'Quién', 'Rol', 'Acción'],
        p.items.map((r) => [formatearFechaHora(r.ocurridoEn), r.nombreActor, r.rol === 'administrador' ? 'Administrador' : 'Vendedor', r.accion]),
      ));
    },
  });
  bloqueRegistro.cargar();

  const seccionAperturas = crearElemento('section', 'admin-subseccion');
  seccionAperturas.appendChild(crearElemento('h3', undefined, 'Aperturas de enlaces compartidos'));
  seccionAperturas.appendChild(crearElemento('p', 'admin-ayuda', 'Cuándo abrió el cliente lo que se le mandó. Es un registro distinto del uso del sistema: nunca se mezclan.'));
  const contenedorAperturas = crearElemento('div');
  seccionAperturas.appendChild(contenedorAperturas);
  panel.appendChild(seccionAperturas);

  const bloqueAperturas = crearBloque<{ readonly items: readonly AccesoEnlace[] }>(ctx.senal, {
    contenedor: contenedorAperturas,
    cargar: () => ctx.datos.listarAperturasEnlace({}, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'Todavía no se abrió ningún enlace compartido.',
    renderizar: (p, contenedor) => {
      contenedor.appendChild(crearTabla(
        ['Cuándo', 'Documento', 'Dispositivo', 'País aproximado', 'Resultado'],
        p.items.map((a) => [
          formatearFechaHora(a.ocurridoEn), etiquetaDocumento(a.tipoDocumento),
          a.tipoDispositivo, a.paisAproximado ?? 'Sin datos', a.resultado,
        ]),
      ));
    },
  });
  bloqueAperturas.cargar();
}

// ---------------------------------------------------------------------------
// Sección: Todos los clientes
// ---------------------------------------------------------------------------

function renderTodosLosClientes(panel: HTMLElement, ctx: ContextoVista): void {
  vaciarNodo(panel);
  const bloque = crearBloque<{ readonly items: readonly Cliente[] }>(ctx.senal, {
    contenedor: panel,
    cargar: () => ctx.datos.listarTodosLosClientes({}, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'Todavía no hay clientes registrados en ninguna cartera.',
    renderizar: (p, contenedor) => {
      const filas = p.items.map((c) => {
        const boton = crearElemento('button', 'btn-texto', 'Ver historial');
        boton.type = 'button';
        boton.addEventListener('click', () => abrirDialogoHistorial(c, ctx));
        return [
          c.nombre, c.tipo === 'empresa' ? 'Empresa' : 'Profesional', c.vendedorId, c.etapa,
          c.ciudad ?? 'Sin ciudad', c.ultimaInteraccionEn ? formatearFecha(c.ultimaInteraccionEn) : 'Sin interacciones',
          boton,
        ];
      });
      contenedor.appendChild(crearTabla(['Cliente', 'Tipo', 'Vendedor', 'Etapa', 'Ciudad', 'Última interacción', ''], filas));
    },
  });
  bloque.cargar();
}

function abrirDialogoHistorial(cliente: Cliente, ctx: ContextoVista): void {
  const dialogo = crearElemento('dialog', 'dialogo');
  dialogo.appendChild(crearElemento('h2', undefined, `Historial de ${cliente.nombre}`));
  const contenedor = crearElemento('div');
  dialogo.appendChild(contenedor);
  const cerrar = crearElemento('button', 'btn-borde', 'Cerrar');
  cerrar.type = 'button';
  cerrar.addEventListener('click', () => dialogo.close());
  dialogo.appendChild(cerrar);
  dialogo.addEventListener('close', () => dialogo.remove());
  document.body.appendChild(dialogo);
  dialogo.showModal();

  const bloque = crearBloque(ctx.senal, {
    contenedor,
    cargar: () => ctx.datos.lineaDeTiempoDeCualquierCliente(cliente.id, { limite: 30 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'Este cliente todavía no tiene eventos registrados.',
    renderizar: (p, cont) => {
      const lista = crearElemento('ul', 'admin-linea-tiempo');
      for (const evento of p.items) {
        const li = crearElemento('li');
        li.appendChild(crearElemento('span', 'admin-linea-tiempo-fecha', formatearFechaHora(evento.ocurridoEn)));
        li.appendChild(crearElemento('span', undefined, evento.titulo));
        lista.appendChild(li);
      }
      cont.appendChild(lista);
    },
  });
  bloque.cargar();
}

// ---------------------------------------------------------------------------
// Sección: Aprobación de cotizaciones
// ---------------------------------------------------------------------------

function renderAprobacionCotizaciones(panel: HTMLElement, ctx: ContextoVista): void {
  vaciarNodo(panel);

  const seccionCola = crearElemento('section', 'admin-subseccion');
  seccionCola.appendChild(crearElemento('h3', undefined, 'Cola de revisión'));
  const contenedorCola = crearElemento('div');
  seccionCola.appendChild(contenedorCola);
  panel.appendChild(seccionCola);

  const bloqueCola = crearBloque<{ readonly items: readonly CotizacionDetalle[] }>(ctx.senal, {
    contenedor: contenedorCola,
    cargar: () => ctx.datos.colaDeRevision({ ordenarPor: 'antiguedad' }, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay cotizaciones esperando aprobación.',
    filasEsqueleto: 2,
    renderizar: (p, contenedor) => {
      for (const cotizacion of p.items) contenedor.appendChild(crearTarjetaCotizacion(cotizacion, ctx, () => renderAprobacionCotizaciones(panel, ctx)));
    },
  });
  bloqueCola.cargar();

  const seccionConstancias = crearElemento('section', 'admin-subseccion');
  seccionConstancias.appendChild(crearElemento('h3', undefined, 'Constancias y avisos'));
  const contenedorConstancias = crearElemento('div');
  seccionConstancias.appendChild(contenedorConstancias);
  panel.appendChild(seccionConstancias);

  const bloqueConstancias = crearBloque<{ readonly items: readonly ConstanciaRespuesta[] }>(ctx.senal, {
    contenedor: contenedorConstancias,
    cargar: () => ctx.datos.listarConstancias({ limite: 30 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'Todavía no hay constancias de clientes que respondieron.',
    renderizar: (p, contenedor) => {
      contenedor.appendChild(crearElemento(
        'p', 'admin-ayuda',
        'Es una constancia comercial o aval de intención, nunca un contrato ni una firma electrónica legal.',
      ));
      const filas = p.items.map((c) => {
        const boton = crearElemento('button', 'btn-texto', 'Reintentar avisos');
        boton.type = 'button';
        boton.addEventListener('click', () => {
          void (async () => {
            boton.disabled = true;
            const resultado = await ctx.datos.reintentarNotificaciones(c.id);
            if (ctx.senal.aborted) return;
            boton.disabled = false;
            boton.textContent = resultado.ok ? `Avisos pendientes: ${resultado.datos.avisosPendientes}` : resultado.error.mensajeAmable;
          })();
        });
        return [c.nombreCliente, c.folio, `v${c.versionCotizacion}`, formatearFechaHora(c.respondidaEn), boton];
      });
      contenedor.appendChild(crearTabla(['Cliente', 'Folio', 'Versión', 'Respondida', ''], filas));
    },
  });
  bloqueConstancias.cargar();
}

const ETIQUETA_ALTERNATIVA: Readonly<Record<string, string>> = {
  estandar: 'Plan estándar', adelantado_12: 'Adelantado 12 meses', adelantado_24: 'Adelantado 24 meses', diferido: 'Cheques diferidos o débito',
};

function crearTarjetaCotizacion(cotizacion: CotizacionDetalle, ctx: ContextoVista, alResolver: () => void): HTMLElement {
  const detalles = document.createElement('details');
  detalles.className = 'tarjeta admin-cotizacion';
  const resumen = document.createElement('summary');
  resumen.textContent = `${cotizacion.folio} — ${cotizacion.destinatario.nombreEmpresaOProfesional} — ${cotizacion.objeto.nombreProducto}${cotizacion.objeto.variante ? ` (${cotizacion.objeto.variante})` : ''}`;
  detalles.appendChild(resumen);

  detalles.appendChild(crearElemento('p', undefined, `Vendedor: ${cotizacion.nombreVendedor} · Emitida: ${formatearFecha(cotizacion.fechaEmision)} · Válida hasta: ${formatearFecha(cotizacion.fechaValidez)}`));
  detalles.appendChild(crearElemento('p', undefined, `Permanencia mínima: ${cotizacion.condiciones.permanenciaMinimaMeses} meses`));

  const firmaVendedorVigente = cotizacion.firmas.some((f) => f.rol === 'vendedor' && !f.anulada && f.versionFirmada === cotizacion.version);
  detalles.appendChild(crearElemento('p', undefined, `Firma del vendedor: ${firmaVendedorVigente ? 'presente y vigente' : 'falta o no está vigente'}`));

  const precios = crearElemento('div', 'admin-precios');
  precios.appendChild(crearElemento('p', undefined, `Setup: lista ${formatearDinero(cotizacion.precios.setupLista)} · especial ${formatearDinero(cotizacion.precios.setupEspecial)} (ahorro ${formatearDinero(cotizacion.precios.ahorroSetup)}, ${formatearPorcentaje(cotizacion.precios.ahorroSetupPorcentaje)})`));
  precios.appendChild(crearElemento('p', undefined, `Mensualidad: lista ${formatearDinero(cotizacion.precios.mensualLista)} · especial ${formatearDinero(cotizacion.precios.mensualEspecial)} (ahorro ${formatearDinero(cotizacion.precios.ahorroMensual)}, ${formatearPorcentaje(cotizacion.precios.ahorroMensualPorcentaje)})`));
  detalles.appendChild(precios);

  const aportes = crearElemento('div');
  aportes.appendChild(crearElemento('p', undefined, 'Aportes del cliente:'));
  const listaAportes = crearElemento('ul');
  for (const a of cotizacion.condiciones.instalacion.aportesDelCliente) {
    listaAportes.appendChild(crearElemento('li', undefined, `${a.descripcion}${a.bloqueante ? ' (bloqueante)' : ''}`));
  }
  aportes.appendChild(listaAportes);
  detalles.appendChild(aportes);

  detalles.appendChild(crearElemento('p', undefined, `Qué incluye: ${cotizacion.condiciones.alcance.queIncluye.join('; ')}`));
  detalles.appendChild(crearElemento('p', undefined, `Qué NO incluye: ${cotizacion.condiciones.alcance.queNoIncluye.join('; ')}`));

  const contenedorRecalculo = crearElemento('div', 'admin-recalculo');
  detalles.appendChild(contenedorRecalculo);
  detalles.addEventListener('toggle', () => {
    if (!detalles.open || contenedorRecalculo.childNodes.length > 0) return;
    void (async () => {
      contenedorRecalculo.appendChild(crearElemento('p', undefined, 'Recalculando los cuatro totales en el servidor…'));
      const resultado = await ctx.datos.recalcularCotizacion(cotizacion.id);
      if (ctx.senal.aborted) return;
      vaciarNodo(contenedorRecalculo);
      if (!resultado.ok) {
        contenedorRecalculo.appendChild(crearError(resultado.error.mensajeAmable, () => detalles.dispatchEvent(new Event('toggle'))));
        return;
      }
      contenedorRecalculo.appendChild(crearElemento('p', undefined, 'Totales recalculados por el servidor:'));
      const lista = crearElemento('ul');
      for (const alt of resultado.datos) {
        lista.appendChild(crearElemento('li', undefined, `${alt.nombre}: ${formatearDinero(alt.totalFinal)} (${alt.cantidadCuotas} cuotas de ${formatearDinero(alt.importeCuota)})`));
      }
      contenedorRecalculo.appendChild(lista);
    })();
  });

  const aviso = crearAviso();
  detalles.appendChild(aviso);

  if (cotizacion.estado === 'en_revision') {
    const checks = crearElemento('div', 'admin-alternativas');
    checks.appendChild(crearElemento('p', undefined, 'Alternativas que quedan visibles para el cliente al aprobar (todas si no se desmarca ninguna):'));
    const casillas: HTMLInputElement[] = [];
    for (const codigo of ['estandar', 'adelantado_12', 'adelantado_24', 'diferido'] as const) {
      const contenedorCasilla = crearElemento('label', 'admin-casilla');
      const casilla = document.createElement('input');
      casilla.type = 'checkbox';
      casilla.checked = true;
      casilla.value = codigo;
      casillas.push(casilla);
      contenedorCasilla.appendChild(casilla);
      contenedorCasilla.appendChild(document.createTextNode(ETIQUETA_ALTERNATIVA[codigo] ?? codigo));
      checks.appendChild(contenedorCasilla);
    }
    detalles.appendChild(checks);

    const { campo: campoComentario, area: areaComentario } = campoTextarea('Comentario (obligatorio para aprobar, corregir o rechazar)', `comentario-${cotizacion.id}`);
    detalles.appendChild(campoComentario);

    const acciones = crearElemento('div', 'admin-cotizacion-acciones');
    const accion = (texto: string, clase: string, tipo: 'aprobar' | 'corregir' | 'rechazar') => {
      const boton = crearElemento('button', clase, texto);
      boton.type = 'button';
      boton.addEventListener('click', () => {
        void (async () => {
          const comentario = areaComentario.value.trim();
          if (!comentario) {
            mostrarAviso(aviso, 'Aprobar, corregir o rechazar exige un comentario.');
            return;
          }
          boton.disabled = true;
          const alternativasAprobadas = tipo === 'aprobar' ? casillas.filter((c) => c.checked).map((c) => c.value as CodigoAlternativa) : undefined;
          const resultado = await ctx.datos.revisarCotizacion(cotizacion.id, tipo, comentario, nuevaClaveIdempotencia(), alternativasAprobadas);
          if (ctx.senal.aborted) return;
          boton.disabled = false;
          if (!resultado.ok) {
            mostrarAviso(aviso, resultado.error.mensajeAmable);
            return;
          }
          mostrarAviso(aviso, `Cotización ${tipo === 'aprobar' ? 'aprobada' : tipo === 'corregir' ? 'devuelta a borrador' : 'rechazada'}.`);
          alResolver();
        })();
      });
      return boton;
    };
    acciones.appendChild(accion('Aprobar', 'btn', 'aprobar'));
    acciones.appendChild(accion('Corregir', 'btn-borde', 'corregir'));
    acciones.appendChild(accion('Rechazar', 'btn-borde', 'rechazar'));
    detalles.appendChild(acciones);
  } else if (cotizacion.estado === 'aprobada') {
    const firmaCeoVigente = cotizacion.firmas.some((f) => f.rol === 'ceo' && !f.anulada && f.versionFirmada === cotizacion.version);
    if (firmaCeoVigente) {
      detalles.appendChild(crearElemento('p', undefined, 'Aprobada, con las dos firmas vigentes.'));
    } else {
      const boton = crearElemento('button', 'btn', 'Firmar como CEO');
      boton.type = 'button';
      boton.addEventListener('click', () => {
        void (async () => {
          boton.disabled = true;
          const resultado = await ctx.datos.firmarComoCeo(cotizacion.id, nuevaClaveIdempotencia());
          if (ctx.senal.aborted) return;
          boton.disabled = false;
          if (!resultado.ok) {
            mostrarAviso(aviso, resultado.error.mensajeAmable);
            return;
          }
          mostrarAviso(aviso, 'Firma del CEO incorporada.');
          alResolver();
        })();
      });
      detalles.appendChild(boton);
    }
  }

  return detalles;
}

// ---------------------------------------------------------------------------
// Sección: Configuración comercial
// ---------------------------------------------------------------------------

function renderConfiguracionComercial(panel: HTMLElement, ctx: ContextoVista): void {
  vaciarNodo(panel);

  const seccionParticipacion = crearElemento('section', 'admin-subseccion');
  seccionParticipacion.appendChild(crearElemento('h3', undefined, 'Participación por producto'));
  const contenedorParticipacion = crearElemento('div');
  seccionParticipacion.appendChild(contenedorParticipacion);
  panel.appendChild(seccionParticipacion);
  renderParticipaciones(contenedorParticipacion, ctx);

  const seccionTaxonomia = crearElemento('section', 'admin-subseccion');
  seccionTaxonomia.appendChild(crearElemento('h3', undefined, 'Taxonomía pendiente de revisión'));
  const contenedorTaxonomia = crearElemento('div');
  seccionTaxonomia.appendChild(contenedorTaxonomia);
  panel.appendChild(seccionTaxonomia);
  renderTaxonomiaPendiente(contenedorTaxonomia, ctx);

  const seccionVendedores = crearElemento('section', 'admin-subseccion');
  seccionVendedores.appendChild(crearElemento('h3', undefined, 'Vendedores'));
  const contenedorVendedores = crearElemento('div');
  seccionVendedores.appendChild(contenedorVendedores);
  panel.appendChild(seccionVendedores);
  renderVendedores(contenedorVendedores, ctx);

  const seccionVigencias = crearElemento('section', 'admin-subseccion');
  seccionVigencias.appendChild(crearElemento('h3', undefined, 'Vigencias y parámetros'));
  const contenedorVigencias = crearElemento('div');
  seccionVigencias.appendChild(contenedorVigencias);
  panel.appendChild(seccionVigencias);
  renderParametros(contenedorVigencias, ctx);

  const seccionProveedores = crearElemento('section', 'admin-subseccion');
  seccionProveedores.appendChild(crearElemento('h3', undefined, 'Estado de los proveedores'));
  seccionProveedores.appendChild(crearElemento('p', 'admin-ayuda', 'Sólo lectura: las claves de los proveedores viven en el servidor.'));
  const contenedorProveedores = crearElemento('div');
  seccionProveedores.appendChild(contenedorProveedores);
  panel.appendChild(seccionProveedores);
  renderEstadoProveedores(contenedorProveedores, ctx);
}

function renderParticipaciones(contenedor: HTMLElement, ctx: ContextoVista): void {
  const contenedorTabla = crearElemento('div');
  const contenedorFormulario = crearElemento('div', 'admin-formulario');
  contenedor.appendChild(contenedorTabla);
  contenedor.appendChild(contenedorFormulario);

  const bloque = crearBloque<readonly ParticipacionProducto[]>(ctx.senal, {
    contenedor: contenedorTabla,
    cargar: () => ctx.datos.listarParticipaciones(),
    esVacio: (items) => items.length === 0,
    mensajeVacio: 'No hay participaciones publicadas todavía: rige el 50/50 por defecto en todos los productos.',
    renderizar: (items, cont) => {
      cont.appendChild(crearTabla(
        ['Producto', '% Lab.IA', '% Vendedor', 'Aplica a setup', 'Aplica a mensualidad', 'Meses de participación', 'Versión'],
        items.map((p) => [
          p.productoId, `${p.porcentajeLabIA} %`, `${p.porcentajeVendedor} %`,
          p.aplicaASetup ? 'Sí' : 'No', p.aplicaAMensualidad ? 'Sí' : 'No',
          p.mesesParticipacionVendedor === null ? 'Sin límite' : String(p.mesesParticipacionVendedor),
          String(p.version),
        ]),
      ));
    },
  });
  bloque.cargar();

  contenedorFormulario.appendChild(crearElemento('h4', undefined, 'Publicar una versión nueva'));
  contenedorFormulario.appendChild(crearElemento('p', 'admin-ayuda', 'Publicar no edita la vigente: crea una versión nueva. Lo ya devengado conserva la versión con la que se calculó.'));
  const { campo: campoProducto, entrada: entradaProducto } = campoTexto('Id del producto', 'participacion-producto', { requerido: true });
  const { campo: campoLabIA, entrada: entradaLabIA } = campoTexto('% Lab.IA', 'participacion-labia', { tipo: 'number', valor: '50', requerido: true });
  const { campo: campoVendedor, entrada: entradaVendedor } = campoTexto('% Vendedor', 'participacion-vendedor', { tipo: 'number', valor: '50', requerido: true });
  const { campo: campoMeses, entrada: entradaMeses } = campoTexto('Meses de participación del vendedor (vacío = sin límite)', 'participacion-meses', { tipo: 'number' });
  const { campo: campoVigencia, entrada: entradaVigencia } = campoTexto('Vigente desde', 'participacion-vigencia', { tipo: 'date', requerido: true });
  const { campo: campoMotivo, area: areaMotivo } = campoTextarea('Motivo', 'participacion-motivo');
  const casillaSetup = crearElemento('label', 'admin-casilla');
  const inputSetup = document.createElement('input');
  inputSetup.type = 'checkbox';
  inputSetup.checked = true;
  casillaSetup.appendChild(inputSetup);
  casillaSetup.appendChild(document.createTextNode('Aplica al setup'));
  const casillaMensualidad = crearElemento('label', 'admin-casilla');
  const inputMensualidad = document.createElement('input');
  inputMensualidad.type = 'checkbox';
  inputMensualidad.checked = true;
  casillaMensualidad.appendChild(inputMensualidad);
  casillaMensualidad.appendChild(document.createTextNode('Aplica a la mensualidad'));

  contenedorFormulario.appendChild(campoProducto);
  contenedorFormulario.appendChild(campoLabIA);
  contenedorFormulario.appendChild(campoVendedor);
  contenedorFormulario.appendChild(casillaSetup);
  contenedorFormulario.appendChild(casillaMensualidad);
  contenedorFormulario.appendChild(campoMeses);
  contenedorFormulario.appendChild(campoVigencia);
  contenedorFormulario.appendChild(campoMotivo);
  const aviso = crearAviso();
  contenedorFormulario.appendChild(aviso);
  const boton = crearElemento('button', 'btn', 'Publicar participación');
  boton.type = 'button';
  boton.addEventListener('click', () => {
    void (async () => {
      const labIA = Number(entradaLabIA.value);
      const vendedor = Number(entradaVendedor.value);
      if (!entradaProducto.value.trim() || labIA + vendedor !== 100 || !entradaVigencia.value || !areaMotivo.value.trim()) {
        mostrarAviso(aviso, 'Completá producto, vigencia y motivo; el porcentaje de Lab.IA y el del vendedor tienen que sumar 100.');
        return;
      }
      boton.disabled = true;
      const resultado = await ctx.datos.publicarParticipacion({
        productoId: entradaProducto.value.trim() as ProductoId, porcentajeLabIA: labIA, porcentajeVendedor: vendedor,
        aplicaASetup: inputSetup.checked, aplicaAMensualidad: inputMensualidad.checked,
        mesesParticipacionVendedor: entradaMeses.value.trim() ? Number(entradaMeses.value) : null,
        vigenteDesde: entradaVigencia.value, motivo: areaMotivo.value.trim(),
      }, nuevaClaveIdempotencia());
      if (ctx.senal.aborted) return;
      boton.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      mostrarAviso(aviso, `Nueva versión publicada (v${resultado.datos.version}).`);
      bloque.cargar();
    })();
  });
  contenedorFormulario.appendChild(boton);
}

function renderTaxonomiaPendiente(contenedor: HTMLElement, ctx: ContextoVista): void {
  const bloque = crearBloque<{ readonly items: readonly Actividad[] }>(ctx.senal, {
    contenedor,
    cargar: () => ctx.datos.listarActividadesPendientes({ limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay términos pendientes de revisión.',
    renderizar: (p, cont) => {
      for (const actividad of p.items) {
        const fila = crearElemento('div', 'tarjeta admin-actividad');
        fila.appendChild(crearElemento('p', undefined, `${actividad.nombre}${actividad.sinonimos.length ? ` (${actividad.sinonimos.join(', ')})` : ''}`));
        const acciones = crearElemento('div', 'admin-cotizacion-acciones');
        const confirmar = crearElemento('button', 'btn', 'Confirmar');
        confirmar.type = 'button';
        confirmar.addEventListener('click', () => {
          void (async () => {
            confirmar.disabled = true;
            const resultado = await ctx.datos.confirmarActividad(actividad.id);
            if (ctx.senal.aborted) return;
            if (resultado.ok) renderTaxonomiaPendiente(contenedor, ctx);
            else confirmar.disabled = false;
          })();
        });
        acciones.appendChild(confirmar);
        fila.appendChild(acciones);
        cont.appendChild(fila);
      }
    },
  });
  bloque.cargar();
}

/**
 * El bloque con la clave inicial de un vendedor recién creado.
 *
 * ⛔ POR QUÉ ES UN BLOQUE Y NO UN AVISO QUE SE VA: esta clave existe una sola
 *    vez. La genera la base al azar, no se guarda en ningún lado y no hay
 *    forma de volver a pedirla. Si desaparece de la pantalla antes de que
 *    Administración la copie, el único camino es dar de baja al vendedor y
 *    crearlo de nuevo.
 *
 * ⛔ Y no se recarga la lista automáticamente después de crear: recargar
 *    borraría este bloque de la pantalla, que es justo lo que no puede pasar.
 */
function bloqueDeClaveInicial(nombre: string, usuario: string, clave: string): HTMLElement {
  const caja = crearElemento('div', 'admin-clave-inicial');
  caja.setAttribute('role', 'status');
  caja.appendChild(crearElemento('h5', undefined, `${nombre} quedó creado`));
  caja.appendChild(crearElemento(
    'p', 'admin-ayuda',
    'Pasale estos dos datos por un medio seguro. La clave se muestra UNA sola vez: '
    + 'si cerrás esta pantalla sin copiarla, hay que dar de baja al usuario y volver a crearlo. '
    + 'En su primer ingreso el sistema le va a exigir cambiarla.',
  ));

  const datos = crearElemento('div', 'admin-clave-datos');
  const filaUsuario = crearElemento('p');
  filaUsuario.appendChild(crearElemento('span', 'admin-clave-etiqueta', 'Usuario'));
  filaUsuario.appendChild(crearElemento('code', 'admin-clave-valor', usuario));
  const filaClave = crearElemento('p');
  filaClave.appendChild(crearElemento('span', 'admin-clave-etiqueta', 'Clave inicial'));
  filaClave.appendChild(crearElemento('code', 'admin-clave-valor', clave));
  datos.appendChild(filaUsuario);
  datos.appendChild(filaClave);
  caja.appendChild(datos);

  const copiar = crearElemento('button', 'btn', 'Copiar usuario y clave');
  copiar.type = 'button';
  copiar.addEventListener('click', () => {
    // Si el navegador no deja copiar, no se finge que copió: se dice.
    void navigator.clipboard.writeText(`Usuario: ${usuario}\nClave inicial: ${clave}`)
      .then(() => { copiar.textContent = 'Copiado'; })
      .catch(() => { copiar.textContent = 'No pude copiar: anotala a mano'; });
  });
  caja.appendChild(copiar);
  return caja;
}

function renderVendedores(contenedor: HTMLElement, ctx: ContextoVista): void {
  const contenedorTabla = crearElemento('div');
  const contenedorFormulario = crearElemento('div', 'admin-formulario');
  contenedor.appendChild(contenedorTabla);
  contenedor.appendChild(contenedorFormulario);

  const bloque = crearBloque<{ readonly items: readonly Usuario[] }>(ctx.senal, {
    contenedor: contenedorTabla,
    cargar: () => ctx.datos.listarVendedores({}, { limite: 100 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay usuarios cargados.',
    renderizar: (p, cont) => {
      const filas = p.items.map((u) => {
        const botonDesactivar = crearElemento('button', 'btn-texto', u.activo ? 'Dar de baja' : 'Ya está dado de baja');
        botonDesactivar.type = 'button';
        botonDesactivar.disabled = !u.activo;
        botonDesactivar.addEventListener('click', () => {
          const motivo = window.prompt(`Motivo para dar de baja a ${u.nombre}`);
          if (!motivo) return;
          void (async () => {
            botonDesactivar.disabled = true;
            const resultado = await ctx.datos.desactivarVendedor(u.id, motivo);
            if (ctx.senal.aborted) return;
            if (resultado.ok) renderVendedores(contenedor, ctx);
            else botonDesactivar.disabled = false;
          })();
        });
        return [u.nombre, u.usuario, u.rol === 'administrador' ? 'Administrador' : 'Vendedor', u.activo ? 'Activo' : 'Inactivo', botonDesactivar];
      });
      cont.appendChild(crearTabla(['Nombre', 'Usuario', 'Rol', 'Estado', ''], filas));
    },
  });
  bloque.cargar();

  contenedorFormulario.appendChild(crearElemento('h4', undefined, 'Alta de vendedor'));
  contenedorFormulario.appendChild(crearElemento(
    'p', 'admin-ayuda',
    'La clave inicial y su cambio obligatorio en el primer ingreso son de Sesión 1 (Ingreso): esta pantalla sólo crea la cuenta y el rol.',
  ));
  const { campo: campoNombre, entrada: entradaNombre } = campoTexto('Nombre completo', 'vendedor-nombre', { requerido: true });
  const { campo: campoEmail, entrada: entradaEmail } = campoTexto('Email', 'vendedor-email', { tipo: 'email', requerido: true });
  const { campo: campoUsuario, entrada: entradaUsuario } = campoTexto('Usuario de ingreso', 'vendedor-usuario', { requerido: true });
  const { campo: campoRol, select: selectRol } = campoSelect('Rol', 'vendedor-rol', [{ valor: 'vendedor', texto: 'Vendedor' }, { valor: 'administrador', texto: 'Administrador' }]);
  contenedorFormulario.appendChild(campoNombre);
  contenedorFormulario.appendChild(campoEmail);
  contenedorFormulario.appendChild(campoUsuario);
  contenedorFormulario.appendChild(campoRol);
  const aviso = crearAviso();
  contenedorFormulario.appendChild(aviso);
  const boton = crearElemento('button', 'btn', 'Crear vendedor');
  boton.type = 'button';
  boton.addEventListener('click', () => {
    void (async () => {
      if (!entradaNombre.value.trim() || !entradaEmail.value.trim() || !entradaUsuario.value.trim()) {
        mostrarAviso(aviso, 'Completá nombre, email y usuario.');
        return;
      }
      boton.disabled = true;
      const resultado = await ctx.datos.crearVendedor({
        nombre: entradaNombre.value.trim(), email: entradaEmail.value.trim(),
        usuario: entradaUsuario.value.trim(), rol: selectRol.value as Rol,
      }, nuevaClaveIdempotencia());
      if (ctx.senal.aborted) return;
      boton.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      // ⛔ LA CLAVE SE MUESTRA UNA SOLA VEZ, Y ACÁ.
      //    La genera la base al azar y no queda en ningún lado: ni en el
      //    repositorio, ni en un correo, ni en otra llamada. Antes esta
      //    pantalla la tiraba y el vendedor quedaba creado sin poder entrar.
      //    Por eso no se usa el aviso chico: se arma un bloque que se queda.
      const alta = resultado.datos;
      contenedorFormulario.appendChild(
        bloqueDeClaveInicial(alta.usuario.nombre, alta.usuario.usuario, alta.claveInicial));
      entradaNombre.value = '';
      entradaEmail.value = '';
      entradaUsuario.value = '';
    })();
  });
  contenedorFormulario.appendChild(boton);
}

function renderParametros(contenedor: HTMLElement, ctx: ContextoVista): void {
  const bloque = crearBloque<ParametrosSistema>(ctx.senal, {
    contenedor,
    cargar: () => ctx.datos.obtenerParametros(),
    esVacio: () => false,
    mensajeVacio: '',
    renderizar: (parametros, cont) => {
      const { campo: campoVigenciaCotizacion, entrada: entradaVigenciaCotizacion } = campoTexto('Vigencia de cotizaciones (días)', 'parametros-vigencia-cotizacion', { tipo: 'number', valor: String(parametros.vigenciaCotizacionDias) });
      const { campo: campoVigenciaEnlace, entrada: entradaVigenciaEnlace } = campoTexto('Vigencia de enlaces (días)', 'parametros-vigencia-enlace', { tipo: 'number', valor: String(parametros.vigenciaEnlaceDias) });
      const { campo: campoInactivo, entrada: entradaInactivo } = campoTexto('Días sin entrar para marcar inactivo', 'parametros-inactivo', { tipo: 'number', valor: String(parametros.diasSinEntrarParaInactivo) });
      const { campo: campoMotivo, area: areaMotivo } = campoTextarea('Motivo del cambio', 'parametros-motivo');
      cont.appendChild(campoVigenciaCotizacion);
      cont.appendChild(campoVigenciaEnlace);
      cont.appendChild(campoInactivo);
      cont.appendChild(campoMotivo);
      const aviso = crearAviso();
      cont.appendChild(aviso);
      const boton = crearElemento('button', 'btn', 'Guardar parámetros');
      boton.type = 'button';
      boton.addEventListener('click', () => {
        void (async () => {
          if (!areaMotivo.value.trim()) {
            mostrarAviso(aviso, 'Cambiar los parámetros exige un motivo.');
            return;
          }
          boton.disabled = true;
          const resultado = await ctx.datos.actualizarParametros({
            vigenciaCotizacionDias: Number(entradaVigenciaCotizacion.value),
            vigenciaEnlaceDias: Number(entradaVigenciaEnlace.value),
            diasSinEntrarParaInactivo: Number(entradaInactivo.value),
          }, areaMotivo.value.trim());
          if (ctx.senal.aborted) return;
          boton.disabled = false;
          mostrarAviso(aviso, resultado.ok ? 'Parámetros actualizados.' : resultado.error.mensajeAmable);
        })();
      });
      cont.appendChild(boton);
    },
  });
  bloque.cargar();
}

function renderEstadoProveedores(contenedor: HTMLElement, ctx: ContextoVista): void {
  const bloque = crearBloque(ctx.senal, {
    contenedor,
    cargar: () => ctx.datos.estadoProveedores(),
    esVacio: () => false,
    mensajeVacio: '',
    renderizar: (estado, cont) => {
      cont.appendChild(crearElemento('p', undefined, estado.modoRespaldo ? 'El sistema está en modo respaldo por taxonomía: las fuentes externas no responden.' : 'Los proveedores externos responden con normalidad.'));
      const lista = crearElemento('ul');
      for (const p of estado.busqueda) lista.appendChild(crearElemento('li', undefined, `Búsqueda — ${p.nombre}: ${p.disponible ? 'disponible' : 'no disponible'}`));
      for (const p of estado.registrosPublicos) lista.appendChild(crearElemento('li', undefined, `Registros públicos — ${p.nombre}: ${p.disponible ? 'disponible' : 'no disponible'}`));
      for (const p of estado.modeloLenguaje) lista.appendChild(crearElemento('li', undefined, `Modelo de lenguaje — ${p.nombre}: ${p.disponible ? 'disponible' : 'no disponible'}`));
      cont.appendChild(lista);
      cont.appendChild(crearElemento('p', 'admin-ayuda', `Verificado: ${formatearFechaHora(estado.verificadoEn)}`));
    },
  });
  bloque.cargar();
}

// ---------------------------------------------------------------------------
// Sección: Sugerencias de nuevos productos
// ---------------------------------------------------------------------------

const RESOLUCIONES_SUGERENCIA: ReadonlyArray<{ readonly valor: string; readonly texto: string }> = [
  { valor: 'aceptada_para_estudio', texto: 'Aceptada para estudio' },
  { valor: 'rechazada', texto: 'Rechazada' },
  { valor: 'duplicada', texto: 'Duplicada' },
  { valor: 'ya_cubierta_por_producto_existente', texto: 'Ya cubierta por un producto existente' },
];

function renderSugerencias(panel: HTMLElement, ctx: ContextoVista): void {
  vaciarNodo(panel);
  const contenedorLista = crearElemento('div');
  panel.appendChild(contenedorLista);

  const bloque = crearBloque<{ readonly items: readonly SugerenciaProducto[] }>(ctx.senal, {
    contenedor: contenedorLista,
    cargar: () => ctx.datos.listarSugerencias({}, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'Todavía no llegó ninguna sugerencia de producto nuevo.',
    renderizar: (p, cont) => {
      for (const s of p.items) cont.appendChild(crearTarjetaSugerencia(s, ctx, () => renderSugerencias(panel, ctx)));
    },
  });
  bloque.cargar();
}

function crearTarjetaSugerencia(sugerencia: SugerenciaProducto, ctx: ContextoVista, alResolver: () => void): HTMLElement {
  const tarjeta = crearElemento('div', 'tarjeta admin-sugerencia');
  tarjeta.appendChild(crearElemento('h3', undefined, sugerencia.titulo));
  tarjeta.appendChild(crearElemento('p', undefined, sugerencia.problemaCliente));
  tarjeta.appendChild(crearElemento('p', 'admin-ayuda', `Frecuencia observada: ${sugerencia.frecuenciaObservada} · Estado: ${sugerencia.estado}`));
  if (sugerencia.estado !== 'recibida' && sugerencia.estado !== 'en_evaluacion') {
    tarjeta.appendChild(crearElemento('p', undefined, `Resolución: ${sugerencia.resolucion ?? '—'}`));
    return tarjeta;
  }
  const { campo: campoEstado, select } = campoSelect('Resolución', `sugerencia-estado-${sugerencia.id}`, RESOLUCIONES_SUGERENCIA);
  const { campo: campoResolucion, area } = campoTextarea('Explicación de la resolución', `sugerencia-resolucion-${sugerencia.id}`);
  tarjeta.appendChild(campoEstado);
  tarjeta.appendChild(campoResolucion);
  const aviso = crearAviso();
  tarjeta.appendChild(aviso);
  const boton = crearElemento('button', 'btn', 'Resolver sugerencia');
  boton.type = 'button';
  boton.addEventListener('click', () => {
    void (async () => {
      if (!area.value.trim()) {
        mostrarAviso(aviso, 'El silencio no es una resolución válida: explicá qué se decidió.');
        return;
      }
      boton.disabled = true;
      const resultado = await ctx.datos.resolverSugerencia(sugerencia.id, {
        estado: select.value as 'aceptada_para_estudio' | 'rechazada' | 'duplicada' | 'ya_cubierta_por_producto_existente',
        resolucion: area.value.trim(),
      });
      if (ctx.senal.aborted) return;
      boton.disabled = false;
      if (!resultado.ok) {
        mostrarAviso(aviso, resultado.error.mensajeAmable);
        return;
      }
      alResolver();
    })();
  });
  tarjeta.appendChild(boton);
  return tarjeta;
}

// ---------------------------------------------------------------------------
// La cáscara de secciones — pestañas
// ---------------------------------------------------------------------------

interface Seccion {
  readonly id: string;
  readonly etiqueta: string;
  readonly usaPeriodo: boolean;
  readonly renderizar: (panel: HTMLElement, ctx: ContextoVista, periodo: PeriodoMensual) => void;
}

const SECCIONES: ReadonlyArray<Seccion> = [
  { id: 'control_financiero', etiqueta: 'Control financiero', usaPeriodo: true, renderizar: (p, c, per) => renderControlFinanciero(p, c, per) },
  { id: 'presupuesto_de_ventas', etiqueta: 'Presupuesto', usaPeriodo: true, renderizar: (p, c, per) => renderPresupuesto(p, c, per) },
  { id: 'vendido_cobrado_por_cobrar', etiqueta: 'Vendido, cobrado y por cobrar', usaPeriodo: true, renderizar: (p, c, per) => renderVendidoCobradoPorCobrar(p, c, per) },
  { id: 'comisiones', etiqueta: 'Comisiones', usaPeriodo: true, renderizar: (p, c, per) => renderComisiones(p, c, per) },
  { id: 'ranking', etiqueta: 'Ranking', usaPeriodo: true, renderizar: (p, c, per) => renderRanking(p, c, per) },
  { id: 'accesos_y_uso', etiqueta: 'Accesos y uso', usaPeriodo: true, renderizar: (p, c, per) => renderAccesosYUso(p, c, per) },
  { id: 'todos_los_clientes', etiqueta: 'Todos los clientes', usaPeriodo: false, renderizar: (p, c) => renderTodosLosClientes(p, c) },
  { id: 'aprobacion_de_cotizaciones', etiqueta: 'Aprobación de cotizaciones', usaPeriodo: false, renderizar: (p, c) => renderAprobacionCotizaciones(p, c) },
  { id: 'configuracion_comercial', etiqueta: 'Configuración comercial', usaPeriodo: false, renderizar: (p, c) => renderConfiguracionComercial(p, c) },
  { id: 'sugerencias', etiqueta: 'Sugerencias', usaPeriodo: false, renderizar: (p, c) => renderSugerencias(p, c) },
];

function montar(contexto: ContextoVista): void {
  const { raiz, rol } = contexto;
  vaciarNodo(raiz);

  const vista = crearElemento('div', 'vista administracion-vista');
  /* ⛔ El título y el chip "Datos de ejemplo" los pone la cáscara, una sola
     vez, en su encabezado fijo. Ver nucleo/disposicion.ts. */
  raiz.appendChild(vista);

  if (rol !== 'administrador') {
    vista.appendChild(crearError('Esta sección es sólo para administradores. Volvé a Inicio.', () => { window.location.hash = '#/inicio'; }));
    return;
  }

  let periodo: PeriodoMensual = periodoActual();

  const selector = crearElemento('div', 'dinero-selector-periodo administracion-selector-periodo');
  selector.setAttribute('role', 'group');
  selector.setAttribute('aria-label', 'Período');
  const botonAnterior = crearElemento('button', 'btn-texto', 'Período anterior');
  botonAnterior.type = 'button';
  const etiquetaPeriodo = crearElemento('span', 'dinero-periodo-actual', formatearPeriodo(periodo));
  etiquetaPeriodo.setAttribute('aria-live', 'polite');
  const botonSiguiente = crearElemento('button', 'btn-texto', 'Período siguiente');
  botonSiguiente.type = 'button';
  selector.appendChild(botonAnterior);
  selector.appendChild(etiquetaPeriodo);
  selector.appendChild(botonSiguiente);
  vista.appendChild(selector);

  const pestanas = crearElemento('div', 'pestanas');
  pestanas.setAttribute('role', 'tablist');
  pestanas.setAttribute('aria-label', 'Secciones de Administración');
  vista.appendChild(pestanas);

  const paneles = crearElemento('div', 'administracion-paneles');
  vista.appendChild(paneles);

  const botones: HTMLButtonElement[] = [];
  const panelesPorId = new Map<string, HTMLElement>();
  let activaId = SECCIONES[0]!.id;

  function activar(id: string): void {
    activaId = id;
    for (const boton of botones) {
      const activo = boton.dataset['id'] === id;
      boton.setAttribute('aria-selected', activo ? 'true' : 'false');
      boton.tabIndex = activo ? 0 : -1;
    }
    for (const [idPanel, panel] of panelesPorId) panel.hidden = idPanel !== id;
    const seccion = SECCIONES.find((s) => s.id === id);
    const panel = panelesPorId.get(id);
    if (seccion && panel) seccion.renderizar(panel, contexto, periodo);
  }

  SECCIONES.forEach((seccion, indice) => {
    const boton = crearElemento('button', 'pestana', seccion.etiqueta);
    boton.type = 'button';
    boton.id = `pestana-${seccion.id}`;
    boton.setAttribute('role', 'tab');
    boton.setAttribute('aria-controls', `panel-${seccion.id}`);
    boton.dataset['id'] = seccion.id;
    boton.addEventListener('click', () => activar(seccion.id));
    boton.addEventListener('keydown', (evento) => {
      if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
      evento.preventDefault();
      const siguiente = (indice + (evento.key === 'ArrowRight' ? 1 : SECCIONES.length - 1)) % SECCIONES.length;
      const botonSiguienteFoco = botones[siguiente];
      if (botonSiguienteFoco) {
        botonSiguienteFoco.focus();
        activar(SECCIONES[siguiente]!.id);
      }
    });
    botones.push(boton);
    pestanas.appendChild(boton);

    const panel = crearElemento('div', 'administracion-panel');
    panel.id = `panel-${seccion.id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', boton.id);
    panel.hidden = indice !== 0;
    panelesPorId.set(seccion.id, panel);
    paneles.appendChild(panel);
  });

  function actualizarPeriodo(nuevo: PeriodoMensual): void {
    periodo = nuevo;
    etiquetaPeriodo.textContent = formatearPeriodo(periodo);
    const seccion = SECCIONES.find((s) => s.id === activaId);
    const panel = panelesPorId.get(activaId);
    if (seccion?.usaPeriodo && panel) seccion.renderizar(panel, contexto, periodo);
  }
  botonAnterior.addEventListener('click', () => actualizarPeriodo(periodoAnterior(periodo)));
  botonSiguiente.addEventListener('click', () => actualizarPeriodo(periodoSiguiente(periodo)));

  activar(SECCIONES[0]!.id);
}

function desmontar(): void {
  document.querySelectorAll('dialog.dialogo').forEach((el) => el.remove());
}

/**
 * ⛔ El nucleo monta una vista con `crearVista()` (contrato-vista.ts →
 *    `esModuloVista`). Sin esta exportacion la seccion aparece "en
 *    construccion" aunque el codigo este entero: `export default` no alcanza.
 */
export function crearVista(): Vista {
  return { montar, desmontar };
}

const vista: Vista = { montar, desmontar };
export default vista;
