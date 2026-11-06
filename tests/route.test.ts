import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { FIGURE, FRAME, GALLERY, initialConfig, MAX_REACH, MAX_SLOPE, MAX_STEP } from '../src/core/constants';
import { frameContacts, project, validateConfiguration } from '../src/core/geometry';
import { hasArrived, planOnSurfaces, tryRoute } from '../src/core/route';
import { beginEdit, commitEdit, finishArrival, finishTrial, newGame, previewEdit, reviewConstruction, startTrial, undo } from '../src/core/state';
import { decodeSave, encodeSave } from '../src/core/persistence';
import type { Configuration, Surface } from '../src/core/types';

const arrangement = (lampX: number, x: number): Configuration => ({ lampX, angle: 0, frame: { x, y: 160, mode: 'placed' } });

describe('documented geometry and actual route', () => {
  it.each([[650, 1010], [700, 985]])('walks the actual construction at lamp %s, frame %s', (lampX, x) => {
    const config = arrangement(lampX, x);
    const result = tryRoute(config);
    expect(result.success).toBe(true);
    expect(result.points.length).toBeGreaterThan(4);
    const last = result.points[result.points.length - 1]!;
    expect(last.support).toBe('gallery');
    expect(hasArrived(last, config)).toBe(true);
    expect(last.x - FIGURE.width / 2).toBeGreaterThan(x + FRAME.width / 2);
    for (let index = 1; index < result.points.length; index++) {
      const a = result.points[index - 1]!, b = result.points[index]!;
      expect(b.x).toBeGreaterThanOrEqual(a.x - 1e-6);
      if (b.transition) {
        expect(b.x - a.x).toBeLessThanOrEqual(MAX_REACH + 1e-6);
        expect(Math.abs(b.y - a.y)).toBeLessThanOrEqual(MAX_STEP + 1e-6);
      } else if (b.x - a.x > 1e-6) expect(Math.abs((b.y - a.y) / (b.x - a.x))).toBeLessThanOrEqual(MAX_SLOPE + 1e-6);
    }
  });

  it('uses signed projection and real 35-versus-10 pad overlaps', () => {
    expect(project({ lampX: 650, angle: 0 })).toEqual([{ x: 150, y: -20 }, { x: 600, y: 160 }, { x: 900, y: 160 }]);
    expect(frameContacts(arrangement(700, 985))).toEqual({ valid: true, left: 35, right: 35 });
    expect(frameContacts(arrangement(740, 970)).left).toBe(10);
    expect(tryRoute(arrangement(740, 970)).failure?.reason).toBe('contact');
    const a = project({ lampX: 650, angle: 23 }), b = project({ lampX: 700, angle: 23 });
    a.forEach((point, index) => { expect(b[index]!.x - point.x).toBeCloseTo(-50); expect(b[index]!.y).toBe(point.y); });
  });

  it('cannot cross without the frame over many allowed configurations', () => {
    fc.assert(fc.property(fc.integer({ min: 500, max: 740 }), fc.integer({ min: 0, max: 900 }), (lampX, tenths) => {
      const config = { ...initialConfig(), lampX, angle: tenths / 10 };
      expect(tryRoute(config, { includeFrame: false }).success).toBe(false);
    }), { numRuns: 400, seed: 20261105 });
  });

  it('cannot cross on the frame alone', () => {
    expect(tryRoute(initialConfig(), { includeShadow: false }).success).toBe(false);
    expect(tryRoute(arrangement(650, 1010), { includeShadow: false }).success).toBe(false);
  });

  it('rejects a continuous steep segment even when marked walkable by a caller', () => {
    const surfaces: Surface[] = [
      { id: 'floor', source: 'floor', a: { x: -250, y: 0 }, b: { x: 220, y: 0 }, walkable: true },
      { id: 'steep', source: 'shadow', a: { x: 220, y: 0 }, b: { x: 1120, y: 1600 }, walkable: true },
      { id: 'gallery', source: 'gallery', a: { x: GALLERY.left, y: GALLERY.y }, b: { x: GALLERY.right, y: GALLERY.y }, walkable: true },
    ];
    expect(planOnSurfaces(surfaces, initialConfig()).success).toBe(false);
  });

  it('leaves the initial floor accessible below the tall one-way shadow', () => {
    const result = tryRoute(initialConfig());
    expect(result.success).toBe(false);
    expect(result.failure?.reason).toBe('slope');
    expect(result.points[result.points.length - 1]).toMatchObject({ x: 220, y: 0, support: 'floor' });
  });
});

describe('world integrity and recovery', () => {
  const preferences = { language: 'en' as const, sound: false, reducedMotion: true };
  it('rejects the entire support-changing edit without consuming history', () => {
    const stable = { ...newGame(preferences), config: arrangement(650, 1010) };
    const pending = previewEdit(beginEdit(stable, 'lamp'), { lampX: 740 });
    const result = commitEdit(pending);
    expect(result.accepted).toBe(false);
    expect(result.state.config).toEqual(stable.config);
    expect(result.state.history).toEqual(stable.history);
    expect(validateConfiguration(result.state.config)).toBe(true);
  });

  it('limits undo to twenty confirmed edits and restores a valid configuration', () => {
    let state = newGame(preferences);
    for (let index = 0; index < 32; index++) state = commitEdit(previewEdit(beginEdit(state, 'lamp'), { lampX: index % 2 ? 600 : 650 })).state;
    expect(state.history).toHaveLength(20);
    state = undo(state);
    expect(state.history).toHaveLength(19);
    expect(validateConfiguration(state.config)).toBe(true);
  });

  it('stores confirmed values rather than a floating preview', () => {
    const state = newGame(preferences);
    const pending = previewEdit(beginEdit(state, 'frame'), { frameX: 800, frameY: 400 });
    expect(validateConfiguration(pending.pending!.config)).toBe(false);
    expect(decodeSave(encodeSave(pending))?.config).toEqual(state.config);
  });

  it('restores an interrupted trial to editing and a saved arrival to final', () => {
    const stable = { ...newGame(preferences), config: arrangement(700, 985) };
    const trial = startTrial(stable);
    expect(decodeSave(encodeSave(trial))?.phase).toBe('editing');
    const arrival = finishTrial(trial);
    expect(arrival.phase).toBe('arrival');
    const restored = decodeSave(encodeSave(arrival));
    expect(restored?.phase).toBe('final');
    const reviewed = reviewConstruction(finishArrival(arrival));
    expect(reviewed.config).toEqual(stable.config);
    expect(reviewed.completed).toBe(true);
    expect(reviewed.phase).toBe('editing');
  });

  it('rejects malformed, unsupported and physically invalid saved data', () => {
    expect(decodeSave('not json')).toBeNull();
    const record = JSON.parse(encodeSave(newGame(preferences)));
    expect(decodeSave(JSON.stringify({ ...record, version: 999 }))).toBeNull();
    expect(decodeSave(JSON.stringify({ ...record, config: arrangement(740, 970) }))).toBeNull();
    expect(tryRoute(null).success).toBe(false);
  });
});
