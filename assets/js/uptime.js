window.MyBlogUptime = (() => {
  const START = Date.parse('2026-09-13T16:00:00+08:00');
  let timer;
  let target;
  let groups = [];
  const flips = new Map();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const units = [[365 * 86400, '年'], [30 * 86400, '月'], [86400, '日'], [3600, '时'], [60, '分'], [1, '秒']];

  function values(now = Date.now()) {
    let remaining = Math.max(0, Math.floor((now - START) / 1000));
    return units.map(([seconds]) => {
      const value = Math.floor(remaining / seconds);
      remaining %= seconds;
      return String(value).padStart(2, '0');
    });
  }

  function format(now = Date.now()) {
    return '已运行' + values(now).map((value, i) => value + units[i][1]).join('');
  }

  function span(className, text = '') {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    return node;
  }

  function settle(digit) {
    const flip = flips.get(digit);
    if (!flip) return;
    flips.delete(digit);
    flip.animations.forEach(animation => animation.cancel());
    flip.old.remove();
    if (digit.dataset.value === '') digit.remove();
  }

  function updateDigit(digit, next, animate) {
    const previous = digit.dataset.value;
    if (previous === next) return;
    settle(digit);
    digit.dataset.value = next;
    const face = digit.firstElementChild;
    face.textContent = next;
    if (!animate || typeof face.animate !== 'function') {
      if (!next) digit.remove();
      return;
    }
    const old = span('uptime-digit-old', previous);
    digit.append(old);
    // Each digit lifts upward around its top edge, like a calendar leaf.
    const animations = [
      old.animate([{ transform: 'rotateX(0deg)', opacity: 1 }, { transform: 'rotateX(90deg)', opacity: 0 }],
        { duration: 210, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }),
      face.animate([{ transform: 'rotateX(-90deg)', opacity: 0 }, { transform: 'rotateX(0deg)', opacity: 1 }],
        { duration: 250, delay: 160, easing: 'cubic-bezier(0,0,.2,1)', fill: 'backwards' })
    ];
    flips.set(digit, { old, animations });
    animations[1].onfinish = () => {
      if (flips.get(digit)?.old === old) settle(digit);
    };
  }

  function render(now, animate) {
    values(now).forEach((value, i) => {
      const group = groups[i];
      // Align by place value, so 25 -> 26 retains the tens node untouched.
      while (group.children.length < value.length) {
        const digit = span('uptime-digit');
        digit.dataset.value = '';
        digit.append(span('uptime-digit-value'));
        group.prepend(digit);
      }
      const digits = [...group.children];
      const padded = value.padStart(digits.length, ' ');
      digits.forEach((digit, index) => updateDigit(digit, padded[index].trim(), animate));
    });
    target.setAttribute('aria-label', format(now));
  }

  function tick(animate = true) {
    clearTimeout(timer);
    if (!target?.isConnected) return;
    if (document.hidden) return;
    render(Date.now(), animate && !reduced?.matches);
    timer = setTimeout(() => tick(), 1000 - Date.now() % 1000);
  }

  function mount(root) {
    unmount();
    target = root.querySelector('[data-uptime]');
    if (!target) return;
    const visual = span('uptime-content');
    visual.setAttribute('aria-hidden', 'true');
    visual.append(span('uptime-prefix', '已运行'));
    groups = units.map(([, label]) => {
      const unit = span('uptime-unit');
      const digits = span('uptime-digits');
      unit.append(digits, span('uptime-label', label));
      visual.append(unit);
      return digits;
    });
    target.replaceChildren(visual);
    target.setAttribute('role', 'timer');
    // Expose the whole value without announcing every second to screen readers.
    target.setAttribute('aria-live', 'off');
    tick(false);
  }

  function unmount() {
    clearTimeout(timer);
    [...flips.keys()].forEach(settle);
    groups = [];
    target = null;
  }

  document.addEventListener('visibilitychange', () => {
    [...flips.keys()].forEach(settle);
    tick(false);
  });
  reduced?.addEventListener('change', () => {
    [...flips.keys()].forEach(settle);
    tick(false);
  });
  window.addEventListener('pageshow', () => tick(false));
  return { format, mount, unmount };
})();
