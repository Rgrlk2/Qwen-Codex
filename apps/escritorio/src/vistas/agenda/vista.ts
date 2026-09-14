/**
 * Vista 04 — Agenda operativa.   Ruta: #/agenda   Roles: vendedor + administrador
 *
 * ⛔ DUEÑA: Sesión 4 (junto con Clientes y Seguimiento).
 *
 * LA AGENDA SE POBLA SOLA. El vendedor ajusta fechas y completa acciones;
 * ⛔ no reconstruye nada a mano.
 *
 * Se alimenta automáticamente de:
 *   planes · objetivos aceptados · seguimientos · presentaciones ·
 *   cotizaciones · vencimientos · aperturas de enlace que sugieren contactar
 *
 * Cinco vistas internas:
 *   · Hoy            visitas, llamadas, próximos pasos, vencimientos, atrasados
 *   · Semana         siete días con su carga
 *   · Mes            calendario mensual
 *   · Cronograma     Gantt comercial: la vida de cada cliente y cada plan
 *   · Atrasados      lo que se pasó de fecha y sigue pendiente
 *
 * ⛔ Mover una fecha exige motivo.
 * ⛔ Crear a mano es la excepción: casi todo llega derivado.
 *
 * Obligatorio: los cuatro estados y los cinco anchos (360, 390, 768, 1024, 1440),
 * sin scroll horizontal de página. El cronograma va dentro de su propio
 * contenedor con overflow-x: auto. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md §2.4 · USER_FLOWS.md F8 · API_CONTRACTS.md §2.5
 */

export {};
