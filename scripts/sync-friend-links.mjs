import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' };
const decode = value => value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'");
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]));

export function iconCandidates(html, pageUrl) {
  let base = pageUrl;
  try { base = new URL(attributes(html.match(/<base\b[^>]*>/i)?.[0] || '').href || pageUrl, pageUrl).href; } catch {}
  const candidates = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const attr = attributes(tag);
    if (!/(?:^|\s)(?:icon|apple-touch-icon)(?:\s|$)/i.test(attr.rel || '') || !attr.href) continue;
    try { candidates.push(new URL(attr.href, base).href); } catch {}
  }
  candidates.push(new URL('/favicon.ico', pageUrl).href, new URL('/apple-touch-icon.png', pageUrl).href);
  return [...new Set(candidates)].filter(url => /^https?:\/\//i.test(url)).slice(0, 8);
}

async function request(url, fetcher, limit) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error('Response too large');
    chunks.push(chunk);
  }
  return { response, bytes: Buffer.concat(chunks) };
}

async function saveIcon({ projectRoot, sourceUrl, siteUrl, fetcher }) {
  const { response, bytes } = await request(sourceUrl, fetcher, 2 * 1024 * 1024);
  const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const extension = extensions[type] || (bytes.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0])) ? 'ico' : null);
  if (!extension || !bytes.length) throw new Error('Unsupported image response');
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const filename = `${siteUrl.hostname.replace(/[^a-z0-9.-]/gi, '-')}-${hash}.${extension}`;
  await mkdir(join(projectRoot, 'home/friend_url/icons'), { recursive: true });
  await writeFile(join(projectRoot, 'home/friend_url/icons', filename), bytes);
  return `./icons/${filename}`;
}

async function localIconExists(projectRoot, value) {
  if (typeof value !== 'string' || !value.startsWith('./icons/')) return false;
  const target = resolve(projectRoot, 'home/friend_url', value.slice(2));
  const within = relative(resolve(projectRoot, 'home/friend_url/icons'), target);
  if (!within || within.startsWith('..') || within.includes(':')) return false;
  try { return (await stat(target)).isFile(); } catch { return false; }
}

export async function syncFriendLinks(projectRoot = root, { fetcher = fetch, warn = console.warn } = {}) {
  const manifest = join(projectRoot, 'home/friend_url/fr_url.json');
  const original = await readFile(manifest, 'utf8');
  const entries = JSON.parse(original);
  if (!Array.isArray(entries)) throw new Error('fr_url.json must be an array');
  let updated = 0;
  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string' || !entry.name.trim() || typeof entry.url !== 'string') {
      warn('Invalid friend link entry'); continue;
    }
    try {
      const url = new URL(entry.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL');
      if (await localIconExists(projectRoot, entry.icon)) continue;
      const explicitIcon = typeof entry.icon === 'string' && /^https?:\/\//i.test(entry.icon) ? entry.icon : '';
      if (explicitIcon) {
        try {
          entry.icon = await saveIcon({ projectRoot, sourceUrl: explicitIcon, siteUrl: url, fetcher });
          updated++;
          continue;
        } catch (error) { warn(`${entry.name}: configured icon download failed (${error.message}), trying website icon`); }
      } else if (entry.icon) {
        warn(`${entry.name}: local icon not found, keeping configured path`);
        continue;
      }
      let html = '', pageUrl = url.href;
      try {
        const page = await request(url, fetcher, 2 * 1024 * 1024);
        html = page.bytes.toString('utf8');
        pageUrl = page.response.url || pageUrl;
      } catch { /* Standard paths still work when the page cannot be read. */ }
      let saved = false;
      for (const candidate of iconCandidates(html, pageUrl)) {
        try {
          entry.icon = await saveIcon({ projectRoot, sourceUrl: candidate, siteUrl: url, fetcher });
          updated++;
          saved = true;
          break;
        } catch { /* Try the next declared or conventional icon. */ }
      }
      if (!saved) warn(`No icon saved for ${entry.name}`);
    } catch (error) { warn(`${entry.name}: ${error.message}`); }
  }
  if (updated) {
    if (await readFile(manifest, 'utf8') !== original) throw new Error('fr_url.json changed during sync; rerun to preserve edits');
    await writeFile(manifest, JSON.stringify(entries, null, 2) + '\n');
  }
  return updated;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Saved ${await syncFriendLinks()} friend icons.`);
}
