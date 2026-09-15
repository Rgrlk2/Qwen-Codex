/**
 * Datos de ejemplo — dominio: propuestas.
 *
 * ⛔ DUEÑO: Sesión 5. Ninguna otra sesión edita este archivo.
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse.
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén en COMMERCIAL_RULES.md §2.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 * ⛔ Sin roles fuera de vendedor y administrador.
 *
 * Y para la cotización en particular:
 *
 * ⛔ **Sin ningún cliente real.** La cotización es una plantilla genérica: los
 *    nombres de ejemplo son inventados y evidentes, nunca los de un cliente de
 *    Lab.IA, y ninguna condición sale de una propuesta anterior.
 * ⛔ **Las cuatro alternativas no se escriben a mano.** Se calculan con
 *    `calcularAlternativas` de `@labia/compartido`: un ejemplo con números
 *    tipeados se desincroniza de las fórmulas en la primera corrección.
 * ⛔ **Sin el celular del CEO**, ni de ejemplo, ni con dígitos cambiados.
 *    El único número que puede aparecer es el WhatsApp corporativo.
 * ⛔ **Sin rutas a imágenes de firma.** Las firmas se referencian por
 *    `referenciaProtegida`, que en el mock es una cadena opaca sin extensión.
 */

export {};
