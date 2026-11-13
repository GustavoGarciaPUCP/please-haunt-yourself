import { FRAME_ASPECT, canReframe, clampFrame, moveFrame, negativeSize, scaleFrame, type Negative } from './echo-studio';
import type { Box, Size } from './glass-model';
import { drawNegative, fitCanvas } from './glass-render';

export interface FrameEditorHooks {
  /** The frame is moving (preview only). */
  change(frame: Box): void;
  /** The player let go or pressed a key: keep this frame. */
  commit(frame: Box): void;
}

/**
 * The full negative with its photo frame (.kiro/specs/os-case-v4 R4.3). Shared by ECHO's Captures and CANVAS's
 * Reframe…, so both edit a frame the same way: drag it or its corner, or focus it and use the arrow keys (Shift for
 * larger steps) and + / − to resize. The negative itself is never changed here.
 */
export class FrameEditor {
  readonly element: HTMLElement;
  private readonly view: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly box: HTMLElement;
  private readonly events = new AbortController();
  private readonly resize: ResizeObserver;
  private negative: Negative | null = null;
  private frameValue: Box = { x: 0, y: 0, w: 1, h: 1 };
  private editable = false;
  private drag: { pointerId: number; mode: 'move' | 'size'; startX: number; startY: number; start: Box } | null = null;
  private drawnKey = '';
  private key: string | undefined;

  constructor(container: HTMLElement, private readonly hooks: FrameEditorHooks, label = 'Photo frame') {
    this.element = document.createElement('div');
    this.element.className = 'frame-editor';
    this.element.innerHTML = `<div class="negative-view">
        <canvas class="negative-canvas" aria-hidden="true"></canvas>
        <div class="photo-frame" tabindex="0" role="group" aria-roledescription="movable frame" aria-label="${label}. Arrow keys move it, Shift moves further, plus and minus resize it.">
          <span class="photo-frame-label" aria-hidden="true">Picture</span><span class="photo-frame-handle" aria-hidden="true"></span>
        </div>
      </div>`;
    container.append(this.element);
    this.view = this.element.querySelector<HTMLElement>('.negative-view')!;
    this.canvas = this.element.querySelector<HTMLCanvasElement>('.negative-canvas')!;
    this.box = this.element.querySelector<HTMLElement>('.photo-frame')!;
    const options = { signal: this.events.signal };
    this.box.addEventListener('pointerdown', this.down, options);
    this.box.addEventListener('pointermove', this.move, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) this.box.addEventListener(type, this.up, options);
    this.box.addEventListener('keydown', this.keydown, options);
    this.resize = new ResizeObserver(() => this.layout());
    this.resize.observe(this.view);
  }

  get frame(): Box { return { ...this.frameValue }; }
  get focusable(): HTMLElement { return this.box; }

  /**
   * Shows a negative and its frame. Session windows and limited prints are shown whole, without a movable frame.
   * `key` names the negative (its data never changes), so showing the same one again does not redraw it.
   */
  show(negative: Negative, frame: Box, key?: string): void {
    const changedNegative = key === undefined || key !== this.key;
    this.key = key;
    this.negative = negative;
    this.editable = canReframe(negative);
    this.frameValue = this.editable ? clampFrame(frame, negativeSize(negative)) : { ...frame };
    this.element.dataset.kind = negative.kind;
    this.box.tabIndex = this.editable ? 0 : -1;
    this.box.setAttribute('aria-disabled', String(!this.editable));
    const size = this.extent();
    // One value drives both the view's width formula and its shape (visual-precision-v6 R3): a session negative is
    // 1.6, a glass negative has the stage's own aspect. An inline aspect-ratio alone left the width at a fixed 1.9.
    this.view.style.setProperty('--aspect', String(size.w / size.h));
    if (changedNegative) this.drawnKey = '';
    this.layout();
  }

  /** The area the view shows: the whole stage of a glass negative, the window of a session, the crop of a limited print. */
  private extent(): Size {
    const negative = this.negative;
    if (!negative) return { w: 16, h: 10 };
    if (negative.kind === 'limited') return { w: negative.crop.w, h: negative.crop.h };
    return negativeSize(negative);
  }

  private layout(): void {
    const negative = this.negative;
    if (!negative || !fitCanvas(this.canvas)) return;
    const key = `${this.canvas.width}x${this.canvas.height}`;
    if (key !== this.drawnKey) {
      drawNegative(this.canvas.getContext('2d')!, negative, null, this.canvas.width, this.canvas.height);
      this.drawnKey = key;
    }
    this.place();
  }

  /** Redraws the negative (its data never changes, but a new show() may bring a new one). */
  redraw(): void { this.drawnKey = ''; this.layout(); }

  private scale(): number { const width = this.view.clientWidth; return width ? width / this.extent().w : 1; }

  private place(): void {
    const s = this.scale(), f = this.editable ? this.frameValue : { x: 0, y: 0, ...this.extent() };
    Object.assign(this.box.style, { left: `${f.x * s}px`, top: `${f.y * s}px`, width: `${f.w * s}px`, height: `${f.h * s}px` });
  }

  private set(frame: Box, commit: boolean): void {
    if (!this.negative) return;
    this.frameValue = clampFrame(frame, negativeSize(this.negative));
    this.place();
    if (commit) this.hooks.commit(this.frame); else this.hooks.change(this.frame);
  }

  private down = (event: PointerEvent): void => {
    if (!this.editable || this.drag || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    this.box.focus({ preventScroll: true });
    const mode = (event.target as Element).closest('.photo-frame-handle') ? 'size' : 'move';
    this.drag = { pointerId: event.pointerId, mode, startX: event.clientX, startY: event.clientY, start: this.frame };
    try { this.box.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers cannot be captured. */ }
    this.element.classList.add('is-dragging');
  };
  private move = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId || !this.negative) return;
    const s = this.scale(), dx = (event.clientX - drag.startX) / s, dy = (event.clientY - drag.startY) / s;
    if (drag.mode === 'move') this.set({ ...drag.start, x: drag.start.x + dx, y: drag.start.y + dy }, false);
    else {
      // The corner follows the pointer; the opposite corner stays put; the aspect never changes.
      const w = Math.max(dx + drag.start.w, (dy + drag.start.h) * FRAME_ASPECT);
      this.set({ x: drag.start.x, y: drag.start.y, w, h: w / FRAME_ASPECT }, false);
    }
  };
  private up = (event: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag = null;
    this.element.classList.remove('is-dragging');
    try { if (this.box.hasPointerCapture(event.pointerId)) this.box.releasePointerCapture(event.pointerId); } catch { /* Already released. */ }
    this.hooks.commit(this.frame);
  };

  private keydown = (event: KeyboardEvent): void => {
    if (!this.editable || !this.negative) return;
    const size = negativeSize(this.negative), step = size.w * (event.shiftKey ? 0.08 : 0.02);
    let next: Box | null = null;
    switch (event.key) {
      case 'ArrowLeft': next = moveFrame(this.frameValue, -step, 0, size); break;
      case 'ArrowRight': next = moveFrame(this.frameValue, step, 0, size); break;
      case 'ArrowUp': next = moveFrame(this.frameValue, 0, -step, size); break;
      case 'ArrowDown': next = moveFrame(this.frameValue, 0, step, size); break;
      case '+': case '=': case 'PageUp': next = scaleFrame(this.frameValue, event.shiftKey ? 1.25 : 1.08, size); break;
      case '-': case '_': case 'PageDown': next = scaleFrame(this.frameValue, event.shiftKey ? 0.8 : 1 / 1.08, size); break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.set(next, true);
  };

  dispose(): void { this.events.abort(); this.resize.disconnect(); this.element.remove(); }
}
