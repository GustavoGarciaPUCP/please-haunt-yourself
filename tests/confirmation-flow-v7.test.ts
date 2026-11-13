import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseCaseSave } from '../src/haunt/case-save';
import { CaseStore as CaseStoreClass, receiptMessage, type CaseStore } from '../src/haunt/case-store';
import { MIST_LINES, placeImpression } from '../src/haunt/glass-model';
import { FALL_BACK_LINE, phaseLines } from '../src/haunt/haunting-presentation';
import { snapshotComplete } from '../src/haunt/letter-model';
import { MailModel, parseMail, questionFor, questionWords, type Delivery, type SendResult } from '../src/haunt/mail-model';
import { STAGE, TERMINAL_BOX, deliverValidLetter, keyOf, memoryStore } from './case-helpers';

/** Review 28's state: complete A delivered to guest (not finished), then CANVAS reset to the capture: B is incomplete. */
function aThenIncompleteB() {
  const { store, saves } = memoryStore();
  const receiptA = deliverValidLetter(store);
  const a = store.mail.get(receiptA)!;
  store.letter.resetToSource();
  store.compose();
  store.mail.updateDraft({ to: 'guest' });
  return { store, saves, a, aJson: JSON.stringify(a) };
}
const question = (result: SendResult) => (result.ok || !('key' in result) ? null : result);
const deliveries = (store: CaseStore) => store.mail.list().length;
function sessionDraft(store: CaseStore): void {
  store.studio.setSource('session');
  const result = store.studio.capture(store.run, { session: { presence: 'glass', attempts: 1, pid: null, retry: false, muffled: false }, glass: { stage: STAGE, ...store.glassForCapture(), monitor: { x: 0, y: 0, w: 320, h: 200 } } });
  if (!result.ok) throw new Error('tray full');
  expect(store.useCapture(result.capture.id)).toBe('needs-confirm');
  expect(store.useCapture(result.capture.id, true)).toBe('replaced');
}

describe('v7: incomplete B over complete A asks one question and finishes in one answer (review 28)', () => {
  it('names both facts, delivers exactly once on the answer, and leaves A byte-identical but replaced', () => {
    const { store, a, aJson } = aThenIncompleteB();
    const ask = store.send();
    expect(ask).toMatchObject({ ok: false, reason: 'confirm-incomplete', missing: ['writing'], copy: false });
    expect(question(ask)?.reason === 'confirm-incomplete' && question(ask)!.replaces?.id).toBe(a.id);
    expect(deliveries(store)).toBe(1);
    expect(store.phase).toBe('ready-to-finish');
    const sent = store.send({ confirm: keyOf(ask) });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    expect(deliveries(store)).toBe(2);
    expect(sent.delivery).toMatchObject({ route: 'guest-inbox', complete: false, missing: ['writing'] });
    expect(store.mail.intended()!.id).toBe(sent.delivery.id);
    expect(store.mail.standing(store.mail.get(a.id)!)).toBe('replaced');
    expect(JSON.stringify(store.mail.get(a.id))).toBe(aJson);
    // The job no longer holds a complete letter: neither receipt can finish it.
    expect(store.phase).toBe('capture-retained');
    expect(store.checkReceipt(a.receipt!.id)).toMatchObject({ ok: false, reason: 'replaced' });
    expect(store.checkReceipt(null)).toMatchObject({ ok: false, reason: 'incomplete' });
    expect(store.finish(null).ok).toBe(false);
    // The same answer again delivers nothing more.
    expect(store.send({ confirm: keyOf(ask) })).toEqual({ ok: false, reason: 'no-draft' });
    expect(deliveries(store)).toBe(2);
  });

  it('a Replace answer never sends a letter that became incomplete after the question (the other order of the v6 loop)', () => {
    const { store } = memoryStore();
    deliverValidLetter(store);
    store.letter.setPaper('night');
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const replace = store.send();
    expect(replace).toMatchObject({ ok: false, reason: 'confirm-replace' });
    store.letter.resetToSource();
    const stale = store.send({ confirm: keyOf(replace) });
    // Nothing is sent on the old answer; the question is now about what would happen.
    expect(stale).toMatchObject({ ok: false, reason: 'confirm-incomplete', missing: ['writing'] });
    expect(keyOf(stale)).not.toBe(keyOf(replace));
    expect(deliveries(store)).toBe(1);
    expect(store.send({ confirm: keyOf(stale) }).ok).toBe(true);
    expect(deliveries(store)).toBe(2);
  });
});

describe('v7: an answer applies only to the attempt it was given for (prompt07 §3)', () => {
  const changes: Array<[string, (store: CaseStore) => void, (result: SendResult) => void]> = [
    ['the writing is lifted (now complete)', store => { store.letter.liftWriting(); }, result => expect(result).toMatchObject({ reason: 'confirm-replace' })],
    ['the paper changes (still incomplete)', store => { store.letter.setPaper('night'); }, result => expect(result).toMatchObject({ reason: 'confirm-incomplete', missing: ['writing'] })],
    ['the letter is unattached', store => { store.mail.updateDraft({ attached: false }); }, result => expect(result).toMatchObject({ reason: 'confirm-incomplete', missing: ['picture', 'writing'] })],
    ['the message changes', store => { store.mail.updateDraft({ message: 'For you.' }); }, result => expect(result).toMatchObject({ reason: 'confirm-incomplete' })],
    ['the subject changes', store => { store.mail.updateDraft({ subject: 'Found it' }); }, result => expect(result).toMatchObject({ reason: 'confirm-incomplete' })],
    ['the recipient becomes Mara (no question needed)', store => { store.mail.updateDraft({ to: 'mara' }); }, result => expect(result).toEqual({ ok: false, reason: 'changed' })],
    ['the draft is discarded and composed again', store => { store.mail.discardDraft(); store.compose(); store.mail.updateDraft({ to: 'guest' }); }, result => expect(result).toMatchObject({ reason: 'confirm-incomplete' })],
    ['the session is finished with A', store => { expect(store.finish(store.mail.intended()!.receipt!.id).ok).toBe(true); },
      result => expect(result).toMatchObject({ reason: 'confirm-incomplete', copy: true, replaces: null })],
  ];
  for (const [name, change, expectNow] of changes) {
    it(`after ${name}, the old answer sends nothing`, () => {
      const { store } = aThenIncompleteB();
      const ask = store.send();
      change(store);
      const count = deliveries(store);
      const result = store.send({ confirm: keyOf(ask) });
      expectNow(result);
      expect(deliveries(store)).toBe(count);
      if (question(result)) expect(keyOf(result)).not.toBe(keyOf(ask));
    });
  }

  it('the key is the attempt: the same draft, letter and job give the same key; it is not a counter', () => {
    const { store } = aThenIncompleteB();
    const first = keyOf(store.send()), second = keyOf(store.send());
    expect(second).toBe(first);
    const attempt = store.sendAttempt();
    expect(attempt.ok && attempt.attempt.key).toBe(first);
  });
});

describe('v7: the same policy for every kind of incomplete B, without inventing words', () => {
  it('B without its attachment: asked once, delivered without a letter', () => {
    const { store, a } = aThenIncompleteB();
    store.mail.updateDraft({ attached: false });
    const ask = store.send();
    expect(ask).toMatchObject({ reason: 'confirm-incomplete', missing: ['picture', 'writing'] });
    expect(question(ask)?.reason === 'confirm-incomplete' && question(ask)!.replaces?.id).toBe(a.id);
    const sent = store.send({ confirm: keyOf(ask) });
    expect(sent.ok && sent.delivery).toMatchObject({ letter: null, complete: false });
  });

  it('B from a capture of the session window: asked once; the delivery keeps the window and no words', () => {
    const { store } = memoryStore();
    const a = store.mail.get(deliverValidLetter(store))!;
    sessionDraft(store);
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const ask = store.send();
    expect(ask).toMatchObject({ reason: 'confirm-incomplete', missing: ['picture', 'no-writing'] });
    expect(question(ask)?.reason === 'confirm-incomplete' && question(ask)!.replaces?.id).toBe(a.id);
    const sent = store.send({ confirm: keyOf(ask) });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    expect(sent.delivery.letter).toMatchObject({ kind: 'session', lines: null, mistWriting: [] });
    const json = JSON.stringify(sent.delivery.letter);
    for (const line of MIST_LINES) expect(json).not.toContain(line);
  });
});

describe('v7: what follows an answer', () => {
  it('B corrected to complete asks only to Replace, and then its receipt finishes the job', () => {
    const { store, a } = aThenIncompleteB();
    expect(store.send()).toMatchObject({ reason: 'confirm-incomplete' });
    store.letter.liftWriting();
    const replace = store.send();
    expect(replace).toMatchObject({ ok: false, reason: 'confirm-replace' });
    expect(question(replace)!.replaces?.id).toBe(a.id);
    const sent = store.send({ confirm: keyOf(replace) });
    expect(sent.ok && sent.delivery.complete).toBe(true);
    expect(store.phase).toBe('ready-to-finish');
    expect(store.finish(sent.ok ? sent.delivery.receipt!.id : 0).ok).toBe(true);
  });

  it('after an incomplete replacement, a complete letter needs no Replace question and readies the job again', () => {
    const { store, a } = aThenIncompleteB();
    const b = store.send({ confirm: keyOf(store.send()) });
    expect(b.ok).toBe(true);
    store.letter.liftWriting();
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const c = store.send();
    expect(c.ok).toBe(true);
    if (!c.ok || !b.ok) return;
    expect(store.mail.intended()!.id).toBe(c.delivery.id);
    expect(store.mail.standing(store.mail.get(b.delivery.id)!)).toBe('replaced');
    expect(store.mail.standing(store.mail.get(a.id)!)).toBe('replaced');
    expect(store.phase).toBe('ready-to-finish');
  });

  it('cancelling (no answer) keeps A as the job’s letter, and A still finishes the case', () => {
    const { store, a, aJson } = aThenIncompleteB();
    store.send();
    expect(store.mail.intended()!.id).toBe(a.id);
    expect(store.finish(a.receipt!.id).ok).toBe(true);
    expect(store.ack!.deliveryId).toBe(a.id);
    expect(JSON.stringify(store.mail.get(a.id))).toBe(aJson);
  });

  it('after Finish session, copies (incomplete or complete) never change the accepted letter', () => {
    const { store } = memoryStore();
    const a = store.mail.get(deliverValidLetter(store))!;
    expect(store.finish(a.receipt!.id).ok).toBe(true);
    store.letter.resetToSource();
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const ask = store.send();
    expect(ask).toMatchObject({ reason: 'confirm-incomplete', copy: true, replaces: null });
    const copyB = store.send({ confirm: keyOf(ask) });
    expect(copyB.ok && store.mail.standing(copyB.delivery)).toBe('copy');
    store.letter.liftWriting();
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const copyC = store.send();
    expect(copyC.ok && store.mail.standing(copyC.delivery)).toBe('copy');
    expect(store.ack!.deliveryId).toBe(a.id);
    expect(store.mail.accepted()!.id).toBe(a.id);
    expect(store.phase).toBe('finished');
  });

  it('every save written along the way is readable (also with the confirmation open)', () => {
    const { store, saves } = aThenIncompleteB();
    const ask = store.send();
    expect(parseCaseSave(JSON.stringify(saves.at(-1)))).not.toBeNull();
    store.send({ confirm: keyOf(ask) });
    for (const save of saves) expect(parseCaseSave(JSON.stringify(save))).not.toBeNull();
  });
});

describe('v7: the words say what is true', () => {
  it('the combined question names what is missing, the delivery it replaces and that no receipt will finish the job', () => {
    const words = questionWords('the writing is still in the mist', '02:52 PM', false);
    expect(words.text).toBe('This letter is incomplete: the writing is still in the mist. Sending it replaces the complete letter delivered at 02:52 PM; that letter stays in Guest Inbox, marked replaced. No receipt will finish the job until a complete letter arrives. Send it anyway?');
    expect(words.buttons.map(([command]) => command)).toEqual(['keep-editing', 'open-canvas', 'send-anyway-replace']);
    expect(words.buttons[0]![2]).toBe(true);
  });

  it('the single-fact questions keep v6’s openings; none says an incomplete letter can finish the job', () => {
    const incomplete = questionWords('the writing is still in the mist', null, false);
    expect(incomplete.text).toBe('This letter is incomplete: the writing is still in the mist. Send it anyway? It will arrive, but it cannot finish the job.');
    expect(questionWords('no letter is attached', null, true).text).toMatch(/Send it anyway\? It will arrive as another copy; the letter the job accepted stays as it was\.$/);
    const replace = questionWords(null, '02:52 PM', false);
    expect(replace.text).toBe('Guest Inbox already has a complete letter from this job. Replace it? The letter delivered at 02:52 PM stays there, marked replaced, and only the new receipt can finish the job.');
    expect(replace.buttons.map(([command]) => command)).toEqual(['replace', 'keep-editing']);
    for (const text of [incomplete.text, questionWords('x', '1', false).text, questionWords('x', null, true).text]) expect(text).not.toMatch(/new receipt can finish|this (one|letter)[^.?]* can finish/i);
  });

  it('TERMINAL’s refusal of a replaced receipt points to the newer letter only when that letter is complete', () => {
    expect(receiptMessage('replaced', null, { complete: true })).toBe('That receipt is for a letter you replaced. The newer letter’s receipt can finish the job.');
    expect(receiptMessage('replaced', null, { complete: false })).toBe('That receipt is for a letter you replaced. The letter that replaced it is incomplete, so no receipt can finish the job until a complete letter arrives.');
  });

  it('TERMINAL notes the fall back once; Start over and forward moves are unchanged', () => {
    expect(phaseLines('capture-retained', 'ready-to-finish', { complete: false })).toEqual([[FALL_BACK_LINE, 'warning']]);
    expect(phaseLines('draft-ready', 'ready-to-finish', { complete: false })).toEqual([[FALL_BACK_LINE, 'warning']]);
    expect(phaseLines('repeating', 'ready-to-finish', { complete: false })).toEqual([]);
    expect(phaseLines('ready-to-finish', 'capture-retained', { complete: true })[0]![0]).toMatch(/POSTMAN delivered the letter/);
    const { store } = aThenIncompleteB();
    const seen: string[] = [];
    store.onPhase((phase, previous) => seen.push(...phaseLines(phase, previous, store.mail.intended()).map(([text]) => text)));
    store.send({ confirm: keyOf(store.send()) });
    expect(seen).toEqual([FALL_BACK_LINE]);
  });
});

describe('v7: the attachment flag (finding D)', () => {
  it('only a boolean reaches the draft and the save', () => {
    const mail = new MailModel();
    mail.compose('run-test');
    mail.updateDraft({ attached: 'on' as unknown as boolean });
    expect(mail.draft!.attached).toBe(false);
    mail.updateDraft({ attached: true });
    expect(mail.draft!.attached).toBe(true);
    expect(parseMail(JSON.parse(JSON.stringify(mail.toSaved())))).not.toBeNull();
  });
});

describe('v7: random sequences of edits, sends and answers (property)', () => {
  type Op = 'lift' | 'reset' | 'mist0' | 'night' | 'undo' | 'compose' | 'guest' | 'mara' | 'detach' | 'attach' | 'message' | 'discard' | 'send' | 'answer' | 'answerOld' | 'finish';
  const OPS: Op[] = ['lift', 'reset', 'mist0', 'night', 'undo', 'compose', 'guest', 'mara', 'detach', 'attach', 'message', 'discard', 'send', 'answer', 'answerOld', 'finish'];

  /** As memoryStore(), without copying every save (the property runs thousands of steps). */
  const fastStore = (): CaseStore => {
    let clock = 1_000_000;
    const store = new CaseStoreClass({ save: null, notice: null }, { write: () => true, now: () => ++clock });
    store.setPlacer(() => placeImpression(STAGE, TERMINAL_BOX));
    return store;
  };

  it('nothing is delivered without its question answered; deliveries never change; an answer always ends its question', () => {
    // How often the interesting cases occurred, so the property is known not to be vacuous.
    const seenCases = { combinedAsked: 0, combinedDelivered: 0, staleRefused: 0, replaceDelivered: 0, copies: 0 };
    // Sends and answers are frequent, Finish session is rare (as in play: once it happens every later letter to guest is
    // a copy, so an early finish would hide the cases before the end).
    const WEIGHTS: Record<Op, number> = { lift: 20, reset: 30, mist0: 10, night: 10, undo: 10, compose: 30, guest: 30, mara: 10, detach: 10, attach: 10, message: 10, discard: 10, send: 50, answer: 50, answerOld: 20, finish: 3 };
    const op = fc.oneof(...OPS.map(name => ({ arbitrary: fc.constant<Op>(name), weight: WEIGHTS[name] })));
    // `size: 'max'`: fast-check's default keeps arrays short (about ten items), too short to reach most questions.
    fc.assert(fc.property(fc.array(op, { minLength: 6, maxLength: 30, size: 'max' }), ops => {
      const store = fastStore();
      deliverValidLetter(store);
      const seen = new Map<number, string>();
      const keys: string[] = [];
      let last: ReturnType<typeof question> = null, lastStep = -1, n = 0;
      const remember = () => { for (const item of store.mail.list()) if (!seen.has(item.id)) seen.set(item.id, JSON.stringify(item)); };
      remember();
      ops.forEach((op, step) => {
        const before = store.sendAttempt(), count = deliveries(store), intended: Delivery | null = store.mail.intended(), finished = store.finished;
        let result: SendResult | null = null, answered: string | undefined;
        switch (op) {
          case 'lift': store.letter.liftWriting(); break;
          case 'reset': store.letter.resetToSource(); break;
          case 'mist0': store.letter.setMist(0); break;
          case 'night': store.letter.setPaper(store.letter.draft?.paper === 'night' ? 'bone' : 'night'); break;
          case 'undo': store.letter.undo(); break;
          case 'compose': store.compose(); break;
          case 'guest': store.mail.updateDraft({ to: 'guest' }); break;
          case 'mara': store.mail.updateDraft({ to: 'mara' }); break;
          case 'detach': store.mail.updateDraft({ attached: false }); break;
          case 'attach': store.mail.updateDraft({ attached: true }); break;
          case 'message': store.mail.updateDraft({ message: `note ${++n}` }); break;
          case 'discard': store.mail.discardDraft(); break;
          case 'send': result = store.send(); break;
          case 'answer': answered = last?.key; result = store.send({ confirm: answered }); break;
          case 'answerOld': answered = keys[0]; result = store.send({ confirm: answered }); break;
          case 'finish': if (intended?.receipt) store.finish(intended.receipt.id); break;
        }
        const q = result ? question(result) : null;
        if (q) { keys.push(q.key); }
        const added = store.mail.list().filter(item => !seen.has(item.id));
        if (q?.reason === 'confirm-incomplete' && q.replaces) seenCases.combinedAsked++;
        const askedBefore = before.ok ? questionFor(before.attempt) : null;
        if (added.length && askedBefore?.reason === 'confirm-incomplete' && askedBefore.replaces) seenCases.combinedDelivered++;
        if (added.length && askedBefore?.reason === 'confirm-replace') seenCases.replaceDelivered++;
        if (added.some(item => store.mail.standing(item) === 'copy')) seenCases.copies++;
        if (answered !== undefined && before.ok && answered !== before.attempt.key && !added.length) seenCases.staleRefused++;
        // (1) A delivery happens only on Send or an answer, one at a time.
        expect(added.length).toBeLessThanOrEqual(1);
        if (added.length) expect(op === 'send' || op === 'answer' || op === 'answerOld').toBe(true);
        for (const delivery of added) {
          const asked = before.ok ? questionFor(before.attempt) : null;
          // (2) If the attempt needed a question, the delivery was made with that very attempt's key.
          if (asked) expect(answered).toBe(asked.key);
          // (3) An incomplete letter to guest, or one replacing a complete letter before the end, always needed it.
          if (delivery.route === 'guest-inbox' && !delivery.complete) expect(asked?.reason).toBe('confirm-incomplete');
          if (delivery.route === 'guest-inbox' && !finished && intended?.complete) expect(asked?.replaces?.id).toBe(intended.id);
          // (4) A delivery is complete exactly when its own letter is.
          expect(delivery.complete).toBe(delivery.route === 'guest-inbox' && snapshotComplete(delivery.letter));
        }
        // (5) A stale answer never sends. (With no question asked yet, `answer` carries no key: it is a plain Send.)
        if ((op === 'answer' || op === 'answerOld') && answered !== undefined && before.ok && answered !== before.attempt.key) expect(deliveries(store)).toBe(count);
        // (6) Answering the question just asked, with nothing changed in between, always delivers: no loop.
        if (op === 'answer' && last && lastStep === step - 1 && before.ok && before.attempt.key === last.key) expect(added.length).toBe(1);
        // (7) Every delivery stays byte-identical; the accepted letter never changes once accepted.
        remember();
        for (const item of store.mail.list()) expect(JSON.stringify(item)).toBe(seen.get(item.id));
        if (store.ack) expect(store.mail.accepted()!.id).toBe(store.ack.deliveryId);
        // (8) The draft's attachment flag is a boolean; the mail part of the save stays readable.
        if (store.mail.draft) expect(typeof store.mail.draft.attached).toBe('boolean');
        expect(parseMail(JSON.parse(JSON.stringify(store.mail.toSaved())))).not.toBeNull();
        if (q) { last = q; lastStep = step; }
      });
    }), { numRuns: 300 });
    console.log(`v7 property: ${JSON.stringify(seenCases)}`);
    // Copies after the end are rarer here (Finish session is rare); the deterministic tests above cover them.
    for (const name of ['combinedAsked', 'combinedDelivered', 'staleRefused', 'replaceDelivered'] as const) expect(seenCases[name], `${name} occurred in the random runs`).toBeGreaterThan(0);
  }, 60_000);
});
