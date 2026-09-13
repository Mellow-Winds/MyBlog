/* Reuse the desktop directory nodes in a fixed mobile layer. */
window.MyBlogDirectory = (() => {
  const body = document.body;
  const panel = document.getElementById('content-directory');
  const toggle = document.querySelector('[data-study-directory]');
  const backdrop = document.querySelector('[data-directory-dismiss]');
  const anchor = document.createComment('desktop directory position');
  panel.before(anchor);
  const narrow = matchMedia('(max-width: 1200px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const spring = MyBlogRouteMotion.createSpring();
  spring.response = 16;
  let open = false, frame = 0, previous = 0;
  let rows = [];

  function paint() {
    const value = Math.max(0, Math.min(1, spring.position));
    panel.style.opacity = String(value);
    panel.style.transform = `translateY(${-12 * (1 - value)}px) scale(${.94 + .06 * value})`;
    backdrop.style.opacity = String(value);
  }
  function finish() {
    cancelAnimationFrame(frame); frame = 0;
    spring.position = spring.target; spring.velocity = 0;
    paint();
    panel.dataset.mobileState = open ? 'open' : 'closed';
  }
  function tick(now) {
    spring.step(Math.min((now - previous) / 1000, .05)); previous = now;
    paint();
    if (spring.settled || reduced.matches) finish();
    else frame = requestAnimationFrame(tick);
  }
  function revealRows() {
    rows.forEach(animation => animation.cancel()); rows = [];
    if (reduced.matches) return;
    const bounds = panel.getBoundingClientRect();
    const items = [...panel.querySelectorAll('.sidebar-heading, .file-tools, summary, .file-link')]
      .filter(node => { const r = node.getBoundingClientRect(); return r.height && r.bottom > bounds.top && r.top < bounds.bottom; });
    rows = items.map((node, index) => node.animate([
      { opacity: 0, transform: 'translateY(-8px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 1000, delay: Math.min(index, 10) * 65, easing: 'cubic-bezier(.2,0,0,1)', fill: 'backwards' }));
  }
  function setOpen(value, immediate = false) {
    value = Boolean(value && narrow.matches && body.classList.contains('course-page'));
    const changed = value !== open;
    open = value;
    body.classList.toggle('directory-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭内容目录' : '打开内容目录');
    panel.inert = narrow.matches && !open;
    if (narrow.matches) panel.setAttribute('aria-hidden', String(!open));
    else panel.removeAttribute('aria-hidden');
    backdrop.setAttribute('aria-hidden', String(!open));
    if (!narrow.matches) return;
    panel.dataset.mobileState = open ? 'opening' : 'closing';
    spring.target = open ? 1 : 0;
    if (open && changed) revealRows();
    if (immediate || reduced.matches) { finish(); return; }
    if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function mount() {
    cancelAnimationFrame(frame); frame = 0;
    spring.position = spring.velocity = spring.target = 0;
    setOpen(false, true);
    rows.forEach(animation => animation.cancel()); rows = [];
    if (narrow.matches) {
      body.append(panel);
      panel.classList.add('mobile-directory-panel');
      panel.dataset.mobileState = 'closed';
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
    } else {
      anchor.after(panel);
      panel.classList.remove('mobile-directory-panel');
      panel.style.removeProperty('opacity'); panel.style.removeProperty('transform');
      panel.inert = false; panel.removeAttribute('aria-hidden');
      delete panel.dataset.mobileState;
    }
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-study-directory]')) { setOpen(!open); return; }
    if (open && (event.target.closest('[data-reader-file]') || !panel.contains(event.target))) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); toggle.focus({ preventScroll: true }); }
    if (event.key === 'Tab' && open && document.activeElement === toggle && !event.shiftKey) {
      event.preventDefault(); panel.querySelector('summary, button:not([hidden]), a[href]')?.focus();
    }
  });
  document.addEventListener('focusin', event => {
    if (open && event.target !== toggle && !panel.contains(event.target)) setOpen(false);
  });
  window.addEventListener('popstate', () => setOpen(false, true));
  narrow.addEventListener('change', mount);
  reduced.addEventListener('change', () => { if (frame && reduced.matches) finish(); });
  mount();
  return { close: (immediate = false) => setOpen(false, immediate) };
})();
