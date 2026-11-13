import { LegacySession, NOTE_SIGN, NOTE_START, type LegacyEvent, type LegacySnapshot } from './legacy-session';
import { CALL_CORD, DOORWAY, SCENE_BELL, presenceMarkup } from './specter-art';
import {
  OBJECTS, OBJECT_CHIPS, OBJECT_TITLES, figurePose, objectCopy, primaryAction, recordedClock, sessionHint, sessionNarration, times, whisperText, type RoomObject,
} from './haunting-presentation';
import { onReducedMotionChange, prefersReducedMotion, writeGhostly } from './ghost-writing';
import { terminalBell } from './terminal-bell';
import { CueSet } from './terminal-cues';
import { scrollRegion } from './scroll-region';

/** Events after which an earlier cue no longer tells the truth. Bell changes keep a running cue: it already rang. */
const SUPERSEDING = new Set<LegacyEvent['kind']>(['undo', 'reset', 'observe', 'step', 'term', 'kill', 'resume', 'finish']);
const RINGS = new Set<LegacyEvent['kind']>(['observe', 'step', 'term', 'kill']);
const SWING: Keyframe[] = ['0deg', '17deg', '-13deg', '8deg', '-4deg', '0deg'].map(angle => ({ transform: `rotate(${angle})` }));
const THUD: Keyframe[] = ['0deg', '7deg', '-4deg', '0deg'].map(angle => ({ transform: `rotate(${angle})` }));
const NOTE_GLOW: Keyframe[] = [{ boxShadow: '0 6px 14px #000a' }, { boxShadow: '0 0 0 2px #f0c47a99, 0 0 26px #f0c47a55, 0 8px 18px #000a', offset: 0.35 }, { boxShadow: '0 6px 14px #000a' }];
/** Poses the choreography passes through; final poses are owned by CSS so a cancelled cue lands exactly on them. */
const POSE = {
  note: { left: '36%', transform: 'rotate(-6deg)', opacity: 0.92 },
  write: { left: '46%', transform: 'translateY(-4px) scale(1.03)', opacity: 0.92 },
  door: { left: '74%', transform: 'scale(0.94)', opacity: 0.85 },
  center: { left: '52%', transform: 'none', opacity: 0.92 },
  front: { left: '56%', transform: 'translateY(-3%) scale(1.32)', opacity: 0.5 },
} as const;
type Beat = { at: number; pose: Keyframe };
type Page = 'narration' | 'object' | 'hint' | 'hood';
let instances = 0;

/**
 * TERMINAL's own session (.kiro/specs/os-case-v4 R3.2): a pane in the same program as the prompt. The scene's objects
 * are buttons; selecting one shows its state and actions in the inspector slot, which always stays in view (beside the
 * scene when the window is wide, under it with a fixed height otherwise). Every pose, word and label is derived from the
 * shared LegacySession; script-started motion is owned and cancelled when it stops being true.
 */
export class LegacyView {
  private readonly unsubscribe: () => void;
  private readonly events = new AbortController();
  private readonly cues = new CueSet();
  private readonly id = `session-${++instances}`;
  private previous: LegacySnapshot;
  private lastEventId: number;
  private ringing = false;
  private selected: RoomObject | null = null;
  private page: Page = 'narration';
  private explicit = false;
  private entry = 0;
  private whisper = { text: '', entry: -1 };
  private whisperTimer = 0;
  private clockFrame = 0;
  private undone = false;

  constructor(private readonly container: HTMLElement, private readonly session: LegacySession, private readonly detach: () => void) {
    const id = this.id;
    container.classList.add('session-pane');
    container.innerHTML = `<header class="pane-header">
        <span class="pane-title"><span class="pane-led" aria-hidden="true"></span>last.session</span>
        <span class="pane-clock" title="The session’s own recorded time, not this desk’s clock"><span class="pane-clock-label">recorded</span>
          <span class="pane-clock-date"></span> <time class="pane-clock-time"></time></span>
        <button type="button" class="pane-detach" data-legacy="detach">Back to the prompt</button>
      </header>
      <div class="pane-body">
        <div class="session-scene" role="group" aria-label="Inside last.session. Select the note, the figure, the bell or the way out to inspect it.">
          <span class="scene-cord" aria-hidden="true">${CALL_CORD}</span>
          <p class="scene-whisper" aria-hidden="true"></p>
          <button type="button" class="scene-object scene-note" data-object="note" aria-pressed="false" aria-controls="${id}-inspector"><span class="scene-note-line" aria-hidden="true">${NOTE_START.replace('—', '\u2060—')}</span><span class="scene-note-sign" aria-hidden="true">${NOTE_SIGN}</span><span class="object-chip">${OBJECT_CHIPS.note}</span></button>
          <button type="button" class="scene-object scene-figure" data-object="figure" aria-pressed="false" aria-controls="${id}-inspector">${presenceMarkup()}<span class="object-chip">${OBJECT_CHIPS.figure}</span></button>
          <button type="button" class="scene-object scene-bell" data-object="bell" aria-pressed="false" aria-controls="${id}-inspector">${SCENE_BELL}<span class="scene-bell-count" aria-hidden="true"></span><span class="object-chip">${OBJECT_CHIPS.bell}</span></button>
          <button type="button" class="scene-object scene-door" data-object="door" aria-pressed="false" aria-controls="${id}-inspector">${DOORWAY}<span class="object-chip">${OBJECT_CHIPS.door}</span></button>
        </div>
        <section class="inspector" id="${id}-inspector" aria-labelledby="${id}-inspector-title">
          <div class="inspector-head"><h4 class="inspector-title" id="${id}-inspector-title"></h4>
            <button type="button" class="inspector-close" data-close aria-label="Close the inspector">${'×'}</button></div>
          <div class="inspector-body"><p class="inspector-quote"></p><p class="inspector-text"></p></div>
          <div class="inspector-actions">
            <button type="button" data-room="muffle"></button><button type="button" data-room="call"></button>
            <button type="button" class="is-danger" data-legacy="kill">Force it out</button>
            <button type="button" data-hint-explicit>Tell me exactly</button>
          </div>
        </section>
        <section class="hood-page" aria-labelledby="${id}-hood-title" hidden>
          <div class="inspector-head"><h4 id="${id}-hood-title">Under the hood <span>the same story in terminal terms</span></h4>
            <button type="button" class="inspector-close" data-hood-close aria-label="Close Under the hood">${'×'}</button></div>
          <dl class="hood-map">
            <div><dt>Mara’s note</dt><dd>the job’s payload, <code>job://mara-1987-10-31</code>: a picture and a note, never delivered</dd></div>
            <div><dt>The figure</dt><dd>the current run of <code>last.session</code>: <span data-hood="run"></span></dd></div>
            <div><dt>The cord</dt><dd>automatic retry, <code>on_finish(no receipt) → RETRY</code>: <span data-hood="retry"></span></dd></div>
            <div><dt>The bell</dt><dd>a notifier, <code>on_retry → BELL</code>; it reports a retry and never causes one: <span data-hood="bell"></span></dd></div>
            <div><dt>Force it out</dt><dd><code>kill -KILL &lt;pid&gt;</code> skips the end of the minute</dd></div>
            <div><dt>Finish</dt><dd><code>ACK receipt</code> from POSTMAN for this request closes the job</dd></div>
          </dl>
          <div class="legacy-program"><span>retained program / BASIC</span><code>10 PRINT "I'LL FINISH IN A MINUTE."<br>20 WRITE NOTE TO GLASS<br>30 IF NOT DELIVERED THEN RETRY</code></div>
          <div class="legacy-watch"><span class="legacy-execution"></span><p class="legacy-trace"></p><button type="button" data-legacy="step">Step one moment</button></div>
          <p class="hood-commands">At the prompt you can also type <code>ps</code>, <code>jobs</code>, <code>ask status</code>, <code>cat last.job</code>, <code>kill -TERM &lt;pid&gt;</code>, <code>echo &lt;text&gt;</code> or <code>finish</code>.</p>
        </section>
        <p class="pane-live sr-only" role="status" aria-live="polite"></p>
      </div>
      <footer class="pane-footer">
        <button type="button" class="pane-primary" data-main-action></button>
        <button type="button" data-legacy="undo">Undo</button>
        <span class="pane-footer-gap"></span>
        <button type="button" data-hint aria-pressed="false">Hint</button>
        <button type="button" data-hood aria-pressed="false">Under the hood</button>
      </footer>`;
    const signal = this.events.signal;
    container.addEventListener('click', event => this.handle(event), { signal });
    container.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || (this.page === 'narration' && !this.selected)) return;
      event.preventDefault();
      event.stopPropagation();
      this.closeInspector();
    }, { signal });
    // A live switch to reduced motion stops every running cue at its final pose; the evidence (ring marks, tally) stays.
    onReducedMotionChange(() => { if (prefersReducedMotion()) this.stopMotion(); this.render(); }, signal);
    this.previous = session.snapshot();
    this.lastEventId = session.lastEvent().id;
    // In a short window the inspector's text and Under the hood scroll; they are then keyboard regions (playability-v5 R3).
    const regions = [scrollRegion(container.querySelector<HTMLElement>('.inspector-body')!, 'Inspector text'), scrollRegion(container.querySelector<HTMLElement>('.hood-page')!, 'Under the hood')];
    const stop = session.subscribe(() => this.render());
    this.unsubscribe = () => { stop(); regions.forEach(dispose => dispose()); };
    this.render();
  }

  private handle(event: MouseEvent): void {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled || !this.container.contains(button)) return;
    const object = button.dataset.object as RoomObject | undefined;
    if (object) { this.select(this.selected === object && this.page === 'object' ? null : object); return; }
    if (button.hasAttribute('data-close')) { this.closeInspector(); return; }
    if (button.hasAttribute('data-hood-close')) { this.page = 'narration'; this.render(); this.container.querySelector<HTMLButtonElement>('[data-hood]')!.focus(); return; }
    if (button.hasAttribute('data-hint')) { this.page = this.page === 'hint' ? 'narration' : 'hint'; this.explicit = false; this.selected = null; this.render(); return; }
    if (button.hasAttribute('data-hint-explicit')) { this.explicit = true; this.render(); return; }
    if (button.hasAttribute('data-hood')) { this.page = this.page === 'hood' ? 'narration' : 'hood'; this.selected = null; this.render(); return; }
    if (button.dataset.room === 'muffle') { this.session.toggleMuffle(); this.keepFocus(button); return; }
    if (button.dataset.room === 'call') { this.session.toggleRetry(); this.keepFocus(button); return; }
    const intent = button.hasAttribute('data-main-action') ? primaryAction(this.session.snapshot()).intent : button.dataset.legacy;
    switch (intent) {
      case 'detach': this.leave(); this.detach(); return;
      case 'observe': this.session.observe(); break;
      case 'resume': this.session.resumeResidue(); break;
      case 'step': this.session.step(); break;
      case 'kill': this.session.terminate(true); break;
      case 'undo': if (this.session.canUndo()) { this.undone = true; this.session.undo(); } break;
    }
    this.keepFocus(button);
  }

  /** The window switched from the prompt into this pane; the figure writes its words once. */
  entered(): void { this.entry++; this.render(); }

  /** Leaving the pane or minimizing: no cue keeps moving or sounding out of sight. */
  leave(): void {
    this.settle();
    this.selected = null;
    this.page = 'narration';
    this.explicit = false;
  }

  private closeInspector(): void {
    const was = this.selected, page = this.page;
    this.selected = null;
    this.page = 'narration';
    this.explicit = false;
    this.render();
    const target = was ? this.container.querySelector<HTMLButtonElement>(`[data-object="${was}"]`)
      : page === 'hint' ? this.container.querySelector<HTMLButtonElement>('[data-hint]') : page === 'hood' ? this.container.querySelector<HTMLButtonElement>('[data-hood]') : null;
    target?.focus();
  }

  /** Stops script motion and lands on the current state. Used alone for a live reduced-motion switch. */
  private stopMotion(): void {
    this.cues.cancel();
    window.clearTimeout(this.whisperTimer);
    cancelAnimationFrame(this.clockFrame);
    this.clockFrame = 0;
    const whisper = this.container.querySelector<HTMLElement>('.scene-whisper')!;
    if (whisper.querySelector('.ghost-letter') || this.whisper.text !== whisper.textContent) writeGhostly(whisper, this.whisper.text, false);
    this.container.style.removeProperty('--ring-delay');
    this.renderClock(this.session.snapshot());
  }

  /** The cue no longer tells the truth (Undo, reset, a newer event, leaving): stop its motion, its chime and its ring marks. */
  private settle(): void {
    this.stopMotion();
    terminalBell.silence();
    this.ringing = false;
  }

  private select(object: RoomObject | null): void {
    this.selected = object;
    this.page = object ? 'object' : 'narration';
    this.explicit = false;
    this.render();
  }
  private button(name: string): HTMLButtonElement { return this.container.querySelector<HTMLButtonElement>(`[data-legacy="${name}"]`)!; }

  /** A pressed button that became unavailable must not strand keyboard focus on the page body. */
  private keepFocus(pressed: HTMLButtonElement): void {
    if (!pressed.disabled && !pressed.hidden && !pressed.closest('[hidden]')) return;
    const main = this.container.querySelector<HTMLButtonElement>('[data-main-action]')!;
    (main.disabled ? this.container.querySelector<HTMLButtonElement>('.pane-detach')! : main).focus();
  }

  private renderClock(state: LegacySnapshot, seconds?: number): void {
    const clock = recordedClock(state);
    this.container.querySelector('.pane-clock-date')!.textContent = clock.date;
    const time = this.container.querySelector<HTMLElement>('.pane-clock-time')!;
    time.textContent = clock.ended ? clock.time : `${clock.time}:${String(seconds ?? 0).padStart(2, '0')}`;
    time.dataset.ended = String(clock.ended);
  }

  /** The recorded minute runs only during an attempt, quickly: nobody waits for it. */
  private runClock(until: number, state: LegacySnapshot): void {
    cancelAnimationFrame(this.clockFrame);
    const start = performance.now(), before = { ...state, presence: 'terminal' as const };
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / Math.max(1, until));
      if (t < 1) { this.renderClock(before, Math.floor(t * 59)); this.clockFrame = requestAnimationFrame(tick); return; }
      this.clockFrame = 0;
      this.renderClock(this.session.snapshot());
    };
    this.clockFrame = requestAnimationFrame(tick);
  }

  private render(): void {
    const state = this.session.snapshot(), event = this.session.lastEvent(), c = this.container;
    const fresh = event.id !== this.lastEventId;
    this.lastEventId = event.id;
    const visible = !c.hidden && !c.closest('[hidden]'), still = prefersReducedMotion();
    const figure = c.querySelector<HTMLElement>('.scene-figure')!;
    // Read where the figure is actually drawn before stale motion is cancelled, so a new cue starts without a jump.
    const from = fresh && visible && !still ? getComputedStyle(figure).left : null;
    if (fresh && SUPERSEDING.has(event.kind)) this.settle();
    if (fresh) delete c.dataset.impressDelay;
    const ring = fresh && state.moment === 'recalled' && RINGS.has(event.kind);
    if (ring && !state.muffled) this.ringing = true;
    Object.assign(c.dataset, {
      presence: state.presence, phase: String(state.phase), moment: state.moment, pose: figurePose(state), rang: String(this.ringing),
      bell: state.retry ? 'armed' : 'stopped', muffled: String(state.muffled), selected: this.selected ?? 'none', page: this.page,
    });
    c.querySelector('.scene-bell-count')!.textContent = state.attempts ? `back ${times(state.attempts)}` : '';
    figure.querySelector('.object-chip')!.textContent = state.presence === 'shadow' ? 'Shadow' : OBJECT_CHIPS.figure;
    for (const object of OBJECTS) c.querySelector(`[data-object="${object}"]`)!.setAttribute('aria-pressed', String(this.selected === object && this.page === 'object'));
    const gone = state.presence === 'glass' || state.presence === 'released';

    // Choreography for this event (never replayed for Undo/reset and skipped with reduced motion).
    let ringAt = 0, writeAt = -1, length = 0;
    if (fresh && visible && !still && from) ({ ringAt, writeAt, length } = this.choreograph(event.kind, this.previous, state, from, ring));
    if (ring) {
      c.style.setProperty('--ring-delay', `${still ? 0 : ringAt}ms`);
      if (!state.muffled) terminalBell.ring(ringAt / 1000);
    }
    if (length > 0) this.runClock(ringAt || length, state);
    else if (!this.clockFrame) this.renderClock(state);

    const text = whisperText(state, fresh ? event : undefined);
    const whisper = c.querySelector<HTMLElement>('.scene-whisper')!;
    if (writeAt >= 0) {
      // The figure writes the start of the note mid-attempt, then the minute's outcome replaces it.
      writeGhostly(whisper, NOTE_START, true, writeAt);
      window.clearTimeout(this.whisperTimer);
      this.whisperTimer = window.setTimeout(() => writeGhostly(whisper, text, text !== ''), ringAt + 150);
    } else if (text !== this.whisper.text || this.entry !== this.whisper.entry || (fresh && event.line)) {
      writeGhostly(whisper, text, visible && text !== '' && !(fresh && event.kind === 'undo'));
    }
    this.whisper = { text, entry: this.entry };

    const narration = `${this.undone ? 'Undone. ' : ''}${sessionNarration(state)}`;
    this.undone = false;
    const live = c.querySelector('.pane-live')!;
    if (live.textContent !== narration) live.textContent = narration;
    this.renderInspector(state, narration);

    const main = primaryAction(state), mainButton = c.querySelector<HTMLButtonElement>('[data-main-action]')!;
    mainButton.textContent = main.label;
    mainButton.dataset.legacy = main.intent;
    this.button('undo').disabled = !this.session.canUndo();
    c.querySelector('[data-hint]')!.setAttribute('aria-pressed', String(this.page === 'hint'));
    c.querySelector('[data-hood]')!.setAttribute('aria-pressed', String(this.page === 'hood'));
    // Once the footer's main action is the way back, the header does not repeat it.
    c.querySelector<HTMLButtonElement>('.pane-detach')!.hidden = main.intent === 'detach';

    // Under the hood: the same state in the terminal's own terms. Deliberately not a live region.
    c.querySelector('[data-hood="run"]')!.textContent = state.pid === null ? gone ? 'finished; nothing is running' : 'stopped by force' : `PID ${state.pid}`;
    c.querySelector('[data-hood="retry"]')!.textContent = state.retry ? 'on' : 'off';
    c.querySelector('[data-hood="bell"]')!.textContent = state.muffled ? 'muffled' : 'ringing';
    c.querySelector('.legacy-execution')!.textContent = `PID ${state.pid ?? 'none'} / returns ${state.attempts} / ${state.presence}`;
    const trace = c.querySelector('.legacy-trace')!;
    if (trace.textContent !== state.trace) trace.textContent = state.trace;
    this.button('step').disabled = state.presence !== 'terminal';
    this.previous = state;
  }

  private renderInspector(state: LegacySnapshot, narration: string): void {
    const c = this.container, inspector = c.querySelector<HTMLElement>('.inspector')!, hood = c.querySelector<HTMLElement>('.hood-page')!;
    const selected = this.page === 'object' ? this.selected : null;
    hood.hidden = this.page !== 'hood';
    inspector.hidden = this.page === 'hood';
    inspector.dataset.page = this.page;
    const copy = objectCopy(state), before = state.presence !== 'glass' && state.presence !== 'released';
    const title = c.querySelector('.inspector-title')!, quote = c.querySelector<HTMLElement>('.inspector-quote')!, text = c.querySelector('.inspector-text')!;
    const close = inspector.querySelector<HTMLButtonElement>('[data-close]')!;
    close.hidden = this.page === 'narration';
    if (selected) {
      inspector.dataset.inspecting = selected;
      title.textContent = OBJECT_TITLES[selected];
      quote.textContent = copy[selected].quote;
      text.textContent = copy[selected].state;
    } else if (this.page === 'hint') {
      delete inspector.dataset.inspecting;
      title.textContent = this.explicit ? 'Hint · exactly' : 'Hint';
      quote.textContent = '';
      text.textContent = sessionHint(state, this.explicit);
    } else {
      delete inspector.dataset.inspecting;
      title.textContent = 'What is happening';
      quote.textContent = '';
      text.textContent = narration;
    }
    quote.hidden = quote.textContent === '';
    const muffle = inspector.querySelector<HTMLButtonElement>('[data-room="muffle"]')!, call = inspector.querySelector<HTMLButtonElement>('[data-room="call"]')!;
    muffle.hidden = call.hidden = selected !== 'bell' || !before;
    muffle.textContent = copy.muffle;
    call.textContent = copy.call;
    const force = this.button('kill');
    force.hidden = selected !== 'door' || state.presence !== 'terminal';
    const explicit = inspector.querySelector<HTMLButtonElement>('[data-hint-explicit]')!;
    explicit.hidden = this.page !== 'hint' || this.explicit;
    const actions = inspector.querySelector<HTMLElement>('.inspector-actions')!;
    actions.hidden = [muffle, call, force, explicit].every(button => button.hidden);
  }

  /** One owned timeline per event. Final poses come from CSS, so cancelling at any moment lands on the true state. */
  private choreograph(kind: LegacyEvent['kind'], before: LegacySnapshot, after: LegacySnapshot, from: string, ring: boolean): { ringAt: number; writeAt: number; length: number } {
    const c = this.container, figure = c.querySelector<HTMLElement>('.scene-figure')!;
    const beats: Beat[] = [{ at: 0, pose: { left: from } }];
    let t = 0, writeAt = -1;
    const finishing = kind === 'observe' || (kind === 'step' && (after.moment === 'recalled' || after.moment === 'impressed'));
    if (kind === 'observe') {
      if (before.phase === 0) {
        this.cues.play(c.querySelector('.scene-note'), NOTE_GLOW, { duration: 900 });
        beats.push({ at: 500, pose: POSE.note }, { at: 700, pose: POSE.note });
        t = 700;
      }
      if (before.phase <= 1) {
        writeAt = t + 150;
        beats.push({ at: t + 300, pose: POSE.write }, { at: t + 1100, pose: POSE.write });
        t += 1100;
      }
    }
    const forcedBack = (kind === 'term' || kind === 'kill') && after.moment === 'recalled';
    if (!finishing && !forcedBack) return { ringAt: 0, writeAt: -1, length: 0 };
    if (after.presence === 'glass') {
      // This time nothing calls it back: it comes forward to the glass and leaves the window. The desktop's reveal
      // starts as it reaches the front (data-impress-delay), so the hand presses on the glass when the figure does.
      // The settled CSS pose hides the figure; the cue keeps it visible until it has walked into the glass.
      const forward = t;
      beats.push({ at: t + 600, pose: POSE.front }, { at: t + 900, pose: { ...POSE.front, opacity: 0 } });
      t += 900;
      this.cues.play(figure, beats.map(beat => ({ ...beat.pose, visibility: 'visible', offset: beat.at / t })), { duration: t, easing: 'ease-in-out' });
      c.style.setProperty('--impress-delay', `${t}ms`);
      c.dataset.impressDelay = String(forward);
      return { ringAt: t, writeAt, length: t };
    }
    const walk = kind === 'kill' ? 350 : 700;
    beats.push({ at: t + walk, pose: POSE.door });
    t += walk;
    const ringAt = t;
    if (ring) {
      beats.push({ at: t + 200, pose: POSE.door }, { at: t + 800, pose: POSE.center });
      t += 800;
      this.cues.play(c.querySelector('.bell-swing'), after.muffled ? THUD : SWING, { duration: after.muffled ? 600 : 1000, delay: ringAt, easing: 'ease-out' });
    }
    if (t > 0) this.cues.play(figure, beats.map(beat => ({ ...beat.pose, offset: beat.at / t })), { duration: t, easing: 'ease-in-out' });
    return { ringAt, writeAt, length: t };
  }

  suspend(): void { this.settle(); }
  dispose(): void { this.settle(); this.events.abort(); this.unsubscribe(); }
}
