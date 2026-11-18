import { restoreMath, sanitize } from './sanitize';

// Se cargan con require para evitar problemas de tipos ESM/CJS.
const MarkdownIt = require('markdown-it');
const taskLists = require('markdown-it-task-lists');
const hljs = require('highlight.js/lib/common');
const katex = require('katex');

/** Los plugins pueden exportar la función directa o bajo `.default`, según ESM/CJS. */
function unwrap(mod: any): any {
  return mod && mod.default ? mod.default : mod;
}
const mathPlugin = unwrap(require('@vscode/markdown-it-katex'));
const footnote = unwrap(require('markdown-it-footnote'));
const emoji = unwrap(require('markdown-it-emoji'));
const deflist = unwrap(require('markdown-it-deflist'));

export type ImageResolver = (src: string) => string;

/** Contexto de un render: resolución de imágenes y fórmulas ya generadas. */
export interface RenderEnv {
  resolveImage: ImageResolver;
  math: string[];
}

/** Renderiza una fórmula con KaTeX y devuelve su índice en `env.math`. */
function stashMath(env: RenderEnv, tex: string, display: boolean): number {
  let html: string;
  try {
    html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    });
  } catch {
    html = `<code>${escapeText(tex)}</code>`;
  }
  return env.math.push(html) - 1;
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Crea la instancia de markdown-it con todos los plugins y reglas propias. */
export function createMarkdown(): any {
  const md: any = new MarkdownIt({
    html: true, // HTML crudo permitido; el resultado se sanitiza en renderDocument()
    linkify: true,
    highlight: (str: string, lang: string): string => {
      if (lang === 'mermaid') {
        return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
      }
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        } catch {
          /* sin resaltado */
        }
      }
      return '';
    },
  })
    .use(taskLists, { enabled: true })
    .use(footnote)
    .use(emoji)
    .use(deflist)
    .use(mathPlugin, { enableFencedBlocks: true });

  // Las fórmulas dejan un marcador; KaTeX se reinserta tras el sanitizado.
  md.renderer.rules.math_inline = (tokens: any, idx: number, _o: any, env: RenderEnv) =>
    `<span class="md-math" data-m="${stashMath(env, tokens[idx].content, false)}"></span>`;
  md.renderer.rules.math_block = (tokens: any, idx: number, _o: any, env: RenderEnv) => {
    const line = tokens[idx].attrGet('data-line');
    const attr = line !== null && line !== undefined ? ` data-line="${line}"` : '';
    return `<div class="md-math"${attr} data-m="${stashMath(env, tokens[idx].content, true)}"></div>\n`;
  };

  // Marca cada bloque con su línea de origen (para sincronizar Source <-> Preview).
  md.core.ruler.push('data_line', (state: any) => {
    for (const t of state.tokens) {
      if (t.map && t.type !== 'inline' && t.nesting >= 0) {
        t.attrSet('data-line', String(t.map[0]));
      }
    }
  });

  // Reescribe src de imágenes relativas a URIs de webview.
  const fallback = (t: any, i: number, o: any, _e: any, self: any) => self.renderToken(t, i, o);
  const defaultImage = md.renderer.rules.image || fallback;
  md.renderer.rules.image = (tokens: any, idx: number, options: any, env: RenderEnv, self: any) => {
    const token = tokens[idx];
    const src = token.attrGet('src');
    if (src && env?.resolveImage) {
      token.attrSet('src', env.resolveImage(src));
    }
    return defaultImage(tokens, idx, options, env, self);
  };

  return md;
}

/** Markdown -> HTML seguro (render, sanitizado y reinserción de fórmulas). */
export function renderDocument(md: any, text: string, resolveImage: ImageResolver): string {
  const env: RenderEnv = { resolveImage, math: [] };
  const safe = sanitize(md.render(text, env) as string, resolveImage);
  return restoreMath(safe, env.math);
}
