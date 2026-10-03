import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    modulePreload: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // 所有 JS 合并为单个入口 chunk，避免部署 CDN 上动态 chunk 403
        manualChunks: () => 'index',
      },
    },
  },
  optimizeDeps: { exclude: ['@ferscloud/fers-calculation-web'] },
  server: { port: 3000, host: '0.0.0.0' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
