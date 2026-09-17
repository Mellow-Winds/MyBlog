window.MyBlogQuotes = (() => {
  const pending = new Map();
  const queues = new Map();
  const shuffle = values => {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  };
  const signature = entries => entries.join('\u0000');
  function readQueue(name, entries) {
    const currentSignature = signature(entries);
    let state = queues.get(name);
    if (!state || state.signature !== currentSignature) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(`myblog-quote:${name}`) || 'null');
        if (saved?.signature === currentSignature && Array.isArray(saved.queue)) {
          const valid = saved.queue.every(index => Number.isInteger(index) && index >= 0 && index < entries.length);
          if (valid) state = { signature: currentSignature, queue: saved.queue }; 
        }
      } catch { /* Storage can be disabled or contain an old format. */ }
    }
    if (!state || !state.queue.length) state = { signature: currentSignature, queue: shuffle(entries.map((_, index) => index)) };
    const chosen = entries[state.queue.shift()];
    queues.set(name, state);
    try { sessionStorage.setItem(`myblog-quote:${name}`, JSON.stringify(state)); } catch { /* The in-memory queue remains effective. */ }
    return chosen;
  }
  async function pick(name) {
    if (!pending.has(name)) {
      pending.set(name, fetch(new URL(`home/${name}.json`, document.baseURI), { cache: 'no-cache' })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        }).then(entries => {
          if (!Array.isArray(entries) || !entries.length || entries.some(value => typeof value !== 'string' || !value.trim())) {
            throw new Error(`Invalid ${name}.json: expected nonempty strings`);
          }
          return [...new Set(entries)];
        }).catch(error => { pending.delete(name); throw error; }));
    }
    const entries = await pending.get(name);
    return readQueue(name, entries);
  }
  async function mount(node, name, decorate = value => value, readyClass = '', lineClass = '') {
    const reveal = lineCount => {
      const target = node?.closest?.('.home-hero-copy') || node;
      // Anything sequenced after the lines follows however many actually rendered, not a fixed guess.
      if (lineCount && target?.style) target.style.setProperty('--quote-lines', String(lineCount));
      if (readyClass && target?.classList) requestAnimationFrame(() => {
        if (target.isConnected) target.classList.add(readyClass);
      });
    };
    // With a line class, each `\n`-separated line becomes its own element so they can fade in in sequence.
    const fill = text => {
      if (!lineClass) {
        node.textContent = text;
        return 0;
      }
      const lines = String(text).split('\n');
      node.replaceChildren(...lines.map((line, index) => {
        const span = document.createElement('span');
        span.className = lineClass;
        span.textContent = line;
        // Stagger is derived from the position, so any number of lines sequences correctly.
        span.style.setProperty('--quote-index', String(index));
        return span;
      }));
      return lines.length;
    };
    try {
      const value = await pick(name);
      if (node.isConnected) {
        reveal(fill(decorate(value)));
      }
    } catch (error) {
      console.warn(`Unable to load home/${name}.json:`, error);
      reveal();
    }
  }
  return { mount };
})();
