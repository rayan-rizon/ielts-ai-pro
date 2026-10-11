import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export function wrangler(args, options = {}) {
  return spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)), ...args], options);
}
