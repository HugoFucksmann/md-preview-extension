/** Estado de posición por documento, compartido entre el provider y el comando de alternar. */
export class PositionStore {
  /** Scroll proporcional (0..1) del Preview. */
  readonly scroll = new Map<string, number>();
  /** Línea superior visible en Preview (solo si el usuario hizo scroll ahí). */
  readonly previewLine = new Map<string, number>();
  /** Línea de Source que Preview debe mostrar al abrirse. */
  readonly sourceLine = new Map<string, number>();
}
