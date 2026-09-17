/**
 * Utilidades locales de la vista Clientes.
 *
 * ⛔ DUEÑO: Sesión 4.
 *
 * El formato es-PY (fecha, hora, dinero) se re-exporta desde
 * apps/escritorio/src/nucleo/formato.ts (Sesión 1): es la única fuente de
 * verdad para toda la aplicación. Acá sólo vive lo propio de esta vista:
 * escape HTML, clave de idempotencia y etiquetas legibles.
 */

export { formatearDinero as formatDinero, formatearFecha as formatFecha, formatearFechaHora as formatFechaHora } from '../../nucleo/formato';

export function esc(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function generarClave(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const ETIQUETAS_ETAPA: Readonly<Record<string, string>> = {
  sin_contactar: 'Sin contactar',
  contactado: 'Contactado',
  diagnostico: 'Diagnóstico',
  presentacion: 'Presentación',
  cotizacion: 'Cotización',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
  cliente_activo: 'Cliente activo',
};

export function etiquetaEtapa(etapa: string): string {
  return ETIQUETAS_ETAPA[etapa] ?? etapa;
}

export function etiquetaProducto(id: string): string {
  return id
    .split('-')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

export function etiquetaTipoEvento(tipo: string): string {
  const etiquetas: Readonly<Record<string, string>> = {
    seguimiento: 'Seguimiento',
    presentacion: 'Presentación',
    cotizacion: 'Cotización',
    cambio_etapa: 'Cambio de etapa',
    acceso_enlace: 'Apertura de enlace',
    mensualidad: 'Mensualidad',
  };
  return etiquetas[tipo] ?? tipo;
}
