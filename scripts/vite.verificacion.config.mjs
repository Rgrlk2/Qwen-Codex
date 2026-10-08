/**
 * Empaquetado de la verificacion del nucleo (Sesion 1).
 *
 * Las pruebas importan el CODIGO FUENTE, no una copia compilada aparte: se
 * verifica exactamente lo que se despacha, con el mismo empaquetador de la
 * aplicacion (TypeScript, alias de paquetes y CSS incluidos).
 */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: raiz,
  logLevel: 'warn',
  resolve: {
    alias: {
      '@labia/compartido': `${raiz}packages/compartido/src/index.ts`,
      '@labia/mock': `${raiz}packages/mock/src/index.ts`,
    },
  },
  build: {
    ssr: `${raiz}scripts/verificar-nucleo.mjs`,
    outDir: `${raiz}scripts/.salida`,
    emptyOutDir: true,
    target: 'node20',
    minify: false,
    rollupOptions: {
      external: ['jsdom', /^node:/],
      output: { entryFileNames: 'verificar-nucleo.mjs', format: 'es' },
    },
  },
});
