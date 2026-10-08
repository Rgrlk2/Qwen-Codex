/**
 * Cáscara: barra lateral, barra inferior y cabecera.
 *
 * ⛔ DUEÑO: SESIÓN 2.
 *
 * - ≥ 900 px: barra lateral retráctil. Expandida: ícono + texto, 248 px.
 *   Compacta: sólo íconos, 76 px. Un control fijo la abre y la cierra, y la
 *   elección se recuerda en `localStorage` (conveniencia por navegador: si el
 *   storage no está disponible —modo privado, permisos—, la cáscara sigue
 *   funcionando expandida, que es el arranque esperado).
 * - < 900 px: barra inferior de 64 px con los destinos de uso diario
 *   (`enBarraInferior: true` en rutas.ts: Inicio, Planificar, Clientes,
 *   Agenda) + "Más", que agrupa el resto (Propuestas, Dinero y, si el rol
 *   lo permite, Administración) en un `<dialog>`. No tapa contenido: la
 *   propia vista reserva el espacio con `padding-bottom` (base.css `.vista`).
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
 * Íconos: una única familia SVG en línea, sin emojis (`@labia/ui/iconos`).
 * Ningún ícono de sección existía en el inventario de marca —no se generan
 * marcas, éstos son formas genéricas de interfaz— (docs/ASSET_SOURCES.md §1.5).
 */

import { crearIconoEnvuelto, crearIconoSvg, type NombreIcono } from '@labia/ui/iconos';
import type { Disposicion, OpcionesDisposicion } from './contrato-vista';

const CLAVE_LATERAL_COMPACTA = 'labia.escritorio.lateral-compacta';

/** Un ícono de interfaz por ruta. Puramente genérico: ver ASSET_SOURCES §1.5. */
const ICONO_POR_RUTA: Readonly<Record<string, NombreIcono>> = {
  inicio: 'inicio',
  planificar: 'planificar',
  clientes: 'clientes',
  agenda: 'agenda',
  propuestas: 'propuestas',
  dinero: 'dinero',
  administracion: 'administracion',
};

function href(ruta: string): string {
  return `#/${ruta}`;
}

interface DestinoNav {
  readonly ruta: string;
  readonly titulo: string;
  readonly enBarraInferior: boolean;
}

function leerPreferenciaCompacta(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_LATERAL_COMPACTA) === '1';
  } catch {
    return false;
  }
}

function guardarPreferenciaCompacta(compacta: boolean): void {
  try {
    window.localStorage.setItem(CLAVE_LATERAL_COMPACTA, compacta ? '1' : '0');
  } catch {
    /** Sin storage disponible (privado, permisos): la cáscara sigue andando. */
  }
}

type EstiloEnlace = 'lateral' | 'inferior' | 'lista';

const CLASE_ENLACE: Readonly<Record<EstiloEnlace, string>> = {
  lateral: 'lateral-enlace',
  inferior: 'inferior-enlace',
  lista: 'lista-fila',
};
const CLASE_TEXTO_ENLACE: Readonly<Record<EstiloEnlace, string>> = {
  lateral: 'lateral-enlace-texto',
  inferior: 'inferior-enlace-texto',
  lista: 'lista-fila-titulo',
};

/** Construye el `<a>` de un destino de navegación: lateral, inferior o el menú "Más". */
function crearEnlace(destino: DestinoNav, estilo: EstiloEnlace, tamanoIcono: 'sm' | 'md'): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = CLASE_ENLACE[estilo];
  a.href = href(destino.ruta);
  a.dataset['ruta'] = destino.ruta;
  a.setAttribute('aria-label', destino.titulo);

  const nombreIcono = ICONO_POR_RUTA[destino.ruta] ?? 'planificar';
  a.appendChild(crearIconoEnvuelto(nombreIcono, tamanoIcono));

  const texto = document.createElement('span');
  texto.className = CLASE_TEXTO_ENLACE[estilo];
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

/** Iniciales para el avatar: primera letra de la primera y de la última palabra. */
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primera = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primera + ultima).toUpperCase();
}

/**
 * Avatar del vendedor: fotografía si hay `fotoUrl`, si no, iniciales sobre
 * degradado azul→cian con la profundidad del sistema de íconos. El espacio
 * ya está reservado para la fotografía real: hoy `Usuario` no trae una URL
 * (pedido en docs/PEDIDOS.md, sección S2) y por eso `fotoUrl` no llega desde
 * ningún llamador todavía, pero el componente ya sabe usarla en cuanto exista.
 */
function crearAvatar(nombre: string, tamano: 'sm' | 'md' | 'lg' = 'md', fotoUrl?: string): HTMLElement {
  const avatar = document.createElement('div');
  avatar.className = `avatar avatar--${tamano}`;
  avatar.setAttribute('aria-hidden', 'true');

  if (fotoUrl) {
    const foto = document.createElement('img');
    foto.className = 'avatar-foto';
    foto.src = fotoUrl;
    foto.alt = '';
    avatar.appendChild(foto);
  } else {
    const texto = document.createElement('span');
    texto.className = 'avatar-iniciales';
    texto.textContent = iniciales(nombre);
    avatar.appendChild(texto);
  }

  return avatar;
}

interface LateralConstruido {
  readonly aside: HTMLElement;
  readonly botonAlternar: HTMLButtonElement;
}

function crearLateral(opciones: OpcionesDisposicion, alAlternar: () => void): LateralConstruido {
  const aside = document.createElement('aside');
  aside.className = 'lateral';
  aside.setAttribute('aria-label', 'Navegación principal');

  const encabezado = document.createElement('div');
  encabezado.className = 'lateral-encabezado';

  const marca = document.createElement('div');
  marca.className = 'lateral-marca';
  const img = document.createElement('img');
  img.src = '/assets/marca/logo-labia.webp';
  img.alt = 'Lab.IA';
  img.width = 96;
  img.height = 96;
  marca.appendChild(img);
  const marcaTexto = document.createElement('span');
  marcaTexto.className = 'lateral-marca-texto';
  marcaTexto.textContent = 'Lab.IA';
  marca.appendChild(marcaTexto);
  encabezado.appendChild(marca);

  const alternar = document.createElement('button');
  alternar.type = 'button';
  alternar.className = 'lateral-alternar';
  alternar.appendChild(crearIconoSvg('chevron-izquierda'));
  alternar.addEventListener('click', alAlternar);
  encabezado.appendChild(alternar);

  aside.appendChild(encabezado);

  const nav = document.createElement('nav');
  nav.className = 'lateral-nav';
  nav.setAttribute('aria-label', 'Vistas');
  for (const destino of opciones.destinos) {
    nav.appendChild(crearEnlace(destino, 'lateral', 'sm'));
  }
  aside.appendChild(nav);

  const pie = document.createElement('div');
  pie.className = 'lateral-pie';

  const usuario = document.createElement('div');
  usuario.className = 'lateral-usuario';
  usuario.appendChild(crearAvatar(opciones.nombreUsuario, 'md'));

  const info = document.createElement('div');
  info.className = 'lateral-usuario-info';
  const nombre = document.createElement('p');
  nombre.className = 'lateral-usuario-nombre';
  nombre.textContent = opciones.nombreUsuario;
  info.appendChild(nombre);
  const rol = document.createElement('p');
  rol.className = 'lateral-usuario-rol';
  rol.textContent = opciones.rol;
  info.appendChild(rol);
  usuario.appendChild(info);
  pie.appendChild(usuario);

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn-texto';
  boton.appendChild(crearIconoSvg('cerrar-sesion'));
  const textoBoton = document.createElement('span');
  textoBoton.className = 'lateral-cerrar-texto';
  textoBoton.textContent = 'Cerrar sesión';
  boton.appendChild(textoBoton);
  boton.setAttribute('aria-label', 'Cerrar sesión');
  boton.addEventListener('click', opciones.cerrarSesion);
  pie.appendChild(boton);

  aside.appendChild(pie);

  return { aside, botonAlternar: alternar };
}

function crearInferior(opciones: OpcionesDisposicion): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'inferior';
  nav.setAttribute('aria-label', 'Navegación principal');

  const fijas = opciones.destinos.filter((d) => d.enBarraInferior);
  const agrupadas = opciones.destinos.filter((d) => !d.enBarraInferior);

  for (const destino of fijas) {
    nav.appendChild(crearEnlace(destino, 'inferior', 'sm'));
  }

  if (agrupadas.length > 0) {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'dialogo';
    dialogo.setAttribute('aria-label', 'Más destinos');

    const lista = document.createElement('div');
    lista.className = 'lista';
    for (const destino of agrupadas) {
      const enlace = crearEnlace(destino, 'lista', 'sm');
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
    boton.setAttribute('aria-label', 'Más destinos');
    boton.appendChild(crearIconoEnvuelto('mas', 'sm'));
    const texto = document.createElement('span');
    texto.className = 'inferior-enlace-texto';
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

  let compacta = leerPreferenciaCompacta();

  function aplicarEstadoCompacta(boton: HTMLButtonElement): void {
    envoltorio.classList.toggle('app-cascara--lateral-compacta', compacta);
    boton.setAttribute('aria-expanded', String(!compacta));
    boton.setAttribute('aria-label', compacta ? 'Expandir menú' : 'Contraer menú');
  }

  const { aside: lateral, botonAlternar } = crearLateral(opciones, () => {
    compacta = !compacta;
    guardarPreferenciaCompacta(compacta);
    aplicarEstadoCompacta(botonAlternar);
  });
  envoltorio.appendChild(lateral);
  aplicarEstadoCompacta(botonAlternar);

  const principal = document.createElement('div');
  principal.className = 'principal';

  /*
   * Encabezado fijo (diseño "Escritorio Lab.IA", Claude Design 2026-09-19).
   *
   * El título sale de `destinos`, que ya trae el nombre de cada ruta: la
   * cáscara no necesita conocer el registro de rutas para escribirlo.
   * ⛔ Acá vive el ÚNICO h1 de la aplicación, y el único chip de datos de
   *    ejemplo. Las vistas ya no escriben el suyo: eran dos de cada uno.
   */
  const encabezadoPrincipal = document.createElement('header');
  encabezadoPrincipal.className = 'encabezado';

  const grupoTitulo = document.createElement('div');
  grupoTitulo.className = 'encabezado-grupo';

  const rotulo = document.createElement('span');
  rotulo.className = 'encabezado-rotulo';
  rotulo.textContent = 'Escritorio vendedores';

  const titulo = document.createElement('h1');
  titulo.className = 'encabezado-titulo';
  titulo.tabIndex = -1;
  grupoTitulo.append(rotulo, titulo);
  encabezadoPrincipal.appendChild(grupoTitulo);

  if (opciones.datosDeEjemplo) {
    const chip = document.createElement('span');
    chip.className = 'chip-datos-ejemplo';
    chip.textContent = 'Datos de ejemplo';
    encabezadoPrincipal.appendChild(chip);
  }

  principal.appendChild(encabezadoPrincipal);

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
      const destino = opciones.destinos.find((d) => d.ruta === ruta);
      titulo.textContent = destino?.titulo ?? '';
      /* El foco va al título al cambiar de ruta: quien usa lector de
         pantalla escucha dónde quedó, en vez de volver al principio. */
      titulo.focus();
    },
    destruir(): void {
      raiz.replaceChildren();
    },
  };
}
