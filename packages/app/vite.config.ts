import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
  resolve: {
    dedupe: ['nostr-tools', 'applesauce-core'],
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
