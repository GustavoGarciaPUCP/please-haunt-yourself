import { CaseStore } from '../src/haunt/case-store';
import { MIST_LINES, handBox, placeImpression, writingBoxes, type Box, type Size } from '../src/haunt/glass-model';
import type { CaseSave } from '../src/haunt/case-save';
import type { SendResult } from '../src/haunt/mail-model';

/** The key a question asked about (confirmation-flow-v7): answering it means sending again with this key. */
export function keyOf(result: SendResult): string {
  if (result.ok || !('key' in result)) throw new Error(`no question was asked: ${JSON.stringify(result)}`);
  return result.key;
}

export const STAGE: Size = { w: 1366, h: 720 };
export const TERMINAL_BOX: Box = { x: 116, y: 24, w: 574, h: 672 };

export function memoryStore(): { store: CaseStore; saves: CaseSave[] } {
  const saves: CaseSave[] = [];
  let clock = 1_000_000;
  const store = new CaseStore({ save: null, notice: null }, { write: save => { saves.push(JSON.parse(JSON.stringify(save))); return true; }, now: () => ++clock });
  // As on the desktop: the impression lands against TERMINAL's real edge.
  store.setPlacer(() => placeImpression(STAGE, TERMINAL_BOX));
  return { store, saves };
}

/** Repeating → one return → Stop the call → Let it finish → the impression on the glass (pressed by the store itself). */
export function reachGlass(store: CaseStore): void {
  store.legacy.observe();
  store.legacy.toggleRetry();
  store.legacy.observe();
}

/** A monitor-sized frame (16:10) centred on the hand, like ECHO dragged over it. */
export function frameOnHand(store: CaseStore, width = 470): Box {
  const hand = handBox(store.glass.placement!, STAGE);
  const h = width / 1.6;
  return { x: hand.x + hand.w / 2 - width / 2, y: hand.y + hand.h / 2 - h / 2, w: width, h };
}
export function frameOnMistOnly(): Box { return { x: 1000, y: 420, w: 320, h: 200 }; }
/** The note's block only: a minimum-size frame whose right edge stops short of the hand. */
export function frameOnWritingOnly(store: CaseStore): Box {
  const hand = handBox(store.glass.placement!, STAGE), lines = writingBoxes(store.glass.placement!, STAGE, MIST_LINES);
  return { x: hand.x - 380, y: lines[0]!.y - 10, w: 370, h: 231.25 };
}

export function captureGlass(store: CaseStore, monitor: Box): number {
  store.studio.setSource('glass');
  const glass = store.glassForCapture();
  const result = store.studio.capture(store.run, { session: { presence: 'glass', attempts: 1, pid: null, retry: false, muffled: false }, glass: { stage: STAGE, ...glass, monitor } });
  if (!result.ok) throw new Error('tray full');
  return result.capture.id;
}

/** The whole correct route at model level, ending with a valid delivery in Guest Inbox. */
export function deliverValidLetter(store: CaseStore): number {
  reachGlass(store);
  const id = captureGlass(store, frameOnHand(store));
  store.useCapture(id);
  store.letter.liftWriting();
  store.compose();
  store.mail.updateDraft({ to: 'guest' });
  const result = store.send();
  if (!result.ok) throw new Error(`send failed: ${result.reason}`);
  return result.delivery.receipt!.id;
}
