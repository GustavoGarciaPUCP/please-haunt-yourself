import { LegacySession, LAST_LINE, isSettled, type LegacyLink } from './legacy-session';
import { BELL_ICON, DOORWAY, MOON, NOTE_ICON, SCENE_BELL, SPECTER, WHISPER_ICON } from './specter-art';
import { ghostPose, hauntingNarration, interiorHint, justRang, objectCopy, times, whisperText } from './haunting-presentation';
import { prefersReducedMotion, writeGhostly } from './ghost-writing';
import { terminalBell } from './terminal-bell';

const LINKS: readonly LegacyLink[] = ['archive', 'output', 'restart'];
const OBJECT_NAMES: Record<LegacyLink, string> = { archive: 'Mara’s note', output: 'The whisper', restart: 'The bell' };
const OBJECT_ICONS: Record<LegacyLink, string> = { archive: NOTE_ICON, output: WHISPER_ICON, restart: BELL_ICON };
/** The ghost reaches the doorway at this point of its recall, so the bell swings (and chimes) then. */
const RING_DELAY_MS = 460;
const BELL_SWING: Keyframe[] = ['0deg', '17deg', '-13deg', '8deg', '-4deg', '0deg'].map(angle => ({ transform: `rotate(${angle})` }));

/**
 * TERMINAL's own haunted session, drawn inside the same window as the prompt. It reads the shared
 * LegacySession snapshot only; every pose, word and label below is derived from that state.
 */
export class LegacyView {
  private readonly unsubscribe: () => void;
  private readonly events = new AbortController();
  private lastCycles: number;
  private whisper = { text: '', event: '', entry: -1 };
  private entry = 0;
  private undone = false;

  constructor(private readonly container: HTMLElement, private readonly session: LegacySession, private readonly returnToShell: () => void) {
    container.innerHTML = `<header class="legacy-heading"><span class="legacy-source">TERMINAL · inside the haunted session</span>
        <span class="legacy-heading-actions"><button type="button" class="bell-sound" data-bell-sound aria-pressed="false">Bell sound <span class="bell-sound-state" aria-hidden="true">off</span></button><button type="button" data-legacy="return">Back to the prompt</button></span></header>
      <div class="haunt-intro"><p class="haunt-kicker">Halloween night, 31 October 1987 · Mara’s last session</p><h3>The farewell that would not end.</h3>
        <p class="haunt-lede">Something here keeps saying goodbye and coming back. Watch it, change one thing, and see what changes.</p></div>
      <div class="spectral-scene" aria-hidden="true">
        <span class="scene-moon">${MOON}</span>
        <p class="scene-whisper"></p>
        <div class="scene-note"><span class="scene-note-line">${LAST_LINE}</span><span class="scene-note-sign">— Mara, 31 Oct 1987</span></div>
        <div class="scene-door">${DOORWAY}<span class="scene-door-label">the way out</span></div>
        <div class="scene-bell">${SCENE_BELL}<span class="scene-bell-count"></span></div>
        <div class="scene-ghost">${SPECTER}</div>
      </div>
      <p class="haunt-narration" role="status" aria-live="polite"></p>
      <div class="haunt-objects" role="group" aria-label="Things you can change">${LINKS.map(link => `
        <article class="haunt-object" data-object="${link}"><span class="object-icon">${OBJECT_ICONS[link]}</span>
          <div class="object-copy"><h4>${OBJECT_NAMES[link]}</h4><p class="object-state"></p></div><button type="button" data-link="${link}"></button></article>`).join('')}
      </div>
      <div class="legacy-controls" role="group" aria-label="What happens next">
        <button type="button" data-legacy="step" class="legacy-primary">Watch the next moment</button><button type="button" data-legacy="term">Guide it out</button>
        <button type="button" data-legacy="kill" class="legacy-force">Force it out</button><button type="button" data-legacy="resume" hidden>Call the shadow back</button><button type="button" data-legacy="undo">Undo</button>
      </div>
      <p class="legacy-hint"></p>
      <details class="under-hood"><summary>Under the hood <span>optional · the same story in terminal terms</span></summary>
        <dl class="hood-map">
          <div><dt>Mara’s note</dt><dd>the saved session text, <code>history://Mara</code>: <span data-hood="archive"></span></dd></div>
          <div><dt>The whisper</dt><dd>the old program’s output, <code>stdout → screen</code>: <span data-hood="output"></span></dd></div>
          <div><dt>The bell</dt><dd>an exit callback, <code>on_exit → RUN last.session</code>, starts a new copy whenever one ends: <span data-hood="restart"></span></dd></div>
          <div><dt>Guide it out</dt><dd><code>kill -TERM &lt;pid&gt;</code> asks the current copy for a clean exit</dd></div>
          <div><dt>Force it out</dt><dd><code>kill -KILL &lt;pid&gt;</code> skips its clean-up and leaves residue</dd></div>
        </dl>
        <div class="legacy-program"><span>retained program / BASIC</span><code></code></div>
        <div class="legacy-watch"><span class="legacy-execution"></span><p class="legacy-trace"></p></div>
        <p class="hood-commands">At the prompt you can also type <code>enter last.session</code>, <code>ask status</code>, <code>cat last-session</code>, <code>kill -TERM &lt;pid&gt;</code>, <code>echo &lt;text&gt;</code> or <code>restore terminal</code>.</p>
      </details>`;
    container.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('button');
      if (!button || button.disabled || !container.contains(button)) return;
      if (button.hasAttribute('data-bell-sound')) { terminalBell.setEnabled(!terminalBell.enabled); this.renderSound(); return; }
      if (button.dataset.link) session.toggle(button.dataset.link as LegacyLink);
      switch (button.dataset.legacy) {
        case 'return': this.returnToShell(); return;
        case 'step': session.step(); break;
        case 'term': session.terminate(); break;
        case 'kill': session.terminate(true); break;
        case 'resume': session.resumeResidue(); break;
        case 'undo': if (session.canUndo()) { this.undone = true; session.undo(); } break;
      }
      this.keepFocus(button);
    }, { signal: this.events.signal });
    this.lastCycles = session.snapshot().cycles;
    this.unsubscribe = session.subscribe(() => this.render());
    this.renderSound();
    this.render();
  }

  /** Called when the window switches from the prompt into this room; the ghost writes its words once. */
  entered(): void {
    this.entry++;
    this.container.scrollTop = 0;
    this.render();
  }

  private button(name: string): HTMLButtonElement { return this.container.querySelector<HTMLButtonElement>(`[data-legacy="${name}"]`)!; }

  /** A pressed button that became unavailable must not strand keyboard focus on the page body. */
  private keepFocus(pressed: HTMLButtonElement): void {
    if (!pressed.disabled && !pressed.hidden) return;
    const resume = this.button('resume'), step = this.button('step');
    (!resume.hidden ? resume : !step.disabled ? step : this.button('return')).focus();
  }

  private renderSound(): void {
    const toggle = this.container.querySelector<HTMLButtonElement>('[data-bell-sound]')!;
    toggle.hidden = !terminalBell.supported;
    toggle.setAttribute('aria-pressed', String(terminalBell.enabled));
    toggle.querySelector('.bell-sound-state')!.textContent = terminalBell.enabled ? 'on' : 'off';
  }

  private render(): void {
    const state = this.session.snapshot(), settled = isSettled(state), c = this.container;
    const visible = !c.hidden, still = prefersReducedMotion();
    const rang = state.cycles > this.lastCycles && state.moment === 'recalled';
    this.lastCycles = state.cycles;
    const ghost = c.querySelector<HTMLElement>('.scene-ghost')!;
    const fromLeft = rang && visible && !still ? getComputedStyle(ghost).left : null;
    Object.assign(c.dataset, {
      health: state.health, phase: String(state.phase), moment: state.moment, pose: ghostPose(state), rang: String(justRang(state)),
      whisper: state.output ? 'on' : 'off', note: state.archive ? 'kept' : 'faded', bell: state.restart ? 'armed' : 'quiet',
    });

    // The whisper is written when the ghost speaks, when its words change, or when the player walks in.
    const text = whisperText(state);
    const event = state.moment === 'voice' && state.output ? `voice-${state.cycles}` : '';
    const animate = visible && text !== '' && (text !== this.whisper.text || (event !== '' && event !== this.whisper.event) || this.entry !== this.whisper.entry);
    if (animate || text !== this.whisper.text) writeGhostly(c.querySelector<HTMLElement>('.scene-whisper')!, text, animate);
    this.whisper = { text, event, entry: this.entry };
    c.querySelector('.scene-bell-count')!.textContent = state.cycles ? `rang ${times(state.cycles)}` : '';

    const copy = objectCopy(state);
    for (const link of LINKS) {
      const card = c.querySelector<HTMLElement>(`[data-object="${link}"]`)!;
      card.dataset.on = String(state[link]);
      card.querySelector('.object-state')!.textContent = copy[link].state;
      const toggle = card.querySelector('button')!;
      toggle.textContent = copy[link].action;
      toggle.disabled = settled;
      c.querySelector(`[data-hood="${link}"]`)!.textContent = link === 'archive' ? state.archive ? 'retained' : 'blank' : state[link] ? 'connected' : 'disconnected';
    }

    const narration = `${this.undone ? 'Undone. ' : ''}${hauntingNarration(state)}`;
    this.undone = false;
    const live = c.querySelector('.haunt-narration')!;
    if (live.textContent !== narration) live.textContent = narration;
    for (const action of ['step', 'term', 'kill']) this.button(action).disabled = state.pid === null || settled;
    this.button('undo').disabled = !this.session.canUndo();
    this.button('resume').hidden = state.health !== 'residue';
    c.querySelector('.legacy-hint')!.textContent = interiorHint(state);

    // Under the hood: the same state in the terminal's own terms. Deliberately not a live region.
    c.querySelector('.legacy-program code')!.innerHTML = state.archive ? '10 PRINT "I\'LL FINISH IN A MINUTE."<br>20 END' : '10 PRINT ""<br>20 END';
    c.querySelector('.legacy-execution')!.textContent = `PID ${state.pid ?? 'ended'} / cycles ${state.cycles} / ${state.health}`;
    const trace = c.querySelector('.legacy-trace')!;
    if (trace.textContent !== state.trace) trace.textContent = state.trace;

    if (!rang) return;
    terminalBell.ring(RING_DELAY_MS / 1000);
    if (!visible || still) return;
    c.querySelector('.bell-swing')?.animate(BELL_SWING, { duration: 1000, delay: RING_DELAY_MS, easing: 'ease-out' });
    if (fromLeft) ghost.animate([{ left: fromLeft }, { left: '76%', opacity: 0.7, offset: 0.42 }, { left: '50%' }], { duration: 1150, easing: 'ease-in-out' });
  }

  dispose(): void { this.events.abort(); this.unsubscribe(); }
}
