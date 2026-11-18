import * as vscode from 'vscode';
import { VIEW_TYPE } from './constants';
import { PositionStore } from './positions';
import { MdPreviewProvider } from './provider';
import { toggle } from './switcher';

export function activate(ctx: vscode.ExtensionContext): void {
  const positions = new PositionStore();
  const provider = new MdPreviewProvider(ctx, positions);
  const run = () => toggle(positions);

  ctx.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
      supportsMultipleEditorsPerDocument: true,
    }),
    vscode.commands.registerCommand('mdPreview.toggle', run),
    vscode.commands.registerCommand('mdPreview.showSource', run),
    vscode.commands.registerCommand('mdPreview.showPreview', run)
  );
}

export function deactivate(): void { }