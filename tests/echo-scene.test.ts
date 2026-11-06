import { describe, expect, it } from 'vitest';
import { SCENE_CONFIG, clampPosition, createScene, isValidPosition, setPropPosition, validateCoverage,
  startPerformance, pausePerformance, resumePerformance, returnToEditing, setHostReaction, moveProp } from '../src/haunt/echo-scene';

describe('ECHO stage geometry', () => {
  it('starts with a reachable prop inside the board and a clear public stage', () => {
    const scene = createScene();
    expect(isValidPosition(scene.propPosition, SCENE_CONFIG)).toBe(true);
    expect(validateCoverage(scene, SCENE_CONFIG)).toEqual({ privateFullyCovered: false, publicOverlap: false, ready: false });
  });

  it('admits a real placement that hides the private image without touching public footage', () => {
    const scene = createScene();
    let validPlacements = 0;
    for (let y = 0; y <= SCENE_CONFIG.board.height - SCENE_CONFIG.propSize.height; y += 10) {
      for (let x = 0; x <= SCENE_CONFIG.board.width - SCENE_CONFIG.propSize.width; x += 10) {
        if (validateCoverage(setPropPosition(scene, { x, y }, SCENE_CONFIG), SCENE_CONFIG).ready) validPlacements++;
      }
    }
    expect(validPlacements).toBeGreaterThan(0);
  });

  it('rejects a one-unit exposed private edge instead of accepting approximate coverage', () => {
    const view = SCENE_CONFIG.privateView;
    const exact = setPropPosition(createScene(), { x: view.x, y: view.y }, SCENE_CONFIG);
    expect(validateCoverage(exact, SCENE_CONFIG).ready).toBe(true);
    const gap = setPropPosition(exact, { x: view.x + 1, y: view.y }, SCENE_CONFIG);
    expect(validateCoverage(gap, SCENE_CONFIG).privateFullyCovered).toBe(false);
    expect(validateCoverage(gap, SCENE_CONFIG).ready).toBe(false);
  });

  it('reports public obstruction separately from camera privacy', () => {
    const stage = SCENE_CONFIG.publicStage;
    const obstructed = setPropPosition(createScene(), { x: stage.x, y: stage.y }, SCENE_CONFIG);
    expect(validateCoverage(obstructed, SCENE_CONFIG).publicOverlap).toBe(true);
    expect(validateCoverage(obstructed, SCENE_CONFIG).ready).toBe(false);
  });

  it('keeps even large pointer/keyboard deltas within the board', () => {
    for (const x of [-10000, 0, 200, 10000]) {
      for (const y of [-10000, 0, 200, 10000]) {
        expect(isValidPosition(clampPosition({ x, y }, SCENE_CONFIG), SCENE_CONFIG)).toBe(true);
      }
    }
  });
});

describe('ECHO edit and interruption boundaries', () => {
  it('freezes scenery and the chosen reaction during a take and its pause', () => {
    const editing = setHostReaction(createScene(), 'scare');
    for (const scene of [startPerformance(editing), pausePerformance(startPerformance(editing))]) {
      expect(moveProp(scene, { dx: 100, dy: -100 }, SCENE_CONFIG)).toBe(scene);
      expect(setPropPosition(scene, { x: 440, y: 60 }, SCENE_CONFIG)).toBe(scene);
      expect(setHostReaction(scene, 'collapse')).toBe(scene);
    }
  });

  it('invalidates callbacks on pause and resume, without discarding an authored set', () => {
    const edited = setHostReaction(setPropPosition(createScene(), { x: 440, y: 60 }, SCENE_CONFIG), 'scare');
    const active = startPerformance(edited);
    const paused = pausePerformance(active);
    const resumed = resumePerformance(paused);
    expect(paused.runGeneration).toBeGreaterThan(active.runGeneration);
    expect(resumed.runGeneration).toBeGreaterThan(paused.runGeneration);
    const back = returnToEditing(resumed);
    expect(back.runGeneration).toBeGreaterThan(resumed.runGeneration);
    expect(back.propPosition).toEqual(edited.propPosition);
    expect(back.hostReaction).toBe('scare');
    expect(back.state).toBe('editing');
  });
});
