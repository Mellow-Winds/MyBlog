import { extname, join } from 'node:path';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';

export const MAX_FOLDER_DEPTH = 4;
const contentPattern = /\.(md|pdf)$/i;
const assetDirectoryNames = new Set(['images', 'image', '图片']);

const defaultTermMeta = new Map([
  ['大一上', { weight: 1, year: 'freshman', session: 'first_session' }],
  ['大一下', { weight: 2, year: 'freshman', session: 'second_session' }],
  ['大二上', { weight: 3, year: 'sophomore', session: 'first_session' }]
]);

function compareNames(left, right) {
  return String(left).localeCompare(String(right), 'zh-CN', { numeric: true, sensitivity: 'base' });
}

function compareWeighted(left, right) {
  const weightDifference = (left.weight ?? Number.POSITIVE_INFINITY) - (right.weight ?? Number.POSITIVE_INFINITY);
  return weightDifference || compareNames(left.name, right.name);
}

function finiteWeight(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const weight = Number(value);
  return Number.isFinite(weight) ? weight : undefined;
}

function indexPreviousNodes(nodes, result = new Map()) {
  for (const node of Array.isArray(nodes) ? nodes : []) {
    if (!node || !node.path) continue;
    result.set(node.path, node);
    if (node.kind === 'folder') indexPreviousNodes(node.children, result);
  }
  return result;
}

function nodeName(name, extension = true) {
  return extension ? name.replace(contentPattern, '') : name;
}

function isAssetDirectory(name) {
  return assetDirectoryNames.has(String(name).toLowerCase());
}

function isIndexableDirectory(entry) {
  return entry.isDirectory() && !entry.name.startsWith('.') && !isAssetDirectory(entry.name);
}

async function readFolderTree(directory, options) {
  const { relativePrefix, folderDepth, previousNodes, warnings } = options;
  const children = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'learning.json' || isAssetDirectory(entry.name)) continue;
    const entryPath = join(directory, entry.name);
    const path = relativePrefix + entry.name;

    if (entry.isDirectory()) {
      if (folderDepth >= MAX_FOLDER_DEPTH) {
        warnings.push(`忽略超过 ${MAX_FOLDER_DEPTH} 层的目录：${path}`);
        continue;
      }
      const previous = previousNodes.get(path);
      const nested = await readFolderTree(entryPath, {
        relativePrefix: `${path}/`,
        folderDepth: folderDepth + 1,
        previousNodes,
        warnings
      });
      children.push({
        kind: 'folder',
        name: previous?.name || entry.name,
        folder: entry.name,
        path,
        ...(finiteWeight(previous?.weight) === undefined ? {} : { weight: finiteWeight(previous.weight) }),
        children: nested
      });
      continue;
    }

    if (!entry.isFile() || !contentPattern.test(entry.name)) continue;
    const info = await stat(entryPath);
    children.push({
      kind: 'file',
      name: nodeName(entry.name),
      path,
      type: extname(entry.name).slice(1).toLowerCase(),
      version: `${info.mtimeMs}-${info.size}`
    });
  }

  return children.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'folder' ? -1 : 1;
    return compareWeighted(left, right);
  });
}

function flattenFiles(nodes, files = []) {
  for (const node of nodes) {
    if (node.kind === 'file') files.push({
      name: node.name,
      path: node.path,
      type: node.type,
      version: node.version
    });
    else flattenFiles(node.children || [], files);
  }
  return files;
}

function previousCourses(grade) {
  return new Map((grade?.course || []).map(course => [course.folder || course.name, course]));
}

export async function buildLearningDocument({ learningRoot, previous = { version: 1, catalog: [] }, onWarning = () => {} }) {
  const previousCatalog = Array.isArray(previous.catalog) ? previous.catalog : [];
  const previousGrades = new Map(previousCatalog.map(grade => [grade.folder || grade.name, grade]));
  const warnings = [];
  const gradeEntries = await readdir(learningRoot, { withFileTypes: true });
  const catalog = [];

  for (const gradeEntry of gradeEntries) {
    if (!isIndexableDirectory(gradeEntry)) continue;
    const previousGrade = previousGrades.get(gradeEntry.name) || {};
    const courseMap = previousCourses(previousGrade);
    const courses = [];
    const gradePath = join(learningRoot, gradeEntry.name);
    const courseEntries = (await readdir(gradePath, { withFileTypes: true })).filter(isIndexableDirectory);

    // A folder directly under docs_learning can also be a standalone course
    // (for example docs_learning/MarkDown入门学习). Keep the learning manifest
    // shape stable by representing it as a root course, while the reader uses
    // its root flag to avoid adding the course name twice to the file URL.
    if (!courseEntries.length) {
      const previousCourse = Array.isArray(previousGrade.course) ? previousGrade.course[0] || {} : {};
      const previousNodes = indexPreviousNodes(previousCourse.children || previousGrade.children);
      const children = await readFolderTree(gradePath, {
        relativePrefix: '', folderDepth: 0, previousNodes, warnings
      });
      if (children.length) {
        const files = flattenFiles(children);
        courses.push({
          name: previousCourse.name || gradeEntry.name,
          folder: '',
          root: true,
          teacher: previousCourse.teacher || 'xxx',
          ...(finiteWeight(previousCourse.weight) === undefined ? {} : { weight: finiteWeight(previousCourse.weight) }),
          children,
          files
        });
      }
    }

    for (const courseEntry of courseEntries) {
      if (!courseEntry.isDirectory() || courseEntry.name.startsWith('.')) continue;
      const previousCourse = courseMap.get(courseEntry.name) || {};
      const previousNodes = indexPreviousNodes(previousCourse.children);
      const children = await readFolderTree(join(gradePath, courseEntry.name), {
        relativePrefix: '',
        folderDepth: 2,
        previousNodes,
        warnings
      });
      const files = flattenFiles(children);
      courses.push({
        name: previousCourse.name || courseEntry.name,
        folder: courseEntry.name,
        teacher: previousCourse.teacher || 'xxx',
        ...(finiteWeight(previousCourse.weight) === undefined ? {} : { weight: finiteWeight(previousCourse.weight) }),
        children,
        files
      });
    }

    const meta = defaultTermMeta.get(gradeEntry.name) || {};
    const weight = finiteWeight(previousGrade.weight);
    catalog.push({
      ...(weight === undefined ? { weight: meta.weight ?? 999 } : { weight }),
      year: previousGrade.year || meta.year || gradeEntry.name,
      session: previousGrade.session || meta.session || 'session',
      name: previousGrade.name || gradeEntry.name,
      folder: gradeEntry.name,
      course: courses.sort(compareWeighted)
    });
  }

  const next = { version: 1, catalog: catalog.sort(compareWeighted) };
  warnings.forEach(onWarning);
  return next;
}

export async function syncLearningJson({ learningRoot, learningJsonPath, onWarning = warning => console.warn(warning) }) {
  let previous = { version: 1, catalog: [] };
  try {
    previous = JSON.parse(await readFile(learningJsonPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const next = await buildLearningDocument({ learningRoot, previous, onWarning });
  if (JSON.stringify(previous) !== JSON.stringify(next)) {
    await writeFile(learningJsonPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }
  return next;
}

export async function buildContentDocument({ root, previous = {}, source, onWarning = console.warn }) {
  const warnings = [];
  const children = await readFolderTree(root, {
    relativePrefix: '', folderDepth: 0,
    previousNodes: indexPreviousNodes(previous.children), warnings
  });
  warnings.forEach(onWarning);
  return { version: 1, source, children };
}

export async function syncContentJson({ root, manifestPath, source }) {
  let previous = {};
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const next = await buildContentDocument({ root, previous, source });
  if (JSON.stringify(previous) !== JSON.stringify(next)) {
    await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  }
  return next;
}
