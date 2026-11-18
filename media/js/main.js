// Punto de entrada: render, mensajes con la extensión, enlaces y checkboxes.
// Los demás módulos ya se registraron en window.MdPreview.
(function (ns) {
  const { vscode, content, util } = ns;

  /**
   * Ejecuta las mejoras registradas, cada una aislada: si una falla se informa y las demás siguen.
   * Resuelve true si algún módulo cambió la altura del documento (p. ej. Mermaid).
   */
  function enhance() {
    const results = ns.enhancers.map((fn) => {
      try {
        return Promise.resolve(fn()).catch((e) => { ns.report('mejora', e); return false; });
      } catch (e) {
        ns.report('mejora', e);
        return Promise.resolve(false);
      }
    });
    return Promise.all(results).then((r) => r.some(Boolean));
  }

  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d) return;
    if (d.type === 'update') {
      content.innerHTML = d.html;
      enhance();
      if (ns.find && ns.find.isOpen()) ns.find.rerun();
    } else if (d.type === 'config' && d.vars) {
      for (const k of Object.keys(d.vars)) {
        document.documentElement.style.setProperty(k, d.vars[k]);
      }
    }
  });

  // Checkboxes de tareas: se informa a la extensión qué línea cambió
  content.addEventListener('change', (e) => {
    const input = e.target;
    if (!input.matches || !input.matches('input.task-list-item-checkbox')) return;
    const li = input.closest('li');
    if (!li || li.dataset.line === undefined) return;
    vscode.postMessage({
      type: 'toggle',
      line: parseInt(li.dataset.line, 10),
      checked: input.checked,
    });
  });

  /** Destino de un ancla local: primero por id (notas al pie), luego por título. */
  function findAnchor(raw) {
    let id = raw;
    try { id = decodeURIComponent(raw); } catch (_) { /* tal cual */ }
    const byId = Array.from(content.querySelectorAll('[id]')).find((el) => el.id === id);
    if (byId) return byId;
    const want = id.toLowerCase();
    return Array.from(content.querySelectorAll('h1,h2,h3,h4,h5,h6'))
      .find((h) => util.slug(h.textContent || '') === want) || null;
  }

  // Enlaces: anclas locales acá; el resto lo abre la extensión
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    e.preventDefault();
    if (href.startsWith('#')) {
      const target = href.length > 1 ? findAnchor(href.slice(1)) : null;
      if (target) target.scrollIntoView();
      else if (href === '#') window.scrollTo(0, 0);
      return;
    }
    vscode.postMessage({ type: 'link', href });
  });

  // Inicio
  enhance().then((hadHeightChange) => {
    if (hadHeightChange && !ns.state.userScrolled) ns.position.restore();
  });
  vscode.postMessage({ type: 'log', level: 'info', text: 'webview lista (' + ns.enhancers.length + ' mejoras)' });
})(window.MdPreview);
