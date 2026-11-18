import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { layoutVars } from './layout';

/** Scripts de la webview, en orden de carga (comparten el espacio `window.MdPreview`). */
const SCRIPTS = [
  'js/core.js',
  'js/zoom.js',
  'js/blocks.js',
  'js/toc.js',
  'js/mermaid.js',
  'js/images.js',
  'js/find.js',
  'js/position.js',
  'js/main.js',
];

const STYLES = ['preview.css', 'katex/katex.min.css', 'extras.css'];

export interface HtmlOptions {
  body: string;
  scroll: number;
  startLine: number | undefined;
}

export function buildHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  opts: HtmlOptions
): string {
  const media = (f: string) => webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', f));
  const nonce = crypto.randomBytes(16).toString('hex');
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} https: data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `font-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');
  const cssVars = Object.entries(layoutVars())
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  const styles = STYLES.map((f) => `<link rel="stylesheet" href="${media(f)}">`).join('\n');
  const scripts = SCRIPTS.map((f) => `<script nonce="${nonce}" src="${media(f)}"></script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${styles}
<style>:root{${cssVars}}</style>
</head>
<body data-scroll="${opts.scroll}" data-start-line="${opts.startLine ?? ''}" data-mermaid="${media('mermaid.min.js')}">
<button id="toc-toggle" type="button" title="Mostrar/ocultar índice">☰</button>
<div id="layout">
<article id="content">${opts.body}</article>
<nav id="toc"></nav>
</div>
${scripts}
</body>
</html>`;
}
