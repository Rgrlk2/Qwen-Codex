/**
 * La página de búsqueda. Una sola pantalla, limpia, con dos campos.
 *
 * ⛔ REESCRITA EL 25-09-2026 POR PEDIDO DEL CEO. Antes esta pantalla mostraba
 *    dos tarjetas grandes; al apretar una se abría un formulario de cuatro o
 *    cinco campos (RUC, razón social, nombre comercial, ciudad; o nombre,
 *    profesión, matrícula, ciudad). Para empezar a buscar había que completar
 *    un formulario. Ahora es esto:
 *
 *      "¿A qué cliente querés investigar?"  [ campo ]  🔍
 *      "¿Qué rubro querés investigar?"      [ campo ]  🔍
 *
 *    Nada más. Se aprieta la lupa y el motor arranca.
 *
 * ⛔ LOS DEMÁS DATOS NO SE PERDIERON: la ciudad, el teléfono y "a qué se
 *    dedica" los pide el RESULTADO, que es donde el vendedor ya tiene algo
 *    delante para corregir. Pedirlos antes es pedirle que llene una ficha a
 *    ciegas.
 *
 * Las dos puertas siguen siendo las mismas del MASTER_SPEC §2.2 (USER_FLOWS
 * F2/F2b/F3): un conocido, o un rubro entero. Cambió cómo se entra, no adónde.
 */

import type { EntradaObjetivo, InvestigacionObjetivo, Resultado } from '@labia/compartido';
import { crearIconoSvg } from '@labia/ui/iconos';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crearBloqueCargando, crearBloqueError, vaciarNodo } from './estados';
import { renderizarInvestigacion } from './investigacion-ui';

/**
 * ¿El texto es un RUC y no un nombre?
 *
 * En Paraguay el RUC es una tira de dígitos con un dígito verificador al final,
 * a veces con guion: 80012345-6, 4567890-1. Si lo es, se manda como RUC; si no,
 * como nombre. ⛔ No se le pregunta al vendedor cuál de los dos escribió: lo
 * escribió y listo.
 */
function pareceRuc(texto: string): boolean {
  return /^\d{4,9}-?\d?$/.test(texto.replace(/\s+/g, ''));
}

interface CampoDeBusqueda {
  readonly bloque: HTMLElement;
  readonly entrada: HTMLInputElement;
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
  contenedor.className = 'buscador';

  const encabezado = document.createElement('div');
  encabezado.className = 'buscador-encabezado';

  /* La iconografía chica que pidió el CEO: una marca de agua, no un cartel. */
  const marca = document.createElement('span');
  marca.className = 'buscador-marca';
  marca.setAttribute('aria-hidden', 'true');
  marca.appendChild(crearIconoSvg('buscar'));
  encabezado.appendChild(marca);

  const explicacion = document.createElement('p');
  explicacion.className = 'buscador-explicacion';
  explicacion.textContent =
    'Escribí un nombre o un rubro y apretá la lupa. El motor arma solo el perfil, '
    + 'los dolores probables y qué productos de Lab.IA le encajan.';
  encabezado.appendChild(explicacion);

  const areaResultado = document.createElement('div');
  areaResultado.className = 'buscador-resultado';
  areaResultado.setAttribute('aria-live', 'polite');

  /**
   * ⛔ ESTE ENVOLTORIO NO ES DE ADORNO.
   *
   *    `renderizarInvestigacion` le PISA LA CLASE al nodo que recibe: le pone
   *    `planificar-investigacion`. Si se le pasara `areaResultado` directo, el
   *    resultado se dibujaría igual, pero `areaResultado` dejaría de llamarse
   *    `buscador-resultado` y perdería sus estilos para siempre — incluido el
   *    `:empty` que lo hace desaparecer cuando no hay nada.
   *
   *    Se lo descubrió con una comprobación automática, no mirando la pantalla:
   *    en el navegador no se ve, porque la investigación trae sus propios
   *    estilos encima.
   */
  const marco = document.createElement('div');
  areaResultado.appendChild(marco);

  const campoCliente = crearCampo({
    id: 'buscar-cliente',
    pregunta: '¿A qué cliente querés investigar?',
    ejemplo: 'El nombre de la empresa o del profesional. También sirve el RUC.',
    marcador: 'Ferretería El Tornillo, mi odontóloga, 80012345-6',
    aBuscar: (texto) => (pareceRuc(texto)
      ? { tipo: 'empresa', ruc: texto.replace(/\s+/g, '') }
      : { tipo: 'empresa', nombreComercial: texto }),
    avisoVacio: 'Escribí el nombre del cliente que querés investigar.',
  });

  const campoRubro = crearCampo({
    id: 'buscar-rubro',
    pregunta: '¿Qué rubro querés investigar?',
    ejemplo: 'Cualquier texto. No hay lista cerrada.',
    marcador: 'Peluquerías, gomerías, moteles, criaderos de pollos',
    aBuscar: (texto) => ({ tipo: 'rubro', rubro: texto }),
    avisoVacio: 'Escribí un rubro para explorar.',
  });

  contenedor.append(encabezado, campoCliente.bloque, campoRubro.bloque, areaResultado);

  /* Si Inicio ya dijo cuál eligió, el cursor arranca en ese campo. Si entró por
     el menú lateral, arranca en el primero, que es el caso más común. */
  const eleccion = entradaPedidaEnLaDireccion();
  (eleccion === 'rubro' ? campoRubro : campoCliente).entrada.focus();

  function crearCampo(opciones: {
    readonly id: string;
    readonly pregunta: string;
    readonly ejemplo: string;
    readonly marcador: string;
    readonly aBuscar: (texto: string) => EntradaObjetivo;
    readonly avisoVacio: string;
  }): CampoDeBusqueda {
    const bloque = document.createElement('form');
    bloque.className = 'buscador-campo';

    const pregunta = document.createElement('label');
    pregunta.className = 'buscador-pregunta';
    pregunta.htmlFor = opciones.id;
    pregunta.textContent = opciones.pregunta;

    const caja = document.createElement('div');
    caja.className = 'buscador-caja';

    const entrada = document.createElement('input');
    entrada.type = 'search';
    entrada.id = opciones.id;
    entrada.className = 'buscador-entrada';
    entrada.placeholder = opciones.marcador;
    /* El teclado del celular no corrige ni pone mayúsculas: son nombres
       propios y rubros, no prosa. */
    entrada.autocapitalize = 'off';
    entrada.autocomplete = 'off';
    entrada.spellcheck = false;

    const lupa = document.createElement('button');
    lupa.type = 'submit';
    lupa.className = 'buscador-lupa';
    /* ⛔ El botón es sólo un ícono: sin este nombre, un lector de pantalla
       anuncia "botón" y nada más. */
    lupa.setAttribute('aria-label', opciones.pregunta);
    lupa.appendChild(crearIconoSvg('buscar'));

    caja.append(entrada, lupa);

    const ejemplo = document.createElement('p');
    ejemplo.className = 'buscador-ejemplo';
    ejemplo.textContent = opciones.ejemplo;

    const aviso = document.createElement('p');
    aviso.className = 'buscador-aviso';
    aviso.setAttribute('role', 'alert');

    bloque.append(pregunta, caja, ejemplo, aviso);

    bloque.addEventListener('submit', (evento) => {
      evento.preventDefault();
      aviso.textContent = '';
      const texto = entrada.value.trim();
      if (!texto) {
        aviso.textContent = opciones.avisoVacio;
        entrada.focus();
        return;
      }
      void investigar(opciones.aBuscar(texto), lupa);
    });

    return { bloque, entrada };
  }

  async function investigar(entrada: EntradaObjetivo, boton: HTMLButtonElement): Promise<void> {
    boton.disabled = true;
    vaciarNodo(marco);
    marco.className = '';
    marco.appendChild(crearBloqueCargando('Investigando fuentes públicas…'));
    /* El resultado aparece abajo: en el celular, si no se acompaña, queda
       fuera de pantalla y parece que no pasó nada.
       ⛔ Con `?.` porque esto también corre donde no hay pantalla — en las
          verificaciones automáticas — y ahí `scrollIntoView` no existe. Sin el
          `?.`, la búsqueda entera se cae con un error que en el navegador
          nunca pasa y que por eso nadie encontraría. */
    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    areaResultado.scrollIntoView?.({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'start' });
    const resultado = await contexto.datos.investigarObjetivo(entrada).catch((): Resultado<InvestigacionObjetivo> => ({
      ok: false,
      error: { codigo: 'desconocido', mensajeAmable: 'No se pudo completar la investigación. Volvé a intentar.' },
    }));
    boton.disabled = false;
    if (contexto.senal.aborted) return;
    vaciarNodo(marco);
    if (!resultado.ok) {
      marco.className = '';
      marco.appendChild(crearBloqueError(resultado.error, () => void investigar(entrada, boton)));
      return;
    }
    renderizarInvestigacion({ contexto, contenedor: marco, investigacionInicial: resultado.datos });
  }
}
