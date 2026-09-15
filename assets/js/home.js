window.MyBlogHome = (() => {
  const cache = new Map();
  const pending = new Map();
  let mounted = null;
  const text = value => typeof value === 'string' ? value : '';
  function element(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  async function load(name) {
    if (!pending.has(name)) {
      pending.set(name, fetch(new URL(`home/${name}.json`, document.baseURI), { cache: 'no-cache' })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }).then(value => {
          if (name === 'personal' ? (!value || typeof value !== 'object' || Array.isArray(value)) : !Array.isArray(value)) {
            throw new Error(`Invalid ${name}.json structure`);
          }
          cache.set(name, value);
          return value;
        }).finally(() => pending.delete(name)));
    }
    return pending.get(name);
  }
  function personal(root, data) {
    root.querySelectorAll('[data-personal]').forEach(node => {
      node.textContent = text(data[node.dataset.personal]);
      node.closest('.info-item').hidden = !node.textContent.trim();
    });
    const introduction = root.querySelector('.personal-introduction');
    introduction.textContent = text(data.description);
    introduction.hidden = !introduction.textContent.trim();
  }
  function projects(root, entries) {
    const grid = root.querySelector('.home-project-list');
    grid.replaceChildren();
    for (const entry of entries) {
      if (!entry || !text(entry.name).trim()) continue;
      let href = '';
      if (text(entry.url).trim()) {
        try {
          const url = new URL(entry.url, document.baseURI);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL');
          href = url.href;
        } catch (error) { console.warn('Invalid project URL:', entry.name, error); }
      }
      const card = element(href ? 'a' : 'article', 'home-project-card glass-surface');
      if (href) {
        Object.assign(card, { href, target: '_blank', rel: 'noopener noreferrer' });
        card.dataset.ripple = '';
      }
      const header = element('div', 'home-project-header');
      header.append(element('h3', '', entry.name));
      const status = text(entry.status).trim();
      if (status) header.append(element('span', 'home-project-status', [...status].length === 3 ? status : '开发中'));
      card.append(header);
      if (text(entry.description).trim()) card.append(element('p', 'home-project-description', entry.description));
      grid.append(card);
    }
    grid.style.setProperty('--project-count', Math.max(1, Math.min(5, grid.childElementCount)));
  }
  function resolveArticle(source) {
    if (typeof source !== 'string') return null;
    const path = source.replace(/^\.\//, '');
    if (path.split('/').some(part => !part || part === '..' || part === '.') || path.includes('\\')) return null;
    for (const [page, config] of Object.entries(readingSections)) {
      const catalog = page === 'study' ? studyCatalog : sectionCatalogs[page];
      for (const grade of catalog) for (const subject of grade.subjects) for (const file of subject.files) {
        const parts = [config.root, ...(page === 'study' ? [grade.folder, ...(subject.root ? [] : [subject.folder])] : []), file.path];
        if (parts.join('/') !== path) continue;
        const routeParts = page === 'study' ? [grade.name, subject.name, file.path] : file.path.split('/');
        return { title: file.name, route: `#${page}/${routeParts.map(encodeURIComponent).join('/')}`, source: [config.title, ...path.split('/').slice(1, -1)].join(' / ') };
      }
    }
    return null;
  }
  function featured(root, entries) {
    const grid = root.querySelector('.article-grid');
    grid.replaceChildren();
    for (const entry of entries) {
      if (!entry) continue;
      const article = resolveArticle(entry.source);
      if (!article) continue;
      const card = element('a', 'article-card glass-surface');
      card.href = article.route;
      card.dataset.ripple = '';
      card.append(element('h3', '', text(entry.title).trim() || article.title));
      if (text(entry.description).trim()) card.append(element('p', 'article-description', entry.description));
      card.append(element('p', 'article-source', article.source));
      grid.append(card);
    }
  }
  function refreshFeatured() {
    if (!mounted?.isConnected || !cache.has('featured')) return;
    featured(mounted, cache.get('featured'));
    window.MyBlogMotion?.updateHome?.();
  }
  async function mount(root) {
    const view = root.querySelector('.home-view');
    mounted = view;
    window.MyBlogFriendLinks.mount(view);
    await Promise.all(Object.entries({ personal, projects, featured }).map(async ([name, render]) => {
      if (cache.has(name)) render(view, cache.get(name));
      try {
        const data = await load(name);
        if (mounted === view && view.isConnected) {
          render(view, data);
          window.MyBlogMotion?.updateHome?.();
        }
      } catch (error) { console.warn(`Unable to load home/${name}.json:`, error); }
    }));
  }
  return { mount, refreshFeatured, resolveArticle };
})();
