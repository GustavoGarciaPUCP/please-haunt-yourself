import { ProcessSession } from './process-session';
import { LegacySession, isSettled } from './legacy-session';
import { LegacyView } from './legacy-view';
import { shellPresentation } from './haunting-presentation';
import { prefersReducedMotion, writeGhostly } from './ghost-writing';
import { BELL_ICON, SPECTER } from './specter-art';

const TAB_RING: Keyframe[] = ['0deg', '22deg', '-16deg', '9deg', '0deg'].map(angle => ({ transform: `rotate(${angle})` }));

/** A bounded in-game console: text is rendered as text, never evaluated. */
export class TerminalController {
  private readonly events = new AbortController();
  private readonly input: HTMLInputElement;
  private readonly output: HTMLElement;
  private readonly shellView: HTMLElement;
  private readonly interior: HTMLElement;
  private readonly history: string[] = [];
  private historyIndex = 0;
  private draft = '';
  private readonly unsubscribe: () => void;
  private readonly unsubscribeLegacy: () => void;
  private readonly legacyView: LegacyView;
  /** The banner line last written while visible, and the return (cycle) it belongs to. */
  private line = { text: '', cycles: -1 };
  private lastCycles: number;

  constructor(private readonly container: HTMLElement, private readonly session: ProcessSession, private readonly openEcho: () => void, private readonly legacy: LegacySession) {
    container.classList.add('terminal-console');
    container.innerHTML = `
      <div class="terminal-shell-view">
      <div class="console-tab"><span class="console-led" aria-hidden="true"></span> recovery@haunt <span class="console-bell" aria-hidden="true" hidden>${BELL_ICON}<span class="console-bell-count"></span></span><span class="console-shell">game shell</span></div>
      <section class="terminal-anomaly" aria-label="What is haunting this terminal">
        <div class="shell-ghost" aria-hidden="true">${SPECTER}</div>
        <div class="anomaly-copy"><span class="terminal-health"></span><strong class="terminal-condition"></strong></div>
        <p class="terminal-ghost-line"><span class="ghost-prefix" aria-hidden="true"></span> <span class="ghost-hand" aria-hidden="true"></span><span class="ghost-caret" aria-hidden="true">▌</span><span class="ghost-line-sr sr-only"></span></p>
        <div class="terminal-case-actions"><button type="button" data-enter-session>Follow the ghost</button><button type="button" data-ask-status>Are you okay?</button><button type="button" data-read-note>Read the note</button></div>
      </section>
      <div class="console-output" tabindex="0" role="region" aria-label="Console transcript"></div>
      <p class="console-announcement sr-only" role="status" aria-live="polite"></p>
      <form class="console-form" autocomplete="off">
        <label class="console-prompt" for="haunt-command">guest<span>@</span>haunt:~$</label>
        <span class="console-entry"><input id="haunt-command" name="command" aria-label="Game console command" data-primary placeholder=" " maxlength="200" spellcheck="false" autocapitalize="off" autocorrect="off"><i class="console-caret" aria-hidden="true"></i></span>
        <button type="submit" class="console-run">Run</button>
      </form>
      <div class="console-shortcuts" aria-label="Command shortcuts">
        <span class="console-shortcuts-label">Commands for the curious:</span>
        <button type="button" data-command="help">help</button><button type="button" data-command="ps">ps</button><button type="button" data-command="inspect last.session">inspect session</button>
        <button type="button" class="console-open" data-open-echo>Open ECHO</button>
      </div>
      <div class="console-footer"><span class="console-process-state"></span><span>↑↓ history · Ctrl+L clear</span></div>
      </div><div class="legacy-interior" hidden></div>`;
    this.input = container.querySelector('input')!;
    this.output = container.querySelector<HTMLElement>('.console-output')!;
    this.shellView = container.querySelector<HTMLElement>('.terminal-shell-view')!;
    this.interior = container.querySelector<HTMLElement>('.legacy-interior')!;
    this.lastCycles = legacy.snapshot().cycles;
    this.legacyView = new LegacyView(this.interior, legacy, () => { this.showShell(); this.input.focus(); });
    const options = { signal: this.events.signal };
    container.querySelector('form')!.addEventListener('submit', event => { event.preventDefault(); this.submit(); }, options);
    container.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (button?.dataset.command) this.run(button.dataset.command);
      if (button?.hasAttribute('data-open-echo')) this.openEcho();
      if (button?.hasAttribute('data-enter-session')) this.showInterior();
      if (button?.hasAttribute('data-ask-status')) this.run('ask are you okay');
      if (button?.hasAttribute('data-read-note')) this.run('cat last-session');
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
    this.unsubscribe = session.subscribe(() => this.renderState());
    this.unsubscribeLegacy = legacy.subscribe(() => this.renderState());
    this.append('HAUNT recovery shell', 'banner');
    this.append('Something is still writing on this screen. You do not need to type: press Follow the ghost to go inside, or Are you okay? to ask TERMINAL.', 'normal');
    this.append('If you like typing, try ask status, enter last.session or help.', 'muted');
    this.append('ECHO’s capture workshop is separate. Commands only affect this fictional desktop.', 'muted');
    this.renderState();
  }

  private append(text: string, tone: string): void {
    const line = document.createElement('div');
    line.className = `console-line console-${tone}`;
    line.textContent = text || '\u00a0';
    this.output.append(line);
    // Bound DOM growth for repeated experiments without constraining command history semantics.
    while (this.output.childElementCount > 240) this.output.firstElementChild?.remove();
  }

  /** Buttons type their command for the player, so the transcript teaches the optional command line. */
  private run(command: string): void { this.input.value = command; this.submit(); }

  private submit(): void {
    const command = this.input.value.trim();
    if (!command) return;
    this.append(`guest@haunt:~$ ${command}`, 'entered');
    this.history.push(command);
    if (this.history.length > 80) this.history.shift();
    this.historyIndex = this.history.length;
    this.draft = '';
    this.input.value = '';
    const legacyResult = this.legacy.execute(command);
    const result = legacyResult ?? this.session.execute(command);
    if (command === 'help') result.lines = [...result.lines, '', 'enter last.session     follow the ghost inside this terminal', 'ask status / ask are you okay / ask who was here', 'cat last-session       read the note (what was kept)', 'echo <text>            test whether this prompt is yours', 'restore terminal       start the haunting over (ECHO is not changed)'];
    if (command === 'ps') result.lines = [...result.lines, `${this.legacy.snapshot().pid ?? '---'}  legacy  ${this.legacy.snapshot().health}  last.session`];
    if (result.action === 'clear') this.output.replaceChildren();
    else result.lines.forEach(line => this.append(line, result.tone));
    this.container.querySelector('.console-announcement')!.textContent = result.lines.join(' ');
    this.output.scrollTop = this.output.scrollHeight;
    if (result.action === 'enter-session') { this.showInterior(); return; }
    // Input refocus is appropriate after Run; opening ECHO must retain ECHO's focus.
    if (result.action === 'open-echo') this.openEcho();
    else this.input.focus();
  }

  private renderState(): void {
    const legacy = this.legacy.snapshot(), view = shellPresentation(legacy), c = this.container;
    c.querySelector('.console-process-state')!.textContent = view.footer;
    c.dataset.terminalHealth = legacy.health;
    c.dataset.ghost = view.ghost;
    c.dataset.line = view.lineKind;
    c.closest('.window')!.setAttribute('data-terminal-health', legacy.health);
    c.querySelector('.terminal-health')!.textContent = view.label;
    c.querySelector('.terminal-condition')!.textContent = view.condition;
    c.querySelector('.ghost-prefix')!.textContent = view.prefix;
    c.querySelector('.ghost-line-sr')!.textContent = view.lineSr;
    c.querySelector('[data-enter-session]')!.textContent = view.enter;

    // The presence writes its line once per opening and once per new return; never on idle.
    const visible = !this.shellView.hidden, writing = view.lineKind === 'writing';
    if (view.line !== this.line.text || legacy.cycles !== this.line.cycles) {
      writeGhostly(c.querySelector<HTMLElement>('.ghost-hand')!, view.line, writing && visible);
      // A return that happens while the room is open is written when the prompt is shown again.
      if (visible || !writing) this.line = { text: view.line, cycles: legacy.cycles };
    }

    // Visual bell in the tab, as a real terminal marks a tab that received a bell.
    const bell = c.querySelector<HTMLElement>('.console-bell')!;
    bell.hidden = isSettled(legacy) || legacy.cycles === 0;
    bell.querySelector('.console-bell-count')!.textContent = String(legacy.cycles);
    if (legacy.cycles > this.lastCycles && visible && !prefersReducedMotion()) bell.animate(TAB_RING, { duration: 900, easing: 'ease-out' });
    this.lastCycles = legacy.cycles;
  }

  private showInterior(): void {
    this.shellView.hidden = true;
    this.interior.hidden = false;
    this.container.closest('.window')!.classList.add('terminal-memory-open');
    this.legacyView.entered();
    const target = this.interior.querySelector<HTMLButtonElement>('[data-legacy="resume"]:not([hidden])')
      ?? this.interior.querySelector<HTMLButtonElement>('[data-legacy="step"]:enabled')
      ?? this.interior.querySelector<HTMLButtonElement>('[data-legacy="return"]')!;
    target.focus({ preventScroll: true });
  }

  public showShell(checkIn = false): void {
    this.shellView.hidden = false;
    this.interior.hidden = true;
    this.container.closest('.window')!.classList.remove('terminal-memory-open');
    this.renderState();
    if (checkIn) this.run('ask are you okay');
  }

  dispose(): void { this.events.abort(); this.unsubscribe(); this.unsubscribeLegacy(); this.legacyView.dispose(); }
}
