/**
 * Configuración de la única aplicación.
 * ⛔ DUEÑO: SESIÓN 1.
 */
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: { target: 'es2022', outDir: 'dist', sourcemap: true },
  resolve: {
    alias: {
      '@labia/compartido': new URL('../../packages/compartido/src/index.ts', import.meta.url).pathname,
      '@labia/mock': new URL('../../packages/mock/src/index.ts', import.meta.url).pathname,
    },
  },
});
