import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
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
