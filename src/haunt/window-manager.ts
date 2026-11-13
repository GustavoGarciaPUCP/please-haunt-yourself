import { animateClose, animateMinimize, animateOpen, animateRestore, cancelAllAnimations, onPreferenceChange } from './window-motion';
import { WindowFrame } from './window-drag';
import {
  MIN_SIZE, clampBounds, defaultBounds, keyboardResize, keyboardStep, maximizedBounds, moveBounds, sameBounds, type AppKind, type Bounds, type Workspace,
} from './window-geometry';
import { icon, type IconName } from './os-icons';
import type { OpenTarget } from './case-store';

/**
 * HAUNT OS window manager (.kiro/specs/os-case-v4 R2). Lifecycle (open/close/minimize/restore with motion epochs),
 * z-order and focus, maximize/restore, bounded resize, a keyboard window menu (Move, Size), arrange and viewport changes.
 * Geometry is inline pixels owned here; motion only animates transform/opacity. Escape never closes a window.
 */
export type WindowState = 'closed' | 'opening' | 'open' | 'closing' | 'minimized' | 'restoring';
export interface AppController {
  dispose(): void;
  suspend?(): void;
  resume?(): void;
  open?(target: OpenTarget): void;
  focusTarget?(): HTMLElement | null;
}
export interface AppContext { setSubtitle(text: string): void; window: HTMLElement; }
export interface AppEntry { id: AppKind; title: string; icon: IconName; create(content: HTMLElement, context: AppContext): AppController; }
export interface WindowInfo { id: AppKind; state: WindowState; active: boolean; maximized: boolean; }

interface Instance {
  id: AppKind; entry: AppEntry; state: WindowState; element: HTMLElement; gen: number; z: number; trigger: HTMLElement | null;
  frame: WindowFrame; controller: AppController; normal: Bounds; maximized: boolean; placed: boolean;
}
interface Remembered { normal: Bounds; maximized: boolean; placed: boolean; }
type Mode = { kind: 'move' | 'size'; id: AppKind; start: Bounds };

const OPEN_STATES: readonly WindowState[] = ['open', 'opening', 'restoring'];
const PHONE = typeof matchMedia === 'function' ? matchMedia('(max-width: 640px)') : null;

export class WindowManager {
  private readonly instances = new Map<AppKind, Instance>();
  private readonly remembered = new Map<AppKind, Remembered>();
  private readonly listeners = new Set<() => void>();
  private nextZ = 100;
  private mode: Mode | null = null;
  private menu: { id: AppKind; element: HTMLElement; button: HTMLButtonElement } | null = null;
  private hint: HTMLElement;

  constructor(private readonly stage: HTMLElement, private readonly registry: ReadonlyMap<AppKind, AppEntry>, private readonly setContext: (id: AppKind | null) => void) {
    this.hint = document.createElement('div');
    this.hint.className = 'window-mode-hint';
    this.hint.setAttribute('role', 'status');
    this.hint.hidden = true;
    stage.append(this.hint);
    document.addEventListener('keydown', this.keydown, true);
    document.addEventListener('pointerdown', event => {
      if (this.menu && !this.menu.element.contains(event.target as Node) && event.target !== this.menu.button && !this.menu.button.contains(event.target as Node)) this.closeMenu(false);
      if (this.mode) this.endMode(true);
    }, true);
    document.addEventListener('focusin', event => {
      for (const instance of this.instances.values()) {
        if (OPEN_STATES.includes(instance.state) && instance.element.contains(event.target as Node)) { if (!this.isActive(instance)) this.raise(instance); break; }
      }
    });
    addEventListener('blur', () => this.instances.forEach(instance => instance.frame.cancel()));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.instances.forEach(instance => instance.frame.cancel()); });
    new ResizeObserver(() => this.relayout()).observe(stage);
    PHONE?.addEventListener('change', () => this.relayout());
    onPreferenceChange(() => this.settleMotion());
  }

  onChange(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private changed(): void { this.listeners.forEach(listener => listener()); }

  workspace(): Workspace { return { width: this.stage.clientWidth, height: this.stage.clientHeight }; }
  private get phone(): boolean { return PHONE?.matches ?? false; }

  info(): WindowInfo[] {
    const active = this.activeInstance();
    return [...this.registry.keys()].map(id => {
      const instance = this.instances.get(id);
      return { id, state: instance?.state ?? 'closed', active: !!instance && instance === active, maximized: instance?.maximized ?? false };
    });
  }
  element(id: AppKind): HTMLElement | null { return this.instances.get(id)?.element ?? null; }
  isOpen(id: AppKind): boolean { const state = this.instances.get(id)?.state; return !!state && OPEN_STATES.includes(state); }

  // ---------- Geometry ----------

  private applyBounds(instance: Instance, bounds: Bounds): void {
    const style = instance.element.style;
    style.left = `${bounds.left}px`; style.top = `${bounds.top}px`; style.width = `${bounds.width}px`; style.height = `${bounds.height}px`;
    instance.element.dataset.maximized = String(instance.maximized);
    document.dispatchEvent(new CustomEvent('haunt:window-moved', { detail: { id: instance.id } }));
  }
  private currentBounds(instance: Instance): Bounds {
    const s = instance.element.style;
    return { left: parseFloat(s.left) || 0, top: parseFloat(s.top) || 0, width: parseFloat(s.width) || instance.normal.width, height: parseFloat(s.height) || instance.normal.height };
  }
  private layout(instance: Instance): void {
    const ws = this.workspace();
    if (!ws.width || !ws.height) return;
    if (this.phone || instance.maximized) { this.applyBounds(instance, maximizedBounds(ws)); return; }
    instance.normal = instance.placed ? clampBounds(instance.normal, ws, MIN_SIZE[instance.id]) : defaultBounds(instance.id, ws);
    this.applyBounds(instance, instance.normal);
  }
  /** Viewport changes clamp moved windows and re-lay out untouched ones; story progress is never involved. */
  relayout(): void {
    this.instances.forEach(instance => { instance.frame.cancel(); this.layout(instance); });
    this.instances.forEach(instance => instance.element.classList.toggle('is-phone', this.phone));
  }
  /** Arrange windows: every window back to its default bounds (and out of maximize). */
  arrange(): void {
    this.endMode(false);
    this.instances.forEach(instance => { instance.frame.cancel(); instance.maximized = false; instance.placed = false; this.layout(instance); });
    this.remembered.clear();
    this.changed();
  }
  toggleMaximize(id: AppKind): void {
    const instance = this.instances.get(id);
    if (!instance || !OPEN_STATES.includes(instance.state) || this.phone) return;
    instance.frame.cancel();
    if (!instance.maximized) instance.normal = this.currentBounds(instance);
    instance.maximized = !instance.maximized;
    this.layout(instance);
    this.updateControls(instance);
    this.changed();
  }

  // ---------- Lifecycle ----------

  open(id: AppKind, trigger: HTMLElement | null = null, target?: OpenTarget): void {
    let instance = this.instances.get(id);
    if (instance && (instance.state === 'closing' || instance.state === 'minimized')) {
      cancelAllAnimations(instance.element);
      instance.state = 'opening';
      instance.gen++;
      if (trigger) instance.trigger = trigger;
      this.show(instance);
      instance.controller.resume?.();
      this.raise(instance);
      const gen = instance.gen;
      animateOpen(instance.element, instance.trigger).finished.then(() => { if (instance!.gen === gen && instance!.state === 'opening') { instance!.state = 'open'; this.changed(); } }).catch(() => {});
      if (target) instance.controller.open?.(target);
      this.focus(instance);
      this.changed();
      return;
    }
    if (instance) {
      this.raise(instance);
      if (target) instance.controller.open?.(target);
      this.focus(instance);
      this.changed();
      return;
    }
    const entry = this.registry.get(id);
    if (!entry) return;
    instance = this.create(entry, trigger);
    const gen = instance.gen;
    const created = instance;
    animateOpen(instance.element, trigger).finished.then(() => { if (created.gen === gen && created.state === 'opening') { created.state = 'open'; this.changed(); } }).catch(() => {});
    if (target) instance.controller.open?.(target);
    this.focus(instance);
    this.changed();
  }

  private create(entry: AppEntry, trigger: HTMLElement | null): Instance {
    const id = entry.id;
    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.dataset.app = id;
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-labelledby', `${id}-title`);
    win.tabIndex = -1;
    win.innerHTML = `<div class="window-titlebar">
        <button type="button" class="window-icon" aria-haspopup="menu" aria-expanded="false" aria-label="${entry.title} window menu" title="Window menu: move, size, maximize, close">${icon(entry.icon)}</button>
        <h2 class="window-title" id="${id}-title"><span class="window-name">${entry.title}</span><span class="window-subtitle"></span></h2>
        <div class="window-controls">
          <button type="button" class="window-btn" data-window="minimize" aria-label="Minimize" title="Minimize">${icon('minimize')}</button>
          <button type="button" class="window-btn" data-window="maximize" aria-label="Maximize" title="Maximize">${icon('maximize')}</button>
          <button type="button" class="window-btn window-btn-close" data-window="close" aria-label="Close" title="Close">${icon('close')}</button>
        </div>
      </div><div class="window-content" data-app-content="${id}"></div>`;
    this.stage.append(win);
    const titlebar = win.querySelector<HTMLElement>('.window-titlebar')!;
    const remembered = this.remembered.get(id);
    const ws = this.workspace();
    const instance: Instance = {
      id, entry, state: 'opening', element: win, gen: 1, z: this.nextZ++, trigger,
      normal: remembered ? clampBounds(remembered.normal, ws, MIN_SIZE[id]) : defaultBounds(id, ws),
      maximized: remembered?.maximized ?? false, placed: remembered?.placed ?? false,
      frame: undefined as unknown as WindowFrame, controller: undefined as unknown as AppController,
    };
    instance.frame = new WindowFrame(win, titlebar, {
      canInteract: () => !this.phone && OPEN_STATES.includes(instance.state),
      bounds: () => this.currentBounds(instance),
      maximized: () => instance.maximized,
      normal: () => instance.normal,
      workspace: () => this.workspace(),
      min: MIN_SIZE[id],
      apply: bounds => { instance.normal = bounds; instance.placed = true; this.applyBounds(instance, bounds); },
      unmaximize: bounds => { instance.maximized = false; instance.normal = bounds; instance.placed = true; this.applyBounds(instance, bounds); this.updateControls(instance); this.changed(); },
      toggleMaximize: () => this.toggleMaximize(id),
      onStart: () => { this.raise(instance); if (!win.contains(document.activeElement)) this.focus(instance); },
      onEnd: () => document.dispatchEvent(new CustomEvent('haunt:window-moved', { detail: { id } })),
    });
    win.style.zIndex = String(instance.z);
    win.classList.toggle('is-phone', this.phone);
    this.layout(instance);
    titlebar.addEventListener('click', event => {
      const control = (event.target as Element).closest<HTMLButtonElement>('[data-window]');
      if (control?.dataset.window === 'minimize') this.minimize(id);
      if (control?.dataset.window === 'maximize') this.toggleMaximize(id);
      if (control?.dataset.window === 'close') this.close(id);
      if ((event.target as Element).closest('.window-icon')) this.toggleMenu(instance);
    });
    win.addEventListener('pointerdown', () => { if (OPEN_STATES.includes(instance.state) && !this.isActive(instance)) this.raise(instance); });
    const subtitle = win.querySelector<HTMLElement>('.window-subtitle')!;
    instance.controller = entry.create(win.querySelector<HTMLElement>('.window-content')!, {
      // Programs set their subtitle on every render; an unchanged one is not written again (.kiro/specs/fluid-typing-v9).
      setSubtitle: text => { const value = text ? `— ${text}` : ''; if (subtitle.textContent !== value) subtitle.textContent = value; },
      window: win,
    });
    this.instances.set(id, instance);
    this.updateControls(instance);
    this.raise(instance);
    return instance;
  }

  private show(instance: Instance): void {
    const el = instance.element;
    el.style.display = ''; el.style.pointerEvents = ''; el.inert = false; el.removeAttribute('aria-hidden');
  }
  private hide(instance: Instance): void {
    const el = instance.element;
    el.style.pointerEvents = 'none'; el.inert = true; el.setAttribute('aria-hidden', 'true');
  }
  private restoreFocus(instance: Instance): void {
    const trigger = instance.trigger && document.body.contains(instance.trigger) ? instance.trigger : document.getElementById(`btn-${instance.id}`);
    trigger?.focus({ preventScroll: true });
  }

  close(id: AppKind): void {
    const instance = this.instances.get(id);
    if (!instance || instance.state === 'closing') return;
    this.endMode(false);
    if (this.menu?.id === id) this.closeMenu(false);
    instance.frame.cancel();
    cancelAllAnimations(instance.element);
    instance.state = 'closing';
    instance.gen++;
    instance.controller.suspend?.();
    this.restoreFocus(instance);
    this.hide(instance);
    this.syncActive();
    this.setContext(this.activeInstance()?.id ?? null);
    const gen = instance.gen;
    animateClose(instance.element).finished.then(() => { if (instance.gen === gen && instance.state === 'closing') this.cleanup(instance); }).catch(() => {});
    this.changed();
  }

  minimize(id: AppKind): void {
    const instance = this.instances.get(id);
    if (!instance || !OPEN_STATES.includes(instance.state)) return;
    this.endMode(false);
    if (this.menu?.id === id) this.closeMenu(false);
    instance.frame.cancel();
    cancelAllAnimations(instance.element);
    instance.state = 'minimized';
    instance.gen++;
    instance.controller.suspend?.();
    this.restoreFocus(instance);
    this.hide(instance);
    this.syncActive();
    this.setContext(this.activeInstance()?.id ?? null);
    const gen = instance.gen;
    animateMinimize(instance.element, document.getElementById(`btn-${id}`)).finished.then(() => {
      if (instance.gen === gen && instance.state === 'minimized') instance.element.style.display = 'none';
    }).catch(() => {});
    this.changed();
  }

  restore(id: AppKind): void {
    const instance = this.instances.get(id);
    if (!instance || instance.state !== 'minimized') return;
    cancelAllAnimations(instance.element);
    instance.state = 'restoring';
    instance.gen++;
    this.show(instance);
    instance.controller.resume?.();
    const gen = instance.gen;
    animateRestore(instance.element, document.getElementById(`btn-${id}`)).finished.then(() => { if (instance.gen === gen && instance.state === 'restoring') { instance.state = 'open'; this.changed(); } }).catch(() => {});
    this.raise(instance);
    this.focus(instance);
    this.changed();
  }

  /** Taskbar button: open, bring forward, or minimize the active window. */
  toggleFromTaskbar(id: AppKind, button: HTMLElement): void {
    const instance = this.instances.get(id);
    if (!instance || instance.state === 'closing') { this.open(id, button); return; }
    if (instance.state === 'minimized') { this.restore(id); return; }
    if (this.isActive(instance)) { this.minimize(id); return; }
    this.raise(instance);
    this.focus(instance);
    this.changed();
  }

  private cleanup(instance: Instance): void {
    this.remembered.set(instance.id, { normal: instance.normal, maximized: instance.maximized, placed: instance.placed });
    instance.controller.dispose();
    instance.frame.dispose();
    instance.element.remove();
    this.instances.delete(instance.id);
    instance.state = 'closed';
    this.changed();
  }

  private settleMotion(): void {
    this.instances.forEach(instance => {
      if (instance.state === 'open') return;
      cancelAllAnimations(instance.element);
      if (instance.state === 'opening' || instance.state === 'restoring') {
        instance.state = 'open';
        Object.assign(instance.element.style, { opacity: '1', transform: '', display: '', pointerEvents: '' });
        instance.element.inert = false;
        instance.element.removeAttribute('aria-hidden');
      } else if (instance.state === 'closing') this.cleanup(instance);
      else if (instance.state === 'minimized') Object.assign(instance.element.style, { opacity: '0', transform: '', display: 'none' });
    });
    this.changed();
  }

  // ---------- Focus and order ----------

  private raise(instance: Instance): void {
    instance.z = this.nextZ++;
    instance.element.style.zIndex = String(instance.z);
    this.syncActive();
    this.setContext(instance.id);
    this.changed();
  }
  /**
   * The active frame is on exactly the window the model treats as active (the one the taskbar shows pressed), and on no
   * other: a minimized or closing window is not active (.kiro/specs/fluid-typing-v9 R5). It moves no focus.
   */
  private syncActive(): void {
    const active = this.activeInstance();
    this.instances.forEach(instance => instance.element.classList.toggle('is-active', instance === active));
  }
  private isActive(instance: Instance): boolean { return this.activeInstance() === instance; }
  private activeInstance(): Instance | null {
    let active: Instance | null = null;
    this.instances.forEach(instance => { if (OPEN_STATES.includes(instance.state) && (!active || instance.z > active.z)) active = instance; });
    return active;
  }
  private focus(instance: Instance): void {
    const target = instance.controller.focusTarget?.() ?? instance.element.querySelector<HTMLElement>('[data-primary]') ?? instance.element.querySelector<HTMLElement>('.window-content button, .window-content input');
    (target ?? instance.element).focus({ preventScroll: true });
  }
  focusApp(id: AppKind): void { const instance = this.instances.get(id); if (instance) { this.raise(instance); this.focus(instance); } }

  private updateControls(instance: Instance): void {
    const button = instance.element.querySelector<HTMLButtonElement>('[data-window="maximize"]')!;
    button.innerHTML = icon(instance.maximized ? 'restore' : 'maximize');
    button.setAttribute('aria-label', instance.maximized ? 'Restore' : 'Maximize');
    button.title = instance.maximized ? 'Restore' : 'Maximize';
    instance.element.dataset.maximized = String(instance.maximized);
  }

  // ---------- Window menu and keyboard modes ----------

  private toggleMenu(instance: Instance): void {
    if (this.menu?.id === instance.id) { this.closeMenu(true); return; }
    this.closeMenu(false);
    const button = instance.element.querySelector<HTMLButtonElement>('.window-icon')!;
    const menu = document.createElement('div');
    menu.className = 'window-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `${instance.entry.title} window`);
    const items: Array<[string, string, boolean]> = [
      ['restore', 'Restore', instance.maximized], ['move', 'Move', !instance.maximized && !this.phone], ['size', 'Size', !instance.maximized && !this.phone],
      ['minimize', 'Minimize', true], ['maximize', 'Maximize', !instance.maximized && !this.phone], ['close', 'Close', true],
    ];
    menu.innerHTML = items.map(([action, label, enabled]) => `<button type="button" role="menuitem" data-menu="${action}"${enabled ? '' : ' aria-disabled="true" disabled'}>${label}</button>`).join('');
    instance.element.append(menu);
    button.setAttribute('aria-expanded', 'true');
    this.menu = { id: instance.id, element: menu, button };
    menu.addEventListener('click', event => {
      const item = (event.target as Element).closest<HTMLButtonElement>('[data-menu]');
      if (!item || item.disabled) return;
      this.runMenu(instance.id, item.dataset.menu!);
    });
    menu.addEventListener('keydown', event => {
      const enabled = [...menu.querySelectorAll<HTMLButtonElement>('[data-menu]:not([disabled])')];
      const index = enabled.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); enabled[event.key === 'Home' ? 0 : enabled.length - 1]?.focus(); }
      else if (event.key === 'Tab') this.closeMenu(false);
    });
    menu.querySelector<HTMLButtonElement>('[data-menu]:not([disabled])')?.focus();
  }
  private closeMenu(focusButton: boolean): void {
    if (!this.menu) return;
    this.menu.element.remove();
    this.menu.button.setAttribute('aria-expanded', 'false');
    if (focusButton) this.menu.button.focus();
    this.menu = null;
  }
  private runMenu(id: AppKind, action: string): void {
    const instance = this.instances.get(id);
    this.closeMenu(action === 'move' || action === 'size');
    if (!instance) return;
    if (action === 'restore' || action === 'maximize') this.toggleMaximize(id);
    else if (action === 'minimize') this.minimize(id);
    else if (action === 'close') this.close(id);
    else if (action === 'move' || action === 'size') {
      this.mode = { kind: action, id, start: this.currentBounds(instance) };
      instance.element.classList.add(action === 'move' ? 'is-keyboard-move' : 'is-keyboard-size');
      this.hint.textContent = `${action === 'move' ? 'Moving' : 'Sizing'} ${instance.entry.title}: arrow keys (Shift for larger steps). Enter to finish, Esc to cancel.`;
      this.hint.hidden = false;
    }
  }
  private endMode(commit: boolean): void {
    const mode = this.mode;
    if (!mode) return;
    this.mode = null;
    this.hint.hidden = true;
    const instance = this.instances.get(mode.id);
    if (!instance) return;
    instance.element.classList.remove('is-keyboard-move', 'is-keyboard-size');
    if (!commit) { instance.normal = mode.start; this.applyBounds(instance, mode.start); }
  }

  private keydown = (event: KeyboardEvent): void => {
    if (this.mode) {
      const instance = this.instances.get(this.mode.id);
      if (!instance) { this.mode = null; this.hint.hidden = true; return; }
      if (event.key === 'Escape' || event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); this.endMode(event.key === 'Enter'); return; }
      const step = keyboardStep(event.key, event.shiftKey);
      if (!step) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const ws = this.workspace(), current = this.currentBounds(instance);
      const next = this.mode.kind === 'move' ? moveBounds(current, step.dx, step.dy, ws, MIN_SIZE[instance.id]) : keyboardResize(current, step.dx, step.dy, ws, MIN_SIZE[instance.id]);
      if (sameBounds(next, current)) return;
      instance.normal = next; instance.placed = true;
      this.applyBounds(instance, next);
      return;
    }
    if (event.key !== 'Escape') return;
    const busy = [...this.instances.values()].find(instance => instance.frame.busy);
    if (busy) { busy.frame.cancel(true); event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (this.menu) { event.preventDefault(); event.stopImmediatePropagation(); this.closeMenu(true); }
  };
}
