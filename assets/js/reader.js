/* Reuses MD_Demo's markdown-it renderer with raw HTML disabled. */
window.MyBlogReader = (() => {
  const languageAliases = {
    javascript: 'js', typescript: 'ts', jsx: 'jsx', tsx: 'tsx',
    python: 'python', py: 'python', shell: 'bash', sh: 'bash', zsh: 'bash',
    html: 'html', xml: 'html', svg: 'html',
    yml: 'yaml', md: 'markdown', text: 'text', plaintext: 'text'
  };
  const keywordSets = {
    js: new Set('as async await break case catch class const continue debugger default delete do else export extends finally for from function get if implements import in instanceof interface let new null of package private protected public return set static super switch this throw try typeof undefined var void while with yield true false'.split(' ')),
    ts: new Set('as async await break case catch class const continue debugger default delete do else export extends finally for from function if implements import in instanceof interface keyof let namespace never new null of private protected public readonly return static super switch this throw type typeof unknown var void while with yield true false'.split(' ')),
    python: new Set('and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield True False None'.split(' ')),
    bash: new Set('case do done elif else esac fi for function if in select then time until while do'.split(' ')),
    json: new Set('true false null'.split(' '))
  };
  const escCode = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const span = (className, value) => `<span class="tok-${className}">${escCode(value)}</span>`;

  function normalizedLanguage(info) {
    const raw = String(info || '').trim().toLowerCase().split(/[\s:]/)[0];
    return languageAliases[raw] || raw || 'text';
  }

  function highlightMarkup(source) {
    let cursor = 0;
    let html = '';
    const markup = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
    for (const match of source.matchAll(markup)) {
      html += escCode(source.slice(cursor, match.index));
      const token = match[0];
      if (token.startsWith('<!--')) html += span('comment', token);
      else {
        const tag = token.match(/^(<\/?)([A-Za-z][\w:-]*)([\s\S]*?)(\/?>)$/);
        if (!tag) html += escCode(token);
        else {
          html += escCode(tag[1]) + span('tag', tag[2]);
          const attributes = tag[3];
          let attributeCursor = 0;
          const attributePattern = /([A-Za-z_:][\w:.-]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)/g;
          for (const attribute of attributes.matchAll(attributePattern)) {
            html += escCode(attributes.slice(attributeCursor, attribute.index));
            html += span('attribute', attribute[1]) + escCode(attribute[2]) + span('string', attribute[3]);
            attributeCursor = attribute.index + attribute[0].length;
          }
          html += escCode(attributes.slice(attributeCursor));
          html += escCode(tag[4]);
        }
      }
      cursor = match.index + token.length;
    }
    return html + escCode(source.slice(cursor));
  }

  function highlightTokens(source, language) {
    const keywords = keywordSets[language] || new Set();
    const supportsHashComment = language === 'python' || language === 'bash' || language === 'yaml';
    const isCss = language === 'css';
    let html = '';
    let index = 0;
    while (index < source.length) {
      const rest = source.slice(index);
      const comment = rest.match(language === 'python' && rest.startsWith('###') ? /^###[\s\S]*?###/ : /^(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/);
      if (comment || (supportsHashComment && rest[0] === '#')) {
        const value = comment ? comment[0] : rest.match(/^#[^\n]*/)[0];
        html += span('comment', value);
        index += value.length;
        continue;
      }
      const quote = rest.match(/^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/);
      if (quote) {
        html += span('string', quote[0]);
        index += quote[0].length;
        continue;
      }
      const number = rest.match(/^(?:\b(?:0x[\da-f]+|0b[01]+|\d+(?:\.\d+)?)\b)/i);
      if (number) {
        html += span('number', number[0]);
        index += number[0].length;
        continue;
      }
      const word = rest.match(/^[A-Za-z_$][\w$]*/);
      if (word) {
        const value = word[0];
        const after = rest.slice(value.length).match(/^\s*/)[0].length;
        const next = rest.slice(value.length + after, value.length + after + 1);
        let className = 'plain';
        if (keywords.has(value)) className = 'keyword';
        else if (next === '(') className = 'function';
        else if (rest.slice(0, index).trimEnd().endsWith('.')) className = 'property';
        else if (isCss && next === ':') className = 'property';
        html += className === 'plain' ? escCode(value) : span(className, value);
        index += value.length;
        continue;
      }
      const operator = rest.match(/^(?:===|!==|=>|==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|[+\-*\/%=!<>?:&|])/);
      if (operator) {
        html += span('operator', operator[0]);
        index += operator[0].length;
        continue;
      }
      html += escCode(source[index]);
      index += 1;
    }
    return html;
  }

  function highlightCode(source, info) {
    const language = normalizedLanguage(info);
    if (language === 'html') return highlightMarkup(source);
    if (language === 'css') return highlightTokens(source, language);
    if (language === 'text' || language === 'markdown') return escCode(source);
    return highlightTokens(source, language);
  }

  const md = window.markdownit({
    html: false,
    linkify: false,
    typographer: false,
    highlight: (source, info) => highlightCode(source, info)
  });
  let request;
  let loadedKey = '';
  let listKey = '';
  let retry;
  let outlineHeadings = [];
  const esc = text => md.utils.escapeHtml(String(text));
  const routeFor = (grade, subject, file) => '#study/' + [grade, subject, file].map(encodeURIComponent).join('/');
  const fileIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h9l5 5v13H5Z M14 3v5h5 M8 12h8 M8 16h6"/></svg>';

  function reset() {
    request?.abort();
    loadedKey = '';
    listKey = '';
    outlineHeadings = [];
  }

  function updateOutline() {
    const main = document.querySelector('.main-stage');
    if (!outlineHeadings.length || !main) return;
    const edge = main.getBoundingClientRect().top + 80;
    let active = outlineHeadings[0];
    for (const heading of outlineHeadings) {
      if (heading.getBoundingClientRect().top <= edge) active = heading;
    }
    document.querySelectorAll('[data-reader-heading]').forEach(button => {
      button.setAttribute('aria-current', button.dataset.readerHeading === active.id ? 'location' : 'false');
    });
  }

  async function show(grade, subject, requestedPath) {
    if (!grade || !subject) return;
    const files = subject.files || [];
    const selected = requestedPath ? files.find(file => file.path === requestedPath) : files[0];
    const list = document.querySelector('.course-files');
    const signature = JSON.stringify([grade.name, subject.name, files.map(file => [file.path, file.name])]);
    const rebuilt = listKey !== signature;
    if (listKey !== signature) {
      const scroll = list.scrollTop;
      const focusedPath = list.contains(document.activeElement) ? document.activeElement.dataset.readerFile : null;
      list.innerHTML = files.map(file => `<a class="nav-link file-link" href="${esc(routeFor(grade.name, subject.name, file.path))}" data-reader-file="${esc(file.path)}" data-ripple title="${esc(file.path)}">${fileIcon}<span>${esc(file.name)}</span></a>`).join('');
      list.scrollTop = listKey.startsWith(JSON.stringify([grade.name, subject.name]).slice(0, -1)) ? scroll : 0;
      listKey = signature;
      if (focusedPath) [...list.children].find(node => node.dataset.readerFile === focusedPath)?.focus({ preventScroll: true });
    }
    for (const link of list.children) {
      const active = link.dataset.readerFile === selected?.path;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    if (rebuilt) {
      const active = list.querySelector('[aria-current="page"]');
      if (active) {
        const itemRect = active.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        if (itemRect.bottom > listRect.bottom) list.scrollTop += itemRect.bottom - listRect.bottom + 12;
        else if (itemRect.top < listRect.top) list.scrollTop -= listRect.top - itemRect.top;
      }
    }
    const article = document.getElementById('markdown-content');
    const outline = document.querySelector('.reader-outline');
    const view = article.closest('.course-view');
    view.dataset.grade = grade.name;
    view.dataset.subject = subject.name;
    const key = JSON.stringify([grade.name, subject.name, selected?.path, selected?.version, requestedPath && !selected]);
    if (loadedKey === key) return;
    const previousPath = loadedKey ? JSON.parse(loadedKey).slice(0, 3) : [];
    const sameFile = JSON.stringify(previousPath) === JSON.stringify([grade.name, subject.name, selected?.path]);
    loadedKey = key;
    request?.abort();
    request = new AbortController();
    const signal = request.signal;
    const main = document.querySelector('.main-stage');
    const previousScroll = main.scrollTop;
    outline.hidden = true;
    outlineHeadings = [];
    article.replaceChildren();
    if (!sameFile) document.querySelector('.main-stage').scrollTop = 0;
    if (!selected) {
      if (requestedPath) article.innerHTML = '<p role="status">文件不存在或已移除。</p>';
      return;
    }
    if (!requestedPath) history.replaceState(null, '', routeFor(grade.name, subject.name, selected.path));
    const url = new URL(['docs_learning', grade.name, subject.name, ...selected.path.split('/')].map(encodeURIComponent).join('/'), document.baseURI);
    article.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url, { cache: 'no-store', signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.text();
      if (signal.aborted) return;
      article.innerHTML = md.render(source);
      article.querySelectorAll('pre > code').forEach(code => {
        const className = [...code.classList].find(name => name.startsWith('language-'));
        const language = normalizedLanguage(className?.slice('language-'.length));
        code.dataset.language = language;
        code.parentElement.dataset.language = language;
      });
      const slugs = new Map();
      outlineHeadings = [...article.querySelectorAll('h1,h2,h3,h4,h5,h6')];
      outlineHeadings.forEach((heading, index) => {
        heading.id = `md-heading-${index}`;
        const slug = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        if (!slugs.has(slug)) slugs.set(slug, heading.id);
      });
      outline.innerHTML = '<div class="chapter-index-heading"><strong>章节导航</strong></div>' + outlineHeadings.map(heading => `<button type="button" data-reader-heading="${heading.id}" data-level="${heading.tagName.slice(1)}" data-ripple>${esc(heading.textContent)}</button>`).join('');
      outline.hidden = !outlineHeadings.length;
      article.querySelectorAll('a[href], img[src]').forEach(node => {
        const attribute = node.tagName === 'IMG' ? 'src' : 'href';
        const value = node.getAttribute(attribute);
        if (value.startsWith('#')) {
          let slug;
          try { slug = decodeURIComponent(value.slice(1)); } catch { return; }
          const heading = slugs.get(slug);
          if (heading) node.dataset.readerHeading = heading;
          return;
        }
        const resolved = new URL(value, url);
        const base = new URL('./', url);
        if (node.tagName === 'A' && resolved.origin === url.origin && /\.md$/i.test(resolved.pathname)) {
          const linked = files.find(file => new URL(file.path.split('/').map(encodeURIComponent).join('/'), new URL(['docs_learning', grade.name, subject.name, ''].map(encodeURIComponent).join('/'), document.baseURI)).pathname === resolved.pathname);
          if (linked) { node.href = routeFor(grade.name, subject.name, linked.path); return; }
        }
        node.setAttribute(attribute, new URL(value, base).href);
      });
      if (sameFile) main.scrollTop = previousScroll;
      updateOutline();
    } catch (error) {
      if (signal.aborted) return;
      article.innerHTML = '<p role="status">文件读取失败。</p><button type="button" class="reader-retry" data-reader-retry data-ripple>重试</button>';
      retry = () => { loadedKey = ''; show(grade, subject, selected.path); };
    } finally {
      if (!signal.aborted) article.removeAttribute('aria-busy');
    }
  }

  document.addEventListener('click', event => {
    const jump = event.target.closest('[data-reader-heading]');
    if (jump) {
      event.preventDefault();
      document.getElementById(jump.dataset.readerHeading)?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    if (event.target.closest('[data-reader-retry]')) retry?.();
  });
  document.querySelector('.main-stage').addEventListener('scroll', updateOutline, { passive: true });
  return { show, reset };
})();
