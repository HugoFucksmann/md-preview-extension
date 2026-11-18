// Buscador propio del Preview (Ctrl+F, Enter/Shift+Enter, F3).
(function (ns) {
  const { content } = ns;

  const findBar = document.createElement('div');
  findBar.id = 'find-bar';
  findBar.innerHTML =
    '<input id="find-input" type="text" placeholder="Buscar\u2026" spellcheck="false">' +
    '<span id="find-count"></span>' +
    '<button type="button" id="find-prev" title="Anterior (Shift+Enter)">\u25B2</button>' +
    '<button type="button" id="find-next" title="Siguiente (Enter)">\u25BC</button>' +
    '<button type="button" id="find-close" title="Cerrar (Esc)">\u2715</button>';
  document.body.appendChild(findBar);

  const findToggle = document.createElement('button');
  findToggle.id = 'find-toggle';
  findToggle.type = 'button';
  findToggle.title = 'Buscar (Ctrl+F)';
  findToggle.textContent = '\uD83D\uDD0D';
  document.body.appendChild(findToggle);

  const findInput = document.getElementById('find-input');
  const findCount = document.getElementById('find-count');
  const canHighlight = !!(window.CSS && CSS.highlights && window.Highlight);
  const MAX_HITS = 5000;
  // Texto que no se busca: controles propios y la copia MathML oculta de KaTeX
  const SKIP = '.copy-btn,.lang-tag,.mz-controls,.katex-mathml,script,style';
  let findOpen = false;
  let hits = [];
  let cur = -1;

  function clearHighlights() {
    if (!canHighlight) return;
    CSS.highlights.delete('find-hit');
    CSS.highlights.delete('find-current');
  }

  function showCurrent(scroll) {
    clearHighlights();
    if (!hits.length) {
      findCount.textContent = findInput.value ? '0/0' : '';
      return;
    }
    findCount.textContent = (cur + 1) + '/' + hits.length;
    if (!canHighlight) return;
    CSS.highlights.set('find-hit', new Highlight(...hits));
    const h = new Highlight(hits[cur]);
    h.priority = 1;
    CSS.highlights.set('find-current', h);
    if (scroll) {
      const r = hits[cur].getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - window.innerHeight / 3 });
    }
  }

  function runFind(keep) {
    const q = findInput.value.toLowerCase();
    const prev = cur;
    hits = [];
    if (q) {
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) =>
          n.parentElement && n.parentElement.closest(SKIP)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      let node;
      while ((node = walker.nextNode()) && hits.length < MAX_HITS) {
        const text = node.nodeValue.toLowerCase();
        let i = text.indexOf(q);
        while (i !== -1 && hits.length < MAX_HITS) {
          const r = document.createRange();
          r.setStart(node, i);
          r.setEnd(node, i + q.length);
          hits.push(r);
          i = text.indexOf(q, i + q.length);
        }
      }
    }
    cur = hits.length ? (keep && prev >= 0 && prev < hits.length ? prev : 0) : -1;
    showCurrent(!keep);
  }

  function step(d) {
    if (!hits.length) return;
    cur = (cur + d + hits.length) % hits.length;
    showCurrent(true);
  }

  function openFind() {
    findBar.classList.add('open');
    findOpen = true;
    const sel = String(window.getSelection() || '').trim();
    if (sel && sel.length < 100 && sel.indexOf('\n') === -1) findInput.value = sel;
    findInput.focus();
    findInput.select();
    runFind(false);
  }

  function closeFind() {
    findBar.classList.remove('open');
    findOpen = false;
    hits = [];
    cur = -1;
    findCount.textContent = '';
    clearHighlights();
  }

  findInput.addEventListener('input', () => runFind(false));
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
    else if (e.key === 'Escape') { e.preventDefault(); closeFind(); }
  });
  document.getElementById('find-prev').addEventListener('click', () => step(-1));
  document.getElementById('find-next').addEventListener('click', () => step(1));
  document.getElementById('find-close').addEventListener('click', closeFind);
  findToggle.addEventListener('click', () => (findOpen ? closeFind() : openFind()));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openFind();
    } else if (e.key === 'F3' && findOpen) {
      e.preventDefault();
      step(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape' && findOpen && e.target !== findInput) {
      closeFind();
    }
  });

  ns.find = { isOpen: () => findOpen, rerun: () => runFind(true) };
})(window.MdPreview);