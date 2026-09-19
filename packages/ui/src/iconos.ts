/**
 * Sistema de íconos — una única familia, trazo, 24×24.
 *
 * ⛔ DUEÑO: SESIÓN 2.
 *
 * Reemplaza los emojis por íconos SVG propios, en línea, sin librería externa
 * (docs/ASSET_SOURCES.md §1.5: "SVG en línea. Sin biblioteca externa, sin
 * descarga, sin dependencia"). Son formas genéricas de interfaz —lupa,
 * brújula, calendario, documento, tarjeta, escudo, personas—, no una marca:
 * no hay nada acá que identifique a Lab.IA, a RGrlk ni a la referencia
 * operativa, así que no compite con `docs/INVENTARIO_ACTIVOS.md`.
 *
 * Estilo: trazo 1.8, extremos y uniones redondeadas, `currentColor`. El color
 * y la "profundidad premium" (degradado azul→cian, contenedor con sombra) los
 * pone `.icono-envoltorio` en `base.css`, nunca este archivo.
 */

export type NombreIcono =
  | 'inicio' | 'planificar' | 'clientes' | 'agenda' | 'propuestas' | 'dinero' | 'administracion'
  | 'buscar' | 'brujula' | 'chevron-izquierda' | 'chevron-derecha' | 'mas' | 'cerrar-sesion';

/** Contenido interior del `<svg>` (los `<path>`/`<circle>`), por ícono. */
const TRAZOS: Readonly<Record<NombreIcono, string>> = {
  inicio: '<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M5.5 10v8.5a1 1 0 0 0 1 1h3.5v-6h4v6H17.5a1 1 0 0 0 1-1V10"/>',
  planificar: '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.4 12.9 13.1 9.4 14.6 11.1 10.9 14.6 9.4Z"/>',
  clientes: '<circle cx="9" cy="8.3" r="3"/><path d="M3.8 19c0-3 2.4-5.2 5.2-5.2S14.2 16 14.2 19"/><circle cx="17" cy="9.2" r="2.4"/><path d="M15.6 13.4c2.3.4 3.8 2.2 3.8 4.9"/>',
  agenda: '<rect x="3.8" y="5.2" width="16.4" height="14.6" rx="2"/><path d="M3.8 9.6h16.4M8.2 3.4v4M15.8 3.4v4"/>',
  propuestas: '<path d="M7.2 3.6h6.7l4 4v12.3a1 1 0 0 1-1 1H7.2a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1Z"/><path d="M13.9 3.6v4.2h4"/><path d="M9 12.6h6M9 15.5h6M9 18h3.6"/>',
  dinero: '<rect x="2.8" y="6.2" width="18.4" height="12.6" rx="2.2"/><path d="M2.8 10.2h18.4"/><path d="M6.2 14.8h3.6"/>',
  administracion: '<path d="M12 3.6 18.8 6.4v5c0 4.4-2.9 7.4-6.8 8.6-3.9-1.2-6.8-4.2-6.8-8.6v-5L12 3.6Z"/><path d="M9.3 12.1 11 13.8l3.7-4.1"/>',
  buscar: '<circle cx="10.6" cy="10.6" r="6.4"/><path d="M19.3 19.3 15.2 15.2"/>',
  brujula: '<circle cx="12" cy="12" r="8.6"/><path d="M14.7 9.3 12.9 13.2 9.3 14.7 11.1 10.8 14.7 9.3Z"/>',
  'chevron-izquierda': '<path d="M14.5 4.5 7 12l7.5 7.5"/>',
  'chevron-derecha': '<path d="M9.5 4.5 17 12l-7.5 7.5"/>',
  mas: '<circle cx="5.2" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18.8" cy="12" r="1.5"/>',
  'cerrar-sesion': '<path d="M9.2 4.6H6.4a1.5 1.5 0 0 0-1.5 1.5v11.8a1.5 1.5 0 0 0 1.5 1.5h2.8"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9.2"/>',
};

/** Construye el `<svg>` del ícono pedido. */
export function crearIconoSvg(nombre: NombreIcono): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = TRAZOS[nombre];
  return svg;
}

export type TamanoIcono = 'sm' | 'md' | 'lg';

/**
 * El ícono dentro de su contenedor "premium": degradado azul→cian y sombra de
 * profundidad (`.icono-envoltorio` en base.css). Es lo que se usa en toda la
 * interfaz: nunca un `<svg>` suelto.
 */
export function crearIconoEnvuelto(nombre: NombreIcono, tamano: TamanoIcono = 'md'): HTMLSpanElement {
  const envoltorio = document.createElement('span');
  envoltorio.className = `icono-envoltorio icono-envoltorio--${tamano}`;
  envoltorio.appendChild(crearIconoSvg(nombre));
  return envoltorio;
}
