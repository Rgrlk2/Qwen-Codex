/**
 * Implementación mock de `CapaDatos` y `CapaDatosAdmin`.
 *
 * ⛔ DUEÑO DE ESTE ARCHIVO: SESIÓN 1. Ensambla los módulos de datos de cada sesión.
 *    Los módulos `datos-*.ts` tienen cada uno su propia sesión dueña:
 *
 *      datos-dia.ts          → Sesión 2
 *      datos-seguimiento.ts  → Sesión 2
 *      datos-cartera.ts      → Sesión 3
 *      datos-portafolio.ts   → Sesión 4
 *      datos-propuestas.ts   → Sesión 5
 *      datos-dinero.ts       → Sesión 6
 *      datos-admin.ts        → Sesión 6
 *
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse (docs/PARALLEL_SESSIONS.md §7).
 *
 * ⛔ Mientras la aplicación corra con mock, la interfaz muestra de forma permanente
 *    el chip "Datos de ejemplo". Nunca se presenta un dato ficticio como real.
 */

export * from './nucleo';
