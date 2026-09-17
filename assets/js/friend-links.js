window.MyBlogFriendLinks = (() => {
  const manifest = new URL('home/friend_url/fr_url.json', document.baseURI);
  const icons = new URL('./icons/', manifest);
  let cached = null;
  let pending = null;
  const template = JSON.stringify({
    name: '必须，站点名称',
    description: '站点简介，若无则留空',
    icon: '一张图片，可以是url',
    url: '必须且完整，可以直接跳转。https://example.com/'
  }, null, 2);
  function openGuide(trigger) {
    if (document.querySelector('.friend-guide-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'friend-guide-dialog glass-surface';
    dialog.setAttribute('aria-labelledby', 'friend-guide-title');
    dialog.innerHTML = '<header class="friend-guide-header"><h2 id="friend-guide-title">添加友链方法</h2><button type="button" class="friend-guide-close" aria-label="关闭添加友链方法"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><p>请使用以下格式联系我：</p><div class="friend-guide-code prose"></div>';
    window.MyBlogReader.mountMarkdown(dialog.querySelector('.friend-guide-code'), '```json\n' + template + '\n```');
    dialog.querySelector('.friend-guide-close').addEventListener('click', () => dialog.close());
    let backdropDown = false;
    const outside = event => {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    dialog.addEventListener('pointerdown', event => { backdropDown = outside(event); });
    dialog.addEventListener('click', event => { if (backdropDown && outside(event)) dialog.close(); backdropDown = false; });
    const closeOnRoute = () => dialog.close();
    window.addEventListener('popstate', closeOnRoute);
    window.addEventListener('hashchange', closeOnRoute);
    dialog.addEventListener('close', () => {
      window.removeEventListener('popstate', closeOnRoute);
      window.removeEventListener('hashchange', closeOnRoute);
      dialog.remove();
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    }, { once: true });
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('.friend-guide-close').focus();
  }
  function localIcon(value) {
    if (typeof value !== 'string' || !value) return '';
    try {
      const url = new URL(value, manifest);
      return url.origin === icons.origin && url.pathname.startsWith(icons.pathname) ? url.href : '';
    } catch { return ''; }
  }
  function render(grid, entries) {
    grid.replaceChildren();
    for (const entry of entries) {
      if (!entry || typeof entry.name !== 'string' || !entry.name.trim()) continue;
      let url;
      try { url = new URL(entry.url); } catch { continue; }
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const card = document.createElement('a');
      card.className = 'friend-link-card glass-surface';
      card.href = url.href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.dataset.ripple = '';
      const icon = document.createElement('span');
      icon.className = 'friend-link-icon is-fallback';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg class="friend-link-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></svg>';
      const src = localIcon(entry.icon);
      if (src) {
        const image = document.createElement('img');
        image.alt = '';
        image.hidden = true;
        image.onload = () => { image.hidden = false; icon.classList.remove('is-fallback'); };
        image.onerror = () => { image.hidden = true; icon.classList.add('is-fallback'); };
        icon.append(image);
        image.src = src;
      }
      const copy = document.createElement('span');
      copy.className = 'friend-link-copy';
      const name = document.createElement('strong');
      name.textContent = entry.name;
      copy.append(name);
      if (typeof entry.description === 'string' && entry.description.trim()) {
        const description = document.createElement('span');
        description.textContent = entry.description;
        copy.append(description);
      }
      card.append(icon, copy);
      grid.append(card);
    }
    const guide = document.createElement('button');
    guide.type = 'button';
    guide.className = 'friend-link-card friend-guide-trigger glass-surface';
    guide.textContent = '如何添加友链？';
    guide.setAttribute('aria-haspopup', 'dialog');
    guide.dataset.ripple = '';
    guide.addEventListener('click', () => openGuide(guide));
    grid.append(guide);
    grid.closest('.home-links').hidden = false;
    window.MyBlogMotion?.updateHome?.();
  }
  async function mount(root) {
    const grid = root.querySelector('.home-links-grid');
    if (!grid) return;
    render(grid, cached || []);
    try {
      if (!pending) pending = fetch(manifest, { cache: 'no-cache' }).then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }).then(entries => {
        if (!Array.isArray(entries)) throw new Error('Friend links must be an array');
        return cached = entries;
      }).finally(() => { pending = null; });
      const entries = await pending;
      if (grid.isConnected) render(grid, entries);
    } catch (error) { console.warn('Unable to load friend links:', error); }
  }
  return { mount, localIcon };
})();
