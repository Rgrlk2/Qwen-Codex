/**
 * Shim de tipos para `?raw`: el empaquetador devuelve el contenido del archivo
 * como cadena. Mismo criterio que apps/escritorio/src/vistas/planificar/tipos-raw.d.ts.
 *
 * ⛔ Así el copy aprobado se LEE de content/copy/. Nunca se copia a un .ts:
 *    una segunda copia del texto es una copia que puede derivar.
 */
declare module '*?raw' {
  const contenido: string;
  export default contenido;
}
