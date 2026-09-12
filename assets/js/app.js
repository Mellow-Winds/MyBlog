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

const personalInfo = [
  { label: 'Email', value: 'test@test.com', icon: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path>' },
  { label: 'QQ', value: '123456', icon: '<path fill="currentColor" stroke="none" d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"></path>' },
  { label: '学校', value: '测试学校', icon: '<path d="m3 9 9-5 9 5-9 5-9-5Z"></path><path d="M6 11v5.5c3.5 2.2 8.5 2.2 12 0V11M21 9v7"></path>' },
  { label: '专业', value: '测试专业', icon: '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h4"></path>' }
];

const featuredArticles = ['文章1', '文章2', '文章3'];

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

function renderAbout() {
  return `
    <section class="content-view home-view" data-page-view="about">
      <section class="home-section" aria-labelledby="personal-heading">
        <h2 class="home-section-title" id="personal-heading">个人信息</h2>
        <div class="profile-layout">
          <div class="avatar-placeholder" aria-label="头像预留位">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5"></circle>
              <path d="M5 20c.8-3.4 3.2-5.3 7-5.3s6.2 1.9 7 5.3"></path>
            </svg>
          </div>
          <article class="personal-info-card glass-surface">
            ${personalInfo.map(item => `
              <div class="info-item" aria-label="${item.label}: ${item.value}">
                <span class="info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
                </span>
                <strong class="info-value">${item.value}</strong>
              </div>
            `).join('')}
          </article>
        </div>
      </section>

      <section class="home-section" aria-labelledby="featured-heading">
        <h2 class="home-section-title" id="featured-heading">文章精选</h2>
        <div class="article-grid">
          ${featuredArticles.map(title => `
            <article class="article-card glass-surface">
              <h3>${title}</h3>
            </article>
          `).join('')}
        </div>
      </section>
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

  if (page === 'about') {
    contentRoot.innerHTML = renderAbout();
    return;
  }

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
