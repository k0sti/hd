import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [react()],
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
    include: [
      'applesauce-accounts',
      'applesauce-accounts > applesauce-core',
      'applesauce-accounts > applesauce-signers',
      'applesauce-net',
      'applesauce-net > applesauce-core',
      'applesauce-core',
      'nostr-tools',
      '@cashu/cashu-ts',
    ],
  },
});
