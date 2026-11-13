import { describe, expect, it } from 'vitest';
import { derivePhase } from '../src/haunt/case-store';
import { FINAL_LINE, NOTE_LINES } from '../src/haunt/legacy-session';
import { MIST_LINES, placeImpression } from '../src/haunt/glass-model';
import { STAGE, TERMINAL_BOX, captureGlass, deliverValidLetter, frameOnHand, frameOnMistOnly, frameOnWritingOnly, keyOf, memoryStore, reachGlass } from './case-helpers';

describe('the case store: one job across four programs', () => {
  it('derives every phase from data, in order, and reports it to TERMINAL', () => {
    const { store } = memoryStore();
    expect(store.phase).toBe('repeating');
    store.legacy.observe();
    expect(store.phase).toBe('repeating');
    store.legacy.toggleRetry();
    expect(store.phase).toBe('call-stopped');
    store.legacy.observe();
    expect(store.phase).toBe('call-stopped');
    expect(store.glass.placement).toEqual(placeImpression(STAGE, TERMINAL_BOX));
    expect(store.glass.writing).toEqual(MIST_LINES);
    const id = captureGlass(store, frameOnHand(store));
    expect(store.phase).toBe('capture-retained');
    store.useCapture(id);
    expect(store.phase).toBe('capture-retained');
    store.letter.liftWriting();
    expect(store.phase).toBe('draft-ready');
    store.compose();
    store.mail.updateDraft({ to: 'guest@haunt' });
    expect(store.send().ok).toBe(true);
    expect(store.phase).toBe('ready-to-finish');
    expect(store.legacy.snapshot().casePhase).toBe('ready-to-finish');
    const lines: (string | undefined)[] = [];
    store.legacy.subscribe(() => lines.push(store.legacy.lastEvent().line));
    expect(store.finish(null).ok).toBe(true);
    expect(store.phase).toBe('finished');
    expect(lines).toContain('next-person');
    expect(store.legacy.snapshot()).toMatchObject({ presence: 'released', said: expect.arrayContaining(['next-person']) });
    expect(store.glass.released).toBe(true);
  });

  it('keeps Mara’s words verbatim from the glass to Guest Inbox', () => {
    const { store } = memoryStore();
    deliverValidLetter(store);
    const delivered = store.mail.intended()!;
    expect(delivered.letter!.lines).toEqual(MIST_LINES);
    expect(delivered.letter!.lines!.slice(0, 2).join(' ')).toBe(NOTE_LINES[0]);
    expect(delivered.letter!.lines!.slice(2)).toEqual(NOTE_LINES.slice(1));
    expect(delivered.letter!.subject).toMatch(/Handprint/);
  });

  it('accepts a narrow frame that shows only the writing as a capture, but the letter still needs a picture of the presence', () => {
    const { store } = memoryStore();
    reachGlass(store);
    const id = captureGlass(store, frameOnWritingOnly(store));
    expect(store.phase).toBe('capture-retained');
    store.useCapture(id);
    store.letter.liftWriting();
    expect(store.letter.status()!.lines).toEqual(MIST_LINES);
    expect(store.letter.status()!.missing).toEqual(['picture']);
    store.letter.setFrame(frameOnHand(store));
    expect(store.letter.status()!.complete).toBe(true);
    expect(store.phase).toBe('draft-ready');
  });

  it('a session-window capture is a real error: no writing, no handprint, and the phase does not move', () => {
    const { store } = memoryStore();
    reachGlass(store);
    store.studio.setSource('session');
    const result = store.studio.capture(store.run, { session: { presence: 'glass', attempts: 1, pid: null, retry: false, muffled: false },
      glass: { stage: { w: 1366, h: 720 }, ...store.glassForCapture(), monitor: frameOnHand(store) } });
    expect(result.ok && result.capture.negative.kind).toBe('session');
    expect(store.phase).toBe('call-stopped');
    store.useCapture(result.ok ? result.capture.id : 0);
    expect(store.letter.status()!.missing).toEqual(['picture', 'no-writing']);
    expect(store.letter.liftWriting()).toBe(false);
  });

  it('Reply only addresses a draft; Send to Mara returns without a receipt, keeps the draft and never re-arms the call', () => {
    const { store } = memoryStore();
    reachGlass(store);
    store.useCapture(captureGlass(store, frameOnHand(store)));
    store.letter.liftWriting();
    store.compose();
    store.reply();
    expect(store.mail.list()).toEqual([]);
    expect(store.mail.draft).toMatchObject({ to: 'mara@haunt', attached: true });
    const returned = store.send();
    expect(returned.ok && returned.delivery).toMatchObject({ route: 'returned', receipt: null, complete: false });
    expect(store.send()).toEqual({ ok: false, reason: 'duplicate' });
    expect(store.mail.list()).toHaveLength(1);
    expect(store.phase).toBe('draft-ready');
    expect(store.legacy.snapshot()).toMatchObject({ retry: false, presence: 'glass' });
    store.mail.updateDraft({ to: 'guest' });
    expect(store.send().ok).toBe(true);
    expect(store.phase).toBe('ready-to-finish');
  });

  it('an incomplete letter needs confirmation, never makes the case ready, and a corrected send does', () => {
    const { store } = memoryStore();
    reachGlass(store);
    store.useCapture(captureGlass(store, frameOnHand(store)));
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const ask = store.send();
    // confirmation-flow-v7: the question also says whether it would replace a complete letter (no) and carries its key.
    expect(ask).toEqual({ ok: false, reason: 'confirm-incomplete', missing: ['writing'], replaces: null, copy: false, key: keyOf(ask) });
    const sent = store.send({ confirm: keyOf(ask) });
    expect(sent.ok && sent.delivery).toMatchObject({ route: 'guest-inbox', complete: false, missing: ['writing'] });
    expect(store.phase).toBe('capture-retained');
    expect(store.checkReceipt(null)).toMatchObject({ ok: false, reason: 'incomplete' });
    expect(store.finish(null).ok).toBe(false);
    store.letter.liftWriting();
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    expect(store.send().ok).toBe(true);
    expect(store.legacy.snapshot()).toMatchObject({ attempts: 1, retry: false });
    expect(store.phase).toBe('ready-to-finish');
  });

  it('delivered A stays A when draft B is edited; receipt A certifies only A; replacing needs consent', () => {
    const { store } = memoryStore();
    const receiptA = deliverValidLetter(store);
    const deliveredA = JSON.stringify(store.mail.get(receiptA));
    store.letter.setPaper('night');
    store.letter.setMist(0.4);
    expect(JSON.stringify(store.mail.get(receiptA))).toBe(deliveredA);
    expect(store.checkReceipt(receiptA).ok).toBe(true);
    expect(store.phase).toBe('ready-to-finish');
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const replace = store.send();
    expect(replace.ok === false && replace.reason).toBe('confirm-replace');
    const sentB = store.send({ confirm: keyOf(replace) });
    expect(sentB.ok).toBe(true);
    const receiptB = sentB.ok ? sentB.delivery.receipt!.id : 0;
    expect(store.mail.get(receiptB)!.letter!.paper).toBe('night');
    expect(JSON.stringify(store.mail.get(receiptA))).toBe(deliveredA);
    expect(store.checkReceipt(receiptA)).toMatchObject({ ok: false, reason: 'replaced' });
    expect(store.finish(receiptA).ok).toBe(false);
    expect(store.finish(receiptB).ok).toBe(true);
    expect(store.ack!.receiptId).toBe(receiptB);
  });

  it('using the same capture again after reframing it in ECHO only moves the letter’s frame (one undoable edit)', () => {
    const { store } = memoryStore();
    reachGlass(store);
    const id = captureGlass(store, frameOnMistOnly());
    expect(store.useCapture(id)).toBe('created');
    store.letter.liftWriting();
    expect(store.useCapture(id)).toBe('same');
    store.studio.reframe(id, frameOnHand(store));
    expect(store.useCapture(id)).toBe('reframed');
    expect(store.letter.draft!.writing).toBe('paper');
    expect(store.letter.status()!.complete).toBe(true);
    store.letter.undo();
    expect(store.letter.status()!.missing).toEqual(['picture']);
  });

  it('a letter keeps its picture and words after its capture is discarded in ECHO', () => {
    const { store } = memoryStore();
    reachGlass(store);
    const id = captureGlass(store, frameOnHand(store));
    store.useCapture(id);
    store.letter.liftWriting();
    store.studio.discard(id);
    expect(store.studio.get(id)).toBeNull();
    expect(store.letter.status()!.complete).toBe(true);
    expect(store.letter.snapshot()!.lines).toEqual(MIST_LINES);
  });

  it('finishing is final: a second Finish, later edits and new sends never reopen or re-acknowledge', () => {
    const { store } = memoryStore();
    const receipt = deliverValidLetter(store);
    expect(store.finish(receipt).ok).toBe(true);
    const ack = store.ack;
    expect(store.finish(receipt)).toEqual({ ok: false, reason: 'finished' });
    store.letter.setPaper('night');
    store.letter.setMist(0);
    expect(store.phase).toBe('finished');
    expect(store.ack).toEqual(ack);
    expect(store.legacy.snapshot().said.filter(id => id === 'next-person')).toHaveLength(1);
    expect(FINAL_LINE).toBe('You were the next person. You can close the window now.');
  });

  it('Start the case over is a new run: archived receipts cannot finish it', () => {
    const { store } = memoryStore();
    const receipt = deliverValidLetter(store);
    store.finish(receipt);
    const oldRun = store.run;
    store.startOver();
    expect(store.run).not.toBe(oldRun);
    expect(store.phase).toBe('repeating');
    expect(store.mail.archive().map(item => item.id)).toContain(receipt);
    expect(store.ack).toBeNull();
    expect(store.glass.placement).toBeNull();
    expect(store.studio.list()).toEqual([]);
    expect(store.letter.draft).toBeNull();
    expect(store.checkReceipt(receipt)).toMatchObject({ ok: false, reason: 'other-run' });
    expect(store.finish(receipt).ok).toBe(false);
  });

  it('a tampered delivery cannot finish the job', () => {
    const { store } = memoryStore();
    const receipt = deliverValidLetter(store);
    const mail = store.mail as unknown as { deliveries: Array<{ subject: string }> };
    mail.deliveries[0]!.subject = 'Something else';
    expect(store.checkReceipt(receipt)).toMatchObject({ ok: false, reason: 'tampered' });
  });

  it('saves after every change, and reports Session only when the browser does not keep the save', () => {
    const { store, saves } = memoryStore();
    const before = saves.length;
    store.legacy.observe();
    expect(saves.length).toBeGreaterThan(before);
    expect(saves.at(-1)!.terminal.attempts).toBe(1);
    expect(store.saveState).toBe('saved');
    const blocked = new (store.constructor as typeof import('../src/haunt/case-store').CaseStore)({ save: null, notice: null }, { write: () => false });
    expect(blocked.saveState).toBe('session-only');
    blocked.legacy.observe();
    expect(blocked.legacy.snapshot().attempts).toBe(1);
  });

  it('only a mist-only frame is reported as Only mist; the phase reflects the useful capture all the same', () => {
    const { store } = memoryStore();
    reachGlass(store);
    const id = captureGlass(store, frameOnMistOnly());
    expect(store.phase).toBe('capture-retained');
    store.useCapture(id);
    expect(store.letter.status()!.missing).toContain('picture');
  });

  it('derivePhase never goes back to Repeating once the call has stopped', () => {
    expect(derivePhase({ presence: 'terminal', retry: true, acknowledged: false, deliveryValid: false, draftComplete: false, usefulCapture: false })).toBe('repeating');
    expect(derivePhase({ presence: 'shadow', retry: false, acknowledged: false, deliveryValid: false, draftComplete: false, usefulCapture: false })).toBe('call-stopped');
    expect(derivePhase({ presence: 'released', retry: false, acknowledged: true, deliveryValid: false, draftComplete: false, usefulCapture: false })).toBe('finished');
  });
});

describe('the milestone and its restore point', () => {
  it('never writes a save that holds the finished minute without its impression (or the reverse)', () => {
    const { store, saves } = memoryStore();
    reachGlass(store);
    for (const save of saves) expect(save.terminal.presence === 'glass').toBe(save.glass !== null);
    expect(saves.at(-1)!.glass!.writing).toEqual(MIST_LINES);
  });

  it('a capture after the release is bare glass: the hand has let go', () => {
    const { store } = memoryStore();
    store.finish(deliverValidLetter(store));
    const after = store.glassForCapture();
    expect(after).toMatchObject({ placement: null, writing: [] });
  });
});
