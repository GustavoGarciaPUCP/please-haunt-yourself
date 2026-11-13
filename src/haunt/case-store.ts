import { LegacySession, REQUEST_ID, type Presence } from './legacy-session';
import { GRID_SIZE, GlassSurface, MIST_LINES, encodeBytes, type Placement } from './glass-model';
import { EchoStudio, isUsefulCapture } from './echo-studio';
import { LetterModel, snapshotComplete, missingPhrases, snapshotSource, type UseResult } from './letter-model';
import { MailModel, deliveryHash, type AttemptResult, type Delivery, type SendResult } from './mail-model';
import { PHASES, type CasePhase } from './case-phase';
import { newRunId, writeCase, type Ack, type CaseSave, type LoadNotice, type LoadedCase } from './case-save';

/**
 * The one case (.kiro/specs/os-case-v4 design §1). It owns the run identity and every model, derives the phase that every
 * surface shows, validates receipts, carries cross-app handoffs and saves. Views read from it; none of them decides
 * progress on its own, and no animation ever commits anything.
 */
export type AppId = 'terminal' | 'echo' | 'canvas' | 'postman';
/**
 * What a notification is about (.kiro/specs/fluid-typing-v9). 'mail-draft': only POSTMAN's mail draft changed (Compose,
 * Reply, a field, the attachment, Discard). The phase was computed and the save written as for any change, and nothing
 * else in the case changed. 'case': anything else, including a change of the save state or a phase that moved. Every
 * listener receives both; a view that does not show the mail draft returns early on 'mail-draft' (only POSTMAN reads it).
 */
export type CaseChange = 'case' | 'mail-draft';
export type OpenTarget =
  | { app: 'terminal'; focus?: 'job' | 'finish' | 'inside' }
  | { app: 'echo'; capture?: number; tab?: 'live' | 'captures' }
  | { app: 'canvas'; focus?: 'lift' | 'compose' }
  | { app: 'postman'; mailbox?: Mailbox; delivery?: number; focus?: 'to' | 'receipt' };
export type Mailbox = 'guest' | 'recovered' | 'drafts' | 'sent' | 'returned' | 'archive';
export type SaveState = 'saved' | 'session-only';

export type ReceiptReason = 'none' | 'unknown' | 'other-run' | 'replaced' | 'tampered' | 'incomplete' | 'not-ready';
export type ReceiptCheck = { ok: true; delivery: Delivery } | { ok: false; reason: ReceiptReason; delivery?: Delivery };

export interface PhaseInputs { presence: Presence; retry: boolean; acknowledged: boolean; deliveryValid: boolean; draftComplete: boolean; usefulCapture: boolean; }
/** The phase is derived from data only. A returned or incomplete send never moves it forward; nothing moves it back to Repeating. */
export function derivePhase(input: PhaseInputs): CasePhase {
  if (input.acknowledged || input.presence === 'released') return 'finished';
  if (input.deliveryValid) return 'ready-to-finish';
  if (input.draftComplete) return 'draft-ready';
  if (input.usefulCapture) return 'capture-retained';
  if (input.presence === 'glass' || !input.retry) return 'call-stopped';
  return 'repeating';
}

/**
 * What TERMINAL says when it refuses a receipt. An incomplete letter is described in the words of its own source.
 * `relied` is the delivery the job relies on now: a replaced receipt only points to it as the way to finish when it is
 * complete (confirmation-flow-v7 R4).
 */
export function receiptMessage(reason: ReceiptReason, delivery: Pick<Delivery, 'letter' | 'missing'> | null = null, relied: Pick<Delivery, 'complete'> | null = null): string {
  switch (reason) {
    case 'none': return 'No receipt has arrived for this job yet.';
    case 'unknown': return 'That receipt is not in POSTMAN.';
    case 'other-run': return 'That receipt belongs to an earlier session at this desk. It cannot finish this one.';
    case 'replaced': return relied && !relied.complete
      ? 'That receipt is for a letter you replaced. The letter that replaced it is incomplete, so no receipt can finish the job until a complete letter arrives.'
      : 'That receipt is for a letter you replaced. The newer letter’s receipt can finish the job.';
    case 'tampered': return 'That receipt does not match the letter in Guest Inbox.';
    case 'incomplete': return `The letter that arrived is incomplete: ${delivery ? missingPhrases(snapshotSource(delivery.letter), delivery.missing) : 'it is missing its picture or its writing'}. Fix it in CANVAS and send it again.`;
    case 'not-ready': return 'The job is not ready to finish yet.';
  }
}

export class CaseStore {
  run: string;
  readonly legacy: LegacySession;
  readonly glass = new GlassSurface();
  readonly studio: EchoStudio;
  readonly letter: LetterModel;
  readonly mail: MailModel;
  private ackValue: Ack | null;
  private phaseValue: CasePhase;
  private saveStateValue: SaveState = 'saved';
  private noticeValue: LoadNotice;
  private offeredReceipt: number | null = null;
  private listeners = new Set<(change: CaseChange) => void>();
  private phaseListeners = new Set<(phase: CasePhase, previous: CasePhase) => void>();
  private openListeners = new Set<(target: OpenTarget) => void>();
  private quiet = 0;
  private storageWrite: (save: CaseSave) => boolean;
  /** Where the impression lands at the milestone; the desktop supplies TERMINAL's real edge. */
  private placer: () => Placement = () => ({ hand: { u: 0.62, v: 0.48 }, side: 'right' });

  constructor(loaded: LoadedCase, options: { write?: (save: CaseSave) => boolean; now?: () => number } = {}) {
    const save = loaded.save;
    this.noticeValue = loaded.notice;
    this.storageWrite = options.write ?? (save => writeCase(save));
    this.now = options.now ?? (() => Date.now());
    this.run = save?.run ?? newRunId();
    this.legacy = new LegacySession(save?.terminal ?? null);
    if (save?.glass) this.glass.restore(save.glass);
    this.studio = new EchoStudio(save?.echo ?? null);
    this.letter = new LetterModel(save?.letter ?? null);
    this.mail = new MailModel(save?.mail ?? null);
    this.ackValue = save?.ack ?? null;
    // The accepted letter is protected from eviction and stays the job's letter whatever is sent later.
    if (this.ackValue) this.mail.accept(this.ackValue.deliveryId);
    this.phaseValue = this.computePhase();
    this.legacy.setCasePhase(this.phaseValue);
    this.legacy.subscribe(() => { this.ensureImpression(); this.changed(); });
    // A wipe is answered by whoever draws the glass; it is saved when the stroke ends (persist), not on every move.
    this.glass.subscribe(change => { if (change !== 'wipe') this.changed(); });
    this.studio.subscribe(change => { if (change === 'source' || change === 'pause' || change === 'resume') this.emit(); else this.changed(); });
    this.letter.subscribe(() => this.changed());
    // A draft change (Compose, Reply, a field, the attachment, Discard) touches only the mail draft; a send, a new run or a
    // restore touches the deliveries, which TERMINAL, CANVAS and the desktop show too.
    this.mail.subscribe(change => this.changed(change === 'draft' ? 'mail-draft' : 'case'));
    if (loaded.notice === 'migrated-v3' || !save) this.persist();
  }
  private readonly now: () => number;

  // ---------- Reading ----------

  get phase(): CasePhase { return this.phaseValue; }
  get phaseInfo() { return PHASES[this.phaseValue]; }
  get ack(): Ack | null { return this.ackValue ? { ...this.ackValue } : null; }
  get saveState(): SaveState { return this.saveStateValue; }
  get offered(): number | null { return this.offeredReceipt; }
  /** A one-time notice about the restore point (migration or a corrupt save). */
  takeNotice(): LoadNotice { const notice = this.noticeValue; this.noticeValue = null; return notice; }
  peekNotice(): LoadNotice { return this.noticeValue; }

  /** Every change reaches every listener, with what it was about (`CaseChange`). */
  subscribe(listener: (change: CaseChange) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  onPhase(listener: (phase: CasePhase, previous: CasePhase) => void): () => void { this.phaseListeners.add(listener); return () => this.phaseListeners.delete(listener); }
  onOpen(listener: (target: OpenTarget) => void): () => void { this.openListeners.add(listener); return () => this.openListeners.delete(listener); }
  /** A contextual handoff: the desktop opens or raises the app with that object selected. */
  open(target: OpenTarget): void { this.openListeners.forEach(listener => listener(target)); }

  private computePhase(): CasePhase {
    const legacy = this.legacy.snapshot();
    const check = this.checkReceipt(null);
    return derivePhase({
      presence: legacy.presence, retry: legacy.retry, acknowledged: this.ackValue !== null, deliveryValid: check.ok,
      draftComplete: this.letter.status()?.complete ?? false, usefulCapture: this.studio.list().some(isUsefulCapture),
    });
  }

  setPlacer(placer: () => Placement): void { this.placer = placer; }
  /**
   * The milestone and the glass are one transaction: the moment the run finishes its minute, its impression is pressed
   * (with the note it wrote), before anything is saved, so no restore point ever holds one without the other.
   */
  private ensureImpression(): void {
    const presence = this.legacy.snapshot().presence;
    if ((presence !== 'glass' && presence !== 'released') || this.glass.placement) return;
    this.quiet++;
    try { this.glass.place(this.placer(), MIST_LINES); } finally { this.quiet--; }
  }
  get finished(): boolean { return this.ackValue !== null; }
  /** The delivery the job accepted, or the one it currently relies on. */
  deliveredLetter(): Delivery | null {
    if (this.ackValue) return this.mail.get(this.ackValue.deliveryId);
    return this.mail.intended();
  }
  /** TERMINAL explained a refused receipt; it now reflects the job's own delivery again. */
  clearOffered(): void { if (this.offeredReceipt === null) return; this.offeredReceipt = null; this.emit(); }

  private emit(change: CaseChange = 'case'): void { this.listeners.forEach(listener => listener(change)); }
  private changed(scope: CaseChange = 'case'): void {
    if (this.quiet) return;
    const previous = this.phaseValue;
    this.phaseValue = this.computePhase();
    this.legacy.setCasePhase(this.phaseValue);
    // Saved on every change, at once, whatever its kind: the last key typed is never only in memory.
    this.persist();
    // A phase that moved concerns every surface, whatever moved it.
    this.emit(previous === this.phaseValue ? scope : 'case');
    if (previous !== this.phaseValue) this.phaseListeners.forEach(listener => listener(this.phaseValue, previous));
  }

  /** Saves the whole case. Reports Session only when the browser did not keep it. */
  persist(): SaveState {
    const glass = this.glass.toSaved();
    const save: CaseSave = { v: 4, run: this.run, terminal: this.legacy.toSaved(), glass, echo: this.studio.toSaved(), letter: this.letter.toSaved(), mail: this.mail.toSaved(), ack: this.ack };
    const ok = (() => { try { return this.storageWrite(save); } catch { return false; } })();
    const state: SaveState = ok ? 'saved' : 'session-only';
    // Saved / Session only is shown by CANVAS and the tray too: announced to everyone, even when a key caused it.
    if (state !== this.saveStateValue) { this.saveStateValue = state; this.emit('case'); }
    return state;
  }

  // ---------- Handoffs and intents ----------

  /** ECHO's "Use this capture": the draft takes its own copy. A different capture replaces the source only when confirmed. */
  useCapture(captureId: number, confirmReplace = false): UseResult | 'missing' {
    const capture = this.studio.get(captureId);
    if (!capture) return 'missing';
    const result = this.letter.useCapture(this.run, capture, confirmReplace);
    if (result !== 'needs-confirm') this.open({ app: 'canvas', focus: result === 'created' || result === 'replaced' ? 'lift' : undefined });
    return result;
  }
  /** CANVAS's "Compose in POSTMAN": a draft with this letter attached, opened at its recipient field. Nothing is sent. */
  compose(): void {
    this.mail.compose(this.run);
    this.open({ app: 'postman', mailbox: 'drafts', focus: 'to' });
  }
  reply(): void { this.mail.reply(this.run, this.letter.draft !== null); }
  /** POSTMAN's Send. An answer to a question carries that question's key (.kiro/specs/confirmation-flow-v7). */
  send(options: { confirm?: string } = {}): SendResult {
    return this.mail.send(this.letter.snapshot(), options, this.now());
  }
  /** What Send would do now; POSTMAN keeps an open question only while this attempt is still the one it describes. */
  sendAttempt(): AttemptResult { return this.mail.attempt(this.letter.snapshot()); }
  /** "Return to the request": TERMINAL comes forward with this receipt. */
  returnToRequest(receiptId: number): void {
    this.offeredReceipt = receiptId;
    this.emit();
    this.open({ app: 'terminal', focus: 'finish' });
  }

  /** Validates a receipt (or, with null, the intended delivery's receipt) against this run's request. */
  checkReceipt(receiptId: number | null): ReceiptCheck {
    const intended = this.mail.intended();
    const id = receiptId ?? intended?.receipt?.id ?? null;
    if (id === null) return { ok: false, reason: 'none' };
    const found = this.mail.receipt(id);
    if (!found) return { ok: false, reason: 'unknown' };
    const { receipt, delivery } = found;
    if (receipt.run !== this.run || delivery.run !== this.run) return { ok: false, reason: 'other-run', delivery };
    if (receipt.request !== REQUEST_ID || delivery.route !== 'guest-inbox' || receipt.recipient !== 'guest') return { ok: false, reason: 'unknown', delivery };
    if (deliveryHash(delivery) !== delivery.hash || receipt.hash !== delivery.hash) return { ok: false, reason: 'tampered', delivery };
    if (intended?.id !== delivery.id) return { ok: false, reason: 'replaced', delivery };
    if (!delivery.complete || !snapshotComplete(delivery.letter)) return { ok: false, reason: 'incomplete', delivery };
    const presence = this.legacy.snapshot().presence;
    if (presence !== 'glass' && presence !== 'released') return { ok: false, reason: 'not-ready', delivery };
    return { ok: true, delivery };
  }

  /**
   * Finish session: accepts a matching receipt and closes the original job. The model commits here, at once; the release
   * on the glass only presents it. A second call, a remount or a reload never acknowledges twice.
   */
  finish(receiptId: number | null = this.offeredReceipt): ReceiptCheck | { ok: false; reason: 'finished' } {
    if (this.ackValue) return { ok: false, reason: 'finished' };
    const check = this.checkReceipt(receiptId);
    if (!check.ok) return check;
    this.quiet++;
    try {
      this.legacy.finish();
      this.glass.release();
      this.mail.accept(check.delivery.id);
      this.ackValue = { receiptId: check.delivery.receipt!.id, deliveryId: check.delivery.id, at: this.now() };
      this.offeredReceipt = null;
    } finally { this.quiet--; }
    this.changed();
    return check;
  }

  /** Start the case over: a new run. Earlier deliveries move to Archive; nothing else in the browser is touched. */
  startOver(): void {
    this.quiet++;
    try {
      this.run = newRunId();
      this.mail.startRun();
      this.legacy.reset();
      this.glass.reset();
      this.studio.reset();
      this.letter.reset();
      this.ackValue = null;
      this.offeredReceipt = null;
    } finally { this.quiet--; }
    this.changed();
  }

  /** The glass data ECHO copies into a negative. After the release the hand has let go: the glass is bare. */
  glassForCapture(): { placement: Placement | null; fog: string; writing: string[] } {
    if (this.glass.released) return { placement: null, fog: encodeBytes(new Uint8Array(GRID_SIZE)), writing: [] };
    return { placement: this.glass.placement, fog: encodeBytes(this.glass.grid()), writing: this.glass.writing };
  }
}
