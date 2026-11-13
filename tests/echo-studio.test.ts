import { describe, expect, it } from 'vitest';
import { EchoStudio, MAX_CAPTURES, SESSION_SIZE, captureSubjects, clampFrame, isUsefulCapture, moveFrame, parseStudio, scaleFrame, type SessionFrame } from '../src/haunt/echo-studio';
import { GlassSurface, MIST_LINES, encodeBytes, handBox, placeImpression, subjectLabel, type Box, type Size } from '../src/haunt/glass-model';

const stage: Size = { w: 1366, h: 720 };
const live = (overrides: Partial<SessionFrame> = {}): SessionFrame => ({ presence: 'terminal', attempts: 0, pid: 3087, retry: true, muffled: false, ...overrides });
function placedGlass() {
  const glass = new GlassSurface();
  glass.place(placeImpression(stage, { x: 116, y: 24, w: 574, h: 672 }), MIST_LINES);
  return glass;
}
const glassInput = (glass: GlassSurface, monitor: Box) => ({ stage, placement: glass.placement, fog: encodeBytes(glass.grid()), writing: glass.writing, monitor });

describe('ECHO captures: a full negative and a separate photo frame', () => {
  it('a glass capture keeps the whole glass, its writing layer and the monitor’s frame', () => {
    const glass = placedGlass(), studio = new EchoStudio();
    studio.setSource('glass');
    const hand = handBox(glass.placement!, stage);
    const monitor = { x: hand.x - 100, y: hand.y - 20, w: 400, h: 250 };
    const result = studio.capture('run-test', { session: live(), glass: glassInput(glass, monitor) });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const capture = result.capture;
    expect(capture.negative).toMatchObject({ kind: 'glass', stage, writing: MIST_LINES });
    expect(capture.frame).toEqual(monitor);
    expect(isUsefulCapture(capture)).toBe(true);
    expect(subjectLabel(captureSubjects(capture.negative, capture.frame))).toBe('Handprint');
  });

  it('later wipes never change a capture; reframing changes only its frame', () => {
    const glass = placedGlass(), studio = new EchoStudio();
    studio.setSource('glass');
    const result = studio.capture('run-test', { session: live(), glass: glassInput(glass, { x: 1000, y: 470, w: 360, h: 225 }) });
    if (!result.ok) throw new Error('capture');
    const before = JSON.stringify(studio.get(result.capture.id)!.negative);
    glass.wipe({ x: 0, y: 0 }, { x: 1366, y: 720 }, stage);
    expect(JSON.stringify(studio.get(result.capture.id)!.negative)).toBe(before);
    expect(subjectLabel(captureSubjects(result.capture.negative, result.capture.frame))).toBe('Only mist');
    const hand = handBox(glass.placement!, stage);
    expect(studio.reframe(result.capture.id, { x: hand.x - 100, y: hand.y - 20, w: 400, h: 250 })).toBe(true);
    const moved = studio.get(result.capture.id)!;
    expect(JSON.stringify(moved.negative)).toBe(before);
    expect(subjectLabel(captureSubjects(moved.negative, moved.frame))).toBe('Handprint');
  });

  it('a session-window capture has no writing and no impression; before the milestone the glass is bare', () => {
    const studio = new EchoStudio();
    const session = studio.capture('run-test', { session: live({ presence: 'glass', pid: null, retry: false }), glass: glassInput(new GlassSurface(), { x: 0, y: 0, w: 400, h: 250 }) });
    expect(session.ok && session.capture.negative.kind).toBe('session');
    expect(session.ok && session.capture.frame).toEqual({ x: 0, y: 0, w: SESSION_SIZE.w, h: SESSION_SIZE.h });
    expect(session.ok && isUsefulCapture(session.capture)).toBe(false);
    expect(session.ok && studio.reframe(session.capture.id, { x: 10, y: 10, w: 100, h: 62.5 })).toBe(false);
    studio.setSource('glass');
    const bare = studio.capture('run-test', { session: live(), glass: glassInput(new GlassSurface(), { x: 0, y: 0, w: 400, h: 250 }) });
    expect(bare.ok && bare.capture.negative).toMatchObject({ kind: 'glass', placement: null, writing: [] });
    expect(bare.ok && subjectLabel(captureSubjects(bare.capture.negative, bare.capture.frame))).toBe('Bare glass');
  });

  it('a paused frame is captured as it was; switching source drops the pause', () => {
    const studio = new EchoStudio();
    studio.pause(live({ attempts: 1 }));
    const result = studio.capture('run-test', { session: live({ attempts: 5 }), glass: glassInput(new GlassSurface(), { x: 0, y: 0, w: 400, h: 250 }) });
    expect(result.ok && result.capture.negative.kind === 'session' && result.capture.negative.session.attempts).toBe(1);
    studio.setSource('glass');
    expect(studio.paused).toBeNull();
  });

  it('frames keep the monitor’s aspect, a minimum size and the capture’s bounds', () => {
    const frame = clampFrame({ x: -50, y: 900, w: 40, h: 10 }, stage);
    expect(frame.w / frame.h).toBeCloseTo(1.6, 5);
    expect(frame.h).toBeGreaterThanOrEqual(stage.h * 0.32 - 0.001);
    expect(frame.x).toBe(0);
    expect(frame.y + frame.h).toBeLessThanOrEqual(stage.h);
    expect(moveFrame(frame, 5000, 0, stage).x + frame.w).toBeCloseTo(stage.w, 5);
    expect(scaleFrame(frame, 10, stage).w).toBeLessThanOrEqual(stage.w);
  });

  it('holds eight captures, explains a full tray and undoes one discard', () => {
    const studio = new EchoStudio();
    for (let i = 0; i < MAX_CAPTURES; i++) expect(studio.capture('run-test', { session: live(), glass: glassInput(new GlassSurface(), { x: 0, y: 0, w: 400, h: 250 }) }).ok).toBe(true);
    expect(studio.capture('run-test', { session: live(), glass: glassInput(new GlassSurface(), { x: 0, y: 0, w: 400, h: 250 }) })).toEqual({ ok: false, reason: 'full' });
    studio.discard(3);
    expect(studio.list()).toHaveLength(MAX_CAPTURES - 1);
    expect(studio.undoDiscard()?.id).toBe(3);
    expect(studio.list().map(item => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(studio.undoDiscard()).toBeNull();
  });

  it('round-trips through validation and rejects tampered captures', () => {
    const glass = placedGlass(), studio = new EchoStudio();
    studio.setSource('glass');
    studio.capture('run-test', { session: live(), glass: glassInput(glass, { x: 100, y: 100, w: 400, h: 250 }) });
    const saved = JSON.parse(JSON.stringify(studio.toSaved()));
    expect(parseStudio(saved)).toEqual(saved);
    for (const bad of [
      { ...saved, captures: [{ ...saved.captures[0], negative: { ...saved.captures[0].negative, fog: 'AAAA' } }] },
      { ...saved, captures: [{ ...saved.captures[0], negative: { ...saved.captures[0].negative, kind: 'camera' } }] },
      { ...saved, captures: [{ ...saved.captures[0], run: 'x' }] },
      { ...saved, captures: [saved.captures[0], saved.captures[0]] },
      { ...saved, nextId: 1 },
      null, [],
    ]) expect(parseStudio(bad)).toBeNull();
  });
});
