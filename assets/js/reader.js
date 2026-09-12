/* Reuses MD_Demo's markdown-it renderer with raw HTML disabled. */
window.MyBlogReader = (() => {
  const md = window.markdownit({ html: false, linkify: false, typographer: false });
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
