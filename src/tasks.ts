// Lógica pura (sin vscode) para poder testearla en la Fase 5.

const TASK_RE = /^((?:\s*>)*\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/;

/** Columna del carácter dentro de `[ ]` en una línea de tarea, o -1 si no es una tarea. */
export function taskBoxColumn(lineText: string): number {
  const m = TASK_RE.exec(lineText);
  return m ? m[1].length : -1;
}
