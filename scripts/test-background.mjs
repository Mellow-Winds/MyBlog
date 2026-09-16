import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const timers = new Map();
let nextTimer = 0;
const listeners = {};
const properties = {};
let now = Date.now();
const animations = [];
const motion = { matches: false, addEventListener(type, fn) { this.listener = fn; } };
class Element {
  constructor() { this.children = []; this.dataset = {}; this.attributes = {}; this.isConnected = true; this.text = ''; }
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  get firstElementChild() { return this.children[0]; }
  append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); }
  prepend(node) { node.parent = this; this.children.unshift(node); }
  remove() { this.parent.children = this.parent.children.filter(node => node !== this); }
  replaceChildren(...nodes) { this.text = ''; this.children = []; this.append(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  animate(frames, options) {
    const animation = { node: this, frames, options, cancel() { this.cancelled = true; } };
    animations.push(animation);
    return animation;
  }
}
const context = vm.createContext({
  Date: class extends Date { static now() { return now; } },
  window: { addEventListener(type, fn) { listeners[type] = fn; }, matchMedia() { return motion; } },
  document: {
    createElement() { return new Element(); },
    documentElement: { dataset: {}, style: { setProperty(key, value) { properties[key] = value; } } },
    addEventListener(type, fn) { listeners[type] = fn; }, hidden: false
  },
  setTimeout(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
  clearTimeout(id) { timers.delete(id); }
});
vm.runInContext(read('assets/js/background.js'), context);
const theme = context.window.MyBlogBackground;
const DAY = 86400000;
const start = Date.parse('2026-02-04T00:00:00+08:00');
assert.equal(theme.yearColors.length, 96);
assert.equal(theme.palettes.length, 4);
for (const palette of theme.palettes) {
  assert.equal(palette.subthemes.length, 6);
  assert.equal(palette.colors.length, 24);
  assert.ok(palette.subthemes.every(group => group.colors.length === 4));
}
// Verify boundaries against explicit cross-season colors, including annual wrap.
for (const [index, expected] of [
  [0, ['#8EB7B0', '#91B8AA', '#92BAA9']],
  [24, ['#91C1AB', '#8CBFAF', '#88BFB1']],
  [48, ['#99BC94', '#9FBC8A', '#A5BB86']],
  [72, ['#C1797B', '#BE7A83', '#B97B8A']],
  [95, ['#8BB6B6', '#8EB7B0', '#91B8AA']]
]) assert.deepEqual(Array.from(theme.gradient(index)), expected);
assert.equal(theme.getTheme(start - 1).term, '大寒');
assert.equal(theme.getTheme(start).term, '立春');
assert.equal(theme.getTheme(start + 15 * DAY - 1).term, '立春');
assert.equal(theme.getTheme(start + 15 * DAY).term, '雨水');
for (const year of [2026, 2028]) {
  const first = Date.parse(`${year}-02-04T00:00:00+08:00`);
  const next = Date.parse(`${year + 1}-02-04T00:00:00+08:00`);
  let previous;
  const groups = new Set();
  for (let date = first; date < next; date += DAY) {
    const current = theme.getTheme(date);
    groups.add(current.termIndex);
    assert.ok(current.globalIndex >= current.termIndex * 4 && current.globalIndex < (current.termIndex + 1) * 4);
    assert.equal(theme.getTheme(date + DAY - 1).globalIndex, current.globalIndex, 'stable throughout UTC+8 day');
    if (previous) assert.notEqual(current.globalIndex, previous.globalIndex, 'changes every day');
    previous = current;
  }
  assert.equal(groups.size, 24);
  assert.equal(theme.getTheme(next - 1).term, '大寒');
  assert.equal(theme.getTheme(next).term, '立春');
}
theme.start();
theme.start();
assert.equal(timers.size, 1, 'one midnight timer');
assert.ok([...timers.values()][0].delay <= DAY + 50);
assert.match(properties['--theme-deep'], /^#[0-9A-F]{6}$/);
timers.clear();

vm.runInContext(read('assets/js/uptime.js'), context);
const uptime = context.window.MyBlogUptime;
const epoch = Date.parse('2026-09-13T16:00:00+08:00');
for (const [offset, expected] of [
  [-1, '00年00月00日00时00分00秒'], [0, '00年00月00日00时00分00秒'],
  [1000, '00年00月00日00时00分01秒'], [30 * DAY, '00年01月00日00时00分00秒'],
  [365 * DAY, '01年00月00日00时00分00秒'],
  [(365 + 30 + 2) * DAY + 3661000, '01年01月02日01时01分01秒']
]) assert.equal(uptime.format(epoch + offset), `已运行${expected}`);
const node = new Element();
const root = { querySelector: () => node };
now = epoch + 25000;
uptime.mount(root);
assert.match(node.textContent, /^已运行/);
assert.equal(animations.length, 0, 'first render has no animation');
const seconds = node.firstElementChild.children[6].firstElementChild;
const tens = seconds.children[0];
const ones = seconds.children[1];
const step = secondsAfterStart => {
  now = epoch + secondsAfterStart * 1000;
  [...timers.values()][0].fn();
};
step(26);
assert.equal(seconds.children[0], tens, 'tens node is preserved');
assert.equal(tens.dataset.value, '2');
assert.equal(ones.dataset.value, '6');
assert.equal(animations.length, 2, 'only one changed digit has outgoing and incoming faces');
assert.ok(animations.every(animation => animation.node === ones.firstElementChild || animation.node.parent === ones));
assert.equal(animations[0].frames[1].transform, 'rotateX(90deg)', 'old digit lifts upward');
const finish = () => {
  [...animations].forEach(animation => { if (!animation.cancelled) animation.onfinish?.(); });
  animations.length = 0;
};
finish();
step(29); finish();
step(30);
assert.equal(animations.length, 4, '29 -> 30 animates both changed digits');
finish();
step(59); finish();
step(60);
assert.equal(node.attributes['aria-label'], '已运行00年00月00日00时01分00秒');
finish();
assert.equal(seconds.children.length, 2, '59 -> 00 retains both digit slots');
assert.equal(seconds.children[0], tens, 'tens node remains stable at minute rollover');
step(66); finish();
assert.equal(seconds.textContent, '06', 'single-digit seconds have a leading zero');
step(69); finish();
step(70);
finish();
assert.equal(seconds.children.length, 2, '09 -> 10 keeps a stable two-digit width');
assert.equal(seconds.children[0], tens);
motion.matches = true;
step(71);
assert.equal(animations.length, 0, 'reduced motion updates without flips');
motion.matches = false;
step(72);
assert.equal(animations.length, 2);
motion.matches = true;
motion.listener();
assert.ok(animations.every(animation => animation.cancelled), 'enabling reduced motion cancels in-flight flips');
finish();
assert.equal(timers.size, 1);
uptime.mount(root);
assert.equal(timers.size, 1, 'remount does not multiply timers');
uptime.unmount();
assert.equal(timers.size, 0, 'leaving home clears timer');
uptime.mount(root);
node.isConnected = false;
[...timers.values()][0].fn();
assert.equal(timers.size, 0, 'removed view stops ticking');

console.log('PASS: calendar (normal/leap years), UTC+8 rollover, daily variation, seasonal neighbors, uptime and timer lifecycle.');
