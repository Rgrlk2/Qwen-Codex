/**
 * Cáscara: barra lateral, barra inferior y cabecera.
 *
 * ⛔ DUEÑO: SESIÓN 2.
 *
 * - ≥ 900 px: barra lateral de 248 px con las vistas del rol.
 * - < 900 px: barra inferior de 64 px con los destinos de uso diario
 *   (`enBarraInferior: true` en rutas.ts: Inicio, Planificar, Clientes,
 *   Agenda) + "Más", que agrupa el resto (Propuestas, Dinero y, si el rol
 *   lo permite, Administración) en un `<dialog>`.
 *   Seis o siete íconos a 360 px dejan áreas táctiles bajo el mínimo de 44 px:
 *   por eso el quinto lugar es un menú, no un sexto ícono suelto.
 *
 * ⛔ La entrada a Administración se oculta para el vendedor Y la ruta se
 *    bloquea en guardia-rol.ts y en el servidor. Ocultar un enlace no protege.
 *
 * Convención con el núcleo (Sesión 1, `nucleo/contrato-vista.ts`):
 *   `export function crearDisposicion(opciones): Disposicion`.
 *   Mientras este archivo no exportaba eso, `main.ts` montaba una cáscara
 *   mínima provisional; a partir de acá usa ésta.
 *
 * No hay marca de navegación por producto: los íconos de sección no están
 * disponibles (docs/ASSET_SOURCES.md §1.5) y no se generan. Cada destino se
 * lee en texto.
 */

import type { Disposicion, OpcionesDisposicion } from './contrato-vista';

function href(ruta: string): string {
  return `#/${ruta}`;
}

interface DestinoNav {
  readonly ruta: string;
  readonly titulo: string;
  readonly enBarraInferior: boolean;
}

/** Construye el `<a>` de un destino de navegación, lateral o inferior. */
function crearEnlace(destino: DestinoNav, clase: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = clase;
  a.href = href(destino.ruta);
  a.dataset['ruta'] = destino.ruta;

  const texto = document.createElement('span');
  texto.textContent = destino.titulo;
  a.appendChild(texto);

  return a;
}

function marcarActivo(contenedor: HTMLElement, rutaActiva: string): void {
  for (const enlace of contenedor.querySelectorAll<HTMLAnchorElement>('[data-ruta]')) {
    if (enlace.dataset['ruta'] === rutaActiva) {
      enlace.setAttribute('aria-current', 'page');
    } else {
      enlace.removeAttribute('aria-current');
    }
  }
}

function crearLateral(opciones: OpcionesDisposicion): HTMLElement {
  const aside = document.createElement('aside');
  aside.className = 'lateral';
  aside.setAttribute('aria-label', 'Navegación principal');

  const marca = document.createElement('div');
  marca.className = 'lateral-marca';
  const img = document.createElement('img');
  img.src = '/assets/marca/logo-labia.webp';
  img.alt = 'Lab.IA';
  img.width = 96;
  img.height = 96;
  marca.appendChild(img);
  aside.appendChild(marca);

  if (opciones.datosDeEjemplo) {
    const chip = document.createElement('span');
    chip.className = 'chip-datos-ejemplo';
    chip.textContent = 'Datos de ejemplo';
    aside.appendChild(chip);
  }

  const nav = document.createElement('nav');
  nav.className = 'lateral-nav';
  nav.setAttribute('aria-label', 'Vistas');
  for (const destino of opciones.destinos) {
    nav.appendChild(crearEnlace(destino, 'lateral-enlace'));
  }
  aside.appendChild(nav);

  const pie = document.createElement('div');
  pie.className = 'lateral-pie';

  const nombre = document.createElement('p');
  nombre.className = 'lista-fila-detalle';
  nombre.textContent = `${opciones.nombreUsuario} · ${opciones.rol}`;
  pie.appendChild(nombre);

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-texto';
  boton.textContent = 'Cerrar sesión';
  boton.addEventListener('click', opciones.cerrarSesion);
  pie.appendChild(boton);

  aside.appendChild(pie);

  return aside;
}

function crearInferior(opciones: OpcionesDisposicion): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'inferior';
  nav.setAttribute('aria-label', 'Navegación principal');

  const fijas = opciones.destinos.filter((d) => d.enBarraInferior);
  const agrupadas = opciones.destinos.filter((d) => !d.enBarraInferior);

  for (const destino of fijas) {
    nav.appendChild(crearEnlace(destino, 'inferior-enlace'));
  }

  if (agrupadas.length > 0) {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'dialogo';
    dialogo.setAttribute('aria-label', 'Más destinos');

    const lista = document.createElement('div');
    lista.className = 'lista';
    for (const destino of agrupadas) {
      const enlace = crearEnlace(destino, 'lista-fila');
      enlace.addEventListener('click', () => dialogo.close());
      lista.appendChild(enlace);
    }
    dialogo.appendChild(lista);

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'btn-borde btn';
    cerrar.textContent = 'Cerrar';
    cerrar.addEventListener('click', () => dialogo.close());
    dialogo.appendChild(cerrar);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'inferior-enlace';
    boton.setAttribute('aria-haspopup', 'dialog');
    const texto = document.createElement('span');
    texto.textContent = 'Más';
    boton.appendChild(texto);
    boton.addEventListener('click', () => dialogo.showModal());

    nav.appendChild(boton);
    nav.appendChild(dialogo);
  }

  return nav;
}

/**
 * Monta la cáscara dentro de `opciones.raiz` y devuelve el contenedor donde
 * el núcleo monta la vista activa (docs/DESIGN_SYSTEM.md §6).
 */
export function crearDisposicion(opciones: OpcionesDisposicion): Disposicion {
  const { raiz } = opciones;
  raiz.replaceChildren();

  const envoltorio = document.createElement('div');
  envoltorio.className = 'app-cascara';

  envoltorio.appendChild(crearLateral(opciones));

  const principal = document.createElement('div');
  principal.className = 'principal';

  const contenido = document.createElement('main');
  contenido.id = 'contenido';
  contenido.className = 'vista';
  contenido.tabIndex = -1;
  principal.appendChild(contenido);

  envoltorio.appendChild(principal);
  envoltorio.appendChild(crearInferior(opciones));

  raiz.appendChild(envoltorio);

  return {
    contenido,
    marcarRuta(ruta: string): void {
      marcarActivo(envoltorio, ruta);
    },
    destruir(): void {
      raiz.replaceChildren();
    },
  };
}
