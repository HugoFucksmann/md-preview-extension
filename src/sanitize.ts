const sanitizeHtml = require('sanitize-html');

/** Etiquetas HTML permitidas en el Preview (todo lo demás se descarta). */
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'blockquote',
  'pre', 'code', 'span', 'div', 'br', 'hr', 'em', 'strong', 'b', 'i', 'u', 's',
  'del', 'ins', 'mark', 'sub', 'sup', 'kbd', 'samp', 'var', 'abbr', 'small',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'img', 'input', 'details', 'summary', 'figure', 'figcaption', 'dl', 'dt', 'dd',
  'section', // notas al pie
];

/** Sanitiza el HTML renderizado: solo etiquetas y atributos permitidos, sin scripts ni estilos. */
export function sanitize(html: string, resolveImage: (src: string) => string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ['class', 'id', 'title', 'align', 'data-line', 'data-m'],
      a: ['href', 'name'],
      img: ['src', 'alt', 'width', 'height'],
      input: ['type', 'checked', 'disabled'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
      ol: ['start'],
      details: ['open'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data', 'vscode-resource', 'vscode-webview-resource'],
    },
    allowProtocolRelative: false,
    transformTags: {
      img: (tagName: string, attribs: Record<string, string>) => {
        if (attribs.src) {
          attribs.src = resolveImage(attribs.src);
        }
        return { tagName, attribs };
      },
    },
  }) as string;
}

/**
 * Las fórmulas se renderizan con KaTeX (HTML con estilos en línea y MathML, que el sanitizado
 * descartaría). Por eso se dejan como marcadores durante el sanitizado y se reinsertan después.
 * El contenido insertado es solo salida de KaTeX con `trust: false`, nunca HTML del documento.
 */
export function restoreMath(html: string, math: string[]): string {
  return html.replace(
    /<(span|div)\b[^>]*\bdata-m="(\d+)"[^>]*><\/\1>/g,
    (_all, _tag: string, i: string) => math[Number(i)] ?? ''
  );
}
