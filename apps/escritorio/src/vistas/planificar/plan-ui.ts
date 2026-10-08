/**
 * Renderiza la salida del motor: el Plan completo, siempre con la misma
 * estructura (MASTER_SPEC.md §2.2):
 *
 *   1. perfil operativo   2. dolores (hipótesis)   3. los 13 ordenados
 *   4. destacados 1-2-3   5. combos                6. encaje por producto
 *   7. adaptación         8. estrategia de entrada  9. argumentos
 *  10. preguntas de confirmación
 *
 * ⛔ El vendedor sólo ajusta el perfil operativo (confirma/corrige); el
 *    motor recalcula y esta vista MUESTRA QUÉ CAMBIÓ (regla M2/M6, F2 paso 9).
 * ⛔ Ningún dolor se presenta como hecho verificado: siempre con su etiqueta
 *    de hipótesis, en texto.
 * ⛔ El encaje se lee en texto, nunca sólo por color (QA_CHECKLIST §3.8, §7.4.4).
 */

import type {
  AjustePerfil,
  CambioPlan,
  ClaveIdempotencia,
  Combo,
  DolorInferido,
  Encaje,
  Plan,
  PosicionRanking,
  Probabilidad,
  ProductoId,
  Resultado,
} from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crearBloqueError, vaciarNodo } from './estados';
import { montarFormularioSugerencia } from './productos';

function nuevaClave(): ClaveIdempotencia {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ETIQUETA_ENCAJE: Readonly<Record<Encaje, string>> = {
  directo: 'Encaje directo',
  cercano: 'Encaje cercano — necesita un ajuste menor',
  adaptable: 'Encaje adaptable — necesita una adaptación real',
  no_recomendado: 'No recomendado para este negocio',
};

const ETIQUETA_PROBABILIDAD: Readonly<Record<Probabilidad, string>> = {
  tipica: 'Típico en este tipo de negocio',
  frecuente: 'Frecuente en este tipo de negocio',
  ocasional: 'Ocasional — conviene confirmarlo',
};

function nombreLegibleProducto(id: ProductoId): string {
  return id
    .split('-')
    .map((parte) => (parte === 'ia' ? 'IA' : parte.charAt(0).toUpperCase() + parte.slice(1)))
    .join(' ')
    .replace('24 7', '24/7');
}

interface EstadoPlanUI {
  plan: Plan;
  cambios: ReadonlyArray<CambioPlan> | null;
}

export function renderizarPlan(contexto: ContextoVista, contenedor: HTMLElement, planInicial: Plan): void {
  const estado: EstadoPlanUI = { plan: planInicial, cambios: null };
  dibujar();

  function dibujar(): void {
    vaciarNodo(contenedor);
    contenedor.className = 'planificar-plan';
    const { plan } = estado;

    const titulo = document.createElement('h2');
    titulo.textContent = `Plan para ${plan.entrada.nombre}`;
    contenedor.appendChild(titulo);

    if (estado.cambios && estado.cambios.length > 0) {
      const bloqueCambios = document.createElement('div');
      bloqueCambios.className = 'aviso';
      bloqueCambios.setAttribute('role', 'status');
      const tituloCambios = document.createElement('p');
      tituloCambios.textContent = 'Qué cambió con la corrección:';
      bloqueCambios.appendChild(tituloCambios);
      const listaCambios = document.createElement('ul');
      for (const cambio of estado.cambios) {
        const item = document.createElement('li');
        item.textContent = `${nombreLegibleProducto(cambio.productoId)}: ${cambio.motivo}`;
        listaCambios.appendChild(item);
      }
      bloqueCambios.appendChild(listaCambios);
      contenedor.appendChild(bloqueCambios);
    } else if (estado.cambios) {
      const sinCambios = document.createElement('p');
      sinCambios.className = 'aviso';
      sinCambios.setAttribute('role', 'status');
      sinCambios.textContent = 'La corrección no movió el ranking.';
      contenedor.appendChild(sinCambios);
    }

    contenedor.appendChild(seccionPerfil(plan));
    contenedor.appendChild(seccionDolores(plan.doloresInferidos));
    contenedor.appendChild(seccionDestacados(plan));
    contenedor.appendChild(seccionRanking(plan.ranking));
    if (plan.combos.length > 0) contenedor.appendChild(seccionCombos(plan.combos));
    contenedor.appendChild(seccionEstrategia(plan));
    if (plan.argumentos.length > 0) contenedor.appendChild(seccionArgumentos(plan));
    if (plan.preguntasConfirmacion.length > 0) contenedor.appendChild(seccionPreguntas(plan));
    contenedor.appendChild(seccionAcciones(plan));

    if (plan.ningunProductoEncaja) {
      const contenedorSugerencia = document.createElement('div');
      contenedor.appendChild(contenedorSugerencia);
      montarFormularioSugerencia({
        contexto,
        contenedor: contenedorSugerencia,
        productosSinEncaje: plan.ranking.slice(0, 3).map((p) => p.productoId),
        nombresProductos: new Map(plan.ranking.map((p) => [p.productoId, nombreLegibleProducto(p.productoId)])),
      });
    }
  }

  function seccionPerfil(plan: Plan): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Cómo funciona este negocio';
    seccion.appendChild(h3);
    if (plan.perfilOperativo.actividadEsNueva) {
      const nuevo = document.createElement('p');
      nuevo.className = 'dato dato--inferido';
      nuevo.textContent = `"${plan.perfilOperativo.nombreActividad}" es un rubro nuevo para la taxonomía: quedó registrado como pendiente de revisión y ya es usable.`;
      seccion.appendChild(nuevo);
    }
    const resumen = document.createElement('p');
    resumen.textContent = plan.perfilOperativo.resumen;
    seccion.appendChild(resumen);

    const formulario = document.createElement('form');
    formulario.className = 'planificar-form planificar-ajuste';
    const lista = document.createElement('ul');
    lista.className = 'lista';
    const seleccion = new Map<string, 'true' | 'false' | 'null'>();
    for (const operacion of plan.perfilOperativo.operaciones) {
      seleccion.set(operacion.operacionId, operacion.presente === true ? 'true' : operacion.presente === false ? 'false' : 'null');
      const item = document.createElement('li');
      const etiqueta = document.createElement('span');
      etiqueta.textContent = operacion.nombre;
      const select = document.createElement('select');
      select.className = 'entrada';
      select.setAttribute('aria-label', `¿${operacion.nombre.toLowerCase()}?`);
      for (const [valor, texto] of [['true', 'Sí'], ['false', 'No'], ['null', 'No sé']] as const) {
        const opcion = document.createElement('option');
        opcion.value = valor;
        opcion.textContent = texto;
        opcion.selected = seleccion.get(operacion.operacionId) === valor;
        select.appendChild(opcion);
      }
      select.addEventListener('change', () => seleccion.set(operacion.operacionId, select.value as 'true' | 'false' | 'null'));
      const motivo = document.createElement('p');
      motivo.className = 'texto-3';
      motivo.textContent = operacion.origen === 'inferido' ? `Supuesto: ${operacion.motivo}` : 'Confirmado por el vendedor.';
      item.append(etiqueta, select, motivo);
      lista.appendChild(item);
    }
    formulario.appendChild(lista);
    const botonRecalcular = document.createElement('button');
    botonRecalcular.type = 'submit';
    botonRecalcular.className = 'btn-borde';
    botonRecalcular.textContent = 'Corregir el perfil y recalcular';
    formulario.appendChild(botonRecalcular);
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const ajustes: AjustePerfil[] = [...seleccion.entries()]
        .filter(([, valor]) => valor !== 'null')
        .map(([operacionId, valor]) => ({ operacionId, presente: valor === 'true' }));
      void recalcular(ajustes);
    });
    seccion.appendChild(formulario);
    return seccion;
  }

  async function recalcular(ajustes: ReadonlyArray<AjustePerfil>): Promise<void> {
    const resultado = await contexto.datos.recalcularPlan(estado.plan, ajustes).catch(() => null);
    if (contexto.senal.aborted) return;
    if (!resultado || !resultado.ok) {
      const error = resultado?.ok === false
        ? resultado.error
        : { codigo: 'desconocido' as const, mensajeAmable: 'No se pudo recalcular el plan. Volvé a intentar.' };
      contenedor.prepend(crearBloqueError(error, () => void recalcular(ajustes)));
      return;
    }
    estado.plan = resultado.datos.plan;
    estado.cambios = resultado.datos.cambios;
    dibujar();
  }

  function seccionDolores(dolores: ReadonlyArray<DolorInferido>): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Dolores probables';
    seccion.appendChild(h3);
    if (dolores.length === 0) {
      seccion.appendChild(crearBloqueVacioLocal('Con el perfil actual no se identifican dolores probables. Confirmá alguna operación arriba para que el motor pueda inferir.'));
      return seccion;
    }
    const lista = document.createElement('ul');
    lista.className = 'lista';
    for (const dolor of dolores) {
      const item = document.createElement('li');
      const etiqueta = document.createElement('span');
      etiqueta.className = 'dato dato--inferido';
      etiqueta.textContent = 'Hipótesis, no un hecho verificado';
      const nombre = document.createElement('p');
      nombre.textContent = dolor.nombre;
      const probabilidad = document.createElement('span');
      probabilidad.className = `confianza confianza--${dolor.probabilidad === 'tipica' ? 'alta' : dolor.probabilidad === 'frecuente' ? 'media' : 'baja'}`;
      probabilidad.textContent = ETIQUETA_PROBABILIDAD[dolor.probabilidad];
      const motivo = document.createElement('p');
      motivo.className = 'texto-3';
      motivo.textContent = dolor.motivo;
      item.append(etiqueta, nombre, probabilidad, motivo);
      lista.appendChild(item);
    }
    seccion.appendChild(lista);
    return seccion;
  }

  function seccionDestacados(plan: Plan): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'planificar-destacados';
    const h3 = document.createElement('h3');
    h3.textContent = 'Por dónde empezar: 1, 2 y 3';
    seccion.appendChild(h3);
    const rejilla = document.createElement('div');
    rejilla.className = 'rejilla';
    for (const [indice, productoId] of plan.productosDestacados.entries()) {
      const posicion = plan.ranking.find((p) => p.productoId === productoId);
      const tarjeta = document.createElement('article');
      tarjeta.className = 'tarjeta';
      const titulo = document.createElement('h4');
      titulo.textContent = `${indice + 1}. ${nombreLegibleProducto(productoId)}`;
      const encaje = document.createElement('span');
      encaje.className = `encaje encaje--${(posicion?.encaje ?? 'directo').replace('_', '-')}`;
      encaje.textContent = ETIQUETA_ENCAJE[posicion?.encaje ?? 'directo'];
      const motivo = document.createElement('p');
      motivo.textContent = posicion?.motivo ?? '';
      tarjeta.append(titulo, encaje, motivo);
      rejilla.appendChild(tarjeta);
    }
    seccion.appendChild(rejilla);
    return seccion;
  }

  function seccionRanking(ranking: ReadonlyArray<PosicionRanking>): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Los 13 productos ordenados';
    seccion.appendChild(h3);
    const nota = document.createElement('p');
    nota.className = 'texto-3';
    nota.textContent = 'Del 1.º al 10.º: lista de trabajo. Del 11.º al 13.º: por qué no, para tenerlo a mano si el cliente pregunta.';
    seccion.appendChild(nota);
    const lista = document.createElement('ol');
    lista.className = 'ranking';
    for (const posicion of ranking) {
      const fila = document.createElement('li');
      fila.className = `ranking-fila${posicion.enTop10 ? '' : ' ranking-fila--fuera-de-top10'}`;
      const cabecera = document.createElement('div');
      cabecera.className = 'planificar-ranking-cabecera';
      const numero = document.createElement('span');
      numero.textContent = `${posicion.posicion}.º`;
      const nombre = document.createElement('span');
      nombre.textContent = nombreLegibleProducto(posicion.productoId);
      const encaje = document.createElement('span');
      encaje.className = `encaje encaje--${posicion.encaje.replace('_', '-')}`;
      encaje.textContent = ETIQUETA_ENCAJE[posicion.encaje];
      cabecera.append(numero, nombre, encaje);
      const motivo = document.createElement('p');
      motivo.textContent = posicion.motivo;
      fila.append(cabecera, motivo);
      if (posicion.adaptacionRequerida) {
        const adaptacion = document.createElement('p');
        adaptacion.className = 'texto-3';
        adaptacion.textContent = `Adaptación necesaria: ${posicion.adaptacionRequerida}`;
        fila.appendChild(adaptacion);
      }
      lista.appendChild(fila);
    }
    seccion.appendChild(lista);
    return seccion;
  }

  function seccionCombos(combos: ReadonlyArray<Combo>): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Combos sugeridos';
    seccion.appendChild(h3);
    const lista = document.createElement('ul');
    lista.className = 'lista';
    for (const combo of combos) {
      const item = document.createElement('li');
      const titulo = document.createElement('p');
      titulo.textContent = combo.ordenDeEntrada.map(nombreLegibleProducto).join(' + ');
      const argumento = document.createElement('p');
      argumento.className = 'texto-2';
      argumento.textContent = combo.argumentoUnificado;
      item.append(titulo, argumento);
      lista.appendChild(item);
    }
    seccion.appendChild(lista);
    return seccion;
  }

  function seccionEstrategia(plan: Plan): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Estrategia de entrada';
    seccion.appendChild(h3);
    const porDonde = document.createElement('p');
    porDonde.textContent = plan.estrategiaEntrada.porDondeEmpezar;
    const gancho = document.createElement('p');
    gancho.className = 'texto-2';
    gancho.textContent = `Gancho: ${plan.estrategiaEntrada.gancho}`;
    seccion.append(porDonde, gancho);
    if (plan.estrategiaEntrada.queEvitar) {
      const evitar = document.createElement('p');
      evitar.className = 'texto-3';
      evitar.textContent = `Qué evitar: ${plan.estrategiaEntrada.queEvitar}`;
      seccion.appendChild(evitar);
    }
    return seccion;
  }

  function seccionArgumentos(plan: Plan): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Argumentos';
    seccion.appendChild(h3);
    const lista = document.createElement('ul');
    lista.className = 'lista';
    for (const argumento of plan.argumentos) {
      const item = document.createElement('li');
      const nombre = document.createElement('p');
      nombre.textContent = nombreLegibleProducto(argumento.productoId);
      const texto = document.createElement('p');
      texto.textContent = argumento.texto;
      const cita = document.createElement('p');
      cita.className = 'texto-3';
      cita.textContent = `Ver en el copy aprobado: sección "${argumento.seccionCopy}".`;
      item.append(nombre, texto, cita);
      lista.appendChild(item);
    }
    seccion.appendChild(lista);
    return seccion;
  }

  function seccionPreguntas(plan: Plan): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Preguntas para confirmar con el cliente';
    seccion.appendChild(h3);
    const lista = document.createElement('ul');
    lista.className = 'lista';
    for (const pregunta of plan.preguntasConfirmacion) {
      const item = document.createElement('li');
      item.textContent = pregunta.pregunta;
      lista.appendChild(item);
    }
    seccion.appendChild(lista);
    return seccion;
  }

  function seccionAcciones(plan: Plan): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'planificar-acciones';
    const botonGuardar = document.createElement('button');
    botonGuardar.type = 'button';
    botonGuardar.className = 'btn';
    botonGuardar.textContent = 'Guardar este plan';
    const aviso = document.createElement('p');
    aviso.setAttribute('role', 'status');
    botonGuardar.addEventListener('click', () => {
      botonGuardar.disabled = true;
      void contexto.datos.guardarPlan(plan, nuevaClave()).then((resultado: Resultado<Plan>) => {
        botonGuardar.disabled = false;
        if (resultado.ok) {
          estado.plan = resultado.datos;
          aviso.textContent = 'Plan guardado. Andá a Clientes para vincularlo a un cliente nuevo o existente, o a Propuestas para armar la presentación.';
        } else {
          aviso.textContent = resultado.error.mensajeAmable;
        }
      });
    });
    const enlaceClientes = document.createElement('a');
    enlaceClientes.href = '#/clientes';
    enlaceClientes.className = 'btn-borde';
    enlaceClientes.textContent = 'Ir a Clientes';
    const enlacePropuestas = document.createElement('a');
    enlacePropuestas.href = '#/propuestas';
    enlacePropuestas.className = 'btn-borde';
    enlacePropuestas.textContent = 'Armar presentación';
    seccion.append(botonGuardar, enlaceClientes, enlacePropuestas, aviso);
    return seccion;
  }
}

function crearBloqueVacioLocal(mensaje: string): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'vacio';
  const parrafo = document.createElement('p');
  parrafo.textContent = mensaje;
  contenedor.appendChild(parrafo);
  return contenedor;
}
