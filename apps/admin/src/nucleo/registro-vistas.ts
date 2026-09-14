/**
 * Registro de las vistas de Administración.
 *
 * ⛔ COMPLETO DESDE FASE 0. NADIE LO EDITA.
 * Las implementaciones de `apps/admin/src/vistas/**` son de la Sesión 6.
 *
 * Especificación: docs/MASTER_SPEC.md §6.
 */

export interface EntradaVistaAdmin {
  readonly ruta: string;
  readonly indice: string;
  readonly titulo: string;
  readonly modulo: string;
  /** Permiso mínimo requerido (ver `Permiso` en @labia/compartido). */
  readonly permiso: string;
}

export const VISTAS_ADMIN: ReadonlyArray<EntradaVistaAdmin> = [
  { ruta: 'panel',        indice: 'A1', titulo: 'Panel general',           modulo: '../vistas/panel',        permiso: 'cartera.ver.todas' },
  { ruta: 'vendedores',   indice: 'A2', titulo: 'Vendedores y equipos',    modulo: '../vistas/vendedores',   permiso: 'usuarios.administrar' },
  { ruta: 'catalogo',     indice: 'A3', titulo: 'Catálogo',                modulo: '../vistas/catalogo',     permiso: 'catalogo.editar' },
  { ruta: 'aprobaciones', indice: 'A4', titulo: 'Cola de aprobación',      modulo: '../vistas/aprobaciones', permiso: 'cotizaciones.aprobar' },
  { ruta: 'dinero',       indice: 'A5', titulo: 'Dinero',                  modulo: '../vistas/dinero',       permiso: 'comisiones.reglas.publicar' },
  { ruta: 'plantillas',   indice: 'A6', titulo: 'Presentaciones y plantillas', modulo: '../vistas/plantillas', permiso: 'catalogo.editar' },
  { ruta: 'accesos',      indice: 'A7', titulo: 'Registro de accesos',     modulo: '../vistas/accesos',      permiso: 'auditoria.ver.toda' },
  { ruta: 'sugerencias',  indice: 'A8', titulo: 'Sugerencias de productos', modulo: '../vistas/sugerencias', permiso: 'sugerencias.resolver' },
  { ruta: 'parametros',   indice: 'A9', titulo: 'Parámetros del sistema',  modulo: '../vistas/parametros',   permiso: 'usuarios.administrar' },
];

export const RUTA_ADMIN_POR_DEFECTO = 'panel';
