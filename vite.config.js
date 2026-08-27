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
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
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
    chunkSizeWarningLimit: 1000,
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        return deps.filter((dep) => {
          // Exclude heavy chunks from eager preloading
          const excludeKeywords = [
            'chart-vendor',
            'supabase-vendor',
            'zod-vendor',
            'sanitize-vendor',
            'query-vendor',
            'helmet-vendor',
            'radix-vendor',
            'pdf-vendor',
            'pdf-export-vendor',
            'editor-vendor',
            'lucide-vendor',
          ];
          return !excludeKeywords.some((keyword) => dep.includes(keyword));
        });
      },
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
            // Small shared helpers must be split before larger vendors that also import them.
            // Otherwise Rollup can place them inside a heavy async chunk, forcing the entry
            // bundle to download that chunk just for clsx/PropTypes.
            if (
              id.includes('/node_modules/clsx/') ||
              id.includes('/node_modules/tailwind-merge/') ||
              id.includes('/node_modules/class-variance-authority/')
            ) {
              return 'ui-utils-vendor';
            }
            if (id.includes('/node_modules/prop-types/')) {
              return 'prop-types-vendor';
            }
            if (id.includes('/node_modules/@babel/runtime/')) {
              return 'babel-runtime-vendor';
            }
            // Must be checked before the generic React rule because the package path
            // contains "react/" as part of "lucide-react/".
            if (id.includes('/node_modules/lucide-react/')) {
              return 'lucide-vendor';
            }
            // Core React - always needed
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router') ||
              id.includes('/node_modules/react-router-dom/')
            ) {
              return 'react-vendor';
            }
            // PDF.js - heavy library, only needed in specific pages
            if (id.includes('pdfjs-dist')) {
              return 'pdf-vendor';
            }
            // jsPDF is loaded only for result/export flows; keep it out of
            // shared PDF viewer and application chunks.
            if (id.includes('/node_modules/jspdf/')) {
              return 'pdf-export-vendor';
            }
            // TanStack Query - data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Editor dependencies - only needed in specific components
            if (
              id.includes('lexical') ||
              id.includes('prismjs') ||
              id.includes('react-quill-new') ||
              id.includes('/quill/')
            ) {
              return 'editor-vendor';
            }
            // Chart and visualization libraries
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'chart-vendor';
            }
            // Utility libraries
            if (id.includes('zod') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            // Sanitization
            if (id.includes('dompurify') || id.includes('sanitize')) {
              return 'sanitize-vendor';
            }

            // Supabase client MUST be lazily loaded, but it's okay to group its internal chunks
            if (id.includes('supabase-js')) {
              return 'supabase-vendor';
            }
            // The critical Button only needs Radix Slot. Keep it out of the much
            // larger async primitives chunk so the landing page does not download
            // every dialog/select/menu implementation just to render a button.
            if (
              id.includes('/node_modules/@radix-ui/react-slot/') ||
              id.includes('/node_modules/@radix-ui/react-compose-refs/')
            ) {
              return 'radix-slot-vendor';
            }
            // Leave the remaining Radix primitives with their route-level chunks.
            // A single manual Radix chunk pulled unrelated shared helpers into the
            // Supabase dependency path and made the whole UI library load at startup.
            // Framer Motion - used for animations across the app
            if (id.includes('framer-motion')) {
              return 'framer-vendor';
            }
            // React Helmet - SEO meta tags
            if (id.includes('react-helmet')) {
              return 'helmet-vendor';
            }
          }
        },
      },
    },
  },
});
