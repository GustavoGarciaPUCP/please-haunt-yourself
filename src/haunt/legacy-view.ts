import { LegacySession, LAST_LINE, isSettled, type LegacyLink } from './legacy-session';

/** An execution trace inside TERMINAL, never a second game window. */
export class LegacyView {
  private readonly unsubscribe: () => void;
  private readonly events = new AbortController();
  constructor(private readonly container: HTMLElement, private readonly session: LegacySession, private readonly returnToShell: () => void) {
    container.innerHTML = `<header class="legacy-heading"><span class="legacy-source">TERMINAL / last.session</span><button data-legacy="return">Return to prompt</button></header>
      <div class="legacy-title"><p>31 OCT 1987 · session recovered</p><h3>The line that would not end.</h3><p>A command can stop. Its exit can still call it back.</p></div>
      <div class="legacy-program"><span>retained program / BASIC</span><code>10 PRINT "I'LL FINISH IN A MINUTE."<br>20 END</code><p>The exit callback below belongs to the shell, not to this old program.</p></div>
      <div class="legacy-circuit" aria-label="Three separate connections in the legacy session">
        <svg class="legacy-wires" viewBox="0 0 600 70" aria-hidden="true"><path class="wire-archive" d="M100 2v26H300v40"/><path class="wire-output" d="M300 2v66"/><path class="wire-restart" d="M500 2v26H300"/><circle class="legacy-pulse" r="5" cy="28" cx="300"/></svg>
        <div class="legacy-nodes">
          <article data-link-card="archive"><span class="legacy-port">history://Mara</span><h4>The last line</h4><p class="legacy-memory"></p><button data-link="archive"></button></article>
          <article data-link-card="output"><span class="legacy-port">stdout → screen</span><h4>The speaker</h4><p>Shows what the old command prints.</p><button data-link="output"></button></article>
          <article data-link-card="restart"><span class="legacy-port">on_exit → RUN</span><h4>The return call</h4><p>Schedules a copy after this one ends.</p><button data-link="restart"></button></article>
        </div>
      </div>
      <div class="legacy-watch"><span class="legacy-execution"></span><p class="legacy-trace" role="status" aria-live="polite"></p></div>
      <div class="legacy-controls"><button data-legacy="step">Step execution</button><button data-legacy="term" class="legacy-primary">Send TERM</button><button data-legacy="kill">Force KILL</button><button data-legacy="resume" hidden>Resume residue</button><button data-legacy="undo">Undo</button></div>
      <p class="legacy-hint">Step to see the path. Changing a connection affects its next execution. You can return or undo at any time.</p>`;
    container.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      if (button.dataset.link) session.toggle(button.dataset.link as LegacyLink);
      switch (button.dataset.legacy) {
        case 'return': this.returnToShell(); break;
        case 'step': session.step(); break;
        case 'term': session.terminate(); break;
        case 'kill': session.terminate(true); break;
        case 'resume': session.resumeResidue(); break;
        case 'undo': session.undo(); break;
      }
    }, { signal: this.events.signal });
    this.unsubscribe = session.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    const state = this.session.snapshot(), settled = isSettled(state);
    this.container.dataset.health = state.health;
    this.container.dataset.phase = String(state.phase);
    for (const link of ['archive', 'output', 'restart'] as const) {
      const node = this.container.querySelector<HTMLElement>(`[data-link-card="${link}"]`)!;
      node.dataset.connected = String(state[link]);
      const button = node.querySelector('button')!;
      button.disabled = settled;
      button.textContent = link === 'archive' ? state.archive ? 'Discard saved line' : 'Restore saved line' : state[link] ? 'Disconnect' : 'Reconnect';
      button.setAttribute('aria-label', `${button.textContent} ${link === 'archive' ? '' : link}`.trim());
      this.container.querySelector(`.wire-${link}`)!.classList.toggle('wire-cut', !state[link]);
    }
    this.container.querySelector('.legacy-memory')!.textContent = state.archive ? `“${LAST_LINE}”` : '[A blank archive]';
    this.container.querySelector('.legacy-program code')!.innerHTML = state.archive ? '10 PRINT "I\'LL FINISH IN A MINUTE."<br>20 END' : '10 PRINT ""<br>20 END';
    this.container.querySelector('.legacy-execution')!.textContent = `PID ${state.pid ?? 'ended'} / cycles ${state.cycles} / ${state.health}`;
    const trace = this.container.querySelector('.legacy-trace')!;
    if (trace.textContent !== state.trace) trace.textContent = state.trace;
    for (const action of ['step', 'term', 'kill']) this.container.querySelector<HTMLButtonElement>(`[data-legacy="${action}"]`)!.disabled = state.pid === null || settled;
    this.container.querySelector<HTMLButtonElement>('[data-legacy="undo"]')!.disabled = !this.session.canUndo();
    this.container.querySelector<HTMLButtonElement>('[data-legacy="resume"]')!.hidden = state.health !== 'residue';
    this.container.querySelector('.legacy-hint')!.textContent = settled ? 'The session has ended. Return to the prompt and ask how TERMINAL is doing.' : 'Step to see the path. Changing a connection affects its next execution. You can return or undo at any time.';
  }
  dispose(): void { this.events.abort(); this.unsubscribe(); }
}
