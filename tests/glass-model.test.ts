import { describe, expect, it } from 'vitest';
import {
  GRID_SIZE, GlassSurface, MIST_LINES, createFog, decodeBytes, encodeBytes, extractPatch, figureBox, fogBase, frameSubjects, gridField, handBox,
  lineEm, patchField, pictureShowsPresence, placeImpression, subjectLabel, writingBoxes, type Box, type Size,
} from '../src/haunt/glass-model';
import { NOTE_LINES } from '../src/haunt/legacy-session';

const stage: Size = { w: 1366, h: 720 };
const terminal: Box = { x: 116, y: 24, w: 574, h: 672 };

describe('the impression on the glass (v4)', () => {
  it('writes the job’s note in the mist verbatim (the heading across two lines)', () => {
    expect(MIST_LINES.slice(0, 2).join(' ')).toBe(NOTE_LINES[0]);
    expect(MIST_LINES.slice(2)).toEqual(NOTE_LINES.slice(1));
    const glass = new GlassSurface();
    glass.place(placeImpression(stage, terminal), MIST_LINES);
    expect(glass.writing).toEqual(MIST_LINES);
  });

  it('presses the hand across TERMINAL’s right edge, with the writing behind the window', () => {
    const placement = placeImpression(stage, terminal);
    expect(placement.side).toBe('right');
    const hand = handBox(placement, stage), right = terminal.x + terminal.w;
    expect(hand.x).toBeLessThan(right);
    expect((hand.x + hand.w - right) / hand.w).toBeGreaterThan(0.25);
    for (const line of writingBoxes(placement, stage, MIST_LINES)) expect(line.x + line.w).toBeLessThanOrEqual(right);
    expect(figureBox(placement, stage).x + figureBox(placement, stage).w / 2).toBeGreaterThan(hand.x + hand.w / 2);
  });

  it('measures handwriting deterministically from the text itself', () => {
    expect(lineEm('FOR THE NEXT PERSON')).toBeGreaterThan(lineEm('AT THIS DESK'));
    expect(lineEm('')).toBe(1);
    const boxes = writingBoxes(placeImpression(stage, terminal), stage, ['A', 'A longer line']);
    expect(boxes[1]!.w).toBeGreaterThan(boxes[0]!.w);
    expect(writingBoxes(placeImpression(stage, terminal), stage, [])).toEqual([]);
  });

  it('uses the left edge when the right edge is covered', () => {
    expect(placeImpression(stage, terminal, [{ x: 700, y: 0, w: 666, h: 720 }]).side).toBe('left');
  });

  it('reports what a frame shows in words: handprint, figure, writing or only mist', () => {
    const glass = new GlassSurface();
    const placement = placeImpression(stage, terminal);
    glass.place(placement, MIST_LINES);
    const hand = handBox(placement, stage), figure = figureBox(placement, stage);
    const onHand: Box = { x: hand.x - 120, y: hand.y - 30, w: 400, h: 250 };
    let subjects = frameSubjects(placement, glass.field, onHand, stage, glass.writing);
    expect(subjects).toMatchObject({ handprint: true, figure: 'faint' });
    expect(subjectLabel(subjects)).toBe('Handprint');
    expect(pictureShowsPresence(subjects)).toBe(true);
    const mistOnly: Box = { x: 1000, y: 470, w: 360, h: 225 };
    subjects = frameSubjects(placement, glass.field, mistOnly, stage, glass.writing);
    expect(subjectLabel(subjects)).toBe('Only mist');
    expect(pictureShowsPresence(subjects)).toBe(false);
    // Wiping beside the palm uncovers the figure behind the glass.
    for (let y = figure.y + 20; y < figure.y + 160; y += 12) glass.wipe({ x: hand.x + hand.w, y }, { x: figure.x + figure.w * 0.6, y }, stage);
    subjects = frameSubjects(placement, glass.field, onHand, stage, glass.writing);
    expect(subjectLabel(subjects)).toBe('Handprint and figure');
    // Without mist the handprint (a cut in the mist) cannot be seen, while the figure is plain.
    subjects = frameSubjects(placement, glass.field, onHand, stage, glass.writing, 0);
    expect(subjects).toMatchObject({ handprint: false, figure: 'clear' });
    expect(subjectLabel(frameSubjects(null, glass.field, onHand, stage, []))).toBe('Bare glass');
  });

  it('wiping the print itself away leaves no handprint (it is a mark in the mist), and thin mist hides it too', () => {
    const glass = new GlassSurface();
    const placement = placeImpression(stage, terminal);
    glass.place(placement, MIST_LINES);
    const hand = handBox(placement, stage), frame: Box = { x: hand.x - 60, y: hand.y - 20, w: 320, h: 200 };
    expect(frameSubjects(placement, glass.field, frame, stage, glass.writing, 0.4).handprint).toBe(true);
    expect(frameSubjects(placement, glass.field, frame, stage, glass.writing, 0.2).handprint).toBe(false);
    for (let y = hand.y; y <= hand.y + hand.h; y += 8) glass.wipe({ x: hand.x - 10, y }, { x: hand.x + hand.w + 10, y }, stage);
    expect(frameSubjects(placement, glass.field, frame, stage, glass.writing).handprint).toBe(false);
    glass.breathe({ x: hand.x - 20, y: hand.y - 20, w: hand.w + 40, h: hand.h + 40 }, stage);
    expect(frameSubjects(placement, glass.field, frame, stage, glass.writing).handprint).toBe(true);
  });

  it('wiping removes mist but never the writing layer; breathing restores the mist only', () => {
    const glass = new GlassSurface();
    const placement = placeImpression(stage, terminal);
    glass.place(placement, MIST_LINES);
    for (const line of writingBoxes(placement, stage, MIST_LINES)) glass.wipe({ x: line.x, y: line.y + 10 }, { x: line.x + line.w, y: line.y + 10 }, stage);
    expect(glass.writing).toEqual(MIST_LINES);
    glass.breathe({ x: 0, y: 0, w: stage.w, h: stage.h }, stage);
    expect(glass.grid()).toEqual(createFog());
  });

  it('starts with uneven, deterministic condensation', () => {
    const fog = createFog();
    expect(fog).toHaveLength(GRID_SIZE);
    expect(createFog()).toEqual(fog);
    expect(Math.max(...fog) - Math.min(...fog)).toBeGreaterThan(30);
    expect(fogBase(10, 71)).toBeGreaterThan(fogBase(10, 0) - 0.2);
  });

  it('releases once at the end; nothing wipes or breathes afterwards', () => {
    const glass = new GlassSurface();
    glass.place(placeImpression(stage, terminal), MIST_LINES);
    glass.release();
    expect(glass.released).toBe(true);
    expect(glass.wipe({ x: 300, y: 300 }, { x: 400, y: 300 }, stage)).toBe(false);
    expect(glass.breathe({ x: 0, y: 0, w: 100, h: 100 }, stage)).toBe(false);
  });

  it('encodes the grid and patches losslessly, and restores a saved surface with its writing and release', () => {
    const fog = createFog();
    expect(decodeBytes(encodeBytes(fog), GRID_SIZE)).toEqual(fog);
    for (const bad of ['', 'AAAA', 42, null]) expect(decodeBytes(bad, GRID_SIZE)).toBeNull();
    const patch = extractPatch(fog, { x: 300, y: 120, w: 470, h: 290 }, stage), field = patchField(patch)!, full = gridField(fog);
    expect(field.at(patch.c0 + 3, patch.r0 + 4)).toBe(full.at(patch.c0 + 3, patch.r0 + 4));
    const glass = new GlassSurface();
    glass.place(placeImpression(stage, terminal), MIST_LINES);
    glass.release();
    const copy = new GlassSurface();
    expect(copy.restore(glass.toSaved()!)).toBe(true);
    expect(copy.writing).toEqual(MIST_LINES);
    expect(copy.released).toBe(true);
    expect(new GlassSurface().restore({ ...glass.toSaved()!, writing: [''] })).toBe(false);
    glass.reset();
    expect(glass.toSaved()).toBeNull();
  });
});
