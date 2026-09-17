import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/quotes.js', import.meta.url), 'utf8');
for (const name of ['quote', 'pages_quote']) {
  const entries = JSON.parse(await readFile(new URL(`../home/${name}.json`, import.meta.url), 'utf8'));
  assert.ok(entries.length > 1 && entries.every(value => typeof value === 'string' && value.trim()));
}
const storage = new Map();
let data = ['第一行\n第二行', '<b>纯文本</b>', '第三条文案'];
let gate, failed = false;
const warnings = [];
function create() {
  const context = vm.createContext({
    window: {}, document: { baseURI: 'https://example.org/MyBlog/' }, URL,
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    console: { warn: (...args) => warnings.push(args) },
    fetch: async url => {
      assert.ok(url.pathname.startsWith('/MyBlog/home/'));
      if (gate) await gate;
      return { ok: !failed, status: failed ? 404 : 200, json: async () => data };
    }
  });
  vm.runInContext(source, context);
  return context.window.MyBlogQuotes;
}
const node = () => ({ isConnected: true, textContent: '' });
const api = create(), first = node(), second = node();
await api.mount(first, 'quote');
await api.mount(second, 'quote');
const third = node(); await api.mount(third, 'quote');
assert.equal(new Set([first.textContent, second.textContent, third.textContent]).size, data.length, 'one shuffled round has no repeats');
const refreshed = node();
await create().mount(refreshed, 'quote');
assert.ok(data.includes(refreshed.textContent), 'reload continues or starts a valid shuffled round');
const decorated = node();
await api.mount(decorated, 'pages_quote', value => `『${value}』`);
assert.ok(decorated.textContent.startsWith('『') && decorated.textContent.endsWith('』'));
let release;
gate = new Promise(resolve => { release = resolve; });
const stale = node(), loading = create().mount(stale, 'quote');
stale.isConnected = false;
release(); await loading; gate = null;
assert.equal(stale.textContent, '', 'detached view not updated');
data = ['唯一一句'];
const single = node(); await create().mount(single, 'quote');
assert.equal(single.textContent, data[0]);
data = []; const empty = node(); await create().mount(empty, 'quote');
assert.equal(empty.textContent, ''); assert.equal(warnings.length, 1);
failed = true; const retry = create(); await retry.mount(empty, 'quote');
failed = false; data = ['恢复']; await retry.mount(empty, 'quote');
assert.equal(empty.textContent, '恢复', 'failed request can retry');
console.log('PASS: real JSON, newline/text safety, no adjacent repeats, reload, decoration, detached view, single/empty lists and failed-request retry.');
