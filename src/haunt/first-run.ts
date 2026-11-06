export const GUIDE_STORAGE_KEY = 'haunt.guide.v1';
type App = 'terminal' | 'echo';
const steps = [
  { title: 'A desktop with unfinished business.', copy: 'Your first task: help ECHO make an entrance. Open its recovered app. Four more applications are still unrecovered.', target: '#btn-echo', next: 'Open ECHO', app: undefined },
  { title: 'This is what stops the show.', copy: 'ECHO freezes while it sees its own reflection. Cover the private monitor with the farewell scenery, or investigate the process that keeps it alive. The public stage must stay clear.', target: '.echo-board-wrap', next: 'Show me the console', app: 'echo' },
  { title: 'Read before you send a signal.', copy: 'Run ps to see the processes. Inspect one to find what it does and what restarts it. The console and ECHO share the same state. Nothing in this tour kills a process for you.', target: '.terminal-console', next: 'Find the rehearsal controls', app: 'terminal' },
  { title: 'Make a change. See what happens.', copy: 'After changing the set, rehearse the example entrance. ECHO explains what still blocks it. Try another host reaction after your first take. Leave now always stops the performance.', target: '[data-action="rehearse"]', next: 'Start exploring', app: 'echo' },
] as const;

/** Coach UI points at real app surfaces; it never repairs scenery or process state. */
export class FirstRunGuide {
  private index = 0;
  private active = false;
  private frame = 0;
  private returnFocus: HTMLElement | null = null;
  private target: Element | null = null;
  private readonly layer: HTMLElement;
  private readonly card: HTMLElement;
  private readonly shades: HTMLElement[];
  private readonly spot: HTMLElement;

  constructor(private readonly launch: (app: App) => void, private readonly pause: () => void) {
    this.layer = document.createElement('div');
    this.layer.id = 'guide-layer';
    this.layer.hidden = true;
    this.layer.innerHTML = `<div class="guide-shade" aria-hidden="true"></div><div class="guide-shade" aria-hidden="true"></div><div class="guide-shade" aria-hidden="true"></div><div class="guide-shade" aria-hidden="true"></div>
      <div class="guide-spot" aria-hidden="true"></div>
      <section class="guide-card" role="dialog" aria-labelledby="guide-title" aria-describedby="guide-copy" tabindex="-1">
        <div class="guide-heading"><span>Recovery assistant</span><select aria-label="Guide topic"><option value="0">Desktop</option><option value="1">Privacy</option><option value="2">Console</option><option value="3">Rehearse</option></select><button data-guide="skip">Skip tour</button></div>
        <p class="guide-count"></p><h2 id="guide-title"></h2><p id="guide-copy"></p>
        <button class="guide-query" data-guide="query">Run ps — read processes</button>
        <div class="guide-actions"><button data-guide="back">Back</button><button data-guide="next"></button></div>
      </section>`;
    document.body.append(this.layer);
    this.card = this.layer.querySelector<HTMLElement>('.guide-card')!;
    this.shades = [...this.layer.querySelectorAll<HTMLElement>('.guide-shade')];
    this.spot = this.layer.querySelector<HTMLElement>('.guide-spot')!;
    this.card.querySelector('select')!.addEventListener('change', event => this.show(Number((event.target as HTMLSelectElement).value)));
    this.layer.addEventListener('click', event => {
      const action = (event.target as Element).closest<HTMLElement>('[data-guide]')?.dataset.guide;
      if (action === 'skip') this.finish();
      if (action === 'back') this.show(this.index - 1);
      if (action === 'next') this.index === steps.length - 1 ? this.finish() : this.show(this.index + 1);
      if (action === 'query') {
        document.querySelector<HTMLButtonElement>('.console-shortcuts [data-command="ps"]')?.click();
        const output = document.querySelector<HTMLElement>('.console-output');
        const command = output?.querySelectorAll<HTMLElement>('.console-entered');
        const latest = command?.[command.length - 1];
        // A short mobile transcript should reveal the new table's beginning, not only its footer.
        if (output && latest) output.scrollTop += latest.getBoundingClientRect().top - output.getBoundingClientRect().top - 8;
        this.layer.querySelector<HTMLElement>('.guide-query')!.textContent = 'ps ran. Read the table in TERMINAL.';
      }
    });
    document.addEventListener('click', event => {
      if (this.active && this.index === 0 && (event.target as Element).closest('#btn-echo')) this.show(1);
      else if (this.active && this.index === 3 && (event.target as Element).closest('[data-action="rehearse"]')) this.finish(document.getElementById('window-echo')!);
    });
    document.addEventListener('keydown', event => this.handleKey(event), true);
    addEventListener('resize', () => this.refresh());
    document.addEventListener('scroll', () => this.refresh(), true);
    new ResizeObserver(() => this.refresh()).observe(this.card);
  }

  startIfNew(): void {
    try { if (localStorage.getItem(GUIDE_STORAGE_KEY)) return; } catch { /* Private storage can be unavailable. */ }
    this.start();
  }

  start(): void {
    if (!this.active) this.returnFocus = document.activeElement as HTMLElement | null;
    this.pause();
    this.active = true;
    this.layer.hidden = false;
    this.show(0);
  }

  private show(index: number): void {
    this.index = Math.max(0, Math.min(index, steps.length - 1));
    const step = steps[this.index]!;
    if (step.app) this.launch(step.app);
    this.layer.dataset.step = String(this.index);
    document.body.dataset.guideStep = String(this.index);
    this.card.querySelector('.guide-count')!.textContent = `${this.index + 1} of ${steps.length}`;
    this.card.querySelector('select')!.value = String(this.index);
    this.card.querySelector('#guide-title')!.textContent = step.title;
    this.card.querySelector('#guide-copy')!.textContent = step.copy;
    this.card.querySelector<HTMLButtonElement>('[data-guide="next"]')!.textContent = step.next;
    this.card.querySelector<HTMLButtonElement>('[data-guide="back"]')!.disabled = this.index === 0;
    const query = this.card.querySelector<HTMLButtonElement>('[data-guide="query"]')!;
    query.hidden = this.index !== 2;
    query.textContent = 'Run ps — read processes';
    this.target = document.querySelector(step.target);
    this.target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    this.position();
    this.card.querySelector<HTMLButtonElement>('[data-guide="next"]')!.focus({ preventScroll: true });
    this.refresh();
  }

  private refresh(): void {
    if (!this.active) return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      this.position();
      // Track opening motion only, not an idle per-frame layout loop.
      if (this.target?.closest('.window')?.getAnimations().some(animation => animation.playState === 'running')) this.refresh();
    });
  }

  private position(): void {
    if (!this.active) return;
    const cardWidth = this.card.offsetWidth, cardHeight = this.card.offsetHeight;
    document.body.style.setProperty('--guide-card-height', `${cardHeight}px`);
    const rect = this.target?.getBoundingClientRect();
    const width = innerWidth, height = innerHeight;
    const hole = rect ? { left: Math.max(5, rect.left - 6), top: Math.max(5, rect.top - 6), right: Math.min(width - 5, rect.right + 6), bottom: Math.min(height - 5, rect.bottom + 6) } : { left: width / 2, right: width / 2 + 1, top: height / 2, bottom: height / 2 + 1 };
    const place = (element: HTMLElement, left: number, top: number, w: number, h: number) => {
      Object.assign(element.style, { left: `${left}px`, top: `${top}px`, width: `${Math.max(0, w)}px`, height: `${Math.max(0, h)}px` });
    };
    place(this.shades[0]!, 0, 0, width, hole.top);
    place(this.shades[1]!, 0, hole.bottom, width, height - hole.bottom);
    place(this.shades[2]!, 0, hole.top, hole.left, hole.bottom - hole.top);
    place(this.shades[3]!, hole.right, hole.top, width - hole.right, hole.bottom - hole.top);
    place(this.spot, hole.left, hole.top, hole.right - hole.left, hole.bottom - hole.top);
    let left = hole.right + 18, top = hole.top;
    if (width <= 650) {
      left = (width - cardWidth) / 2;
      top = this.index === 2 && height >= 650 ? 44 : (hole.top + hole.bottom) / 2 > height / 2 ? 44 : height - cardHeight - 12;
    } else if (left + cardWidth > width - 12) {
      left = hole.left - cardWidth - 18;
      if (left < 12) { left = (width - cardWidth) / 2; top = hole.bottom + 16; }
    }
    this.card.style.left = `${Math.max(12, Math.min(left, width - cardWidth - 12))}px`;
    this.card.style.top = `${Math.max(12, Math.min(top, height - cardHeight - 12))}px`;
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.active) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.finish(); return; }
    if (event.key !== 'Tab') return;
    const selector = 'button:enabled, input:enabled, select:enabled, [tabindex="0"]';
    const candidates: HTMLElement[] = [...this.card.querySelectorAll<HTMLElement>(selector)];
    if (this.target?.matches(selector)) candidates.push(this.target as HTMLElement);
    candidates.push(...(this.target?.querySelectorAll<HTMLElement>(selector) ?? []));
    const allowed = [...new Set(candidates)].filter(el => !el.closest('[hidden], [inert]') && el.getClientRects().length > 0);
    const current = allowed.indexOf(document.activeElement as HTMLElement);
    if (!allowed.length) return;
    event.preventDefault();
    allowed[(current + (event.shiftKey ? -1 : 1) + allowed.length) % allowed.length]?.focus({ preventScroll: true });
  }

  private finish(focusOverride?: HTMLElement): void {
    this.active = false;
    cancelAnimationFrame(this.frame);
    this.layer.hidden = true;
    delete document.body.dataset.guideStep;
    document.body.style.removeProperty('--guide-card-height');
    try { localStorage.setItem(GUIDE_STORAGE_KEY, 'dismissed'); } catch { /* Guide remains usable without persistence. */ }
    const preferred = focusOverride ?? (this.index === 3 && this.target instanceof HTMLElement && !this.target.matches(':disabled') ? this.target : this.index === 3 ? document.getElementById('window-echo') : this.returnFocus);
    const focus = preferred?.isConnected && !preferred.closest('[inert], [aria-hidden="true"]') && preferred.getClientRects().length ? preferred : document.getElementById('btn-guide');
    focus?.focus({ preventScroll: true });
  }
}
