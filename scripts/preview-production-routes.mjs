import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import blogHandler from '../api/blog.js';
import blogCssHandler from '../api/blog-css.js';
import feedHandler from '../api/feed.js';
import llmsHandler from '../api/llms.js';
import sitemapHandler from '../api/sitemap.js';

const rootDir = resolve(import.meta.dirname, '..');
const distDir = join(rootDir, 'dist');
const port = Number(process.env.PORT) || 4174;
const vercelConfig = JSON.parse(readFileSync(join(rootDir, 'vercel.json'), 'utf8'));

dotenv.config({ path: join(rootDir, '.env.local'), quiet: true });
dotenv.config({ path: join(rootDir, '.env'), quiet: true });

if (!existsSync(join(distDir, 'index.html'))) {
  throw new Error('dist/index.html is missing. Run npm run build first.');
}

const contentTypes = {
  '.avif': 'image/avif',
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

function sendFile(pathname, response, statusCode = 200) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = normalize(join(distDir, relativePath));
  if (
    !filePath.startsWith(`${distDir}/`) ||
    !existsSync(filePath) ||
    !statSync(filePath).isFile()
  ) {
    return false;
  }
  response.statusCode = statusCode;
  response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream');
  createReadStream(filePath).pipe(response);
  return true;
}

function sourceMatches(source, pathname) {
  const pattern = source
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) return segment.endsWith('*') ? '.*' : '[^/]+';
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return new RegExp(`^${pattern}$`).test(pathname);
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
  const vercelResponse = createVercelResponse(response);

  const dynamicHandlers = new Map([
    ['/blog.css', blogCssHandler],
    ['/sitemap.xml', sitemapHandler],
    ['/llms.txt', llmsHandler],
    ['/blog/feed.xml', feedHandler],
  ]);
  if (dynamicHandlers.has(url.pathname)) {
    await dynamicHandlers.get(url.pathname)(request, vercelResponse);
    return;
  }

  if (url.pathname === '/blog' || url.pathname.startsWith('/blog/')) {
    const slug = url.pathname === '/blog' ? undefined : decodeURIComponent(url.pathname.slice(6));
    const query = Object.fromEntries(url.searchParams.entries());
    if (slug) query.slug = slug;
    await blogHandler({ query }, vercelResponse);
    return;
  }

  if (sendFile(url.pathname, response)) return;

  const rewrite = (vercelConfig.rewrites || []).find(({ source }) =>
    sourceMatches(source, url.pathname)
  );
  if (rewrite?.destination.endsWith('/index.html') && sendFile(rewrite.destination, response)) {
    return;
  }

  if (!sendFile('/404.html', response, 404)) {
    response.statusCode = 404;
    response.end('Page not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Production-route preview: http://127.0.0.1:${port}`);
  console.log('Direct public routes and unknown-path 404s mirror vercel.json.');
});
