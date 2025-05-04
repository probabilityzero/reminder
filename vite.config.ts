import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Automatically use correct base path for GitHub Pages or Vercel
  base: '/',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  plugins: [
    // React plugin
    react(),
    // TypeScript paths plugin
    tsconfigPaths(),
    // HTTPS certificate plugin (only when HTTPS env var is set)
    process.env.HTTPS ? mkcert() : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  publicDir: './public',
  server: {
    // Exposes dev server for network access
    host: true,
    port: 3000,
    // Fixed: Use an empty object for HTTPS configuration instead of boolean
    https: process.env.HTTPS ? {} : undefined,
  },
});

