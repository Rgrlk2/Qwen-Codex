/**
 * Shim de tipos para `?raw`: Vite devuelve el contenido del archivo como
 * string plano. Así la ficha de producto LEE el copy aprobado directamente
 * desde content/copy/ (mismo archivo, sin duplicarlo a TypeScript) y lo
 * renderiza con markdown.ts — nunca lo copia a mano.
 *
 * ⛔ DUEÑO: Sesión 3, dentro de su propio ámbito (vistas/planificar/**).
 */
declare module '*?raw' {
  const contenido: string;
  export default contenido;
}

/** Vite importa CSS como efecto lateral (lo inyecta en el documento). */
declare module '*.css';
