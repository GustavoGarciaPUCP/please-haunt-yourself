import { describe, expect, it } from 'vitest';
import { NOTE_MARGIN, SESSION_NOTE, SESSION_QUIET, layoutNote, type Ink, type Measure } from '../src/haunt/glass-render';
import { NOTE_SIGN, NOTE_START } from '../src/haunt/legacy-session';
import { NOTE_STOP, missingPhrases, snapshotSource } from '../src/haunt/letter-model';
import { receiptMessage } from '../src/haunt/case-store';
import { captureGlass, frameOnHand, keyOf, memoryStore, reachGlass } from './case-helpers';

/**
 * Synthetic fonts for the layout's logic: each character has a width in em, the ink may start right of the origin
 * (a bearing) and end past the advance (an overhang). The browser check measures real fonts; this tests the algorithm.
 */
function font(perChar: number, { bearing = 0.03, overhang = 0.08, ascent = 0.75, descent = 0.1 } = {}): Measure {
  return text => {
    const width = [...text].reduce((sum, ch) => sum + (ch === ' ' ? perChar * 0.45 : ch === '—' ? perChar * 1.4 : /[a-z]/.test(ch) ? perChar * 0.8 : perChar), 0);
    return { left: bearing, right: width + overhang, ascent, descent: /[gjpqy,]/.test(text) ? descent * 2.5 : descent } satisfies Ink;
  };
}
/** Ink boxes of a layout's runs, in the paper's units, from the same measurer. */
const boxes = (layout: ReturnType<typeof layoutNote>, measure: Measure) => layout.runs.map(run => {
  const ink = measure(run.text, run.family);
  return { role: run.role, left: run.x + ink.left * run.size, right: run.x + ink.right * run.size, top: run.y - ink.ascent * run.size, bottom: run.y + ink.descent * run.size, size: run.size };
});

describe('v6: the session note is laid out from measured ink (review 27, defect 1)', () => {
  const inner = { left: SESSION_NOTE.w * NOTE_MARGIN.x, right: SESSION_NOTE.w * (1 - NOTE_MARGIN.x), top: SESSION_NOTE.h * NOTE_MARGIN.y, bottom: SESSION_NOTE.h * (1 - NOTE_MARGIN.y) };
  const fonts = { 'Segoe Print-like (wide script)': font(0.685), 'Comic-like': font(0.6, { bearing: 0.07 }), 'Ink Free-like (narrow)': font(0.52, { bearing: -0.03 }), 'very wide': font(1.1) };

  for (const [name, measure] of Object.entries(fonts)) {
    it(`keeps every word inside the paper's margins: ${name}`, () => {
      const layout = layoutNote(SESSION_NOTE, NOTE_START, NOTE_SIGN, measure);
      expect(layout.fits).toBe(true);
      const ink = boxes(layout, measure);
      for (const box of ink) {
        expect(box.left).toBeGreaterThanOrEqual(inner.left - 1e-9);
        expect(box.right).toBeLessThanOrEqual(inner.right + 1e-9);
        expect(box.top).toBeGreaterThanOrEqual(inner.top - 1e-9);
        expect(box.bottom).toBeLessThanOrEqual(inner.bottom + 1e-9);
      }
      // The signature comes last, below every line, with a gap.
      const sign = ink.at(-1)!, lines = ink.filter(box => box.role === 'line');
      expect(sign.role).toBe('sign');
      for (const line of lines) expect(sign.top).toBeGreaterThanOrEqual(line.bottom + line.size * 0.3 - 1e-9);
    });
  }

  it('keeps the fragment verbatim and unfinished: wrapped only between words, "PER—" whole, never the glass message', () => {
    for (const measure of Object.values(fonts)) {
      const layout = layoutNote(SESSION_NOTE, NOTE_START, NOTE_SIGN, measure);
      expect(layout.lines.join(' ')).toBe(NOTE_START);
      expect(layout.lines.length).toBeLessThanOrEqual(3);
      expect(layout.lines.at(-1)!.endsWith('PER—')).toBe(true);
      expect(layout.runs.map(run => run.text)).not.toContain('This picture is yours.');
      expect(layout.runs.at(-1)!.text).toBe(NOTE_SIGN);
    }
  });

  it('wraps a wide script like TERMINAL’s note does ("FOR THE NEXT" / "PER—"); a wider one re-wraps instead of shrinking first', () => {
    const script = layoutNote(SESSION_NOTE, NOTE_START, NOTE_SIGN, fonts['Segoe Print-like (wide script)']);
    expect(script.lines).toEqual(['FOR THE NEXT', 'PER—']);
    expect(script.size).toBe(7.5);
    const wider = layoutNote(SESSION_NOTE, NOTE_START, NOTE_SIGN, font(0.8));
    expect(wider).toMatchObject({ fits: true, size: 7.5, lines: ['FOR THE', 'NEXT PER—'] });
    // Only a font too wide for two lines at the largest size makes the words smaller.
    expect(layoutNote(SESSION_NOTE, NOTE_START, NOTE_SIGN, fonts['very wide']).size).toBeLessThan(7.5);
  });

  it('a font far too wide for the paper is reported as not fitting (the drawing clips it and the browser check fails it)', () => {
    expect(layoutNote(SESSION_NOTE, NOTE_START, NOTE_SIGN, font(6)).fits).toBe(false);
  });

  it('the quiet zone for ECHO’s ghost line lies left of the figure (x ≥ 126) and between the header (15) and the note', () => {
    expect(SESSION_QUIET.x + SESSION_QUIET.w).toBeLessThan(126);
    expect(SESSION_QUIET.y).toBeGreaterThan(15);
    expect(SESSION_QUIET.y + SESSION_QUIET.h).toBeLessThan(SESSION_NOTE.y - 20);
  });
});

describe('v6: incompleteness is described in the words of the letter’s own source (review 27, wording)', () => {
  it('a session window is TERMINAL’s window with an unfinished note, not "only mist"', () => {
    const text = missingPhrases({ kind: 'session', subject: 'Bare glass', attached: true }, ['picture', 'no-writing']);
    expect(text).toBe(`the picture is TERMINAL’s window, not the glass; its note stops at “${NOTE_STOP}”`);
    expect(NOTE_STOP).toBe('PER—');
    expect(text).not.toMatch(/only mist|no writing/);
  });

  it('bare glass, an old limited picture, a missing attachment and the glass route each say what is true', () => {
    expect(missingPhrases({ kind: 'glass', subject: 'Bare glass', attached: true }, ['picture', 'no-writing'])).toBe('the picture shows bare glass; the glass had no writing yet when it was captured');
    expect(missingPhrases({ kind: 'limited', subject: 'Only mist', attached: true }, ['picture', 'no-writing'])).toBe('the picture shows only mist; the old picture kept no writing');
    expect(missingPhrases({ kind: null, subject: null, attached: false }, ['picture', 'writing'])).toBe('no letter is attached');
    expect(missingPhrases({ kind: 'glass', subject: 'Only mist', attached: true }, ['picture', 'writing'])).toBe('the picture shows only mist; the writing is still in the mist');
    expect(missingPhrases({ kind: 'glass', subject: 'Figure', attached: true }, ['writing-lost'])).toBe('the writing went with the mist');
  });

  it('TERMINAL refuses an incomplete session-window letter with the same words', () => {
    const { store } = memoryStore();
    store.studio.setSource('session');
    const result = store.studio.capture(store.run, { session: { presence: 'terminal', attempts: 0, pid: 3087, retry: true, muffled: false }, glass: { stage: { w: 1366, h: 720 }, ...store.glassForCapture(), monitor: { x: 0, y: 0, w: 320, h: 200 } } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    store.useCapture(result.capture.id);
    store.compose();
    store.mail.updateDraft({ to: 'guest' });
    // confirmation-flow-v7: the answer carries the key of the question it answers.
    const sent = store.send({ confirm: keyOf(store.send()) });
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    expect(receiptMessage('incomplete', sent.delivery)).toBe(`The letter that arrived is incomplete: ${missingPhrases(snapshotSource(sent.delivery.letter), sent.delivery.missing)}. Fix it in CANVAS and send it again.`);
    expect(receiptMessage('incomplete', sent.delivery)).toMatch(/TERMINAL’s window, not the glass; its note stops at “PER—”/);
  });

  it('a session capture still never gains writing; a glass capture still keeps five lines', () => {
    const { store } = memoryStore();
    reachGlass(store);
    store.studio.setSource('session');
    const session = store.studio.capture(store.run, { session: { presence: 'glass', attempts: 1, pid: null, retry: false, muffled: false }, glass: { stage: { w: 1366, h: 720 }, ...store.glassForCapture(), monitor: { x: 0, y: 0, w: 320, h: 200 } } });
    expect(session.ok && session.capture.negative.kind).toBe('session');
    expect(session.ok && 'writing' in session.capture.negative).toBe(false);
    const glass = store.studio.get(captureGlass(store, frameOnHand(store)))!;
    expect(glass.negative.kind === 'glass' && glass.negative.writing.length).toBe(5);
  });
});
