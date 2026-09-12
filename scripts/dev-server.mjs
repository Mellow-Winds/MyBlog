import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, stat } from 'node:fs/promises';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const learningRoot = join(projectRoot, 'docs_learning');
const port = Number(process.env.MYBLOG_PORT || 4173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

async function countContentFiles(directory) {
  let count = 0;
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) count += await countContentFiles(entryPath);
    if (entry.isFile()) count += 1;
  }

  return count;
}

async function readStudyCatalog() {
  const grades = [];
  let gradeEntries = [];

  try {
    gradeEntries = await readdir(learningRoot, { withFileTypes: true });
  } catch {
    return grades;
  }

  for (const gradeEntry of gradeEntries) {
    if (!gradeEntry.isDirectory() || gradeEntry.name.startsWith('.')) continue;

    const gradePath = join(learningRoot, gradeEntry.name);
    const subjects = [];
    const subjectEntries = await readdir(gradePath, { withFileTypes: true });
    for (const subjectEntry of subjectEntries) {
      if (!subjectEntry.isDirectory() || subjectEntry.name.startsWith('.')) continue;
      subjects.push({
        name: subjectEntry.name,
        contentCount: await countContentFiles(join(gradePath, subjectEntry.name))
      });
    }

    grades.push({ name: gradeEntry.name, subjects });
  }

  return grades;
}

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
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      });
      response.end(JSON.stringify(await readStudyCatalog()));
      return;
    }

    const target = safeProjectPath(requestUrl.pathname);
    if (!target) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const fileInfo = await stat(target);
    if (!fileInfo.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[extname(target).toLowerCase()] || 'application/octet-stream'
    });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`MyBlog local preview: http://127.0.0.1:${port}/`);
  console.log('docs_learning changes are checked automatically by the page.');
});
