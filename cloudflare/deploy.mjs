import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { wrangler } from './wrangler-cli.mjs';
import path from 'node:path';
import dotenv from 'dotenv';
import { selectProfile, buildOutput } from './profile.mjs';

const directory = fileURLToPath(new URL('./', import.meta.url));
const args = process.argv.slice(2);
if (!args.includes('--profile=staging')) {
  throw new Error('Staging deployment requires explicit --profile=staging. Use npm run cf:deploy for production.');
}
const profile = selectProfile(args);
const config = JSON.parse(readFileSync(path.join(directory, 'wrangler.jsonc'), 'utf8'));
config.name = 'ielts-ai-cloudflare-staging';
config.workers_dev = true;
config.vars.DEPLOYMENT_STAGE = 'staging';
if (config.name !== 'ielts-ai-cloudflare-staging' || config.routes.length || !config.workers_dev || config.vars.DEPLOYMENT_STAGE !== 'staging') {
  throw new Error('Deployment must remain isolated on the staging workers.dev URL');
}
// This command can only create an isolated stage, never modify live routing.
const build = JSON.parse(readFileSync(path.join(directory, `.generated/build${profile === 'production' ? '-production' : ''}.json`)));
if (build.profile !== profile || build.output !== buildOutput(profile)) throw new Error('Build profile mismatch; rebuild the selected profile');
const publicSettings = dotenv.parse(readFileSync(path.join(directory, '.dev.vars')));
for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
  if (!publicSettings[name]) throw new Error(`Missing ${name}; run build first`);
}
const deployment = {
  ...config, main: path.join(directory, config.main),
  name: config.name,
  assets: { ...config.assets, directory: path.join(directory, 'dist') },
  vars: { ...config.vars, DEPLOYMENT_STAGE: profile, ...publicSettings },
};
const configPath = path.join(directory, `.generated/deploy${profile === 'production' ? '-production' : ''}.json`);
writeFileSync(configPath, JSON.stringify(deployment, null, 2), { mode: 0o600 });
const result = wrangler(['deploy', '--config', configPath, ...args.filter(arg => !arg.startsWith('--profile=') && arg !== '--candidate')], {
  cwd: directory, stdio: 'inherit', env: process.env,
});
process.exit(result.status ?? 1);
