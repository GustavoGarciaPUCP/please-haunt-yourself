import { GHOST_LINE_IDS, type GhostLineId, type Presence, type SavedCase } from './legacy-session';
import { GRID_SIZE, MIST_LINES, decodeBytes, validBox, validLines, validPatch, validPlacement, validSize, type SavedGlass } from './glass-model';
import { SESSION_SIZE, parseStudio, validRun, validSessionFrame, type Capture, type SavedStudio } from './echo-studio';
import { parseLetter, type SavedLetter } from './letter-model';
import { parseMail, type SavedMail } from './mail-model';

/**
 * One versioned, validated restore point for the whole case (.kiro/specs/os-case-v4 design §9). Stored data is
 * untrusted: anything unexpected is discarded. Window bounds, paused previews, Undo stacks, audio consent, the guide
 * and the boot flag are never stored here. Only this game's own keys are ever written or removed.
 */
export const CASE_SAVE_KEY = 'haunt.case.v4';
export const V3_SAVE_KEY = 'haunt.case.v3';
/** The v2 standalone TERMINAL ending. It belongs to an older story and must never complete this case. */
export const LEGACY_TERMINAL_KEY = 'haunt.terminal.v1';
export const MAX_SAVE_LENGTH = 1_000_000;

export interface Ack { receiptId: number; deliveryId: number; at: number; }
export interface CaseSave { v: 4; run: string; terminal: SavedCase; glass: SavedGlass | null; echo: SavedStudio; letter: SavedLetter; mail: SavedMail; ack: Ack | null; }
export type LoadNotice = 'migrated-v3' | 'migrated-v1' | 'corrupt' | null;
export interface LoadedCase { save: CaseSave | null; notice: LoadNotice; }
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultStore = (): Store | null => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isInt = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const PRESENCES: readonly Presence[] = ['terminal', 'shadow', 'glass', 'released'];

export const newRunId = (): string => {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 12) ?? Math.random().toString(36).slice(2, 14);
  return `run-${random}`;
};

function parseTerminal(value: unknown, presences: readonly Presence[] = PRESENCES): SavedCase | null {
  if (!isObject(value)) return null;
  const { retry, muffled, attempts, presence, said } = value;
  if (typeof retry !== 'boolean' || typeof muffled !== 'boolean' || !isInt(attempts, 0, 999)) return null;
  if (!presences.includes(presence as Presence)) return null;
  if (!Array.isArray(said) || said.length > GHOST_LINE_IDS.length || new Set(said).size !== said.length || !said.every(id => GHOST_LINE_IDS.includes(id as GhostLineId))) return null;
  return { retry, muffled, attempts, presence: presence as Presence, said: said as GhostLineId[] };
}

function parseGlass(value: unknown): SavedGlass | null {
  if (!isObject(value)) return null;
  const { hand, side, fog, revealSeen, writing, released } = value;
  if (!Array.isArray(hand) || hand.length !== 2 || !hand.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)) return null;
  if ((side !== 'right' && side !== 'left') || typeof revealSeen !== 'boolean' || typeof released !== 'boolean' || decodeBytes(fog, GRID_SIZE) === null || !validLines(writing)) return null;
  return { hand: [hand[0] as number, hand[1] as number], side, fog: fog as string, revealSeen, writing: [...writing], released };
}

function parseAck(value: unknown): Ack | null | undefined {
  if (value === null) return null;
  if (!isObject(value) || !isInt(value.receiptId, 1, 1_000_000) || !isInt(value.deliveryId, 1, 1_000_000) || !isInt(value.at, 0, 9e15)) return undefined;
  return { receiptId: value.receiptId, deliveryId: value.deliveryId, at: value.at };
}

export function parseCaseSave(raw: string | null): CaseSave | null {
  if (raw === null || raw.length > MAX_SAVE_LENGTH) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!isObject(value) || value.v !== 4 || !validRun(value.run)) return null;
  const run = value.run;
  const terminal = parseTerminal(value.terminal);
  const glass = value.glass === null ? null : parseGlass(value.glass);
  const echo = parseStudio(value.echo), letter = parseLetter(value.letter), mail = parseMail(value.mail), ack = parseAck(value.ack);
  if (!terminal || !echo || !letter || !mail || ack === undefined || (value.glass !== null && !glass)) return null;
  // The impression exists on the glass exactly when the run reached it; the job is closed exactly when it was acknowledged.
  const reached = terminal.presence === 'glass' || terminal.presence === 'released';
  if (reached !== (glass !== null)) return null;
  if ((terminal.presence === 'released') !== (ack !== null) || (ack !== null && !glass!.released) || (ack === null && glass?.released)) return null;
  if (ack && !mail.deliveries.some(item => item.id === ack.deliveryId && item.receipt?.id === ack.receiptId && item.run === run)) return null;
  // Everything current belongs to this run; only the archive holds earlier runs.
  if (echo.captures.some(item => item.run !== run) || (letter.draft && letter.draft.run !== run) || (mail.draft && mail.draft.run !== run)) return null;
  if (mail.deliveries.some(item => item.run !== run) || mail.archive.some(item => item.run === run)) return null;
  return { v: 4, run, terminal, glass, echo, letter, mail, ack };
}

// ---------- Migration from v3 (haunt.case.v3) ----------

/** v3 prints: session prints were full session frames; glass prints kept only the crop under the monitor. */
function migratePrints(value: unknown, run: string): Capture[] | null {
  if (!isObject(value) || !Array.isArray(value.prints) || value.prints.length > 8) return null;
  const captures: Capture[] = [];
  for (const print of value.prints as unknown[]) {
    if (!isObject(print) || !isInt(print.id, 1, 1_000_000)) return null;
    if (print.source === 'session' && validSessionFrame(print.session)) {
      captures.push({ id: print.id, run, negative: { kind: 'session', session: print.session }, frame: { x: 0, y: 0, w: SESSION_SIZE.w, h: SESSION_SIZE.h } });
      continue;
    }
    const glass = print.glass;
    if (print.source !== 'glass' || !isObject(glass) || !validSize(glass.stage) || !validBox(glass.frame)) return null;
    const placement = glass.placement === null ? null : validPlacement(glass.placement) ? glass.placement : undefined;
    const patch = glass.patch === null ? null : validPatch(glass.patch) ? glass.patch : undefined;
    if (placement === undefined || patch === undefined || (placement === null) !== (patch === null)) return null;
    // Limited: the picture under the old crop, and nothing else. It never gains a writing layer.
    captures.push({ id: print.id, run, negative: { kind: 'limited', stage: glass.stage, placement, patch, crop: glass.frame }, frame: { ...glass.frame } });
  }
  return new Set(captures.map(item => item.id)).size === captures.length ? captures : null;
}

export function migrateV3(raw: string | null, run = newRunId()): CaseSave | null {
  if (raw === null || raw.length > MAX_SAVE_LENGTH) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!isObject(value) || value.v !== 3) return null;
  const terminal = parseTerminal(value.terminal, ['terminal', 'shadow', 'glass']);
  if (!terminal) return null;
  let glass: SavedGlass | null = null;
  if (value.glass !== null) {
    const old = value.glass;
    if (!isObject(old) || !Array.isArray(old.hand) || old.hand.length !== 2 || (old.side !== 'right' && old.side !== 'left') || typeof old.revealSeen !== 'boolean'
      || decodeBytes(old.fog, GRID_SIZE) === null) return null;
    // The v3 glass really displayed these lines: its renderer wrote them into the mist at the milestone.
    glass = { hand: [Number(old.hand[0]), Number(old.hand[1])], side: old.side, fog: old.fog as string, revealSeen: true, writing: [...MIST_LINES], released: false };
    if (!validPlacement({ hand: { u: glass.hand[0], v: glass.hand[1] }, side: glass.side })) return null;
  }
  if ((terminal.presence === 'glass') !== (glass !== null)) return null;
  const captures = migratePrints(value.studio, run);
  if (!captures) return null;
  const nextId = Math.max(1, ...captures.map(item => item.id + 1));
  return { v: 4, run, terminal, glass, echo: { captures, nextId }, letter: { draft: null, nextId: 1 },
    mail: { draft: null, deliveries: [], intended: null, archive: [], nextId: 1 }, ack: null };
}

export function writeCase(save: CaseSave, store: Store | null = defaultStore()): boolean {
  if (!store) return false;
  try {
    const raw = JSON.stringify(save);
    if (raw.length > MAX_SAVE_LENGTH) return false;
    store.setItem(CASE_SAVE_KEY, raw);
    return store.getItem(CASE_SAVE_KEY) === raw;
  } catch { return false; }
}

/**
 * Loads the case. Order: v4; else v3, migrated (the v3 key is removed only once v4 was written); else the v1 TERMINAL
 * ending, removed without completing anything. A corrupt save is removed and reported. Storage failures start fresh.
 */
export function loadCase(store: Store | null = defaultStore()): LoadedCase {
  if (!store) return { save: null, notice: null };
  try {
    const raw = store.getItem(CASE_SAVE_KEY);
    if (raw !== null) {
      const save = parseCaseSave(raw);
      if (save) return { save, notice: null };
      store.removeItem(CASE_SAVE_KEY);
      return { save: null, notice: 'corrupt' };
    }
    const v3 = store.getItem(V3_SAVE_KEY);
    if (v3 !== null) {
      const save = migrateV3(v3);
      if (!save) { store.removeItem(V3_SAVE_KEY); return { save: null, notice: 'corrupt' }; }
      if (writeCase(save, store)) store.removeItem(V3_SAVE_KEY);
      return { save, notice: 'migrated-v3' };
    }
    if (store.getItem(LEGACY_TERMINAL_KEY) !== null) {
      store.removeItem(LEGACY_TERMINAL_KEY);
      return { save: null, notice: 'migrated-v1' };
    }
  } catch { /* Private or blocked storage: play without a restore point. */ }
  return { save: null, notice: null };
}

/** Explicit replay keeps the archive in the new run's save; nothing else in this browser is touched. */
export function clearCase(store: Store | null = defaultStore()): void {
  try { store?.removeItem(CASE_SAVE_KEY); } catch { /* Nothing to clear. */ }
}
