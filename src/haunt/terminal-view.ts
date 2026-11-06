import { ProcessSession } from './process-session';

/** A bounded in-game console: text is rendered as text, never evaluated. */
export class TerminalController {
  private readonly events = new AbortController();
  private readonly input: HTMLInputElement;
  private readonly output: HTMLElement;
  private readonly history: string[] = [];
  private historyIndex = 0;
  private draft = '';
  private readonly unsubscribe: () => void;

  constructor(private readonly container: HTMLElement, private readonly session: ProcessSession, private readonly openEcho: () => void) {
    container.classList.add('terminal-console');
    container.innerHTML = `
      <div class="console-tab"><span class="console-led" aria-hidden="true"></span> recovery@haunt <span class="console-shell">game shell</span></div>
      <div class="console-output" tabindex="0" role="region" aria-label="Console transcript"></div>
      <p class="console-announcement sr-only" role="status" aria-live="polite"></p>
      <form class="console-form" autocomplete="off">
        <label class="console-prompt" for="haunt-command">guest<span>@</span>haunt:~$</label>
        <span class="console-entry"><input id="haunt-command" name="command" aria-label="Game console command" data-primary placeholder=" " maxlength="200" spellcheck="false" autocapitalize="off" autocorrect="off"><i class="console-caret" aria-hidden="true"></i></span>
        <button type="submit" class="console-run">Run</button>
      </form>
      <div class="console-shortcuts" aria-label="Command shortcuts">
        <button type="button" data-command="help">help</button><button type="button" data-command="ps">ps</button><button type="button" data-command="inspect mirror">inspect mirror</button>
        <button type="button" class="console-open" data-open-echo>Open ECHO</button>
      </div>
      <div class="console-footer"><span class="console-process-state"></span><span>↑↓ history · Ctrl+L clear</span></div>`;
    this.input = container.querySelector('input')!;
    this.output = container.querySelector<HTMLElement>('.console-output')!;
    const options = { signal: this.events.signal };
    container.querySelector('form')!.addEventListener('submit', event => { event.preventDefault(); this.submit(); }, options);
    container.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (button?.dataset.command) { this.input.value = button.dataset.command; this.submit(); }
      if (button?.hasAttribute('data-open-echo')) this.openEcho();
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
    this.append('HAUNT recovery shell / local rehearsal', 'banner');
    this.append('Two services keep one dead reflection alive. Find what restarts it.', 'normal');
    this.append('Type ps, then inspect a PID. You can also cover the monitor in ECHO.', 'muted');
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
    const result = this.session.execute(command);
    if (result.action === 'clear') this.output.replaceChildren();
    else result.lines.forEach(line => this.append(line, result.tone));
    this.container.querySelector('.console-announcement')!.textContent = result.lines.join(' ');
    this.output.scrollTop = this.output.scrollHeight;
    // Input refocus is appropriate after Run; opening ECHO must retain ECHO's focus.
    if (result.action === 'open-echo') this.openEcho();
    else this.input.focus();
  }

  private renderState(): void {
    const snapshot = this.session.snapshot();
    this.container.querySelector('.console-process-state')!.textContent = `mirror: ${snapshot.frame} / watchd: ${snapshot.supervisorRunning ? 'running' : 'stopped'}`;
  }

  dispose(): void { this.events.abort(); this.unsubscribe(); }
}
