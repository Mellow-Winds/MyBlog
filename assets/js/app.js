const body = document.body;
const contentRoot = document.getElementById('content-root');
const navLinks = [...document.querySelectorAll('.nav-link[href^="#"]')];
const rippleDuration = 1000;
const liquidGlassBackground = [
  'radial-gradient(circle at 88% 10%, rgba(74, 144, 217, .48), transparent 58%)',
  'radial-gradient(circle at 10% 88%, rgba(211, 228, 253, .82), transparent 60%)',
  'linear-gradient(148deg, rgba(211, 228, 253, .92), rgba(249, 249, 255, .96) 52%, rgba(74, 144, 217, .28))'
].join(', ');

const contentState = {
  study: { term: 0, item: 0 },
  jinling: { item: 0 },
  memories: { item: 0 }
};

const studyTerms = [
  { label: '大一上', items: ['学科1', '学科2', '学科3', '学科4', '学科5'] },
  { label: '大一下', items: ['学科1', '学科2', '学科3', '学科4', '学科5'] },
  { label: '大二上', items: ['学科1', '学科2', '学科3', '学科4', '学科5'] }
];

const pageMeta = {
  about: { title: '关于我' },
  articles: { title: '文章检索' }
};

const mediaMatches = query => (
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches
);

const shouldUseSolidMaterial = () => (
  mediaMatches('(prefers-contrast: more)') ||
  mediaMatches('(forced-colors: active)')
);

function paintLiquidBackground() {
  if (shouldUseSolidMaterial()) {
    body.style.removeProperty('background-image');
    body.style.removeProperty('background-attachment');
    return;
  }

  body.style.backgroundImage = liquidGlassBackground;
  body.style.backgroundAttachment = 'fixed';
}

function watchPreference(query) {
  if (typeof window.matchMedia !== 'function') return;

  const mediaQuery = window.matchMedia(query);
  const listener = () => paintLiquidBackground();

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(listener);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setActiveNav(link) {
  navLinks.forEach(item => {
    const active = item === link;
    item.classList.toggle('is-active', active);

    if (active) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function chapterLayout(page, title, items, selected) {
  const safeItems = items.map(escapeHtml);
  const currentItem = safeItems[selected] || safeItems[0];

  return `
    <div class="chapter-layout">
      <nav class="chapter-index" aria-label="${escapeHtml(title)}">
        <div class="chapter-index-heading">
          <strong>${escapeHtml(title)}</strong>
          <span>${items.length} 项</span>
        </div>
        ${safeItems.map((item, index) => `
          <button type="button" data-chapter-index="${page}" data-index="${index}" data-ripple aria-current="${index === selected ? 'location' : 'false'}">${item}</button>
        `).join('')}
      </nav>
      <article class="chapter-content" id="${page}-panel" tabindex="-1">
        <h2>${currentItem}</h2>
      </article>
    </div>`;
}

function renderStudy() {
  const state = contentState.study;
  const currentTerm = studyTerms[state.term];

  return `
    <section class="content-view" data-page-view="study">
      <header class="content-heading">
        <h1>学在南雍</h1>
      </header>
      <div class="section-tabs" role="tablist" aria-label="学期切换">
        ${studyTerms.map((term, index) => `
          <button type="button" class="section-tab" role="tab" id="study-term-${index}" aria-controls="study-panel" aria-selected="${index === state.term}" tabindex="${index === state.term ? 0 : -1}" data-study-term="${index}" data-ripple>${term.label}</button>
        `).join('')}
      </div>
      ${chapterLayout('study', '学科导航', currentTerm.items, state.item)}
    </section>`;
}

function renderIndexedPage(page, title, indexTitle, items) {
  const state = contentState[page];

  return `
    <section class="content-view" data-page-view="${page}">
      <header class="content-heading">
        <h1>${escapeHtml(title)}</h1>
      </header>
      ${chapterLayout(page, indexTitle, items, state.item)}
    </section>`;
}

function renderView(page) {
  if (!contentRoot) return;

  if (page === 'study') {
    contentRoot.innerHTML = renderStudy();
    return;
  }

  if (page === 'jinling') {
    contentRoot.innerHTML = renderIndexedPage(
      'jinling',
      '玩在金陵',
      '游览导航',
      ['地点1', '地点2', '地点3', '地点4', '地点5']
    );
    return;
  }

  if (page === 'memories') {
    contentRoot.innerHTML = renderIndexedPage(
      'memories',
      '南雍杂忆',
      '时间索引',
      ['2025年', '2026年']
    );
    return;
  }

  const meta = pageMeta[page] || pageMeta.about;
  contentRoot.innerHTML = `
    <section class="content-view content-placeholder" data-page-view="${page}">
      <header class="content-heading">
        <h1>${escapeHtml(meta.title)}</h1>
      </header>
    </section>`;
}

function syncActiveNav() {
  const currentHash = window.location.hash || '#about';
  const currentLink = navLinks.find(link => link.getAttribute('href') === currentHash);
  const page = currentLink ? currentLink.getAttribute('href').slice(1) : 'about';
  setActiveNav(currentLink || navLinks[0]);
  renderView(page);
}

function reducedMotion() {
  return mediaMatches('(prefers-reduced-motion: reduce)');
}

function rippleAt(event) {
  const target = event.target.closest('[data-ripple]');
  if (!target || target.hasAttribute('disabled') || reducedMotion()) return;

  target.querySelectorAll('.ripple').forEach(node => node.remove());
  const rect = target.getBoundingClientRect();
  const size = Math.min(160, Math.max(rect.width, rect.height) * 1.4);
  const x = event.detail === 0 && event.type === 'click' ? rect.width / 2 : event.clientX - rect.left;
  const y = event.detail === 0 && event.type === 'click' ? rect.height / 2 : event.clientY - rect.top;
  const ripple = document.createElement('span');

  ripple.className = 'ripple';
  Object.assign(ripple.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x - size / 2}px`,
    top: `${y - size / 2}px`
  });
  target.append(ripple);

  if (typeof ripple.animate === 'function') {
    ripple.animate(
      [{ transform: 'scale(0)', opacity: .12 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: rippleDuration, easing: 'cubic-bezier(.2, 0, 0, 1)' }
    ).finished.finally(() => ripple.remove());
  } else {
    ripple.style.opacity = '0';
    window.setTimeout(() => ripple.remove(), rippleDuration);
  }
}

function moveTab(tab, direction) {
  const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(tab);
  const nextIndex = direction === 'Home'
    ? 0
    : direction === 'End'
      ? tabs.length - 1
      : (index + (direction === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;

  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

body.dataset.materialMode = 'liquid-glass';
paintLiquidBackground();
watchPreference('(prefers-contrast: more)');
watchPreference('(forced-colors: active)');

document.addEventListener('pointerdown', event => {
  if (event.button === 0) rippleAt(event);
});

document.addEventListener('click', event => {
  const dynamicRippleTarget = event.target.closest('[data-study-term], [data-chapter-index]');
  if (event.detail === 0 && !dynamicRippleTarget) rippleAt(event);

  const studyTerm = event.target.closest('[data-study-term]');
  if (studyTerm) {
    contentState.study.term = Number(studyTerm.dataset.studyTerm);
    contentState.study.item = 0;
    renderView('study');
    rippleAt({
      target: document.getElementById(`study-term-${contentState.study.term}`),
      detail: event.detail,
      type: event.type,
      clientX: event.clientX,
      clientY: event.clientY
    });
    document.getElementById(`study-term-${contentState.study.term}`)?.focus();
    return;
  }

  const chapterButton = event.target.closest('[data-chapter-index]');
  if (chapterButton) {
    const page = chapterButton.dataset.chapterIndex;
    contentState[page].item = Number(chapterButton.dataset.index);
    renderView(page);
    const nextChapterButton = contentRoot.querySelector(`[data-chapter-index="${page}"][data-index="${contentState[page].item}"]`);
    rippleAt({
      target: nextChapterButton,
      detail: event.detail,
      type: event.type,
      clientX: event.clientX,
      clientY: event.clientY
    });
    nextChapterButton?.focus();
  }
});

document.addEventListener('keydown', event => {
  const tab = event.target.closest('[role="tab"]');
  if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  moveTab(tab, event.key);
});

window.addEventListener('hashchange', syncActiveNav);
syncActiveNav();
