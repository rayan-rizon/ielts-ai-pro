import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sanitizerEntry = require.resolve('sanitize-html');
const parserEntry = fileURLToPath(import.meta.resolve('htmlparser2'));
const bridgeFile = path.join(path.dirname(sanitizerEntry), 'htmlparser2-vercel.cjs');
const originalImport = "const htmlparser = require('htmlparser2');";
const bridgedImport = "const htmlparser = require('./htmlparser2-vercel.cjs');";

await build({
  entryPoints: [parserEntry],
  outfile: bridgeFile,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  sourcemap: false,
  logLevel: 'warning',
});

const source = await readFile(sanitizerEntry, 'utf8');
let patchedSource = source;

if (source.includes(originalImport)) {
  patchedSource = source.replace(originalImport, bridgedImport);
  await writeFile(sanitizerEntry, patchedSource, 'utf8');
} else if (!source.includes(bridgedImport)) {
  throw new Error(
    `sanitize-html entrypoint changed unexpectedly at ${sanitizerEntry}; refusing to apply an unsafe runtime patch.`
  );
}

const sanitizeHtml = require(sanitizerEntry);
const smokeResult = sanitizeHtml('<p>Safe</p><script>alert(1)</script>', {
  allowedTags: ['p'],
  allowedAttributes: {},
});

if (smokeResult !== '<p>Safe</p>') {
  throw new Error(`sanitize-html smoke test failed: ${JSON.stringify(smokeResult)}`);
}

const blogModule = await import(`${pathToFileURL(path.join(root, 'api/blog.js')).href}?runtime-smoke=1`);
if (typeof blogModule.default !== 'function') {
  throw new Error('Blog runtime smoke test failed: api/blog.js did not export a request handler.');
}

console.log('Verified sanitize-html/htmlparser2 compatibility and blog module loading.');
