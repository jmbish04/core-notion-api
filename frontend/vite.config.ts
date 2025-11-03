import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, '../public'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/monitor': 'http://localhost:8787',
      '/health': 'http://localhost:8787',
      '/openapi': 'http://localhost:8787',
      '/mcp': 'http://localhost:8787',
      '/ws': {
        target: 'http://localhost:8787',
        ws: true,
      },
    },
  },
});
