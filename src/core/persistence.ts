import { cloneConfig, HISTORY_LIMIT } from './constants';
import { validateConfiguration } from './geometry';
import { tryRoute } from './route';
import { newGame } from './state';
import type { GameState, Preferences, SaveRecord } from './types';

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function validPreferences(value: unknown): value is Preferences {
  return object(value) && (value.language === 'en' || value.language === 'es') && typeof value.sound === 'boolean' && typeof value.reducedMotion === 'boolean';
}

export function encodeSave(state: GameState): string {
  const stable = state.pending?.before ?? state.config;
  const record: SaveRecord = {
    version: 1, config: cloneConfig(stable), history: state.history.map(cloneConfig).slice(-HISTORY_LIMIT), preferences: { ...state.preferences },
    completed: state.completed, finalPlan: state.finalPlan ? cloneConfig(state.finalPlan) : null, introSeen: state.introSeen,
    termination: state.phase === 'final' || state.phase === 'arrival' ? 'final' : 'playing',
  };
  return JSON.stringify(record);
}

/** Unknown local data is validated before it can become a playable world. */
export function decodeSave(raw: string): GameState | null {
  try {
    const record: unknown = JSON.parse(raw);
    if (!object(record) || record.version !== 1 || !validateConfiguration(record.config) || !validPreferences(record.preferences)
      || !Array.isArray(record.history) || record.history.length > HISTORY_LIMIT || !record.history.every(validateConfiguration)
      || typeof record.completed !== 'boolean' || typeof record.introSeen !== 'boolean'
      || (record.termination !== 'playing' && record.termination !== 'final')
      || (record.finalPlan !== null && !validateConfiguration(record.finalPlan))) return null;
    if (record.finalPlan !== null && !tryRoute(record.finalPlan).success) return null;
    if (record.termination === 'final' && (!record.completed || !record.finalPlan || !tryRoute(record.config).success)) return null;
    const state = newGame(record.preferences);
    return {
      ...state, phase: record.termination === 'final' ? 'final' : 'editing', config: cloneConfig(record.config),
      history: record.history.map(cloneConfig), completed: record.completed, finalPlan: record.finalPlan ? cloneConfig(record.finalPlan) : null, introSeen: record.introSeen,
    };
  } catch { return null; }
}
