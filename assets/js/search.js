window.MyBlogSearch = (() => {
  const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const searchIcon = svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>');
  const up = svg('<path d="m6 14 6-6 6 6"/>');
  const down = svg('<path d="m6 10 6 6 6-6"/>');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bold = (value, q) => q ? value.split(q).map(esc).join(`<strong>${esc(q)}</strong>`) : esc(value);
  const main = document.querySelector('.main-stage');
  let indexPromise, generation = 0, savedScroll = 0, savedQuery = '';
  let control, marks = [], selected = -1, article, articleKey = '', open = false, frame = 0;
  const states = new Map();
  const spring = MyBlogRouteMotion.createSpring();
  spring.response = 24;
  const narrow = matchMedia('(max-width: 1200px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function loadIndex() {
    if (!indexPromise) indexPromise = fetch('assets/data/search-index.json', { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error('index');
      return r.json();
    }).then(data => data.documents).catch(error => { indexPromise = null; throw error; });
    return indexPromise;
  }
  function leave() {
    if (document.querySelector('.search-page')) savedScroll = main.scrollTop;
    document.body.classList.remove('search-page-active');
    generation++;
    if (control) {
      setOpen(false, true);
      control.hidden = true;
      control.querySelector('input').value = '';
      control.querySelector('output').textContent = '';
    }
    clearMarks();
    article = null;
    articleKey = '';
  }
  function mount(root) {
    document.body.classList.add('search-page-active');
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const query = params.get('q') || '';
    root.innerHTML = `<section class="search-page${query ? ' has-query' : ''}"><header class="search-header"><h1>${query ? '文章检索' : '检索'}</h1><form class="global-search" role="search"><input aria-label="检索" placeholder=" " value="${esc(query)}" class="glass-surface" type="search"><button class="glass-surface" aria-label="搜索">${searchIcon}</button></form></header><div class="search-results" aria-live="polite"></div></section>`;
    const page = root.firstElementChild, form = page.querySelector('form'), results = page.querySelector('.search-results');
    form.querySelector('button').setAttribute('data-ripple', '');
    const run = async q => {
      const ticket = ++generation;
      if (!q) { page.classList.remove('has-query'); page.querySelector('h1').textContent = '检索'; results.replaceChildren(); return; }
      page.classList.add('has-query'); page.querySelector('h1').textContent = '文章检索';
      results.textContent = '…';
      try {
        const documents = await loadIndex();
        if (ticket !== generation || !page.isConnected) return;
        const matches = documents.filter(d => d.name.includes(q) || d.source.includes(q) || d.body.includes(q));
        matches.sort((a, b) => Number(b.name.includes(q)) - Number(a.name.includes(q)));
        results.innerHTML = matches.map(d => {
          const at = d.body.indexOf(q);
          const snippet = at < 0 ? '' : (at > 45 ? '…' : '') + d.body.slice(Math.max(0, at - 45), at + q.length + 65) + (at + q.length + 65 < d.body.length ? '…' : '');
          return `<a class="search-card glass-surface" href="${esc(d.route + (at >= 0 ? '?find=' + encodeURIComponent(q) : ''))}"><div class="search-filename"><span class="search-type">${d.type.toUpperCase()}</span><span>${bold(d.name, q)}</span></div>${snippet ? `<p class="search-snippet">${bold(snippet, q)}</p>` : ''}<p class="search-source">${bold(d.source, q)}</p></a>`;
        }).join('') || '<p class="search-empty">未找到</p>';
        if (savedQuery === q) main.scrollTop = savedScroll;
        savedQuery = q;
      } catch {
        if (ticket !== generation) return;
        results.innerHTML = '<button type="button" class="search-retry">重试</button>';
        results.firstElementChild.onclick = () => run(q);
      }
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      const q = form.querySelector('input').value.trim();
      history.replaceState(null, '', '#articles' + (q ? '?q=' + encodeURIComponent(q) : ''));
      savedScroll = 0; main.scrollTop = 0;
      run(q);
    });
    run(query);
  }
  function makeControl() {
    control = document.createElement('div');
    control.className = 'article-search glass-surface';
    control.innerHTML = `<button type="button" class="article-search-trigger" aria-label="检索本文章" aria-expanded="false">${searchIcon}</button><div class="article-search-content"><input type="search" placeholder="在此输入检索" aria-label="在此输入检索"><output aria-live="polite"></output><button type="button" data-step="-1" aria-label="上一个匹配">${up}</button><button type="button" data-step="1" aria-label="下一个匹配">${down}</button></div>`;
    document.body.append(control);
    control.querySelectorAll('button').forEach(button => button.setAttribute('data-ripple', ''));
    control.querySelector('.article-search-trigger').onclick = () => { setOpen(true); control.querySelector('input').focus({ preventScroll: true }); };
    control.querySelector('input').addEventListener('input', e => { if (!e.isComposing) find(e.target.value); });
    control.querySelector('input').addEventListener('compositionend', e => find(e.target.value));
    control.querySelectorAll('[data-step]').forEach(button => {
      button.addEventListener('pointerdown', e => e.preventDefault());
      button.onclick = () => jump(selected + Number(button.dataset.step));
    });
    control.querySelector('input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); jump(selected + (e.shiftKey ? -1 : 1)); }
    });
  }
  function paint() {
    const width = 48 + (Math.min(360, innerWidth - 84) - 48) * spring.position;
    control.style.setProperty('--find-width', `${width}px`);
    control.style.setProperty('--find-opacity', String(Math.max(0, (spring.position - .5) * 2)));
  }
  function setOpen(value, immediate = false) {
    if (!control) return;
    open = value;
    control.classList.toggle('is-open', value);
    control.querySelector('.article-search-trigger').setAttribute('aria-expanded', String(value));
    control.querySelector('.article-search-content').inert = narrow.matches && !value;
    spring.target = value ? 1 : 0;
    if (immediate || reduced.matches) { cancelAnimationFrame(frame); frame = 0; spring.position = spring.target; spring.velocity = 0; paint(); return; }
    if (frame) return;
    let before = performance.now();
    const tick = now => {
      spring.step(Math.min((now - before) / 1000, .05)); before = now; paint();
      if (spring.settled) { frame = 0; return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  function positionControl() {
    if (!control) return;
    const parent = narrow.matches ? document.body : document.querySelector('.course-view .reader-outline');
    // Keyboard/viewport resizes must not detach a focused input.
    if (parent && control.parentElement !== parent) parent.append(control);
    control.querySelector('.article-search-content').inert = narrow.matches && !open;
    paint();
  }
  function clearMarks() {
    if (!article) return;
    article.querySelectorAll('mark[data-find]').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
    article.normalize(); marks = []; selected = -1;
  }
  function find(q, initial = 0) {
    clearMarks();
    if (q && article) {
      // Search across inline formatting, but never across block boundaries.
      const blocks = [...article.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,td,th,pre')].filter(el => !el.querySelector('p,li,pre'));
      if (!blocks.length) blocks.push(article);
      for (const block of blocks) {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, { acceptNode: node => node.parentElement.closest('button,script,style,.katex') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        const nodes = []; let node, text = '';
        while ((node = walker.nextNode())) { nodes.push({ node, start: text.length }); text += node.data; }
        const hits = []; let at = 0;
        while ((at = text.indexOf(q, at)) !== -1) { hits.push({ start: at, end: at + q.length, pieces: [] }); at += q.length; }
        for (const { node, start } of nodes.reverse()) {
          for (const hit of [...hits].reverse()) {
            const from = Math.max(0, hit.start - start), to = Math.min(node.length, hit.end - start);
            if (to <= from) continue;
            const range = document.createRange(); range.setStart(node, from); range.setEnd(node, to);
            const mark = document.createElement('mark'); mark.dataset.find = ''; range.surroundContents(mark); hit.pieces.unshift(mark);
          }
        }
        marks.push(...hits.map(hit => hit.pieces));
      }
    }
    selected = marks.length ? Math.min(initial, marks.length - 1) : -1;
    updateCount();
    if (marks.length) jump(selected, false);
    save();
  }
  function save() { states.set(articleKey, { q: control.querySelector('input').value, selected }); }
  function updateCount() {
    control.querySelector('output').textContent = control.querySelector('input').value ? `${selected + 1}/${marks.length}` : '';
    control.querySelectorAll('[data-step]').forEach(button => button.disabled = !marks.length);
  }
  function jump(index, animate = true) {
    if (!marks.length) return;
    selected = (index + marks.length) % marks.length;
    marks.forEach((group, i) => group.forEach(mark => mark.classList.toggle('is-current', i === selected)));
    const rect = marks[selected][0].getBoundingClientRect(), bounds = main.getBoundingClientRect();
    main.scrollTo({ top: Math.max(0, Math.min(main.scrollHeight - main.clientHeight, main.scrollTop + rect.top - bounds.top - Math.min(140, bounds.height * .25))), behavior: animate && !reduced.matches ? 'smooth' : 'instant' });
    updateCount(); save();
  }
  function articleReady(type) {
    if (type !== 'md' || !document.querySelector('#markdown-content')?.textContent) { leave(); return; }
    if (!control) makeControl();
    article = document.getElementById('markdown-content');
    articleKey = location.hash.split('?')[0];
    const state = states.get(articleKey);
    const q = new URLSearchParams(location.hash.split('?')[1] || '').get('find') ?? state?.q ?? '';
    control.hidden = false;
    const outline = document.querySelector('.course-view .reader-outline');
    if (outline) outline.hidden = false;
    positionControl();
    control.querySelector('input').value = q;
    find(q, state?.selected >= 0 ? state.selected : 0);
  }
  document.addEventListener('pointerdown', e => {
    if (open && !control?.contains(e.target)) { control.querySelector('input').blur(); setOpen(false); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { setOpen(false); control.querySelector('.article-search-trigger').focus({ preventScroll: true }); }
  });
  window.addEventListener('resize', positionControl);
  reduced.addEventListener('change', () => setOpen(open, true));
  return { mount, leave, articleReady };
})();
