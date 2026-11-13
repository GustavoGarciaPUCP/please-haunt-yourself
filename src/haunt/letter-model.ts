import {
  EMPTY_FIELD, NO_SUBJECTS, decodeBytes, extractPatch, frameSubjects, patchField, pictureShowsPresence, subjectLabel, validBox, validLines, validPatch,
  validPlacement, validSize, GRID_SIZE, type Box, type GridPatch, type Placement, type Size, type Subjects,
} from './glass-model';
import { captureSubjects, clampFrame, negativeSize, negativeWriting, validNegative, validRun, validSessionFrame, type Capture, type Negative, type SessionFrame } from './echo-studio';
import { NOTE_START } from './legacy-session';

/**
 * CANVAS's letter (.kiro/specs/os-case-v4 design §4). One editable draft made from a capture. The draft embeds its own
 * copy of the capture's negative, so discarding the capture in ECHO never breaks it. Mara's words come only from the
 * captured writing layer; the player authors the picture (frame, mist) and the layout, never her text.
 * Undo/redo are local to the draft. A snapshot is the immutable copy POSTMAN delivers. No DOM access.
 */
export type WritingState = 'mist' | 'paper' | 'lost';
export type Paper = 'bone' | 'night';
export type Layout = 'beside' | 'below';
export type Missing = 'picture' | 'writing' | 'writing-lost' | 'no-writing';
export const NOT_THE_WORDS = 'Not the words.';

export interface LetterDraft {
  id: number;
  run: string;
  /** Monotonic count of edits (Undo is an edit too), so a delivered revision is identifiable. */
  revision: number;
  captureId: number;
  source: Negative;
  frame: Box;
  /** How much of the captured condensation stays on the picture (0–1, steps of 0.1). */
  mist: number;
  writing: WritingState;
  paper: Paper;
  layout: Layout;
}
/** Everything a delivered letter needs, copied: the picture data under its frame and the lifted words, if any. */
export interface LetterSnapshot {
  draftId: number;
  revision: number;
  run: string;
  captureId: number;
  kind: Negative['kind'];
  stage: Size;
  placement: Placement | null;
  patch: GridPatch | null;
  session: SessionFrame | null;
  frame: Box;
  mist: number;
  /** The writing still cut into the mist of the picture (when it was never lifted). */
  mistWriting: string[];
  /** The words on the paper, verbatim from the capture, or null. */
  lines: string[] | null;
  paper: Paper;
  layout: Layout;
  subject: string;
  complete: boolean;
  missing: Missing[];
}
export interface LetterStatus { subjects: Subjects; picture: boolean; lines: string[] | null; complete: boolean; missing: Missing[]; }
export type LetterChange = 'create' | 'edit' | 'words-lost' | 'recover' | 'undo' | 'redo' | 'reset';
export type UseResult = 'created' | 'replaced' | 'reframed' | 'needs-confirm' | 'same';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const round = (value: number): number => Math.round(Math.max(0, Math.min(1, value)) * 10) / 10;
type Content = Omit<LetterDraft, 'id' | 'run' | 'revision'>;

/** CANVAS's sentences for a letter made from a capture of the glass (session and old limited captures have their own). */
export const MISSING_TEXT: Readonly<Record<Missing, string>> = {
  picture: 'The picture shows only mist. Move the frame over the handprint or the figure.',
  writing: 'The writing is still in the mist. Lift it onto the paper.',
  // Names an action that is always available while the words are lost, including after a reload (playability-v5 R2).
  'writing-lost': 'The writing went with the mist. Recover it from the capture.',
  'no-writing': 'This capture has no writing. Use a newer capture of the glass from ECHO.',
};

/** Where the visible note in TERMINAL's session window stops. */
export const NOTE_STOP = NOTE_START.split(' ').at(-1)!;
/** What a letter's picture comes from, for the words that describe what is missing from it. */
export interface LetterSource { kind: Negative['kind'] | null; subject: string | null; attached: boolean; }
/**
 * Short reasons a letter is incomplete, for lists (POSTMAN, TERMINAL), in the words of its own source
 * (visual-precision-v6 R4): a session window is TERMINAL's window, not "only mist", and its note stops mid-word; an
 * old limited picture kept no writing; bare glass is bare; a draft sent without the letter has none at all.
 */
export function missingPhrases(source: LetterSource, missing: readonly Missing[]): string {
  if (!source.attached || source.kind === null) return 'no letter is attached';
  const phrase = (item: Missing): string => {
    switch (item) {
      case 'picture': return source.kind === 'session' ? 'the picture is TERMINAL’s window, not the glass'
        : source.subject === 'Bare glass' ? 'the picture shows bare glass' : 'the picture shows only mist';
      case 'writing': return 'the writing is still in the mist';
      case 'writing-lost': return 'the writing went with the mist';
      case 'no-writing': return source.kind === 'session' ? `its note stops at “${NOTE_STOP}”` : source.kind === 'limited' ? 'the old picture kept no writing'
        : 'the glass had no writing yet when it was captured';
    }
  };
  return missing.map(phrase).join('; ') || 'it is missing its picture or its writing';
}
/** The same, for a delivered snapshot (or none). */
export const snapshotSource = (letter: LetterSnapshot | null): LetterSource => ({ kind: letter?.kind ?? null, subject: letter?.subject ?? null, attached: !!letter });

export function letterStatus(draft: Pick<LetterDraft, 'source' | 'frame' | 'mist' | 'writing'>): LetterStatus {
  const subjects = draft.source.kind === 'session' ? NO_SUBJECTS : captureSubjects(draft.source, draft.frame, draft.mist);
  const picture = pictureShowsPresence(subjects);
  const captured = negativeWriting(draft.source);
  const lines = draft.writing === 'paper' && captured.length ? captured : null;
  const missing: Missing[] = [];
  if (!picture) missing.push('picture');
  if (!captured.length) missing.push('no-writing');
  else if (draft.writing === 'mist') missing.push('writing');
  else if (draft.writing === 'lost') missing.push('writing-lost');
  return { subjects, picture, lines, complete: missing.length === 0, missing };
}

function contentFrom(capture: Capture, keep?: Pick<Content, 'paper' | 'layout'>): Content {
  return { captureId: capture.id, source: copy(capture.negative), frame: { ...capture.frame }, mist: 1, writing: 'mist', paper: keep?.paper ?? 'bone', layout: keep?.layout ?? 'beside' };
}

export class LetterModel {
  private draftValue: LetterDraft | null = null;
  private nextId = 1;
  private past: Content[] = [];
  private future: Content[] = [];
  private listeners = new Set<(change: LetterChange) => void>();

  constructor(saved: SavedLetter | null = null) {
    if (saved) { this.draftValue = saved.draft ? copy(saved.draft) : null; this.nextId = saved.nextId; }
  }

  subscribe(listener: (change: LetterChange) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private changed(change: LetterChange): void { this.listeners.forEach(listener => listener(change)); }

  get draft(): LetterDraft | null { return this.draftValue ? copy(this.draftValue) : null; }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }
  status(): LetterStatus | null { return this.draftValue ? letterStatus(this.draftValue) : null; }

  private content(): Content {
    const { id: _id, run: _run, revision: _revision, ...content } = this.draftValue!;
    return copy(content);
  }
  /** Commits one edit: remembered for Undo, a new revision, and the redo branch dropped. */
  private commit(next: Content, change: LetterChange = 'edit'): void {
    const draft = this.draftValue!;
    this.past.push(this.content());
    if (this.past.length > 40) this.past.shift();
    this.future = [];
    this.draftValue = { ...draft, ...copy(next), revision: draft.revision + 1 };
    this.changed(change);
  }

  /**
   * "Use this capture". The first time it creates the draft. Later, a different capture replaces the draft's source,
   * but only once the player confirms (CANVAS shows before and after, and Undo reverts it).
   */
  useCapture(run: string, capture: Capture, confirmReplace = false): UseResult {
    if (!this.draftValue || this.draftValue.run !== run) {
      this.draftValue = { id: this.nextId++, run, revision: 1, ...contentFrom(capture) };
      this.past = []; this.future = [];
      this.changed('create');
      return 'created';
    }
    if (this.draftValue.captureId === capture.id && JSON.stringify(this.draftValue.source) === JSON.stringify(capture.negative)) {
      // The same capture with a new frame from ECHO: only the picture's frame changes (one edit, undoable).
      const frame = capture.negative.kind === 'glass' ? clampFrame(capture.frame, negativeSize(capture.negative)) : this.draftValue.frame;
      const current = this.draftValue.frame;
      if (frame.x === current.x && frame.y === current.y && frame.w === current.w) return 'same';
      this.commit({ ...this.content(), frame });
      return 'reframed';
    }
    if (!confirmReplace) return 'needs-confirm';
    this.commit(contentFrom(capture, this.draftValue));
    return 'replaced';
  }

  /** Separates the captured writing from the mist onto the paper. Only words that were captured can be lifted. */
  liftWriting(): boolean {
    const draft = this.draftValue;
    if (!draft || draft.writing !== 'mist' || !negativeWriting(draft.source).length) return false;
    this.commit({ ...this.content(), writing: 'paper' });
    return true;
  }
  /** Clearing all the mist while the words are still in it clears the words too: "Not the words." Undo restores them. */
  setMist(level: number): boolean {
    const draft = this.draftValue;
    if (!draft) return false;
    const mist = round(level);
    if (mist === draft.mist) return false;
    const lose = mist === 0 && draft.writing === 'mist' && negativeWriting(draft.source).length > 0;
    this.commit({ ...this.content(), mist, writing: lose ? 'lost' : draft.writing }, lose ? 'words-lost' : 'edit');
    return true;
  }
  /**
   * Recover the writing: the letter's own copy of the capture still holds the writing layer, so the lost words go back,
   * verbatim, onto the paper. The frame, the mist, the paper and the layout stay as they are. A source that never held
   * writing gains nothing. Undo reverts it like any other edit.
   */
  recoverWriting(): boolean {
    const draft = this.draftValue;
    if (!draft || draft.writing !== 'lost' || !negativeWriting(draft.source).length) return false;
    this.commit({ ...this.content(), writing: 'paper' }, 'recover');
    return true;
  }
  setFrame(frame: Box): boolean {
    const draft = this.draftValue;
    if (!draft || draft.source.kind !== 'glass') return false;
    const next = clampFrame(frame, negativeSize(draft.source));
    if (next.x === draft.frame.x && next.y === draft.frame.y && next.w === draft.frame.w) return false;
    this.commit({ ...this.content(), frame: next });
    return true;
  }
  setPaper(paper: Paper): boolean {
    if (!this.draftValue || this.draftValue.paper === paper) return false;
    this.commit({ ...this.content(), paper });
    return true;
  }
  setLayout(layout: Layout): boolean {
    if (!this.draftValue || this.draftValue.layout === layout) return false;
    this.commit({ ...this.content(), layout });
    return true;
  }
  /** Back to the capture as it was used (explicit; Undo reverts it). */
  resetToSource(): boolean {
    const draft = this.draftValue;
    if (!draft) return false;
    const base: Content = { captureId: draft.captureId, source: copy(draft.source), frame: { ...draft.frame }, mist: 1, writing: 'mist', paper: 'bone', layout: 'beside' };
    if (JSON.stringify(base) === JSON.stringify(this.content())) return false;
    this.commit(base, 'reset');
    return true;
  }

  undo(): boolean {
    const previous = this.past.pop();
    if (!previous || !this.draftValue) return false;
    this.future.push(this.content());
    this.draftValue = { ...this.draftValue, ...previous, revision: this.draftValue.revision + 1 };
    this.changed('undo');
    return true;
  }
  redo(): boolean {
    const next = this.future.pop();
    if (!next || !this.draftValue) return false;
    this.past.push(this.content());
    this.draftValue = { ...this.draftValue, ...next, revision: this.draftValue.revision + 1 };
    this.changed('redo');
    return true;
  }

  /** The immutable copy a delivery keeps: only the condensation under the frame, and the words verbatim. */
  snapshot(): LetterSnapshot | null {
    const draft = this.draftValue;
    if (!draft) return null;
    const status = letterStatus(draft);
    const source = draft.source;
    let stage: Size = negativeSize(source), placement: Placement | null = null, patch: GridPatch | null = null, session: SessionFrame | null = null;
    if (source.kind === 'session') session = { ...source.session };
    else if (source.kind === 'glass') {
      placement = source.placement ? copy(source.placement) : null;
      const bytes = decodeBytes(source.fog, GRID_SIZE);
      patch = placement && bytes ? extractPatch(bytes, draft.frame, source.stage) : null;
    } else { placement = source.placement ? copy(source.placement) : null; patch = source.patch ? copy(source.patch) : null; stage = { ...source.stage }; }
    return {
      draftId: draft.id, revision: draft.revision, run: draft.run, captureId: draft.captureId, kind: source.kind, stage, placement, patch, session,
      frame: { ...draft.frame }, mist: draft.mist, mistWriting: draft.writing === 'mist' ? negativeWriting(source) : [], lines: status.lines ? [...status.lines] : null,
      paper: draft.paper, layout: draft.layout, subject: subjectLabel(status.subjects), complete: status.complete, missing: [...status.missing],
    };
  }

  /** A new run starts without a draft. */
  reset(): void { this.draftValue = null; this.past = []; this.future = []; this.changed('reset'); }

  toSaved(): SavedLetter { return { draft: this.draftValue ? copy(this.draftValue) : null, nextId: this.nextId }; }
}

/**
 * "The photograph keeps" (playability-v5 R5): three mist levels that trade the handprint (a cut in the mist) against
 * the figure (behind it). Each option is described from the letter's own capture, never from a fixed caption.
 */
export const KEEP_LEVELS: readonly number[] = [1, 0.4, 0];
/** A picture's subject label in a sentence: "the handprint and the figure", "the figure", "only mist"… */
export function keepsPhrase(subject: string): string {
  switch (subject) {
    case 'Handprint and figure': return 'the handprint and the figure';
    case 'Handprint': return 'the handprint';
    case 'Figure': return 'the figure';
    default: return subject.toLowerCase();
  }
}
export interface KeepPreview { mist: number; subjects: Subjects; label: string; picture: boolean; losesWriting: boolean; }
export function keepPreview(draft: Pick<LetterDraft, 'source' | 'frame' | 'writing'>, mist: number): KeepPreview {
  const subjects = draft.source.kind === 'session' ? NO_SUBJECTS : captureSubjects(draft.source, draft.frame, mist);
  return {
    mist, subjects, label: subjectLabel(subjects), picture: pictureShowsPresence(subjects),
    // Clearing all the mist while the words are still in it would take them with it.
    losesWriting: mist === 0 && draft.writing === 'mist' && negativeWriting(draft.source).length > 0,
  };
}

/** Subjects of a delivered snapshot, recomputed from its own data (for validation and display). */
export function snapshotSubjects(snapshot: LetterSnapshot): Subjects {
  if (snapshot.kind === 'session' || !snapshot.placement) return NO_SUBJECTS;
  const field = snapshot.patch ? patchField(snapshot.patch) ?? EMPTY_FIELD : EMPTY_FIELD;
  return frameSubjects(snapshot.placement, field, snapshot.frame, snapshot.stage, [...snapshot.mistWriting, ...(snapshot.lines ?? [])], snapshot.mist);
}
/** A delivered letter is complete only if its own data shows the presence and carries the words. */
export function snapshotComplete(snapshot: LetterSnapshot | null): boolean {
  return !!snapshot && pictureShowsPresence(snapshotSubjects(snapshot)) && !!snapshot.lines && snapshot.lines.length > 0;
}

// ---------- Saved form ----------

export interface SavedLetter { draft: LetterDraft | null; nextId: number; }
const isInt = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const validMist = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export function validDraft(value: unknown): value is LetterDraft {
  if (!isObject(value)) return false;
  const { id, run, revision, captureId, source, frame, mist, writing, paper, layout } = value;
  return isInt(id, 1, 1_000_000) && validRun(run) && isInt(revision, 1, 1_000_000) && isInt(captureId, 1, 1_000_000) && validNegative(source) && validBox(frame)
    && validMist(mist) && (writing === 'mist' || writing === 'paper' || writing === 'lost') && (paper === 'bone' || paper === 'night') && (layout === 'beside' || layout === 'below');
}
export function parseLetter(value: unknown): SavedLetter | null {
  if (!isObject(value) || !isInt(value.nextId, 1, 1_000_001)) return null;
  if (value.draft !== null && !validDraft(value.draft)) return null;
  if (value.draft && (value.draft as LetterDraft).id >= (value.nextId as number)) return null;
  return { draft: value.draft as LetterDraft | null, nextId: value.nextId as number };
}
const MISSING_VALUES: readonly Missing[] = ['picture', 'writing', 'writing-lost', 'no-writing'];
export function validSnapshot(value: unknown): value is LetterSnapshot {
  if (!isObject(value)) return false;
  const v = value;
  const kindOk = v.kind === 'session' || v.kind === 'glass' || v.kind === 'limited';
  return kindOk && isInt(v.draftId, 1, 1_000_000) && isInt(v.revision, 1, 1_000_000) && validRun(v.run) && isInt(v.captureId, 1, 1_000_000) && validSize(v.stage)
    && (v.placement === null || validPlacement(v.placement)) && (v.patch === null || validPatch(v.patch)) && (v.session === null || validSessionFrame(v.session))
    && validBox(v.frame) && validMist(v.mist) && validLines(v.mistWriting) && (v.lines === null || validLines(v.lines))
    && (v.paper === 'bone' || v.paper === 'night') && (v.layout === 'beside' || v.layout === 'below') && typeof v.subject === 'string' && v.subject.length <= 40
    && typeof v.complete === 'boolean' && Array.isArray(v.missing) && v.missing.every(item => MISSING_VALUES.includes(item as Missing));
}
