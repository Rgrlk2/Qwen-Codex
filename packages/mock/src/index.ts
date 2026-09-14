/**
 * Implementación mock de `CapaDatos`.
 *
 * ⛔ DUEÑO DE ESTE ARCHIVO: SESIÓN 1. Ensambla los módulos de cada sesión:
 *
 *   datos-sesion.ts        → Sesión 1   (ingreso, roles, capacidades)
 *   datos-inicio.ts        → Sesión 2   (las cuatro cifras, próximos seguimientos)
 *   datos-motor.ts         → Sesión 3   (taxonomía, planes, catálogo, sugerencias)
 *   datos-investigacion.ts → Sesión 3   (investigación automática y proveedores)
 *   datos-clientes.ts      → Sesión 4   (cartera, seguimientos, audios)
 *   datos-agenda.ts        → Sesión 4   (agenda que se puebla sola)
 *   datos-propuestas.ts    → Sesión 5   (presentaciones, cotizaciones, enlaces)
 *   datos-finanzas.ts      → Sesión 6   (participación, mensualidades, admin)
 *
 * ⛔ Mientras la app corra con mock, la interfaz muestra de forma permanente el
 *    chip "Datos de ejemplo". Nunca se presenta un dato ficticio como real.
 *
 * ⛔ El mock debe respetar la guardia de rol: un método de administración
 *    llamado con rol `vendedor` devuelve `sin_permiso`, igual que el servidor.
 *    Si el mock es permisivo, la guardia no se prueba nunca.
 */

export * from './nucleo';
