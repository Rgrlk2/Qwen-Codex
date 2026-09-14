/**
 * Vista 04 — Propuestas.   Ruta: #/propuestas   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 5. Ninguna otra sesión edita esta carpeta.
 *
 * DOS COSAS DISTINTAS, que nunca se mezclan:
 *
 * A) PRESENTACIÓN para dejar al cliente — se genera PRIMERO.
 *    Personalizada, visual, compartible. ⛔ SIN precio definitivo.
 *    ⛔ NO requiere aprobación.
 *
 * B) COTIZACIÓN — se prepara DESPUÉS. El vendedor propone el precio:
 *    setup · mensualidad · descuento de implementación · débito automático ·
 *    compromiso de doce meses · pago anual anticipado · alcance · vigencia ·
 *    cronograma · condiciones.
 *
 * EL CIRCUITO, SIN DESVÍOS:
 *   borrador del vendedor → revisión del administrador → aprobada o corregida
 *   → PDF definitivo → envío al cliente
 *
 * ⛔ NINGÚN VENDEDOR PUEDE ENVIAR UNA COTIZACIÓN FINAL SIN APROBACIÓN.
 *    No hay botón, ni URL, ni llamada que lo permita.
 * ⛔ El PDF definitivo se emite DESPUÉS de aprobar, nunca antes.
 * ⛔ La aprobación se implementa en Administración (S6), no acá.
 *
 * Obligatorio: los cuatro estados — cargando, vacío, error con reintento, con
 * datos. Y los cinco anchos: 360, 390, 768, 1024 y 1440 px, sin scroll
 * horizontal de página. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md · USER_FLOWS.md · API_CONTRACTS.md · DESIGN_SYSTEM.md · QA_CHECKLIST.md
 */

export {};
