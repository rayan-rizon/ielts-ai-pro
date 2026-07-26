import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';
import viteCompression from 'vite-plugin-compression';

function deferLandingStyles() {
  return {
    name: 'defer-landing-styles',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const criticalCss = readFileSync(
          path.resolve(__dirname, 'src/styles/landing-critical.generated.css'),
          'utf8'
        ).replaceAll('</style', '<\\/style');

        const stylesheetPattern =
          /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/;
        const match = html.match(stylesheetPattern);
        if (!match) {
          throw new Error('Unable to locate the generated application stylesheet.');
        }

        const stylesheetHref = match[1];
        const encodedStylesheetHref = Buffer.from(stylesheetHref).toString('base64');
        const deferredMarkup = [
          `<style data-landing-critical>${criticalCss}</style>`,
          '<link id="deferred-app-styles" crossorigin>',
          '<script>',
          '(()=>{const l=document.getElementById("deferred-app-styles");',
          `const h=atob("${encodedStylesheetHref}");const a=()=>{if(!l||l.rel==="stylesheet")return;l.href=h;l.rel="stylesheet"};`,
          'const t=localStorage.getItem("vite-ui-theme");',
          'const dark=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme:dark)").matches);',
          'if(location.pathname!=="/"||innerWidth>=768||dark)a();',
          'else{const s=()=>{a();removeEventListener("pointerdown",s);removeEventListener("keydown",s);removeEventListener("wheel",s);removeEventListener("touchstart",s)};',
          'addEventListener("pointerdown",s,{once:true,passive:true});addEventListener("keydown",s,{once:true});',
          'addEventListener("wheel",s,{once:true,passive:true});addEventListener("touchstart",s,{once:true,passive:true});',
          'setTimeout(a,15000)}})();',
          '</script>',
          '<noscript><style>#root{display:none}.no-js-message{max-width:42rem;margin:4rem auto;padding:1.5rem;font:600 1rem/1.6 system-ui,sans-serif;color:#17223d}</style><p class="no-js-message">IELTS Ai Pro requires JavaScript for interactive practice tests and feedback.</p></noscript>',
        ].join('');

        const landingChunk = Object.keys(context.bundle || {}).find((fileName) =>
          /^assets\/LandingPage-[^/]+\.js$/.test(fileName)
        );
        const landingPreload = landingChunk
          ? `<link rel="modulepreload" crossorigin href="/${landingChunk}">`
          : '';

        return html
          .replace(stylesheetPattern, deferredMarkup)
          .replace('<script type="module"', `${landingPreload}<script type="module"`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    deferLandingStyles(),
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
            // TanStack Query - data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Editor dependencies - only needed in specific components
            if (id.includes('lexical') || id.includes('prismjs')) {
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
