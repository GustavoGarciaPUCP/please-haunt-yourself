import { REQUEST_ID } from './legacy-session';
import { snapshotComplete, validSnapshot, type LetterSnapshot, type Missing } from './letter-model';
import { validRun } from './echo-studio';

/**
 * POSTMAN's local mail (.kiro/specs/os-case-v4 design §4). Entirely fictional and local: two mailboxes exist at this
 * desk, mara@haunt (the sender, 1987) and guest@haunt (the next person at this desk, now). Reply only addresses a draft;
 * Send commits one immutable delivery. A delivery to guest and its receipt are created together. No DOM access.
 */
export type Recipient = 'guest' | 'mara';
export const ADDRESSES: Readonly<Record<Recipient, string>> = { guest: 'guest@haunt', mara: 'mara@haunt' };
export const SUBJECT = 'For the next person at this desk';
export const RETURNED_LINE = 'That went back to the sender.';
export const MAX_DELIVERIES = 12;
export const MAX_ARCHIVE = 6;
export const MAX_SUBJECT = 120;
export const MAX_MESSAGE = 600;
export const MAX_TO = 80;

/** `sentKey` remembers the exact content of the last attempt, so a double click never sends the same thing twice. */
export interface MailDraft { id: number; run: string; to: string; subject: string; message: string; attached: boolean; sentKey: string | null; }
export interface Receipt { id: number; deliveryId: number; run: string; request: string; recipient: 'guest'; revision: number; hash: string; at: number; }
export interface Delivery {
  id: number; run: string; at: number;
  to: Recipient;
  route: 'guest-inbox' | 'returned';
  subject: string; message: string;
  letter: LetterSnapshot | null;
  complete: boolean;
  missing: Missing[];
  hash: string;
  receipt: Receipt | null;
}
/**
 * What Send would do with the draft as it is now (.kiro/specs/confirmation-flow-v7). Nothing is sent. `key` identifies
 * exactly this attempt: what would be delivered, to whom, which delivery it would replace and whether the session is
 * finished, so an answer to a question about one attempt can never be used for another.
 */
export interface Attempt {
  key: string;
  to: Recipient;
  letter: LetterSnapshot | null;
  complete: boolean;
  /** What a letter to guest lacks; empty when it is complete, and for a send to Mara. */
  missing: Missing[];
  /** The complete letter the job relies on, which this send would replace (to guest, before Finish session). */
  replaces: Delivery | null;
  /** After Finish session a letter to guest is another copy. */
  copy: boolean;
}
export type AttemptResult = { ok: true; attempt: Attempt } | { ok: false; reason: 'no-draft' | 'no-recipient' | 'unknown-recipient' };
/** The one question Send asks about an attempt, with the key its answer must carry. */
export type Confirmation =
  | { ok: false; reason: 'confirm-incomplete'; key: string; missing: Missing[]; replaces: Delivery | null; copy: boolean }
  | { ok: false; reason: 'confirm-replace'; key: string; replaces: Delivery };
export type SendResult =
  | { ok: true; delivery: Delivery }
  | { ok: false; reason: 'no-draft' | 'no-recipient' | 'unknown-recipient' | 'duplicate' | 'changed' }
  | Confirmation;
export type MailChange = 'draft' | 'send' | 'reset' | 'restore';
/**
 * Where a delivery stands for the job (.kiro/specs/playability-v5 R1): the one it accepted, the one it relies on, one a
 * later letter replaced before the end, a copy sent after the end, a returned attempt, or one from an earlier session.
 */
export type Standing = 'accepted' | 'intended' | 'replaced' | 'copy' | 'returned' | 'archived';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * The one question an attempt needs, or none. An incomplete letter to guest is asked about once, and that question also
 * names the complete letter it would replace, if any; a complete letter replacing a complete one is asked to Replace.
 * Nothing else needs consent.
 */
export function questionFor(attempt: Attempt): Confirmation | null {
  if (attempt.to !== 'guest') return null;
  if (!attempt.complete) return { ok: false, reason: 'confirm-incomplete', key: attempt.key, missing: attempt.missing, replaces: attempt.replaces, copy: attempt.copy };
  if (attempt.replaces) return { ok: false, reason: 'confirm-replace', key: attempt.key, replaces: attempt.replaces };
  return null;
}

/**
 * The words of POSTMAN's question (.kiro/specs/confirmation-flow-v7 design §2). `lacks` says what the letter lacks, in
 * the words of its own source (or null when it is complete); `replacedAt` is when the complete letter it would replace
 * was delivered (or null). Buttons are [command, label, primary]; the first one gets focus, and only the incomplete-only
 * and replace-only questions keep v6's opening sentences. No question promises that an incomplete letter can finish the job.
 */
export function questionWords(lacks: string | null, replacedAt: string | null, copy: boolean): { text: string; buttons: Array<[string, string, boolean]> } {
  const stay: Array<[string, string, boolean]> = [['keep-editing', 'Keep editing', true], ['open-canvas', 'Open CANVAS', false]];
  // Short enough that its three buttons stay in view with POSTMAN at its minimum size (640×460).
  if (lacks !== null && replacedAt !== null) return {
    text: `This letter is incomplete: ${lacks}. Sending it replaces the complete letter delivered at ${replacedAt}; that letter stays in Guest Inbox, marked replaced. No receipt will finish the job until a complete letter arrives. Send it anyway?`,
    buttons: [...stay, ['send-anyway-replace', 'Send anyway and replace', false]],
  };
  if (lacks !== null) return {
    text: `This letter is incomplete: ${lacks}. Send it anyway? ${copy ? 'It will arrive as another copy; the letter the job accepted stays as it was.' : 'It will arrive, but it cannot finish the job.'}`,
    buttons: [...stay, ['send-anyway', 'Send anyway', false]],
  };
  if (replacedAt !== null) return {
    text: `Guest Inbox already has a complete letter from this job. Replace it? The letter delivered at ${replacedAt} stays there, marked replaced, and only the new receipt can finish the job.`,
    buttons: [['replace', 'Replace', true], ['keep-editing', 'Cancel', false]],
  };
  return { text: '', buttons: [] };
}

/** Accepts the two local addresses in the forms people type. Anything else is not a mailbox at this desk. */
export function resolveRecipient(to: string): Recipient | null {
  const value = to.trim().toLowerCase().replace(/^.*<(.+)>$/, '$1');
  if (['guest', 'guest@haunt', 'you', 'me'].includes(value)) return 'guest';
  if (['mara', 'mara@haunt'].includes(value)) return 'mara';
  return null;
}

/** FNV-1a 32-bit over a canonical string: a receipt repeats it, so a mismatch or an edited save is detectable. */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function deliveryHash(delivery: Pick<Delivery, 'id' | 'run' | 'to' | 'route' | 'subject' | 'message' | 'letter'>): string {
  return fnv1a(JSON.stringify([delivery.id, delivery.run, delivery.to, delivery.route, delivery.subject, delivery.message, delivery.letter]));
}

export class MailModel {
  private draftValue: MailDraft | null = null;
  private deliveries: Delivery[] = [];
  private intendedId: number | null = null;
  /** The delivery the job accepted at Finish session. Kept by the case's acknowledgment, so it is not saved here. */
  private acceptedId: number | null = null;
  private archived: Delivery[] = [];
  private nextId = 1;
  private sending = false;
  private listeners = new Set<(change: MailChange) => void>();

  constructor(saved: SavedMail | null = null) {
    if (saved) {
      this.draftValue = saved.draft ? copy(saved.draft) : null; this.deliveries = copy(saved.deliveries); this.intendedId = saved.intended;
      this.archived = copy(saved.archive); this.nextId = saved.nextId;
    }
  }

  subscribe(listener: (change: MailChange) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private changed(change: MailChange): void { this.listeners.forEach(listener => listener(change)); }

  get draft(): MailDraft | null { return this.draftValue ? { ...this.draftValue } : null; }
  list(): Delivery[] { return copy(this.deliveries); }
  archive(): Delivery[] { return copy(this.archived); }
  get(id: number): Delivery | null { const found = [...this.deliveries, ...this.archived].find(item => item.id === id); return found ? copy(found) : null; }
  receipt(id: number): { receipt: Receipt; delivery: Delivery } | null {
    const delivery = [...this.deliveries, ...this.archived].find(item => item.receipt?.id === id);
    return delivery ? { receipt: copy(delivery.receipt!), delivery: copy(delivery) } : null;
  }
  /** The delivery the job currently relies on: the latest one sent to guest before the end, or the one it accepted. */
  intended(): Delivery | null { return this.intendedId === null ? null : this.get(this.intendedId); }
  /** The delivery the job accepted, once the session is finished. */
  accepted(): Delivery | null { return this.acceptedId === null ? null : this.get(this.acceptedId); }
  get isAccepted(): boolean { return this.acceptedId !== null; }
  /**
   * Finish session accepted this delivery. From now on it is the job's letter: it is never evicted, and a later send to
   * guest is a copy that changes nothing about the closed job.
   */
  accept(id: number): void {
    if (!this.deliveries.some(item => item.id === id && item.route === 'guest-inbox')) return;
    this.acceptedId = id;
    this.intendedId = id;
  }
  standing(delivery: Delivery): Standing {
    if (!this.deliveries.some(item => item.id === delivery.id)) return 'archived';
    if (delivery.route === 'returned') return 'returned';
    if (delivery.id === this.acceptedId) return 'accepted';
    if (this.acceptedId !== null && delivery.id > this.acceptedId) return 'copy';
    if (delivery.id === this.intendedId) return 'intended';
    return 'replaced';
  }
  /** A delivery to guest in this run that a later delivery to guest superseded before the end. */
  isReplaced(delivery: Delivery): boolean { return delivery.route === 'guest-inbox' && this.standing(delivery) === 'replaced'; }

  /** Compose in POSTMAN: a draft in Mara's thread with the current CANVAS letter attached. Nothing is sent. */
  compose(run: string): MailDraft {
    if (!this.draftValue || this.draftValue.run !== run) this.draftValue = { id: this.nextId++, run, to: '', subject: SUBJECT, message: '', attached: true, sentKey: null };
    else this.draftValue = { ...this.draftValue, attached: true };
    this.changed('draft');
    return { ...this.draftValue };
  }
  /** Reply prepares a draft addressed to the sender. It never sends, returns or fails anything by itself. */
  reply(run: string, letterAvailable: boolean): MailDraft {
    if (!this.draftValue || this.draftValue.run !== run) this.draftValue = { id: this.nextId++, run, to: ADDRESSES.mara, subject: `Re: ${SUBJECT}`, message: '', attached: letterAvailable, sentKey: null };
    else this.draftValue = { ...this.draftValue, to: ADDRESSES.mara, subject: this.draftValue.subject.startsWith('Re: ') ? this.draftValue.subject : `Re: ${this.draftValue.subject}` };
    this.changed('draft');
    return { ...this.draftValue };
  }
  updateDraft(fields: Partial<Pick<MailDraft, 'to' | 'subject' | 'message' | 'attached'>>): void {
    if (!this.draftValue) return;
    this.draftValue = {
      ...this.draftValue,
      ...(fields.to !== undefined ? { to: fields.to.slice(0, MAX_TO) } : {}),
      ...(fields.subject !== undefined ? { subject: fields.subject.slice(0, MAX_SUBJECT) } : {}),
      ...(fields.message !== undefined ? { message: fields.message.slice(0, MAX_MESSAGE) } : {}),
      // Only a boolean ever reaches the draft (and the save): the loader rejects anything else (confirmation-flow-v7 R3).
      ...(fields.attached !== undefined ? { attached: fields.attached === true } : {}),
    };
    this.changed('draft');
  }
  discardDraft(): void { if (!this.draftValue) return; this.draftValue = null; this.changed('draft'); }

  /** What Send would do now with this letter (CANVAS's snapshot), without doing it. */
  attempt(letter: LetterSnapshot | null): AttemptResult {
    const draft = this.draftValue;
    if (!draft) return { ok: false, reason: 'no-draft' };
    if (!draft.to.trim()) return { ok: false, reason: 'no-recipient' };
    const to = resolveRecipient(draft.to);
    if (!to) return { ok: false, reason: 'unknown-recipient' };
    const attached = draft.attached ? letter : null;
    const complete = snapshotComplete(attached);
    const missing: Missing[] = to !== 'guest' || complete ? [] : attached ? [...attached.missing] : ['picture', 'writing'];
    // After the end there is nothing to replace: a new letter to guest is a copy, and the accepted letter stays the job's.
    const current = this.intended(), isCopy = to === 'guest' && this.acceptedId !== null;
    const replaces = to === 'guest' && !isCopy && current?.complete ? current : null;
    const key = fnv1a(JSON.stringify([draft.id, draft.run, to, draft.subject.trim() || SUBJECT, draft.message, attached, replaces ? [replaces.id, replaces.hash] : null, isCopy]));
    return { ok: true, attempt: { key, to, letter: attached, complete, missing, replaces, copy: isCopy } };
  }

  /**
   * Send. One attempt, committed with its receipt in one step; a second call while it commits is ignored.
   * To Mara: returned locally, no receipt, and the draft stays open for correction.
   * To guest: an immutable snapshot in Guest Inbox and a receipt for exactly that snapshot.
   * An attempt that needs consent (an incomplete letter, or replacing the complete letter the job relies on) returns one
   * question naming everything it needs; `confirm` must then carry that attempt's key (.kiro/specs/confirmation-flow-v7).
   */
  send(letter: LetterSnapshot | null, options: { confirm?: string } = {}, now = Date.now()): SendResult {
    const evaluated = this.attempt(letter);
    if (!evaluated.ok) return { ok: false, reason: evaluated.reason };
    const attempt = evaluated.attempt, draft = this.draftValue!;
    const repeat = JSON.stringify([attempt.to, draft.subject, draft.message, draft.attached, attempt.letter?.revision ?? 0, attempt.letter?.draftId ?? 0]);
    if (draft.sentKey === repeat) return { ok: false, reason: 'duplicate' };
    const question = questionFor(attempt);
    if (options.confirm !== attempt.key) {
      // Not answered yet, or answered for an attempt that has changed since: ask about what would happen now.
      if (question) return question;
      // An answer given for something else never sends by itself.
      if (options.confirm !== undefined) return { ok: false, reason: 'changed' };
    }
    if (this.sending) return { ok: false, reason: 'no-draft' };
    this.sending = true;
    try {
      const { to, letter: attachedLetter, complete, missing } = attempt;
      const base = { id: this.nextId++, run: draft.run, at: now, to, route: to === 'guest' ? 'guest-inbox' as const : 'returned' as const,
        subject: draft.subject.trim() || SUBJECT, message: draft.message, letter: attachedLetter ? copy(attachedLetter) : null };
      const hash = deliveryHash(base);
      const receipt: Receipt | null = to === 'guest'
        ? { id: base.id, deliveryId: base.id, run: draft.run, request: REQUEST_ID, recipient: 'guest', revision: attachedLetter?.revision ?? 0, hash, at: now } : null;
      // A letter to Mara is never complete for the job; what it lacked is kept as in v4.
      const lacked: Missing[] = complete ? [] : to === 'guest' ? missing : attachedLetter ? [...attachedLetter.missing] : ['picture', 'writing'];
      const delivery: Delivery = { ...base, complete: to === 'guest' && complete, missing: lacked, hash, receipt };
      this.deliveries.push(delivery);
      if (to === 'guest') { if (!attempt.copy) this.intendedId = delivery.id; this.draftValue = null; }
      else this.draftValue = { ...draft, sentKey: repeat };
      this.evict();
      this.changed('send');
      return { ok: true, delivery: copy(delivery) };
    } finally { this.sending = false; }
  }

  /**
   * Keeps the history bounded without ever removing what the job depends on: the oldest deliveries go first, except the
   * intended one and the accepted one (at most one id, since after the end they are the same delivery).
   */
  private evict(): void {
    while (this.deliveries.length > MAX_DELIVERIES) {
      const index = this.deliveries.findIndex(item => item.id !== this.intendedId && item.id !== this.acceptedId);
      if (index < 0) break;
      this.deliveries.splice(index, 1);
    }
  }

  /** A new run: this run's deliveries move to Archive (bounded); their receipts can never finish the new run. */
  startRun(): void {
    this.archived = [...this.archived, ...this.deliveries].slice(-MAX_ARCHIVE);
    this.deliveries = []; this.intendedId = null; this.acceptedId = null; this.draftValue = null;
    this.changed('reset');
  }

  toSaved(): SavedMail { return { draft: this.draftValue ? { ...this.draftValue } : null, deliveries: copy(this.deliveries), intended: this.intendedId, archive: copy(this.archived), nextId: this.nextId }; }
}

// ---------- Saved form (untrusted data) ----------

export interface SavedMail { draft: MailDraft | null; deliveries: Delivery[]; intended: number | null; archive: Delivery[]; nextId: number; }
const isInt = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
const MISSING_VALUES: readonly Missing[] = ['picture', 'writing', 'writing-lost', 'no-writing'];

function validDraft(value: unknown): value is MailDraft {
  return isObject(value) && isInt(value.id, 1, 1_000_000) && validRun(value.run) && isText(value.to, MAX_TO) && isText(value.subject, MAX_SUBJECT)
    && isText(value.message, MAX_MESSAGE) && typeof value.attached === 'boolean' && (value.sentKey === null || isText(value.sentKey, 1000));
}
function validReceipt(value: unknown, delivery: Record<string, unknown>): boolean {
  if (value === null) return delivery.route === 'returned';
  return isObject(value) && delivery.route === 'guest-inbox' && value.id === delivery.id && value.deliveryId === delivery.id && value.run === delivery.run
    && value.request === REQUEST_ID && value.recipient === 'guest' && isInt(value.revision, 0, 1_000_000) && value.hash === delivery.hash && isInt(value.at, 0, 9e15);
}
export function validDelivery(value: unknown): value is Delivery {
  if (!isObject(value)) return false;
  const v = value;
  return isInt(v.id, 1, 1_000_000) && validRun(v.run) && isInt(v.at, 0, 9e15) && (v.to === 'guest' || v.to === 'mara')
    && (v.route === 'guest-inbox' || v.route === 'returned') && (v.route === 'guest-inbox') === (v.to === 'guest')
    && isText(v.subject, MAX_SUBJECT) && isText(v.message, MAX_MESSAGE) && (v.letter === null || validSnapshot(v.letter))
    && typeof v.complete === 'boolean' && Array.isArray(v.missing) && v.missing.every(item => MISSING_VALUES.includes(item as Missing))
    && typeof v.hash === 'string' && /^[0-9a-f]{8}$/.test(v.hash) && validReceipt(v.receipt, v);
}
export function parseMail(value: unknown): SavedMail | null {
  if (!isObject(value) || !Array.isArray(value.deliveries) || !Array.isArray(value.archive)) return null;
  if (value.deliveries.length > MAX_DELIVERIES || value.archive.length > MAX_ARCHIVE) return null;
  if (!value.deliveries.every(validDelivery) || !value.archive.every(validDelivery)) return null;
  if (value.draft !== null && !validDraft(value.draft)) return null;
  if (!isInt(value.nextId, 1, 1_000_001)) return null;
  const deliveries = value.deliveries as Delivery[], archive = value.archive as Delivery[];
  const ids = [...deliveries, ...archive].map(item => item.id);
  if (new Set(ids).size !== ids.length || ids.some(id => id >= (value.nextId as number))) return null;
  if (value.draft && (value.draft as MailDraft).id >= (value.nextId as number)) return null;
  const intended = value.intended;
  if (intended !== null && !deliveries.some(item => item.id === intended && item.route === 'guest-inbox')) return null;
  return { draft: value.draft as MailDraft | null, deliveries, intended: intended as number | null, archive, nextId: value.nextId as number };
}
