window.MyBlogFriendLinks = (() => {
  const manifest = new URL('friend_url/fr_url.json', document.baseURI);
  const icons = new URL('./icons/', manifest);
  let cached = null;
  let pending = null;
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
    grid.closest('.home-links').hidden = !grid.childElementCount;
    window.MyBlogMotion?.updateHome?.();
  }
  async function mount(root) {
    const grid = root.querySelector('.home-links-grid');
    if (!grid) return;
    if (cached) render(grid, cached);
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
