/**
 * Datos de ejemplo — dominio: investigacion.
 *
 * ⛔ DUEÑA: Sesión 3. Ninguna otra sesión edita este archivo.
 *
 * Tiene que ofrecer los tres escenarios, o la vista no puede probar sus estados:
 *   1. con datos    2. vacío    3. error
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin roles fuera de vendedor y administrador.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 *
 * ESCENARIOS QUE ESTE MOCK DEBE CUBRIR, o la investigación no se puede probar:
 *   1. investigación completa      → todos los datos verificados
 *   2. investigación parcial       → mezcla de verificado, inferido y no encontrado
 *   3. fuentes caídas              → usoRespaldoTaxonomia = true y
 *                                    datosMinimosFaltantes con 1 o 2 campos
 *   4. sin resultados              → el RUC o el nombre no existe en ningún lado
 *   5. error                       → el proveedor devuelve un fallo
 *
 * ⛔ El escenario 3 es el más importante: es el que prueba que el sistema NO
 *    le tira al vendedor un formulario largo vacío cuando algo falla.
 */

export {};
