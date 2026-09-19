/** Empaquetado de la verificacion de fichas. Mismo criterio que el nucleo. */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
export default defineConfig({
  root: raiz, logLevel: 'warn',
  resolve: { alias: {
    '@labia/compartido': `${raiz}packages/compartido/src/index.ts`,
    '@labia/mock': `${raiz}packages/mock/src/index.ts`,
  } },
  build: {
    ssr: `${raiz}scripts/exportar-taxonomia.mjs`,
    outDir: `${raiz}scripts/.salida-taxonomia`, emptyOutDir: true,
    target: 'node20', minify: false,
    rollupOptions: { external: [/^node:/], output: { entryFileNames: 'exportar-taxonomia.mjs', format: 'es' } },
  },
});
