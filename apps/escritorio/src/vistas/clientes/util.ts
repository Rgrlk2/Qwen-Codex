/**
 * Utilidades locales de la vista Clientes.
 *
 * ⛔ DUEÑO: Sesión 4.
 *
 * Formato es-PY y clave de idempotencia, implementados acá porque
 * apps/escritorio/src/nucleo/formato.ts (Sesión 1) todavía no existe
 * (docs/PEDIDOS.md [S4] 2026-09-15). Cuando exista, esta vista migra a ese
 * módulo compartido.
 */

import type { Dinero } from '@labia/compartido';

const ZONA = 'America/Asuncion';

export function esc(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeZone: ZONA }).format(new Date(iso));
}

export function formatFechaHora(iso: string): string {
  return new Intl.DateTimeFormat('es-PY', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA }).format(new Date(iso));
}

export function formatDinero(dinero: Dinero): string {
  const valor = dinero.moneda === 'PYG' ? dinero.monto : dinero.monto / 100;
  const numero = new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: dinero.moneda === 'PYG' ? 0 : 2,
    maximumFractionDigits: dinero.moneda === 'PYG' ? 0 : 2,
  }).format(valor);
  return dinero.moneda === 'PYG' ? `Gs. ${numero}` : `USD ${numero}`;
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
