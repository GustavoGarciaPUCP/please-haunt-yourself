import { describe, expect, it } from 'vitest';
import { parseCaseSave } from '../src/haunt/case-save';
import { CaseStore } from '../src/haunt/case-store';
import { PHASES } from '../src/haunt/case-phase';
import { HAND_REGION, MIST_LINES, handBox, handRegion, placeImpression, type Box } from '../src/haunt/glass-model';
import { jobStrip } from '../src/haunt/haunting-presentation';
import { LegacySession } from '../src/haunt/legacy-session';
import { KEEP_LEVELS, LetterModel, MISSING_TEXT, keepPreview } from '../src/haunt/letter-model';
import { MAX_DELIVERIES } from '../src/haunt/mail-model';
import { STAGE, captureGlass, deliverValidLetter, frameOnHand, keyOf, memoryStore, reachGlass } from './case-helpers';

/** Sends `count` attempts to Mara (each returned to the sender), changing the message so none is a duplicate. */
function returnedSends(store: CaseStore, count: number): void {
  for (let i = 0; i < count; i++) {
    store.compose();
    store.mail.updateDraft({ to: 'mara', message: `Attempt ${i + 1}` });
    const result = store.send();
    if (!result.ok) throw new Error(`send to mara failed: ${result.reason}`);
  }
}
/** The saved case, reloaded into a fresh store, as a reload does. */
function reload(saves: unknown[]): CaseStore {
  const save = parseCaseSave(JSON.stringify(saves.at(-1)));
  if (!save) throw new Error('the saved case did not validate');
  return new CaseStore({ save, notice: null }, { write: () => true });
}
const inside = (inner: Box, outer: Box): boolean =>
  inner.x >= outer.x - 1e-6 && inner.y >= outer.y - 1e-6 && inner.x + inner.w <= outer.x + outer.w + 1e-6 && inner.y + inner.h <= outer.y + outer.h + 1e-6;

describe('v5 retention: the history bound never removes what the job depends on (review 26 A)', () => {
  it('before Finish session: the intended delivery survives a flood of returned attempts, and a reload keeps the case', () => {
    const { store, saves } = memoryStore();
    const receipt = deliverValidLetter(store);
    const intended = store.mail.intended()!.id;
    returnedSends(store, MAX_DELIVERIES + 1);
    store.persist();
    expect(store.mail.list()).toHaveLength(MAX_DELIVERIES);
    expect(store.mail.list().some(item => item.id === intended)).toBe(true);
    expect(store.mail.intended()?.id).toBe(intended);
    expect(store.phase).toBe('ready-to-finish');
    const restored = reload(saves);
    expect(restored.phase).toBe('ready-to-finish');
    expect(restored.run).toBe(store.run);
    expect(restored.checkReceipt(receipt).ok).toBe(true);
  });

  it('after Finish session: the accepted delivery survives copies and returned attempts; a reload stays finished', () => {
    const { store, saves } = memoryStore();
    const receipt = deliverValidLetter(store);
    expect(store.finish(receipt).ok).toBe(true);
    const accepted = store.ack!.deliveryId;
    // Copies to guest (no Replace prompt after the end) and returned attempts to Mara, past the bound.
    for (let i = 0; i < 7; i++) {
      store.compose();
      store.mail.updateDraft({ to: 'guest', message: `Copy ${i + 1}` });
      const result = store.send();
      expect(result.ok).toBe(true);
      if (result.ok) expect(store.mail.standing(result.delivery)).toBe('copy');
    }
    returnedSends(store, 7);
    store.persist();
    expect(store.mail.list()).toHaveLength(MAX_DELIVERIES);
    expect(store.mail.accepted()?.id).toBe(accepted);
    expect(store.mail.intended()?.id).toBe(accepted);
    expect(store.mail.standing(store.mail.get(accepted)!)).toBe('accepted');
    const restored = reload(saves);
    expect(restored.phase).toBe('finished');
    expect(restored.run).toBe(store.run);
    expect(restored.legacy.snapshot().presence).toBe('released');
    expect(restored.mail.accepted()?.id).toBe(accepted);
    expect(restored.deliveredLetter()?.id).toBe(accepted);
  });

  it('after the end a send to guest is a copy: it never asks to replace, and the accepted letter stays the job’s', () => {
    const { store } = memoryStore();
    store.finish(deliverValidLetter(store));
    const accepted = store.ack!.deliveryId;
    store.letter.setPaper('night');
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const result = store.send();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.delivery.complete).toBe(true);
    expect(result.delivery.receipt).not.toBeNull();
    expect(store.mail.intended()?.id).toBe(accepted);
    expect(store.deliveredLetter()?.id).toBe(accepted);
    expect(store.finish(result.delivery.receipt!.id)).toEqual({ ok: false, reason: 'finished' });
  });

  it('before the end, a newer complete letter still asks first, and the older one then stands as replaced', () => {
    const { store } = memoryStore();
    deliverValidLetter(store);
    const first = store.mail.intended()!;
    store.letter.setLayout('below');
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    const ask = store.send();
    expect(ask.ok).toBe(false);
    const second = store.send({ confirm: keyOf(ask) });
    expect(second.ok).toBe(true);
    expect(store.mail.standing(store.mail.get(first.id)!)).toBe('replaced');
    expect(store.mail.standing(store.mail.intended()!)).toBe('intended');
  });
});

describe('v5 CANVAS: lost writing is recoverable after a reload (review 26 B)', () => {
  function lostDraft() {
    const { store, saves } = memoryStore();
    reachGlass(store);
    const id = captureGlass(store, frameOnHand(store));
    store.useCapture(id);
    store.letter.setPaper('night');
    store.letter.setLayout('below');
    store.letter.setMist(0);
    store.persist();
    return { store, saves };
  }

  it('Recover the writing puts the captured lines on the paper verbatim and keeps every other edit', () => {
    const { store } = lostDraft();
    const before = store.letter.draft!;
    expect(before.writing).toBe('lost');
    expect(MISSING_TEXT['writing-lost']).not.toMatch(/Undo/);
    expect(store.letter.recoverWriting()).toBe(true);
    const after = store.letter.draft!;
    expect(after).toMatchObject({ writing: 'paper', mist: 0, paper: 'night', layout: 'below', frame: before.frame, captureId: before.captureId });
    expect(store.letter.status()).toMatchObject({ lines: MIST_LINES, complete: true });
    expect(store.letter.recoverWriting()).toBe(false);
    store.letter.undo();
    expect(store.letter.draft!.writing).toBe('lost');
  });

  it('after a reload Undo is empty, but Recover still works', () => {
    const { saves } = lostDraft();
    const restored = reload(saves);
    expect(restored.letter.draft!.writing).toBe('lost');
    expect(restored.letter.canUndo).toBe(false);
    expect(restored.letter.recoverWriting()).toBe(true);
    expect(restored.letter.status()?.lines).toEqual(MIST_LINES);
  });

  it('a capture without writing gains nothing', () => {
    const { store } = memoryStore();
    store.studio.setSource('session');
    const result = store.studio.capture(store.run, { session: { presence: 'terminal', attempts: 0, pid: 3087, retry: true, muffled: false }, glass: { stage: STAGE, ...store.glassForCapture(), monitor: { x: 0, y: 0, w: 320, h: 200 } } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const letter = new LetterModel();
    letter.useCapture(store.run, result.capture);
    letter.setMist(0);
    expect(letter.draft!.writing).toBe('mist');
    expect(letter.recoverWriting()).toBe(false);
    expect(letter.status()!.missing).toContain('no-writing');
  });
});

describe('v5 CANVAS: what the photograph keeps (review 26 §5)', () => {
  it('the three options are described from the letter’s own capture, and only clearing all the mist risks the words', () => {
    const { store } = memoryStore();
    reachGlass(store);
    store.useCapture(captureGlass(store, frameOnHand(store)));
    const draft = store.letter.draft!;
    const previews = KEEP_LEVELS.map(level => keepPreview(draft, level));
    expect(previews.map(item => item.mist)).toEqual([1, 0.4, 0]);
    expect(previews.map(item => item.label)).toEqual(['Handprint', 'Handprint and figure', 'Figure']);
    expect(previews.every(item => item.picture)).toBe(true);
    expect(previews.map(item => item.losesWriting)).toEqual([false, false, true]);
    store.letter.liftWriting();
    expect(keepPreview(store.letter.draft!, 0).losesWriting).toBe(false);
  });

  it('a choice is an edit of the letter: the delivered snapshot keeps it', () => {
    const { store } = memoryStore();
    reachGlass(store);
    store.useCapture(captureGlass(store, frameOnHand(store)));
    store.letter.liftWriting();
    store.letter.setMist(0.4);
    const snapshot = store.letter.snapshot()!;
    expect(snapshot).toMatchObject({ mist: 0.4, subject: 'Handprint and figure', complete: true });
  });
});

describe('v5 orientation: the default surfaces state the problem, not its fix (review 26 §4)', () => {
  it('Repeating names the open question; only the explicit answer says Stop the call', () => {
    const session = new LegacySession();
    const strip = jobStrip(session.snapshot());
    expect(strip.next).toBe('Next: Find out what keeps bringing it back.');
    const defaults = [PHASES.repeating.label, PHASES.repeating.pending, PHASES.repeating.question, PHASES.repeating.hint, strip.next,
      ...(session.execute('ask are you okay')?.lines ?? []), ...(session.execute('jobs')?.lines ?? [])];
    for (const text of defaults) expect(text).not.toMatch(/stop the call/i);
    expect(PHASES.repeating.answer).toMatch(/Stop the call/);
  });
});

describe('v5 ending: the receipt’s view of the glass (review 26 §6)', () => {
  it('handRegion is 16:10, holds the whole handprint and stays on the stage', () => {
    for (const terminal of [{ x: 116, y: 24, w: 574, h: 672 }, { x: 760, y: 30, w: 560, h: 640 }, { x: 0, y: 0, w: 480, h: 420 }]) {
      const placement = placeImpression(STAGE, terminal);
      const region = handRegion(placement, STAGE);
      expect(region.w / region.h).toBeCloseTo(1.6, 5);
      expect(region.w).toBeCloseTo(HAND_REGION.w * STAGE.h, 5);
      expect(inside(region, { x: 0, y: 0, w: STAGE.w, h: STAGE.h })).toBe(true);
      expect(inside(handBox(placement, STAGE), region)).toBe(true);
    }
    // At the stage's edge the region slides back inside instead of leaving it.
    const edge = handRegion({ hand: { u: 0.99, v: 0.02 }, side: 'right' }, STAGE);
    expect(inside(edge, { x: 0, y: 0, w: STAGE.w, h: STAGE.h })).toBe(true);
  });

  it('Finish session commits once; the release only presents it', () => {
    const { store } = memoryStore();
    const receipt = deliverValidLetter(store);
    expect(store.finish(receipt).ok).toBe(true);
    expect(store.glass.released).toBe(true);
    expect(store.finish(receipt)).toEqual({ ok: false, reason: 'finished' });
    expect(store.glass.placement).not.toBeNull();
  });
});
