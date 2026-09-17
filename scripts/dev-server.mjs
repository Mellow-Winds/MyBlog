import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { syncAllContent } from './sync-content.mjs';
import { syncFriendLinks } from './sync-friend-links.mjs';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const learningJsonPath = join(projectRoot, 'docs_learning', 'learning.json');
const port = Number(process.env.MYBLOG_PORT || 4173);
const appRoutes = new Set(['home', 'study', 'jinling', 'memories', 'articles']);
let syncing = null;
function refreshContent() {
  if (!syncing) syncing = syncAllContent(projectRoot).finally(() => { syncing = null; });
  return syncing;
}

const contentTypes = {
  '.ico': 'image/x-icon',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

function safeProjectPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const target = resolve(projectRoot, `.${normalize(requestedPath)}`);
  const relativePath = relative(projectRoot, target);
  return relativePath && !relativePath.startsWith('..') && !relativePath.includes(':') ? target : null;
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    if (requestUrl.pathname === '/__myblog/study-catalog') {
      const learningDocument = JSON.parse(await readFile(learningJsonPath, 'utf8'));
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      });
      response.end(JSON.stringify(learningDocument));
      return;
    }

    const target = safeProjectPath(requestUrl.pathname);
    if (!target) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    // Real files win; otherwise hand app routes to the SPA, mirroring the GitHub Pages 404.html fallback.
    const fileInfo = await stat(target).catch(() => null);
    const routeFallback = !fileInfo?.isFile() && isAppRoute(requestUrl.pathname);
    if (!fileInfo?.isFile() && !routeFallback) throw new Error('Not a file');
    const file = routeFallback ? join(projectRoot, 'index.html') : target;
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extname(file).toLowerCase()] || 'application/octet-stream'
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

let activePort = port;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && activePort < port + 10) {
    activePort += 1;
    server.listen(activePort, '127.0.0.1');
    return;
  }
  console.error(error.message);
  process.exitCode = 1;
});
server.on('listening', () => {
  console.log(`MyBlog local preview: http://127.0.0.1:${activePort}/`);
  console.log('Content manifests refresh automatically for all three reading sections.');
});
async function start() {
  try {
    console.log(`Saved ${await syncFriendLinks(projectRoot)} friend icons.`);
  } catch (error) {
    console.warn(`Unable to sync friend links: ${error.message}`);
  }
  try {
    await refreshContent();
  } catch (error) {
    console.error(`Unable to sync docs_learning/learning.json: ${error.message}`);
  }
  server.listen(activePort, '127.0.0.1');
  setInterval(() => refreshContent().catch(error => console.error(error.message)), 1500).unref();
}

function isAppRoute(urlPath) {
  const first = urlPath.replace(/^\/+/, '').split('/')[0] || 'home';
  return appRoutes.has(first);
}

start();
