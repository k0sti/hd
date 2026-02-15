import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['/swisseph-wrapper.js'],
    },
  },
  optimizeDeps: {
    exclude: ['swisseph-wasm'],
  },
});
