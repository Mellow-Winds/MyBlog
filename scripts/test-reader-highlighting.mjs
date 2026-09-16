import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const markdownit = require('../assets/js/markdown-it.min.js');
const readerSource = readFileSync(new URL('../assets/js/reader.js', import.meta.url), 'utf8');
// Exercise the production highlighter without initializing navigation or a DOM.
const start = readerSource.indexOf('  const languageAliases');
const end = readerSource.indexOf('  const md = window.markdownit');
assert.ok(start >= 0 && end > start);
const { highlightCode, languageLabel } = vm.runInNewContext(`(() => {
  ${readerSource.slice(start, end)}
  return { highlightCode, languageLabel };
})()`);
const md = markdownit({ highlight: highlightCode });
const guide = readFileSync(new URL('../docs_learning/实用技巧/Markdown学习指南.md', import.meta.url), 'utf8');
const fences = md.parse(guide, {}).filter(token => token.type === 'fence');
const languages = new Set();
function decodeHighlighted(html) {
  return html.replace(/<span class="tok-[a-z]+">/g, '').replace(/<\/span>/g, '')
    .replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}
for (const token of fences) {
  languages.add(token.info);
  const html = highlightCode(token.content, token.info);
  assert.equal(decodeHighlighted(html), token.content, `${token.info}: source preserved`);
  if (token.info !== 'text') assert.match(html, /<span class="tok-/, `${token.info}: syntax highlighted`);
  else assert.doesNotMatch(html, /<span/, 'plain text stays uncolored');
}
assert.equal(languages.size, 27, 'all guide languages covered');
for (const [language, source, expected] of [
  ['csharp', 'using System;', /tok-keyword">using/],
  ['go', 'func main()', /tok-keyword">func/],
  ['rust', 'println!("中文");', /tok-function">println!/],
  ['kotlin', 'fun main()', /tok-keyword">fun/],
  ['swift', 'let message = "中文"', /tok-keyword">let/],
  ['php', '<?php echo $message;', /tok-variable">\$message/],
  ['ruby', 'puts "中文"', /tok-keyword">puts/],
  ['diff', '- old\n+ new\n', /tok-inserted">\+ new/],
  ['http', 'GET / HTTP/1.1\nAccept: text/html\n', /tok-property">Accept/],
  ['regex', '^\\d+[a-z]{2,}$', /tok-number">\{2,\}/],
  ['mermaid', 'flowchart LR\nA[中文] --> B[页面]', /tok-keyword">flowchart/]
]) {
  assert.match(highlightCode(source, language), expected, language);
}
for (const language of languages) {
  const source = '<script>alert("中文 & 安全")</script>\n';
  const html = highlightCode(source, language);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(decodeHighlighted(html), source, `${language}: escape without content loss`);
}
assert.equal(highlightCode('中文 <b>&</b>', 'unknown'), '中文 &lt;b&gt;&amp;&lt;/b&gt;');
assert.equal(languageLabel('cs'), 'C#');
assert.equal(languageLabel('cpp'), 'C++');
assert.equal(highlightCode('func main()', 'golang'), highlightCode('func main()', 'go'));
assert.equal(highlightCode('中文', 'plaintext'), '中文');
console.log(`Reader highlighting passed: ${fences.length} guide blocks, ${languages.size} languages, token and escaping checks.`);
