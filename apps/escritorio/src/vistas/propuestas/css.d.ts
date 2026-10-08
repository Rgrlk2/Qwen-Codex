/**
 * Vite sirve las hojas de estilo importadas como efecto lateral; TypeScript
 * no las conoce sin esta declaración ambiental. Vive acá porque
 * `apps/escritorio/src/vistas/propuestas/**` es el único módulo que hoy
 * importa CSS: cuando la Sesión 2 declare esto de forma compartida, esta
 * declaración local puede retirarse.
 */
declare module '*.css';
