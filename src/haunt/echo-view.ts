import { MAX_CAPTURES, captureSubjects, isUsefulCapture, negativeWriting, type Capture, type SessionFrame } from './echo-studio';
import { BRUSH, frameSubjects, pictureShowsPresence, subjectLabel, type Box, type Point, type Subjects } from './glass-model';
import { SESSION_QUIET, captureCanvas, drawGlass, drawNegative, drawSessionFrame, fitCanvas } from './glass-render';
import type { GlassView } from './glass-view';
import type { CaseStore, OpenTarget } from './case-store';
import { NOTE_START, type LegacySnapshot } from './legacy-session';
import { FrameEditor } from './frame-editor';
import { onReducedMotionChange, prefersReducedMotion, writeGhostly } from './ghost-writing';
import { scrollRegion } from './scroll-region';
import type { AppContext, AppController } from './window-manager';

/**
 * ECHO, the capture studio (.kiro/specs/os-case-v4 R4). Two sources read the same case: TERMINAL's session window (a
 * live link that can be paused) and the desktop glass directly behind ECHO's monitor (a viewfinder). A capture keeps a
 * full negative of its source and a separate photo frame. ECHO never rings the bell, retries or finishes the job.
 */
export const PAUSED_LINE = 'You stopped the picture. Not the call.';
/** After the minute ended, the session window still shows the note it never finished (visual-precision-v6 R4). */
export const NOTE_LEFT_LINE = 'Only the note is left here. The mark is on the glass.';
export const FULL_IMAGE_LINE = 'Full image kept. This frame becomes the picture.';
const RINGS = new Set(['observe', 'step', 'term', 'kill']);
const NOTE_STOPS = `its note stops at “${NOTE_START.split(' ').at(-1)}”`;
let instances = 0;

export interface EchoHooks { stage: HTMLElement; glassView: GlassView; }

const gone = (frame: Pick<SessionFrame, 'presence'>): boolean => frame.presence === 'glass' || frame.presence === 'released';

/** Words for a capture, in the main path's vocabulary: capture, picture, writing. */
export function captureTitle(capture: Capture): string {
  const negative = capture.negative;
  if (negative.kind === 'session') return gone(negative.session) ? 'The note left behind' : negative.session.presence === 'shadow' ? 'A shadow in the window' : 'The same minute';
  if (negative.kind === 'limited') return 'Limited capture';
  if (!negative.placement) return 'Bare glass';
  return subjectLabel(captureSubjects(negative, capture.frame));
}
export function captureVerdict(capture: Capture): string {
  const negative = capture.negative;
  // The session window shows Mara's note as far as it was ever written: name it, and where it stops.
  if (negative.kind === 'session') return gone(negative.session) ? `TERMINAL’s session window after the minute: the figure has gone; the note still stops at “${NOTE_START.split(' ').at(-1)}”. No handprint.`
    : `TERMINAL’s session window: ${NOTE_STOPS}. No handprint.`;
  if (negative.kind === 'limited') return 'From an older version of this desktop: its picture only, without the writing. A new exposure of the glass keeps both.';
  if (!negative.placement) return 'Bare glass. Nothing had reached it when this was captured.';
  const subjects = captureSubjects(negative, capture.frame), lines = negativeWriting(negative).length;
  const writing = lines ? `The writing (${lines} lines) is kept with it, wherever the frame is.` : 'It holds no writing.';
  return pictureShowsPresence(subjects) ? `The picture shows the ${subjects.handprint && subjects.figure === 'clear' ? 'handprint and the figure' : subjects.handprint ? 'handprint' : 'figure'}. ${writing}`
    : `${writing} This frame shows only mist: move it over the handprint or the figure.`;
}

interface Chip { text: string; on: boolean | 'faint'; }
/** What the session window shows, live or kept: the figure's state, and the note that stops mid-word. */
function sessionChips(frame: Pick<SessionFrame, 'presence'>): Chip[] {
  return [
    { text: gone(frame) ? 'No figure' : frame.presence === 'shadow' ? 'A shadow' : 'The figure, repeating', on: !gone(frame) },
    { text: 'Unfinished note', on: true },
    { text: 'No handprint', on: false },
  ];
}
function subjectChips(subjects: Subjects, lines: number, total: number): Chip[] {
  if (!subjects.impression) return [{ text: 'Bare glass', on: false }];
  return [
    { text: 'Handprint', on: subjects.handprint },
    { text: subjects.figure === 'faint' ? 'Figure (behind the mist)' : 'Figure', on: subjects.figure === 'clear' ? true : subjects.figure === 'faint' ? 'faint' : false },
    { text: total ? `Writing · ${lines} of ${total} lines in view` : 'No writing', on: lines > 0 },
  ];
}
function renderChips(list: HTMLElement, label: string, chips: Chip[]): void {
  const head = document.createElement('li');
  head.className = 'subject-label';
  head.textContent = label;
  list.replaceChildren(head, ...chips.map(chip => {
    const item = document.createElement('li');
    item.className = 'subject-chip';
    item.dataset.on = String(chip.on);
    item.textContent = chip.text;
    return item;
  }));
}

export class EchoController implements AppController {
  private readonly events = new AbortController();
  private readonly unsubscribers: Array<() => void> = [];
  private readonly screen: HTMLCanvasElement;
  private readonly monitor: HTMLElement;
  private readonly cursor: HTMLElement;
  private readonly status: HTMLElement;
  private readonly editor: FrameEditor;
  private tab: 'live' | 'captures' = 'live';
  private selected: number | null;
  private suspended = false;
  private drift = 0;
  private driftFrame = 0;
  private flashTimer = 0;
  private lastEventId: number;
  private wiping: { pointerId: number; last: Point } | null = null;
  private keyWipe = false;
  private aim = { x: 0.5, y: 0.5 };
  private preview: Box | null = null;
  private thumbs = new Map<string, HTMLCanvasElement>();
  private confirming: number | null = null;

  constructor(private readonly container: HTMLElement, private readonly store: CaseStore, private readonly context: AppContext, private readonly hooks: EchoHooks) {
    const n = ++instances;
    container.classList.add('echo-app');
    container.innerHTML = `
      <div class="echo-header">
        <fieldset class="echo-sources"><legend class="sr-only">Source</legend>
          <label><input type="radio" name="echo-source-${n}" value="session"><span>Session window</span></label>
          <label><input type="radio" name="echo-source-${n}" value="glass"><span>Desktop glass</span></label>
        </fieldset>
        <div class="echo-tabs" role="tablist" aria-label="ECHO">
          <button type="button" role="tab" id="echo-tab-live-${n}" aria-controls="echo-live-${n}" data-tab="live">Live</button>
          <button type="button" role="tab" id="echo-tab-captures-${n}" aria-controls="echo-captures-${n}" data-tab="captures">Captures <span class="echo-count"></span></button>
        </div>
      </div>
      <section class="echo-live" id="echo-live-${n}" role="tabpanel" aria-labelledby="echo-tab-live-${n}">
        <div class="echo-monitor-wrap"><div class="echo-monitor">
          <div class="echo-monitor-bar" aria-hidden="true"><span class="echo-transport"></span><span class="echo-overlay-flash"></span></div>
          <div class="echo-viewport">
            <canvas class="echo-screen" aria-hidden="true"></canvas>
            <p class="echo-ghost-line" aria-hidden="true"></p>
            <button type="button" class="wipe-cursor" aria-label="Wipe cursor. Arrow keys move it; hold Space while moving to wipe; Enter wipes where it is."><span aria-hidden="true"></span></button>
          </div>
        </div></div>
        <div class="echo-readout"><ul class="subject-chips" aria-label="In this frame"></ul><p class="echo-caption"></p></div>
        <div class="echo-controls">
          <button type="button" class="is-primary" data-echo="capture" data-primary>Capture</button>
          <button type="button" data-echo="pause"></button>
          <button type="button" data-echo="breathe">Breathe on the glass</button>
        </div>
        <p class="echo-status" role="status" aria-live="polite"></p>
      </section>
      <section class="echo-captures" id="echo-captures-${n}" role="tabpanel" aria-labelledby="echo-tab-captures-${n}" hidden>
        <aside class="capture-list" aria-label="Captures"><ol class="capture-items"></ol>
          <p class="capture-empty">No captures yet. Capture keeps a full image of the selected source.</p><p class="capture-limit"></p>
          <button type="button" class="capture-undo" data-echo="undo-discard" hidden>Undo discard</button></aside>
        <div class="capture-detail">
          <div class="capture-head"><h3 class="capture-title"></h3><ul class="subject-chips" aria-label="In the picture"></ul></div>
          <div class="capture-editor"></div>
          <p class="capture-caption"></p>
          <div class="capture-foot">
            <canvas class="capture-picture" aria-hidden="true"></canvas>
            <div class="capture-actions">
              <p class="capture-verdict"></p><p class="capture-ghost" aria-hidden="true"></p>
              <div class="capture-buttons">
                <button type="button" class="is-primary" data-echo="use">Use this capture</button>
                <button type="button" data-echo="new-exposure" hidden>New exposure</button>
                <button type="button" data-echo="discard">Discard</button>
              </div>
            </div>
          </div>
          <div class="capture-confirm" role="alertdialog" aria-labelledby="echo-confirm-${n}" hidden>
            <p id="echo-confirm-${n}"></p>
            <div><button type="button" class="is-primary" data-echo="confirm-use">Replace</button><button type="button" data-echo="cancel-use">Keep the letter as it is</button></div>
          </div>
          <p class="capture-status" role="status" aria-live="polite"></p>
        </div>
      </section>`;
    this.screen = container.querySelector<HTMLCanvasElement>('.echo-screen')!;
    this.monitor = container.querySelector<HTMLElement>('.echo-monitor')!;
    // The paused ghost line is written where the session window draws nothing (visual-precision-v6 R2).
    const quiet = SESSION_QUIET, ghostLine = container.querySelector<HTMLElement>('.echo-ghost-line')!;
    Object.assign(ghostLine.style, { left: `${quiet.x / 3.2}%`, top: `${quiet.y / 2}%`, width: `${quiet.w / 3.2}%`, maxHeight: `${quiet.h / 2}%` });
    this.cursor = container.querySelector<HTMLElement>('.wipe-cursor')!;
    this.status = container.querySelector<HTMLElement>('.echo-status')!;
    this.editor = new FrameEditor(container.querySelector<HTMLElement>('.capture-editor')!, {
      change: frame => { this.preview = frame; this.renderDetailPicture(); },
      commit: frame => {
        this.preview = null;
        if (this.selected !== null && store.studio.reframe(this.selected, frame)) this.sayCapture('Frame moved. The image itself did not change.');
        this.render();
      },
    }, 'Photo frame on the negative');
    const studio = store.studio;
    this.selected = studio.list().at(-1)?.id ?? null;
    this.lastEventId = store.legacy.lastEvent().id;
    const options = { signal: this.events.signal };
    container.addEventListener('click', event => this.click(event), options);
    container.addEventListener('change', event => {
      const input = event.target as HTMLInputElement;
      if (input.name !== `echo-source-${n}`) return;
      studio.setSource(input.value === 'glass' ? 'glass' : 'session');
      this.say(studio.source === 'glass' ? 'Desktop glass: the monitor shows the glass behind ECHO. Move ECHO to frame it.' : 'Session window: a live link to TERMINAL’s session.');
    }, options);
    container.querySelector('.echo-tabs')!.addEventListener('keydown', event => {
      const key = (event as KeyboardEvent).key;
      if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
      event.preventDefault();
      this.showTab(this.tab === 'live' ? 'captures' : 'live', true);
    }, options);
    this.screen.addEventListener('pointerdown', this.wipeDown, options);
    this.screen.addEventListener('pointermove', this.wipeMove, options);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) this.screen.addEventListener(type, this.wipeUp, options);
    this.cursor.addEventListener('keydown', this.cursorKey, options);
    this.cursor.addEventListener('keyup', this.cursorKeyUp, options);
    this.cursor.addEventListener('blur', () => this.endKeyWipe(), options);
    this.cursor.addEventListener('click', event => event.preventDefault(), options);
    document.addEventListener('haunt:window-moved', event => { if ((event as CustomEvent<{ id: string }>).detail?.id === 'echo') this.drawMonitor(); }, options);
    document.addEventListener('visibilitychange', () => this.animate(), options);
    onReducedMotionChange(() => this.animate(), this.events.signal);
    const resize = new ResizeObserver(() => { this.drawMonitor(); this.renderDetailPicture(); });
    resize.observe(this.monitor);
    resize.observe(container.querySelector('.capture-picture')!);
    this.unsubscribers.push(() => resize.disconnect());
    // ECHO never shows POSTMAN's mail draft: a key typed there is not ECHO's work (.kiro/specs/fluid-typing-v9).
    this.unsubscribers.push(store.subscribe(change => { if (change !== 'mail-draft') this.render(); }));
    this.unsubscribers.push(store.legacy.subscribe(() => this.caseChanged()));
    this.unsubscribers.push(hooks.glassView.onDraw(() => { if (studio.source === 'glass' && this.tab === 'live') this.drawMonitor(); }));
    // In a small window the capture's details scroll; the panel is then reachable from the keyboard too (playability-v5 R3).
    this.unsubscribers.push(scrollRegion(container.querySelector<HTMLElement>('.capture-detail')!, 'Capture details'));
    this.context.setSubtitle('Capture studio');
    this.render();
  }

  // ---------- Inputs ----------

  private click(event: MouseEvent): void {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled || !this.container.contains(button)) return;
    if (button.dataset.tab) { this.showTab(button.dataset.tab === 'captures' ? 'captures' : 'live', false); return; }
    if (button.dataset.capture) { this.selected = Number(button.dataset.capture); this.confirming = null; this.render(); return; }
    switch (button.dataset.echo) {
      case 'capture': this.capture(); break;
      case 'pause': this.togglePause(); break;
      case 'breathe': this.breathe(); break;
      case 'use': this.use(false); break;
      case 'confirm-use': this.use(true); break;
      case 'cancel-use': this.confirming = null; this.render(); this.focusButton('use'); break;
      case 'discard': this.discard(); break;
      case 'undo-discard': this.undoDiscard(); break;
      case 'new-exposure': this.store.studio.setSource('glass'); this.showTab('live', false); this.focusButton('capture'); break;
    }
  }
  private focusButton(name: string): void { this.container.querySelector<HTMLButtonElement>(`[data-echo="${name}"]`)?.focus({ preventScroll: true }); }

  private showTab(tab: 'live' | 'captures', focusTab: boolean): void {
    this.tab = tab;
    this.confirming = null;
    this.render();
    if (focusTab) this.container.querySelector<HTMLButtonElement>(`[data-tab="${tab}"]`)!.focus();
  }

  private session(): SessionFrame {
    const { presence, attempts, pid, retry, muffled } = this.store.legacy.snapshot();
    return { presence, attempts, pid, retry, muffled };
  }

  /** The monitor's own rectangle on the glass, in stage pixels. */
  private frameRect(): Box {
    const monitor = this.screen.getBoundingClientRect(), stage = this.hooks.stage.getBoundingClientRect();
    return { x: monitor.left - stage.left, y: monitor.top - stage.top, w: monitor.width, h: monitor.height };
  }

  private capture(): void {
    this.hooks.glassView.finishReveal();
    const studio = this.store.studio;
    const result = studio.capture(this.store.run, { session: this.session(), glass: { stage: this.hooks.glassView.stageSize, ...this.store.glassForCapture(), monitor: this.frameRect() } });
    if (!result.ok) { this.say(`ECHO keeps up to ${MAX_CAPTURES} captures. Discard one in Captures first; Undo can bring it back.`); return; }
    this.selected = result.capture.id;
    this.tab = 'captures';
    this.confirming = null;
    this.render();
    this.sayCapture(`Capture ${result.capture.id} kept: ${captureTitle(result.capture).toLowerCase()}.`);
    const ghost = this.container.querySelector<HTMLElement>('.capture-ghost')!;
    if (result.capture.negative.kind === 'session' && gone(result.capture.negative.session)) writeGhostly(ghost, NOTE_LEFT_LINE, !prefersReducedMotion());
    this.focusButton('use');
  }

  private togglePause(): void {
    const studio = this.store.studio;
    if (studio.source !== 'session') return;
    if (studio.paused) { studio.resume(); this.say('Live again.'); return; }
    const frame = this.session();
    studio.pause(frame);
    const armed = frame.retry && frame.presence === 'terminal';
    if (armed) writeGhostly(this.container.querySelector<HTMLElement>('.echo-ghost-line')!, PAUSED_LINE, !prefersReducedMotion());
    this.say(armed ? 'Preview paused. The picture stopped; TERMINAL is still running, and the call is still on.' : 'Preview paused. The picture stopped; TERMINAL is still running.');
  }

  private breathe(): void {
    const frame = this.frameRect();
    this.hooks.glassView.finishReveal();
    const changed = this.store.glass.breathe({ x: frame.x + 4, y: frame.y + 4, w: frame.w - 8, h: frame.h - 8 }, this.hooks.glassView.stageSize);
    this.say(changed ? 'You breathed on the glass. The mist came back inside the frame, and with it the writing.' : 'The glass inside the frame is already misted.');
  }

  private use(confirm: boolean): void {
    if (this.selected === null) return;
    const result = this.store.useCapture(this.selected, confirm);
    if (result === 'needs-confirm') {
      this.confirming = this.selected;
      const draft = this.store.letter.draft;
      this.container.querySelector('.capture-confirm p')!.textContent = `CANVAS already has a letter made from capture ${draft?.captureId ?? ''}. Replace its picture and writing with capture ${this.selected}? Undo in CANVAS brings the old one back.`;
      this.render();
      this.focusButton('confirm-use');
      return;
    }
    this.confirming = null;
    if (result === 'missing') { this.sayCapture('That capture is gone.'); return; }
    if (result === 'same') this.store.open({ app: 'canvas' });
    this.render();
  }

  private discard(): void {
    if (this.selected === null) return;
    const id = this.selected, used = this.store.letter.draft?.captureId === id;
    this.store.studio.discard(id);
    this.selected = this.store.studio.list().at(-1)?.id ?? null;
    this.sayCapture(`Capture ${id} discarded.${used ? ' The letter in CANVAS keeps its own copy.' : ''}`);
    this.focusButton(this.store.studio.canUndoDiscard ? 'undo-discard' : 'capture');
  }
  private undoDiscard(): void {
    const capture = this.store.studio.undoDiscard();
    if (!capture) return;
    this.selected = capture.id;
    this.render();
    this.sayCapture(`Capture ${capture.id} is back.`);
    this.focusButton('use');
  }

  // ---------- Wiping on the monitor (pointer and keyboard make the same strokes) ----------

  private toStage(fx: number, fy: number): Point {
    const rect = this.frameRect();
    return { x: rect.x + fx * rect.w, y: rect.y + fy * rect.h };
  }
  private canWipe(): boolean { return this.store.studio.source === 'glass' && !!this.store.glass.placement && !this.store.glass.released; }
  private wipe(a: Point, b: Point): void { this.store.glass.wipe(a, b, this.hooks.glassView.stageSize); }

  private wipeDown = (event: PointerEvent): void => {
    if (!this.canWipe() || event.button !== 0 || !event.isPrimary || this.wiping) return;
    event.preventDefault();
    this.hooks.glassView.finishReveal();
    const point = this.pointerStage(event);
    this.wiping = { pointerId: event.pointerId, last: point };
    try { this.screen.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers cannot be captured. */ }
    this.wipe(point, point);
  };
  private wipeMove = (event: PointerEvent): void => {
    const rect = this.screen.getBoundingClientRect();
    if (rect.width) { this.aim = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }; this.placeCursor(); }
    if (!this.wiping || event.pointerId !== this.wiping.pointerId) return;
    const point = this.pointerStage(event);
    this.wipe(this.wiping.last, point);
    this.wiping.last = point;
  };
  private wipeUp = (event: PointerEvent): void => {
    if (!this.wiping || event.pointerId !== this.wiping.pointerId) return;
    this.wiping = null;
    try { if (this.screen.hasPointerCapture(event.pointerId)) this.screen.releasePointerCapture(event.pointerId); } catch { /* Already released. */ }
    this.store.persist();
  };
  private pointerStage(event: PointerEvent): Point {
    const stage = this.hooks.stage.getBoundingClientRect();
    return { x: event.clientX - stage.left, y: event.clientY - stage.top };
  }

  private cursorKey = (event: KeyboardEvent): void => {
    if (!this.canWipe()) return;
    const step = event.shiftKey ? 0.1 : 0.03;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step * 1.6], ArrowDown: [0, step * 1.6] };
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      if (!this.keyWipe) { this.keyWipe = true; this.hooks.glassView.finishReveal(); const p = this.toStage(this.aim.x, this.aim.y); this.wipe(p, p); }
      return;
    }
    if (event.key === 'Enter') { event.preventDefault(); const p = this.toStage(this.aim.x, this.aim.y); this.hooks.glassView.finishReveal(); this.wipe(p, p); this.store.persist(); this.say('Wiped where the cursor is.'); return; }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const before = this.toStage(this.aim.x, this.aim.y);
    this.aim = { x: Math.max(0, Math.min(1, this.aim.x + move[0])), y: Math.max(0, Math.min(1, this.aim.y + move[1])) };
    this.placeCursor();
    if (this.keyWipe) this.wipe(before, this.toStage(this.aim.x, this.aim.y));
  };
  private cursorKeyUp = (event: KeyboardEvent): void => {
    if (event.key !== ' ' && event.key !== 'Spacebar') return;
    event.preventDefault();
    this.endKeyWipe();
  };
  private endKeyWipe(): void {
    if (!this.keyWipe) return;
    this.keyWipe = false;
    this.store.persist();
    this.say('Wiped along the cursor’s path.');
  }
  private placeCursor(): void {
    const rect = this.screen.getBoundingClientRect(), stage = this.hooks.glassView.stageSize;
    const size = rect.height ? (BRUSH * stage.h * 2) : 0;
    Object.assign(this.cursor.style, { left: `${this.aim.x * 100}%`, top: `${this.aim.y * 100}%`, width: `${size}px`, height: `${size}px` });
  }

  // ---------- Output ----------

  private say(text: string): void { this.status.textContent = text; }
  private sayCapture(text: string): void { this.container.querySelector('.capture-status')!.textContent = text; }

  private caseChanged(): void {
    const event = this.store.legacy.lastEvent();
    const fresh = event.id !== this.lastEventId;
    this.lastEventId = event.id;
    const state = this.store.legacy.snapshot();
    // A return seen on the live link: the same event TERMINAL produced, shown once. ECHO never produces it.
    if (fresh && state.moment === 'recalled' && RINGS.has(event.kind) && this.store.studio.source === 'session' && !this.store.studio.paused) {
      const flash = this.container.querySelector<HTMLElement>('.echo-overlay-flash')!;
      flash.textContent = '↺ the same minute again';
      window.clearTimeout(this.flashTimer);
      this.flashTimer = window.setTimeout(() => { flash.textContent = ''; }, 1600);
    }
    if (fresh && event.kind === 'reset') { this.selected = null; this.thumbs.clear(); }
  }

  private render(): void {
    const c = this.container, studio = this.store.studio, state = this.store.legacy.snapshot(), source = studio.source, paused = studio.paused;
    c.dataset.source = source;
    c.dataset.view = this.tab;
    c.dataset.transport = source === 'glass' ? 'viewfinder' : paused ? 'paused' : 'live';
    for (const input of c.querySelectorAll<HTMLInputElement>('.echo-sources input')) input.checked = input.value === source;
    for (const tab of c.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
      const selected = tab.dataset.tab === this.tab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    const captures = studio.list();
    c.querySelector('.echo-count')!.textContent = captures.length ? String(captures.length) : '';
    c.querySelector<HTMLElement>('.echo-live')!.hidden = this.tab !== 'live';
    c.querySelector<HTMLElement>('.echo-captures')!.hidden = this.tab !== 'captures';
    this.context.setSubtitle(this.tab === 'live' ? (source === 'glass' ? 'Desktop glass' : 'Session window') : 'Captures');
    if (this.tab === 'live') this.renderLive(state);
    else this.renderCaptures(captures);
    this.animate();
  }

  private renderLive(state: LegacySnapshot): void {
    const c = this.container, studio = this.store.studio, source = studio.source, paused = studio.paused;
    // The monitor's own status, in its bar above the picture: never drawn into the image, so never in a capture.
    const transport = source === 'glass' ? '◎ GLASS · behind this window' : `${paused ? 'Ⅱ PAUSED' : '● LIVE'} · last.session`;
    const status = c.querySelector<HTMLElement>('.echo-transport')!;
    if (status.textContent !== transport) status.textContent = transport;
    const ghostLine = c.querySelector<HTMLElement>('.echo-ghost-line')!;
    const armedPause = source === 'session' && paused !== null && paused.retry && paused.presence === 'terminal';
    if (!armedPause && ghostLine.textContent) ghostLine.replaceChildren();
    else if (armedPause && !ghostLine.textContent) writeGhostly(ghostLine, PAUSED_LINE, false);
    const pause = c.querySelector<HTMLButtonElement>('[data-echo="pause"]')!;
    pause.hidden = source !== 'session';
    pause.textContent = paused ? 'Resume live' : 'Pause preview';
    pause.setAttribute('aria-pressed', String(paused !== null));
    const breathe = c.querySelector<HTMLButtonElement>('[data-echo="breathe"]')!;
    breathe.hidden = source !== 'glass';
    breathe.disabled = !this.canWipe();
    this.cursor.hidden = !this.canWipe();
    this.placeCursor();
    // A full tray keeps Capture pressable: pressing it explains the limit instead of failing silently.
    this.drawMonitor();
    this.renderReadout(state);
  }

  /** Subject chips and the caption for what the monitor shows now. */
  private renderReadout(state: LegacySnapshot): void {
    const c = this.container, studio = this.store.studio, list = c.querySelector<HTMLElement>('.echo-readout .subject-chips')!;
    const caption = c.querySelector('.echo-caption')!;
    let text: string;
    if (studio.source === 'glass') {
      const glass = this.store.glass, writing = glass.released ? [] : glass.writing;
      const subjects = glass.released ? frameSubjects(null, glass.field, this.frameRect(), this.hooks.glassView.stageSize, [])
        : frameSubjects(glass.placement, glass.field, this.frameRect(), this.hooks.glassView.stageSize, writing);
      renderChips(list, 'In frame:', subjectChips(subjects, subjects.writing, writing.length));
      text = glass.released ? 'The glass is clear. The hand let go when the letter arrived.'
        : !glass.placement ? 'The glass behind ECHO is clear. Nothing has reached it yet.'
          : 'A capture keeps the whole glass, writing included. The frame becomes the picture. Wipe on the monitor or the desktop to clear the mist.';
    } else {
      const paused = studio.paused, frame = paused ?? state;
      renderChips(list, 'In frame:', sessionChips(frame));
      if (paused) {
        const since = state.attempts - paused.attempts;
        text = `A paused frame of TERMINAL’s session. TERMINAL keeps running${since > 0 ? `: it has come back ${since === 1 ? 'once' : `${since} times`} since you paused` : ''}.`;
      } else if (gone(state)) text = `TERMINAL’s session, live. ${NOTE_LEFT_LINE}`;
      else if (state.presence === 'shadow') text = 'TERMINAL’s session, live: only a shadow is left in the window.';
      else text = state.retry ? 'TERMINAL’s session, live: the figure repeating the same minute.' : 'TERMINAL’s session, live: the call is stopped. It can finish this minute.';
    }
    if (caption.textContent !== text) caption.textContent = text;
  }

  private thumb(capture: Capture, frame: Box, width: number, height: number): HTMLCanvasElement {
    const key = `${capture.id}:${Math.round(frame.x)},${Math.round(frame.y)},${Math.round(frame.w)}:${width}`;
    let canvas = this.thumbs.get(key);
    if (!canvas) {
      if (this.thumbs.size > 40) this.thumbs.delete(this.thumbs.keys().next().value!);
      canvas = captureCanvas(capture.negative, frame, width, height);
      this.thumbs.set(key, canvas);
    }
    return canvas;
  }

  private renderCaptures(captures: Capture[]): void {
    const c = this.container, studio = this.store.studio;
    if (this.selected !== null && !captures.some(item => item.id === this.selected)) this.selected = captures.at(-1)?.id ?? null;
    if (this.selected === null && captures.length) this.selected = captures.at(-1)!.id;
    const usedId = this.store.letter.draft?.captureId ?? null;
    c.querySelector<HTMLElement>('.capture-empty')!.hidden = captures.length > 0;
    c.querySelector('.capture-limit')!.textContent = `${captures.length} of ${MAX_CAPTURES} kept`;
    const items = captures.map(capture => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'capture-item';
      button.dataset.capture = String(capture.id);
      button.dataset.kind = capture.negative.kind;
      if (capture.id === this.selected) button.setAttribute('aria-current', 'true');
      const title = captureTitle(capture);
      button.setAttribute('aria-label', `Capture ${capture.id}: ${title}${capture.negative.kind === 'session' ? ', session window' : ''}${usedId === capture.id ? ', in the letter' : ''}`);
      const label = document.createElement('span');
      label.className = 'capture-item-label';
      label.innerHTML = `<strong>Capture ${capture.id}</strong><span></span>`;
      label.querySelector('span')!.textContent = capture.negative.kind === 'session' ? `Session · ${title.toLowerCase()}` : title;
      button.append(this.thumb(capture, capture.frame, 112, 70), label);
      if (usedId === capture.id) { const tag = document.createElement('span'); tag.className = 'capture-item-tag'; tag.textContent = 'In the letter'; button.append(tag); }
      item.append(button);
      return item;
    });
    // Rebuilding the list must not drop keyboard focus from the capture the player was on.
    const focused = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.capture-item')?.dataset.capture;
    c.querySelector('.capture-items')!.replaceChildren(...items);
    if (focused) c.querySelector<HTMLButtonElement>(`.capture-item[data-capture="${focused}"]`)?.focus({ preventScroll: true });
    c.querySelector<HTMLButtonElement>('.capture-undo')!.hidden = !studio.canUndoDiscard;
    const detail = c.querySelector<HTMLElement>('.capture-detail')!;
    const capture = this.selected === null ? null : studio.get(this.selected);
    detail.hidden = !capture;
    if (!capture) return;
    detail.dataset.kind = capture.negative.kind;
    c.querySelector('.capture-title')!.textContent = `Capture ${capture.id} · ${captureTitle(capture)}`;
    c.querySelector('.capture-caption')!.textContent = capture.negative.kind === 'glass' ? `${FULL_IMAGE_LINE} Drag the frame, or focus it and use the arrow keys and + / −.`
      : capture.negative.kind === 'session' ? 'The session window, kept whole. It has no frame to move.' : 'Only the old picture was kept. It has no frame to move.';
    this.editor.show(capture.negative, this.preview ?? capture.frame, `capture-${capture.id}`);
    c.querySelector('.capture-verdict')!.textContent = captureVerdict(capture);
    const ghost = c.querySelector<HTMLElement>('.capture-ghost')!;
    const left = capture.negative.kind === 'session' && gone(capture.negative.session);
    if (!left) ghost.replaceChildren();
    else if (!ghost.textContent) ghost.textContent = NOTE_LEFT_LINE;
    const use = c.querySelector<HTMLButtonElement>('[data-echo="use"]')!;
    use.textContent = usedId === capture.id ? 'Use this frame in the letter' : 'Use this capture';
    c.querySelector<HTMLButtonElement>('[data-echo="new-exposure"]')!.hidden = capture.negative.kind !== 'limited';
    const confirm = c.querySelector<HTMLElement>('.capture-confirm')!;
    confirm.hidden = this.confirming !== capture.id;
    this.renderDetailPicture();
    detail.dataset.useful = String(isUsefulCapture(capture));
  }

  /** The picture this frame makes, larger, and its subjects, updated live while the frame moves. */
  private renderDetailPicture(): void {
    if (this.tab !== 'captures' || this.selected === null) return;
    const capture = this.store.studio.get(this.selected);
    if (!capture) return;
    const frame = this.preview ?? capture.frame, canvas = this.container.querySelector<HTMLCanvasElement>('.capture-picture')!;
    if (fitCanvas(canvas)) {
      const ctx = canvas.getContext('2d')!;
      if (capture.negative.kind === 'session') drawSessionFrame(ctx, capture.negative.session, canvas.width, canvas.height);
      else drawNegative(ctx, capture.negative, capture.negative.kind === 'limited' ? capture.negative.crop : frame, canvas.width, canvas.height);
    }
    const list = this.container.querySelector<HTMLElement>('.capture-head .subject-chips')!;
    if (capture.negative.kind === 'session') { renderChips(list, 'In the picture:', sessionChips(capture.negative.session)); return; }
    if (capture.negative.kind === 'limited') { renderChips(list, 'In the picture:', [{ text: 'Picture only', on: true }, { text: 'No writing kept', on: false }]); return; }
    const subjects = captureSubjects(capture.negative, frame), total = negativeWriting(capture.negative).length;
    renderChips(list, 'In the picture:', subjectChips(subjects, subjects.writing, total));
  }

  /** Draws what the monitor shows now: the glass under it (the desktop's own pixels), or the session window. */
  private drawMonitor(): void {
    if (this.suspended || this.tab !== 'live' || !fitCanvas(this.screen)) return;
    const ctx = this.screen.getContext('2d')!, view = this.hooks.glassView;
    if (this.store.studio.source === 'glass') {
      const frame = this.frameRect(), glass = this.store.glass;
      this.screen.dataset.frame = [frame.x, frame.y, frame.w, frame.h].map(n => Math.round(n * 100) / 100).join(',');
      drawGlass(ctx, { stage: view.stageSize, placement: glass.placement, field: glass.field, writing: glass.writing }, frame, this.screen.width, this.screen.height,
        { reveal: view.reveal, release: glass.released ? view.release : 0 });
      this.renderReadout(this.store.legacy.snapshot());
      return;
    }
    delete this.screen.dataset.frame;
    drawSessionFrame(ctx, this.store.studio.paused ?? this.session(), this.screen.width, this.screen.height, this.store.studio.paused ? 0 : this.drift);
  }

  /** The live link's idle drift: only while it is live, visible and motion is welcome. */
  private animate(): void {
    const studio = this.store.studio;
    const live = !this.suspended && this.tab === 'live' && !document.hidden && !prefersReducedMotion() && studio.source === 'session' && !studio.paused && this.store.legacy.snapshot().presence === 'terminal';
    if (!live) { cancelAnimationFrame(this.driftFrame); this.driftFrame = 0; if (this.drift) { this.drift = 0; this.drawMonitor(); } return; }
    if (this.driftFrame) return;
    const tick = (now: number) => {
      this.drift = Math.sin(now / 1600 * Math.PI) * 3;
      this.drawMonitor();
      this.driftFrame = requestAnimationFrame(tick);
    };
    this.driftFrame = requestAnimationFrame(tick);
  }

  open(target: OpenTarget): void {
    if (target.app !== 'echo') return;
    if (target.capture !== undefined && this.store.studio.get(target.capture)) { this.selected = target.capture; this.tab = 'captures'; }
    else if (target.tab) this.tab = target.tab;
    this.render();
  }
  focusTarget(): HTMLElement | null {
    if (this.tab === 'captures') return this.container.querySelector<HTMLButtonElement>('.capture-detail:not([hidden]) [data-echo="use"]') ?? this.container.querySelector<HTMLButtonElement>('[data-tab="captures"]');
    return this.container.querySelector<HTMLButtonElement>('[data-echo="capture"]');
  }

  /** Minimized: stop drawing. The studio's data is unchanged. */
  suspend(): void { this.suspended = true; cancelAnimationFrame(this.driftFrame); this.driftFrame = 0; this.wiping = null; this.endKeyWipe(); }
  resume(): void { this.suspended = false; this.render(); }

  /** Closing ECHO drops a paused view (it was never a kept picture). Captures stay in the studio. */
  dispose(): void {
    this.suspend();
    this.store.studio.resume();
    window.clearTimeout(this.flashTimer);
    this.events.abort();
    this.editor.dispose();
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  }
}
