/**
 * La vista pública del cliente — sin sesión, superficie mínima.
 *
 * Ésta es la pantalla que abre el cliente desde el enlace que le mandó el
 * vendedor. No hay navegación al Escritorio, no hay otros clientes, no hay
 * precios de terceros, y nunca se revela cuántas veces se abrió el enlace.
 *
 * Integración pendiente (fuera de esta sesión): el punto de entrada público
 * — detectar el token en la URL antes de levantar el ruteo autenticado — es
 * responsabilidad de `apps/escritorio/src/main.ts` (Sesión 1). Este módulo
 * sólo expone las dos funciones de montaje que ese punto de entrada tiene que
 * invocar con el `token` (y el `codigo`, si el enlace lo exige).
 */

import type { CapaPublica, ConstanciaRespuesta, OpcionRespuesta, RespuestaDelCliente } from '@labia/compartido';
import { TEXTOS_OPCION, TEXTO_ACEPTACION, TEXTO_BOTON_ENVIO } from '@labia/compartido';
import { crear, vaciar } from './dom';
import { formatearDinero, formatearFecha } from './formato';
import { nuevaClaveIdempotencia } from './ids';

const ORDEN_OPCIONES: ReadonlyArray<OpcionRespuesta> = [
  'estandar', 'adelantado_12', 'adelantado_24', 'diferido', 'contactar_antes', 'no_continuar',
];

function pantallaError(raiz: HTMLElement, mensaje: string): void {
  vaciar(raiz);
  const bloque = crear('div', { clase: 'propuestas-publico propuestas-error', atributos: { role: 'alert' } });
  bloque.append(crear('p', { texto: mensaje }));
  raiz.append(bloque);
}

function pieDeMarca(raiz: HTMLElement): void {
  raiz.append(crear('p', { clase: 'propuestas-publico__pie', texto: 'Lab.IA — RGrlk Group' }));
}

export function montarPresentacionPublica(raiz: HTMLElement, capa: CapaPublica, token: string, codigo?: string): void {
  vaciar(raiz);
  const cargando = crear('div', { clase: 'propuestas-cargando', atributos: { role: 'status' } });
  cargando.append(crear('span', { texto: 'Cargando…' }));
  raiz.append(cargando);

  capa.obtenerPresentacionPublica(token, codigo).then((resultado) => {
    if (!resultado.ok) {
      pantallaError(raiz, resultado.error.mensajeAmable);
      return;
    }
    const presentacion = resultado.datos;
    vaciar(raiz);
    const pagina = crear('div', { clase: 'propuestas-publico' });
    pagina.append(crear('h1', { texto: presentacion.titulo }));
    pagina.append(crear('p', { texto: `Preparado por ${presentacion.nombreVendedor} para ${presentacion.nombreCliente}.` }));
    pagina.append(crear('p', { clase: 'propuestas-meta', texto: `Emitida el ${formatearFecha(presentacion.emitidaEn)}` }));
    const productos = crear('ul');
    for (const producto of presentacion.productos) productos.append(crear('li', { texto: producto }));
    pagina.append(crear('h2', { texto: 'Productos' }), productos);
    if (presentacion.casosDeUso.length > 0) {
      const casos = crear('ul');
      for (const caso of presentacion.casosDeUso) casos.append(crear('li', { texto: caso }));
      pagina.append(crear('h2', { texto: 'Casos de uso' }), casos);
    }
    if (presentacion.rangoDeReferencia) {
      pagina.append(crear('p', { clase: 'propuestas-referencia', texto: `Rango de referencia (no es un precio definitivo): ${presentacion.rangoDeReferencia}` }));
    }
    pieDeMarca(pagina);
    raiz.append(pagina);
  });
}

function mostrarConstancia(raiz: HTMLElement, constancia: ConstanciaRespuesta): void {
  vaciar(raiz);
  const pagina = crear('div', { clase: 'propuestas-publico' });
  pagina.append(crear('h1', { texto: 'Gracias — tu elección quedó registrada' }));
  pagina.append(crear('p', { texto: TEXTOS_OPCION[constancia.opcionSeleccionada] }));
  if (constancia.importesAceptados) {
    pagina.append(crear('p', { texto: `Total: ${formatearDinero(constancia.importesAceptados.totalFinal)}` }));
  }
  pagina.append(crear('p', {
    clase: 'propuestas-aviso',
    texto: 'Esto es una constancia comercial (un aval de intención). No es un contrato ni una firma electrónica legal.',
  }));
  pieDeMarca(pagina);
  raiz.append(pagina);
}

export function montarCotizacionPublica(raiz: HTMLElement, capa: CapaPublica, token: string, codigo?: string): void {
  vaciar(raiz);
  const cargando = crear('div', { clase: 'propuestas-cargando', atributos: { role: 'status' } });
  cargando.append(crear('span', { texto: 'Cargando…' }));
  raiz.append(cargando);

  Promise.all([capa.obtenerCotizacionPublica(token, codigo), capa.obtenerConstanciaPublica(token)]).then(
    ([resultadoCotizacion, resultadoConstancia]) => {
      if (!resultadoCotizacion.ok) {
        pantallaError(raiz, resultadoCotizacion.error.mensajeAmable);
        return;
      }
      if (resultadoConstancia.ok && resultadoConstancia.datos) {
        mostrarConstancia(raiz, resultadoConstancia.datos);
        return;
      }
      const cotizacion = resultadoCotizacion.datos;
      vaciar(raiz);
      const pagina = crear('div', { clase: 'propuestas-publico' });
      pagina.append(crear('h1', { texto: `Cotización ${cotizacion.folio} · versión ${cotizacion.version}` }));
      pagina.append(crear('p', { texto: `Para: ${cotizacion.nombreCliente}` }));
      pagina.append(crear('p', { texto: `Producto: ${cotizacion.nombreProducto}${cotizacion.variante ? ` — ${cotizacion.variante}` : ''}` }));
      pagina.append(crear('p', { clase: 'propuestas-meta', texto: `Emitida el ${formatearFecha(cotizacion.emitidaEn)} · válida hasta el ${formatearFecha(cotizacion.venceEn)}` }));

      if (cotizacion.vencida) {
        pagina.append(crear('p', { clase: 'propuestas-error', atributos: { role: 'alert' }, texto: 'Esta oferta venció y ya no acepta respuesta. Comunicate con tu vendedor para una cotización nueva.' }));
        pieDeMarca(pagina);
        raiz.append(pagina);
        return;
      }

      const alternativasDisponibles = new Map(cotizacion.alternativas.map((a) => [a.codigo, a] as const));
      if (alternativasDisponibles.size > 0) {
        const tabla = crear('div', { clase: 'propuestas-tabla-contenedor' });
        const lista = crear('ul', { clase: 'propuestas-alternativas-publicas' });
        for (const alternativa of cotizacion.alternativas) {
          lista.append(crear('li', { texto: `${alternativa.nombre}: total ${formatearDinero(alternativa.totalFinal)} — ${alternativa.formaDePago}` }));
        }
        tabla.append(lista);
        pagina.append(tabla);
      }

      const formulario = crear('form', { clase: 'propuestas-formulario' });
      const grupoOpciones = crear('fieldset');
      grupoOpciones.append(crear('legend', { texto: 'Elegí una opción' }));
      const entradas: HTMLInputElement[] = [];
      for (const opcion of ORDEN_OPCIONES) {
        const esAlternativaFinanciera = opcion === 'estandar' || opcion === 'adelantado_12' || opcion === 'adelantado_24' || opcion === 'diferido';
        if (esAlternativaFinanciera && !alternativasDisponibles.has(opcion)) continue;
        const etiqueta = crear('label', { clase: 'propuestas-opcion-radio' });
        const radio = crear('input', { atributos: { type: 'radio', name: 'opcion-respuesta', value: opcion } });
        entradas.push(radio);
        etiqueta.append(radio, document.createTextNode(TEXTOS_OPCION[opcion]));
        grupoOpciones.append(etiqueta);
      }
      formulario.append(grupoOpciones);

      const etiquetaCasilla = crear('label', { clase: 'propuestas-checkbox' });
      const casillaAceptacion = crear('input', { atributos: { type: 'checkbox' } });
      etiquetaCasilla.append(casillaAceptacion, document.createTextNode(TEXTO_ACEPTACION));
      formulario.append(etiquetaCasilla);

      const zonaAviso = crear('p', { clase: 'propuestas-aviso', atributos: { role: 'alert' } });
      zonaAviso.hidden = true;
      formulario.append(zonaAviso);

      const botonEnviar = crear('button', { clase: 'propuestas-btn', texto: TEXTO_BOTON_ENVIO });
      botonEnviar.type = 'submit';
      botonEnviar.disabled = true;
      formulario.append(botonEnviar);

      function actualizarHabilitado(): void {
        const hayOpcion = entradas.some((e) => e.checked);
        botonEnviar.disabled = !(hayOpcion && casillaAceptacion.checked);
      }
      casillaAceptacion.addEventListener('change', actualizarHabilitado);
      for (const entrada of entradas) entrada.addEventListener('change', actualizarHabilitado);

      formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        if (!casillaAceptacion.checked) return;
        const elegida = entradas.find((e) => e.checked);
        if (!elegida) return;
        const respuesta: RespuestaDelCliente = { opcion: elegida.value as OpcionRespuesta, aceptacionMarcada: true };
        botonEnviar.disabled = true;
        capa.responderCotizacion(token, respuesta, nuevaClaveIdempotencia()).then((resultadoRespuesta) => {
          if (!resultadoRespuesta.ok) {
            zonaAviso.textContent = resultadoRespuesta.error.mensajeAmable;
            zonaAviso.hidden = false;
            actualizarHabilitado();
            return;
          }
          mostrarConstancia(raiz, resultadoRespuesta.datos);
        });
      });

      pagina.append(crear('h2', { texto: 'Bases y condiciones' }));
      pagina.append(crear('p', { texto: cotizacion.basesYCondiciones }));
      pagina.append(formulario);
      pieDeMarca(pagina);
      raiz.append(pagina);
    },
  );
}
