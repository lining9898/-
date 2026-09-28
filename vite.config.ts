import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    modulePreload: false,
    assetsInlineLimit: 4000000,
  },
  optimizeDeps: { exclude: ['@ferscloud/fers-calculation-web'] },
  server: { port: 3000, host: '0.0.0.0' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
