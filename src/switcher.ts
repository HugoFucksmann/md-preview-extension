import * as vscode from 'vscode';
import { VIEW_TYPE } from './constants';
import { PositionStore } from './positions';

/** Línea de Source a mostrar en Preview: el cursor si está visible, si no la primera línea visible. */
function currentLine(editor: vscode.TextEditor): number {
  const cursor = editor.selection.active.line;
  const vis = editor.visibleRanges[0];
  if (!vis) {
    return cursor;
  }
  return cursor >= vis.start.line && cursor <= vis.end.line ? cursor : vis.start.line;
}

/** Espera a que el editor de texto de `key` pase a ser el activo. */
function nextTextEditor(key: string, timeoutMs = 2000): Promise<vscode.TextEditor | undefined> {
  return new Promise((resolve) => {
    const sub = vscode.window.onDidChangeActiveTextEditor((e) => {
      if (e && e.document.uri.toString() === key) {
        clearTimeout(timer);
        sub.dispose();
        resolve(e);
      }
    });
    const timer = setTimeout(() => {
      sub.dispose();
      resolve(undefined);
    }, timeoutMs);
  });
}

/** Cambia el tipo de editor en la misma pestaña (con fallback manual). */
async function switchEditor(tab: vscode.Tab | undefined): Promise<void> {
  try {
    await vscode.commands.executeCommand('workbench.action.toggleEditorType');
    return;
  } catch {
    /* fallback abajo */
  }
  const input = tab?.input;
  if (!tab) {
    return;
  }
  if (input instanceof vscode.TabInputCustom && input.viewType === VIEW_TYPE) {
    await vscode.commands.executeCommand('vscode.openWith', input.uri, 'default');
    await vscode.window.tabGroups.close(tab);
  } else if (input instanceof vscode.TabInputText) {
    await vscode.commands.executeCommand('vscode.openWith', input.uri, VIEW_TYPE);
    await vscode.window.tabGroups.close(tab);
  }
}

/** Alterna entre Preview y Source sincronizando la posición. */
export async function toggle(positions: PositionStore): Promise<void> {
  const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
  const input = tab?.input;

  if (input instanceof vscode.TabInputCustom && input.viewType === VIEW_TYPE) {
    // Preview -> Source
    const key = input.uri.toString();
    const line = positions.previewLine.get(key);
    const editorPromise = nextTextEditor(key);
    await switchEditor(tab);
    if (line !== undefined) {
      const editor = await editorPromise;
      if (editor) {
        const pos = new vscode.Position(Math.min(line, editor.document.lineCount - 1), 0);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.AtTop);
      }
    }
    return;
  }

  if (input instanceof vscode.TabInputText) {
    // Source -> Preview
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === input.uri.toString()) {
      positions.sourceLine.set(input.uri.toString(), currentLine(editor));
    }
  }
  await switchEditor(tab);
}
