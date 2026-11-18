// Espacio común de la webview: API de VS Code, referencias al DOM, utilidades y reporte de errores.
// Los demás módulos cuelgan de window.MdPreview. Se empaquetan en media/preview.js (ver scripts/build-webview.js).
(function () {
  const ns = (window.MdPreview = window.MdPreview || {});

  ns.vscode = acquireVsCodeApi();
  ns.nonce = document.currentScript.nonce;
  ns.content = document.getElementById('content');
  ns.layout = document.getElementById('layout');
  ns.settings = {
    mermaidSrc: document.body.dataset.mermaid,
    startLine: document.body.dataset.startLine,
    startRatio: parseFloat(document.body.dataset.scroll || '0'),
  };
  ns.state = { userScrolled: false };

  /** Funciones que se ejecutan tras cada render; pueden devolver una Promise<boolean>. */
  ns.enhancers = [];

  ns.util = {
    slug(text) {
      return text.toLowerCase().trim().replace(/[^\p{L}\p{N}\- ]+/gu, '').replace(/\s+/g, '-');
    },
    maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    },
  };

  // ---------- errores: se registran en Output ▸ "MD Preview" y se avisa con un cartel ----------
  let banner = null;
  ns.report = function (where, err) {
    const text = where + ': ' + ((err && (err.stack || err.message)) || String(err));
    try { ns.vscode.postMessage({ type: 'log', level: 'error', text }); } catch (_) { /* sin canal */ }
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'md-error';
      banner.textContent = '\u26A0 Error en la vista previa. Detalle en Output \u25B8 \u00ABMD Preview\u00BB (clic para cerrar)';
      banner.addEventListener('click', () => { banner.remove(); banner = null; });
      document.body.appendChild(banner);
    }
  };
  window.addEventListener('error', (e) => ns.report('error', e.error || e.message));
  window.addEventListener('unhandledrejection', (e) => ns.report('promesa', e.reason));

  // Distingue el scroll del usuario del scroll programático (restauración de posición).
  ['wheel', 'keydown', 'touchmove', 'mousedown'].forEach((ev) =>
    window.addEventListener(ev, () => { ns.state.userScrolled = true; }, { passive: true })
  );
})();