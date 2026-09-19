/**
 * Vista 05 — Dinero.   Ruta: #/dinero   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 6. Ninguna otra sesión edita esta carpeta.
 *
 * LAS OCHO CIFRAS, separadas por moneda:
 *   vendido · cobrado · por cobrar · parte de Lab.IA · parte del vendedor ·
 *   comisión pendiente · comisión pagada · mensualidades vigentes
 *
 * REGLA VIGENTE: 50 % Lab.IA / 50 % vendedor, sobre setup y sobre mensualidades.
 * Configurable por producto, con meses de participación configurables.
 *
 * ⛔ Se devenga sobre lo COBRADO, no sobre lo vendido.
 * ⛔ El vendedor NO edita comisiones, participaciones ni liquidaciones.
 *    Sólo puede abrir una observación; la resuelve el administrador.
 * ⛔ Nunca se suma PYG con USD.
 *
 * MASTER_SPEC.md §2.6 y §9 · COMMERCIAL_RULES.md §3 y §4 · API_CONTRACTS.md §2.7
 */

import type {
  CapaDatos, Dinero, LineaParticipacion, Mensualidad, Moneda, PeriodoMensual,
} from '@labia/compartido';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import { buscarMonto, crearBloque, crearElemento, nuevaClaveIdempotencia, vaciarNodo } from './estados';
import { formatearDinero, formatearFecha, formatearPeriodo, periodoActual, periodoAnterior, periodoSiguiente } from './formato';
import './vista.css';

type ClaveCifraDinero =
  | 'vendido' | 'cobrado' | 'porCobrar' | 'parteLabIA' | 'parteVendedor' | 'comisionPendiente' | 'comisionPagada';

const CIFRAS: ReadonlyArray<{ readonly clave: ClaveCifraDinero; readonly etiqueta: string }> = [
  { clave: 'vendido', etiqueta: 'Vendido' },
  { clave: 'cobrado', etiqueta: 'Cobrado' },
  { clave: 'porCobrar', etiqueta: 'Por cobrar' },
  { clave: 'parteLabIA', etiqueta: 'Parte de Lab.IA' },
  { clave: 'parteVendedor', etiqueta: 'Parte del vendedor' },
  { clave: 'comisionPendiente', etiqueta: 'Comisión pendiente' },
  { clave: 'comisionPagada', etiqueta: 'Comisión pagada' },
];

type CifrasPlanas = Readonly<Record<ClaveCifraDinero, readonly Dinero[]>> & {
  readonly mensualidadesImporte: readonly Dinero[];
  readonly mensualidadesCantidad: number;
};

function monedasPresentes(c: CifrasPlanas): Moneda[] {
  const monedas = new Set<Moneda>();
  for (const grupo of [c.vendido, c.cobrado, c.porCobrar, c.parteLabIA, c.parteVendedor, c.comisionPendiente, c.comisionPagada, c.mensualidadesImporte]) {
    for (const d of grupo) monedas.add(d.moneda);
  }
  return [...monedas];
}

function renderizarCifras(c: CifrasPlanas, contenedor: HTMLElement): void {
  for (const moneda of monedasPresentes(c)) {
    const bloqueMoneda = crearElemento('section', 'dinero-moneda');
    bloqueMoneda.appendChild(crearElemento('h2', 'dinero-moneda-titulo', moneda === 'PYG' ? 'Guaraníes' : 'Dólares'));
    const rejilla = crearElemento('div', 'rejilla dinero-cifras');
    for (const { clave, etiqueta } of CIFRAS) {
      const monto = buscarMonto(c[clave], moneda);
      const tarjeta = crearElemento('div', 'tarjeta cifra');
      tarjeta.appendChild(crearElemento('p', 'cifra-etiqueta', etiqueta));
      tarjeta.appendChild(crearElemento('p', 'cifra-valor', formatearDinero({ monto, moneda })));
      rejilla.appendChild(tarjeta);
    }
    const tarjetaMensualidades = crearElemento('div', 'tarjeta cifra');
    tarjetaMensualidades.appendChild(crearElemento('p', 'cifra-etiqueta', 'Mensualidades vigentes'));
    tarjetaMensualidades.appendChild(crearElemento(
      'p', 'cifra-valor',
      `${formatearDinero({ monto: buscarMonto(c.mensualidadesImporte, moneda), moneda })} · ${c.mensualidadesCantidad} ${c.mensualidadesCantidad === 1 ? 'cliente' : 'clientes'}`,
    ));
    rejilla.appendChild(tarjetaMensualidades);
    bloqueMoneda.appendChild(rejilla);
    contenedor.appendChild(bloqueMoneda);
  }
}

const ETIQUETA_ORIGEN: Readonly<Record<LineaParticipacion['origen'], string>> = {
  setup: 'Setup', mensualidad: 'Mensualidad', unica_vez: 'Pago único', prueba: 'Prueba',
};

const ETIQUETA_ESTADO_LINEA: Readonly<Record<LineaParticipacion['estado'], string>> = {
  devengada: 'Comisión pendiente', liquidada: 'Comisión pagada', ajustada: 'Ajustada', anulada: 'Anulada',
};

function renderizarDetalle(
  paginaLineas: readonly LineaParticipacion[], contenedor: HTMLElement, datos: CapaDatos, senal: AbortSignal,
): void {
  const envoltorio = crearElemento('div', 'tabla-contenedor');
  const tabla = crearElemento('table', 'tabla');
  const cabecera = crearElemento('thead');
  const filaCabecera = crearElemento('tr');
  for (const titulo of ['Cliente', 'Producto', 'Origen', 'Base cobrada', '% vendedor', 'Parte vendedor', 'Estado', '']) {
    filaCabecera.appendChild(crearElemento('th', undefined, titulo));
  }
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);
  const cuerpo = crearElemento('tbody');
  for (const linea of paginaLineas) {
    const fila = crearElemento('tr');
    fila.appendChild(crearElemento('td', undefined, linea.nombreCliente));
    fila.appendChild(crearElemento('td', undefined, linea.productoId));
    fila.appendChild(crearElemento('td', undefined, ETIQUETA_ORIGEN[linea.origen]));
    fila.appendChild(crearElemento('td', 'dinero-numero', formatearDinero(linea.baseCobrada)));
    fila.appendChild(crearElemento('td', 'dinero-numero', `${linea.porcentajeVendedorAplicado} %`));
    fila.appendChild(crearElemento('td', 'dinero-numero', formatearDinero(linea.parteVendedor)));
    fila.appendChild(crearElemento('td', undefined, ETIQUETA_ESTADO_LINEA[linea.estado]));
    const celdaAccion = crearElemento('td');
    const boton = crearElemento('button', 'btn-texto', 'Observar');
    boton.type = 'button';
    boton.addEventListener('click', () => abrirDialogoObservacion(linea, datos, senal, boton));
    celdaAccion.appendChild(boton);
    fila.appendChild(celdaAccion);
    cuerpo.appendChild(fila);
  }
  tabla.appendChild(cuerpo);
  envoltorio.appendChild(tabla);
  contenedor.appendChild(envoltorio);
}

function abrirDialogoObservacion(linea: LineaParticipacion, datos: CapaDatos, senal: AbortSignal, boton: HTMLButtonElement): void {
  const dialogo = crearElemento('dialog', 'dialogo');
  dialogo.appendChild(crearElemento('h2', undefined, `Observar la línea de ${linea.nombreCliente}`));
  dialogo.appendChild(crearElemento(
    'p', 'dinero-dialogo-ayuda',
    'Esto no modifica ningún importe. Queda como una observación abierta para que la resuelva el administrador.',
  ));
  const campo = crearElemento('div', 'campo');
  const etiquetaCampo = crearElemento('label', undefined, 'Qué no cierra en esta línea');
  const textoId = `observacion-${linea.id}`;
  etiquetaCampo.setAttribute('for', textoId);
  const area = document.createElement('textarea');
  area.id = textoId;
  area.className = 'entrada';
  area.required = true;
  area.rows = 4;
  campo.appendChild(etiquetaCampo);
  campo.appendChild(area);
  dialogo.appendChild(campo);

  const aviso = crearElemento('p', 'aviso');
  aviso.setAttribute('role', 'status');
  aviso.hidden = true;
  dialogo.appendChild(aviso);

  const acciones = crearElemento('div', 'dinero-dialogo-acciones');
  const cancelar = crearElemento('button', 'btn-borde', 'Cancelar');
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close());
  const enviar = crearElemento('button', 'btn', 'Enviar observación');
  enviar.type = 'button';
  enviar.addEventListener('click', () => {
    void (async () => {
      const descripcion = area.value.trim();
      if (!descripcion) {
        aviso.hidden = false;
        aviso.textContent = 'Contá qué no cierra en esta línea antes de enviar.';
        return;
      }
      enviar.disabled = true;
      const resultado = await datos.abrirObservacion({ lineaParticipacionId: linea.id, descripcion }, nuevaClaveIdempotencia());
      if (senal.aborted) return;
      enviar.disabled = false;
      if (!resultado.ok) {
        aviso.hidden = false;
        aviso.textContent = resultado.error.mensajeAmable;
        return;
      }
      dialogo.close();
      boton.disabled = true;
      boton.textContent = 'Observación enviada';
    })();
  });
  acciones.appendChild(cancelar);
  acciones.appendChild(enviar);
  dialogo.appendChild(acciones);

  dialogo.addEventListener('close', () => dialogo.remove());
  document.body.appendChild(dialogo);
  dialogo.showModal();
  area.focus();
}

const ETIQUETA_ESTADO_MENSUALIDAD: Readonly<Record<Mensualidad['estado'], string>> = {
  activa: 'Activa', suspendida: 'Suspendida', baja: 'Dada de baja',
};

function renderizarMensualidades(paginaMensualidades: readonly Mensualidad[], contenedor: HTMLElement): void {
  const envoltorio = crearElemento('div', 'tabla-contenedor');
  const tabla = crearElemento('table', 'tabla');
  const cabecera = crearElemento('thead');
  const filaCabecera = crearElemento('tr');
  for (const titulo of ['Cliente', 'Producto', 'Importe', 'Alta', 'Meses acumulados', 'Meses de participación restantes', 'Estado']) {
    filaCabecera.appendChild(crearElemento('th', undefined, titulo));
  }
  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);
  const cuerpo = crearElemento('tbody');
  for (const m of paginaMensualidades) {
    const fila = crearElemento('tr');
    fila.appendChild(crearElemento('td', undefined, m.nombreCliente));
    fila.appendChild(crearElemento('td', undefined, m.plan ? `${m.productoId} — ${m.plan}` : m.productoId));
    fila.appendChild(crearElemento('td', 'dinero-numero', formatearDinero(m.importe)));
    fila.appendChild(crearElemento('td', undefined, formatearFecha(m.altaEn)));
    fila.appendChild(crearElemento('td', 'dinero-numero', String(m.mesesAcumulados)));
    fila.appendChild(crearElemento(
      'td', 'dinero-numero',
      m.mesesDeParticipacionRestantes === null ? 'Sin límite' : String(m.mesesDeParticipacionRestantes),
    ));
    fila.appendChild(crearElemento('td', undefined, ETIQUETA_ESTADO_MENSUALIDAD[m.estado]));
    cuerpo.appendChild(fila);
  }
  tabla.appendChild(cuerpo);
  envoltorio.appendChild(tabla);
  contenedor.appendChild(envoltorio);
}

function montar(contexto: ContextoVista): void {
  const { datos, raiz, senal, datosDeEjemplo } = contexto;
  vaciarNodo(raiz);
  let periodo: PeriodoMensual = periodoActual();

  const vista = crearElemento('div', 'vista dinero-vista');
  const encabezado = crearElemento('header', 'encabezado dinero-encabezado');
  const titulo = crearElemento('h1', undefined, 'Dinero');
  titulo.tabIndex = -1;
  encabezado.appendChild(titulo);
  if (datosDeEjemplo) encabezado.appendChild(crearElemento('span', 'chip', 'Datos de ejemplo'));
  vista.appendChild(encabezado);

  const selector = crearElemento('div', 'dinero-selector-periodo');
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

  const seccionCifras = crearElemento('section', 'dinero-seccion');
  seccionCifras.appendChild(crearElemento('h2', undefined, 'Las ocho cifras'));
  const contenedorCifras = crearElemento('div');
  seccionCifras.appendChild(contenedorCifras);
  vista.appendChild(seccionCifras);

  const seccionDetalle = crearElemento('section', 'dinero-seccion');
  seccionDetalle.appendChild(crearElemento('h2', undefined, 'Detalle por operación'));
  const contenedorDetalle = crearElemento('div');
  seccionDetalle.appendChild(contenedorDetalle);
  vista.appendChild(seccionDetalle);

  const seccionMensualidades = crearElemento('section', 'dinero-seccion');
  seccionMensualidades.appendChild(crearElemento('h2', undefined, 'Mensualidades vigentes'));
  const contenedorMensualidades = crearElemento('div');
  seccionMensualidades.appendChild(contenedorMensualidades);
  vista.appendChild(seccionMensualidades);

  raiz.appendChild(vista);
  titulo.focus();

  const bloqueCifras = crearBloque(senal, {
    contenedor: contenedorCifras,
    cargar: () => datos.resumenDinero(periodo),
    esVacio: (r) => r.vendido.length === 0 && r.cobrado.length === 0 && r.mensualidadesVigentes.cantidad === 0,
    mensajeVacio: 'Todavía no registraste ventas en este período.',
    accionVacio: { texto: 'Ir a Planificar', onClick: () => { window.location.hash = '#/planificar'; } },
    filasEsqueleto: 4,
    renderizar: (r, contenedor) => renderizarCifras({
      vendido: r.vendido, cobrado: r.cobrado, porCobrar: r.porCobrar, parteLabIA: r.parteLabIA,
      parteVendedor: r.parteVendedor, comisionPendiente: r.comisionPendiente, comisionPagada: r.comisionPagada,
      mensualidadesImporte: r.mensualidadesVigentes.importe, mensualidadesCantidad: r.mensualidadesVigentes.cantidad,
    }, contenedor),
  });

  const bloqueDetalle = crearBloque(senal, {
    contenedor: contenedorDetalle,
    cargar: () => datos.listarLineasParticipacion(periodo, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No hay operaciones con comisión en este período.',
    renderizar: (p, contenedor) => renderizarDetalle(p.items, contenedor, datos, senal),
  });

  const bloqueMensualidades = crearBloque(senal, {
    contenedor: contenedorMensualidades,
    cargar: () => datos.listarMensualidades({ estado: 'activa' }, { limite: 50 }),
    esVacio: (p) => p.items.length === 0,
    mensajeVacio: 'No tenés mensualidades activas todavía.',
    accionVacio: { texto: 'Ir a Clientes', onClick: () => { window.location.hash = '#/clientes'; } },
    renderizar: (p, contenedor) => renderizarMensualidades(p.items, contenedor),
  });

  function actualizarPeriodo(nuevo: PeriodoMensual): void {
    periodo = nuevo;
    etiquetaPeriodo.textContent = formatearPeriodo(periodo);
    bloqueCifras.cargar();
    bloqueDetalle.cargar();
  }

  botonAnterior.addEventListener('click', () => actualizarPeriodo(periodoAnterior(periodo)));
  botonSiguiente.addEventListener('click', () => actualizarPeriodo(periodoSiguiente(periodo)));

  bloqueCifras.cargar();
  bloqueDetalle.cargar();
  bloqueMensualidades.cargar();
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
