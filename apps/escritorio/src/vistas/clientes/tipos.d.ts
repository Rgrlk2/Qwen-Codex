/**
 * Declaración ambiental para que `tsc` (fuera de Vite) resuelva los imports
 * de hoja de estilos de esta vista (`import './estilos.css'`).
 *
 * ⛔ DUEÑO: Sesión 4. apps/escritorio/{package.json,vite.config.ts} (Sesión 1)
 * todavía no declara `vite` como dependencia ni trae un `vite-env.d.ts`
 * global (docs/PEDIDOS.md [S4] 2026-09-15); mientras tanto, esta declaración
 * local alcanza para tipar el import dentro de esta carpeta.
 */

declare module '*.css';
