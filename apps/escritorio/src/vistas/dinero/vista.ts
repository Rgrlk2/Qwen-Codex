/**
 * Vista 05 — Dinero.   Ruta: #/dinero   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 6. Ninguna otra sesión edita esta carpeta.
 *
 * LAS OCHO CIFRAS, separadas por moneda:
 *   vendido · cobrado · por cobrar · parte de Lab.IA · parte del vendedor ·
 *   comisión pendiente · comisión pagada · mensualidades vigentes
 *
 * REGLA VIGENTE: 50 % Lab.IA / 50 % vendedor, sobre setup y sobre mensualidades.
 * Configurable por producto, con meses de participación configurables.
 *
 * ⛔ Se devenga sobre lo COBRADO, no sobre lo vendido.
 * ⛔ El vendedor NO edita comisiones, participaciones ni liquidaciones.
 *    Sólo puede abrir una observación; la resuelve el administrador.
 * ⛔ Nunca se suma PYG con USD.
 *
 * Obligatorio: los cuatro estados — cargando, vacío, error con reintento, con
 * datos. Y los cinco anchos: 360, 390, 768, 1024 y 1440 px, sin scroll
 * horizontal de página. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md · USER_FLOWS.md · API_CONTRACTS.md · DESIGN_SYSTEM.md · QA_CHECKLIST.md
 */

export {};
