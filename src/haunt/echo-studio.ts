import type { Presence } from './legacy-session';
import {
  EMPTY_FIELD, GRID_SIZE, NO_SUBJECTS, decodeBytes, frameSubjects, gridField, patchField, validBox, validLines, validPatch, validPlacement, validSize,
  type Box, type FogField, type GridPatch, type Placement, type Size, type Subjects,
} from './glass-model';

/**
 * ECHO's capture studio (.kiro/specs/os-case-v4 design §3). A live link follows the case; a paused frame is a frozen
 * view that is never kept unless captured. A capture keeps a full negative of its source, which never changes, and a
 * separate photo frame, which the player may move. Old v3 prints are `limited` negatives: their picture only.
 * No DOM access.
 */
export type EchoSource = 'session' | 'glass';
export const MAX_CAPTURES = 8;
/** ECHO's monitor and every photo frame share this aspect ratio. */
export const FRAME_ASPECT = 16 / 10;
/** The session window is drawn in its own 320×200 coordinate space. */
export const SESSION_SIZE: Size = { w: 320, h: 200 };

/** What the session-window source showed: a copy of the request's visible state, never a reference to it. */
export interface SessionFrame { presence: Presence; attempts: number; pid: number | null; retry: boolean; muffled: boolean; }
export type Negative =
  | { kind: 'session'; session: SessionFrame }
  | { kind: 'glass'; stage: Size; placement: Placement | null; fog: string; writing: string[] }
  | { kind: 'limited'; stage: Size; placement: Placement | null; patch: GridPatch | null; crop: Box };
export interface Capture { id: number; run: string; negative: Negative; frame: Box; }
export interface SavedStudio { captures: Capture[]; nextId: number; }
export type StudioChange = 'source' | 'pause' | 'resume' | 'capture' | 'frame' | 'discard' | 'undo-discard' | 'reset';
export type CaptureResult = { ok: true; capture: Capture } | { ok: false; reason: 'full' };

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

// ---------- Reading a capture ----------

const fields = new Map<string, FogField>();
/** The condensation of a glass negative (decoded once per distinct grid). */
export function negativeField(negative: Negative): FogField {
  if (negative.kind === 'glass') {
    let field = fields.get(negative.fog);
    if (!field) {
      const bytes = decodeBytes(negative.fog, GRID_SIZE);
      field = bytes ? gridField(bytes) : EMPTY_FIELD;
      if (fields.size > 24) fields.delete(fields.keys().next().value!);
      fields.set(negative.fog, field);
    }
    return field;
  }
  if (negative.kind === 'limited' && negative.patch) return patchField(negative.patch) ?? EMPTY_FIELD;
  return EMPTY_FIELD;
}
export const negativeSize = (negative: Negative): Size => negative.kind === 'session' ? SESSION_SIZE : negative.stage;
export const negativeWriting = (negative: Negative): string[] => negative.kind === 'glass' ? [...negative.writing] : [];
export const canReframe = (negative: Negative): boolean => negative.kind === 'glass';

/** What a frame of this capture shows (mist 1 = as captured). Session windows and bare glass show no impression. */
export function captureSubjects(negative: Negative, frame: Box, mist = 1): Subjects {
  if (negative.kind === 'session' || !negative.placement) return NO_SUBJECTS;
  return frameSubjects(negative.placement, negativeField(negative), frame, negative.stage, negativeWriting(negative), mist);
}
/** A capture that can become a complete letter: the glass, after the milestone, with its writing layer. */
export const isUsefulCapture = (capture: Capture | null | undefined): boolean =>
  !!capture && capture.negative.kind === 'glass' && capture.negative.placement !== null && capture.negative.writing.length > 0;

// ---------- Photo frames (capture coordinates, fixed aspect) ----------

export function clampFrame(frame: Box, size: Size): Box {
  const w = clamp(frame.w, Math.min(size.w, size.h * 0.32 * FRAME_ASPECT), size.w), h = w / FRAME_ASPECT;
  const height = Math.min(h, size.h), width = height * FRAME_ASPECT;
  return { x: clamp(frame.x, 0, size.w - width), y: clamp(frame.y, 0, size.h - height), w: width, h: height };
}
export const moveFrame = (frame: Box, dx: number, dy: number, size: Size): Box => clampFrame({ ...frame, x: frame.x + dx, y: frame.y + dy }, size);
/** Grows or shrinks around the centre. */
export function scaleFrame(frame: Box, factor: number, size: Size): Box {
  const w = frame.w * factor, h = w / FRAME_ASPECT;
  return clampFrame({ x: frame.x + (frame.w - w) / 2, y: frame.y + (frame.h - h) / 2, w, h }, size);
}

export class EchoStudio {
  private sourceValue: EchoSource = 'session';
  private pausedFrame: SessionFrame | null = null;
  private captures: Capture[] = [];
  private nextId = 1;
  private discarded: { capture: Capture; index: number } | null = null;
  private listeners = new Set<(change: StudioChange) => void>();

  constructor(saved: SavedStudio | null = null) {
    if (saved) { this.captures = copy(saved.captures); this.nextId = saved.nextId; }
  }

  subscribe(listener: (change: StudioChange) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private changed(change: StudioChange): void { this.listeners.forEach(listener => listener(change)); }

  get source(): EchoSource { return this.sourceValue; }
  get paused(): SessionFrame | null { return this.pausedFrame ? { ...this.pausedFrame } : null; }
  get canUndoDiscard(): boolean { return this.discarded !== null; }
  get full(): boolean { return this.captures.length >= MAX_CAPTURES; }
  list(): Capture[] { return copy(this.captures); }
  get(id: number): Capture | null { const found = this.captures.find(item => item.id === id); return found ? copy(found) : null; }

  /** Switching source drops a paused view: a pause was never a kept picture. */
  setSource(source: EchoSource): void {
    if (source === this.sourceValue) return;
    this.sourceValue = source;
    this.pausedFrame = null;
    this.changed('source');
  }
  /** Freezes the session view at this frame. The job itself keeps running in TERMINAL. */
  pause(frame: SessionFrame): void {
    if (this.sourceValue !== 'session' || this.pausedFrame) return;
    this.pausedFrame = { ...frame };
    this.changed('pause');
  }
  resume(): void { if (!this.pausedFrame) return; this.pausedFrame = null; this.changed('resume'); }

  /**
   * Keeps a full negative of the selected source as it is now. For the glass, the initial photo frame is the monitor's
   * rectangle on the glass; for the session window it is the whole window.
   */
  capture(run: string, live: { session: SessionFrame; glass: { stage: Size; placement: Placement | null; fog: string; writing: string[]; monitor: Box } }): CaptureResult {
    if (this.full) return { ok: false, reason: 'full' };
    const negative: Negative = this.sourceValue === 'session'
      ? { kind: 'session', session: { ...(this.pausedFrame ?? live.session) } }
      : { kind: 'glass', stage: { ...live.glass.stage }, placement: live.glass.placement ? copy(live.glass.placement) : null, fog: live.glass.fog, writing: [...live.glass.writing] };
    const frame = negative.kind === 'session' ? { x: 0, y: 0, w: SESSION_SIZE.w, h: SESSION_SIZE.h } : clampFrame(live.glass.monitor, negative.stage);
    const capture: Capture = { id: this.nextId++, run, negative, frame };
    this.captures.push(capture);
    this.discarded = null;
    this.changed('capture');
    return { ok: true, capture: copy(capture) };
  }

  /** Moves a capture's photo frame. The negative never changes; session windows and limited prints keep their frame. */
  reframe(id: number, frame: Box): boolean {
    const capture = this.captures.find(item => item.id === id);
    if (!capture || !canReframe(capture.negative)) return false;
    const next = clampFrame(frame, negativeSize(capture.negative));
    if (next.x === capture.frame.x && next.y === capture.frame.y && next.w === capture.frame.w) return false;
    capture.frame = next;
    this.changed('frame');
    return true;
  }

  /** Letters keep their own copy of a capture, so discarding one here never breaks them. */
  discard(id: number): void {
    const index = this.captures.findIndex(item => item.id === id);
    if (index < 0) return;
    const [capture] = this.captures.splice(index, 1);
    this.discarded = { capture: capture!, index };
    this.changed('discard');
  }
  /** One step back from the last discard only. */
  undoDiscard(): Capture | null {
    const entry = this.discarded;
    if (!entry || this.full) return null;
    this.captures.splice(Math.min(entry.index, this.captures.length), 0, entry.capture);
    this.discarded = null;
    this.changed('undo-discard');
    return copy(entry.capture);
  }

  reset(): void {
    this.sourceValue = 'session'; this.pausedFrame = null; this.captures = []; this.nextId = 1; this.discarded = null;
    this.changed('reset');
  }

  toSaved(): SavedStudio { return { captures: copy(this.captures), nextId: this.nextId }; }
}

// ---------- Validation of stored captures (untrusted data) ----------

const isInt = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const PRESENCES: readonly Presence[] = ['terminal', 'shadow', 'glass', 'released'];

export function validSessionFrame(value: unknown): value is SessionFrame {
  if (!isObject(value)) return false;
  const { presence, attempts, pid, retry, muffled } = value;
  return PRESENCES.includes(presence as Presence) && isInt(attempts, 0, 999) && (pid === null || isInt(pid, 1, 99999)) && typeof retry === 'boolean' && typeof muffled === 'boolean';
}
export const validRun = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9-]{4,40}$/.test(value);

export function validNegative(value: unknown): value is Negative {
  if (!isObject(value)) return false;
  if (value.kind === 'session') return validSessionFrame(value.session);
  if (value.kind === 'glass') return validSize(value.stage) && (value.placement === null || validPlacement(value.placement))
    && decodeBytes(value.fog, GRID_SIZE) !== null && validLines(value.writing) && (value.placement !== null || (value.writing as string[]).length === 0);
  if (value.kind === 'limited') return validSize(value.stage) && (value.placement === null || validPlacement(value.placement))
    && (value.patch === null || validPatch(value.patch)) && validBox(value.crop) && (value.placement === null) === (value.patch === null);
  return false;
}
export function validCapture(value: unknown): value is Capture {
  return isObject(value) && isInt(value.id, 1, 1_000_000) && validRun(value.run) && validNegative(value.negative) && validBox(value.frame);
}
export function parseStudio(value: unknown): SavedStudio | null {
  if (!isObject(value) || !Array.isArray(value.captures) || value.captures.length > MAX_CAPTURES || !value.captures.every(validCapture)) return null;
  const captures = value.captures as Capture[];
  const ids = captures.map(capture => capture.id);
  if (new Set(ids).size !== ids.length || !isInt(value.nextId, 1, 1_000_001) || ids.some(id => id >= (value.nextId as number))) return null;
  return { captures, nextId: value.nextId as number };
}
