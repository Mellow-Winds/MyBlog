import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const markdown = require('../assets/js/markdown-it.min.js')({ html: false });
export function plainText(source) {
  const collect = tokens => tokens.map(token => token.children ? collect(token.children) :
    ['text', 'code_inline', 'fence', 'code_block'].includes(token.type) ? token.content :
      token.block || ['softbreak', 'hardbreak'].includes(token.type) ? ' ' : '').join('');
  return collect(markdown.parse(source, {})).replace(/\s+/g, ' ').trim();
}
export async function buildSearchIndex(root) {
  const documents = [];
  const add = async (section, base, nodes, context, routeParts) => {
    for (const node of nodes || []) {
      if (node.kind === 'folder') { await add(section, base, node.children, context, routeParts); continue; }
      if (!/\.(md|pdf)$/i.test(node.path)) continue;
      const sourcePath = [base, node.path].join('/');
      const type = /\.pdf$/i.test(node.path) ? 'pdf' : 'md';
      const body = type === 'md' ? plainText(await readFile(join(root, sourcePath), 'utf8')) : '';
      documents.push({ id: sourcePath, name: node.path.split('/').at(-1), type, body,
        source: [...context, ...node.path.split('/').slice(0, -1)].filter(Boolean).join('-'),
        route: '#' + section + '/' + [...routeParts, node.path].map(encodeURIComponent).join('/') });
    }
  };
  const learning = JSON.parse(await readFile(join(root, 'docs_learning/learning.json'), 'utf8'));
  for (const term of learning.catalog) for (const course of term.course) {
    await add('study', ['docs_learning', term.folder || term.name, course.root ? '' : course.folder || course.name].filter(Boolean).join('/'),
      course.children || course.files, course.root ? [term.name] : [term.name, course.name], [term.name, course.name]);
  }
  for (const [section, source, title] of [['jinling', 'travelling', '玩在金陵'], ['memories', 'dairy', '南雍杂忆']]) {
    const manifest = JSON.parse(await readFile(join(root, `docs_${source}/${source}.json`), 'utf8'));
    await add(section, `docs_${source}`, manifest.children, [title], []);
  }
  const target = join(root, 'assets/data/search-index.json');
  const output = JSON.stringify({ documents });
  await mkdir(join(root, 'assets/data'), { recursive: true });
  const previous = await readFile(target, 'utf8').catch(() => '');
  if (previous !== output) await writeFile(target, output);
  return documents;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Indexed ${(await buildSearchIndex(fileURLToPath(new URL('..', import.meta.url)))).length} files.`);
}
