import { mergeConfig } from 'vite';
import base from '../vite.config.js';
import { buildOutput } from './profile.mjs';

// These transforms affect only the Cloudflare build. Vercel's source/config
// remains byte-for-byte unchanged. Preview must not report production telemetry.
export default mergeConfig(base, {
  plugins: [{
    name: 'cloudflare-telemetry-boundary',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.tsx')) return;
      if (!code.includes('const isLiveProduction = import.meta.env.PROD && !isLocalHost;') || !code.includes('<IdleTelemetry />')) {
        throw new Error('Telemetry source changed; review the Cloudflare preview boundary before building');
      }
      return code.replace(
        'const isLiveProduction = import.meta.env.PROD && !isLocalHost;',
        "const isLiveProduction = import.meta.env.PROD && ['ieltsai.pro', 'www.ieltsai.pro'].includes(window.location.hostname);"
      ).replace('<IdleTelemetry />', '{/* Vercel telemetry is omitted on Cloudflare. */}');
    },
  }],
  build: { outDir: buildOutput(process.env.CF_BUILD_PROFILE), emptyOutDir: true },
});
