// Posición de lectura: restaurarla y avisar a la extensión (sincroniza Source <-> Preview).
(function (ns) {
  const { vscode, content, settings, state, util } = ns;

  function scrollToLine(line) {
    let target = null;
    for (const el of content.querySelectorAll('[data-line]')) {
      if (parseInt(el.dataset.line, 10) <= line) target = el;
      else break;
    }
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - 8);
    else window.scrollTo(0, 0);
  }

  function topLine() {
    let line = 0;
    for (const el of content.querySelectorAll('[data-line]')) {
      if (el.getBoundingClientRect().top <= 10) line = parseInt(el.dataset.line, 10);
      else break;
    }
    return line;
  }

  function restore() {
    if (settings.startLine !== '') scrollToLine(parseInt(settings.startLine, 10));
    else if (settings.startRatio > 0) window.scrollTo(0, settings.startRatio * util.maxScroll());
  }

  let timer;
  window.addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const max = util.maxScroll();
      vscode.postMessage({
        type: 'scroll',
        ratio: max > 0 ? window.scrollY / max : 0,
        line: state.userScrolled ? topLine() : null,
      });
    }, 100);
  });

  window.addEventListener('load', restore);

  ns.position = { restore };
})(window.MdPreview);