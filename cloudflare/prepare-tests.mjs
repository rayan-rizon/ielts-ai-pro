import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { wrangler } from './wrangler-cli.mjs';

const directory = fileURLToPath(new URL('./', import.meta.url));
mkdirSync(new URL('./.generated/', import.meta.url), { recursive: true });
mkdirSync(new URL('./verification/', import.meta.url), { recursive: true });
writeFileSync(new URL('./.generated/routes.json', import.meta.url), readFileSync(new URL('./routes.json', import.meta.url)));
const config = JSON.parse(readFileSync(new URL('./wrangler.jsonc', import.meta.url)));
delete config.assets;
config.main = fileURLToPath(new URL('./worker.ts', import.meta.url));
writeFileSync(new URL('./.generated/test-config.json', import.meta.url), JSON.stringify(config));
const result = wrangler(['deploy', '--dry-run', '--config', '.generated/test-config.json', '--outdir', fileURLToPath(new URL('./.generated/test-bundle', import.meta.url))], {
  cwd: directory, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
});
process.exitCode = result.status ?? 1;
