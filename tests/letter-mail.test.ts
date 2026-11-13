import { describe, expect, it } from 'vitest';
import { LetterModel, MISSING_TEXT, NOT_THE_WORDS, parseLetter, snapshotComplete, validSnapshot } from '../src/haunt/letter-model';
import { MailModel, RETURNED_LINE, deliveryHash, parseMail, resolveRecipient } from '../src/haunt/mail-model';
import { MIST_LINES } from '../src/haunt/glass-model';
import { captureGlass, frameOnHand, memoryStore, reachGlass } from './case-helpers';

function draftFromRoute() {
  const { store } = memoryStore();
  reachGlass(store);
  const id = captureGlass(store, frameOnHand(store));
  return { store, capture: store.studio.get(id)! };
}

describe('CANVAS: the letter draft', () => {
  it('lifting the writing puts Mara’s captured words on the paper, verbatim', () => {
    const { store, capture } = draftFromRoute();
    const letter = new LetterModel();
    expect(letter.useCapture(store.run, capture)).toBe('created');
    expect(letter.status()!.missing).toEqual(['writing']);
    expect(letter.liftWriting()).toBe(true);
    expect(letter.status()).toMatchObject({ complete: true, lines: MIST_LINES, missing: [] });
    expect(letter.liftWriting()).toBe(false);
  });

  it('clearing the mist with the words still in it loses them ("Not the words."), and Undo restores them', () => {
    const { store, capture } = draftFromRoute();
    const letter = new LetterModel();
    const changes: string[] = [];
    letter.subscribe(change => changes.push(change));
    letter.useCapture(store.run, capture);
    letter.setMist(0.6);
    expect(letter.draft!.writing).toBe('mist');
    letter.setMist(0);
    expect(letter.draft!.writing).toBe('lost');
    expect(changes.at(-1)).toBe('words-lost');
    // Without mist the figure behind the glass shows plainly, so the picture still has a subject; the words are gone.
    expect(letter.status()!.missing).toEqual(['writing-lost']);
    expect(NOT_THE_WORDS).toBe('Not the words.');
    // playability-v5 R2: the text names an action that survives a reload (v4 promised Undo, which a reload empties).
    expect(MISSING_TEXT['writing-lost']).toMatch(/Recover it from the capture/);
    letter.undo();
    expect(letter.draft).toMatchObject({ writing: 'mist', mist: 0.6 });
    letter.redo();
    expect(letter.draft!.writing).toBe('lost');
    letter.undo();
    letter.liftWriting();
    letter.setMist(0);
    expect(letter.draft!.writing).toBe('paper');
    expect(letter.status()).toMatchObject({ complete: true, subjects: { handprint: false, figure: 'clear' } });
  });

  it('a different capture replaces the draft’s source only when confirmed, and Undo reverts it', () => {
    const { store, capture } = draftFromRoute();
    const letter = new LetterModel();
    letter.useCapture(store.run, capture);
    letter.liftWriting();
    const second = store.studio.get(captureGlass(store, { x: 1000, y: 470, w: 360, h: 225 }))!;
    expect(letter.useCapture(store.run, second)).toBe('needs-confirm');
    expect(letter.draft!.captureId).toBe(capture.id);
    expect(letter.useCapture(store.run, second, true)).toBe('replaced');
    expect(letter.draft).toMatchObject({ captureId: second.id, writing: 'mist' });
    letter.undo();
    expect(letter.draft).toMatchObject({ captureId: capture.id, writing: 'paper' });
  });

  it('every edit is a new revision and a snapshot is an independent copy', () => {
    const { store, capture } = draftFromRoute();
    const letter = new LetterModel();
    letter.useCapture(store.run, capture);
    letter.liftWriting();
    const snapshot = letter.snapshot()!;
    expect(validSnapshot(snapshot)).toBe(true);
    expect(snapshotComplete(snapshot)).toBe(true);
    const revision = snapshot.revision;
    letter.setPaper('night');
    letter.setLayout('below');
    expect(letter.draft!.revision).toBe(revision + 2);
    expect(snapshot).toMatchObject({ paper: 'bone', layout: 'beside', revision });
    expect(JSON.stringify(snapshot).length).toBeLessThan(8000);
  });

  it('round-trips through validation', () => {
    const { store, capture } = draftFromRoute();
    const letter = new LetterModel();
    letter.useCapture(store.run, capture);
    const saved = JSON.parse(JSON.stringify(letter.toSaved()));
    expect(parseLetter(saved)).toEqual(saved);
    expect(parseLetter({ ...saved, draft: { ...saved.draft, writing: 'invented' } })).toBeNull();
    expect(parseLetter({ ...saved, draft: { ...saved.draft, source: { kind: 'glass', stage: { w: 1, h: 1 }, placement: null, fog: '', writing: ['x'] } } })).toBeNull();
  });
});

describe('POSTMAN: local mail at this desk', () => {
  it('knows exactly two mailboxes, in the forms people type', () => {
    for (const to of ['guest', 'guest@haunt', 'Guest', ' guest@haunt ', 'guest <guest@haunt>', 'you']) expect(resolveRecipient(to)).toBe('guest');
    for (const to of ['mara', 'MARA@haunt', 'Mara <mara@haunt>']) expect(resolveRecipient(to)).toBe('mara');
    for (const to of ['mara@gmail.com', 'admin', '', 'next person']) expect(resolveRecipient(to)).toBeNull();
  });

  it('refuses to send without a recipient or to an address that is not at this desk', () => {
    const mail = new MailModel();
    expect(mail.send(null)).toEqual({ ok: false, reason: 'no-draft' });
    mail.compose('run-test');
    expect(mail.send(null)).toEqual({ ok: false, reason: 'no-recipient' });
    mail.updateDraft({ to: 'mara@example.com' });
    expect(mail.send(null)).toEqual({ ok: false, reason: 'unknown-recipient' });
    expect(mail.list()).toEqual([]);
  });

  it('commits the delivery and its receipt together, with a hash of exactly what was sent', () => {
    const { store, capture } = draftFromRoute();
    store.useCapture(capture.id);
    store.letter.liftWriting();
    const mail = new MailModel();
    mail.compose(store.run);
    mail.updateDraft({ to: 'guest', message: 'Found it.' });
    const result = mail.send(store.letter.snapshot());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delivery).toMatchObject({ route: 'guest-inbox', complete: true, message: 'Found it.' });
    expect(result.delivery.receipt).toMatchObject({ deliveryId: result.delivery.id, recipient: 'guest', hash: result.delivery.hash });
    expect(deliveryHash(result.delivery)).toBe(result.delivery.hash);
    expect(mail.draft).toBeNull();
    expect(mail.send(store.letter.snapshot())).toEqual({ ok: false, reason: 'no-draft' });
    expect(mail.list()).toHaveLength(1);
    expect(RETURNED_LINE).toBe('That went back to the sender.');
  });

  it('round-trips through validation and rejects a receipt that does not match its delivery', () => {
    const { store, capture } = draftFromRoute();
    store.useCapture(capture.id);
    store.letter.liftWriting();
    const mail = new MailModel();
    mail.compose(store.run);
    mail.updateDraft({ to: 'guest' });
    mail.send(store.letter.snapshot());
    const saved = JSON.parse(JSON.stringify(mail.toSaved()));
    expect(parseMail(saved)).toEqual(saved);
    const forged = JSON.parse(JSON.stringify(saved));
    forged.deliveries[0].receipt.hash = '00000000';
    expect(parseMail(forged)).toBeNull();
    expect(parseMail({ ...saved, intended: 99 })).toBeNull();
    expect(parseMail({ ...saved, deliveries: [{ ...saved.deliveries[0], route: 'returned' }] })).toBeNull();
  });
});
