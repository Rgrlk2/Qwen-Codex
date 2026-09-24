/**
 * A · Presentación para dejar al cliente.
 *
 * Se genera PRIMERO, antes de hablar de plata: copy aprobado de los productos
 * elegidos, personalizada y compartible. ⛔ Sin precio definitivo. ⛔ No
 * requiere aprobación de nadie: emitirla es una acción directa del vendedor.
 */

import type { CapaDatos, NuevaPresentacion, Presentacion, Producto, ProductoId } from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crear, vaciar } from './dom';
import { cargarConEstados } from './estado-async';
import { formatearFechaHora } from './formato';
import { nuevaClaveIdempotencia } from './ids';

async function cargarProductos(datos: CapaDatos): Promise<ReadonlyArray<Producto>> {
  try {
    const resultado = await datos.listarProductos();
    if (resultado.ok) return resultado.datos;
  } catch {
    // El catálogo todavía puede no estar disponible en esta rama: se degrada abajo.
  }
  return [];
}

function panelFormulario(
  contenedor: HTMLElement,
  contexto: ContextoVista,
  productos: ReadonlyArray<Producto>,
  alCrear: () => void,
): void {
  const formulario = crear('form', { clase: 'propuestas-tarjeta propuestas-formulario' });

  const campoCliente = crear('div', { clase: 'propuestas-campo' });
  const etiquetaCliente = crear('label', { texto: 'ID del cliente', atributos: { for: 'pres-cliente' } });
  const entradaCliente = crear('input', { atributos: { id: 'pres-cliente', name: 'clienteId', required: 'true' } });
  campoCliente.append(etiquetaCliente, entradaCliente);

  const campoTitulo = crear('div', { clase: 'propuestas-campo' });
  const etiquetaTitulo = crear('label', { texto: 'Título de la presentación', atributos: { for: 'pres-titulo' } });
  const entradaTitulo = crear('input', { atributos: { id: 'pres-titulo', name: 'titulo', required: 'true' } });
  campoTitulo.append(etiquetaTitulo, entradaTitulo);

  const campoProductos = crear('div', { clase: 'propuestas-campo' });
  campoProductos.append(crear('span', { texto: 'Productos incluidos' }));
  const listaCasillas = crear('div', { clase: 'propuestas-chips' });
  if (productos.length === 0) {
    listaCasillas.append(crear('p', { clase: 'propuestas-aviso', texto: 'No se pudo cargar el catálogo todavía. Reintentá en un momento.' }));
  }
  const casillas: HTMLInputElement[] = [];
  for (const producto of productos) {
    const id = `pres-prod-${producto.id}`;
    const envoltorio = crear('label', { clase: 'propuestas-chip' });
    const casilla = crear('input', { atributos: { type: 'checkbox', id, value: producto.id } });
    casillas.push(casilla);
    envoltorio.append(casilla, document.createTextNode(producto.nombre));
    listaCasillas.append(envoltorio);
  }
  campoProductos.append(listaCasillas);

  // ⛔ ACÁ NO SE COPIAN LOS CASOS DE USO. El copy aprobado ya los trae, y el
  //    cliente los ve del archivo congelado. Lo que hace relevante la
  //    presentación para ESE cliente son las palabras del vendedor, no una
  //    segunda copia del texto de Lab.IA que el día de mañana quede vieja.
  const campoCasos = crear('div', { clase: 'propuestas-campo' });
  const etiquetaCasos = crear('label', {
    texto: 'Lo que conversamos', atributos: { for: 'pres-casos' },
  });
  const ayudaCasos = crear('span', {
    clase: 'propuestas-meta',
    texto: 'Lo que te dijo en la reunión, con tus palabras. Va arriba de todo y separado del texto de Lab.IA.',
  });
  const areaCasos = crear('textarea', { atributos: { id: 'pres-casos', rows: '3' } });
  campoCasos.append(etiquetaCasos, ayudaCasos, areaCasos);

  const campoNota = crear('div', { clase: 'propuestas-campo' });
  const etiquetaNota = crear('label', {
    texto: 'Tu nota de cierre (opcional)', atributos: { for: 'pres-nota' },
  });
  const areaNota = crear('textarea', { atributos: { id: 'pres-nota', rows: '2' } });
  campoNota.append(etiquetaNota, areaNota);

  const campoRango = crear('label', { clase: 'propuestas-checkbox' });
  const casillaRango = crear('input', { atributos: { type: 'checkbox' } });
  campoRango.append(casillaRango, document.createTextNode('Mostrar un rango de referencia documentado (nunca un precio definitivo)'));

  const zonaAviso = crear('div', { clase: 'propuestas-aviso', atributos: { role: 'alert' } });
  zonaAviso.hidden = true;

  const acciones = crear('div', { clase: 'propuestas-acciones' });
  const botonGuardar = crear('button', { clase: 'propuestas-btn', texto: 'Crear presentación' });
  botonGuardar.type = 'submit';
  acciones.append(botonGuardar);

  formulario.append(
    campoCliente, campoTitulo, campoProductos, campoCasos, campoNota, campoRango,
    zonaAviso, acciones,
  );

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    zonaAviso.hidden = true;
    const productosIncluidos = casillas.filter((c) => c.checked).map((c) => c.value as ProductoId);
    if (productosIncluidos.length === 0) {
      zonaAviso.textContent = 'Elegí al menos un producto.';
      zonaAviso.hidden = false;
      return;
    }
    const datos: NuevaPresentacion = {
      clienteId: entradaCliente.value.trim(),
      titulo: entradaTitulo.value.trim(),
      productosIncluidos,
      ...(areaCasos.value.trim() ? { loQueConversamos: areaCasos.value.trim() } : {}),
      ...(areaNota.value.trim() ? { notaDelVendedor: areaNota.value.trim() } : {}),
      mostrarRangoDeReferencia: casillaRango.checked,
    };
    botonGuardar.disabled = true;
    contexto.datos.crearPresentacion(datos, nuevaClaveIdempotencia()).then((resultado) => {
      botonGuardar.disabled = false;
      if (!resultado.ok) {
        zonaAviso.textContent = resultado.error.mensajeAmable;
        zonaAviso.hidden = false;
        return;
      }
      alCrear();
    });
  });

  contenedor.append(formulario);
}

function tarjetaPresentacion(presentacion: Presentacion, contexto: ContextoVista, contenedorEnlace: HTMLElement): HTMLElement {
  const tarjeta = crear('div', { clase: 'propuestas-tarjeta' });
  tarjeta.append(crear('h3', { texto: presentacion.titulo }));
  tarjeta.append(crear('p', { clase: 'propuestas-meta', texto: `Creada el ${formatearFechaHora(presentacion.creadoEn)} · versión ${presentacion.version}` }));
  const productos = crear('p', { texto: `Productos: ${presentacion.productosIncluidos.join(', ')}` });
  tarjeta.append(productos);
  if (presentacion.mostrarRangoDeReferencia) {
    tarjeta.append(crear('p', { clase: 'propuestas-referencia', texto: 'Incluye un rango de referencia documentado (no es un precio definitivo).' }));
  }

  const acciones = crear('div', { clase: 'propuestas-acciones' });
  const botonEmitir = crear('button', { clase: 'propuestas-btn-borde', texto: 'Emitir PDF y generar enlace' });
  botonEmitir.type = 'button';
  const resultadoAccion = crear('p', { clase: 'propuestas-aviso' });
  resultadoAccion.hidden = true;
  botonEmitir.addEventListener('click', () => {
    botonEmitir.disabled = true;
    contexto.datos.emitirPresentacion(presentacion.id, nuevaClaveIdempotencia()).then((emitido) => {
      if (!emitido.ok) {
        resultadoAccion.textContent = emitido.error.mensajeAmable;
        resultadoAccion.hidden = false;
        botonEmitir.disabled = false;
        return;
      }
      contexto.datos.crearEnlace(
        presentacion.id,
        { venceEn: new Date(Date.now() + 30 * 86_400_000).toISOString() },
        nuevaClaveIdempotencia(),
      ).then((enlace) => {
        botonEmitir.disabled = false;
        if (!enlace.ok) {
          resultadoAccion.textContent = enlace.error.mensajeAmable;
          resultadoAccion.hidden = false;
          return;
        }
        resultadoAccion.hidden = false;
        resultadoAccion.textContent = `PDF emitido. Enlace para compartir con el cliente: token ${enlace.datos.token}.`;
      });
    });
  });
  acciones.append(botonEmitir);
  tarjeta.append(acciones, resultadoAccion);
  contenedorEnlace.append(tarjeta);
  return tarjeta;
}

export function montarPresentaciones(contenedor: HTMLElement, contexto: ContextoVista): void {
  vaciar(contenedor);

  const encabezado = crear('div', { clase: 'propuestas-encabezado-seccion' });
  encabezado.append(crear('p', { clase: 'propuestas-explicacion', texto: 'Se genera primero, antes de hablar de precio: contenido personalizado y compartible, sin precio definitivo.' }));
  const botonNueva = crear('button', { clase: 'propuestas-btn', texto: 'Nueva presentación' });
  botonNueva.type = 'button';
  encabezado.append(botonNueva);

  const zonaFormulario = crear('div');
  zonaFormulario.hidden = true;

  const lista = crear('div', { clase: 'propuestas-lista' });

  function recargarLista(): void {
    cargarConEstados({
      contenedor: lista,
      senal: contexto.senal,
      etiquetaCargando: 'Cargando presentaciones…',
      cargar: () => contexto.datos.listarPresentaciones({}),
      estaVacio: (pagina) => pagina.items.length === 0,
      renderizarVacio: (destino) => {
        const vacio = crear('div', { clase: 'propuestas-vacio' });
        vacio.append(crear('p', { texto: 'Todavía no creaste ninguna presentación.' }));
        const boton = crear('button', { clase: 'propuestas-btn', texto: 'Crear la primera presentación' });
        boton.type = 'button';
        boton.addEventListener('click', () => { zonaFormulario.hidden = false; });
        vacio.append(boton);
        destino.append(vacio);
      },
      renderizarDatos: (destino, pagina) => {
        for (const presentacion of pagina.items) tarjetaPresentacion(presentacion, contexto, destino);
      },
    });
  }

  botonNueva.addEventListener('click', () => {
    zonaFormulario.hidden = !zonaFormulario.hidden;
  });

  cargarProductos(contexto.datos).then((productos) => {
    if (contexto.senal.aborted) return;
    vaciar(zonaFormulario);
    panelFormulario(zonaFormulario, contexto, productos, () => {
      zonaFormulario.hidden = true;
      recargarLista();
    });
  });

  contenedor.append(encabezado, zonaFormulario, lista);
  recargarLista();
}
