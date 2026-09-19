/**
 * B · Cotizaciones — lista, creación y navegación al detalle.
 *
 * Se prepara DESPUÉS de la presentación, cuando el cliente ya vio el
 * contenido. Acá vive el gobierno de la plantilla genérica: la aprobación,
 * las firmas y el envío al cliente están en `cotizacion-detalle.ts`.
 */

import type { Cotizacion } from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crear, vaciar } from './dom';
import { cargarConEstados } from './estado-async';
import { renderizarFormularioNuevaCotizacion } from './cotizacion-formulario';
import { renderizarDetalleCotizacion } from './cotizacion-detalle';
import { formatearFecha } from './formato';

type Pantalla = { readonly tipo: 'lista' } | { readonly tipo: 'nueva' } | { readonly tipo: 'detalle'; readonly id: string };

const ETIQUETAS_ESTADO: Readonly<Record<Cotizacion['estado'], string>> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  corregida: 'Devuelta',
  rechazada: 'Rechazada',
  enviada_al_cliente: 'Enviada al cliente',
  aceptada: 'Aceptada',
  perdida: 'Perdida',
  vencida: 'Vencida',
};

function tarjetaCotizacion(cotizacion: Cotizacion, alAbrir: () => void): HTMLElement {
  const tarjeta = crear('button', { clase: 'propuestas-tarjeta propuestas-tarjeta--clicable' });
  tarjeta.type = 'button';
  tarjeta.addEventListener('click', alAbrir);
  const encabezado = crear('div', { clase: 'propuestas-tarjeta__encabezado' });
  encabezado.append(crear('h3', { texto: `${cotizacion.folio} · v${cotizacion.version}` }));
  encabezado.append(crear('span', { clase: `propuestas-badge propuestas-badge--${cotizacion.estado}`, texto: ETIQUETAS_ESTADO[cotizacion.estado] }));
  tarjeta.append(encabezado);
  tarjeta.append(crear('p', { texto: `${cotizacion.destinatario.nombreEmpresaOProfesional} — ${cotizacion.objeto.nombreProducto}` }));
  tarjeta.append(crear('p', { clase: 'propuestas-meta', texto: `Válida hasta el ${formatearFecha(cotizacion.fechaValidez)}` }));
  return tarjeta;
}

export function montarCotizaciones(contenedorRaiz: HTMLElement, contexto: ContextoVista): void {
  let pantalla: Pantalla = { tipo: 'lista' };

  function ir(nueva: Pantalla): void {
    pantalla = nueva;
    renderizar();
  }

  function renderizar(): void {
    vaciar(contenedorRaiz);
    if (contexto.senal.aborted) return;
    if (pantalla.tipo === 'nueva') {
      renderizarFormularioNuevaCotizacion(
        contenedorRaiz,
        contexto,
        (id) => ir({ tipo: 'detalle', id }),
        () => ir({ tipo: 'lista' }),
      );
      return;
    }
    if (pantalla.tipo === 'detalle') {
      renderizarDetalleCotizacion(contenedorRaiz, contexto, pantalla.id, () => ir({ tipo: 'lista' }));
      return;
    }

    const encabezado = crear('div', { clase: 'propuestas-encabezado-seccion' });
    encabezado.append(crear('p', {
      clase: 'propuestas-explicacion',
      texto: 'Plantilla genérica de Lab.IA. Ninguna cotización se envía al cliente sin la aprobación del administrador.',
    }));
    const botonNueva = crear('button', { clase: 'propuestas-btn', texto: 'Nueva cotización' });
    botonNueva.type = 'button';
    botonNueva.addEventListener('click', () => ir({ tipo: 'nueva' }));
    encabezado.append(botonNueva);
    contenedorRaiz.append(encabezado);

    const lista = crear('div', { clase: 'propuestas-lista' });
    contenedorRaiz.append(lista);
    cargarConEstados({
      contenedor: lista,
      senal: contexto.senal,
      etiquetaCargando: 'Cargando cotizaciones…',
      cargar: () => contexto.datos.listarCotizaciones({}),
      estaVacio: (pagina) => pagina.items.length === 0,
      renderizarVacio: (destino) => {
        const vacio = crear('div', { clase: 'propuestas-vacio' });
        vacio.append(crear('p', { texto: 'Todavía no creaste ninguna cotización.' }));
        const boton = crear('button', { clase: 'propuestas-btn', texto: 'Crear la primera cotización' });
        boton.type = 'button';
        boton.addEventListener('click', () => ir({ tipo: 'nueva' }));
        vacio.append(boton);
        destino.append(vacio);
      },
      renderizarDatos: (destino, pagina) => {
        for (const cotizacion of pagina.items) {
          destino.append(tarjetaCotizacion(cotizacion, () => ir({ tipo: 'detalle', id: cotizacion.id })));
        }
      },
    });
  }

  renderizar();
}
