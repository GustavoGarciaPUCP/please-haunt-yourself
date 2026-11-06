import { ProcessSession } from './process-session';
import { LegacySession, LAST_LINE, isSettled } from './legacy-session';
import { LegacyView } from './legacy-view';

/** A bounded in-game console: text is rendered as text, never evaluated. */
export class TerminalController {
  private readonly events = new AbortController();
  private readonly input: HTMLInputElement;
  private readonly output: HTMLElement;
  private readonly history: string[] = [];
  private historyIndex = 0;
  private draft = '';
  private readonly unsubscribe: () => void;
  private readonly unsubscribeLegacy: () => void;
  private readonly legacyView: LegacyView;

  constructor(private readonly container: HTMLElement, private readonly session: ProcessSession, private readonly openEcho: () => void, private readonly legacy: LegacySession) {
    container.classList.add('terminal-console');
    container.innerHTML = `
      <div class="terminal-shell-view">
      <div class="console-tab"><span class="console-led" aria-hidden="true"></span> recovery@haunt <span class="console-shell">game shell</span></div>
      <section class="terminal-anomaly" aria-label="Terminal recovery"><div><span class="terminal-health"></span><strong class="terminal-condition"></strong></div><code class="terminal-ghost-line"></code><div class="terminal-case-actions"><button data-enter-session>Enter looping session</button><button data-ask-status>Are you okay?</button></div></section>
      <div class="console-output" tabindex="0" role="region" aria-label="Console transcript"></div>
      <p class="console-announcement sr-only" role="status" aria-live="polite"></p>
      <form class="console-form" autocomplete="off">
        <label class="console-prompt" for="haunt-command">guest<span>@</span>haunt:~$</label>
        <span class="console-entry"><input id="haunt-command" name="command" aria-label="Game console command" data-primary placeholder=" " maxlength="200" spellcheck="false" autocapitalize="off" autocorrect="off"><i class="console-caret" aria-hidden="true"></i></span>
        <button type="submit" class="console-run">Run</button>
      </form>
      <div class="console-shortcuts" aria-label="Command shortcuts">
        <button type="button" data-command="help">help</button><button type="button" data-command="ps">ps</button><button type="button" data-command="inspect last.session">inspect session</button>
        <button type="button" class="console-open" data-open-echo>Open ECHO</button>
      </div>
      <div class="console-footer"><span class="console-process-state"></span><span>↑↓ history · Ctrl+L clear</span></div>
      </div><div class="legacy-interior" hidden></div>`;
    this.input = container.querySelector('input')!;
    this.output = container.querySelector<HTMLElement>('.console-output')!;
    this.legacyView = new LegacyView(container.querySelector<HTMLElement>('.legacy-interior')!, legacy, () => { this.showShell(); this.input.focus(); });
    const options = { signal: this.events.signal };
    container.querySelector('form')!.addEventListener('submit', event => { event.preventDefault(); this.submit(); }, options);
    container.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (button?.dataset.command) { this.input.value = button.dataset.command; this.submit(); }
      if (button?.hasAttribute('data-open-echo')) this.openEcho();
      if (button?.hasAttribute('data-enter-session')) this.showInterior();
      if (button?.hasAttribute('data-ask-status')) { this.input.value = 'ask are you okay'; this.submit(); }
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
    this.append('HAUNT recovery shell / current session', 'banner');
    this.append('An old session keeps borrowing this prompt. Try ask status or enter last.session.', 'normal');
    this.append('Type help for commands. ECHO remains available as a separate capture workshop.', 'muted');
    this.append('Commands affect this fictional desktop only.', 'muted');
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
    if (command === 'help') result.lines = [...result.lines, '', 'enter last.session     enter TERMINAL’s own execution trace', 'ask status / ask are you okay / ask who was here', 'cat last-session       read the archive you chose to keep', 'echo <text>            test whether this prompt is yours', 'restore terminal       reset only this terminal encounter'];
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
    const legacy = this.legacy.snapshot(), settled = isSettled(legacy);
    this.container.querySelector('.console-process-state')!.textContent = `last.session: ${legacy.pid ?? 'ended'} / ${legacy.health} / cycles ${legacy.cycles}`;
    this.container.dataset.terminalHealth = legacy.health;
    this.container.closest('.window')!.setAttribute('data-terminal-health', legacy.health);
    this.container.querySelector('.terminal-health')!.textContent = settled ? 'Session released' : legacy.health === 'residue' ? 'Unreleased prompt' : 'Legacy session attached';
    this.container.querySelector('.terminal-condition')!.textContent = settled ? legacy.archive ? 'The memory can stay. The loop has ended.' : 'A blank archive. A prompt of your own.' : legacy.output ? 'Something finished. It keeps coming back.' : 'The screen is quiet. The loop is not.';
    this.container.querySelector('.terminal-ghost-line')!.textContent = settled ? legacy.archive ? `archive://Mara → “${LAST_LINE}”` : 'archive://Mara → [blank]' : legacy.health === 'residue' ? '[a second caret waits without a process]' : `1987> ${legacy.output ? legacy.archive ? LAST_LINE : '[empty archive]' : '[stdout disconnected]'} ▌`;
    this.container.querySelector<HTMLElement>('[data-enter-session]')!.textContent = settled ? 'Review released session' : 'Enter looping session';
  }

  private showInterior(): void {
    this.container.querySelector<HTMLElement>('.terminal-shell-view')!.hidden = true;
    this.container.querySelector<HTMLElement>('.legacy-interior')!.hidden = false;
    this.container.closest('.window')!.classList.add('terminal-memory-open');
    this.container.querySelector<HTMLButtonElement>('[data-legacy="step"]:enabled, [data-legacy="return"]')!.focus({ preventScroll: true });
  }

  public showShell(checkIn = false): void {
    this.container.querySelector<HTMLElement>('.terminal-shell-view')!.hidden = false;
    this.container.querySelector<HTMLElement>('.legacy-interior')!.hidden = true;
    this.container.closest('.window')!.classList.remove('terminal-memory-open');
    if (checkIn) { this.input.value = 'ask are you okay'; this.submit(); }
  }

  dispose(): void { this.events.abort(); this.unsubscribe(); this.unsubscribeLegacy(); this.legacyView.dispose(); }
}
