import { baseCommand, type ConsoleResult } from './process-session';
import { LAST_LINE, type LegacyEvent, type LegacyResult, type LegacySnapshot } from './legacy-session';
import { LegacyView } from './legacy-view';
import { FINISH_LINES, GHOST_PREFIX, bootLines, eventLines, jobStrip, phaseLines, type Tone, type TranscriptLine } from './haunting-presentation';
import { onReducedMotionChange, prefersReducedMotion, writeGhostly } from './ghost-writing';
import { BELL_ICON } from './specter-art';
import { CueSet } from './terminal-cues';
import { terminalBell } from './terminal-bell';
import { receiptMessage, type CaseStore, type OpenTarget } from './case-store';
import { LETTER_ASPECT, drawGlass, drawLetter, fitCanvas, letterArtFromSnapshot } from './glass-render';
import { handRegion } from './glass-model';
import { keepsPhrase } from './letter-model';
import type { GlassView } from './glass-view';
import type { AppContext, AppController } from './window-manager';
import type { LoadNotice } from './case-save';

const TAB_RING: Keyframe[] = ['0deg', '22deg', '-16deg', '9deg', '0deg'].map(angle => ({ transform: `rotate(${angle})` }));
const RINGS = new Set<LegacyEvent['kind']>(['observe', 'step', 'term', 'kill']);
const time = (at: number): string => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(at);

export interface TerminalHooks {
  /** A one-time notice about the restore point, printed in the first TERMINAL only. */
  takeNotice(): LoadNotice;
  /** The desktop glass, so the receipt can show the same surface where the hand is pressed (playability-v5 R6). */
  glassView: GlassView;
}

/**
 * TERMINAL (.kiro/specs/os-case-v4 R3): one job strip, a working console and the session pane. The anomaly is output
 * nobody typed; the receipt arrives in the job strip, and Finish session closes the request through the case store.
 * Text is rendered as text, never evaluated.
 */
export class TerminalController implements AppController {
  private readonly events = new AbortController();
  private readonly cues = new CueSet();
  private readonly input: HTMLInputElement;
  private readonly output: HTMLElement;
  private readonly shellView: HTMLElement;
  private readonly sessionView: HTMLElement;
  private readonly history: string[] = [];
  private historyIndex = 0;
  private draft = '';
  private readonly unsubscribers: Array<() => void> = [];
  private readonly legacyView: LegacyView;
  private lastEventId: number;
  private previous: LegacySnapshot;
  private receiptKey = '';
  /** Whether the transcript shows its last line (it then stays there when the window resizes). */
  private pinned = true;

  constructor(private readonly container: HTMLElement, private readonly store: CaseStore, private readonly context: AppContext, private readonly hooks: TerminalHooks) {
    container.classList.add('terminal-app');
    container.innerHTML = `
      <section class="job-strip" aria-label="Job">
        <div class="job-row">
          <span class="job-dot" aria-hidden="true"></span>
          <span class="job-name">last.session</span><span class="job-meta">Mara · 31 Oct 1987</span>
          <span class="job-bell" hidden><span class="job-bell-icon" aria-hidden="true">${BELL_ICON}</span><span class="job-bell-count"></span></span>
          <span class="job-phase"></span>
        </div>
        <div class="job-actions">
          <p class="job-next"></p>
          <button type="button" data-enter-session>Look inside</button><button type="button" data-ask-status>Are you okay?</button>
        </div>
        <div class="receipt-card" hidden>
          <div class="receipt-head">
            <div class="receipt-text"><strong class="receipt-title"></strong><p class="receipt-detail"></p></div>
            <div class="receipt-buttons"><button type="button" class="is-primary" data-finish>Finish session</button><button type="button" data-dismiss-receipt hidden>Dismiss</button></div>
          </div>
          <div class="receipt-media">
            <figure class="receipt-figure" data-figure="glass"><canvas class="receipt-glass" role="img"></canvas><figcaption></figcaption></figure>
            <figure class="receipt-figure" data-figure="letter"><canvas class="receipt-letter" role="img" aria-label="The letter you sent"></canvas><figcaption>Your letter</figcaption></figure>
          </div>
        </div>
      </section>
      <div class="terminal-shell">
        <div class="console-output" tabindex="0" role="log" aria-label="Transcript"></div>
        <p class="console-announcement sr-only" role="status" aria-live="polite"></p>
        <form class="console-form" autocomplete="off">
          <label class="console-prompt" for="haunt-command">guest<span>@</span>haunt:~$</label>
          <span class="console-entry"><input id="haunt-command" name="command" aria-label="Command" data-primary maxlength="200" spellcheck="false" autocapitalize="off" autocorrect="off"><i class="console-caret" aria-hidden="true"></i></span>
        </form>
        <div class="console-chips" aria-label="Commands">
          <button type="button" data-command="help">help</button><button type="button" data-command="jobs">jobs</button><button type="button" data-command="ps">ps</button><button type="button" data-command="cat last.job">cat last.job</button>
          <span class="console-chips-gap"></span><button type="button" class="console-open" data-open="echo">Open ECHO</button>
        </div>
      </div>
      <div class="terminal-session" hidden></div>`;
    this.input = container.querySelector('input')!;
    this.output = container.querySelector<HTMLElement>('.console-output')!;
    this.shellView = container.querySelector<HTMLElement>('.terminal-shell')!;
    this.sessionView = container.querySelector<HTMLElement>('.terminal-session')!;
    const legacy = store.legacy;
    this.lastEventId = legacy.lastEvent().id;
    this.previous = legacy.snapshot();
    this.legacyView = new LegacyView(this.sessionView, legacy, () => this.showShell(true));
    const options = { signal: this.events.signal };
    container.querySelector('form')!.addEventListener('submit', event => { event.preventDefault(); this.submit(); }, options);
    container.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled || this.sessionView.contains(button)) return;
      if (button.dataset.command) this.run(button.dataset.command);
      if (button.dataset.open) store.open({ app: button.dataset.open as 'echo' });
      if (button.hasAttribute('data-enter-session')) this.showSession();
      if (button.hasAttribute('data-ask-status')) this.run('ask are you okay');
      if (button.hasAttribute('data-finish')) this.finish(store.offered);
      if (button.hasAttribute('data-dismiss-receipt')) { store.clearOffered(); this.input.focus(); }
    }, options);
    this.input.addEventListener('keydown', event => {
      if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); this.output.replaceChildren(); return; }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      if (this.historyIndex === this.history.length) this.draft = this.input.value;
      this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
      this.input.value = this.history[this.historyIndex] ?? this.draft;
      this.input.setSelectionRange(this.input.value.length, this.input.value.length);
    }, options);
    onReducedMotionChange(() => { if (prefersReducedMotion()) this.settle(); }, this.events.signal);
    const resize = new ResizeObserver(() => this.renderReceipt(true));
    resize.observe(container.querySelector('.receipt-letter')!);
    resize.observe(container.querySelector('.receipt-glass')!);
    this.unsubscribers.push(() => resize.disconnect());
    // Like a terminal emulator: a transcript that was showing its last line keeps showing it when the window resizes.
    this.output.addEventListener('scroll', () => { this.pinned = this.output.scrollTop + this.output.clientHeight >= this.output.scrollHeight - 4; }, options);
    const pin = new ResizeObserver(() => { if (this.pinned) this.output.scrollTop = this.output.scrollHeight; });
    pin.observe(this.output);
    this.unsubscribers.push(() => pin.disconnect());
    // Every frame the desktop glass draws (a wipe, the release), the receipt's view of it draws the same state.
    this.unsubscribers.push(hooks.glassView.onDraw(() => this.drawReceiptGlass()));
    this.unsubscribers.push(legacy.subscribe(() => this.renderState()));
    // The receipt card shows deliveries, never POSTMAN's mail draft: a key typed there redraws nothing here
    // (.kiro/specs/fluid-typing-v9).
    this.unsubscribers.push(store.subscribe(change => { if (change !== 'mail-draft') this.renderReceipt(); }));
    this.unsubscribers.push(store.onPhase((phase, previous) => this.printEvent(phaseLines(phase, previous, store.mail.intended()))));
    // The first lines are ordinary; then a line arrives that nobody typed.
    this.print(bootLines(legacy.snapshot(), hooks.takeNotice()));
    if (legacy.snapshot().presence === 'terminal') this.ghost(`${GHOST_PREFIX} ${LAST_LINE}`, 700);
    this.context.setSubtitle('guest@haunt');
    this.renderState();
    this.renderReceipt(true);
  }

  // ---------- Transcript ----------

  private line(text: string, tone: Tone): HTMLElement {
    const line = document.createElement('div');
    line.className = `console-line console-${tone}`;
    line.textContent = text || '\u00a0';
    this.output.append(line);
    // Bound DOM growth for repeated experiments without constraining command history semantics.
    while (this.output.childElementCount > 240) this.output.firstElementChild?.remove();
    return line;
  }
  private print(lines: readonly TranscriptLine[]): void { lines.forEach(([text, tone]) => this.line(text, tone)); }

  /** Lines the case adds on its own never pull the reader away from earlier lines they are reading. */
  private printEvent(lines: readonly TranscriptLine[]): void {
    if (!lines.length) return;
    const atBottom = this.output.scrollHeight - this.output.scrollTop - this.output.clientHeight < 16;
    for (const [text, tone] of lines) {
      if (tone === 'ghost') this.ghost(text);
      else this.line(text, tone);
    }
    if (atBottom) this.output.scrollTop = this.output.scrollHeight;
  }

  /** A line that writes itself, letter by letter (immediately with reduced motion). */
  private ghost(text: string, delay = 0): void {
    const line = this.line('', 'ghost');
    const visible = !this.shellView.hidden && !document.hidden;
    writeGhostly(line, text, visible, delay);
    line.setAttribute('aria-label', text);
    this.output.scrollTop = this.output.scrollHeight;
  }

  /** Buttons type their command for the player, so the transcript teaches the optional command line. */
  private run(command: string): void { this.input.value = command; this.submit(); }

  private submit(): void {
    const command = this.input.value.trim();
    if (!command) return;
    this.line(`guest@haunt:~$ ${command}`, 'entered');
    this.history.push(command);
    if (this.history.length > 80) this.history.shift();
    this.historyIndex = this.history.length;
    this.draft = '';
    this.input.value = '';
    const result: ConsoleResult | LegacyResult = this.store.legacy.execute(command) ?? baseCommand(command);
    if (result.action === 'clear') this.output.replaceChildren();
    else result.lines.forEach(text => text.startsWith(GHOST_PREFIX) ? this.ghost(text) : this.line(text, result.tone));
    this.container.querySelector('.console-announcement')!.textContent = result.lines.join(' ');
    this.output.scrollTop = this.output.scrollHeight;
    if (result.action === 'enter-session') { this.showSession(); return; }
    if (result.action === 'finish') { this.finish(this.store.offered); return; }
    // Opening another program must keep that program's focus.
    if (result.action === 'open' && result.app) { this.store.open({ app: result.app }); return; }
    this.input.focus();
  }

  // ---------- Finish session ----------

  /** Finish session: the case store validates and commits at once; this view then shows it. */
  private finish(receiptId: number | null): void {
    const result = this.store.finish(receiptId);
    if (result.ok) {
      this.showShell(false);
      this.input.focus({ preventScroll: true });
      return;
    }
    const message = result.reason === 'finished' ? 'The session is already finished. The letter arrived.'
      : receiptMessage(result.reason, 'delivery' in result && result.delivery ? result.delivery : null, this.store.mail.intended());
    this.line(`TERMINAL: ${message}`, result.reason === 'finished' ? 'muted' : 'warning');
    this.container.querySelector('.console-announcement')!.textContent = message;
    this.output.scrollTop = this.output.scrollHeight;
  }

  private renderReceipt(force = false): void {
    const store = this.store, card = this.container.querySelector<HTMLElement>('.receipt-card')!;
    const finished = store.finished, offered = store.offered;
    const check = store.checkReceipt(offered);
    const delivery = finished ? store.deliveredLetter() : check.ok ? check.delivery : 'delivery' in check ? check.delivery ?? null : null;
    const show = finished || offered !== null || check.ok || (!check.ok && check.reason === 'incomplete');
    card.hidden = !show || !delivery;
    if (card.hidden || !delivery) { this.receiptKey = ''; return; }
    const title = card.querySelector('.receipt-title')!, detail = card.querySelector('.receipt-detail')!;
    const finish = card.querySelector<HTMLButtonElement>('[data-finish]')!, dismiss = card.querySelector<HTMLButtonElement>('[data-dismiss-receipt]')!;
    card.dataset.state = finished ? 'finished' : check.ok ? 'ready' : 'refused';
    if (finished) {
      title.textContent = 'Session finished';
      // The end names what the delivered photograph keeps, from the delivered snapshot itself (playability-v5 R6.3).
      const keeps = delivery.letter ? ` Its photograph keeps ${keepsPhrase(delivery.letter.subject)}.` : '';
      detail.textContent = `The letter you sent reached guest@haunt at ${time(delivery.at)}.${keeps} It stays in POSTMAN’s Guest Inbox.`;
    } else if (check.ok) {
      title.textContent = 'Receipt from POSTMAN';
      detail.textContent = `Delivered to guest@haunt, the next person at this desk, at ${time(delivery.at)}. This is the letter you sent.`;
    } else {
      title.textContent = 'Receipt from POSTMAN';
      detail.textContent = receiptMessage(check.reason, delivery, store.mail.intended());
    }
    finish.hidden = finished || !check.ok;
    dismiss.hidden = finished || check.ok || offered === null;
    // The glass where the hand is pressed, beside the letter that answers it: the same surface as the desktop, so
    // Finish session shows the hand let go here even while windows cover the glass (playability-v5 R6). A refused
    // receipt shows only the letter.
    card.querySelector<HTMLElement>('[data-figure="glass"]')!.hidden = !(finished || check.ok) || !store.glass.placement;
    const canvas = card.querySelector<HTMLCanvasElement>('.receipt-letter')!;
    const letter = delivery.letter;
    card.querySelector<HTMLElement>('[data-figure="letter"]')!.hidden = !letter;
    this.drawReceiptGlass();
    if (!letter) return;
    canvas.style.aspectRatio = String(LETTER_ASPECT[letter.layout]);
    const key = `${delivery.id}:${canvas.clientWidth}x${canvas.clientHeight}`;
    if (!force && key === this.receiptKey) return;
    if (!fitCanvas(canvas)) return;
    this.receiptKey = key;
    drawLetter(canvas.getContext('2d')!, letterArtFromSnapshot(letter), canvas.width, canvas.height);
  }

  /** The receipt's view of the glass: the region around the hand, drawn from the shared surface at the desktop's progress. */
  private drawReceiptGlass(): void {
    const card = this.container.querySelector<HTMLElement>('.receipt-card')!, figure = card.querySelector<HTMLElement>('[data-figure="glass"]')!;
    if (card.hidden || figure.hidden) return;
    const glass = this.store.glass, placement = glass.placement, view = this.hooks.glassView;
    const state = !glass.released ? 'impressed' : view.releasing ? 'releasing' : 'clear';
    if (figure.dataset.glass !== state) {
      figure.dataset.glass = state;
      figure.querySelector('figcaption')!.textContent = state === 'impressed' ? 'The glass, live' : state === 'releasing' ? 'The hand lets go' : 'The glass is clear.';
      figure.querySelector('canvas')!.setAttribute('aria-label', state === 'impressed' ? 'The glass behind the windows, live, where the hand is pressed.'
        : state === 'releasing' ? 'The hand lets go of the glass.' : 'The glass where the hand was pressed. It is clear.');
    }
    const canvas = figure.querySelector('canvas')!;
    if (!placement || !fitCanvas(canvas)) return;
    const stage = view.stageSize;
    drawGlass(canvas.getContext('2d')!, { stage, placement, field: glass.field, writing: glass.writing }, handRegion(placement, stage), canvas.width, canvas.height,
      { reveal: view.reveal, release: glass.released ? view.release : 0 });
  }

  // ---------- State ----------

  private settle(): void { this.cues.cancel(); }

  private renderState(): void {
    const legacy = this.store.legacy, state = legacy.snapshot(), event = legacy.lastEvent(), c = this.container;
    const fresh = event.id !== this.lastEventId;
    this.lastEventId = event.id;
    const ring = fresh && state.moment === 'recalled' && RINGS.has(event.kind);
    if (fresh && event.kind === 'reset') { this.print([['', 'muted'], ...bootLines(state)]); this.ghost(`${GHOST_PREFIX} ${LAST_LINE}`, 500); }
    else if (fresh && event.kind === 'finish') this.printEvent(FINISH_LINES);
    else if (fresh) this.printEvent(eventLines(state, event, this.previous));
    this.previous = state;
    const strip = jobStrip(state);
    c.dataset.presence = state.presence;
    c.dataset.phase = state.casePhase;
    c.closest('.window')?.setAttribute('data-presence', state.presence);
    c.querySelector('.job-phase')!.textContent = strip.phase;
    c.querySelector('.job-next')!.textContent = strip.next;
    // Visual bell, as a terminal marks a tab that received a bell. A muffled bell still counts returns.
    const bell = c.querySelector<HTMLElement>('.job-bell')!;
    bell.hidden = state.attempts === 0;
    bell.dataset.muffled = String(state.muffled);
    bell.title = `Returns: ${state.attempts}${state.muffled ? ' (bell muffled)' : ''}`;
    bell.querySelector('.job-bell-count')!.textContent = String(state.attempts);
    if (ring && !state.muffled && !prefersReducedMotion() && !document.hidden) this.cues.play(bell.querySelector('.job-bell-icon'), TAB_RING, { duration: 900, easing: 'ease-out' });
  }

  private showSession(): void {
    this.settle();
    this.shellView.hidden = true;
    this.sessionView.hidden = false;
    this.container.dataset.view = 'session';
    this.context.setSubtitle('last.session');
    this.legacyView.entered();
    this.sessionView.querySelector<HTMLButtonElement>('[data-main-action]')!.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('haunt:session-entered'));
  }

  /** Back to the prompt, with focus on it when the player was working in this window. */
  showShell(focus: boolean): void {
    if (!this.sessionView.hidden) this.legacyView.leave();
    this.shellView.hidden = false;
    this.sessionView.hidden = true;
    this.container.dataset.view = 'shell';
    this.context.setSubtitle('guest@haunt');
    this.renderState();
    this.renderReceipt(true);
    this.output.scrollTop = this.output.scrollHeight;
    if (focus) this.input.focus({ preventScroll: true });
  }

  open(target: OpenTarget): void {
    if (target.app !== 'terminal') return;
    if (target.focus === 'inside') { this.showSession(); return; }
    this.showShell(false);
    if (target.focus === 'job') this.run('cat last.job');
    if (target.focus === 'finish') {
      const finish = this.container.querySelector<HTMLButtonElement>('[data-finish]')!;
      (finish.hidden || finish.closest('[hidden]') ? this.input : finish).focus({ preventScroll: true });
    }
  }

  focusTarget(): HTMLElement | null {
    if (!this.sessionView.hidden) return this.sessionView.querySelector<HTMLButtonElement>('[data-main-action]');
    const finish = this.container.querySelector<HTMLButtonElement>('[data-finish]')!;
    return !finish.hidden && !finish.closest('[hidden]') ? finish : this.input;
  }

  /** Minimize: nothing keeps moving or sounding in a hidden window. */
  suspend(): void { this.settle(); this.legacyView.suspend(); terminalBell.silence(); }
  resume(): void { this.renderReceipt(true); }

  dispose(): void {
    this.settle();
    terminalBell.silence();
    this.events.abort();
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.legacyView.dispose();
  }
}
