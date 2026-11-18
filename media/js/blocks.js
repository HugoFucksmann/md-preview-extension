// Mejoras de bloques: callouts estilo GitHub y bloques de código (etiqueta + copiar).
(function (ns) {
  const { vscode, content } = ns;

  const ALERT_TITLES = {
    note: 'Nota', tip: 'Consejo', important: 'Importante',
    warning: 'Advertencia', caution: 'Precaución',
  };

  function styleCallouts() {
    content.querySelectorAll('blockquote').forEach((bq) => {
      const p = bq.querySelector(':scope > p');
      if (!p) return;
      const m = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*/i.exec(p.innerHTML);
      if (!m) return;
      const kind = m[1].toLowerCase();
      p.innerHTML = p.innerHTML.slice(m[0].length);
      bq.classList.add('alert', 'alert-' + kind);
      const title = document.createElement('div');
      title.className = 'alert-title';
      title.textContent = ALERT_TITLES[kind];
      bq.insertBefore(title, bq.firstChild);
      if (!p.innerHTML.trim()) p.remove();
    });
  }

  function addCopyButtons() {
    content.querySelectorAll('pre:not(.mermaid)').forEach((pre) => {
      if (pre.parentElement.classList.contains('code-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      const codeEl = pre.querySelector('code');
      const lm = codeEl && /language-([\w+#-]+)/.exec(codeEl.className);
      if (lm) {
        const tag = document.createElement('span');
        tag.className = 'lang-tag';
        tag.textContent = lm[1];
        wrap.appendChild(tag);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copiar';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code') || pre;
        vscode.postMessage({ type: 'copy', text: code.textContent.replace(/\n$/, '') });
        btn.textContent = 'Copiado';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 1200);
      });
      wrap.appendChild(btn);
    });
  }

  ns.enhancers.push(styleCallouts, addCopyButtons);
})(window.MdPreview);