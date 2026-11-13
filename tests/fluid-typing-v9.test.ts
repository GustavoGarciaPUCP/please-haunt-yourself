import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CaseStore, type CaseChange } from '../src/haunt/case-store';
import { placeImpression } from '../src/haunt/glass-model';
import type { CaseSave } from '../src/haunt/case-save';
import type { SendResult } from '../src/haunt/mail-model';
import { STAGE, TERMINAL_BOX, captureGlass, deliverValidLetter, frameOnHand, frameOnMistOnly, reachGlass } from './case-helpers';

/**
 * .kiro/specs/fluid-typing-v9: the case store says what each change was about. A 'mail-draft' change is skipped by ECHO,
 * CANVAS, TERMINAL's receipt and the desktop shell, so it must never carry anything they show; anything they show must
 * arrive as 'case'. The save is still written synchronously on every change.
 */

/** A store whose storage can fail, recording every write attempt, every kept save and every announcement. */
function harness() {
  let failing = false, attempts = 0, clock = 1_000_000;
  const kept: CaseSave[] = [];
  const store = new CaseStore({ save: null, notice: null }, {
    write: save => { attempts++; if (failing) return false; kept.push(JSON.parse(JSON.stringify(save))); return true; },
    now: () => ++clock,
  });
  store.setPlacer(() => placeImpression(STAGE, TERMINAL_BOX));
  const heard: CaseChange[] = [];
  store.subscribe(change => heard.push(change));
  return { store, kept, heard, fail: (on: boolean) => { failing = on; }, get failing() { return failing; }, get attempts() { return attempts; } };
}

/**
 * Everything a surface other than POSTMAN's draft editor can show: the whole case without the mail draft. Of the mail
 * model that is its deliveries, the one the job relies on and the archive; its id counter (`nextId`), which a new draft
 * advances, is shown nowhere.
 */
function caseView(store: CaseStore): string {
  const { deliveries, intended, archive } = store.mail.toSaved();
  return JSON.stringify({
    run: store.run, phase: store.phase, saveState: store.saveState, finished: store.finished, offered: store.offered, ack: store.ack,
    legacy: store.legacy.toSaved(), legacyEvent: store.legacy.lastEvent(), glass: store.glass.toSaved(),
    studio: store.studio.toSaved(), source: store.studio.source, paused: store.studio.paused,
    letter: store.letter.toSaved(), canUndo: store.letter.canUndo, canRedo: store.letter.canRedo,
    mail: { deliveries, intended, archive, accepted: store.mail.accepted()?.id ?? null }, receipt: store.checkReceipt(null),
  });
}
const draftView = (store: CaseStore): string => JSON.stringify(store.mail.draft);
const questionKey = (result: SendResult | null): string | null => (result && !result.ok && 'key' in result ? result.key : null);

describe('v9: what a change is about (case-store)', () => {
  it('typing, Compose, Reply, the attachment and Discard are announced as mail-draft only; Send is case', () => {
    const h = harness();
    reachGlass(h.store);
    h.store.useCapture(captureGlass(h.store, frameOnHand(h.store)));
    h.store.letter.liftWriting();
    h.heard.length = 0;
    h.store.compose();
    expect(h.heard).toEqual(['mail-draft']);
    for (const fields of [{ to: 'gu' }, { to: 'guest@haunt' }, { subject: 'For you' }, { message: 'a' }, { message: 'ab' }, { attached: false }, { attached: true }]) {
      h.heard.length = 0;
      h.store.mail.updateDraft(fields);
      expect(h.heard, JSON.stringify(fields)).toEqual(['mail-draft']);
    }
    // Every key is saved at once, exactly.
    expect(h.kept.at(-1)!.mail.draft).toMatchObject({ to: 'guest@haunt', subject: 'For you', message: 'ab', attached: true });
    h.heard.length = 0;
    const sent = h.store.send();
    expect(sent.ok).toBe(true);
    expect(h.heard).toContain('case');
    expect(h.heard).not.toContain('mail-draft');
    h.heard.length = 0;
    h.store.reply();
    expect(h.heard).toEqual(['mail-draft']);
    h.heard.length = 0;
    h.store.mail.discardDraft();
    expect(h.heard).toEqual(['mail-draft']);
  });

  it('a key that makes storage fail announces Session only to everyone first; the next good write announces it again', () => {
    const h = harness();
    deliverValidLetter(h.store);
    h.store.compose();
    h.fail(true);
    h.heard.length = 0;
    h.store.mail.updateDraft({ message: 'x' });
    expect(h.store.saveState).toBe('session-only');
    // CANVAS's "Draft saved" and the tray read the save state: that part arrives as 'case', before the draft's own news.
    expect(h.heard).toEqual(['case', 'mail-draft']);
    h.heard.length = 0;
    h.store.mail.updateDraft({ message: 'xy' });
    expect(h.heard).toEqual(['mail-draft']);
    h.fail(false);
    h.heard.length = 0;
    h.store.mail.updateDraft({ message: 'xyz' });
    expect(h.store.saveState).toBe('saved');
    expect(h.heard).toEqual(['case', 'mail-draft']);
    // Nothing typed while storage failed is lost from the model, and the first good write holds all of it.
    expect(h.kept.at(-1)!.mail.draft!.message).toBe('xyz');
  });

  it('a view that skips mail-draft changes never reads the mail draft', () => {
    // ECHO, CANVAS, TERMINAL and the desktop shell skip 'mail-draft'. If one of them ever shows the mail draft, it must
    // stop skipping, or it would show an old draft. (case-save.ts validates a saved draft; it is not a view.)
    // The texts come through Vite, which runs these tests (`?raw`), so the check needs no Node types.
    const texts = import.meta.glob('../src/haunt/*.ts', { query: '?raw', import: 'default', eager: true });
    const sources = Object.entries(texts).map(([path, text]) => ({ name: path.slice(path.lastIndexOf('/') + 1), text }));
    const readsDraft = (text: string): boolean => /\bmail\s*\.\s*draft\b/.test(text);
    // They are the real sources: POSTMAN, which shows the draft, reads it.
    expect(readsDraft(sources.find(file => file.name === 'postman-view.ts')?.text ?? ''), 'postman-view.ts reads the mail draft').toBe(true);
    const skipping = sources.filter(file => file.text.includes("change !== 'mail-draft'"));
    expect(skipping.map(file => file.name).sort()).toEqual(['canvas-view.ts', 'desktop-shell.ts', 'echo-view.ts', 'terminal-view.ts']);
    for (const file of skipping) expect(readsDraft(file.text), `${file.name} reads the mail draft`).toBe(false);
  });
});

describe('v9: random sequences of edits, sends, questions, the end and storage failures (property)', () => {
  type Op = 'compose' | 'reply' | 'discard' | 'to-guest' | 'to-mara' | 'to-unknown' | 'subject' | 'message' | 'unicode' | 'detach' | 'attach'
    | 'lift' | 'reset' | 'mist0' | 'night' | 'undo' | 'capture-mist' | 'use-latest' | 'send' | 'answer' | 'return' | 'dismiss' | 'finish'
    | 'start-over' | 'storage-fails' | 'storage-works';
  const WEIGHTS: Record<Op, number> = {
    compose: 20, reply: 5, discard: 5, 'to-guest': 15, 'to-mara': 5, 'to-unknown': 4, subject: 15, message: 40, unicode: 8, detach: 6, attach: 6,
    lift: 10, reset: 10, mist0: 4, night: 6, undo: 6, 'capture-mist': 3, 'use-latest': 3, send: 25, answer: 20, return: 4, dismiss: 3, finish: 3,
    'start-over': 1, 'storage-fails': 4, 'storage-works': 6,
  };
  const op = fc.oneof(...(Object.keys(WEIGHTS) as Op[]).map(name => ({ arbitrary: fc.constant<Op>(name), weight: WEIGHTS[name] })));

  type Seen = { draftOnly: number; caseWithDraft: number; flipDuringDraft: number; failedWrites: number; finished: number };
  /** Plays the steps on a store and checks, after each one, what every surface relies on (the property's assertions). */
  function play(h: ReturnType<typeof harness>, ops: Op[], seen: Seen = { draftOnly: 0, caseWithDraft: 0, flipDuringDraft: 0, failedWrites: 0, finished: 0 }): Seen {
    let last: SendResult | null = null, n = 0;
    for (const step of ops) {
      const beforeCase = caseView(h.store), beforeDraft = draftView(h.store), beforeAttempts = h.attempts, beforeSave = h.store.saveState;
      h.heard.length = 0;
      switch (step) {
        case 'compose': h.store.compose(); break;
        case 'reply': h.store.reply(); break;
        case 'discard': h.store.mail.discardDraft(); break;
        case 'to-guest': h.store.mail.updateDraft({ to: 'guest@haunt' }); break;
        case 'to-mara': h.store.mail.updateDraft({ to: 'mara@haunt' }); break;
        case 'to-unknown': h.store.mail.updateDraft({ to: 'x'.repeat(80) }); break;
        case 'subject': h.store.mail.updateDraft({ subject: `Subject ${++n}` }); break;
        case 'message': h.store.mail.updateDraft({ message: `${h.store.mail.draft?.message ?? ''}k`.slice(-600) }); break;
        case 'unicode': h.store.mail.updateDraft({ message: `Für dich — 幽霊の手紙 👻 e\u0301 ${++n}` }); break;
        case 'detach': h.store.mail.updateDraft({ attached: false }); break;
        case 'attach': h.store.mail.updateDraft({ attached: true }); break;
        case 'lift': h.store.letter.liftWriting(); break;
        case 'reset': h.store.letter.resetToSource(); break;
        case 'mist0': h.store.letter.setMist(0); break;
        case 'night': h.store.letter.setPaper(h.store.letter.draft?.paper === 'night' ? 'bone' : 'night'); break;
        case 'undo': h.store.letter.undo(); break;
        case 'capture-mist': if (h.store.glass.placement && !h.store.glass.released && !h.store.studio.full) captureGlass(h.store, frameOnMistOnly()); break;
        case 'use-latest': { const latest = h.store.studio.list().at(-1); if (latest) h.store.useCapture(latest.id, true); break; }
        case 'send': last = h.store.send(); break;
        case 'answer': { const key = questionKey(last); last = key ? h.store.send({ confirm: key }) : last; break; }
        case 'return': { const receipt = h.store.mail.intended()?.receipt; if (receipt) h.store.returnToRequest(receipt.id); break; }
        case 'dismiss': h.store.clearOffered(); break;
        case 'finish': if (h.store.finish().ok) seen.finished++; break;
        case 'start-over': h.store.startOver(); break;
        case 'storage-fails': h.fail(true); break;
        case 'storage-works': h.fail(false); break;
      }
      const afterCase = caseView(h.store), afterDraft = draftView(h.store);
      const onlyDraft = h.heard.length > 0 && h.heard.every(change => change === 'mail-draft');
      // (1) Anything another surface shows that changed was announced as 'case'.
      if (afterCase !== beforeCase) expect(h.heard, `${step}: a change of the case was announced as case`).toContain('case');
      // (2) An announcement that was only 'mail-draft' changed nothing but the mail draft.
      if (onlyDraft) expect(afterCase, `${step}: a mail-draft announcement carried nothing else`).toBe(beforeCase);
      // (3) A change of the mail draft was announced (POSTMAN hears every kind).
      if (afterDraft !== beforeDraft) expect(h.heard.length, `${step}: the draft's change was announced`).toBeGreaterThan(0);
      // (4) Every change that announced itself after saving was saved at once: Session only exactly when that write
      // failed, and a kept save holding the current draft, character for character, when it worked.
      if (h.attempts > beforeAttempts) {
        expect(h.store.saveState).toBe(h.failing ? 'session-only' : 'saved');
        if (!h.failing) expect(JSON.stringify(h.kept.at(-1)!.mail.draft)).toBe(afterDraft);
        else seen.failedWrites++;
      }
      if (onlyDraft) seen.draftOnly++;
      if (h.heard.includes('case') && afterDraft !== beforeDraft) seen.caseWithDraft++;
      if (h.heard.includes('mail-draft') && h.store.saveState !== beforeSave) seen.flipDuringDraft++;
    }
    return seen;
  }

  it('a mail-draft announcement never carries anything else; everything else is announced as case; the save is exact and immediate', () => {
    const seen: Seen = { draftOnly: 0, caseWithDraft: 0, flipDuringDraft: 0, failedWrites: 0, finished: 0 };
    fc.assert(fc.property(fc.array(op, { minLength: 8, maxLength: 40, size: 'max' }), ops => {
      const h = harness();
      deliverValidLetter(h.store);
      play(h, ops, seen);
    }), { numRuns: 250 });
    console.log(`v9 property: ${JSON.stringify(seen)}`);
    // Not vacuous: draft-only changes, case changes that also touch the draft (Send), Session only reached by a draft
    // edit, failed writes and finished cases all occurred.
    for (const [name, count] of Object.entries(seen)) expect(count, `${name} occurred in the random runs`).toBeGreaterThan(0);
  }, 120_000);

  it('negative control: a store that announced a letter edit as mail-draft fails these checks', () => {
    const h = harness();
    deliverValidLetter(h.store);
    // As a broken store would: every change announced as the draft's only. The views that skip it would show an old letter.
    const store = h.store as unknown as { changed: (scope?: CaseChange) => void };
    const changed = store.changed.bind(h.store);
    store.changed = () => changed('mail-draft');
    expect(() => play(h, ['night'])).toThrow(/a change of the case was announced as case/);
  });
});
