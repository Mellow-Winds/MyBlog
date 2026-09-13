/* One camera, one velocity. Retargeting never resets either value. */
globalThis.MyBlogRouteMotion = (() => {
  function createSpring() {
    return {
      position: 0, velocity: 0, target: 0, response: 10,
      retarget(target, continuing = false) {
        this.target = target;
        this.response = continuing ? 14 : 10;
      },
      step(seconds) {
        // Exact critically damped solution: stable at any display refresh rate.
        const offset = this.position - this.target;
        const coefficient = this.velocity + this.response * offset;
        const decay = Math.exp(-this.response * seconds);
        this.position = this.target + (offset + coefficient * seconds) * decay;
        this.velocity = (this.velocity - this.response * coefficient * seconds) * decay;
      },
      get settled() {
        return Math.abs(this.position - this.target) < 0.0001 && Math.abs(this.velocity) < 0.001;
      }
    };
  }

  function create(shell) {
    const spring = createSpring();
    const panels = new Map();
    let frame = 0;
    let previousTime = 0;
    let currentKey = '';
    let currentSlot = 0;
    let snapshotStyles;

    function paint() {
      const width = document.documentElement.clientWidth;
      shell.style.transform = `translate3d(${(currentSlot - spring.position) * width}px,0,0)`;
      panels.forEach(panel => {
        if (panel.host) panel.host.style.transform = `translate3d(${(panel.slot - spring.position) * width}px,0,0)`;
      });
    }

    function finish() {
      cancelAnimationFrame(frame);
      frame = 0;
      panels.forEach(panel => panel.host?.remove());
      panels.clear();
      spring.position = spring.target = currentSlot = 0;
      spring.velocity = 0;
      shell.style.removeProperty('transform');
      shell.style.removeProperty('will-change');
      shell.inert = false;
    }

    function tick(now) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
      spring.step(Math.min((now - previousTime) / 1000, 0.05));
      previousTime = now;
      paint();
      if (spring.settled) finish();
      else frame = requestAnimationFrame(tick);
    }

    function snapshot() {
      // Shadow DOM keeps old IDs, reader queries and event handlers isolated.
      if (!snapshotStyles) {
        snapshotStyles = new CSSStyleSheet();
        snapshotStyles.replaceSync([...document.styleSheets].map(sheet => {
          try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n'); }
          catch { return ''; }
        }).join('\n').replace(/\bbody\b/g, '.snapshot-context').replace(/:root/g, ':host') +
          '\n.snapshot-context { background:none!important; margin:0!important; }' +
          '\n.snapshot-context::before,.snapshot-context::after { display:none!important; }' +
          '\n* { animation:none!important; transition:none!important; }');
      }
      const host = document.createElement('div');
      host.className = 'route-snapshot';
      host.inert = true;
      host.setAttribute('aria-hidden', 'true');
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = [snapshotStyles];
      const context = document.createElement('div');
      context.className = `snapshot-context ${document.body.className}`;
      context.dataset.materialMode = document.body.dataset.materialMode;
      const copy = shell.cloneNode(true);
      copy.style.transform = 'none';
      const originals = [shell, ...shell.querySelectorAll('*')];
      const copies = [copy, ...copy.querySelectorAll('*')];
      const scrolls = [];
      originals.forEach((node, i) => {
        if (node.scrollTop || node.scrollLeft) scrolls.push([copies[i], node.scrollTop, node.scrollLeft]);
        if (node.getAnimations().length) {
          const style = getComputedStyle(node);
          copies[i].style.opacity = style.opacity;
          if (node !== shell) copies[i].style.transform = style.transform;
        }
        if (node instanceof HTMLCanvasElement) copies[i].getContext('2d')?.drawImage(node, 0, 0);
      });
      context.append(copy);
      shadow.append(context);
      document.body.append(host);
      scrolls.forEach(([node, top, left]) => { node.scrollTop = top; node.scrollLeft = left; });
      return host;
    }

    return {
      get moving() { return Boolean(frame); },
      get key() { return currentKey; },
      transition(key, direction, render, animate) {
        if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
          if (!animate && frame) { render(); paint(); return; }
          finish(); render(); currentKey = key; return;
        }
        const continuing = Boolean(frame);
        const old = panels.get(currentKey);
        old?.host?.remove();
        panels.set(currentKey, { slot: currentSlot, host: snapshot() });
        let next = panels.get(key);
        if (!next) {
          const slots = [...panels.values()].map(panel => panel.slot);
          next = { slot: direction === 'from-right' ? Math.max(...slots) + 1 : Math.min(...slots) - 1 };
          panels.set(key, next);
        }
        next.host?.remove();
        next.host = null;
        currentSlot = next.slot;
        currentKey = key;
        render();
        shell.inert = true;
        shell.style.willChange = 'transform';
        spring.retarget(currentSlot, continuing);
        paint();
        if (!continuing) {
          previousTime = performance.now();
          frame = requestAnimationFrame(tick);
        }
      },
      finish
    };
  }
  return { create, createSpring };
})();
