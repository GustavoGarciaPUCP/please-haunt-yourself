import { prefersReducedMotion } from './ghost-writing';

/**
 * The first minute (.kiro/specs/os-case-v4 R1.5, design §5): a short "Restoring last session…" entry on a fresh run only,
 * and one optional callout at the anomaly. Both can be skipped at once and neither changes the case. The v2 spotlight
 * tour is retired: it asked people to open a program that was already open.
 */
export const GUIDE_KEY = 'haunt.guide.v4';
const BOOT_MS = 1200;

const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string): void => { try { localStorage.setItem(key, value); } catch { /* The callout simply shows again next time. */ } };

/** Plays the entry, then calls `done` exactly once. Any key or click skips it. */
export function playBoot(element: HTMLElement, done: () => void): void {
  let finished = false;
  const controller = new AbortController();
  const finish = () => {
    if (finished) return;
    finished = true;
    controller.abort();
    element.classList.add('is-leaving');
    window.setTimeout(() => { element.hidden = true; element.classList.remove('is-leaving'); }, prefersReducedMotion() ? 0 : 220);
    done();
  };
  element.hidden = false;
  element.dataset.motion = prefersReducedMotion() ? 'reduced' : 'full';
  const options = { signal: controller.signal, capture: true };
  addEventListener('keydown', event => { event.preventDefault(); finish(); }, options);
  addEventListener('pointerdown', finish, options);
  window.setTimeout(finish, prefersReducedMotion() ? 700 : BOOT_MS);
}

/**
 * One callout, pointing at TERMINAL's Look inside: the single most useful first action. It follows the window, hides
 * when TERMINAL is not visible and never returns once dismissed (or once the player looks inside on their own).
 */
export class FirstVisitCoach {
  private element: HTMLElement | null = null;
  private target: HTMLElement | null = null;
  private frame = 0;
  private readonly events = new AbortController();

  constructor(private readonly stage: HTMLElement) {}

  get seen(): boolean { return read(GUIDE_KEY) !== null; }

  /** Shows the callout next to `target` if this desk has not seen it. */
  show(target: HTMLElement | null): void {
    if (this.seen || !target || this.element) return;
    this.target = target;
    const element = document.createElement('div');
    element.className = 'coach';
    element.setAttribute('role', 'note');
    element.innerHTML = `<p>Something in TERMINAL is still running from 1987. <strong>Look inside</strong> to see what it keeps trying to finish.</p>
      <button type="button" data-coach-close>Got it</button>`;
    this.stage.append(element);
    this.element = element;
    const options = { signal: this.events.signal };
    element.querySelector('button')!.addEventListener('click', () => { this.dismiss(); target.focus({ preventScroll: true }); }, options);
    document.addEventListener('haunt:session-entered', () => this.dismiss(), options);
    document.addEventListener('haunt:window-moved', () => this.refresh(), options);
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && this.element) this.dismiss(); }, options);
    addEventListener('resize', () => this.refresh(), options);
    // The window is still opening; place the callout once it has settled, then whenever windows change.
    this.frame = window.setTimeout(() => this.refresh(), 280);
    this.refresh();
  }

  /** Follows TERMINAL: called on window moves, focus changes and viewport changes. */
  refresh(): void {
    const element = this.element, target = this.target;
    if (!element || !target) return;
    const rect = target.getBoundingClientRect(), stage = this.stage.getBoundingClientRect();
    const win = target.closest<HTMLElement>('.window');
    const visible = !!win && document.body.contains(target) && rect.width > 0 && !win.inert && win.style.display !== 'none' && !target.closest('[hidden]');
    element.hidden = !visible;
    if (!visible) return;
    const width = element.offsetWidth, box = win!.getBoundingClientRect();
    // Beside the window when there is room, so it covers nothing inside TERMINAL; otherwise just under the button.
    const side = stage.right - box.right >= width + 28;
    element.classList.toggle('is-side', side);
    if (side) {
      element.style.left = `${box.right - stage.left + 14}px`;
      element.style.top = `${Math.max(8, rect.top - stage.top + rect.height / 2 - 26)}px`;
    } else {
      const left = Math.max(8, Math.min(stage.width - width - 8, rect.left - stage.left + rect.width / 2 - 32));
      element.style.left = `${left}px`;
      element.style.top = `${rect.bottom - stage.top + 12}px`;
      element.style.setProperty('--arrow-x', `${rect.left - stage.left + rect.width / 2 - left}px`);
    }
    element.style.zIndex = String((Number(win!.style.zIndex) || 100) + 1);
  }

  dismiss(): void {
    write(GUIDE_KEY, 'seen');
    window.clearTimeout(this.frame);
    this.events.abort();
    this.element?.remove();
    this.element = null;
  }
}
