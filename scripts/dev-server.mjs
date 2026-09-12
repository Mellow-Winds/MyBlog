import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const learningRoot = join(projectRoot, 'docs_learning');
const learningJsonPath = join(learningRoot, 'learning.json');
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

async function readContentFiles(directory, prefix = '') {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const entryPath = join(directory, entry.name);
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await readContentFiles(entryPath, path + '/'));
    if (entry.isFile() && /\.md$/i.test(entry.name)) {
      const info = await stat(entryPath);
      files.push({ name: entry.name.replace(/\.md$/i, ''), path, version: `${info.mtimeMs}-${info.size}` });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN', { numeric: true }));
}

const defaultTermMeta = new Map([
  ['大一上', { year: 'freshman', session: 'first_session' }],
  ['大一下', { year: 'freshman', session: 'second_session' }],
  ['大二上', { year: 'sophomore', session: 'first_session' }]
]);
const termOrder = ['大一上', '大一下', '大二上'];

function compareTerms(left, right) {
  const leftIndex = termOrder.indexOf(left);
  const rightIndex = termOrder.indexOf(right);
  if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
  if (leftIndex >= 0) return -1;
  if (rightIndex >= 0) return 1;
  return left.localeCompare(right, 'zh-CN', { numeric: true });
}

async function readLearningDocument() {
  try {
    return JSON.parse(await readFile(learningJsonPath, 'utf8'));
  } catch {
    return { version: 1, catalog: [] };
  }
}

async function syncLearningJson() {
  const previous = await readLearningDocument();
  const previousCatalog = Array.isArray(previous.catalog) ? previous.catalog : [];
  const previousGrades = new Map(previousCatalog.map(grade => [grade.folder || grade.name, grade]));
  const catalog = [];
  let gradeEntries = [];

  try {
    gradeEntries = await readdir(learningRoot, { withFileTypes: true });
  } catch {
    return previous;
  }

  for (const gradeEntry of gradeEntries) {
    if (!gradeEntry.isDirectory() || gradeEntry.name.startsWith('.')) continue;

    const gradePath = join(learningRoot, gradeEntry.name);
    const previousGrade = previousGrades.get(gradeEntry.name) || {};
    const previousCourses = new Map((previousGrade.course || []).map(course => [course.name, course]));
    const courses = [];
    const subjectEntries = await readdir(gradePath, { withFileTypes: true });
    for (const subjectEntry of subjectEntries) {
      if (!subjectEntry.isDirectory() || subjectEntry.name.startsWith('.')) continue;
      const files = await readContentFiles(join(gradePath, subjectEntry.name));
      const previousCourse = previousCourses.get(subjectEntry.name) || {};
      courses.push({
        name: subjectEntry.name,
        teacher: previousCourse.teacher || 'xxx',
        files: files.map(file => ({ name: file.name, path: file.path, version: file.version }))
      });
    }

    const meta = defaultTermMeta.get(gradeEntry.name) || {};
    catalog.push({
      year: previousGrade.year || meta.year || gradeEntry.name,
      session: previousGrade.session || meta.session || 'session',
      name: previousGrade.name || gradeEntry.name,
      folder: gradeEntry.name,
      course: courses.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }))
    });
  }

  const next = { version: 1, catalog: catalog.sort((a, b) => compareTerms(a.folder, b.folder)) };
  if (JSON.stringify(previous) !== JSON.stringify(next)) {
    await writeFile(learningJsonPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }
  return next;
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
      const learningDocument = await syncLearningJson();
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
  console.log('docs_learning changes are checked automatically by the page.');
});
async function start() {
  try {
    await syncLearningJson();
  } catch (error) {
    console.error(`Unable to sync docs_learning/learning.json: ${error.message}`);
  }
  server.listen(activePort, '127.0.0.1');
}

start();
