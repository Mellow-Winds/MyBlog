/* Markdown reader: local markdown-it, local KaTeX, and a small reader toolbar. */
window.MyBlogReader = (() => {
  const languageAliases = {
    javascript: 'js', typescript: 'ts', jsx: 'jsx', tsx: 'tsx',
    python: 'python', py: 'python', shell: 'bash', sh: 'bash', zsh: 'bash',
    html: 'html', xml: 'html', svg: 'html', css: 'css',
    yml: 'yaml', md: 'markdown', text: 'text', plaintext: 'text'
  };
  const keywordSets = {
    js: new Set('as async await break case catch class const continue debugger default delete do else export extends finally for from function get if implements import in instanceof interface let new null of package private protected public return set static super switch this throw try typeof undefined var void while with yield true false'.split(' ')),
    ts: new Set('as async await break case catch class const continue def delete do else export extends finally for from function if implements import in instanceof interface keyof let namespace never new null of private protected public readonly return static super this throw type typeof unknown var void while with yield true false'.split(' ')),
    python: new Set('and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise try while with yield True False None'.split(' ')),
    bash: new Set('case do done elif else esac fi for function if in select then time until while'.split(' ')),
    json: new Set('true false null'.split(' '))
  };
  const escCode = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
          html += escCode(attributes.slice(attributeCursor)) + escCode(tag[4]);
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
    if (language === 'text' || language === 'markdown') return escCode(source);
    return highlightTokens(source, language);
  }

  const md = window.markdownit({ html: false, linkify: false, typographer: false, highlight: (source, info) => highlightCode(source, info) });
  const esc = text => md.utils.escapeHtml(String(text));
  const routeFor = (grade, subject, file) => '#study/' + [grade, subject, file].map(encodeURIComponent).join('/');

  let request;
  let loadedKey = '';
  let listKey = '';
  let retry;
  let outlineHeadings = [];
  let activeContext = null;
  const viewState = { filter: 'all', sort: 'name' };
  const fileTools = document.querySelector('.file-tools');
  const fileList = document.querySelector('.course-files');
  const toolZones = [...document.querySelectorAll('.file-tool-zone')];
  let activeMenu = null;
  let closeTimer = 0;

  const fileType = file => file?.type === 'pdf' || /\.pdf$/i.test(file?.path || '') ? 'pdf' : 'md';

  function setPopover(kind, open) {
    const button = fileTools?.querySelector(`[data-reader-${kind}]`);
    const popover = fileTools?.querySelector(`[data-reader-popover="${kind}"]`);
    if (!button || !popover) return;
    popover.dataset.state = open ? 'open' : 'closed';
    popover.setAttribute('aria-hidden', String(!open));
    button.setAttribute('aria-expanded', String(open));
    if (open) activeMenu = kind;
    else if (activeMenu === kind) activeMenu = null;
  }

  function openPopover(kind) {
    window.clearTimeout(closeTimer);
    if (activeMenu && activeMenu !== kind) setPopover(activeMenu, false);
    setPopover(kind, true);
  }

  function closePopovers() {
    window.clearTimeout(closeTimer);
    setPopover('filter', false);
    setPopover('sort', false);
  }

  function scheduleClose() {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(closePopovers, 280);
  }

  function renderToolState() {
    fileTools?.querySelectorAll('[data-reader-filter-option]').forEach(button => button.setAttribute('aria-checked', String(button.dataset.readerFilterOption === viewState.filter)));
    fileTools?.querySelectorAll('[data-reader-sort-option]').forEach(button => button.setAttribute('aria-checked', String(button.dataset.readerSortOption === viewState.sort)));
  }

  function visibleFiles(files) {
    const filtered = viewState.filter === 'all' ? files : files.filter(file => fileType(file) === viewState.filter);
    return [...filtered].sort((left, right) => {
      if (viewState.sort === 'type') {
        const typeDifference = fileType(left).localeCompare(fileType(right));
        if (typeDifference) return typeDifference;
      }
      return String(left.name).localeCompare(String(right.name), 'zh-CN', { numeric: true, sensitivity: 'base' });
    });
  }

  function renderFileList(grade, subject, requestedPath) {
    if (!fileList) return null;
    const files = subject?.files || [];
    const selected = requestedPath ? files.find(file => file.path === requestedPath) : files[0];
    const shown = visibleFiles(files);
    const signature = JSON.stringify([grade.name, subject.name, viewState, files.map(file => [file.path, file.name, file.type, file.version])]);
    const rebuilt = listKey !== signature;
    if (rebuilt) {
      const scroll = fileList.scrollTop;
      const focusedPath = fileList.contains(document.activeElement) ? document.activeElement.dataset.readerFile : null;
      fileList.innerHTML = shown.length
        ? shown.map(file => {
          const type = fileType(file);
          return `<a class="nav-link file-link" href="${esc(routeFor(grade.name, subject.name, file.path))}" data-reader-file="${esc(file.path)}" data-ripple title="${esc(file.path)}"><span class="file-type file-type-${type}">${type.toUpperCase()}</span><span class="file-name">${esc(file.name)}</span></a>`;
        }).join('')
        : '<span class="file-empty">暂无文件</span>';
      fileList.scrollTop = activeContext?.courseKey === `${grade.name}/${subject.name}` ? scroll : 0;
      listKey = signature;
      if (focusedPath) [...fileList.children].find(node => node.dataset.readerFile === focusedPath)?.focus({ preventScroll: true });
    }
    [...fileList.querySelectorAll('[data-reader-file]')].forEach(link => {
      const active = link.dataset.readerFile === selected?.path;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    return { selected, rebuilt };
  }

  function reset() {
    request?.abort();
    loadedKey = '';
    listKey = '';
    outlineHeadings = [];
    activeContext = null;
    closePopovers();
  }

  function updateOutline() {
    const main = document.querySelector('.main-stage');
    if (!outlineHeadings.length || !main) return;
    const edge = main.getBoundingClientRect().top + 80;
    let active = outlineHeadings[0];
    for (const heading of outlineHeadings) if (heading.getBoundingClientRect().top <= edge) active = heading;
    document.querySelectorAll('[data-reader-heading]').forEach(button => button.setAttribute('aria-current', button.dataset.readerHeading === active.id ? 'location' : 'false'));
  }

  function findUnescaped(source, needle, start) {
    let index = source.indexOf(needle, start);
    while (index >= 0) {
      let slashes = 0;
      for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) slashes += 1;
      if (slashes % 2 === 0) return index;
      index = source.indexOf(needle, index + needle.length);
    }
    return -1;
  }

  function protectMath(source) {
    const placeholders = [];
    const add = (tex, display) => {
      const token = `MYBLOG_MATH_${placeholders.length}_TOKEN`;
      placeholders.push({ token, tex: tex.trim(), display });
      return token;
    };
    let result = '';
    let index = 0;
    let fence = null;
    while (index < source.length) {
      const lineStart = index === 0 || source[index - 1] === '\n';
      if (lineStart) {
        const lineEnd = source.indexOf('\n', index) < 0 ? source.length : source.indexOf('\n', index);
        const line = source.slice(index, lineEnd);
        const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
        if (marker) {
          const character = marker[1][0];
          if (!fence) fence = { character, length: marker[1].length };
          else if (fence.character === character && marker[1].length >= fence.length) fence = null;
          result += line;
          if (lineEnd < source.length) result += '\n';
          index = lineEnd < source.length ? lineEnd + 1 : lineEnd;
          continue;
        }
      }
      if (fence) { result += source[index++]; continue; }
      if (source[index] === '`') {
        let length = 1;
        while (source[index + length] === '`') length += 1;
        const closing = source.indexOf('`'.repeat(length), index + length);
        if (closing >= 0) {
          const end = closing + length;
          result += source.slice(index, end);
          index = end;
          continue;
        }
      }
      if (source.startsWith('$$', index)) {
        const close = findUnescaped(source, '$$', index + 2);
        if (close >= 0) {
          result += `\n\n${add(source.slice(index + 2, close), true)}\n\n`;
          index = close + 2;
          continue;
        }
      }
      if (source.startsWith('\\[', index)) {
        const close = findUnescaped(source, '\\]', index + 2);
        if (close >= 0) {
          result += `\n\n${add(source.slice(index + 2, close), true)}\n\n`;
          index = close + 2;
          continue;
        }
      }
      if (source.startsWith('\\(', index)) {
        const close = findUnescaped(source, '\\)', index + 2);
        if (close >= 0) {
          result += add(source.slice(index + 2, close), false);
          index = close + 2;
          continue;
        }
      }
      if (source[index] === '$' && source[index - 1] !== '\\' && !/\s/.test(source[index + 1] || '')) {
        const close = findUnescaped(source, '$', index + 1);
        if (close > index + 1 && !/\s/.test(source[close - 1] || '')) {
          result += add(source.slice(index + 1, close), false);
          index = close + 1;
          continue;
        }
      }
      result += source[index++];
    }
    return { source: result, placeholders };
  }

  function renderMath(tex, display) {
    if (window.katex) return window.katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' });
    return `<span class="math-fallback">${esc(tex)}</span>`;
  }

  function renderMarkdown(source) {
    const protectedSource = protectMath(source);
    let html = md.render(protectedSource.source);
    protectedSource.placeholders.forEach(({ token, tex, display }) => {
      const rendered = renderMath(tex, display);
      if (display) html = html.replace(new RegExp(`<p>\\s*${token}\\s*</p>`, 'g'), `<div class="math-block">${rendered}</div>`);
      html = html.replaceAll(token, rendered);
    });
    return html;
  }

  function animateArticle(article) {
    article.classList.remove('reader-content-enter');
    void article.offsetWidth;
    article.classList.add('reader-content-enter');
  }

  async function show(grade, subject, requestedPath) {
    if (!grade || !subject || !fileList) return;
    activeContext = { grade, subject, requestedPath, courseKey: `${grade.name}/${subject.name}` };
    renderToolState();
    const { selected } = renderFileList(grade, subject, requestedPath);
    const article = document.getElementById('markdown-content');
    const outline = document.querySelector('.reader-outline');
    const view = article.closest('.course-view');
    view.dataset.grade = grade.name;
    view.dataset.subject = subject.name;
    const key = JSON.stringify([grade.name, subject.name, selected?.path, selected?.version, requestedPath && !selected, fileType(selected)]);
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
    if (!sameFile) main.scrollTop = 0;
    if (!selected) {
      if (requestedPath) article.innerHTML = '<p role="status">文件不存在或已移除。</p>';
      return;
    }
    if (!requestedPath) history.replaceState(null, '', routeFor(grade.name, subject.name, selected.path));
    const url = new URL(['docs_learning', grade.name, subject.name, ...selected.path.split('/')].map(encodeURIComponent).join('/'), document.baseURI);
    article.setAttribute('aria-busy', 'true');
    try {
      if (fileType(selected) === 'pdf') {
        article.innerHTML = `<iframe class="pdf-viewer" src="${esc(url.href)}#view=FitH" title="${esc(selected.name)}"></iframe><p class="pdf-fallback"><a href="${esc(url.href)}" target="_blank" rel="noopener">在新标签页打开 PDF</a></p>`;
        animateArticle(article);
        if (sameFile) main.scrollTop = previousScroll;
        return;
      }
      const response = await fetch(url, { cache: 'no-store', signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const source = await response.text();
      if (signal.aborted) return;
      article.innerHTML = renderMarkdown(source);
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
      outline.innerHTML = '<div class="chapter-index-heading"><strong>章节导航</strong></div><div class="reader-outline-list">' + outlineHeadings.map(heading => `<button type="button" data-reader-heading="${heading.id}" data-level="${heading.tagName.slice(1)}" data-ripple aria-label="${esc(heading.textContent)}">${heading.innerHTML}</button>`).join('') + '</div>';
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
        if (node.tagName === 'A' && resolved.origin === url.origin && /\.(md|pdf)$/i.test(resolved.pathname)) {
          const linked = subject.files.find(file => {
            const linkedUrl = new URL(file.path.split('/').map(encodeURIComponent).join('/'), new URL(['docs_learning', grade.name, subject.name, ''].map(encodeURIComponent).join('/'), document.baseURI));
            return linkedUrl.pathname === resolved.pathname;
          });
          if (linked) { node.href = routeFor(grade.name, subject.name, linked.path); return; }
        }
        node.setAttribute(attribute, new URL(value, base).href);
      });
      animateArticle(article);
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

  renderToolState();
  toolZones.forEach(zone => {
    const kind = zone.dataset.readerTool;
    zone.addEventListener('pointerenter', () => openPopover(kind));
    zone.addEventListener('pointerleave', scheduleClose);
    zone.addEventListener('focusin', () => openPopover(kind));
    zone.addEventListener('focusout', event => {
      if (!zone.contains(event.relatedTarget)) scheduleClose();
    });
  });
  fileTools?.addEventListener('click', event => {
    const button = event.target.closest('.file-tool');
    if (button) {
      const kind = button.hasAttribute('data-reader-filter') ? 'filter' : 'sort';
      const popover = fileTools.querySelector(`[data-reader-popover="${kind}"]`);
      if (popover.dataset.state === 'open') scheduleClose();
      else openPopover(kind);
      return;
    }
    const filterOption = event.target.closest('[data-reader-filter-option]');
    const sortOption = event.target.closest('[data-reader-sort-option]');
    if (filterOption) viewState.filter = filterOption.dataset.readerFilterOption;
    if (sortOption) viewState.sort = sortOption.dataset.readerSortOption;
    if (filterOption || sortOption) {
      renderToolState();
      openPopover(filterOption ? 'filter' : 'sort');
      if (activeContext) renderFileList(activeContext.grade, activeContext.subject, activeContext.requestedPath);
    }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePopovers(); });
  document.addEventListener('pointerdown', event => {
    if (activeMenu && !fileTools?.contains(event.target)) closePopovers();
  });
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
