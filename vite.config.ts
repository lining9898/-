import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    modulePreload: false,
    // Keep the structural solver WASM as a cacheable file instead of embedding it in JavaScript.
    assetsInlineLimit: 4096,
  },
  optimizeDeps: { exclude: ['@ferscloud/fers-calculation-web'] },
  server: { port: 3000, host: '0.0.0.0' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
