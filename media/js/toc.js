// Índice lateral con seguimiento de la sección actual.
(function (ns) {
  const { vscode, content, layout } = ns;
  const toc = document.getElementById('toc');
  const tocToggle = document.getElementById('toc-toggle');

  let tocHidden = !!(vscode.getState() || {}).tocHidden;
  let tocEmpty = true;
  let headings = [];

  function applyToc() {
    layout.classList.toggle('no-toc', tocHidden || tocEmpty);
    tocToggle.style.display = tocEmpty ? 'none' : '';
  }

  function updateActive() {
    let idx = -1;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top <= 40) idx = i;
      else break;
    }
    const prev = toc.querySelector('.active');
    if (prev) prev.classList.remove('active');
    if (idx >= 0 && toc.children[idx]) {
      const el = toc.children[idx];
      el.classList.add('active');
      if (el.offsetTop < toc.scrollTop || el.offsetTop + el.offsetHeight > toc.scrollTop + toc.clientHeight) {
        toc.scrollTop = el.offsetTop - toc.clientHeight / 2;
      }
    }
  }

  function buildToc() {
    headings = Array.from(content.querySelectorAll('h1,h2,h3,h4'));
    toc.textContent = '';
    tocEmpty = headings.length === 0;
    headings.forEach((h) => {
      const item = document.createElement('div');
      item.className = 'toc-item toc-l' + h.tagName.slice(1);
      item.textContent = h.textContent;
      item.addEventListener('click', () => h.scrollIntoView());
      toc.appendChild(item);
    });
    applyToc();
    updateActive();
  }

  tocToggle.addEventListener('click', () => {
    tocHidden = !tocHidden;
    try { vscode.setState({ tocHidden }); } catch (_) { /* webview no inicializado aún */ }
    applyToc();
  });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateActive(); });
  });

  ns.enhancers.push(buildToc);
})(window.MdPreview);