// Copia los assets de terceros a media/ para que la webview los cargue localmente:
// mermaid.min.js y KaTeX (CSS + fuentes woff2).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const media = path.join(root, 'media');

function must(p) {
  if (!fs.existsSync(p)) {
    console.error('No se encontró ' + p + '. Ejecutá "npm install".');
    process.exit(1);
  }
  return p;
}

// Mermaid
fs.copyFileSync(
  must(path.join(root, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js')),
  path.join(media, 'mermaid.min.js')
);
console.log('mermaid.min.js copiado a media/');

// KaTeX: el CSS referencia fonts/*.woff2 de forma relativa; se mantiene esa estructura.
const katexDist = must(path.join(root, 'node_modules', 'katex', 'dist'));
const katexOut = path.join(media, 'katex');
fs.mkdirSync(path.join(katexOut, 'fonts'), { recursive: true });
fs.copyFileSync(
  must(path.join(katexDist, 'katex.min.css')),
  path.join(katexOut, 'katex.min.css')
);
let fonts = 0;
for (const f of fs.readdirSync(path.join(katexDist, 'fonts'))) {
  if (f.endsWith('.woff2')) {
    fs.copyFileSync(path.join(katexDist, 'fonts', f), path.join(katexOut, 'fonts', f));
    fonts++;
  }
}
console.log('KaTeX copiado a media/katex/ (' + fonts + ' fuentes)');