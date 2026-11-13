import { drawGlass } from './glass-render';
import type { GlassSurface, Point, Size } from './glass-model';
import { onReducedMotionChange, prefersReducedMotion } from './ghost-writing';

/** The milestone reveal: about two seconds, once per case. */
export const REVEAL_MS = 2000;
/** The final release: the print fills with mist, the figure fades, the mist clears. About 1.4 seconds. */
export const RELEASE_MS = 1400;

export interface GlassHooks {
  /** A pointer wipe finished: a good moment to save. */
  wipeEnded(): void;
  /** The reveal was seen (or skipped): save, so a reload shows the settled glass instead of replaying it. */
  revealSeen(): void;
}

/**
 * The desktop surface behind every window (.kiro/specs/os-case-v4 design §2). It paints the wallpaper and the shared
 * GlassSurface, and accepts wipes only where the pointer lands on bare glass: windows, files and menus sit above it and
 * keep their own input. Presentations (reveal, release) only show states the model already committed.
 */
export class GlassView {
  readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly events = new AbortController();
  private readonly drawListeners = new Set<() => void>();
  private size: Size = { w: 1, h: 1 };
  private revealStart: number | null = null;
  private progress = 1;
  private releaseStart: number | null = null;
  private releaseProgress: number;
  private wiping: { pointerId: number; last: Point } | null = null;
  private frame = 0;

  constructor(private readonly stage: HTMLElement, private readonly surface: GlassSurface, private readonly hooks: GlassHooks) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'desktop-glass';
    this.canvas.setAttribute('aria-hidden', 'true');
    stage.prepend(this.canvas);
    this.context = this.canvas.getContext('2d')!;
    this.releaseProgress = surface.released ? 1 : 0;
    const options = { signal: this.events.signal };
    this.canvas.addEventListener('pointerdown', this.down, options);
    this.canvas.addEventListener('pointermove', this.move, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) this.canvas.addEventListener(type, this.up, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.settle(); }, options);
    onReducedMotionChange(() => { if (prefersReducedMotion()) this.settle(); }, this.events.signal);
    const observer = new ResizeObserver(() => this.resize());
    observer.observe(stage);
    this.events.signal.addEventListener('abort', () => observer.disconnect());
    surface.subscribe(change => {
      if (change === 'reset') { this.revealStart = null; this.progress = 1; this.releaseStart = null; this.releaseProgress = 0; }
      // A freshly pressed impression stays unseen until its reveal starts, so it never flashes in fully formed.
      if (change === 'place') this.progress = 0;
      if (change === 'restore') this.releaseProgress = surface.released ? 1 : 0;
      // TERMINAL shows the delivered letter first; then the hand lets go.
      if (change === 'release') this.startRelease(450);
      this.mark();
      this.draw();
    });
    this.mark();
    this.resize();
  }

  get stageSize(): Size { return { ...this.size }; }
  /** Reveal progress for anything that mirrors the glass (ECHO's monitor). 1 when settled. */
  get reveal(): number { return this.progress; }
  /** Release progress (0 pressed, 1 released). */
  get release(): number { return this.releaseProgress; }
  get revealing(): boolean { return this.revealStart !== null; }
  get releasing(): boolean { return this.releaseStart !== null; }
  get wipingNow(): boolean { return this.wiping !== null; }

  onDraw(listener: () => void): () => void { this.drawListeners.add(listener); return () => this.drawListeners.delete(listener); }

  private mark(): void {
    const placement = this.surface.placement;
    this.canvas.classList.toggle('has-mist', placement !== null && !this.surface.released);
    this.canvas.dataset.glass = this.surface.released ? 'released' : placement ? 'impressed' : 'clear';
    // Where the hand is pressed (normalized), for checks that frame it the way a person would.
    if (placement) this.canvas.dataset.hand = `${placement.hand.u.toFixed(4)},${placement.hand.v.toFixed(4)}`;
    else delete this.canvas.dataset.hand;
  }

  /**
   * Plays the milestone reveal once, optionally after `delayMs` so it follows TERMINAL's own cue (the figure reaching
   * the glass). Reduced motion, a hidden page or an earlier viewing land on the static state at once.
   */
  startReveal(delayMs = 0): void {
    if (this.surface.revealSeen || prefersReducedMotion() || document.hidden) { this.finishReveal(); return; }
    this.revealStart = performance.now() + Math.max(0, delayMs);
    this.progress = 0;
    this.canvas.dataset.reveal = delayMs > 0 ? 'waiting' : 'playing';
    this.loop();
  }

  /** Skipping or interrupting the presentation keeps every mark: only the animation ends. */
  finishReveal(): void {
    const wasPlaying = this.revealStart !== null, firstTime = this.surface.placement !== null && !this.surface.revealSeen;
    this.revealStart = null;
    this.progress = 1;
    if (firstTime) { this.surface.markRevealSeen(); this.hooks.revealSeen(); }
    delete this.canvas.dataset.reveal;
    if (wasPlaying) this.draw();
  }

  /** The release presents the accepted delivery; the model is already released when this starts. */
  private startRelease(delayMs = 0): void {
    this.finishReveal();
    if (prefersReducedMotion() || document.hidden) { this.releaseProgress = 1; this.releaseStart = null; return; }
    this.releaseStart = performance.now() + delayMs;
    this.releaseProgress = 0;
    this.canvas.dataset.release = 'playing';
    this.loop();
  }
  private finishRelease(): void {
    const was = this.releaseStart !== null;
    this.releaseStart = null;
    this.releaseProgress = this.surface.released ? 1 : 0;
    delete this.canvas.dataset.release;
    if (was) this.draw();
  }

  /** Ends any presentation at its final state. */
  settle(): void { this.finishReveal(); this.finishRelease(); }

  private loop(): void {
    if (this.frame) return;
    const tick = () => {
      this.frame = 0;
      const now = performance.now();
      let again = false, dirty = false;
      if (this.revealStart !== null) {
        const t = (now - this.revealStart) / REVEAL_MS;
        if (t >= 1) this.finishReveal();
        else { again = true; if (t > 0) { this.progress = t; this.canvas.dataset.reveal = 'playing'; dirty = true; } }
      }
      if (this.releaseStart !== null) {
        const r = (now - this.releaseStart) / RELEASE_MS;
        if (r >= 1) this.finishRelease();
        else { again = true; if (r > 0) { this.releaseProgress = r; dirty = true; } }
      }
      if (dirty) this.draw();
      if (again) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private resize(): void {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.size = { w, h };
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.draw();
  }

  /** Draws now (wipes must answer on the same frame as the pointer). */
  draw(): void {
    drawGlass(this.context, { stage: this.size, placement: this.surface.placement, field: this.surface.field, writing: this.surface.writing },
      { x: 0, y: 0, w: this.size.w, h: this.size.h }, this.canvas.width, this.canvas.height,
      { reveal: this.progress, release: this.surface.released ? this.releaseProgress : 0 });
    this.drawListeners.forEach(listener => listener());
  }

  /** Stage coordinates of a pointer event (the canvas covers the stage exactly). */
  toStage(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private down = (event: PointerEvent): void => {
    if (event.button !== 0 || !event.isPrimary || !this.surface.placement || this.surface.released || this.wiping) return;
    event.preventDefault();
    this.finishReveal();
    const point = this.toStage(event);
    this.wiping = { pointerId: event.pointerId, last: point };
    try { this.canvas.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers cannot be captured. */ }
    this.surface.wipe(point, point, this.size);
  };

  private move = (event: PointerEvent): void => {
    const wiping = this.wiping;
    if (!wiping || event.pointerId !== wiping.pointerId) return;
    const point = this.toStage(event);
    this.surface.wipe(wiping.last, point, this.size);
    wiping.last = point;
  };

  private up = (event: PointerEvent): void => {
    const wiping = this.wiping;
    if (!wiping || event.pointerId !== wiping.pointerId) return;
    this.wiping = null;
    try { if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId); } catch { /* Already released. */ }
    this.hooks.wipeEnded();
  };

  dispose(): void { this.events.abort(); cancelAnimationFrame(this.frame); this.canvas.remove(); }
}
