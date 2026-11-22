// VELVET UMBRA — The Bellamonte Gallery Job local static server.
// Serves game/ with Node 22's standard library: node serve.ts [--port 8080].
// The Map holds browser-game MIME types and contentType() switches on the file extension.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = resolve(dirname(fileURLToPath(import.meta.url)), 'game');
const port = parsePort(process.argv.slice(2));

const MIME = new Map<string, string>([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
  ['.glb', 'model/gltf-binary'],
  ['.gltf', 'model/gltf+json'],
  ['.bin', 'application/octet-stream'],
  ['.wasm', 'application/wasm'],
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
]);

function parsePort(args: string[]): number {
  const at = args.findIndex((arg) => arg === '--port' || arg.startsWith('--port='));
  if (at === -1) return 8080;
  const raw = args[at] === '--port' ? args[at + 1] : args[at].slice('--port='.length);
  const requested = Number(raw);
  return Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;
}

function contentType(file: string): string {
  const ext = extname(file).toLowerCase();
  switch (ext) {
    case '.html':
    case '.js':
    case '.mjs':
    case '.css':
    case '.json':
    case '.webmanifest':
    case '.txt':
    case '.svg':
      return MIME.get(ext) ?? 'application/octet-stream';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.webp':
    case '.ico':
      return MIME.get(ext) ?? 'application/octet-stream';
    case '.woff':
    case '.woff2':
    case '.ttf':
    case '.otf':
      return MIME.get(ext) ?? 'application/octet-stream';
    case '.glb':
    case '.gltf':
    case '.bin':
    case '.wasm':
      return MIME.get(ext) ?? 'application/octet-stream';
    case '.wav':
    case '.mp3':
    case '.ogg':
    case '.mp4':
    case '.webm':
      return MIME.get(ext) ?? 'application/octet-stream';
    default:
      return MIME.get(ext) ?? 'application/octet-stream';
  }
}

function handle(request: { method?: string; url?: string }, response: any): void {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD' });
    response.end('method not allowed');
    return;
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const file = resolve(join(gameRoot, normalize(pathname)));
  if (file !== gameRoot && !file.startsWith(gameRoot + sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('forbidden');
    return;
  }

  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
    return;
  }

  response.writeHead(200, {
    'content-type': contentType(file),
    'content-length': size,
    'cache-control': 'no-store',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
}

createServer(handle).listen(port, '127.0.0.1', () => {
  console.log(`VELVET UMBRA — Grand Hall, Vault Floor, Penthouse: http://localhost:${port}`);
});
