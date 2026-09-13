const body = document.body;
const contentRoot = document.getElementById('content-root');
const courseContext = document.querySelector('.course-context');
const bottomNav = document.querySelector('[data-bottom-nav]');
const navLinks = [...document.querySelectorAll('[data-nav-page]')];
const navPages = ['home', 'study', 'jinling', 'memories', 'articles'];
const rippleDuration = 1000;
const routeMotion = MyBlogRouteMotion.create(document.querySelector('.page-shell'));
const liquidGlassBackground = [
  'radial-gradient(circle at 88% 10%, rgba(74, 144, 217, .48), transparent 58%)',
  'radial-gradient(circle at 10% 88%, rgba(211, 228, 253, .82), transparent 60%)',
  'linear-gradient(148deg, rgba(211, 228, 253, .92), rgba(249, 249, 255, .96) 52%, rgba(74, 144, 217, .28))'
].join(', ');

const contentState = {
  study: { grade: 0, item: 0 },
  jinling: { item: 0 },
  memories: { item: 0 }
};

let studyCatalog = [];
let savedStudyView = null;
let savedStudyScroll = 0;
const readingSections = {
  study: { title: '学在南雍', root: 'docs_learning', manifest: 'learning.json' },
  jinling: { title: '玩在金陵', root: 'docs_travelling', manifest: 'travelling.json' },
  memories: { title: '南雍杂忆', root: 'docs_dairy', manifest: 'dairy.json' }
};
const sectionCatalogs = { jinling: [], memories: [] };
const savedReaders = new Map();

const pageMeta = {
  home: { title: '首页' },
  articles: { title: '文章检索' }
};

let renderedPage = null;
let renderedCoursePage = false;
let hasRendered = false;

const personalInfo = [
  { label: 'Email', value: 'mellowwinds@qq.com', icon: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path>' },
  { label: 'QQ', value: '2860339144', icon: '<path fill="currentColor" stroke="none" d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"></path>' },
  { label: '学校', value: '南京大学', icon: '<path d="m3 9 9-5 9 5-9 5-9-5Z"></path><path d="M6 11v5.5c3.5 2.2 8.5 2.2 12 0V11M21 9v7"></path>' },
  { label: '专业', value: '软工经济', icon: '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M8 8h8M8 12h8M8 16h4"></path>' }
];

const featuredArticles = [
  {
    title: '二分查找的『红绿算法』',
    source: '大一上-C Programming-算法',
    grade: '大一上',
    subject: 'C Programming',
    path: '算法/二分查找的『红绿算法』.md'
  },
  {
    title: '二位前缀和',
    source: '大一上-C Programming-算法',
    grade: '大一上',
    subject: 'C Programming',
    path: '算法/二位前缀和.md'
  },
  {
    title: '知识点总结',
    source: '大一下-软工I-期末复习',
    grade: '大一下',
    subject: '软工I',
    path: '期末复习/知识点总结.md'
  }
];

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

function setActiveNav(link, immediate = false) {
  navLinks.forEach(item => {
    const active = item === link;
    item.classList.toggle('is-active', active);

    if (active) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
  updateNavIndicator(link, immediate);
}

function updateNavIndicator(link, immediate = false) {
  if (!bottomNav || !link) return;
  const track = bottomNav.querySelector('.bottom-nav-track');
  const indicator = bottomNav.querySelector('.bottom-nav-indicator');
  if (!track || !indicator) return;

  const trackRect = track.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  if (!linkRect.width) return;

  if (immediate) bottomNav.classList.add('is-positioning');
  indicator.style.setProperty('--indicator-x', `${linkRect.left - trackRect.left}px`);
  indicator.style.setProperty('--indicator-width', `${linkRect.width}px`);
  requestAnimationFrame(() => bottomNav.classList.remove('is-positioning'));
}

function navLinkAtPoint(event) {
  if (!bottomNav || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
  return navLinks.find(link => {
    const rect = link.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  }) || null;
}

function pageIndex(page) {
  const index = navPages.indexOf(page);
  return index >= 0 ? index : 0;
}

function routeSignature(route) {
  return JSON.stringify({ page: route.page, params: route.params || [] });
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

function encodeRoutePart(value) {
  return encodeURIComponent(value);
}

function articleRoute(article) {
  return `#study/${[article.grade, article.subject, article.path].map(encodeRoutePart).join('/')}`;
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function currentRoute() {
  const parts = (window.location.hash || '#home')
    .slice(1)
    .split('/')
    .filter(Boolean)
    .map(decodeRoutePart);

  const requestedPage = parts[0] || 'home';
  return {
    page: requestedPage === 'about' ? 'home' : requestedPage,
    params: parts.slice(1)
  };
}

function isLocalServer() {
  return window.location.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname);
}

function catalogFromLearningJson(document) {
  const normalizeNode = (node, parentPath = '') => {
    const item = typeof node === 'string' ? { name: node, path: node } : (node || {});
    const name = String(item.name || item.path || '').replace(/\.(md|pdf)$/i, '');
    const path = String(item.path || (parentPath ? `${parentPath}/${item.name}` : item.name || ''));
    const children = Array.isArray(item.children)
      ? item.children.map(child => normalizeNode(child, path)).filter(Boolean)
      : null;
    if (children) return { kind: 'folder', name, path, weight: item.weight, children };
    return {
      kind: 'file',
      name,
      path,
      type: item.type === 'pdf' || /\.pdf$/i.test(String(item.path || '')) ? 'pdf' : 'md',
      version: item.version
    };
  };
  const flattenNodes = (nodes, files = []) => {
    nodes.forEach(node => {
      if (node.kind === 'file') files.push(node);
      else flattenNodes(node.children || [], files);
    });
    return files;
  };
  const entries = Array.isArray(document)
    ? document.map(grade => ({
      ...grade,
      course: (Array.isArray(grade.subjects) ? grade.subjects : []).map(subject => ({
        name: subject.name,
        teacher: subject.teacher,
        files: subject.files,
        children: subject.children
      }))
    }))
    : (Array.isArray(document?.catalog) ? document.catalog : []);
  return [...entries].sort((left, right) => (left.weight ?? Infinity) - (right.weight ?? Infinity)).map(entry => ({
    name: entry.name,
    folder: entry.folder || entry.name,
    year: entry.year,
    session: entry.session,
    subjects: (Array.isArray(entry.course) ? entry.course : []).map(course => {
      const sourceNodes = Array.isArray(course.children) && (course.children.length || !Array.isArray(course.files) || !course.files.length)
        ? course.children
        : (Array.isArray(course.files) ? course.files : []);
      const children = sourceNodes.map(node => normalizeNode(node)).filter(Boolean);
      const files = flattenNodes(children).map(file => ({ ...file, version: file.version || (Array.isArray(document) ? 'legacy' : document.version) }));
      return {
        name: course.name,
        folder: course.folder || course.name,
        root: course.root === true,
        weight: course.weight,
        teacher: course.teacher || 'xxx',
        contentCount: files.length,
        children,
        files
      };
    }).sort((left, right) => (left.weight ?? Infinity) - (right.weight ?? Infinity) || left.name.localeCompare(right.name, 'zh-CN', { numeric: true, sensitivity: 'base' }))
  }));
}

function catalogSignature(catalog) {
  return JSON.stringify(catalog);
}

function applyStudyCatalog(nextCatalog) {
  if (!Array.isArray(nextCatalog) || catalogSignature(nextCatalog) === catalogSignature(studyCatalog)) return;

  const currentGradeName = studyCatalog[contentState.study.grade]?.name;
  const currentSubjectName = studyCatalog[contentState.study.grade]?.subjects[contentState.study.item]?.name;
  const nextGradeIndex = nextCatalog.findIndex(grade => grade.name === currentGradeName);
  studyCatalog = nextCatalog;
  contentState.study.grade = nextGradeIndex >= 0 ? nextGradeIndex : 0;

  const currentGrade = studyCatalog[contentState.study.grade];
  const nextSubjectIndex = currentGrade?.subjects.findIndex(subject => subject.name === currentSubjectName) ?? -1;
  contentState.study.item = nextSubjectIndex >= 0 ? nextSubjectIndex : 0;

  if (currentRoute().page === 'study') syncActiveNav();
}

async function loadStudyCatalog() {
  await Promise.all(Object.entries(readingSections).map(async ([page, config]) => {
    try {
      const response = await fetch(`${config.root}/${config.manifest}`, { cache: 'no-store' });
      if (!response.ok) return;
      const manifest = await response.json();
      if (page === 'study') { applyStudyCatalog(catalogFromLearningJson(manifest)); return; }
      const next = catalogFromLearningJson({ version: manifest.version, catalog: [{
        name: '', course: [{ name: '', children: manifest.children || [] }]
      }] });
      if (catalogSignature(next) === catalogSignature(sectionCatalogs[page])) return;
      sectionCatalogs[page] = next;
      if (currentRoute().page === page) syncActiveNav();
    } catch { /* Keep the last usable catalogue while a refresh is unavailable. */ }
  }));
}

function renderStudy() {
  return renderCourseView();
}

function renderAbout() {
  return `
    <section class="content-view home-view" data-page-view="home">
      <header class="home-hero">
        <div class="home-hero-copy">
          <h1><span>遇事不怒，吃饱睡足</span><span>读万卷书，行万里路</span></h1>
          <p>欢迎来到Mellow的Blog。<wbr>与我一起，在风与歌中成长吧~</p>
        </div>
        <button class="home-down" type="button" aria-label="向下浏览个人资料" data-home-down>
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 12 9 9 9-9"/></svg>
        </button>
      </header>
      <div class="home-content">
      <section class="home-section home-profile" aria-label="个人资料">
        <div class="profile-layout">
          <div class="avatar-placeholder" aria-label="头像">
            <img src="icon/icon128.png" alt="头像">
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
            <p class="personal-introduction">Hello！你可以叫我Mellow，我是一名NJU软工经济在读大二学生。我喜欢追根究底，用逻辑、模型和反例理解问题。在理性之外，我同样珍视审美、想象力和人与人之间真诚的交流。喜欢辩论和一些看起来“没什么用”却足够有趣的探索。对我而言，大学不只是获得知识和学位的地方，更重要的是不断尝试、创造，并逐渐找到自己真正愿意长期投入的事情。</p>
          </article>
        </div>
      </section>

      <section class="home-section home-projects" aria-label="项目" data-home-reveal>
        <h2 class="home-section-title home-projects-title">最近项目</h2>
        <div class="home-project-list">
          <article class="home-project-card glass-surface">
            <h3>NJU-Hub</h3>
            <p>开发中：持续更新</p>
            <a class="home-project-link glass-surface" href="https://github.com/Mellow-Winds/NJU-Hub" target="_blank" rel="noopener noreferrer" data-ripple>点击访问</a>
          </article>
          <p class="home-project-more">更多项目鬼点子生成中...</p>
        </div>
      </section>
      <section class="home-section home-recent" aria-labelledby="featured-heading" data-home-reveal>
        <h2 class="home-section-title" id="featured-heading">文章精选</h2>
        <div class="article-grid">
          ${featuredArticles.map(article => `
            <a class="article-card glass-surface" href="${articleRoute(article)}" data-ripple>
              <h3>${escapeHtml(article.title)}</h3>
              <p class="article-source">${escapeHtml(article.source)}</p>
            </a>
          `).join('')}
        </div>
      </section>
      </div>
    </section>`;
}

function renderCourseView(gradeName, subjectName) {
  const grade = studyCatalog.find(item => item.name === gradeName);
  const subject = grade?.subjects.find(item => item.name === subjectName);

  return `
    <section class="content-view course-view" data-page-view="study-course" data-grade="${escapeHtml(grade?.name || '')}" data-subject="${escapeHtml(subject?.name || '')}">
      <article class="prose" id="markdown-content" aria-label="正文" tabindex="0"></article>
      <footer class="reader-footer" hidden></footer>
      <nav class="chapter-index reader-outline" aria-label="文件导航" hidden></nav>
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

function renderView(page, params = []) {
  if (!contentRoot) return;

  if (page === 'home') {
    contentRoot.innerHTML = renderAbout();
    requestAnimationFrame(updateHomeMotion);
    return;
  }

  if (readingSections[page]) {
    const mountedPage = contentRoot.querySelector('.course-view')?.dataset.section;
    if (!document.getElementById('markdown-content') || mountedPage !== page) {
      const saved = savedReaders.get(page);
      if (saved?.view) contentRoot.replaceChildren(saved.view);
      else contentRoot.innerHTML = renderCourseView(params[0], params[1]);
      contentRoot.querySelector('.course-view').dataset.section = page;
      document.querySelector('.main-stage').scrollTop = saved?.scroll || 0;
    }
    window.MyBlogReader.setSection?.(page, readingSections[page].root);
    const catalog = page === 'study' ? studyCatalog : sectionCatalogs[page];
    window.MyBlogReader.setCatalog(catalog);
    const selectedGrade = page === 'study' ? catalog.find(item => item.name === params[0]) : catalog[0];
    const selectedSubject = page === 'study' ? selectedGrade?.subjects.find(item => item.name === params[1]) : selectedGrade?.subjects[0];
    window.MyBlogReader.show(selectedGrade, selectedSubject, page === 'study' ? params[2] : params.join('/'));
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

  const meta = pageMeta[page] || pageMeta.home;
  contentRoot.innerHTML = `
    <section class="content-view content-placeholder" data-page-view="${page}">
      <header class="content-heading">
        <h1>${escapeHtml(meta.title)}</h1>
      </header>
      </section>`;
}

function renderRouteView(page, params, direction, shouldAnimate, isCoursePage, applyState) {
  if (shouldAnimate) window.MyBlogDirectory.close(true);
  routeMotion.transition(routeSignature({ page, params }), direction, () => {
    body.classList.remove('reader-enter');
    contentRoot.classList.remove('view-enter', 'view-enter-from-left', 'view-enter-from-right');
    applyState?.();
    renderView(page, params);
  }, shouldAnimate);
}

function syncActiveNav(route = currentRoute()) {

  const currentLink = navLinks.find(link => link.dataset.navPage === route.page);
  const page = currentLink ? route.page : 'home';
  const grade = studyCatalog.find(item => item.name === route.params[0]);
  const subject = grade?.subjects.find(item => item.name === route.params[1]);
  const isCoursePage = !!readingSections[page];
  const pageChanged = hasRendered && renderedPage !== page;
  const courseStateChanged = hasRendered && renderedCoursePage !== isCoursePage;
  const shouldAnimate = pageChanged;
  const direction = pageIndex(page) >= pageIndex(renderedPage) ? 'from-right' : 'from-left';
  const applyState = () => {
    if (pageChanged && readingSections[renderedPage]) {
      savedStudyScroll = document.querySelector('.main-stage').scrollTop;
      savedStudyView = contentRoot.querySelector('.course-view');
      savedReaders.set(renderedPage, { view: savedStudyView, scroll: savedStudyScroll });
      window.MyBlogReader.suspend();
    }
    if (pageChanged) body.classList.remove('directory-open', 'outline-open');
    const sectionTitle = document.querySelector('[data-section-title]');
    if (sectionTitle) sectionTitle.textContent = readingSections[page]?.title || 'MellowBlog';
    body.classList.toggle('course-page', isCoursePage);
    body.classList.toggle('home-page', page === 'home');
    if (pageChanged || courseStateChanged) document.querySelector('.main-stage').scrollTop = 0;
    document.querySelector('.reader-back').hidden = true;
    document.querySelector('.file-tools').hidden = !isCoursePage;
    document.querySelector('.course-files').hidden = !isCoursePage;
    if (page === 'study' && subject?.files.some(file => file.path === route.params[2])) {
      navLinks.find(link => link.dataset.navPage === 'study').href = '#study/' + route.params.map(encodeRoutePart).join('/');
    }
    if (page !== 'study' && isCoursePage && sectionCatalogs[page][0]?.subjects[0]?.files.some(file => file.path === route.params.join('/'))) {
      navLinks.find(link => link.dataset.navPage === page).href = '#' + page + '/' + route.params.map(encodeRoutePart).join('/');
    }
    if (isCoursePage && grade) contentState.study.grade = studyCatalog.indexOf(grade);
    if (courseContext) {
      courseContext.hidden = true;
      courseContext.textContent = '';
    }
    setActiveNav(currentLink || navLinks[0], !hasRendered);
  };

  renderRouteView(
    page,
    isCoursePage ? route.params : [],
    direction,
    shouldAnimate,
    isCoursePage,
    applyState
  );

  renderedPage = page;
  renderedCoursePage = isCoursePage;
  hasRendered = true;
}

function revealElements(elements, initialDelay = 0) {
  if (reducedMotion()) return [];
  return [...elements].map((element, index) => element.animate([
      { opacity: 0, transform: 'translateY(-12px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 1000, delay: initialDelay + Math.min(index, 8) * 100, easing: 'cubic-bezier(.2,0,0,1)', fill: 'backwards' }));
}

function updateStudyVisibility() {
  const main = document.querySelector('.main-stage');
  const bounds = main.getBoundingClientRect();
  const bottom = Math.min(bounds.bottom, bottomNav.getBoundingClientRect().top - 12);
  contentRoot.querySelectorAll('.course-card').forEach(card => {
    const rect = card.getBoundingClientRect();
    const visibility = reducedMotion() ? 1 : Math.max(0, Math.min(1, (rect.bottom - bounds.top) / 90, (bottom - rect.top) / 90));
    card.style.opacity = String(visibility);
  });
}

let studyScrollFrame = 0;
// Only the cover/content boundary pages; the content itself scrolls normally.
document.querySelector('.main-stage').addEventListener('wheel', event => {
  const hero = contentRoot.querySelector('.home-hero');
  if (!hero || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  const main = document.querySelector('.main-stage');
  const boundary = hero.offsetHeight;
  const fromCover = main.scrollTop < 1 && event.deltaY > 0;
  const fromContent = Math.abs(main.scrollTop - boundary) < 1 && event.deltaY < 0;
  if (!fromCover && !fromContent) return;
  event.preventDefault();
  main.scrollTo({ top: fromCover ? boundary : 0, behavior: reducedMotion() ? 'instant' : 'smooth' });
}, { passive: false });
function updateHomeMotion() {
  const hero = contentRoot.querySelector('.home-hero');
  if (!hero) return;
  const main = document.querySelector('.main-stage');
  const progress = Math.min(1, main.scrollTop / Math.max(1, hero.offsetHeight));
  const copy = hero.querySelector('.home-hero-copy');
  copy.style.opacity = String(reducedMotion() ? 1 : Math.max(0, 1 - progress * 1.4));
  copy.style.transform = reducedMotion() ? 'none' : `translateY(${-progress * 36}px)`;
  hero.classList.toggle('has-scrolled', main.scrollTop > 24);
  const bounds = main.getBoundingClientRect();
  contentRoot.querySelectorAll('[data-home-reveal]').forEach(section => {
    const distance = bounds.bottom - section.getBoundingClientRect().top;
    const amount = reducedMotion() ? 1 : Math.max(0, Math.min(1, distance / Math.min(220, bounds.height * .3)));
    section.style.opacity = String(amount);
    section.style.transform = `translateY(${(1 - amount) * 24}px)`;
  });
}
window.addEventListener?.('resize', updateHomeMotion);
window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', updateHomeMotion);
document.querySelector('.main-stage').addEventListener('scroll', () => {
  if (studyScrollFrame) return;
  studyScrollFrame = requestAnimationFrame(() => {
    studyScrollFrame = 0;
    updateStudyVisibility();
    updateHomeMotion();
  });
}, { passive: true });
window.MyBlogMotion = { reveal: revealElements };

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

body.dataset.materialMode = 'liquid-glass';
paintLiquidBackground();
watchPreference('(prefers-contrast: more)');
watchPreference('(forced-colors: active)');

document.addEventListener('pointerdown', event => {
  if (event.button === 0) rippleAt(event);
});

document.addEventListener('click', event => {
  if (event.target.closest('[data-home-down]')) {
    const main = document.querySelector('.main-stage');
    main.scrollTo({ top: contentRoot.querySelector('.home-hero').offsetHeight, behavior: reducedMotion() ? 'instant' : 'smooth' });
  }
  if (event.target.closest('[data-nav-page="home"]') && currentRoute().page === 'home') {
    document.querySelector('.main-stage').scrollTo({ top: 0, behavior: reducedMotion() ? 'instant' : 'smooth' });
  }
  const directNavLink = event.target.closest('[data-nav-page]');
  const pointNavLink = directNavLink || navLinkAtPoint(event);
  if (pointNavLink && !directNavLink) {
    event.preventDefault();
    window.location.hash = pointNavLink.getAttribute('href');
    return;
  }

  const dynamicRippleTarget = event.target.closest('[data-chapter-index]');
  if (event.detail === 0 && !dynamicRippleTarget) rippleAt(event);

  const studyBack = event.target.closest('[data-study-back]');
  if (studyBack) {
    window.location.hash = '#study';
    return;
  }

  const chapterButton = event.target.closest('[data-chapter-index]');
  if (chapterButton) {
    const page = chapterButton.dataset.chapterIndex;
    contentState[page].item = Number(chapterButton.dataset.index);
    const heading = document.getElementById(`${page}-panel`)?.querySelector('h2');
    if (heading) heading.textContent = chapterButton.textContent;
    contentRoot.querySelectorAll(`[data-chapter-index="${page}"]`).forEach(button => {
      button.setAttribute('aria-current', button === chapterButton ? 'location' : 'false');
    });
    return;
  }
});

window.addEventListener('hashchange', () => syncActiveNav());
window.addEventListener('resize', () => {
  const active = navLinks.find(link => link.classList.contains('is-active'));
  updateNavIndicator(active, true);
  updateStudyVisibility();
});
syncActiveNav();
loadStudyCatalog();
window.setInterval(loadStudyCatalog, isLocalServer() ? 1000 : 60000);
