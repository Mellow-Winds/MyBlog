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
  md.inline.ruler.before('image', 'local_image', (state, silent) => {
    if (!state.src.startsWith('%%', state.pos)) return false;
    const end = state.src.indexOf('%%', state.pos + 2);
    if (end < 0) return false;
    const path = state.src.slice(state.pos + 2, end).trim();
    if (!path || /[\r\n]/.test(path)) return false;
    if (!silent) {
      const token = state.push('image', 'img', 0);
      token.attrs = [['src', path], ['alt', ''], ['data-local-image', 'true'], ['loading', 'lazy']];
      const label = new state.Token('text', '', 0);
      label.content = path.split('/').at(-1);
      token.children = [label];
      token.content = label.content;
    }
    state.pos = end + 2;
    return true;
  });
  const esc = text => md.utils.escapeHtml(String(text));
  let section = 'study', contentRootPath = 'docs_learning';
  const sectionStates = new Map();
  const routeFor = (grade, subject, file) => '#' + section + '/' + (section === 'study' ? [grade, subject, file] : file.split('/')).map(encodeURIComponent).join('/');
  const fileUrl = (grade, subject, path) => new URL([contentRootPath, ...(section === 'study' ? [grade.folder || grade.name, ...(subject.root ? [] : [subject.folder || subject.name])] : []), ...path.split('/')].map(encodeURIComponent).join('/'), document.baseURI);

  let request;
  let loadedKey = '';
  let listKey = '';
  let retry;
  let outlineHeadings = [];
  let activeOutlineId = '';
  let clickedHeadingId = '';

  function headingTree(headings) {
    const roots = [], stack = [];
    headings.forEach(heading => {
      const node = { heading, level: Number(heading.tagName.slice(1)), children: [] };
      while (stack.length && stack.at(-1).level >= node.level) stack.pop();
      (stack.at(-1)?.children || roots).push(node);
      stack.push(node);
    });
    return roots;
  }

  function renderOutlineTree(nodes, depth = 0) {
    return nodes.map(({ heading, children }) => {
      const label = heading.textContent.trim() || '未命名标题';
      const button = `<button type="button" data-reader-heading="${heading.id}" aria-label="${esc(label)}">${heading.innerHTML || esc(label)}</button>`;
      if (!children.length) return `<div class="outline-leaf">${button}</div>`;
      return `<details class="study-branch outline-branch" ${depth === 0 ? 'open' : ''}><summary aria-controls="${heading.id}-children">${button}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></summary><div id="${heading.id}-children" class="study-children">${renderOutlineTree(children, depth + 1)}</div></details>`;
    }).join('');
  }

  function renderFooter() {
    const footer = document.querySelector('.reader-footer');
    if (!footer || footer.hidden || !activeContext?.subject) return;
    const { grade, subject, requestedPath } = activeContext;
    const collectFiles = nodes => nodes.flatMap(node => node.kind === 'folder' ? collectFiles(node.children) : [node]);
    const files = collectFiles(visibleTree(courseTree(subject)));
    const index = files.findIndex(file => file.path === requestedPath);
    const link = (file, label) => file
      ? `<a href="${esc(routeFor(grade.name, subject.name, file.path))}"><span>${label}</span><strong>${esc(file.name)}</strong></a>`
      : `<span class="reader-page-disabled" aria-disabled="true">${label}</span>`;
    footer.innerHTML = `<p class="reader-end">--我可是有底线的--</p><nav class="reader-pagination" aria-label="文章切换">${link(index > 0 ? files[index - 1] : null, '上一篇')}${link(index >= 0 ? files[index + 1] : null, '下一篇')}</nav>`;
  }
  let activeContext = null;
  let catalog = [];
  const expanded = new Set();
  let treeInitialized = false;
  let selectedTreeKey = '';
  const branchAnimations = new Map();
  function setBranchOpen(node, open, animate = false) {
    const children = node.querySelector('.study-children');
    const summary = node.querySelector('summary');
    const running = branchAnimations.get(node);
    if (running) cancelAnimationFrame(running.frame);
    const height = node.open ? children.getBoundingClientRect().height : 0;
    summary.setAttribute('aria-expanded', String(open));
    node.dataset.expanded = String(open);
    children.inert = !open;
    const finish = () => {
      node.open = open;
      children.style.removeProperty('height');
      children.style.removeProperty('overflow');
      children.style.removeProperty('opacity');
      branchAnimations.delete(node);
    };
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    node.open = true;
    const spring = running?.spring || window.MyBlogRouteMotion.createSpring();
    spring.position = height;
    spring.response = 18;
    children.style.height = `${height}px`;
    children.style.overflow = 'hidden';
    let previous = performance.now();
    const state = { spring, frame: 0 };
    const tick = now => {
      if (!node.isConnected) { finish(); return; }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      const naturalHeight = children.scrollHeight;
      spring.target = open ? naturalHeight : 0;
      spring.step(Math.min((now - previous) / 1000, .05));
      previous = now;
      children.style.height = `${Math.max(0, spring.position)}px`;
      children.style.opacity = String(Math.min(1, Math.max(0, spring.position / Math.max(1, naturalHeight))));
      if (Math.abs(spring.position - spring.target) < .5 && Math.abs(spring.velocity) < 2) finish();
      else state.frame = requestAnimationFrame(tick);
    };
    branchAnimations.set(node, state);
    state.frame = requestAnimationFrame(tick);
  }
  const branchKey = (...parts) => JSON.stringify(parts);
  function setCatalog(value) { catalog = value; }
  function setSection(page, root) {
    if (page === section) return;
    request?.abort();
    sectionStates.set(section, { loadedKey, outlineHeadings, activeContext, selectedTreeKey, activeOutlineId, clickedHeadingId,
      expanded: [...expanded], treeInitialized, viewState: { ...viewState } });
    const state = sectionStates.get(page);
    section = page; contentRootPath = root;
    loadedKey = state?.loadedKey || '';
    outlineHeadings = state?.outlineHeadings || [];
    activeContext = state?.activeContext || null;
    selectedTreeKey = state?.selectedTreeKey || '';
    activeOutlineId = state?.activeOutlineId || '';
    clickedHeadingId = state?.clickedHeadingId || '';
    expanded.clear(); (state?.expanded || []).forEach(key => expanded.add(key));
    treeInitialized = state?.treeInitialized || false;
    Object.assign(viewState, state?.viewState || { filter: 'all', sort: 'name' });
    listKey = '';
  }
  const viewState = { filter: 'all', sort: 'name' };
  const fileTools = document.querySelector('.file-tools');
  const fileList = document.querySelector('.course-files');
  const copyToast = document.querySelector('[data-reader-copy-toast]');
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

  function visibleTree(nodes) {
    const result = [];
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (node.kind === 'folder') {
        const children = visibleTree(node.children);
        if (children.length || viewState.filter === 'all') result.push({ ...node, children });
        continue;
      }
      if (viewState.filter === 'all' || fileType(node) === viewState.filter) result.push(node);
    }
    return result.sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'folder' ? -1 : 1;
      const weightDifference = (left.weight ?? Number.POSITIVE_INFINITY) - (right.weight ?? Number.POSITIVE_INFINITY);
      if (weightDifference) return weightDifference;
      if (viewState.sort === 'type' && left.kind === 'file') {
        const typeDifference = fileType(left).localeCompare(fileType(right));
        if (typeDifference) return typeDifference;
      }
      return String(left.name).localeCompare(String(right.name), 'zh-CN', { numeric: true, sensitivity: 'base' });
    });
  }

  function courseTree(course) {
    if (Array.isArray(course?.children) && (course.children.length || !Array.isArray(course.files) || !course.files.length)) return course.children;
    return (course?.files || []).map(file => ({ ...file, kind: 'file' }));
  }

  function renderFileList(grade, subject, requestedPath) {
    if (!fileList) return null;
    const selected = requestedPath ? subject?.files.find(file => file.path === requestedPath) : null;
    if (!treeInitialized && catalog.length) { expanded.add(branchKey(catalog[0].name)); treeInitialized = true; }
    const nextTreeKey = selected ? branchKey(grade.name, subject.name, selected.path) : '';
    const selectionChanged = nextTreeKey !== selectedTreeKey;
    selectedTreeKey = nextTreeKey;
    if (selectionChanged && requestedPath && grade && subject) {
      expanded.add(branchKey(grade.name));
      expanded.add(branchKey(grade.name, subject.name));
      const parts = String(requestedPath).split('/');
      let parentPath = '';
      parts.slice(0, -1).forEach(part => {
        parentPath = parentPath ? `${parentPath}/${part}` : part;
        expanded.add(branchKey(grade.name, subject.name, parentPath));
      });
    }
    const signature = JSON.stringify([catalog, viewState]);
    if (listKey !== signature) {
      branchAnimations.forEach(state => cancelAnimationFrame(state.frame));
      branchAnimations.clear();
      const scroll = fileList.scrollTop;
      const disclosure = (key, title, children, kind) => `<details class="study-branch ${kind}" data-branch="${esc(key)}" ${expanded.has(key) ? 'open' : ''}><summary><span>${esc(title)}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></summary><div class="study-children">${children}</div></details>`;
      const renderNode = (term, course, node) => {
        if (node.kind === 'folder') {
          const children = visibleTree(node.children);
          return disclosure(branchKey(term.name, course.name, node.path), node.name, children.map(child => renderNode(term, course, child)).join('') || '<span class="file-empty">暂无文件</span>', 'study-folder');
        }
        return `<a class="nav-link file-link" href="${esc(routeFor(term.name, course.name, node.path))}" data-reader-file="${esc(node.path)}" data-file-key="${esc(branchKey(term.name, course.name, node.path))}" title="${esc(node.name)}" data-ripple><span class="file-type file-type-${fileType(node)}">${fileType(node).toUpperCase()}</span><span class="file-name">${esc(node.name)}</span></a>`;
      };
      const courseFiles = (term, course) => visibleTree(courseTree(course)).map(node => renderNode(term, course, node)).join('') || '<span class="file-empty">暂无文件</span>';
      fileList.innerHTML = section === 'study'
        ? catalog.map(term => term.subjects.some(course => course.root)
          // A term folder holding files directly has no course layer to show. Keep the
          // semester shell so it matches the other terms, and inline the files inside it.
          ? disclosure(branchKey(term.name), term.name, term.subjects.map(course => courseFiles(term, course)).join(''), 'study-semester')
          : disclosure(branchKey(term.name), term.name, term.subjects.map(course => disclosure(branchKey(term.name, course.name), course.name, courseFiles(term, course), 'study-course')).join(''), 'study-semester')).join('')
        : catalog.flatMap(term => term.subjects.flatMap(course => visibleTree(courseTree(course)).map(node => renderNode(term, course, node)))).join('') || '<span class="file-empty">暂无文件</span>';
      fileList.querySelectorAll('details').forEach(node => {
        setBranchOpen(node, expanded.has(node.dataset.branch));
        node.querySelector('summary').addEventListener('click', event => {
          event.preventDefault();
          const open = !expanded.has(node.dataset.branch);
          if (open) expanded.add(node.dataset.branch); else expanded.delete(node.dataset.branch);
          setBranchOpen(node, open, true);
        });
      });
      fileList.scrollTop = scroll;
      listKey = signature;
    }
    fileList.querySelectorAll('details').forEach(node => {
      if (node.dataset.expanded !== String(expanded.has(node.dataset.branch))) setBranchOpen(node, expanded.has(node.dataset.branch));
    });
    fileList.querySelectorAll('[data-file-key]').forEach(link => {
      const active = !!selected && link.dataset.fileKey === branchKey(grade.name, subject.name, selected.path);
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      if (active && selectionChanged) link.scrollIntoView({ block: 'nearest' });
    });
    return { selected };
  }

  function reset() {
    request?.abort();
    clickedHeadingId = '';
    activeOutlineId = '';
    loadedKey = '';
    listKey = '';
    outlineHeadings = [];
    activeContext = null;
    selectedTreeKey = '';
    closePopovers();
  }

  function suspend() {
    // Preserve the mounted reader and its selection while leaving the section.
    if (document.getElementById('markdown-content')?.hasAttribute('aria-busy')) {
      request?.abort();
      loadedKey = '';
    }
    closePopovers();
  }

  function updateOutline() {
    if (clickedHeadingId) return;
    const main = document.querySelector('.main-stage');
    if (!outlineHeadings.length || !main) return;
    const edge = main.getBoundingClientRect().top + 80;
    let active = outlineHeadings[0];
    for (const heading of outlineHeadings) if (heading.getBoundingClientRect().top <= edge) active = heading;
    setOutlineActive(active.id);
  }

  function setOutlineActive(id, reveal = false) {
    if (activeOutlineId === id && !reveal) return;
    activeOutlineId = id;
    document.querySelectorAll('[data-reader-heading]').forEach(button => {
      button.setAttribute('aria-current', button.dataset.readerHeading === id ? 'location' : 'false');
      if (button.dataset.readerHeading !== id || !reveal) return;
      let ancestor = button.parentElement?.closest('.outline-branch');
      while (ancestor) {
        if (ancestor.querySelector('summary')?.contains(button) !== true) setBranchOpen(ancestor, true);
        ancestor = ancestor.parentElement?.closest('.outline-branch');
      }
      const list = button.closest?.('.reader-outline-list');
      if (list) {
        const row = button.getBoundingClientRect(), bounds = list.getBoundingClientRect();
        if (row.top < bounds.top) list.scrollTop += row.top - bounds.top;
        else if (row.bottom > bounds.bottom) list.scrollTop += row.bottom - bounds.bottom;
      }
    });
  }

  function scrollToHeading(heading) {
    const main = document.querySelector('.main-stage');
    if (!main || !heading) return;

    const mainRect = main.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    const target = Math.max(0, Math.min(
      main.scrollHeight - main.clientHeight,
      main.scrollTop + headingRect.top - mainRect.top - 24
    ));
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    clickedHeadingId = heading.id;
    setOutlineActive(heading.id, true);
    if (typeof main.scrollTo === 'function') main.scrollTo({ top: target, behavior });
    else main.scrollTop = target;
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

  function localImageUrl(path, articleUrl, rootUrl) {
    // Custom images are local to their content collection; normalize before checking.
    const decoded = decodeURIComponent(path).replace(/\\/g, '/');
    if (/%(?:2e|2f|5c)/i.test(decoded)) throw new Error('Ambiguous encoded image path');
    if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(decoded)) throw new Error('Not a relative image');
    const target = new URL(decoded, articleUrl);
    const root = new URL(rootUrl);
    if (target.origin !== root.origin || !target.pathname.startsWith(root.pathname)) throw new Error('Image outside content root');
    return target.href;
  }

  function imageFailure(node) {
    const message = document.createElement('span');
    message.className = 'reader-image-error';
    message.setAttribute('role', 'status');
    message.textContent = `图片无法加载：${node.getAttribute('alt') || '图片'}`;
    node.replaceWith(message);
  }

  const copyResetTimers = new WeakMap();
  let copyToastTimer = 0;
  let copyToastHideTimer = 0;
  let copyToastFrame = 0;

  function showCopyToast() {
    if (!copyToast) return;
    window.clearTimeout(copyToastTimer);
    window.clearTimeout(copyToastHideTimer);
    if (copyToastFrame && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(copyToastFrame);
    copyToast.hidden = false;
    copyToast.dataset.state = 'closed';
    copyToast.setAttribute('aria-hidden', 'false');
    const open = () => { copyToast.dataset.state = 'open'; copyToastFrame = 0; };
    if (typeof window.requestAnimationFrame === 'function') copyToastFrame = window.requestAnimationFrame(open);
    else open();
    copyToastTimer = window.setTimeout(() => {
      copyToast.dataset.state = 'closed';
      copyToast.setAttribute('aria-hidden', 'true');
      copyToastHideTimer = window.setTimeout(() => { copyToast.hidden = true; }, 220);
    }, 1600);
  }

  function setCopyState(button, state, label) {
    button.dataset.state = state;
    button.setAttribute('aria-label', label);
    button.title = label;
    const status = button.querySelector('.code-copy-status');
    if (status) status.textContent = state === 'copied' ? '已复制' : state === 'error' ? '复制失败' : '';
    window.clearTimeout(copyResetTimers.get(button));
    if (state !== 'idle') {
      copyResetTimers.set(button, window.setTimeout(() => setCopyState(button, 'idle', '复制代码'), 1600));
    }
  }

  async function copyCode(button, code) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        try {
          textarea.value = code;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.append(textarea);
          textarea.select();
          if (!document.execCommand?.('copy')) throw new Error('copy command failed');
        } finally {
          textarea.remove();
        }
      }
      setCopyState(button, 'copied', '已复制代码');
      showCopyToast();
    } catch {
      setCopyState(button, 'error', '复制失败，请手动复制');
    }
  }

  function setupCodeCopy(article) {
    article.querySelectorAll('pre > code').forEach(code => {
      const pre = code.parentElement;
      if (pre.querySelector('[data-code-copy]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.dataset.codeCopy = '';
      button.setAttribute('aria-label', '复制代码');
      button.title = '复制代码';
      button.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"></path></svg><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg><span class="code-copy-status" aria-live="polite"></span>';
      button.addEventListener('click', () => copyCode(button, code.textContent));
      pre.append(button);
    });
  }

  function animateArticle(article) {
    article.classList.remove('reader-content-enter');
    window.MyBlogMotion?.reveal(article.children);
    window.MyBlogMotion?.reveal(document.querySelectorAll('.reader-outline-list [data-reader-heading]'));
  }

  async function show(grade, subject, requestedPath) {
    if (!fileList) return;
    const courseKey = `${grade?.name || ''}/${subject?.name || ''}`;
    if (activeContext && activeContext.courseKey !== courseKey) viewState.filter = 'all';
    activeContext = { grade, subject, requestedPath, courseKey };
    renderToolState();
    const { selected } = renderFileList(grade, subject, requestedPath);
    const article = document.getElementById('markdown-content');
    const outline = document.querySelector('.reader-outline');
    const view = article.closest('.course-view');
    view.dataset.grade = grade?.name || '';
    view.dataset.subject = subject?.name || '';
    const key = JSON.stringify([grade?.name, subject?.name, selected?.path, selected?.version, requestedPath && !selected, fileType(selected)]);
    if (loadedKey === key) return;
    const previousPath = loadedKey ? JSON.parse(loadedKey).slice(0, 3) : [];
    const sameFile = JSON.stringify(previousPath) === JSON.stringify([grade?.name, subject?.name, selected?.path]);
    loadedKey = key;
    request?.abort();
    request = new AbortController();
    const signal = request.signal;
    const main = document.querySelector('.main-stage');
    const previousScroll = main.scrollTop;
    outline.hidden = true;
    const outlineToggle = document.querySelector('[data-study-outline]');
    if (outlineToggle) outlineToggle.hidden = true;
    outline.replaceChildren();
    outlineHeadings = [];
    activeOutlineId = '';
    clickedHeadingId = '';
    const footer = document.querySelector('.reader-footer');
    if (footer) { footer.hidden = true; footer.replaceChildren(); footer.style.minHeight = ''; }
    article.replaceChildren();
    article.classList.toggle('reader-empty', !selected);
    article.removeAttribute('aria-busy');
    if (!sameFile) main.scrollTop = 0;
    if (!selected) {
      if (requestedPath) article.innerHTML = '<p role="status">文件不存在或已移除。</p>';
      else article.innerHTML = '<p role="status">在左侧打开文件</p>';
      return;
    }
    if (!requestedPath) history.replaceState(null, '', routeFor(grade.name, subject.name, selected.path));
    const url = fileUrl(grade, subject, selected.path);
    article.setAttribute('aria-busy', 'true');
    try {
      if (fileType(selected) === 'pdf') {
        article.innerHTML = `<iframe class="pdf-viewer" src="${esc(url.href)}#view=FitH" title="${esc(selected.name)}"></iframe><p class="pdf-fallback"><a href="${esc(url.href)}" target="_blank" rel="noopener">在新标签页打开 PDF</a></p>`;
        if (!sameFile) animateArticle(article);
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
      setupCodeCopy(article);
      const slugs = new Map();
      outlineHeadings = [...article.querySelectorAll('h1,h2,h3,h4,h5,h6')];
      outlineHeadings.forEach((heading, index) => {
        heading.id = `md-heading-${index}`;
        const slug = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-');
        if (!slugs.has(slug)) slugs.set(slug, heading.id);
      });
      outline.innerHTML = '<div class="chapter-index-heading"><strong>文件导航</strong></div><div class="reader-outline-list">' + renderOutlineTree(headingTree(outlineHeadings)) + '</div>';
      outline.querySelectorAll('.outline-branch').forEach(node => {
        setBranchOpen(node, node.open);
        node.querySelector('summary').addEventListener('click', event => {
          if (event.target.closest('[data-reader-heading]')) return;
          event.preventDefault();
          setBranchOpen(node, node.dataset.expanded !== 'true', true);
        });
      });
      if (footer) { footer.hidden = false; renderFooter(); }
      outline.hidden = !outlineHeadings.length;
      if (outlineToggle) outlineToggle.hidden = outline.hidden;
      article.querySelectorAll('a[href], img[src]').forEach(node => {
        const attribute = node.tagName === 'IMG' ? 'src' : 'href';
        const value = node.getAttribute(attribute);
        if (node.tagName === 'IMG' && node.hasAttribute('data-local-image')) {
          try {
            node.setAttribute('src', localImageUrl(value, url, new URL(contentRootPath + '/', document.baseURI)));
            node.addEventListener('error', () => imageFailure(node), { once: true });
            if (node.complete && node.naturalWidth === 0) imageFailure(node);
          } catch { imageFailure(node); }
          return;
        }
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
            const linkedUrl = fileUrl(grade, subject, file.path);
            return linkedUrl.pathname === resolved.pathname;
          });
          if (linked) { node.href = routeFor(grade.name, subject.name, linked.path); return; }
        }
        node.setAttribute(attribute, new URL(value, base).href);
      });
      if (!sameFile) animateArticle(article);
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
  const canHover = matchMedia('(hover: hover)').matches;
  toolZones.forEach(zone => {
    const kind = zone.dataset.readerTool;
    if (canHover) {
      zone.addEventListener('pointerenter', () => openPopover(kind));
      zone.addEventListener('pointerleave', scheduleClose);
      zone.addEventListener('focusin', () => openPopover(kind));
      zone.addEventListener('focusout', event => {
        if (!zone.contains(event.relatedTarget)) scheduleClose();
      });
      zone.querySelector('.file-popover')?.addEventListener('pointerenter', () => openPopover(kind));
    }
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
      renderFooter();
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
      const heading = document.getElementById(jump.dataset.readerHeading);
      if (!heading) return;
      scrollToHeading(heading);
    }
    if (event.target.closest('[data-reader-retry]')) retry?.();
  });
  document.querySelector('.main-stage').addEventListener('scroll', updateOutline, { passive: true });
  const resumeReading = () => { clickedHeadingId = ''; updateOutline(); };
  ['wheel', 'touchstart', 'pointerdown'].forEach(type => {
    document.querySelector('.main-stage').addEventListener(type, resumeReading, { passive: true });
  });
  document.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) resumeReading();
  });
  return { show, reset, suspend, setCatalog, setSection, scrollToHeading };
})();
