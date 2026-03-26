import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    esbuildOptions: {
      target: 'esnext',
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    sourcemap: 'hidden',
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300,
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter(dep => {
          // Exclude heavy chunks from eager preloading
          const excludeKeywords = ['chart-vendor', 'supabase-vendor', 'zod-vendor', 'sanitize-vendor', 'query-vendor', 'helmet-vendor'];
          return !excludeKeywords.some(keyword => dep.includes(keyword));
        });
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true,
        pure_getters: true,
        unsafe_arrows: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React - always needed
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'react-vendor';
            }
            // Icons - used everywhere but tree-shakeable
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            // Supabase client MUST be lazily loaded, but it's okay to group its internal chunks
            if (id.includes('supabase-js')) {
              return 'supabase-vendor';
            }
          }
        },
      },
    },
  },
});
