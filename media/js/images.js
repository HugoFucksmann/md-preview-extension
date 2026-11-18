// Imágenes ampliables: clic para verlas a pantalla completa con zoom y pan.
(function (ns) {
  const { content } = ns;
  let viewer = null;

  function close() {
    if (viewer) {
      viewer.remove();
      viewer = null;
    }
  }

  /** Estado inicial: la imagen entera, centrada (sin agrandar más allá de su tamaño real). */
  function fit(host, img) {
    const hw = host.clientWidth;
    const hh = host.clientHeight;
    const iw = img.naturalWidth || 300;
    const ih = img.naturalHeight || 200;
    const s = Math.min(1, (hw * 0.94) / iw, (hh * 0.94) / ih);
    return { x: (hw - iw * s) / 2, y: (hh - ih * s) / 2, s };
  }

  function open(src, alt) {
    close();
    const host = document.createElement('div');
    host.className = 'img-viewer';
    const img = document.createElement('img');
    img.alt = alt || '';
    img.src = src;
    host.appendChild(img);

    const api = ns.zoom.attach(host, img, {
      wheelZoom: () => true,
      initial: () => fit(host, img),
    });
    ns.zoom.addControls(host, api, [ns.zoom.button('\u2715', 'Cerrar (Esc)', close)]);
    document.body.appendChild(host);
    viewer = host;

    const show = () => { api.reset(); img.style.visibility = 'visible'; };
    if (img.complete && img.naturalWidth) show();
    else img.addEventListener('load', show, { once: true });
  }

  content.addEventListener('click', (e) => {
    const el = e.target;
    // Las imágenes dentro de enlaces (badges, etc.) conservan su comportamiento
    if (!(el instanceof HTMLImageElement) || el.closest('a')) return;
    // Imagen rota (sin dimensiones): no hay nada que ampliar. Los SVG sin tamaño propio sí se abren.
    if (el.complete && el.naturalWidth === 0 && !/\.svg([?#]|$)/i.test(el.src)) return;
    open(el.currentSrc || el.src, el.alt);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewer) close();
  });
})(window.MdPreview);