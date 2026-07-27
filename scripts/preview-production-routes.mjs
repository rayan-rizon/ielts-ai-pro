import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import blogHandler from '../api/blog.js';

const rootDir = resolve(import.meta.dirname, '..');
const distDir = join(rootDir, 'dist');
const port = Number(process.env.PORT) || 4174;

dotenv.config({ path: join(rootDir, '.env.local'), quiet: true });
dotenv.config({ path: join(rootDir, '.env'), quiet: true });

if (!existsSync(join(distDir, 'index.html'))) {
  throw new Error('dist/index.html is missing. Run npm run build first.');
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function sendFile(pathname, response) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = normalize(join(distDir, relativePath));
  if (
    !filePath.startsWith(`${distDir}/`) ||
    !existsSync(filePath) ||
    !statSync(filePath).isFile()
  ) {
    return false;
  }
  response.statusCode = 200;
  response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream');
  createReadStream(filePath).pipe(response);
  return true;
}

function createVercelResponse(response) {
  response.status = (statusCode) => {
    response.statusCode = statusCode;
    return response;
  };
  response.send = (body) => {
    response.end(body);
    return response;
  };
  return response;
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
  if (url.pathname === '/blog' || url.pathname.startsWith('/blog/')) {
    const slug = url.pathname === '/blog' ? undefined : decodeURIComponent(url.pathname.slice(6));
    const query = Object.fromEntries(url.searchParams.entries());
    if (slug) query.slug = slug;
    await blogHandler({ query }, createVercelResponse(response));
    return;
  }

  if (sendFile(url.pathname, response)) return;
  sendFile('/index.html', response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Production-route preview: http://127.0.0.1:${port}`);
  console.log('Direct /blog and /blog/:slug requests use api/blog.js, matching Vercel.');
});
