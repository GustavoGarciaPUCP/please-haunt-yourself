import { isSettled, type LegacySnapshot } from './legacy-session';

export function hauntingNarration(state: LegacySnapshot): string {
  if (isSettled(state)) return state.archive ? 'The presence has gone. The note can stay without calling it back.' : 'The presence has gone. An empty page and a quiet screen remain.';
  if (state.health === 'residue') return 'You forced it away, but its shadow stayed on the screen. Undo, or bring the shadow back for a gentler farewell.';
  if (state.moment === 'memory') return state.archive ? 'The old note opens. A few words are still waiting to be heard.' : 'The note opens to a blank page. The ghost is still here.';
  if (state.moment === 'voice') return state.output ? 'The ghost whispers the old line again. Watch what answers when it tries to leave.' : 'The whisper falls silent. The ghost has not left.';
  if (state.moment === 'return') return state.restart ? 'The bell answers the farewell. The ghost returns to the screen.' : 'No bell answers. You can guide the presence out now.';
  return !state.restart ? 'The bell is quiet. The ghost is waiting for a farewell.' : !state.output ? 'No whisper, but a presence still waits here. What will call it back?' : 'A farewell repeats inside the screen. Watch the next moment to see what brings it back.';
}

export function hauntingHealth(state: LegacySnapshot): string {
  if (isSettled(state)) return 'At peace';
  if (state.health === 'residue') return 'A shadow remains';
  return state.output ? 'A presence is writing' : 'Quiet, still haunted';
}
