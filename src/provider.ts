import * as path from 'path';
import * as vscode from 'vscode';
import { buildHtml } from './html';
import { layoutVars } from './layout';
import { createMarkdown, renderDocument } from './markdown';
import { PositionStore } from './positions';
import { taskBoxColumn } from './tasks';

export class MdPreviewProvider implements vscode.CustomTextEditorProvider {
  private readonly md = createMarkdown();

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly positions: PositionStore
  ) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel
  ): Promise<void> {
    const docDir = vscode.Uri.joinPath(document.uri, '..');
    const key = document.uri.toString();
    const webview = panel.webview;

    const startLine = this.positions.sourceLine.get(key);
    this.positions.sourceLine.delete(key);
    this.positions.previewLine.delete(key);

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.ctx.extensionUri, 'media'),
        docDir,
        ...(vscode.workspace.workspaceFolders ?? []).map((f) => f.uri),
      ],
    };

    const resolveImage = (src: string): string => {
      if (/^(https?:|data:)/i.test(src)) {
        return src;
      }
      let p = src;
      try {
        p = decodeURIComponent(src);
      } catch {
        /* se usa tal cual */
      }
      const uri = path.isAbsolute(p) ? vscode.Uri.file(p) : vscode.Uri.joinPath(docDir, p);
      return webview.asWebviewUri(uri).toString();
    };

    const render = () => renderDocument(this.md, document.getText(), resolveImage);

    webview.html = buildHtml(webview, this.ctx.extensionUri, {
      body: render(),
      scroll: this.positions.scroll.get(key) ?? 0,
      startLine,
    });

    let timer: NodeJS.Timeout | undefined;
    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== key) {
        return;
      }
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => webview.postMessage({ type: 'update', html: render() }), 150);
    });

    const msgSub = webview.onDidReceiveMessage(async (m) => {
      switch (m.type) {
        case 'scroll':
          if (typeof m.ratio === 'number') {
            this.positions.scroll.set(key, m.ratio);
          }
          if (typeof m.line === 'number') {
            this.positions.previewLine.set(key, m.line);
          }
          break;
        case 'link':
          await this.openLink(document, String(m.href));
          break;
        case 'copy':
          await vscode.env.clipboard.writeText(String(m.text ?? ''));
          break;
        case 'toggle': {
          const ok = await this.toggleTask(document, Number(m.line), Boolean(m.checked));
          if (!ok) {
            // No se pudo aplicar: se resincroniza la vista con el documento.
            webview.postMessage({ type: 'update', html: render() });
          }
          break;
        }
      }
    });

    const cfgSub = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('mdPreview')) {
        webview.postMessage({ type: 'config', vars: layoutVars() });
      }
    });

    panel.onDidDispose(() => {
      if (timer) {
        clearTimeout(timer);
      }
      changeSub.dispose();
      msgSub.dispose();
      cfgSub.dispose();
    });
  }

  /** Marca/desmarca el checkbox `- [ ]` de la línea indicada. */
  private async toggleTask(
    document: vscode.TextDocument,
    line: number,
    checked: boolean
  ): Promise<boolean> {
    if (!Number.isInteger(line) || line < 0 || line >= document.lineCount) {
      return false;
    }
    const col = taskBoxColumn(document.lineAt(line).text);
    if (col < 0) {
      return false;
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(line, col, line, col + 1), checked ? 'x' : ' ');
    return vscode.workspace.applyEdit(edit);
  }

  private async openLink(document: vscode.TextDocument, href: string): Promise<void> {
    if (/^(https?:|mailto:)/i.test(href)) {
      await vscode.env.openExternal(vscode.Uri.parse(href));
      return;
    }
    const filePart = href.split('#')[0];
    if (!filePart) {
      return;
    }
    let p = filePart;
    try {
      p = decodeURIComponent(filePart);
    } catch {
      /* se usa tal cual */
    }
    const target = path.isAbsolute(p)
      ? vscode.Uri.file(p)
      : vscode.Uri.joinPath(document.uri, '..', p);
    await vscode.commands.executeCommand('vscode.open', target);
  }
}
