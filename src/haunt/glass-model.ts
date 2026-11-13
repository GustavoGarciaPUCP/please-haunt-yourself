import { NOTE_LINES } from './legacy-session';

/**
 * The desktop glass (.kiro/specs/os-case-v4 design §2–3): one shared model read by the desktop canvas, ECHO's monitor,
 * every capture and every letter. Positions are normalized to the desktop stage; shape sizes are fractions of the stage
 * height, so the impression keeps its proportions on any PC screen. Condensation is a bounded 128×72 grid.
 * The writing is its own layer: finger marks the session left at the milestone. Wiping removes mist, not the marks,
 * which is why breathing on the glass brings the words back. No DOM access.
 */
export const GRID_COLS = 128;
export const GRID_ROWS = 72;
export const GRID_SIZE = GRID_COLS * GRID_ROWS;

export interface Size { w: number; h: number; }
export interface Box { x: number; y: number; w: number; h: number; }
export interface Point { x: number; y: number; }
export type Side = 'right' | 'left';
/** Where the last impression was pressed: the hand's centre (normalized) and the window edge it crossed. */
export interface Placement { hand: { u: number; v: number }; side: Side; }
/** Condensation density, 0 (clear) to 1 (dense), per grid cell. */
export interface FogField { at(col: number, row: number): number; }
export interface GridPatch { c0: number; r0: number; cols: number; rows: number; data: string; }
export interface SavedGlass { hand: [number, number]; side: Side; fog: string; revealSeen: boolean; writing: string[]; released: boolean; }

/** How the session wrote its note with a fingertip: the heading wraps onto two lines. Data for the milestone, not for captures. */
export const MIST_LINES: readonly string[] = ['FOR THE NEXT PERSON', 'AT THIS DESK', NOTE_LINES[1], NOTE_LINES[2], NOTE_LINES[3]];
export const HAND = { w: 0.19, h: 0.25 };
export const WRITING = { font: 0.028, lineHeight: 0.045, gap: 0.026 };
export const FIGURE = { w: 0.3, h: 0.54 };
/** The figure's centre sits this far outward from the hand (× stage height): a raised palm beside its face. */
export const FIGURE_OFFSET = 0.15;
/** Wipe radius as a fraction of the stage height. */
export const BRUSH = 0.045;
export const CLEARED_FOG = 0.35;
export const MAX_WRITING_LINES = 8;
export const MAX_LINE_LENGTH = 60;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
export const area = (box: Box): number => Math.max(0, box.w) * Math.max(0, box.h);
export function intersect(a: Box, b: Box): Box | null {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w), bottom = Math.min(a.y + a.h, b.y + b.h);
  return right > x && bottom > y ? { x, y, w: right - x, h: bottom - y } : null;
}
export const overlap = (a: Box, b: Box): number => { const box = intersect(a, b); return box ? area(box) : 0; };

/** Deterministic integer hash → [0, 1). The same glass always fogs the same way, in captures too. */
export function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, seed), b = hash2(x0 + 1, y0, seed), c = hash2(x0, y0 + 1, seed), d = hash2(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
/** Uneven condensation: patchy, a little denser toward the bottom of the glass. */
export function fogBase(col: number, row: number): number {
  return clamp01(0.62 + 0.22 * valueNoise(col * 0.09, row * 0.11, 7) + 0.08 * valueNoise(col * 0.27, row * 0.3, 13) + 0.12 * (row / (GRID_ROWS - 1)));
}
/** When each cell condenses during the reveal (fraction of the reveal). Presentation only. */
export const revealDelay = (col: number, row: number): number => 0.06 + 0.3 * valueNoise(col * 0.15, row * 0.15, 29);

export function createFog(): Uint8Array {
  const fog = new Uint8Array(GRID_SIZE);
  for (let row = 0; row < GRID_ROWS; row++) for (let col = 0; col < GRID_COLS; col++) fog[row * GRID_COLS + col] = Math.round(fogBase(col, row) * 255);
  return fog;
}

export function gridField(fog: Uint8Array): FogField {
  return { at: (col, row) => (col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS ? 0 : fog[row * GRID_COLS + col]! / 255) };
}
export const EMPTY_FIELD: FogField = { at: () => 0 };

// ---------- The impression's geometry (stage px) ----------

export function handBox(placement: Placement, stage: Size): Box {
  const w = HAND.w * stage.h, h = HAND.h * stage.h;
  return { x: placement.hand.u * stage.w - w / 2, y: placement.hand.v * stage.h - h / 2, w, h };
}

/** Width of a handwritten line in units of its font size (deterministic, so geometry never depends on a font). */
export function lineEm(text: string): number {
  let em = 0;
  for (const ch of text) em += /[A-Z]/.test(ch) ? 0.66 : /[a-z]/.test(ch) ? 0.5 : /[0-9]/.test(ch) ? 0.55 : ch === ' ' ? 0.32 : ch === '—' ? 0.9 : 0.24;
  return Math.max(1, em);
}

/** One box per written line, on the inner side of the hand (behind the window it crossed). */
export function writingBoxes(placement: Placement, stage: Size, lines: readonly string[]): Box[] {
  if (!lines.length) return [];
  const hand = handBox(placement, stage), font = WRITING.font * stage.h, line = WRITING.lineHeight * stage.h, gap = WRITING.gap * stage.h;
  const widths = lines.map(text => lineEm(text) * font), block = Math.max(...widths);
  const x = placement.side === 'right' ? hand.x - gap - block : hand.x + hand.w + gap;
  const y = hand.y + 0.03 * stage.h;
  return widths.map((w, index) => ({ x, y: y + index * line, w, h: font * 1.1 }));
}
export const writingFont = (stage: Size): number => WRITING.font * stage.h;

/** The presence stands behind the glass, offset outward from the window, its raised palm on the print. */
export function figureBox(placement: Placement, stage: Size): Box {
  const hand = handBox(placement, stage), w = FIGURE.w * stage.h, h = FIGURE.h * stage.h;
  const outward = placement.side === 'right' ? 1 : -1;
  return { x: hand.x + hand.w / 2 + outward * FIGURE_OFFSET * stage.h - w / 2, y: hand.y - 0.06 * stage.h, w, h };
}

/**
 * The glass around the pressed hand, 16:10 (.kiro/specs/playability-v5 design §5): the whole handprint, the presence's
 * head and the arm that reaches to it, but not the ends of the written lines on the hand's other side. TERMINAL's
 * receipt shows this region of the live glass, so the release is seen even while windows cover the desktop.
 */
export const HAND_REGION = { w: 0.5, outward: 0.12, up: 0.03 } as const;
export function handRegion(placement: Placement, stage: Size): Box {
  const outward = placement.side === 'right' ? 1 : -1;
  const w = Math.min(stage.w, HAND_REGION.w * stage.h), h = Math.min(stage.h, w / 1.6);
  const cx = placement.hand.u * stage.w + outward * HAND_REGION.outward * stage.h, cy = placement.hand.v * stage.h - HAND_REGION.up * stage.h;
  return { x: clamp(cx - w / 2, 0, Math.max(0, stage.w - w)), y: clamp(cy - h / 2, 0, Math.max(0, stage.h - h)), w, h };
}

/**
 * Places the impression once, at the milestone: the hand crosses TERMINAL's right edge (left if that side is covered
 * or off the glass), so a little of it peeks out and moving the window exposes the rest.
 */
export function placeImpression(stage: Size, terminal: Box | null, occluders: readonly Box[] = []): Placement {
  if (!terminal || stage.w <= 0 || stage.h <= 0) return { hand: { u: 0.62, v: 0.48 }, side: 'right' };
  const hw = HAND.w * stage.h, hh = HAND.h * stage.h, margin = 0.02 * stage.h;
  const v = clamp((terminal.y + terminal.h * 0.42) / stage.h, (hh / 2 + margin) / stage.h, 1 - (hh / 2 + margin) / stage.h);
  const glass = { x: 0, y: 0, w: stage.w, h: stage.h };
  const options = (['right', 'left'] as const).map(side => {
    const raw = side === 'right' ? terminal.x + terminal.w - 0.12 * hw : terminal.x + 0.12 * hw;
    const cx = clamp(raw, hw / 2 + margin, stage.w - hw / 2 - margin);
    const placement: Placement = { hand: { u: cx / stage.w, v }, side };
    const hand = handBox(placement, stage);
    const peek: Box = side === 'right' ? { x: terminal.x + terminal.w, y: hand.y, w: hand.x + hand.w - terminal.x - terminal.w, h: hand.h }
      : { x: hand.x, y: hand.y, w: terminal.x - hand.x, h: hand.h };
    const peekArea = area(peek);
    const visible = peekArea > 0 ? (overlap(peek, glass) - occluders.reduce((sum, box) => sum + overlap(peek, box), 0)) / peekArea : 0;
    const fits = writingBoxes(placement, stage, MIST_LINES).every(box => box.x >= 0 && box.x + box.w <= stage.w);
    return { placement, score: clamp01(visible) + (fits ? 0.25 : 0) + (side === 'right' ? 0.01 : 0) };
  });
  options.sort((a, b) => b.score - a.score);
  return options[0]!.placement;
}

// ---------- Wiping and breathing ----------

function distanceToSegment(x: number, y: number, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
  const t = length ? clamp01(((x - a.x) * dx + (y - a.y) * dy) / length) : 0;
  return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
}

/** Clears condensation along a pointer segment (stage px). Returns whether any cell changed. */
export function wipeGrid(fog: Uint8Array, a: Point, b: Point, stage: Size, radius = BRUSH * stage.h, strength = 0.9): boolean {
  const cw = stage.w / GRID_COLS, ch = stage.h / GRID_ROWS;
  const c0 = clamp(Math.floor((Math.min(a.x, b.x) - radius) / cw), 0, GRID_COLS - 1), c1 = clamp(Math.floor((Math.max(a.x, b.x) + radius) / cw), 0, GRID_COLS - 1);
  const r0 = clamp(Math.floor((Math.min(a.y, b.y) - radius) / ch), 0, GRID_ROWS - 1), r1 = clamp(Math.floor((Math.max(a.y, b.y) + radius) / ch), 0, GRID_ROWS - 1);
  let changed = false;
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
    const distance = distanceToSegment((col + 0.5) * cw, (row + 0.5) * ch, a, b);
    if (distance >= radius) continue;
    const k = 1 - distance / radius, falloff = k * k * (3 - 2 * k), index = row * GRID_COLS + col, before = fog[index]!;
    const after = Math.floor(before * (1 - strength * falloff));
    if (after !== before) { fog[index] = after; changed = true; }
  }
  return changed;
}

/** Breath condenses again inside a rectangle (stage px), back toward the glass's natural density. */
export function breatheGrid(fog: Uint8Array, rect: Box, stage: Size, softness = 0.03 * stage.h): boolean {
  const cw = stage.w / GRID_COLS, ch = stage.h / GRID_ROWS;
  const c0 = clamp(Math.floor((rect.x - softness) / cw), 0, GRID_COLS - 1), c1 = clamp(Math.floor((rect.x + rect.w + softness) / cw), 0, GRID_COLS - 1);
  const r0 = clamp(Math.floor((rect.y - softness) / ch), 0, GRID_ROWS - 1), r1 = clamp(Math.floor((rect.y + rect.h + softness) / ch), 0, GRID_ROWS - 1);
  let changed = false;
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
    const x = (col + 0.5) * cw, y = (row + 0.5) * ch;
    const outside = Math.hypot(Math.max(rect.x - x, 0, x - rect.x - rect.w), Math.max(rect.y - y, 0, y - rect.y - rect.h));
    if (outside >= softness) continue;
    const k = 1 - outside / softness, weight = k * k * (3 - 2 * k), index = row * GRID_COLS + col;
    const target = Math.round(fogBase(col, row) * 255), before = fog[index]!;
    if (before >= target) continue;
    const after = Math.round(before + (target - before) * weight);
    if (after !== before) { fog[index] = after; changed = true; }
  }
  return changed;
}

// ---------- What a frame shows ----------

function cellsOf(box: Box, stage: Size): { c0: number; c1: number; r0: number; r1: number; cw: number; ch: number } {
  const cw = stage.w / GRID_COLS, ch = stage.h / GRID_ROWS;
  return { cw, ch, c0: clamp(Math.floor(box.x / cw), 0, GRID_COLS - 1), c1: clamp(Math.floor((box.x + box.w) / cw), 0, GRID_COLS - 1),
    r0: clamp(Math.floor(box.y / ch), 0, GRID_ROWS - 1), r1: clamp(Math.floor((box.y + box.h) / ch), 0, GRID_ROWS - 1) };
}
export function meanFog(field: FogField, box: Box, stage: Size): number {
  const { c0, c1, r0, r1, cw, ch } = cellsOf(box, stage);
  let sum = 0, weight = 0;
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
    const share = overlap(box, { x: col * cw, y: row * ch, w: cw, h: ch });
    sum += field.at(col, row) * share; weight += share;
  }
  return weight ? sum / weight : 0;
}
/** Area (stage px²) inside `box` whose condensation has been wiped clear. */
export function clearedArea(field: FogField, box: Box, stage: Size): number {
  const { c0, c1, r0, r1, cw, ch } = cellsOf(box, stage);
  let total = 0;
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) {
    if (field.at(col, row) < CLEARED_FOG) total += overlap(box, { x: col * cw, y: row * ch, w: cw, h: ch });
  }
  return total;
}

/** Words for what a frame shows. The thresholds are internal; the player always sees the result as these subjects. */
export interface Subjects { handprint: boolean; figure: 'clear' | 'faint' | 'none'; writing: number; impression: boolean; }
export const NO_SUBJECTS: Subjects = { handprint: false, figure: 'none', writing: 0, impression: false };

/**
 * What the picture inside `frame` shows, for a glass source with `mist` (1 = as captured, 0 = cleared in CANVAS).
 * The handprint is a cut in the mist, so it needs mist to be seen; the figure is behind the mist, so it shows where the
 * mist was wiped or thinned.
 */
export function frameSubjects(placement: Placement | null, field: FogField, frame: Box, stage: Size, writing: readonly string[], mist = 1): Subjects {
  if (!placement) return NO_SUBJECTS;
  const hand = handBox(placement, stage), handIn = intersect(hand, frame);
  // The print is a cut in the condensation: it shows only while enough mist is left around it.
  const handprint = mist > 0 && !!handIn && area(handIn) / area(hand) >= 0.35 && meanFog(field, handIn, stage) * mist >= 0.3;
  const figure = figureBox(placement, stage), inside = intersect(figure, frame);
  const figureState = !inside || area(inside) < 0.12 * area(figure) ? 'none'
    : mist <= 0.45 || clearedArea(field, inside, stage) >= 0.03 * area(figure) ? 'clear' : 'faint';
  const lines = writingBoxes(placement, stage, writing).filter(box => overlap(box, frame) / area(box) >= 0.6).length;
  return { handprint, figure: figureState, writing: lines, impression: true };
}
export const pictureShowsPresence = (subjects: Subjects): boolean => subjects.handprint || subjects.figure === 'clear';
export function subjectLabel(subjects: Subjects): string {
  if (!subjects.impression) return 'Bare glass';
  if (subjects.handprint && subjects.figure === 'clear') return 'Handprint and figure';
  if (subjects.handprint) return 'Handprint';
  if (subjects.figure === 'clear') return 'Figure';
  return 'Only mist';
}

// ---------- Encoding (bounded, validated) ----------

export function encodeBytes(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 0x4000) text += String.fromCharCode(...bytes.subarray(i, i + 0x4000));
  return btoa(text);
}
export function decodeBytes(text: unknown, length: number): Uint8Array | null {
  if (typeof text !== 'string' || text.length !== Math.ceil(length / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) return null;
  let binary: string;
  try { binary = atob(text); } catch { return null; }
  if (binary.length !== length) return null;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** The condensation under a frame (plus a one-cell margin), so a picture can be re-rendered from its own data. */
export function extractPatch(fog: Uint8Array, frame: Box, stage: Size): GridPatch {
  const cw = stage.w / GRID_COLS, ch = stage.h / GRID_ROWS;
  const c0 = clamp(Math.floor(frame.x / cw) - 1, 0, GRID_COLS - 1), c1 = clamp(Math.ceil((frame.x + frame.w) / cw) + 1, 0, GRID_COLS - 1);
  const r0 = clamp(Math.floor(frame.y / ch) - 1, 0, GRID_ROWS - 1), r1 = clamp(Math.ceil((frame.y + frame.h) / ch) + 1, 0, GRID_ROWS - 1);
  const cols = c1 - c0 + 1, rows = r1 - r0 + 1, bytes = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row++) bytes.set(fog.subarray((r0 + row) * GRID_COLS + c0, (r0 + row) * GRID_COLS + c0 + cols), row * cols);
  return { c0, r0, cols, rows, data: encodeBytes(bytes) };
}
export function patchField(patch: GridPatch): FogField | null {
  const bytes = decodeBytes(patch.data, patch.cols * patch.rows);
  if (!bytes) return null;
  return { at: (col, row) => {
    const x = col - patch.c0, y = row - patch.r0;
    return x < 0 || y < 0 || x >= patch.cols || y >= patch.rows ? 0 : bytes[y * patch.cols + x]! / 255;
  } };
}
export function validPatch(value: unknown): value is GridPatch {
  if (typeof value !== 'object' || value === null) return false;
  const { c0, r0, cols, rows, data } = value as Record<string, unknown>;
  const int = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
  return int(c0, 0, GRID_COLS - 1) && int(r0, 0, GRID_ROWS - 1) && int(cols, 1, GRID_COLS - (c0 as number)) && int(rows, 1, GRID_ROWS - (r0 as number))
    && decodeBytes(data, (cols as number) * (rows as number)) !== null;
}

export const validPlacement = (value: unknown): value is Placement => {
  if (typeof value !== 'object' || value === null) return false;
  const { hand, side } = value as Partial<Placement>;
  return (side === 'right' || side === 'left') && typeof hand === 'object' && hand !== null
    && Number.isFinite(hand.u) && Number.isFinite(hand.v) && hand.u >= 0 && hand.u <= 1 && hand.v >= 0 && hand.v <= 1;
};
export const validLines = (value: unknown): value is string[] => Array.isArray(value) && value.length <= MAX_WRITING_LINES
  && value.every(line => typeof line === 'string' && line.length > 0 && line.length <= MAX_LINE_LENGTH);
export const validBox = (value: unknown, limit = 20000): value is Box => {
  if (typeof value !== 'object' || value === null) return false;
  const { x, y, w, h } = value as Record<string, unknown>;
  const num = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  return num(x, -limit, limit) && num(y, -limit, limit) && num(w, 1, limit) && num(h, 1, limit);
};
export const validSize = (value: unknown): value is Size => {
  if (typeof value !== 'object' || value === null) return false;
  const { w, h } = value as Record<string, unknown>;
  return typeof w === 'number' && typeof h === 'number' && w >= 1 && h >= 1 && w <= 20000 && h <= 20000;
};

type GlassChange = 'place' | 'wipe' | 'breathe' | 'reset' | 'restore' | 'release';

/** The shared glass state. Rendering never commits progress; this object is the only owner of the marks. */
export class GlassSurface {
  private fog: Uint8Array = new Uint8Array(GRID_SIZE);
  private placed: Placement | null = null;
  private lines: string[] = [];
  private seen = false;
  private releasedFlag = false;
  private listeners = new Set<(change: GlassChange) => void>();
  private revisionCount = 0;

  get placement(): Placement | null { return this.placed ? { hand: { ...this.placed.hand }, side: this.placed.side } : null; }
  /** The finger marks on the glass: present from the milestone on, whatever the mist does. */
  get writing(): string[] { return [...this.lines]; }
  get revealSeen(): boolean { return this.seen; }
  get released(): boolean { return this.releasedFlag; }
  get revision(): number { return this.revisionCount; }
  get field(): FogField { return gridField(this.fog); }
  /** A copy of the grid, for capturing. */
  grid(): Uint8Array { return this.fog.slice(); }

  subscribe(listener: (change: GlassChange) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private changed(change: GlassChange): void { this.revisionCount++; this.listeners.forEach(listener => listener(change)); }

  /** At the milestone only: the impression is pressed once, the note is written and the glass condenses. */
  place(placement: Placement, writing: readonly string[]): void {
    if (this.placed) return;
    this.placed = { hand: { u: clamp01(placement.hand.u), v: clamp01(placement.hand.v) }, side: placement.side };
    this.lines = writing.slice(0, MAX_WRITING_LINES).map(line => line.slice(0, MAX_LINE_LENGTH));
    this.fog = createFog();
    this.seen = false;
    this.releasedFlag = false;
    this.changed('place');
  }
  markRevealSeen(): void { this.seen = true; }
  /** After the accepted delivery: the hand lets go of the glass and the mist clears. Captures already taken are unaffected. */
  release(): void {
    if (!this.placed || this.releasedFlag) return;
    this.releasedFlag = true;
    this.changed('release');
  }
  wipe(a: Point, b: Point, stage: Size): boolean {
    if (!this.placed || this.releasedFlag || !wipeGrid(this.fog, a, b, stage)) return false;
    this.changed('wipe');
    return true;
  }
  breathe(rect: Box, stage: Size): boolean {
    if (!this.placed || this.releasedFlag || !breatheGrid(this.fog, rect, stage)) return false;
    this.changed('breathe');
    return true;
  }
  reset(): void { this.fog = new Uint8Array(GRID_SIZE); this.placed = null; this.lines = []; this.seen = false; this.releasedFlag = false; this.changed('reset'); }

  toSaved(): SavedGlass | null {
    return this.placed ? { hand: [this.placed.hand.u, this.placed.hand.v], side: this.placed.side, fog: encodeBytes(this.fog), revealSeen: this.seen,
      writing: [...this.lines], released: this.releasedFlag } : null;
  }
  restore(saved: SavedGlass): boolean {
    const fog = decodeBytes(saved.fog, GRID_SIZE);
    const placement = { hand: { u: saved.hand[0], v: saved.hand[1] }, side: saved.side };
    if (!fog || !validPlacement(placement) || !validLines(saved.writing)) return false;
    this.fog = fog; this.placed = placement; this.seen = saved.revealSeen; this.lines = [...saved.writing]; this.releasedFlag = saved.released;
    this.changed('restore');
    return true;
  }
}
