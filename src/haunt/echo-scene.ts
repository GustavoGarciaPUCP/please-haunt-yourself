/**
 * ECHO-01 Rehearsal Scene Logic
 * Geometry, state transitions, coverage validation
 */

export type SceneState = 'editing' | 'performing' | 'paused' | 'complete' | 'failed' | 'left';
export type HostReaction = 'collapse' | 'scare';

export interface Board {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PropPosition {
  x: number;
  y: number;
}

export interface SceneConfig {
  board: Board;
  publicStage: Rect;
  privateView: Rect;
  propSize: { width: number; height: number };
}

export interface SceneInstance {
  state: SceneState;
  hostReaction: HostReaction;
  propPosition: PropPosition;
  runGeneration: number;
}

export interface CoverageResult {
  privateFullyCovered: boolean;
  publicOverlap: boolean;
  ready: boolean;
}

// Scene geometry constants
export const SCENE_CONFIG: SceneConfig = {
  board: { width: 640, height: 410 },
  publicStage: { x: 20, y: 70, width: 380, height: 260 },
  privateView: { x: 450, y: 70, width: 160, height: 110 },
  propSize: { width: 180, height: 140 }
};

/**
 * Create initial scene state
 */
export function createScene(): SceneInstance {
  return {
    state: 'editing',
    hostReaction: 'collapse',
    propPosition: { x: 430, y: 240 }, // Inside the board, outside both views
    runGeneration: 0
  };
}

/**
 * Check if prop position is valid (within board bounds)
 */
export function isValidPosition(pos: PropPosition, config: SceneConfig): boolean {
  return (
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x + config.propSize.width <= config.board.width &&
    pos.y + config.propSize.height <= config.board.height
  );
}

/**
 * Clamp prop position to board bounds
 */
export function clampPosition(pos: PropPosition, config: SceneConfig): PropPosition {
  return {
    x: Math.max(0, Math.min(pos.x, config.board.width - config.propSize.width)),
    y: Math.max(0, Math.min(pos.y, config.board.height - config.propSize.height))
  };
}

/**
 * Calculate coverage of target rectangle by prop
 */
function rectangleOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function rectangleContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Validate coverage requirements
 */
export function validateCoverage(scene: SceneInstance, config: SceneConfig): CoverageResult {
  const propRect: Rect = {
    x: scene.propPosition.x,
    y: scene.propPosition.y,
    width: config.propSize.width,
    height: config.propSize.height
  };

  const privateFullyCovered = rectangleContains(propRect, config.privateView);
  const publicOverlap = rectangleOverlap(propRect, config.publicStage);
  const ready = privateFullyCovered && !publicOverlap;

  return { privateFullyCovered, publicOverlap, ready };
}

/**
 * Move prop by delta, clamped to bounds
 */
export function moveProp(
  scene: SceneInstance,
  delta: { dx: number; dy: number },
  config: SceneConfig
): SceneInstance {
  if (scene.state !== 'editing') return scene;
  const newPos = {
    x: scene.propPosition.x + delta.dx,
    y: scene.propPosition.y + delta.dy
  };

  return {
    ...scene,
    propPosition: clampPosition(newPos, config)
  };
}

/**
 * Set prop position (from drag/click), clamped to bounds
 */
export function setPropPosition(
  scene: SceneInstance,
  pos: PropPosition,
  config: SceneConfig
): SceneInstance {
  if (scene.state !== 'editing') return scene;
  return {
    ...scene,
    propPosition: clampPosition(pos, config)
  };
}

/**
 * Start performance run
 */
export function startPerformance(scene: SceneInstance): SceneInstance {
  return {
    ...scene,
    state: 'performing',
    runGeneration: scene.runGeneration + 1
  };
}

/**
 * Pause performance
 */
export function pausePerformance(scene: SceneInstance): SceneInstance {
  if (scene.state !== 'performing') return scene;
  return { ...scene, state: 'paused', runGeneration: scene.runGeneration + 1 };
}

/**
 * Resume performance
 */
export function resumePerformance(scene: SceneInstance): SceneInstance {
  if (scene.state !== 'paused') return scene;
  return {
    ...scene,
    state: 'performing',
    runGeneration: scene.runGeneration + 1
  };
}

/**
 * Complete performance
 */
export function completePerformance(scene: SceneInstance): SceneInstance {
  return { ...scene, state: 'complete' };
}

/**
 * Fail performance (coverage invalidated mid-run, etc.)
 */
export function failPerformance(scene: SceneInstance): SceneInstance {
  return { ...scene, state: 'failed' };
}

/**
 * Return to editing (resets transient state, preserves prop position)
 */
export function returnToEditing(scene: SceneInstance): SceneInstance {
  return {
    ...scene,
    state: 'editing',
    runGeneration: scene.runGeneration + 1
  };
}

/**
 * Set host reaction
 */
export function setHostReaction(scene: SceneInstance, reaction: HostReaction): SceneInstance {
  if (scene.state !== 'editing') return scene;
  return { ...scene, hostReaction: reaction };
}
