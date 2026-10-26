import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { PUBLIC_BUILD_SETTINGS, selectProfile, buildOutput, validateProductionSettings } from './profile.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const profile = selectProfile(process.argv.slice(2));
const output = buildOutput(profile);
const env = {};
for (const name of ['.env', '.env.local', '.env.production']) {
  try { Object.assign(env, dotenv.parse(readFileSync(path.join(root, name)))); } catch {}
}
// Preview parity settings contain only explicitly selected public build values.
try {
  const preview = dotenv.parse(readFileSync(path.join(root, 'cloudflare/.generated/build-public.env')));
  for (const name of PUBLIC_BUILD_SETTINGS) {
    if (preview[name] !== undefined) env[name] = preview[name];
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
Object.assign(env, process.env);
if (profile === 'production') validateProductionSettings(env);
const patch = spawnSync(process.execPath, ['scripts/patch-sanitize-html-runtime.mjs'], { cwd: root, stdio: 'inherit' });
if (patch.status !== 0) process.exit(patch.status || 1);
for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
  if (!env[name]) throw new Error(`Missing public build setting ${name}`);
}
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--config', 'cloudflare/vite.config.mjs'], {
  cwd: root, env: { ...env, CF_BUILD_PROFILE: profile, VITE_SENTRY_DSN: profile === 'production' ? env.VITE_SENTRY_DSN : '' }, stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status || 1);

// Reuse the existing SEO generator, changing only its output location. No
// editing of that script or root dist/ is needed for this independent build.
const generatorPath = path.join(root, 'scripts/generate-public-seo-pages.mjs');
const generator = readFileSync(generatorPath, 'utf8')
  .replace("path.join(root, 'dist')", `path.join(root, '${output}')`)
  .replace(/from '([^']+)'/g, (match, specifier) => specifier.startsWith('.')
    ? `from '${pathToFileURL(path.resolve(path.dirname(generatorPath), specifier)).href}'` : match);
await import(`data:text/javascript;base64,${Buffer.from(generator).toString('base64')}`);

const removeFinderMetadata = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) removeFinderMetadata(target);
    else if (entry.name === '.DS_Store') unlinkSync(target);
  }
};
removeFinderMetadata(path.join(root, output));

const config = JSON.parse(readFileSync(path.join(root, 'cloudflare/routes.json')));
mkdirSync(path.join(root, 'cloudflare/.generated'), { recursive: true });
writeFileSync(path.join(root, 'cloudflare/.generated/routes.json'), JSON.stringify(config));
// Keep short static header rules within Cloudflare's per-line limit. Document
// HTML and the full CSP are served through the Worker instead.
const robots = profile === 'staging' ? '  X-Robots-Tag: noindex, nofollow, noarchive\n' : '';
const headers = `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n${robots}/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n`;
writeFileSync(path.join(root, output, '_headers'), headers);
// Only public credentials are needed for database-backed public HTML. Meta's
// production token is deliberately not copied to the preview deployment.
writeFileSync(path.join(root, 'cloudflare/.dev.vars'), [
  `VITE_SUPABASE_URL=${JSON.stringify(env.VITE_SUPABASE_URL)}`,
  `VITE_SUPABASE_ANON_KEY=${JSON.stringify(env.VITE_SUPABASE_ANON_KEY)}`,
  `SUPABASE_URL=${JSON.stringify(env.VITE_SUPABASE_URL)}`,
  `SUPABASE_ANON_KEY=${JSON.stringify(env.VITE_SUPABASE_ANON_KEY)}`,
].join('\n') + '\n', { mode: 0o600 });
writeFileSync(path.join(root, `cloudflare/.generated/build${profile === 'production' ? '-production' : ''}.json`), JSON.stringify({
  builtAt: new Date().toISOString(), output, profile,
  telemetry: profile === 'production' ? 'production hosts only' : 'preview disabled',
  publicSettingsPresent: Object.fromEntries(PUBLIC_BUILD_SETTINGS.map(name => [name, Boolean(env[name])])),
}, null, 2));
console.log('Cloudflare frontend and SEO pages built.');
