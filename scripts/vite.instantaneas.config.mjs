/** Empaquetado del generador de instantaneas. Mismo criterio que el nucleo. */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
export default defineConfig({
  root: raiz, logLevel: 'warn',
  resolve: { alias: {
    '@labia/compartido': `${raiz}packages/compartido/src/index.ts`,
    '@labia/mock': `${raiz}packages/mock/src/index.ts`,
    '@labia/ui': `${raiz}packages/ui/src`,
  } },
  build: {
    ssr: `${raiz}scripts/instantaneas.mjs`,
    outDir: `${raiz}scripts/.salida-instantaneas`, emptyOutDir: true,
    target: 'node20', minify: false,
    rollupOptions: { external: [/^node:/], output: { entryFileNames: 'instantaneas.mjs', format: 'es' } },
  },
});
