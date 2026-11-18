// Zoom y pan reutilizables (diagramas Mermaid e imágenes ampliadas).
(function (ns) {
  const MIN = 0.2;
  const MAX = 10;

  /**
   * Habilita zoom/pan sobre `target` dentro de `host`.
   * opts.initial(): estado inicial {x, y, s}.  opts.wheelZoom(): ¿la rueda sola hace zoom?
   */
  function attach(host, target, opts) {
    opts = opts || {};
    const initial = opts.initial || (() => ({ x: 0, y: 0, s: 1 }));
    const wheelZoom = opts.wheelZoom || (() => false);
    const st = { x: 0, y: 0, s: 1 };
    target.style.transformOrigin = '0 0';

    const apply = () => {
      target.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px) scale(' + st.s + ')';
    };
    const reset = () => { Object.assign(st, initial()); apply(); };
    const zoomAt = (px, py, factor) => {
      const s2 = Math.min(MAX, Math.max(MIN, st.s * factor));
      const k = s2 / st.s;
      st.x = px - (px - st.x) * k;
      st.y = py - (py - st.y) * k;
      st.s = s2;
      apply();
    };
    const zoomCenter = (factor) => {
      const r = host.getBoundingClientRect();
      zoomAt(r.width / 2, r.height / 2, factor);
    };

    // arrastrar para mover
    let dragging = false, sx = 0, sy = 0;
    host.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.mz-controls')) return;
      dragging = true;
      sx = e.clientX - st.x;
      sy = e.clientY - st.y;
      host.setPointerCapture(e.pointerId);
      host.classList.add('grabbing');
    });
    host.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      st.x = e.clientX - sx;
      st.y = e.clientY - sy;
      apply();
    });
    const end = () => { dragging = false; host.classList.remove('grabbing'); };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);

    // Ctrl + rueda (o pellizco) para zoom; o rueda sola si wheelZoom() lo indica
    host.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey) && !wheelZoom()) return;
      e.preventDefault();
      const r = host.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });

    reset();
    return { reset, zoomIn: () => zoomCenter(1.25), zoomOut: () => zoomCenter(1 / 1.25) };
  }

  function button(label, title, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }

  /** Barra +, −, 1:1 más los botones extra indicados. */
  function addControls(host, api, extras) {
    const bar = document.createElement('div');
    bar.className = 'mz-controls';
    bar.appendChild(button('+', 'Acercar', api.zoomIn));
    bar.appendChild(button('\u2212', 'Alejar', api.zoomOut));
    bar.appendChild(button('1:1', 'Restablecer', api.reset));
    (extras || []).forEach((b) => bar.appendChild(b));
    host.appendChild(bar);
    return bar;
  }

  ns.zoom = { attach, button, addControls };
})(window.MdPreview);