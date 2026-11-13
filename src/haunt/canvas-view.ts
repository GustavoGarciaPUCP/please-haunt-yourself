import { KEEP_LEVELS, MISSING_TEXT, NOTE_STOP, NOT_THE_WORDS, keepPreview, keepsPhrase, letterStatus, type LetterDraft } from './letter-model';
import { canReframe, negativeWriting } from './echo-studio';
import { subjectLabel, type Box } from './glass-model';
import { LETTER_ASPECT, drawLetter, drawPicture, fitCanvas, letterArtFromDraft, type LetterArt } from './glass-render';
import { FrameEditor } from './frame-editor';
import { AppMenuBar } from './app-menu';
import { icon } from './os-icons';
import { onReducedMotionChange, prefersReducedMotion, writeGhostly } from './ghost-writing';
import { scrollRegion } from './scroll-region';
import type { CaseStore, OpenTarget } from './case-store';
import type { AppContext, AppController } from './window-manager';

const LIFT_MS = 600;
const KEEP_NOTES = ['All the mist', 'Thin mist', 'No mist'];
let instances = 0;

/** For a picture whose frame cannot move (an older limited print): Reframe… is not available, so it is not suggested. */
const FIXED_PICTURE = 'This picture shows only mist, and its frame cannot move. Use a capture of the glass from ECHO.';

/**
 * What the readiness line says: what is missing, in the main path's words, or what the finished letter holds. Every
 * instruction names an action this letter can take now (playability-v5 R2.1), and describes what the source really
 * shows (visual-precision-v6 R4): a session window shows its unfinished note, bare glass shows nothing yet.
 */
export function readiness(draft: LetterDraft): string {
  const status = letterStatus(draft);
  if (status.complete) return `Ready: the photograph keeps ${keepsPhrase(subjectLabel(status.subjects))}, and Mara’s words are on the paper.`;
  if (draft.source.kind === 'session') return `This capture is TERMINAL’s session window: its note stops at “${NOTE_STOP}”, and there is no handprint. Use a capture of the glass from ECHO.`;
  if (draft.source.kind === 'glass' && !draft.source.placement) return 'This capture is of bare glass: nothing had reached it yet. Use a newer capture of the glass from ECHO.';
  if (draft.source.kind === 'limited') return status.missing.map(item => item === 'picture' ? FIXED_PICTURE : item === 'no-writing' ? 'This old picture kept no writing. A new capture of the glass keeps it.' : MISSING_TEXT[item]).join(' ');
  return status.missing.map(item => MISSING_TEXT[item]).join(' ');
}

/** The Writing layer, when the capture holds no writing to lift: what it does hold. */
function noWritingState(draft: LetterDraft): string {
  if (draft.source.kind === 'session') return 'Only the unfinished note, as TERMINAL shows it. The letter needs Mara’s whole note.';
  if (draft.source.kind === 'limited') return 'This old picture kept no writing. A new capture of the glass keeps it.';
  return 'The glass had no writing yet when this was captured.';
}

/**
 * CANVAS (.kiro/specs/os-case-v4 R5, playability-v5 R2/R5): it finishes the letter from the capture ECHO handed over.
 * The writing has one action at a time (lift, or recover after a loss). The photograph's one decision is what it keeps
 * — the handprint cut in the mist, the figure behind it, or both — previewed from the letter's own capture. The preview
 * is exactly the payload POSTMAN will send. Mara's words are never edited. Undo and Redo belong to this letter only.
 */
export class CanvasController implements AppController {
  private readonly events = new AbortController();
  private readonly unsubscribers: Array<() => void> = [];
  private readonly preview: HTMLCanvasElement;
  private readonly menus: AppMenuBar;
  private readonly editor: FrameEditor;
  private mistPreview: number | null = null;
  /** The option of "The photograph keeps" under the pointer: previewed in the letter, not chosen. */
  private keepHover: number | null = null;
  private framePreview: Box | null = null;
  private highlight = false;
  /** Which writing actions are pointed at or keyboard-focused ("lift:pointer", "recover:focus"…). */
  private readonly pointing = new Set<string>();
  private reframing = false;
  private resetting = false;
  private lift: { start: number; lines: string[] } | null = null;
  private liftFrame = 0;
  private drawnKey = '';
  private keepKey = '';

  constructor(private readonly container: HTMLElement, private readonly store: CaseStore, private readonly context: AppContext) {
    const n = ++instances;
    container.classList.add('canvas-app');
    this.menus = new AppMenuBar([
      { id: 'edit', label: 'Edit', items: () => [
        { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z', enabled: store.letter.canUndo },
        { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y', enabled: store.letter.canRedo },
      ] },
      { id: 'letter', label: 'Letter', items: () => {
        const draft = store.letter.draft, captured = draft ? negativeWriting(draft.source).length > 0 : false;
        return [
          { id: 'lift', label: 'Lift the writing', enabled: !!draft && draft.writing === 'mist' && captured },
          { id: 'recover', label: 'Recover the writing', enabled: !!draft && draft.writing === 'lost' && captured },
          { id: 'reframe', label: 'Reframe…', enabled: !!draft && canReframe(draft.source) },
          { id: 'reset', label: 'Reset to the capture…', enabled: !!draft },
          { id: 'sep', label: '', enabled: false, separator: true },
          { id: 'compose', label: 'Compose in POSTMAN', enabled: !!draft },
        ];
      } },
    ], item => this.command(item), 'CANVAS menu');
    container.append(this.menus.element);
    const body = document.createElement('div');
    body.className = 'canvas-body';
    body.innerHTML = `
      <aside class="canvas-layers" aria-label="Layers">
        <section class="layer" data-layer="writing" aria-labelledby="canvas-writing-${n}">
          <h3 id="canvas-writing-${n}">Writing</h3><p class="layer-state"></p>
          <div class="layer-buttons">
            <button type="button" class="is-primary" data-canvas="lift">Lift the writing</button>
            <button type="button" class="is-primary" data-canvas="recover">Recover the writing</button>
            <button type="button" data-canvas="open-echo-writing">Open ECHO’s captures</button>
          </div>
        </section>
        <section class="layer" data-layer="photo" aria-labelledby="canvas-photo-${n}">
          <div class="layer-head"><h3 id="canvas-photo-${n}">Photograph</h3><button type="button" class="layer-head-button" data-canvas="reframe">Reframe…</button></div>
          <fieldset class="keep-options" data-choice="keep"><legend>The photograph keeps</legend>
            <div class="keep-row">${KEEP_LEVELS.map((level, index) => `<label class="keep-option"><input type="radio" name="canvas-keep-${n}" value="${level}">
              <canvas class="keep-thumb" aria-hidden="true"></canvas><strong class="keep-label"></strong><small class="keep-note">${KEEP_NOTES[index]}</small></label>`).join('')}</div>
            <p class="keep-warning" id="canvas-keep-warn-${n}" hidden>No mist would take the writing with it.</p>
          </fieldset>
          <div class="mist-row"><label for="canvas-mist-${n}">Mist</label>
            <input type="range" id="canvas-mist-${n}" min="0" max="100" step="10" aria-describedby="canvas-mist-note-${n}"><output class="mist-value" for="canvas-mist-${n}"></output></div>
          <p class="layer-note" id="canvas-mist-note-${n}">The handprint is a mark in the mist; the figure stands behind it.</p>
        </section>
        <section class="layer" data-layer="paper" aria-labelledby="canvas-paper-${n}">
          <h3 id="canvas-paper-${n}">Paper</h3>
          <fieldset class="choices" data-choice="paper"><legend>Colour</legend>
            <label><input type="radio" name="canvas-paper-${n}" value="bone"><span>Bone</span></label><label><input type="radio" name="canvas-paper-${n}" value="night"><span>Night</span></label></fieldset>
          <fieldset class="choices" data-choice="layout"><legend>Note</legend>
            <label><input type="radio" name="canvas-layout-${n}" value="beside"><span>Beside</span></label><label><input type="radio" name="canvas-layout-${n}" value="below"><span>Below</span></label></fieldset>
        </section>
      </aside>
      <section class="canvas-stage" aria-label="Letter">
        <div class="letter-frame"><canvas class="letter-preview" role="img"></canvas><p class="letter-ghost" aria-hidden="true"></p></div>
        <div class="canvas-overlay reframe-panel" role="dialog" aria-modal="false" aria-labelledby="canvas-reframe-${n}" hidden>
          <div class="overlay-head"><h3 id="canvas-reframe-${n}">Reframe the photo</h3><ul class="subject-chips" aria-label="In the picture"></ul></div>
          <div class="reframe-editor"></div>
          <p class="overlay-note">The full capture is kept in the letter. Only the frame changes. Drag it, or focus it and use the arrow keys and + / −.</p>
          <div class="overlay-buttons"><button type="button" class="is-primary" data-canvas="reframe-done">Done</button><button type="button" data-canvas="reframe-cancel">Cancel</button></div>
        </div>
        <div class="canvas-overlay reset-panel" role="alertdialog" aria-labelledby="canvas-reset-${n}" hidden>
          <p id="canvas-reset-${n}">Reset the letter to its capture as it was used? Undo brings your changes back.</p>
          <div class="overlay-buttons"><button type="button" class="is-primary" data-canvas="reset-confirm">Reset</button><button type="button" data-canvas="reset-cancel">Cancel</button></div>
        </div>
      </section>
      <section class="canvas-empty" hidden>
        <h3>No letter yet</h3>
        <p>A letter starts from a capture. In ECHO, open Captures, choose a capture of the glass and press <strong>Use this capture</strong>.</p>
        <button type="button" class="is-primary" data-canvas="open-echo">Open ECHO’s captures</button>
      </section>`;
    container.append(body);
    const footer = document.createElement('footer');
    footer.className = 'canvas-footer';
    footer.innerHTML = `<p class="canvas-ready" role="status" aria-live="polite"></p>
      <span class="canvas-saved"></span>
      <button type="button" class="icon-button" data-canvas="undo" aria-label="Undo" title="Undo (Ctrl+Z)">${icon('undo')}</button>
      <button type="button" class="icon-button" data-canvas="redo" aria-label="Redo" title="Redo (Ctrl+Y)">${icon('redo')}</button>
      <button type="button" class="is-primary" data-canvas="compose" data-primary>Compose in POSTMAN</button>`;
    container.append(footer);
    this.preview = container.querySelector<HTMLCanvasElement>('.letter-preview')!;
    this.editor = new FrameEditor(container.querySelector<HTMLElement>('.reframe-editor')!, {
      change: frame => { this.framePreview = frame; this.drawPreview(true); this.renderReframeChips(); },
      commit: frame => { this.framePreview = frame; this.drawPreview(true); this.renderReframeChips(); },
    }, 'Photo frame on the letter’s capture');
    const options = { signal: this.events.signal };
    this.unsubscribers.push(scrollRegion(container.querySelector<HTMLElement>('.canvas-layers')!, 'Layers'));
    container.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-canvas]');
      if (button && !button.disabled) this.command(button.dataset.canvas!);
    }, options);
    // Pointing at the writing action, or reaching it with the keyboard, shows what it will move and where; nothing changes
    // until it is pressed. Focus the app moves there itself (after a click elsewhere) does not count as pointing.
    for (const name of ['lift', 'recover']) {
      const button = container.querySelector<HTMLButtonElement>(`[data-canvas="${name}"]`)!;
      const sync = () => this.setHighlight([...this.pointing].some(key => !container.querySelector<HTMLElement>(`[data-canvas="${key.split(':')[0]}"]`)!.hidden));
      button.addEventListener('pointerenter', () => { this.pointing.add(`${name}:pointer`); sync(); }, options);
      button.addEventListener('pointerleave', () => { this.pointing.delete(`${name}:pointer`); sync(); }, options);
      button.addEventListener('focus', () => { if (button.matches(':focus-visible')) this.pointing.add(`${name}:focus`); sync(); }, options);
      button.addEventListener('blur', () => { this.pointing.delete(`${name}:focus`); sync(); }, options);
    }
    const mist = container.querySelector<HTMLInputElement>('input[type="range"]')!;
    mist.addEventListener('input', () => { this.mistPreview = Number(mist.value) / 100; this.renderMistValue(); this.drawPreview(true); }, options);
    mist.addEventListener('change', () => { this.mistPreview = null; store.letter.setMist(Number(mist.value) / 100); }, options);
    // Pointing at an option shows it in the letter at full size; choosing it is still a click (or the arrow keys).
    for (const option of container.querySelectorAll<HTMLLabelElement>('.keep-option')) {
      const input = option.querySelector('input')!;
      option.addEventListener('pointerenter', () => { if (!input.disabled && !input.checked) { this.keepHover = Number(input.value); this.drawPreview(true); } }, options);
      option.addEventListener('pointerleave', () => { if (this.keepHover !== null) { this.keepHover = null; this.drawPreview(true); } }, options);
    }
    container.addEventListener('change', event => {
      const input = event.target as HTMLInputElement;
      if (input.name === `canvas-keep-${n}`) { this.keepHover = null; store.letter.setMist(Number(input.value)); }
      if (input.name === `canvas-paper-${n}`) store.letter.setPaper(input.value === 'night' ? 'night' : 'bone');
      if (input.name === `canvas-layout-${n}`) store.letter.setLayout(input.value === 'below' ? 'below' : 'beside');
    }, options);
    container.addEventListener('keydown', event => {
      if (event.key === 'Escape' && (this.reframing || this.resetting)) { event.preventDefault(); event.stopPropagation(); this.command(this.reframing ? 'reframe-cancel' : 'reset-cancel'); return; }
      const target = event.target as HTMLElement;
      const typing = target.matches('input[type="text"], input:not([type]), textarea, [contenteditable="true"]');
      if (!event.ctrlKey || typing || this.reframing) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); this.command('undo'); }
      else if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); this.command('redo'); }
    }, options);
    onReducedMotionChange(() => { if (prefersReducedMotion()) this.endLift(); }, this.events.signal);
    const resize = new ResizeObserver(() => { this.drawPreview(true); this.drawKeeps(true); });
    resize.observe(container.querySelector('.canvas-stage')!);
    resize.observe(container.querySelector('.canvas-layers')!);
    this.unsubscribers.push(() => resize.disconnect());
    this.unsubscribers.push(store.letter.subscribe(change => this.letterChanged(change)));
    // CANVAS never shows POSTMAN's mail draft: a key typed there is not CANVAS's work (.kiro/specs/fluid-typing-v9).
    this.unsubscribers.push(store.subscribe(change => { if (change !== 'mail-draft') this.render(); }));
    this.render();
  }

  private command(command: string): void {
    const letter = this.store.letter;
    switch (command) {
      case 'undo': if (letter.undo()) this.say('Undone.'); break;
      case 'redo': if (letter.redo()) this.say('Redone.'); break;
      case 'lift': {
        const draft = letter.draft;
        if (draft && letter.liftWriting()) { this.startLift(negativeWriting(draft.source)); this.focusAfterWriting(); }
        break;
      }
      case 'recover': {
        const draft = letter.draft;
        if (draft && letter.recoverWriting()) { this.startLift(negativeWriting(draft.source)); this.say('The writing is back, on the paper.'); this.focusAfterWriting(); }
        break;
      }
      case 'reframe': this.openReframe(); break;
      case 'reframe-done': {
        const frame = this.editor.frame;
        this.closeReframe();
        if (letter.setFrame(frame)) this.say('Photo reframed. Undo brings the old frame back.');
        break;
      }
      case 'reframe-cancel': this.closeReframe(); break;
      case 'reset': this.resetting = true; this.render(); this.container.querySelector<HTMLButtonElement>('[data-canvas="reset-cancel"]')!.focus(); break;
      case 'reset-confirm': this.resetting = false; if (letter.resetToSource()) this.say('The letter is back to its capture as it was used.'); this.render(); this.focusPrimary(); break;
      case 'reset-cancel': this.resetting = false; this.render(); this.focusPrimary(); break;
      case 'compose': if (letter.draft) this.store.compose(); break;
      case 'open-echo': case 'open-echo-writing': this.store.open({ app: 'echo', tab: 'captures' }); break;
    }
  }
  private focusPrimary(): void { this.container.querySelector<HTMLButtonElement>('[data-canvas="compose"]')!.focus({ preventScroll: true }); }
  /** The writing button disappears once the words are on the paper: keyboard focus moves on to the photograph's choice. */
  private focusAfterWriting(): void {
    const keep = this.container.querySelector<HTMLInputElement>('.keep-options input:checked') ?? this.container.querySelector<HTMLInputElement>('.keep-options input');
    keep?.focus({ preventScroll: true });
  }
  private say(text: string): void { this.container.querySelector('.canvas-saved')!.textContent = text; window.setTimeout(() => this.renderSaved(), 2600); }

  /** "Not the words.": the figure answers the loss of Mara's words, once per loss; recovering or Undo takes the line away. */
  private letterChanged(change: string): void {
    const ghost = this.container.querySelector<HTMLElement>('.letter-ghost')!;
    if (change === 'words-lost') { this.endLift(); writeGhostly(ghost, NOT_THE_WORDS, true); return; }
    if (this.store.letter.draft?.writing !== 'lost') ghost.replaceChildren();
    if (change === 'create' || change === 'reset') this.endLift();
  }

  private setHighlight(on: boolean): void {
    if (this.highlight === on) return;
    this.highlight = on;
    this.drawPreview(true);
  }

  // ---------- Lift animation (the model already changed) ----------

  private startLift(lines: string[]): void {
    this.highlight = false;
    this.pointing.clear();
    if (prefersReducedMotion() || document.hidden) return;
    this.lift = { start: performance.now(), lines };
    const tick = () => {
      if (!this.lift) return;
      const t = (performance.now() - this.lift.start) / LIFT_MS;
      if (t >= 1) { this.endLift(); return; }
      this.drawPreview(true, t);
      this.liftFrame = requestAnimationFrame(tick);
    };
    this.liftFrame = requestAnimationFrame(tick);
  }
  private endLift(): void {
    if (!this.lift) return;
    this.lift = null;
    cancelAnimationFrame(this.liftFrame);
    this.drawPreview(true);
  }

  // ---------- Reframe ----------

  private openReframe(): void {
    const draft = this.store.letter.draft;
    if (!draft || !canReframe(draft.source)) return;
    this.reframing = true;
    this.framePreview = draft.frame;
    this.render();
    this.editor.show(draft.source, draft.frame, `draft-${draft.id}-${draft.captureId}`);
    this.renderReframeChips();
    this.editor.focusable.focus({ preventScroll: true });
  }
  private closeReframe(): void {
    if (!this.reframing) return;
    this.reframing = false;
    this.framePreview = null;
    this.render();
    this.container.querySelector<HTMLButtonElement>('[data-canvas="reframe"]')!.focus({ preventScroll: true });
  }
  private renderReframeChips(): void {
    const draft = this.store.letter.draft, list = this.container.querySelector<HTMLElement>('.reframe-panel .subject-chips')!;
    if (!draft) return;
    const status = letterStatus({ ...draft, frame: this.framePreview ?? draft.frame, mist: 1 });
    const head = document.createElement('li');
    head.className = 'subject-label';
    head.textContent = 'In the picture:';
    list.replaceChildren(head, ...[subjectLabel(status.subjects)].map(text => {
      const item = document.createElement('li');
      item.className = 'subject-chip';
      item.dataset.on = String(status.picture);
      item.textContent = text;
      return item;
    }));
  }

  // ---------- Rendering ----------

  private art(draft: LetterDraft): LetterArt {
    const art = letterArtFromDraft({ ...draft, frame: this.framePreview ?? draft.frame });
    const level = this.mistPreview ?? this.keepHover;
    if (level === null) return art;
    // While the slider moves or an option is pointed at, show exactly what choosing it would do (words included).
    const lose = level === 0 && draft.writing === 'mist';
    return { ...art, mist: level, mistWriting: lose ? [] : art.mistWriting };
  }

  private drawPreview(force = false, lift?: number): void {
    const draft = this.store.letter.draft;
    if (!draft) return;
    const frame = this.container.querySelector<HTMLElement>('.letter-frame')!;
    // The same value sizes the frame's width and its shape, so a Below letter fits its stage (visual-precision-v6 R3).
    frame.style.setProperty('--aspect', String(LETTER_ASPECT[draft.layout]));
    const key = `${draft.run}:${draft.id}:${draft.revision}:${this.preview.clientWidth}x${this.preview.clientHeight}`;
    if (!force && key === this.drawnKey) return;
    if (!fitCanvas(this.preview)) return;
    this.drawnKey = key;
    const art = this.art(draft);
    const captured = negativeWriting(draft.source);
    const lifting = lift !== undefined && this.lift ? { lift, liftLines: this.lift.lines } : {};
    // The lost words still exist in the capture: while Recover is pointed at, they show where they would come from.
    const highlight = this.highlight && (draft.writing === 'mist' || draft.writing === 'lost') && captured.length ? { highlightWriting: captured } : {};
    const shown = this.highlight && draft.writing === 'lost' ? { ...art, mistWriting: captured } : art;
    drawLetter(this.preview.getContext('2d')!, shown, this.preview.width, this.preview.height, { ...lifting, ...highlight, placeholder: !art.lines?.length && captured.length > 0 });
    const status = letterStatus(draft);
    this.preview.setAttribute('aria-label', `The letter: a photograph (${subjectLabel(status.subjects).toLowerCase()}) on ${draft.paper} paper${status.lines ? ', with Mara’s words beside it: ' + status.lines.join(' ') : ', without words'}.`);
  }

  /** The three options of what the photograph keeps, each drawn from this letter's own capture at its mist level. */
  private drawKeeps(force = false): void {
    const draft = this.store.letter.draft;
    if (!draft) return;
    const options = [...this.container.querySelectorAll<HTMLLabelElement>('.keep-option')];
    const key = `${draft.run}:${draft.id}:${draft.revision}:${options[0]?.clientWidth ?? 0}`;
    if (!force && key === this.keepKey) return;
    this.keepKey = key;
    const art = letterArtFromDraft(draft);
    let loses = false;
    options.forEach((option, index) => {
      const level = KEEP_LEVELS[index]!, preview = keepPreview(draft, level);
      const canvas = option.querySelector<HTMLCanvasElement>('.keep-thumb')!;
      if (fitCanvas(canvas)) drawPicture(canvas.getContext('2d')!, { ...art, mist: level, mistWriting: preview.losesWriting ? [] : art.mistWriting }, canvas.width, canvas.height);
      option.querySelector('.keep-label')!.textContent = preview.label;
      option.dataset.picture = String(preview.picture);
      option.dataset.loses = String(preview.losesWriting);
      // The warning is part of that option's description only while it is true.
      const input = option.querySelector('input')!, warning = this.container.querySelector<HTMLElement>('.keep-warning')!;
      if (preview.losesWriting) input.setAttribute('aria-describedby', warning.id); else input.removeAttribute('aria-describedby');
      loses ||= preview.losesWriting;
    });
    this.container.querySelector<HTMLElement>('.keep-warning')!.hidden = !loses;
  }

  private renderMistValue(): void {
    const draft = this.store.letter.draft;
    const value = this.mistPreview ?? draft?.mist ?? 1;
    this.container.querySelector('.mist-value')!.textContent = `${Math.round(value * 100)}%`;
  }

  private renderSaved(): void {
    this.container.querySelector('.canvas-saved')!.textContent = this.store.saveState === 'saved' ? 'Draft saved' : 'Session only';
  }

  private render(): void {
    const c = this.container, draft = this.store.letter.draft;
    c.dataset.state = draft ? 'draft' : 'empty';
    c.querySelector<HTMLElement>('.canvas-empty')!.hidden = !!draft;
    c.querySelector<HTMLElement>('.canvas-layers')!.hidden = !draft;
    c.querySelector<HTMLElement>('.canvas-stage')!.hidden = !draft;
    c.querySelector<HTMLElement>('.canvas-footer')!.hidden = !draft;
    c.querySelector<HTMLElement>('.reframe-panel')!.hidden = !this.reframing;
    c.querySelector<HTMLElement>('.reset-panel')!.hidden = !this.resetting;
    c.querySelector<HTMLElement>('.letter-frame')!.inert = this.reframing || this.resetting;
    if (!draft) { this.context.setSubtitle('No letter yet'); return; }
    this.context.setSubtitle(`Letter from capture ${draft.captureId}`);
    const status = letterStatus(draft), captured = negativeWriting(draft.source);
    const writing = c.querySelector<HTMLElement>('[data-layer="writing"]')!;
    const writingState = !captured.length ? 'none' : draft.writing;
    writing.dataset.state = writingState;
    writing.querySelector('.layer-state')!.textContent = writingState === 'none' ? noWritingState(draft)
      : writingState === 'mist' ? `In the mist: ${captured.length} lines, as she wrote them.` : writingState === 'paper' ? 'On the paper, verbatim.'
        : 'It went with the mist. The capture still holds it.';
    const focused = (document.activeElement as HTMLElement | null)?.dataset.canvas;
    for (const [name, show] of [['lift', writingState === 'mist'], ['recover', writingState === 'lost'], ['open-echo-writing', writingState === 'none']] as const) {
      c.querySelector<HTMLButtonElement>(`[data-canvas="${name}"]`)!.hidden = !show;
    }
    if ((focused === 'lift' || focused === 'recover') && writingState === 'paper') this.focusAfterWriting();
    const mist = c.querySelector<HTMLInputElement>('input[type="range"]')!;
    if (this.mistPreview === null) mist.value = String(Math.round(draft.mist * 100));
    this.renderMistValue();
    // A capture of the session window shows TERMINAL, not the glass: there is no mist to keep or clear in it.
    const glass = draft.source.kind !== 'session';
    for (const input of c.querySelectorAll<HTMLInputElement>('.keep-options input')) { input.checked = Number(input.value) === draft.mist; input.disabled = !glass; }
    c.querySelector<HTMLElement>('.keep-options')!.hidden = !glass;
    c.querySelector<HTMLElement>('.mist-row')!.hidden = !glass;
    const mistNote = glass ? 'The handprint is a mark in the mist; the figure stands behind it.' : 'This capture shows the session window, not the glass: it has no mist to keep or clear.';
    const photoNote = c.querySelector<HTMLElement>('[data-layer="photo"] .layer-note')!;
    if (photoNote.textContent !== mistNote) photoNote.textContent = mistNote;
    const reframe = c.querySelector<HTMLButtonElement>('[data-canvas="reframe"]')!;
    reframe.disabled = !canReframe(draft.source);
    reframe.title = reframe.disabled ? 'Only a capture of the glass has a frame to move.' : 'Move the photo frame over the capture';
    for (const input of c.querySelectorAll<HTMLInputElement>('[data-choice="paper"] input')) input.checked = input.value === draft.paper;
    for (const input of c.querySelectorAll<HTMLInputElement>('[data-choice="layout"] input')) input.checked = input.value === draft.layout;
    c.querySelector<HTMLButtonElement>('[data-canvas="undo"]')!.disabled = !this.store.letter.canUndo;
    c.querySelector<HTMLButtonElement>('[data-canvas="redo"]')!.disabled = !this.store.letter.canRedo;
    const ready = c.querySelector<HTMLElement>('.canvas-ready')!;
    ready.dataset.complete = String(status.complete);
    const delivered = this.store.deliveredLetter();
    const note = this.store.finished ? ' The job keeps the letter it accepted; sending this makes another copy.'
      : delivered?.letter && delivered.letter.draftId === draft.id
        ? delivered.letter.revision === draft.revision ? ' This is the letter you sent.' : ' Guest Inbox keeps the letter you sent; these changes are a new draft.' : '';
    const text = readiness(draft) + note;
    if (ready.textContent !== text) ready.textContent = text;
    this.renderSaved();
    this.drawPreview();
    this.drawKeeps();
  }

  open(target: OpenTarget): void {
    if (target.app !== 'canvas') return;
    this.render();
    if (target.focus === 'lift') {
      const lift = this.container.querySelector<HTMLButtonElement>('[data-canvas="lift"]')!;
      if (!lift.hidden && !lift.disabled) lift.focus({ preventScroll: true });
    }
  }
  focusTarget(): HTMLElement | null {
    if (!this.store.letter.draft) return this.container.querySelector<HTMLButtonElement>('[data-canvas="open-echo"]');
    for (const name of ['lift', 'recover']) {
      const button = this.container.querySelector<HTMLButtonElement>(`[data-canvas="${name}"]`)!;
      if (!button.hidden && !button.disabled) return button;
    }
    return this.container.querySelector<HTMLButtonElement>('[data-canvas="compose"]');
  }
  suspend(): void { this.endLift(); this.menus.close(false); }
  resume(): void { this.drawnKey = ''; this.keepKey = ''; this.render(); }
  dispose(): void {
    this.endLift();
    this.events.abort();
    this.menus.dispose();
    this.editor.dispose();
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
  }
}
