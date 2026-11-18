import * as vscode from 'vscode';

/** Variables CSS de ancho y tamaño de letra, según la configuración. */
export function layoutVars(): Record<string, string> {
  const cfg = vscode.workspace.getConfiguration('mdPreview');
  const size = Number(cfg.get('fontSize', 15));
  const rawWidth = Number(cfg.get('contentWidth', 920));
  const fontSize = Number.isFinite(size) ? Math.min(40, Math.max(10, size)) : 15;
  const width = Number.isFinite(rawWidth) ? rawWidth : 920;
  const full = width <= 0;
  const w = Math.max(300, width);
  return {
    '--md-font-size': `${fontSize}px`,
    '--md-width': full ? 'none' : `${w}px`,
    '--md-layout-width': full ? 'none' : `${w + 280}px`,
  };
}
