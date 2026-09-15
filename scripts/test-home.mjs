import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const app = await readFile(new URL('assets/js/app.js', root), 'utf8');
const home = await readFile(new URL('assets/js/home.js', root), 'utf8');
const normalize = vm.runInNewContext(app.slice(app.indexOf('function catalogFromLearningJson'), app.indexOf('function catalogSignature')) + ';catalogFromLearningJson');
const learning = await read('docs_learning/learning.json');
const featured = await read('home/featured.json');
const sectionCatalogs = {};
for (const [page, file] of [['memories', 'docs_dairy/dairy.json'], ['jinling', 'docs_travelling/travelling.json']]) {
  const manifest = await read(file);
  sectionCatalogs[page] = normalize({ catalog: [{ name: '', course: [{ name: '', children: manifest.children }] }] });
}
for (const entry of featured) assert.ok((await stat(new URL(entry.source, root))).isFile());

class Node {
  constructor() { this.children = []; this.dataset = {}; this.style = { setProperty: (k, v) => this[k] = v }; this.isConnected = true; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  get childElementCount() { return this.children.length; }
  closest() { return this.row; }
}
function view() {
  const node = new Node();
  node.nodes = Object.fromEntries(['.home-project-list', '.article-grid', '.personal-introduction'].map(key => [key, new Node()]));
  node.fields = ['email', 'qq', 'school', 'major'].map(key => { const field = new Node(); field.dataset.personal = key; field.row = new Node(); return field; });
  node.querySelector = key => key === '.home-view' ? node : node.nodes[key];
  node.querySelectorAll = () => node.fields;
  return node;
}
let data = {
  personal: { email: '<b>literal</b>', description: '第一行\n第二行' },
  featured: [...featured, { ...featured[0], title: '自定义标题' }],
  projects: Array.from({ length: 6 }, (_, i) => ({ name: '项目' + i, status: '开发中', description: '<script>literal</script>', url: i ? 'https://example.org/' : 'javascript:alert(1)' }))
};
const warnings = [];
let delay;
const context = vm.createContext({
  window: { MyBlogFriendLinks: { mount() {} }, MyBlogMotion: { updateHome() {} } },
  document: { baseURI: 'https://example.org/MyBlog/', createElement: tag => Object.assign(new Node(), { tagName: tag }) },
  URL, console: { warn: (...args) => warnings.push(args) },
  readingSections: { study: { root: 'docs_learning', title: '学在南雍' }, memories: { root: 'docs_dairy', title: '南雍杂忆' }, jinling: { root: 'docs_travelling', title: '玩在金陵' } },
  studyCatalog: normalize(learning), sectionCatalogs,
  fetch: async url => {
    if (delay) await delay;
    const name = url.pathname.split('/').at(-1).replace('.json', '');
    assert.ok(url.pathname.startsWith('/MyBlog/home/'));
    if (data[name] instanceof Error) throw data[name];
    return { ok: true, json: async () => data[name] };
  }
});
vm.runInContext(home, context);
const api = context.window.MyBlogHome;
const first = view();
await api.mount(first);
assert.equal(first.nodes['.home-project-list'].childElementCount, 6);
assert.equal(first.nodes['.home-project-list']['--project-count'], 5);
assert.equal(first.nodes['.home-project-list'].children[0].children.length, 2, 'unsafe link omitted');
assert.equal(first.nodes['.home-project-list'].children[0].tagName, 'article');
assert.equal(first.nodes['.home-project-list'].children[0].href, undefined);
assert.equal(first.nodes['.home-project-list'].children[1].tagName, 'a');
assert.equal(first.nodes['.home-project-list'].children[1].href, 'https://example.org/');
assert.equal(first.nodes['.home-project-list'].children[1].children.length, 2, 'no nested visit button');
assert.equal(first.nodes['.article-grid'].childElementCount, featured.length + 1);
assert.equal(first.nodes['.article-grid'].children.at(-1).children[0].textContent, '自定义标题');
featured.forEach((entry, index) => {
  const children = first.nodes['.article-grid'].children[index].children;
  if (entry.description.trim()) {
    assert.equal(children[1].className, 'article-description');
    assert.equal(children[1].textContent, entry.description);
  } else assert.equal(children.length, 2);
  assert.equal(children.at(-1).className, 'article-source');
});
assert.equal(first.fields[0].textContent, '<b>literal</b>');
assert.equal(first.nodes['.personal-introduction'].textContent, '第一行\n第二行');
for (const entry of featured) {
  const resolved = api.resolveArticle(entry.source);
  const page = entry.source.startsWith('docs_learning/') ? 'study' : entry.source.startsWith('docs_dairy/') ? 'memories' : 'jinling';
  assert.ok(resolved?.route.startsWith('#' + page + '/'));
}
assert.equal(api.resolveArticle('../outside.md'), null);
assert.equal(api.resolveArticle('docs_learning/missing.md'), null);
data.personal = new Error('broken JSON');
const second = view();
await api.mount(second);
assert.equal(second.nodes['.home-project-list'].childElementCount, 6, 'independent loading');
assert.equal(second.fields[0].textContent, '<b>literal</b>', 'last usable data retained');
let release;
delay = new Promise(resolve => { release = resolve; });
const stale = view();
const loading = api.mount(stale);
stale.isConnected = false;
stale.nodes['.home-project-list'].replaceChildren();
release();
await loading;
assert.equal(stale.nodes['.home-project-list'].childElementCount, 0, 'detached view is not updated');
assert.ok(warnings.length);
console.log('PASS: real sources, title override, article descriptions, whole-card project links, six projects, newline, text safety, URL rejection, isolated failure, stale requests, Pages subpath.');
