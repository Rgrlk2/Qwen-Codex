/**
 * B · Detalle de una cotización estructurada.
 *
 * Acá se ve, sin desvíos, la regla más importante de esta sesión: ningún
 * vendedor puede emitir el PDF definitivo ni enviarlo al cliente sin que un
 * administrador la haya aprobado. Los botones de emitir y enviar quedan
 * habilitados en la interfaz, pero la capa de datos devuelve
 * `requiere_aprobacion` o `requiere_firma` cuando corresponde, y ese mensaje
 * se muestra tal cual: la interfaz no inventa un permiso que el servidor niega.
 *
 * ⛔ La aprobación en sí (revisarCotizacion, firmarComoCeo) es de Administración
 *    (otra sesión): acá no hay ningún botón de "aprobar".
 */

import type {
  AlternativaCalculada, CodigoError, CotizacionDetalle, Resultado,
} from '@labia/compartido';
import { ETIQUETA_PRECIO_ESPECIAL } from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crear, vaciar } from './dom';
import { cargarConEstados } from './estado-async';
import { formatearDinero, formatearFecha, formatearFechaHora, haVencido } from './formato';
import { nuevaClaveIdempotencia } from './ids';

const ETIQUETAS_ESTADO: Readonly<Record<CotizacionDetalle['estado'], string>> = {
  borrador: 'Borrador',
  en_revision: 'En revisión del administrador',
  aprobada: 'Aprobada',
  corregida: 'Devuelta para corregir',
  rechazada: 'Rechazada',
  enviada_al_cliente: 'Enviada al cliente',
  aceptada: 'Aceptada por el cliente',
  perdida: 'Perdida',
  vencida: 'Vencida',
};

const ETIQUETAS_ERROR: Readonly<Partial<Record<CodigoError, string>>> = {
  requiere_aprobacion: 'Requiere aprobación del administrador',
  requiere_firma: 'Faltan firmas vigentes',
};

function seccion(titulo: string): HTMLElement {
  const contenedor = crear('section', { clase: 'propuestas-seccion' });
  contenedor.append(crear('h3', { texto: titulo }));
  return contenedor;
}

function filaDato(etiqueta: string, valor: string): HTMLElement {
  const fila = crear('div', { clase: 'propuestas-dato' });
  fila.append(crear('span', { clase: 'propuestas-dato__etiqueta', texto: etiqueta }));
  fila.append(crear('span', { clase: 'propuestas-dato__valor', texto: valor }));
  return fila;
}

function tablaAlternativas(alternativas: ReadonlyArray<AlternativaCalculada>): HTMLElement {
  const envoltorio = crear('div', { clase: 'propuestas-tabla-contenedor' });
  const tabla = crear('table', { clase: 'propuestas-tabla' });
  const encabezado = crear('tr');
  encabezado.append(crear('th', { texto: 'Alternativa' }));
  for (const alternativa of alternativas) encabezado.append(crear('th', { texto: alternativa.nombre }));
  const cuerpo = crear('tbody');

  const filas: ReadonlyArray<{ etiqueta: string; valor: (a: AlternativaCalculada) => string }> = [
    { etiqueta: 'Precio total de lista', valor: (a) => formatearDinero(a.precioTotalLista) },
    { etiqueta: 'Precio especial sin promoción', valor: (a) => formatearDinero(a.precioEspecialSinPromocion) },
    { etiqueta: 'Descuento adicional', valor: (a) => formatearDinero(a.descuentoAdicional) },
    { etiqueta: 'Ahorro total', valor: (a) => formatearDinero(a.ahorroTotal) },
    { etiqueta: 'Setup a pagar', valor: (a) => formatearDinero(a.setupAPagar) },
    { etiqueta: 'Mensualidades a pagar', valor: (a) => formatearDinero(a.mensualidadesAPagar) },
    { etiqueta: 'Cantidad de cuotas', valor: (a) => String(a.cantidadCuotas) },
    { etiqueta: 'Meses de servicio', valor: (a) => String(a.mesesServicio) },
    { etiqueta: 'Total final', valor: (a) => formatearDinero(a.totalFinal) },
    { etiqueta: 'Valor mensual efectivo', valor: (a) => formatearDinero(a.valorMensualEfectivo) },
    { etiqueta: 'Forma de pago', valor: (a) => a.formaDePago },
  ];
  for (const fila of filas) {
    const tr = crear('tr');
    tr.append(crear('th', { atributos: { scope: 'row' }, texto: fila.etiqueta }));
    for (const alternativa of alternativas) tr.append(crear('td', { texto: fila.valor(alternativa) }));
    cuerpo.append(tr);
  }
  tabla.append(crear('thead'), cuerpo);
  tabla.querySelector('thead')!.append(encabezado);
  envoltorio.append(tabla);

  const calendarios = crear('div', { clase: 'propuestas-calendarios' });
  for (const alternativa of alternativas) {
    const detalles = crear('details');
    detalles.append(crear('summary', { texto: `Calendario de pago — ${alternativa.nombre}` }));
    const lista = crear('ul');
    for (const cuota of alternativa.calendarioPago) {
      lista.append(crear('li', { texto: `${cuota.concepto}: ${formatearDinero(cuota.importe)} (mes ${cuota.mesRelativo})` }));
    }
    detalles.append(lista);
    calendarios.append(detalles);
  }
  envoltorio.append(calendarios);
  return envoltorio;
}

function botonAccion(
  etiqueta: string,
  ejecutar: () => Promise<Resultado<unknown>>,
  alExito: () => void,
): HTMLElement {
  const envoltorio = crear('div', { clase: 'propuestas-accion' });
  const boton = crear('button', { clase: 'propuestas-btn-borde', texto: etiqueta });
  boton.type = 'button';
  const mensaje = crear('p', { clase: 'propuestas-aviso', atributos: { role: 'status' } });
  mensaje.hidden = true;
  boton.addEventListener('click', () => {
    boton.disabled = true;
    mensaje.hidden = true;
    ejecutar().then((resultado) => {
      boton.disabled = false;
      if (!resultado.ok) {
        const titulo = ETIQUETAS_ERROR[resultado.error.codigo];
        mensaje.textContent = titulo ? `${titulo}: ${resultado.error.mensajeAmable}` : resultado.error.mensajeAmable;
        mensaje.hidden = false;
        return;
      }
      alExito();
    });
  });
  envoltorio.append(boton, mensaje);
  return envoltorio;
}

function pintarDetalle(
  contenedor: HTMLElement,
  contexto: ContextoVista,
  cotizacion: CotizacionDetalle,
  volver: () => void,
  refrescar: () => void,
): void {
  vaciar(contenedor);

  const encabezado = crear('div', { clase: 'propuestas-encabezado-seccion' });
  const botonVolver = crear('button', { clase: 'propuestas-btn-texto', texto: '← Volver a cotizaciones' });
  botonVolver.type = 'button';
  botonVolver.addEventListener('click', volver);
  encabezado.append(botonVolver);
  contenedor.append(encabezado);

  const cabecera = crear('div', { clase: 'propuestas-tarjeta' });
  cabecera.append(crear('h2', { texto: `${cotizacion.folio} · versión ${cotizacion.version}` }));
  cabecera.append(crear('span', { clase: `propuestas-badge propuestas-badge--${cotizacion.estado}`, texto: ETIQUETAS_ESTADO[cotizacion.estado] }));
  cabecera.append(filaDato('Cliente', cotizacion.destinatario.nombreCliente));
  cabecera.append(filaDato('Empresa o profesional', cotizacion.destinatario.nombreEmpresaOProfesional));
  cabecera.append(filaDato('Producto', `${cotizacion.objeto.nombreProducto}${cotizacion.objeto.variante ? ` — ${cotizacion.objeto.variante}` : ''}`));
  cabecera.append(filaDato('Vendedor', cotizacion.nombreVendedor));
  cabecera.append(filaDato('Fecha de emisión', formatearFecha(cotizacion.fechaEmision)));
  cabecera.append(filaDato('Fecha de validez', `${formatearFecha(cotizacion.fechaValidez)}${haVencido(cotizacion.fechaValidez) ? ' (vencida)' : ''}`));
  contenedor.append(cabecera);

  const precios = seccion('Precios');
  precios.append(filaDato('Setup — precio de lista', formatearDinero(cotizacion.precios.setupLista)));
  precios.append(filaDato(`Setup — ${ETIQUETA_PRECIO_ESPECIAL}`, formatearDinero(cotizacion.precios.setupEspecial)));
  precios.append(filaDato('Setup — ahorro', `${formatearDinero(cotizacion.precios.ahorroSetup)} (${cotizacion.precios.ahorroSetupPorcentaje.toFixed(1)} %)`));
  precios.append(filaDato('Mensual — precio de lista', formatearDinero(cotizacion.precios.mensualLista)));
  precios.append(filaDato(`Mensual — ${ETIQUETA_PRECIO_ESPECIAL}`, formatearDinero(cotizacion.precios.mensualEspecial)));
  precios.append(filaDato('Mensual — ahorro', `${formatearDinero(cotizacion.precios.ahorroMensual)} (${cotizacion.precios.ahorroMensualPorcentaje.toFixed(1)} %)`));
  if (cotizacion.comparacion.sinPrecioDeLista) {
    precios.append(crear('p', { clase: 'propuestas-aviso', texto: 'Precio de lista no documentado para este producto: se muestra sin descuento de referencia.' }));
  }
  contenedor.append(precios);

  const condiciones = seccion('Condiciones');
  condiciones.append(filaDato('Permanencia mínima', `${cotizacion.condiciones.permanenciaMinimaMeses} meses`));
  condiciones.append(filaDato('Instalación', cotizacion.condiciones.instalacion.descripcion));
  condiciones.append(filaDato('Tiempo estimado', cotizacion.condiciones.instalacion.tiempoEstimadoTexto));
  const aportes = crear('ul');
  for (const aporte of cotizacion.condiciones.instalacion.aportesDelCliente) {
    aportes.append(crear('li', { texto: `[${aporte.tipo}${aporte.bloqueante ? ', bloqueante' : ''}] ${aporte.descripcion}` }));
  }
  condiciones.append(crear('p', { texto: 'Aporta el cliente:' }), aportes);
  const incluye = crear('ul');
  for (const item of cotizacion.condiciones.alcance.queIncluye) incluye.append(crear('li', { texto: item }));
  condiciones.append(crear('p', { texto: 'Qué incluye:' }), incluye);
  const noIncluye = crear('ul');
  for (const item of cotizacion.condiciones.alcance.queNoIncluye) noIncluye.append(crear('li', { texto: item }));
  condiciones.append(crear('p', { texto: 'Qué NO incluye:' }), noIncluye);
  condiciones.append(filaDato('Bases y condiciones', cotizacion.condiciones.basesYCondiciones));
  condiciones.append(filaDato('Tratamiento del IVA', cotizacion.condiciones.tratamientoIva));
  contenedor.append(condiciones);

  const logos = seccion('Logos del documento');
  const filaLogos = crear('div', { clase: 'propuestas-logos' });
  const imagen = (src: string, alt: string): HTMLElement => {
    const img = crear('img', { atributos: { src, alt, loading: 'lazy' } });
    img.className = 'propuestas-logo';
    return img;
  };
  filaLogos.append(imagen(cotizacion.logos.labIa, 'Logo de Lab.IA'));
  filaLogos.append(imagen(cotizacion.logos.rgrlkGroup, 'Logo de RGrlk Group'));
  filaLogos.append(imagen(cotizacion.logos.producto, `Logo de ${cotizacion.objeto.nombreProducto}`));
  if (cotizacion.logos.variante) filaLogos.append(imagen(cotizacion.logos.variante, `Logo de la variante ${cotizacion.objeto.variante ?? ''}`));
  logos.append(filaLogos);
  contenedor.append(logos);

  const alternativas = seccion('Las cuatro alternativas financieras');
  alternativas.append(crear('p', { clase: 'propuestas-explicacion', texto: 'No acumulables: el cliente elige una sola.' }));
  alternativas.append(tablaAlternativas(cotizacion.alternativas));
  contenedor.append(alternativas);

  const firmas = seccion('Firmas');
  const firmaVendedor = cotizacion.firmas.find((f) => f.rol === 'vendedor' && !f.anulada && f.versionFirmada === cotizacion.version);
  const firmaCeo = cotizacion.firmas.find((f) => f.rol === 'ceo' && !f.anulada && f.versionFirmada === cotizacion.version);
  firmas.append(filaDato('Firma del vendedor', firmaVendedor ? `Firmada el ${formatearFechaHora(firmaVendedor.firmadoEn)}` : 'Pendiente'));
  firmas.append(filaDato('Firma del CEO', firmaCeo ? `Firmada el ${formatearFechaHora(firmaCeo.firmadoEn)}` : 'Pendiente — la incorpora Administración al aprobar'));
  if (!firmaVendedor && (cotizacion.estado === 'borrador' || cotizacion.estado === 'corregida')) {
    firmas.append(botonAccion(
      'Firmar como vendedor',
      () => contexto.datos.firmarComoVendedor(cotizacion.id, nuevaClaveIdempotencia()),
      refrescar,
    ));
  }
  contenedor.append(firmas);

  if (cotizacion.estado === 'borrador' || cotizacion.estado === 'corregida') {
    const envio = seccion('Enviar a revisión');
    envio.append(crear('p', { clase: 'propuestas-explicacion', texto: 'Ningún vendedor puede saltear la revisión: sin firma vigente, esto devuelve "falta la firma".' }));
    const comentario = crear('textarea', { atributos: { rows: '2', placeholder: 'Comentario para el administrador (opcional)' } });
    envio.append(comentario);
    envio.append(botonAccion(
      'Enviar a revisión',
      () => contexto.datos.enviarARevision(cotizacion.id, comentario.value.trim(), nuevaClaveIdempotencia()),
      refrescar,
    ));
    contenedor.append(envio);
  }

  const revision = seccion('Estado de la revisión');
  if (cotizacion.revision) {
    revision.append(filaDato('Revisión', cotizacion.revision.estado));
    const eventos = crear('ul');
    for (const evento of cotizacion.revision.eventos) {
      eventos.append(crear('li', { texto: `${evento.accion} — ${formatearFechaHora(evento.ocurridoEn)} — ${evento.comentario}` }));
    }
    revision.append(eventos);
  } else {
    revision.append(crear('p', { clase: 'propuestas-vacio', texto: 'Todavía no se envió a revisión.' }));
  }
  contenedor.append(revision);

  const entrega = seccion('PDF definitivo y envío al cliente');
  entrega.append(crear('p', {
    clase: 'propuestas-explicacion',
    texto: 'Ambas acciones exigen que Administración haya aprobado esta versión y que las dos firmas estén vigentes. No hay excepción por monto, tiempo ni antigüedad.',
  }));
  entrega.append(botonAccion(
    'Emitir PDF definitivo',
    () => contexto.datos.emitirPdfDefinitivo(cotizacion.id, nuevaClaveIdempotencia()),
    refrescar,
  ));
  entrega.append(botonAccion(
    'Enviar al cliente',
    () => contexto.datos.enviarAlCliente(cotizacion.id, nuevaClaveIdempotencia()),
    refrescar,
  ));
  contenedor.append(entrega);

  const enlaces = seccion('Enlace de respuesta del cliente');
  const listaEnlaces = crear('div');
  enlaces.append(listaEnlaces);
  const crearEnlaceBoton = botonAccion(
    'Crear enlace (vence en 30 días)',
    () => contexto.datos.crearEnlace(
      cotizacion.id,
      { venceEn: new Date(Date.now() + 30 * 86_400_000).toISOString() },
      nuevaClaveIdempotencia(),
    ),
    refrescar,
  );
  enlaces.append(crearEnlaceBoton);
  contenedor.append(enlaces);

  cargarConEstados({
    contenedor: listaEnlaces,
    senal: contexto.senal,
    etiquetaCargando: 'Cargando enlaces…',
    cargar: () => contexto.datos.aperturasDePropuesta(cotizacion.id),
    estaVacio: (pagina) => pagina.items.length === 0,
    renderizarVacio: (destino) => {
      destino.append(crear('p', { clase: 'propuestas-vacio', texto: 'Todavía no se registraron aperturas de enlace.' }));
    },
    renderizarDatos: (destino, pagina) => {
      destino.append(crear('p', { texto: `Aperturas registradas: ${pagina.items.length}.` }));
      const lista = crear('ul');
      for (const apertura of pagina.items) {
        lista.append(crear('li', { texto: `${formatearFechaHora(apertura.ocurridoEn)} · ${apertura.tipoDispositivo} · ${apertura.paisAproximado ?? 'país no disponible'} · ${apertura.resultado}` }));
      }
      destino.append(lista);
    },
  });

  const constanciaSeccion = seccion('Constancia del cliente');
  contenedor.append(constanciaSeccion);
  contexto.datos.constanciaDeCotizacion(cotizacion.id).then((resultado) => {
    if (contexto.senal.aborted) return;
    if (!resultado.ok || !resultado.datos) {
      constanciaSeccion.append(crear('p', { clase: 'propuestas-vacio', texto: 'El cliente todavía no respondió.' }));
      return;
    }
    const constancia = resultado.datos;
    constanciaSeccion.append(crear('p', {
      clase: 'propuestas-aviso',
      texto: 'Es una constancia comercial (aval de intención): no reemplaza un contrato ni una firma electrónica legal.',
    }));
    constanciaSeccion.append(filaDato('Opción elegida', constancia.opcionSeleccionada));
    constanciaSeccion.append(filaDato('Respondida el', formatearFechaHora(constancia.respondidaEn)));
  });

  const historial = seccion('Historial de versiones');
  const listaHistorial = crear('ul');
  for (const version of cotizacion.versiones) {
    listaHistorial.append(crear('li', { texto: `v${version.version} — ${ETIQUETAS_ESTADO[version.estado]} — ${formatearFechaHora(version.creadaEn)}${version.motivoCambio ? ` — ${version.motivoCambio}` : ''}` }));
  }
  historial.append(listaHistorial);
  contenedor.append(historial);

  if (cotizacion.estado === 'enviada_al_cliente') {
    const desenlace = seccion('Desenlace');
    const motivo = crear('input', { atributos: { placeholder: 'Motivo (obligatorio si se pierde)' } });
    desenlace.append(motivo);
    desenlace.append(botonAccion('Marcar como aceptada', () => contexto.datos.marcarDesenlace(cotizacion.id, 'aceptada'), refrescar));
    desenlace.append(botonAccion('Marcar como perdida', () => contexto.datos.marcarDesenlace(cotizacion.id, 'perdida', motivo.value.trim()), refrescar));
    contenedor.append(desenlace);
  }
}

export function renderizarDetalleCotizacion(
  contenedor: HTMLElement,
  contexto: ContextoVista,
  id: string,
  volver: () => void,
): void {
  const refrescar = (): void => renderizarDetalleCotizacion(contenedor, contexto, id, volver);
  cargarConEstados({
    contenedor,
    senal: contexto.senal,
    etiquetaCargando: 'Cargando cotización…',
    cargar: () => contexto.datos.obtenerCotizacion(id),
    renderizarDatos: (destino, cotizacion) => pintarDetalle(destino, contexto, cotizacion, volver, refrescar),
  });
}
