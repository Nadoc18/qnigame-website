/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'wasm-mime-type',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url) {
              const url = req.url.toLowerCase().split('?')[0];
              if (url.endsWith('.wasm')) {
                res.setHeader('Content-Type', 'application/wasm');
              } else if (url.endsWith('.wasm.gz')) {
                res.setHeader('Content-Type', 'application/wasm');
                res.setHeader('Content-Encoding', 'gzip');
              } else if (url.endsWith('.wasm.br')) {
                res.setHeader('Content-Type', 'application/wasm');
                res.setHeader('Content-Encoding', 'br');
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR === 'true' ? false : { port: 0 },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      pool: 'threads',
    },
  };
});
