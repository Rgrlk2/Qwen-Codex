/**
 * Punto de entrada de la ÚNICA aplicación.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * Responsabilidad: montar la cáscara, inicializar el ruteo por hash con la
 * guardia de rol, resolver la sesión y elegir la implementación de CapaDatos.
 * Ninguna lógica de vista vive acá.
 */

import '@labia/ui/base.css';

import type { Rol, Sesion } from '@labia/compartido';
import {
  esModuloDisposicion, esModuloVista,
  type ContextoVista, type Disposicion, type Vista,
} from './nucleo/contrato-vista';
import { RUTA_POR_DEFECTO, type Ruta } from './nucleo/rutas';
import {
  HASH_INGRESO, HASH_POR_DEFECTO, hashDeRuta, resolverAcceso, rutasVisibles,
} from './nucleo/guardia-rol';
import { capaDatos } from './datos/proveedor';
import { crearVista as crearVistaIngreso } from './vistas/ingreso/vista';

/**
 * Los módulos de vista, por ruta.
 *
 * `Ruta.modulo` declara la misma ruta de archivo, pero un empaquetador necesita
 * la cadena escrita en el `import()` para poder dividir el paquete: por eso el
 * mapa se escribe acá y no se deriva de `rutas.ts`.
 * ⛔ El registro de rutas sigue siendo el de `rutas.ts`, que nadie edita.
 */
const MODULOS: Readonly<Record<string, () => Promise<unknown>>> = {
  inicio: () => import('./vistas/inicio/vista'),
  planificar: () => import('./vistas/planificar/vista'),
  clientes: () => import('./vistas/clientes/vista'),
  agenda: () => import('./vistas/agenda/vista'),
  propuestas: () => import('./vistas/propuestas/vista'),
  dinero: () => import('./vistas/dinero/vista'),
  administracion: () => import('./vistas/administracion/vista'),
};

const { capa, datosDeEjemplo, origen } = capaDatos();

let sesion: Sesion | null = null;
let disposicion: Disposicion | null = null;
let vistaActiva: Vista | null = null;
let control: AbortController | null = null;
/** Evita que una navegación vieja pise a una nueva. */
let generacion = 0;

function raizApp(): HTMLElement {
  const encontrada = document.getElementById('app');
  if (encontrada) return encontrada;
  const creada = document.createElement('div');
  creada.id = 'app';
  document.body.appendChild(creada);
  return creada;
}

function desmontarVista(): void {
  control?.abort();
  control = null;
  if (vistaActiva) {
    vistaActiva.desmontar();
    vistaActiva = null;
  }
}

function destruirDisposicion(): void {
  disposicion?.destruir();
  disposicion = null;
}

// ---------------------------------------------------------------------------
// Cáscara mínima provisional
// ---------------------------------------------------------------------------

/**
 * Mientras `nucleo/disposicion.ts` (Sesión 2) no exporte `crearDisposicion`,
 * el núcleo monta esto: un contenedor con los destinos que el rol puede ver y
 * el chip "Datos de ejemplo".
 *
 * ⛔ No es la interfaz definitiva ni pretende serlo: es lo mínimo para que la
 *    aplicación sea navegable y la guardia se pueda probar de punta a punta.
 */
function disposicionMinima(
  raiz: HTMLElement,
  rol: Rol,
  nombreUsuario: string,
  alCerrarSesion: () => void,
): Disposicion {
  raiz.replaceChildren();

  const marco = document.createElement('div');
  marco.className = 'marco';

  const encabezado = document.createElement('header');
  encabezado.className = 'encabezado';

  const titulo = document.createElement('strong');
  titulo.textContent = 'Escritorio Vendedores';
  encabezado.appendChild(titulo);

  if (datosDeEjemplo) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = 'Datos de ejemplo';
    encabezado.appendChild(chip);
  }

  const navegacion = document.createElement('nav');
  navegacion.className = 'lateral';
  navegacion.setAttribute('aria-label', 'Secciones del Escritorio');
  const lista = document.createElement('ul');
  const enlaces = new Map<string, HTMLAnchorElement>();
  /** ⛔ Sólo los destinos del rol: la guardia ya filtró. */
  for (const ruta of rutasVisibles(rol)) {
    const item = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.href = hashDeRuta(ruta.ruta);
    enlace.textContent = ruta.titulo;
    enlaces.set(ruta.ruta, enlace);
    item.appendChild(enlace);
    lista.appendChild(item);
  }
  navegacion.appendChild(lista);

  const quien = document.createElement('span');
  quien.textContent = `${nombreUsuario} · ${rol}`;
  const salir = document.createElement('button');
  salir.type = 'button';
  salir.className = 'btn-texto';
  salir.textContent = 'Cerrar sesión';
  salir.addEventListener('click', alCerrarSesion);
  encabezado.append(quien, salir);

  const contenido = document.createElement('main');
  contenido.className = 'principal';
  contenido.id = 'contenido';
  contenido.tabIndex = -1;

  marco.append(encabezado, navegacion, contenido);
  raiz.appendChild(marco);

  return {
    contenido,
    marcarRuta(ruta) {
      for (const [nombre, enlace] of enlaces) {
        if (nombre === ruta) enlace.setAttribute('aria-current', 'page');
        else enlace.removeAttribute('aria-current');
      }
    },
    destruir() { raiz.replaceChildren(); },
  };
}

async function montarDisposicion(raiz: HTMLElement, activa: Sesion): Promise<Disposicion> {
  const cerrar = (): void => { void cerrarSesion(); };
  try {
    const modulo: unknown = await import('./nucleo/disposicion');
    if (esModuloDisposicion(modulo)) {
      return modulo.crearDisposicion({
        raiz,
        rol: activa.rol,
        datosDeEjemplo,
        nombreUsuario: activa.usuario.nombre,
        destinos: rutasVisibles(activa.rol).map((r) => ({
          ruta: r.ruta, titulo: r.titulo, enBarraInferior: r.enBarraInferior,
        })),
        cerrarSesion: cerrar,
      });
    }
  } catch {
    /* La cáscara de la Sesión 2 todavía no existe: se usa la mínima. */
  }
  return disposicionMinima(raiz, activa.rol, activa.usuario.nombre, cerrar);
}

// ---------------------------------------------------------------------------
// Mensajes del núcleo: rechazo por rol, ruta inexistente, vista en construcción
// ---------------------------------------------------------------------------

/**
 * ⛔ Un rechazo de la guardia NO es una pantalla en blanco ni una redirección
 *    silenciosa: se dice qué pasó y se ofrece la salida.
 */
function mensajeDelNucleo(
  destino: HTMLElement,
  titulo: string,
  detalle: string,
  accion: { readonly texto: string; readonly hash: string } | null,
): void {
  destino.replaceChildren();
  const caja = document.createElement('section');
  caja.className = 'vista aviso';
  caja.setAttribute('role', 'alert');

  const h1 = document.createElement('h1');
  h1.textContent = titulo;
  const p = document.createElement('p');
  p.textContent = detalle;
  caja.append(h1, p);

  if (accion) {
    const enlace = document.createElement('a');
    enlace.className = 'btn';
    enlace.href = accion.hash;
    enlace.textContent = accion.texto;
    caja.appendChild(enlace);
  }
  destino.appendChild(caja);
  destino.focus();
}

// ---------------------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------------------

async function montarRuta(ruta: Ruta, activa: Sesion, destino: HTMLElement, mia: number): Promise<void> {
  const cargador = MODULOS[ruta.ruta];
  if (!cargador) {
    mensajeDelNucleo(
      destino,
      'Sección no disponible',
      `La sección ${ruta.titulo} todavía no está conectada al Escritorio.`,
      { texto: 'Volver a Inicio', hash: HASH_POR_DEFECTO },
    );
    return;
  }

  let modulo: unknown;
  try {
    modulo = await cargador();
  } catch {
    modulo = null;
  }
  if (mia !== generacion) return;

  if (!esModuloVista(modulo)) {
    /** La vista es de otra sesión y todavía no exporta `crearVista`. */
    mensajeDelNucleo(
      destino,
      `${ruta.titulo}: en construcción`,
      `Esta sección la está construyendo la ${ruta.sesion}. El resto del Escritorio funciona con normalidad.`,
      { texto: 'Volver a Inicio', hash: HASH_POR_DEFECTO },
    );
    return;
  }

  control = new AbortController();
  const contexto: ContextoVista = {
    datos: capa,
    raiz: destino,
    rol: activa.rol,
    senal: control.signal,
    datosDeEjemplo,
  };
  const vista = modulo.crearVista();
  vistaActiva = vista;
  destino.replaceChildren();
  await vista.montar(contexto);
}

async function navegar(): Promise<void> {
  generacion += 1;
  const mia = generacion;
  desmontarVista();

  const raiz = raizApp();
  const acceso = resolverAcceso(window.location.hash, sesion?.rol ?? null);

  if (acceso.tipo === 'ingreso') {
    destruirDisposicion();
    control = new AbortController();
    const vista = crearVistaIngreso({
      alIngresar(nueva) {
        sesion = nueva;
        const pedida = window.location.hash;
        const destinoTrasIngreso = resolverAcceso(pedida, nueva.rol);
        const hash = destinoTrasIngreso.tipo === 'permitida'
          ? hashDeRuta(destinoTrasIngreso.ruta.ruta)
          : HASH_POR_DEFECTO;
        if (window.location.hash === hash) void navegar();
        else window.location.hash = hash;
      },
    });
    vistaActiva = vista;
    /**
     * Todavía no hay rol: el ingreso es la única vista que no lo necesita y no
     * lo usa. Se pasa el rol de menor alcance, nunca `administrador`.
     */
    await vista.montar({
      datos: capa, raiz, rol: 'vendedor', senal: control.signal, datosDeEjemplo,
    });
    return;
  }

  const activa = sesion;
  if (!activa) { window.location.hash = HASH_INGRESO; return; }

  disposicion ??= await montarDisposicion(raiz, activa);
  if (mia !== generacion) return;
  const destino = disposicion.contenido;

  if (acceso.tipo === 'sin_permiso') {
    /**
     * ⛔ La guardia del ruteo. La de la capa de datos es independiente y
     *    también responde `sin_permiso`: ocultar el enlace no protege nada.
     */
    disposicion.marcarRuta('');
    mensajeDelNucleo(destino, acceso.mensaje, acceso.pista, {
      texto: 'Volver a Inicio', hash: HASH_POR_DEFECTO,
    });
    return;
  }

  if (acceso.tipo === 'desconocida') {
    disposicion.marcarRuta('');
    mensajeDelNucleo(destino, acceso.mensaje, `No existe la sección «${acceso.solicitada}». ${acceso.pista}`, {
      texto: 'Volver a Inicio', hash: HASH_POR_DEFECTO,
    });
    return;
  }

  disposicion.marcarRuta(acceso.ruta.ruta);
  await montarRuta(acceso.ruta, activa, destino, mia);
}

async function cerrarSesion(): Promise<void> {
  await capa.cerrarSesion();
  sesion = null;
  desmontarVista();
  destruirDisposicion();
  if (window.location.hash === HASH_INGRESO) void navegar();
  else window.location.hash = HASH_INGRESO;
}

/**
 * La puerta del cliente.
 *
 * ⛔ SE DECIDE ANTES QUE CUALQUIER OTRA COSA. El cliente no tiene cuenta: si
 *    el ruteo autenticado arrancara primero, lo mandaría a la pantalla de
 *    ingreso, que es lo último que tiene que ver alguien a quien le
 *    compartieron una cotización.
 *
 * ⛔ Y NO se monta nada del Escritorio: ni la disposición, ni el menú, ni la
 *    sesión. Lo único que existe en esta pantalla es su propia cotización.
 *
 * El enlace llega como `#/p/<token>` (y `#/p/<token>/<codigo>` cuando el
 * vendedor le puso código).
 */
const PREFIJO_PUBLICO = '#/p/';

function enlaceDelCliente(): { token: string; codigo?: string } | null {
  const hash = window.location.hash;
  if (!hash.startsWith(PREFIJO_PUBLICO)) return null;
  const partes = hash.slice(PREFIJO_PUBLICO.length).split('/').filter(Boolean);
  const token = decodeURIComponent(partes[0] ?? '').trim();
  if (token === '') return null;
  const codigo = partes[1] === undefined ? undefined : decodeURIComponent(partes[1]);
  return codigo === undefined ? { token } : { token, codigo };
}

async function montarPuertaDelCliente(enlace: { token: string; codigo?: string }): Promise<void> {
  const { crearCapaPublicaSupabase } = await import('./datos/supabase/publico');
  const { montarCotizacionPublica } = await import('./vistas/propuestas/publico');
  const raiz = raizApp();
  raiz.replaceChildren();
  document.body.dataset['vista'] = 'publica';
  montarCotizacionPublica(
    raiz, crearCapaPublicaSupabase(), enlace.token, enlace.codigo,
  );
}

export async function iniciar(): Promise<void> {
  const enlace = enlaceDelCliente();
  if (enlace) {
    // ⛔ Y acá termina. No se registra `hashchange`: desde la pantalla del
    //    cliente no se navega a ninguna parte del Escritorio.
    await montarPuertaDelCliente(enlace);
    return;
  }

  if (window.location.hash.trim() === '') {
    window.location.hash = hashDeRuta(RUTA_POR_DEFECTO);
  }
  window.addEventListener('hashchange', () => { void navegar(); });
  await navegar();
}

/** `origen` queda expuesto para diagnóstico: mock o HTTP, sin ambigüedad. */
export const ORIGEN_DATOS = origen;

void iniciar();
