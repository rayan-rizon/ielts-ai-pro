import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { wrangler } from './wrangler-cli.mjs';
import path from 'node:path';
import dotenv from 'dotenv';
import { selectProfile, buildOutput } from './profile.mjs';
import { cloudflareApi } from './account-api.mjs';

const directory = fileURLToPath(new URL('./', import.meta.url));
const args = process.argv.slice(2);
const profile = selectProfile(args);
const config = JSON.parse(readFileSync(path.join(directory, 'wrangler.jsonc'), 'utf8'));
if (config.name !== 'ielts-ai-cloudflare-staging' || config.routes.length || !config.workers_dev || config.vars.DEPLOYMENT_STAGE !== 'staging') {
  throw new Error('Deployment must remain isolated on the staging workers.dev URL');
}
// This is the isolated candidate workflow. Never let its empty routes detach
// a Worker that has since been promoted to the live site.
if (profile === 'production' && !args.includes('--dry-run') && !args.includes('--candidate')) throw new Error('Use --candidate for an isolated production Worker deployment');
if (profile === 'production' && !args.includes('--dry-run')) {
  const routes = await cloudflareApi('/zones/a0f923f4119e50e011eadaba1fcf48d5/workers/routes');
  if (routes.some(route => route.script === 'ielts-ai-cloudflare')) {
    throw new Error('Production Worker has live routes. Candidate deployment blocked to preserve routing and quota fallback; use a reviewed versions upload/deployment workflow for live updates.');
  }
}
const build = JSON.parse(readFileSync(path.join(directory, `.generated/build${profile === 'production' ? '-production' : ''}.json`)));
if (build.profile !== profile || build.output !== buildOutput(profile)) throw new Error('Build profile mismatch; rebuild the selected profile');
const publicSettings = dotenv.parse(readFileSync(path.join(directory, '.dev.vars')));
for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
  if (!publicSettings[name]) throw new Error(`Missing ${name}; run build first`);
}
const deployment = {
  ...config, main: path.join(directory, config.main),
  name: profile === 'production' ? 'ielts-ai-cloudflare' : config.name,
  assets: { ...config.assets, directory: path.join(directory, profile === 'production' ? 'dist-production' : 'dist') },
  vars: { ...config.vars, DEPLOYMENT_STAGE: profile, ...publicSettings },
};
const configPath = path.join(directory, `.generated/deploy${profile === 'production' ? '-production' : ''}.json`);
writeFileSync(configPath, JSON.stringify(deployment, null, 2), { mode: 0o600 });
const result = wrangler(['deploy', '--config', configPath, ...args.filter(arg => !arg.startsWith('--profile=') && arg !== '--candidate')], {
  cwd: directory, stdio: 'inherit', env: process.env,
});
process.exit(result.status ?? 1);
