/**
 * Guardia de rol del ruteo.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * ESTO ES LA MITAD DE LA PROTECCIÓN, NO TODA.
 * La otra mitad está en el servidor: todo método de `CapaAdministracion`
 * llamado por un vendedor devuelve `sin_permiso`, aunque la interfaz nunca
 * haya mostrado el enlace. Ocultar un enlace no protege una ruta.
 *
 * Comportamiento esperado ante una ruta no permitida:
 *   - NO pantalla en blanco;
 *   - NO redirección silenciosa que confunda;
 *   - mensaje claro de que esa sección no corresponde a su rol, y vuelta a Inicio.
 */

export {};
