import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncFriendLinks, iconCandidates } from './sync-friend-links.mjs';

assert.equal(iconCandidates('<base href="/assets/"><link href="a.png?x=1&amp;y=2" rel="shortcut icon">', 'https://example.org/blog/')[0], 'https://example.org/assets/a.png?x=1&y=2');
const root = await mkdtemp(join(tmpdir(), 'myblog-friends-'));
await mkdir(join(root, 'home/friend_url'), { recursive: true });
await mkdir(join(root, 'home/friend_url/icons'));
await writeFile(join(root, 'home/friend_url/icons/manual.png'), 'manual');
const path = join(root, 'home/friend_url/fr_url.json');
const entries = [
  { name: 'local', icon: './icons/manual.png', url: 'https://local.example/' },
  { name: 'download', icon: 'https://download.example/avatar.jpg', url: 'https://download.example/' },
  { name: 'unavailable', icon: '', url: 'https://missing.example/' }
];
await writeFile(path, JSON.stringify(entries));
const calls = [];
const warnings = [];
const fetcher = async url => {
  const value = String(url); calls.push(value);
  if (value === 'https://download.example/avatar.jpg') return new Response(new Uint8Array([255,216,255,224,0,16]), { headers: { 'content-type': 'image/jpeg' } });
  if (value === 'https://download.example/') return new Response('<link rel="icon" href="/logo.ico">');
  if (value === 'https://download.example/logo.ico') return new Response(new Uint8Array([0,0,1,0,1,0]), { headers: { 'content-type': 'image/x-icon' } });
  return new Response('', { status: 404 });
};
assert.equal(await syncFriendLinks(root, { fetcher, warn: value => warnings.push(value) }), 1);
const saved = JSON.parse(await readFile(path, 'utf8'));
assert.equal(saved[0].icon, entries[0].icon);
assert.match(saved[1].icon, /^\.\/icons\/download\.example-[a-f0-9]+\.jpg$/);
assert.equal((await readFile(join(root, 'home/friend_url', saved[1].icon))).length, 6);
assert.equal(saved[2].icon, '');
assert.equal(warnings.length, 1);
assert.ok(!calls.some(url => url.includes('local.example')));
calls.length = 0;
assert.equal(await syncFriendLinks(root, { fetcher, warn() {} }), 0);
assert.ok(!calls.some(url => url.includes('download.example')));
console.log('PASS: discovery, local preservation, download, writeback, failure fallback and repeat sync.');
console.log(`Test fixtures retained at ${root}`);
