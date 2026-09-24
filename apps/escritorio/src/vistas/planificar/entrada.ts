/**
 * Las dos puertas de entrada del motor (MASTER_SPEC.md §2.2, USER_FLOWS F2/F2b/F3):
 *
 *   A) Conocido — una empresa o un profesional: basta con lo mínimo que el
 *      vendedor tiene a mano (RUC, razón social o nombre comercial para una
 *      empresa; nombre + profesión para un profesional. Matrícula y ciudad
 *      SÓLO si las tiene).
 *   B) Rubro — texto libre. Acepta cualquier cosa: "motel", "gomería",
 *      "criadero de pollos". Nunca lo rechaza.
 *
 * Las dos llaman a `investigarObjetivo`: el vendedor no completa el perfil a
 * mano, sólo confirma, corrige o agrega sobre lo que vuelve armado.
 */

import type { EntradaObjetivo, InvestigacionObjetivo, Resultado } from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crearBloqueCargando, crearBloqueError, vaciarNodo } from './estados';
import { renderizarInvestigacion } from './investigacion-ui';

type TipoConocido = 'empresa' | 'profesional';

function campoTexto(id: string, etiquetaTexto: string, opciones: { obligatorio?: boolean; ayuda?: string } = {}): { campo: HTMLElement; entrada: HTMLInputElement } {
  const campo = document.createElement('div');
  campo.className = 'campo';
  const etiqueta = document.createElement('label');
  etiqueta.htmlFor = id;
  etiqueta.textContent = opciones.obligatorio ? `${etiquetaTexto} *` : etiquetaTexto;
  const entrada = document.createElement('input');
  entrada.type = 'text';
  entrada.id = id;
  entrada.className = 'entrada';
  campo.append(etiqueta, entrada);
  if (opciones.ayuda) {
    const ayuda = document.createElement('p');
    ayuda.className = 'texto-3';
    ayuda.textContent = opciones.ayuda;
    campo.appendChild(ayuda);
  }
  return { campo, entrada };
}

/**
 * Cuál de las dos puertas pidió Inicio, leída de la dirección.
 *
 * ⛔ Se lee del `hash` y no de `location.search`: toda la navegación del
 *    Escritorio vive después del `#`, así que el parámetro llega como
 *    `#/planificar?entrada=conocido`. Leerlo del lugar equivocado devuelve
 *    siempre vacío, que es como si no estuviera.
 */
function entradaPedidaEnLaDireccion(): 'conocido' | 'rubro' | null {
  const hash = window.location.hash;
  const corte = hash.indexOf('?');
  if (corte === -1) return null;
  const valor = new URLSearchParams(hash.slice(corte + 1)).get('entrada');
  return valor === 'conocido' || valor === 'rubro' ? valor : null;
}

export function montarEntrada(contexto: ContextoVista, contenedor: HTMLElement): void {
  vaciarNodo(contenedor);
  contenedor.className = 'planificar-entrada';

  const acciones = document.createElement('div');
  acciones.className = 'rejilla planificar-acciones-protagonistas';

  const areaFormulario = document.createElement('div');
  areaFormulario.className = 'planificar-formulario-activo';
  const areaResultado = document.createElement('div');
  areaResultado.setAttribute('aria-live', 'polite');

  const botonConocido = crearAccionProtagonista(
    '🔍',
    'Investigar una empresa o un profesional que conozco',
    '"Mi amigo tiene una repuestera", "mi odontóloga", "el hotel de la esquina".',
    () => mostrarFormularioConocido(),
  );
  const botonRubro = crearAccionProtagonista(
    '🧭',
    'Explorar oportunidades por rubro',
    '"Quiero ver qué le puedo vender a las peluquerías", "gomerías", "moteles".',
    () => mostrarFormularioRubro(),
  );
  acciones.append(botonConocido, botonRubro);
  contenedor.append(acciones, areaFormulario, areaResultado);

  // ⛔ ESTO FALTABA, Y ERA LO QUE HACÍA PARECER QUE NADA FUNCIONABA.
  //
  //    Desde Inicio, los dos botones grandes llevan a `#/planificar?entrada=conocido`
  //    y `?entrada=rubro`. Pero esta pantalla ignoraba el parámetro y volvía a
  //    dibujar LOS MISMOS DOS BOTONES. El vendedor apretaba "Investigar una
  //    empresa que conozco", llegaba acá, y veía otra vez el mismo botón: para
  //    llegar al campo donde se escribe la empresa había que apretar dos veces
  //    lo mismo, sin ninguna señal de que hubiera que hacerlo.
  //
  //    Ahora, si Inicio ya dijo cuál eligió, se abre ese formulario directo y
  //    el cursor queda en el primer campo. Si entró por el menú lateral, sin
  //    decir cuál quiere, siguen apareciendo las dos opciones como antes.
  const eleccionDeInicio = entradaPedidaEnLaDireccion();
  if (eleccionDeInicio === 'conocido') mostrarFormularioConocido();
  else if (eleccionDeInicio === 'rubro') mostrarFormularioRubro();

  function crearAccionProtagonista(icono: string, titulo: string, ejemplo: string, onActivar: () => void): HTMLButtonElement {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'tarjeta accion-protagonista';
    const spanIcono = document.createElement('span');
    spanIcono.setAttribute('aria-hidden', 'true');
    spanIcono.textContent = icono;
    const h3 = document.createElement('h3');
    h3.textContent = titulo;
    const p = document.createElement('p');
    p.textContent = ejemplo;
    boton.append(spanIcono, h3, p);
    boton.addEventListener('click', onActivar);
    return boton;
  }

  function mostrarFormularioConocido(): void {
    vaciarNodo(areaFormulario);
    vaciarNodo(areaResultado);
    let tipo: TipoConocido = 'empresa';

    const selector = document.createElement('div');
    selector.className = 'pestanas';
    selector.setAttribute('role', 'tablist');
    selector.setAttribute('aria-label', 'Tipo de conocido');
    const tabEmpresa = crearPestana('Empresa', true);
    const tabProfesional = crearPestana('Profesional', false);
    selector.append(tabEmpresa, tabProfesional);

    const camposEmpresa = document.createElement('div');
    const ruc = campoTexto('entrada-ruc', 'RUC', { ayuda: 'Basta con uno de los tres: RUC, razón social o nombre comercial.' });
    const razonSocial = campoTexto('entrada-razon-social', 'Razón social');
    const nombreComercial = campoTexto('entrada-nombre-comercial', 'Nombre comercial');
    const ciudadEmpresa = campoTexto('entrada-ciudad-empresa', 'Ciudad (opcional)');
    camposEmpresa.append(ruc.campo, razonSocial.campo, nombreComercial.campo, ciudadEmpresa.campo);

    const camposProfesional = document.createElement('div');
    camposProfesional.hidden = true;
    const nombre = campoTexto('entrada-nombre', 'Nombre', { obligatorio: true });
    const profesion = campoTexto('entrada-profesion', 'Profesión o especialidad', { obligatorio: true });
    const matricula = campoTexto('entrada-matricula', 'Matrícula (sólo si la tenés a mano)');
    const ciudadProfesional = campoTexto('entrada-ciudad-profesional', 'Ciudad (sólo si la tenés a mano)');
    camposProfesional.append(nombre.campo, profesion.campo, matricula.campo, ciudadProfesional.campo);

    tabEmpresa.addEventListener('click', () => alternar('empresa'));
    tabProfesional.addEventListener('click', () => alternar('profesional'));
    function alternar(nuevoTipo: TipoConocido): void {
      tipo = nuevoTipo;
      tabEmpresa.setAttribute('aria-selected', String(nuevoTipo === 'empresa'));
      tabProfesional.setAttribute('aria-selected', String(nuevoTipo === 'profesional'));
      camposEmpresa.hidden = nuevoTipo !== 'empresa';
      camposProfesional.hidden = nuevoTipo !== 'profesional';
    }

    const formulario = document.createElement('form');
    formulario.className = 'planificar-form';
    const avisoValidacion = document.createElement('p');
    avisoValidacion.setAttribute('role', 'alert');
    const enviar = document.createElement('button');
    enviar.type = 'submit';
    enviar.className = 'btn';
    enviar.textContent = 'Investigar';
    formulario.append(selector, camposEmpresa, camposProfesional, avisoValidacion, enviar);
    areaFormulario.appendChild(formulario);
    // ⛔ El cursor va al primer campo. Si llegaste desde Inicio apretando
    //    "Investigar una empresa que conozco", lo que sigue es escribir el
    //    nombre: que haya que buscar dónde hacer clic es media pantalla
    //    perdida.
    formulario.querySelector('input')?.focus();

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      avisoValidacion.textContent = '';
      let entrada: EntradaObjetivo;
      if (tipo === 'empresa') {
        const rucValor = ruc.entrada.value.trim();
        const razonValor = razonSocial.entrada.value.trim();
        const nombreValor = nombreComercial.entrada.value.trim();
        if (!rucValor && !razonValor && !nombreValor) {
          avisoValidacion.textContent = 'Completá al menos uno: RUC, razón social o nombre comercial.';
          return;
        }
        entrada = {
          tipo: 'empresa',
          ...(rucValor ? { ruc: rucValor } : {}),
          ...(razonValor ? { razonSocial: razonValor } : {}),
          ...(nombreValor ? { nombreComercial: nombreValor } : {}),
          ...(ciudadEmpresa.entrada.value.trim() ? { ciudad: ciudadEmpresa.entrada.value.trim() } : {}),
        };
      } else {
        const nombreValor = nombre.entrada.value.trim();
        const profesionValor = profesion.entrada.value.trim();
        if (!nombreValor || !profesionValor) {
          avisoValidacion.textContent = 'Completá nombre y profesión o especialidad.';
          return;
        }
        entrada = {
          tipo: 'profesional',
          nombre: nombreValor,
          profesionOEspecialidad: profesionValor,
          ...(matricula.entrada.value.trim() ? { matricula: matricula.entrada.value.trim() } : {}),
          ...(ciudadProfesional.entrada.value.trim() ? { ciudad: ciudadProfesional.entrada.value.trim() } : {}),
        };
      }
      void investigar(entrada, enviar);
    });
  }

  function mostrarFormularioRubro(): void {
    vaciarNodo(areaFormulario);
    vaciarNodo(areaResultado);
    const formulario = document.createElement('form');
    formulario.className = 'planificar-form';
    const rubro = campoTexto('entrada-rubro', 'Rubro', { obligatorio: true, ayuda: 'Cualquier texto: "motel", "gomería", "criadero de pollos", lo que sea.' });
    const ciudad = campoTexto('entrada-rubro-ciudad', 'Ciudad (opcional)');
    const avisoValidacion = document.createElement('p');
    avisoValidacion.setAttribute('role', 'alert');
    const enviar = document.createElement('button');
    enviar.type = 'submit';
    enviar.className = 'btn';
    enviar.textContent = 'Explorar';
    formulario.append(rubro.campo, ciudad.campo, avisoValidacion, enviar);
    areaFormulario.appendChild(formulario);
    // ⛔ El cursor va al primer campo. Si llegaste desde Inicio apretando
    //    "Investigar una empresa que conozco", lo que sigue es escribir el
    //    nombre: que haya que buscar dónde hacer clic es media pantalla
    //    perdida.
    formulario.querySelector('input')?.focus();

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const rubroValor = rubro.entrada.value.trim();
      if (!rubroValor) {
        avisoValidacion.textContent = 'Escribí un rubro para explorar.';
        return;
      }
      const entrada: EntradaObjetivo = {
        tipo: 'rubro',
        rubro: rubroValor,
        ...(ciudad.entrada.value.trim() ? { ciudad: ciudad.entrada.value.trim() } : {}),
      };
      void investigar(entrada, enviar);
    });
  }

  async function investigar(entrada: EntradaObjetivo, boton: HTMLButtonElement): Promise<void> {
    boton.disabled = true;
    vaciarNodo(areaResultado);
    areaResultado.appendChild(crearBloqueCargando('Investigando fuentes públicas…'));
    const resultado = await contexto.datos.investigarObjetivo(entrada).catch((): Resultado<InvestigacionObjetivo> => ({
      ok: false,
      error: { codigo: 'desconocido', mensajeAmable: 'No se pudo completar la investigación. Volvé a intentar.' },
    }));
    boton.disabled = false;
    if (contexto.senal.aborted) return;
    vaciarNodo(areaResultado);
    if (!resultado.ok) {
      areaResultado.appendChild(crearBloqueError(resultado.error, () => void investigar(entrada, boton)));
      return;
    }
    renderizarInvestigacion({ contexto, contenedor: areaResultado, investigacionInicial: resultado.datos });
  }
}

function crearPestana(texto: string, seleccionada: boolean): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'pestana';
  boton.setAttribute('role', 'tab');
  boton.setAttribute('aria-selected', String(seleccionada));
  boton.textContent = texto;
  return boton;
}
