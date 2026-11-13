import { EDGES, moveBounds, resizeBounds, restoreUnderPointer, type Bounds, type Edge, type MinSize, type Workspace } from './window-geometry';

/**
 * Pointer input for one window (.kiro/specs/os-case-v4 R2): titlebar drag (v3 guarantees kept), drag-to-restore from
 * maximized, double-click to maximize, and eight bounded resize handles. Every change goes through `apply`, which owns
 * the inline left/top/width/height; `transform` and `opacity` stay owned by window-motion.ts.
 */
export interface FrameHooks {
  /** The window is open and the layout allows moving it (not on phones, not mid-close). */
  canInteract(): boolean;
  bounds(): Bounds;
  maximized(): boolean;
  normal(): Bounds;
  workspace(): Workspace;
  min: MinSize;
  apply(bounds: Bounds, kind: 'drag' | 'resize'): void;
  /** Leaves the maximized state, adopting `bounds` as the new normal bounds. */
  unmaximize(bounds: Bounds): void;
  toggleMaximize(): void;
  /** Raise and focus the window. */
  onStart(): void;
  onEnd(cancelled: boolean): void;
}

/** Controls that keep their own pointer meaning. */
const EXEMPT = 'button, input, select, textarea, a[href], label, [contenteditable=""], [contenteditable="true"], [role="menu"]';
/** A press on a maximized titlebar becomes a drag only after this much movement, so a click never restores it. */
const RESTORE_THRESHOLD = 6;

interface ActiveDrag { kind: 'drag'; pointerId: number; startX: number; startY: number; start: Bounds; origin: Bounds; fromMaximized: boolean; ratioX: number; offsetY: number; }
interface ActiveResize { kind: 'resize'; pointerId: number; startX: number; startY: number; start: Bounds; edge: Edge; handle: HTMLElement; }

export class WindowFrame {
  private active: ActiveDrag | ActiveResize | null = null;
  private readonly events = new AbortController();
  readonly handles: HTMLElement[];

  constructor(private readonly win: HTMLElement, private readonly titlebar: HTMLElement, private readonly hooks: FrameHooks) {
    const options = { signal: this.events.signal };
    titlebar.addEventListener('pointerdown', this.dragDown, options);
    titlebar.addEventListener('pointermove', this.pointerMove, options);
    titlebar.addEventListener('pointerup', this.pointerEnd, options);
    titlebar.addEventListener('pointercancel', this.pointerEnd, options);
    titlebar.addEventListener('lostpointercapture', this.pointerEnd, options);
    titlebar.addEventListener('dblclick', event => {
      if ((event.target as Element).closest(EXEMPT) || !this.hooks.canInteract()) return;
      this.hooks.toggleMaximize();
    }, options);
    this.handles = EDGES.map(edge => {
      const handle = document.createElement('div');
      handle.className = 'window-resize';
      handle.dataset.edge = edge;
      handle.setAttribute('aria-hidden', 'true');
      handle.addEventListener('pointerdown', event => this.resizeDown(event, edge, handle), options);
      handle.addEventListener('pointermove', this.pointerMove, options);
      handle.addEventListener('pointerup', this.pointerEnd, options);
      handle.addEventListener('pointercancel', this.pointerEnd, options);
      handle.addEventListener('lostpointercapture', this.pointerEnd, options);
      win.append(handle);
      return handle;
    });
  }

  get busy(): boolean { return this.active !== null; }

  private dragDown = (event: PointerEvent): void => {
    if (this.active || event.button !== 0 || !event.isPrimary || !this.hooks.canInteract()) return;
    if ((event.target as Element).closest(EXEMPT)) return;
    const selection = document.getSelection();
    if (selection && !selection.isCollapsed && selection.anchorNode && this.titlebar.contains(selection.anchorNode)) return;
    event.preventDefault();
    const start = this.hooks.bounds(), rect = this.win.getBoundingClientRect();
    this.active = { kind: 'drag', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, start, origin: start,
      fromMaximized: this.hooks.maximized(), ratioX: rect.width ? (event.clientX - rect.left) / rect.width : 0.5, offsetY: event.clientY - rect.top };
    try { this.titlebar.setPointerCapture(event.pointerId); } catch { /* A synthetic pointer cannot be captured; moves over the bar still work. */ }
    this.win.classList.add('is-dragging');
    this.hooks.onStart();
  };

  private resizeDown(event: PointerEvent, edge: Edge, handle: HTMLElement): void {
    if (this.active || event.button !== 0 || !event.isPrimary || !this.hooks.canInteract() || this.hooks.maximized()) return;
    event.preventDefault();
    event.stopPropagation();
    this.active = { kind: 'resize', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, start: this.hooks.bounds(), edge, handle };
    try { handle.setPointerCapture(event.pointerId); } catch { /* See above. */ }
    this.win.classList.add('is-resizing');
    this.hooks.onStart();
  }

  /** Direct positioning: the window follows the pointer on every event, with no easing. */
  private pointerMove = (event: PointerEvent): void => {
    const active = this.active;
    if (!active || event.pointerId !== active.pointerId) return;
    const dx = event.clientX - active.startX, dy = event.clientY - active.startY, ws = this.hooks.workspace();
    if (active.kind === 'resize') { this.hooks.apply(resizeBounds(active.start, active.edge, dx, dy, ws, this.hooks.min), 'resize'); return; }
    if (active.fromMaximized) {
      if (Math.hypot(dx, dy) < RESTORE_THRESHOLD) return;
      const stage = this.win.parentElement!.getBoundingClientRect();
      const restored = restoreUnderPointer(this.hooks.normal(), { x: event.clientX - stage.left, y: event.clientY - stage.top }, active.ratioX, active.offsetY, ws, this.hooks.min);
      this.hooks.unmaximize(restored);
      this.active = { ...active, fromMaximized: false, start: restored, startX: event.clientX, startY: event.clientY };
      return;
    }
    this.hooks.apply(moveBounds(active.start, dx, dy, ws, this.hooks.min), 'drag');
  };

  private pointerEnd = (event: PointerEvent): void => { if (this.active && event.pointerId === this.active.pointerId) this.finish(false); };

  /** Ends an active drag or resize. `restore` (Escape) puts the window back where it started. */
  cancel(restore = false): void {
    const active = this.active;
    if (!active) return;
    if (restore && !(active.kind === 'drag' && active.fromMaximized)) this.hooks.apply(active.kind === 'drag' ? active.origin : active.start, active.kind);
    this.finish(true);
  }

  private finish(cancelled: boolean): void {
    const active = this.active;
    if (!active) return;
    this.active = null;
    const target = active.kind === 'drag' ? this.titlebar : active.handle;
    try { if (target.hasPointerCapture(active.pointerId)) target.releasePointerCapture(active.pointerId); } catch { /* Already released. */ }
    this.win.classList.remove('is-dragging', 'is-resizing');
    this.hooks.onEnd(cancelled);
  }

  dispose(): void { this.cancel(); this.events.abort(); this.handles.forEach(handle => handle.remove()); }
}
