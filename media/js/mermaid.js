// Diagramas Mermaid: carga diferida, tema propio (sigue al tema de VS Code) y zoom/pan/pantalla completa.
(function (ns) {
  const { content } = ns;

  const LIGHT = {
    primaryColor: '#dbeafe', primaryBorderColor: '#2563eb', primaryTextColor: '#1e293b',
    secondaryColor: '#ffedd5', secondaryBorderColor: '#ea580c', secondaryTextColor: '#1e293b',
    tertiaryColor: '#e2e8f0', tertiaryBorderColor: '#64748b', tertiaryTextColor: '#1e293b',
    lineColor: '#64748b', textColor: '#1e293b',
    noteBkgColor: '#fef3c7', noteTextColor: '#1e293b', noteBorderColor: '#d97706',
    clusterBkg: '#f1f5f9', clusterBorder: '#94a3b8', edgeLabelBackground: '#ffffff',
  };
  const DARK = {
    primaryColor: '#1e3a5f', primaryBorderColor: '#4fa6ff', primaryTextColor: '#e6edf3',
    secondaryColor: '#4a2f12', secondaryBorderColor: '#ff9a3c', secondaryTextColor: '#e6edf3',
    tertiaryColor: '#243041', tertiaryBorderColor: '#6b7a90', tertiaryTextColor: '#e6edf3',
    lineColor: '#9aa5b1', textColor: '#e6edf3',
    noteBkgColor: '#3b3010', noteTextColor: '#e6edf3', noteBorderColor: '#e8c46a',
    clusterBkg: '#1b2430', clusterBorder: '#4b5563', edgeLabelBackground: '#1f2937',
  };

  function isDark() {
    const b = document.body.classList;
    return b.contains('vscode-dark') ||
      (b.contains('vscode-high-contrast') && !b.contains('vscode-high-contrast-light'));
  }

  let appliedDark = null;
  function configure(m) {
    appliedDark = isDark();
    m.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: appliedDark ? DARK : LIGHT,
      securityLevel: 'strict',
    });
  }

  let mermaidPromise;
  function loadMermaid() {
    if (window.mermaid) return Promise.resolve(window.mermaid);
    if (!mermaidPromise) {
      mermaidPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = ns.settings.mermaidSrc;
        s.nonce = ns.nonce;
        s.onload = () => { configure(window.mermaid); resolve(window.mermaid); };
        s.onerror = () => {
          mermaidPromise = null; // permite reintentar en el próximo render
          reject(new Error('No se pudo cargar mermaid.min.js (' + ns.settings.mermaidSrc + ')'));
        };
        document.head.appendChild(s);
      });
    }
    return mermaidPromise;
  }

  function enableZoom(pre) {
    if (pre.dataset.zoom) return;
    const svg = pre.querySelector('svg');
    if (!svg) return;
    pre.dataset.zoom = '1';
    pre.classList.add('zoomable');

    const api = ns.zoom.attach(pre, svg, {
      wheelZoom: () => pre.classList.contains('mermaid-full'),
    });
    const full = ns.zoom.button('\u2922', 'Pantalla completa (Esc para salir)', () => {
      const on = pre.classList.toggle('mermaid-full');
      full.textContent = on ? '\u2715' : '\u2922';
      api.reset();
    });
    ns.zoom.addControls(pre, api, [full]);
  }

  async function renderMermaid() {
    const nodes = Array.from(content.querySelectorAll('pre.mermaid:not([data-processed])'));
    if (!nodes.length) return false;
    // Se guarda el código fuente para poder volver a dibujar (cambio de tema).
    nodes.forEach((n) => { if (n.dataset.src === undefined) n.dataset.src = n.textContent; });
    try {
      const m = await loadMermaid();
      await m.run({ nodes, suppressErrors: true });
    } catch (e) {
      ns.report('mermaid', e); // el código fuente queda visible
    }
    content.querySelectorAll('pre.mermaid[data-processed]').forEach(enableZoom);
    return true;
  }

  // Si cambia el tema de VS Code, se redibujan los diagramas con la paleta correspondiente.
  new MutationObserver(() => {
    if (!window.mermaid || appliedDark === isDark()) return;
    configure(window.mermaid);
    content.querySelectorAll('pre.mermaid[data-processed]').forEach((pre) => {
      const fresh = document.createElement('pre');
      fresh.className = 'mermaid';
      fresh.dataset.src = pre.dataset.src || '';
      fresh.textContent = pre.dataset.src || '';
      pre.replaceWith(fresh);
    });
    renderMermaid();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Esc cierra la pantalla completa (el último botón de la barra es el de pantalla completa)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const f = content.querySelector('pre.mermaid-full');
    const btn = f && f.querySelector('.mz-controls button:last-child');
    if (btn) btn.click();
  });

  ns.enhancers.push(renderMermaid);
})(window.MdPreview);