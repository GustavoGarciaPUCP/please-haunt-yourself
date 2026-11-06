import { cloneConfig, FRAME, HISTORY_LIMIT, initialConfig, LAMP } from './constants';
import { frameContacts, settleFrame, validateConfiguration } from './geometry';
import { hasArrived, tryRoute } from './route';
import type { Configuration, EditKind, EditPatch, GameState, Preferences } from './types';

export function newGame(preferences: Preferences): GameState {
  return { phase: 'editing', config: initialConfig(), pending: null, history: [], preferences: { ...preferences }, completed: false, finalPlan: null, introSeen: false, route: null, failure: null };
}

export function beginEdit(state: GameState, kind: EditKind): GameState {
  if (!['editing', 'failed', 'tentative'].includes(state.phase)) return state;
  const stable = cancelEdit(state);
  return { ...stable, phase: 'tentative', failure: null, pending: { kind, before: cloneConfig(stable.config), config: cloneConfig(stable.config) } };
}

export function previewEdit(state: GameState, patch: EditPatch): GameState {
  if (!state.pending || state.phase !== 'tentative') return state;
  const config = cloneConfig(state.pending.config);
  if (state.pending.kind === 'lamp' && patch.lampX !== undefined && Number.isFinite(patch.lampX)) config.lampX = Math.max(LAMP.min, Math.min(LAMP.max, patch.lampX));
  if (state.pending.kind === 'cutout' && patch.angle !== undefined && Number.isFinite(patch.angle)) config.angle = Math.max(0, Math.min(90, patch.angle));
  if (state.pending.kind === 'frame') {
    const x = patch.frameX ?? config.frame.x, y = patch.frameY ?? config.frame.y;
    if (Number.isFinite(x) && Number.isFinite(y)) config.frame = settleFrame(config, x, y);
  }
  return { ...state, pending: { ...state.pending, config } };
}

export function cancelEdit(state: GameState): GameState {
  if (!state.pending) return state;
  return { ...state, phase: 'editing', config: cloneConfig(state.pending.before), pending: null };
}

export function commitEdit(state: GameState): { state: GameState; accepted: boolean; changed: boolean } {
  if (!state.pending || state.phase !== 'tentative') return { state, accepted: false, changed: false };
  const { before, config } = state.pending;
  const contacts = frameContacts(config);
  const rejectedPoint = { x: config.frame.x + (contacts.left < FRAME.minContact ? -FRAME.width / 2 + FRAME.padWidth / 2 : FRAME.width / 2 - FRAME.padWidth / 2), y: config.frame.y };
  if (!validateConfiguration(config)) return { state: { ...cancelEdit(state), failure: { reason: 'contact', point: rejectedPoint } }, accepted: false, changed: false };
  const changed = JSON.stringify(before) !== JSON.stringify(config);
  return { state: { ...state, phase: 'editing', config: cloneConfig(config), pending: null, failure: null, route: null, history: changed ? [...state.history, cloneConfig(before)].slice(-HISTORY_LIMIT) : state.history }, accepted: true, changed };
}

export function returnFrameHome(state: GameState): GameState {
  const stable = cancelEdit(state);
  if (!['editing', 'failed'].includes(stable.phase)) return stable;
  const config: Configuration = { ...cloneConfig(stable.config), frame: { ...initialConfig().frame } };
  return commitEdit({ ...stable, phase: 'tentative', pending: { kind: 'frame', before: cloneConfig(stable.config), config } }).state;
}

export function undo(state: GameState): GameState {
  if (!['editing', 'failed'].includes(state.phase) || !state.history.length) return state;
  const prior = state.history[state.history.length - 1]!;
  if (!validateConfiguration(prior)) return state;
  return { ...state, phase: 'editing', config: cloneConfig(prior), history: state.history.slice(0, -1), pending: null, failure: null, route: null };
}

export function startTrial(state: GameState): GameState {
  if (!['editing', 'failed'].includes(state.phase)) return state;
  return { ...state, phase: 'trial', route: tryRoute(state.config), failure: null, pending: null };
}
export const pauseTrial = (state: GameState): GameState => state.phase === 'trial' ? { ...state, phase: 'paused' } : state;
export const resumeTrial = (state: GameState): GameState => state.phase === 'paused' ? { ...state, phase: 'trial' } : state;
export const stopTrial = (state: GameState): GameState => ['trial', 'paused'].includes(state.phase) ? { ...state, phase: 'editing', route: null, failure: null } : state;

export function finishTrial(state: GameState): GameState {
  if (state.phase !== 'trial' || !state.route) return state;
  const last = state.route.points[state.route.points.length - 1];
  if (!state.route.success || !last || !hasArrived(last, state.config)) return { ...state, phase: 'editing', failure: state.route.failure ?? { reason: 'gap', point: last ?? { x: 170, y: 0 } }, route: null };
  return { ...state, phase: 'arrival', completed: true, finalPlan: cloneConfig(state.config), pending: null, failure: null };
}

export const finishArrival = (state: GameState): GameState => state.phase === 'arrival' ? { ...state, phase: 'final', route: null } : state;
export function reviewConstruction(state: GameState): GameState {
  if (state.phase !== 'final' || !state.finalPlan || !validateConfiguration(state.finalPlan)) return state;
  return { ...state, phase: 'editing', config: cloneConfig(state.finalPlan), pending: null, route: null, failure: null };
}
