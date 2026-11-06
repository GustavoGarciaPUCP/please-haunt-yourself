import { isSettled, LAST_LINE, type LegacyLink, type LegacySnapshot } from './legacy-session';

/**
 * Plain-language projection of the TERMINAL encounter. Every word, pose and label is derived from the
 * model snapshot, so the shell, the ghost's room and the desktop can never disagree about what happened.
 * No DOM access: these functions are unit-tested in Node.
 */

export type GhostPose = 'present' | 'reading' | 'speaking' | 'leaving' | 'shadow' | 'gone';
export type ShellLineKind = 'writing' | 'hushed' | 'shadow' | 'kept' | 'blank';
export interface ShellPresentation {
  label: string;
  condition: string;
  prefix: string;
  line: string;
  lineKind: ShellLineKind;
  lineSr: string;
  enter: string;
  ghost: 'present' | 'hushed' | 'shadow' | 'gone';
  footer: string;
}
export interface ObjectCopy { state: string; action: string; }

export const times = (count: number): string => count === 1 ? 'once' : count === 2 ? 'twice' : `${count} times`;
const EMPTY_WORDS = '. . .';

/** Short label above the banner. */
export function hauntingHealth(state: LegacySnapshot): string {
  if (isSettled(state)) return 'At peace';
  if (state.health === 'residue') return 'A shadow remains';
  return state.output ? 'A presence is writing' : 'Hushed, still haunted';
}

/** Where the ghost stands in its room. Changing an object never moves it; only its own moments do. */
export function ghostPose(state: LegacySnapshot): GhostPose {
  if (isSettled(state)) return 'gone';
  if (state.health === 'residue') return 'shadow';
  if (state.moment === 'memory') return 'reading';
  if (state.moment === 'voice') return 'speaking';
  if (state.moment === 'threshold') return 'leaving';
  return 'present';
}

/** The bell just answered a departure: a step through END or a farewell attempt while it could ring. */
export const justRang = (state: LegacySnapshot): boolean =>
  state.moment === 'recalled' && (state.lastAction === 'step' || state.lastAction === 'term' || state.lastAction === 'kill');

/** Words the ghost has on the screen. Empty when hushed or when nobody is left to whisper. */
export function whisperText(state: LegacySnapshot): string {
  if (state.health !== 'haunted' || !state.output) return '';
  return state.archive ? LAST_LINE : EMPTY_WORDS;
}

/** One sentence for the room's live region: what just happened and why. */
export function hauntingNarration(state: LegacySnapshot): string {
  if (state.health === 'remembered') return 'It slipped out through the way out. The bell stayed quiet. Mara’s note stays behind as a memory, not a loop.';
  if (state.health === 'blank') return 'It slipped out through the way out. The note had faded, so nothing stays behind. The screen is quiet.';
  if (state.health === 'residue') return 'You forced it out. It is gone, but its shadow is stuck on the screen. Undo, or call the shadow back for a gentler farewell.';
  switch (state.lastAction) {
    case 'output': return state.output ? 'You let it whisper again. Its words return to the screen.' : 'You hushed the whisper. The words stopped, but the ghost is still here. Quiet is not the same as gone.';
    case 'archive': return state.archive ? 'You kept the note. Her words can stay after the ghost leaves.' : 'You let the note fade. Nothing will stay after the ghost leaves. Fading the note does not free it.';
    case 'restart': return state.restart ? 'You let the bell ring again. The next time it tries to leave, the bell will call it back.' : 'You quieted the bell. Nothing will call the ghost back now, but it is still here. It needs a farewell.';
    case 'resume': return 'You called the shadow back. The ghost is whole again, and your choices are kept. Now give it a gentler farewell.';
    case 'term': return `You guided it toward the way out, but the bell rang and called it back. The bell has called it back ${times(state.cycles)}.`;
    case 'kill': return `You forced it out, but the bell rang and dragged it back. The bell has called it back ${times(state.cycles)}.`;
    default: break;
  }
  switch (state.moment) {
    case 'memory': return state.archive ? `The ghost unfolds Mara’s note and reads it again: “${LAST_LINE}”` : 'The ghost unfolds the note. The page is blank, but it keeps reading.';
    case 'voice': return !state.output ? 'Its lips move, but you hushed it. No words reach the screen.' : state.archive ? 'It whispers the note aloud. The words write themselves across the screen.' : 'It whispers, but the note is blank. Only dots reach the screen.';
    case 'recalled': return `It turns toward the way out. The bell rings, and the ghost is pulled back to begin again. The bell has called it back ${times(state.cycles)}.`;
    case 'threshold': return 'It turns toward the way out. The bell stays quiet, so nothing pulls it back. It waits at the edge. You can guide it out now.';
    default: return 'Someone’s last note is still here. The ghost keeps writing it, saying goodbye and coming back. Watch the next moment to see what brings it back.';
  }
}

/** Current state and next action for the note, the whisper and the bell, in the room's left-to-right order. */
export function objectCopy(state: LegacySnapshot): Record<LegacyLink, ObjectCopy> {
  const settled = isSettled(state), present = state.health === 'haunted';
  const rung = state.cycles ? ` It has called the ghost back ${times(state.cycles)}.` : '';
  return {
    archive: {
      state: settled ? state.archive ? 'Kept as a memory. It no longer repeats.' : 'Blank. Nothing was kept.' : state.archive ? 'Kept. Her words will stay after the ghost leaves.' : 'Faded. The page is blank; nothing will stay.',
      action: state.archive ? 'Let the note fade' : 'Keep the note',
    },
    output: {
      state: !present ? settled ? 'Silent. The ghost has gone.' : 'Silent. Only a shadow is left.' : state.output ? 'Speaking. Its words appear on the screen.' : 'Hushed. No words, but the ghost is still here.',
      action: state.output ? 'Hush the whisper' : 'Let it whisper',
    },
    restart: {
      state: settled ? `Quiet for good.${rung}` : state.restart ? `Ready to ring. It calls the ghost back whenever it leaves.${rung}` : `Quiet. Nothing will call the ghost back.${rung}`,
      action: state.restart ? 'Quiet the bell' : 'Let the bell ring',
    },
  };
}

export function interiorHint(state: LegacySnapshot): string {
  if (isSettled(state)) return 'It is over. Go back to the prompt and ask TERMINAL how it is doing.';
  if (state.health === 'residue') return 'Undo, or call the shadow back for a gentler farewell. Nothing here is timed.';
  return 'Nothing here is timed. Change one thing at a time and watch what follows. Undo or go back to the prompt whenever you like.';
}

/** The haunted banner above the normal prompt. */
export function shellPresentation(state: LegacySnapshot): ShellPresentation {
  const label = hauntingHealth(state);
  if (state.health === 'remembered') return { label, condition: 'The ghost has gone. Mara’s note stays as a memory.', prefix: 'Kept note ·', line: `“${LAST_LINE}”`, lineKind: 'kept', lineSr: `Kept note from Mara, 31 October 1987: ${LAST_LINE}`, enter: 'Look inside again', ghost: 'gone', footer: 'At peace · note kept' };
  if (state.health === 'blank') return { label, condition: 'The ghost has gone. The page it left is blank.', prefix: 'The note ·', line: '(a blank page)', lineKind: 'blank', lineSr: 'A blank page. Nothing was kept.', enter: 'Look inside again', ghost: 'gone', footer: 'At peace · page blank' };
  const returns = `returns: ${state.cycles}`;
  if (state.health === 'residue') return { label, condition: 'You forced it out. Its shadow is stuck on the screen.', prefix: '1987 ›', line: '▌ a cursor with no one behind it', lineKind: 'shadow', lineSr: 'A cursor waits with no one behind it.', enter: 'Follow the shadow', ghost: 'shadow', footer: `A shadow remains · ${returns}` };
  const bell = state.restart ? 'the bell can ring' : 'the bell is quiet';
  const footer = `Haunted · ${bell} · ${returns}`;
  if (!state.output) return {
    label, prefix: '1987 ›', line: '(no words)', lineKind: 'hushed', lineSr: 'No words. The ghost is still here.', enter: 'Follow the ghost', ghost: 'hushed', footer,
    condition: state.restart ? 'Its words have stopped, but the ghost is still here. Something still calls it back.' : 'Its words have stopped and the bell is quiet. The ghost is still here, waiting for a farewell.',
  };
  const condition = !state.restart ? 'The bell is quiet, but the ghost is still writing. It is waiting for a farewell.'
    : state.cycles ? `Someone’s last note keeps writing itself. The bell has called it back ${times(state.cycles)}.` : 'Someone’s last note keeps writing itself on this screen.';
  const line = state.archive ? LAST_LINE : EMPTY_WORDS;
  return { label, condition, prefix: '1987 ›', line, lineKind: 'writing', lineSr: state.archive ? `The ghost writes: ${LAST_LINE}` : 'The ghost writes, but the page is empty.', enter: 'Follow the ghost', ghost: 'present', footer };
}

/** Desktop masthead task line. */
export function desktopTask(state: LegacySnapshot): string {
  if (isSettled(state)) return `✓ TERMINAL recovered.\n${state.archive ? 'The ghost left. Its note was kept as a memory.' : 'The ghost left. Its note faded; the page is blank.'}`;
  return 'Recovery task: free the ghost haunting TERMINAL.\nFollow it inside, then come back and ask how TERMINAL is doing.';
}
