/**
 * Los cuatro estados, compartidos por todas las vistas.
 *
 * ⛔ DUEÑO: SESIÓN 2.
 *
 *   cargando  → esqueletos con la forma del contenido real. role="status".
 *               ⛔ Nunca pantalla en blanco.
 *   vacío     → explica qué falta Y ofrece la acción que lo resuelve.
 *   error     → causa en lenguaje claro + "Volver a intentar". role="alert".
 *               ⛔ Sin códigos HTTP, sin nombres de tabla, sin trazas.
 *   con datos → importes con moneda, fechas en es-PY.
 *
 * ⛔ Un bloque que falla NO tumba la vista: el resto sigue usable.
 */

export {};
