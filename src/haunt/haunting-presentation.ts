import { CALL_STOPPED, FINAL_LINE, GHOST_LINES, LAST_LINE, NOTE_START, type LegacyEvent, type LegacySnapshot } from './legacy-session';
import { PHASES, phaseIndex, type CasePhase } from './case-phase';
import type { LoadNotice } from './case-save';

/**
 * Plain-language projection of Mara's job for TERMINAL (.kiro/specs/os-case-v4 R3). Every word is derived from the
 * request's snapshot and the case phase, so the job strip, the transcript, the session pane, the tray and help can never
 * disagree. Technical terms stay in typed commands and Under the hood. No DOM access: unit-tested in Node.
 */
export type FigurePose = 'present' | 'reading' | 'writing' | 'shadow' | 'gone';
export type RoomObject = 'note' | 'figure' | 'bell' | 'door';
export type PrimaryIntent = 'observe' | 'resume' | 'detach';
export type Tone = 'banner' | 'system' | 'normal' | 'muted' | 'success' | 'ghost' | 'warning' | 'error' | 'entered';
export type TranscriptLine = readonly [text: string, tone: Tone];

export const GHOST_PREFIX = 'MARA@1987>';
export const times = (count: number): string => count === 1 ? 'once' : count === 2 ? 'twice' : `${count} times`;
export const OBJECTS: readonly RoomObject[] = ['note', 'figure', 'bell', 'door'];
export const OBJECT_TITLES: Readonly<Record<RoomObject, string>> = { note: 'Mara’s note', figure: 'The figure', bell: 'The bell above the way out', door: 'The way out' };
export const OBJECT_CHIPS: Readonly<Record<RoomObject, string>> = { note: 'Note', figure: 'Figure', bell: 'Bell', door: 'Way out' };

const done = (state: LegacySnapshot): boolean => state.presence === 'glass' || state.presence === 'released';

/** Where the figure stands in its session. Changing the bell never moves it; only its own moments do. */
export function figurePose(state: LegacySnapshot): FigurePose {
  if (done(state)) return 'gone';
  if (state.presence === 'shadow') return 'shadow';
  if (state.moment === 'reading') return 'reading';
  if (state.moment === 'writing') return 'writing';
  return 'present';
}

/** The words on the session's screen right now. An event's new line wins while it is the latest event. */
export function whisperText(state: LegacySnapshot, event?: Pick<LegacyEvent, 'line'>): string {
  if (state.presence !== 'terminal') return '';
  if (event?.line) return GHOST_LINES[event.line];
  return state.moment === 'writing' ? NOTE_START : LAST_LINE;
}

/** The recorded minute. It is the session's own time, never the desk's clock, and nobody has to wait for it. */
export function recordedClock(state: LegacySnapshot): { date: string; time: string; ended: boolean } {
  return done(state) ? { date: '1 Nov 1987', time: '00:00:00', ended: true } : { date: '31 Oct 1987', time: '23:59', ended: false };
}

/** What the inspector says when no object is selected: what just happened and why. */
export function sessionNarration(state: LegacySnapshot): string {
  const returns = `It has come back ${times(state.attempts)}.`;
  if (state.presence === 'released') return 'The session is closed. Mara’s letter reached the next person at this desk.';
  if (state.presence === 'glass') {
    return state.lastAction === 'observe' || state.lastAction === 'step' || state.lastAction === 'term'
      ? 'This time nothing called it back. It finished its minute and pressed its hand to the glass, outside this window.'
      : 'The window is empty. Its last impression is on the glass, outside this window.';
  }
  if (state.presence === 'shadow') return 'You forced it out before it could finish. Only a shadow is left, and nothing reached the glass. Undo, or call it back.';
  switch (state.lastAction) {
    case 'retry': return state.retry ? 'You hooked the call back on. The next unfinished minute will start again.' : `${CALL_STOPPED} Nothing will pull it back when this minute ends.`;
    case 'muffle': return state.muffled ? 'You muffled the bell. It will not ring, but the call can still pull the figure back.' : 'You took the cloth off the bell. It can ring again.';
    case 'resume': return `You called it back. ${state.retry ? 'The call is on, so it will repeat.' : 'The call is still stopped. Let it finish this time.'}`;
    case 'term':
    case 'kill': return `You forced it out, but the call pulled it back${state.muffled ? ' without a sound' : ' and the bell rang'}. ${returns}`;
    case 'observe': return `It read the note and started to write: “${NOTE_START}” The minute ended with nothing delivered. ${state.muffled
      ? 'The muffled bell made no sound, but it still started the same minute again.' : 'The bell rang and it started the same minute again.'} ${returns}`;
    default: break;
  }
  switch (state.moment) {
    case 'reading': return 'It unfolds Mara’s note: a job to deliver a picture and this note. The address is on the note.';
    case 'writing': return `It starts to write the note: “${NOTE_START}”`;
    case 'recalled': return `The minute ends with nothing delivered. ${state.muffled ? 'The muffled bell stays silent' : 'The bell rings'}, and it starts the same minute again. ${returns}`;
    default: return state.retry ? 'Mara’s last job is still open. Something keeps trying to finish it, inside the same minute. Watch it try.'
      : 'The call is stopped. Nothing will pull it back at the end of this minute.';
  }
}

/** The single state-changing action the pane's footer offers right now. */
export function primaryAction(state: LegacySnapshot): { intent: PrimaryIntent; label: string } {
  if (done(state)) return { intent: 'detach', label: 'Back to the prompt' };
  if (state.presence === 'shadow') return { intent: 'resume', label: 'Call it back' };
  if (!state.retry) return { intent: 'observe', label: 'Let it finish this time' };
  return { intent: 'observe', label: state.attempts === 0 ? 'Watch it try to finish' : 'Watch it try again' };
}

/** Hint on request: an observation first; the explicit answer only when asked again. */
export function sessionHint(state: LegacySnapshot, explicit: boolean): string {
  if (state.presence === 'released') return 'The job is closed. Your letter stays in POSTMAN’s Guest Inbox.';
  if (state.presence === 'glass') return explicit ? 'Go back to the prompt and move TERMINAL aside: the hand is on the glass behind it. ECHO can capture what is there.'
    : 'Its last impression is on the glass, outside this window. Windows move; the glass does not.';
  if (explicit) {
    if (state.presence === 'shadow') return 'Call it back, then let it finish. Forcing it out never lets it finish.';
    return state.retry ? 'Select the Bell and choose Stop the call. Muffling the bell only silences it.' : 'The call is stopped. Choose Let it finish this time.';
  }
  if (state.presence === 'shadow') return 'Forcing it out left a shadow. It never finished its minute.';
  if (!state.retry) return 'Nothing pulls it back now. What happens if it is allowed to finish?';
  if (state.attempts === 0) return 'Watch it try to finish. What happens at the end of the minute?';
  if (state.muffled) return 'The bell is quiet now, but it still came back. What pulls it back?';
  return 'Every time the minute ends, something rings above the way out. Look at the bell.';
}

export interface ObjectCopy { state: string; quote: string; }
/** What each object in the session is and does right now. Only the bell and the way out have actions. */
export function objectCopy(state: LegacySnapshot): Record<RoomObject, ObjectCopy> & { muffle: string; call: string } {
  const gone = done(state), returns = state.attempts ? ` It has pulled the figure back ${times(state.attempts)}.` : '';
  return {
    note: {
      quote: gone ? '' : `“${NOTE_START}”`,
      state: gone ? 'The figure finished the note once, in the mist on the glass outside this window.'
        : 'The job: deliver a picture and this note. The address is on the note, but the figure never gets past the first words before the minute starts again.',
    },
    figure: {
      quote: whisperText(state) ? `“${whisperText(state)}”` : '',
      state: gone ? 'Gone from this window. Its last impression is on the glass.' : state.presence === 'shadow' ? 'A shadow without a face. It was forced out before its minute ended.'
        : 'It is made of what this session keeps printing. It reads the note, starts to write and tries to finish. Each time, the minute starts again.',
    },
    bell: {
      quote: '',
      state: gone ? `Still. Nothing will ring again.${returns}`
        : !state.retry ? `The cord is unhooked from the job. When this minute ends, nothing will pull it back.${returns}`
          : `A cord runs from the bell to the job. When a minute ends with nothing delivered, the cord pulls the job back to the start${state.muffled
            ? '. The bell is muffled, so it makes no sound.' : ' and the bell rings.'}${returns}`,
    },
    door: {
      quote: '',
      state: gone ? 'It went through, once, and left its impression on the glass.' : state.presence === 'shadow' ? 'Only a shadow is left. Call it back first.'
        : state.retry ? 'The end of the minute. Nothing has been delivered, so the call pulls it back here.' : 'Nothing will pull it back now. If it finishes this minute, it can leave its last impression.',
    },
    muffle: state.muffled ? 'Unmuffle the bell' : 'Muffle the bell',
    call: state.retry ? 'Stop the call' : 'Hook the call back on',
  };
}

/** The job strip: one authoritative line about the request, in the case's phase words. */
export function jobStrip(state: LegacySnapshot): { phase: string; next: string } {
  const info = PHASES[state.casePhase];
  if (state.presence === 'shadow') return { phase: info.label, next: 'A shadow is left in the session. Call it back so it can finish.' };
  if (state.casePhase === 'finished') return { phase: info.label, next: 'The letter arrived. The prompt is yours.' };
  return { phase: info.label, next: `Next: ${info.pending}` };
}

const NOTICES: Readonly<Record<Exclude<LoadNotice, null>, string>> = {
  'migrated-v3': 'This desktop was updated to HAUNT OS 4. The case continues. ECHO’s old prints are kept as limited captures: their picture only, no writing.',
  'migrated-v1': 'This desktop was updated. An ending saved by an older version belongs to an earlier story, so Mara’s job starts open again.',
  corrupt: 'The saved case could not be read, so it starts fresh. Nothing else in this browser was changed.',
};
export const noticeText = (notice: LoadNotice): string | null => notice ? NOTICES[notice] : null;

/** Opening transcript. It depends on the state when TERMINAL starts, so a reopened window tells the truth. */
export function bootLines(state: LegacySnapshot, notice: LoadNotice = null): TranscriptLine[] {
  const lines: TranscriptLine[] = [['HAUNT OS 4 · terminal', 'banner']];
  const note = noticeText(notice);
  if (note) lines.push([note, 'warning']);
  if (state.presence === 'released') lines.push(['Restored 1 session: last.session (closed · delivered to guest)', 'system']);
  else lines.push(['Restored 1 session: last.session (Mara, recorded 31 Oct 1987 23:59)', 'system']);
  if (state.presence === 'glass') lines.push(['last.session finished its minute. Its last impression is on the glass.', 'success']);
  else if (state.presence === 'shadow') lines.push(['A shadow is left in last.session. Look inside to call it back.', 'muted']);
  else if (state.presence === 'terminal') lines.push(['Type help for commands, or choose Look inside.', 'muted']);
  for (const id of state.said) lines.push([`${GHOST_PREFIX} ${GHOST_LINES[id]}`, 'ghost']);
  return lines;
}

/** Lines TERMINAL adds to its own history when the request really changes. Pure: the view appends them once per event. */
export function eventLines(state: LegacySnapshot, event: LegacyEvent, previous: LegacySnapshot): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  if (event.kind === 'phase' || event.kind === 'finish') return lines;
  if (event.kind === 'undo') return [['Undone.', 'muted']];
  if (state.attempts > previous.attempts) lines.push([`↺ last.session started the same minute again${state.muffled ? ' (the bell is muffled)' : ' · the bell rang'} · returns: ${state.attempts}`, 'system']);
  if (event.line) lines.push([`${GHOST_PREFIX} ${GHOST_LINES[event.line]}`, 'ghost']);
  if (event.kind === 'retry') lines.push(state.retry ? ['TERMINAL: The call is hooked on again. An unfinished minute will start over.', 'muted'] : [`TERMINAL: ${CALL_STOPPED}`, 'success']);
  if (event.kind === 'muffle') lines.push([state.muffled ? 'Bell muffled. A return will be silent; the call is unchanged.' : 'Bell unmuffled. Every return rings again.', 'muted']);
  if (state.presence === 'shadow' && previous.presence !== 'shadow') lines.push(['You forced it out before it could finish. A shadow is left; nothing reached the glass.', 'warning']);
  if (event.kind === 'resume') lines.push([state.retry ? 'The shadow is back. The call is on: it will repeat.' : 'The shadow is back. The call is still off: it can finish this time.', 'muted']);
  if (state.presence === 'glass' && previous.presence !== 'glass') lines.push(['last.session finished its minute. Its last impression is on the glass.', 'success'],
    ['Move this window to look. ECHO can capture the glass.', 'muted']);
  return lines;
}

/** The line TERMINAL writes when an incomplete letter replaced the complete one the job relied on (confirmation-flow-v7 R4). */
export const FALL_BACK_LINE = 'TERMINAL: The letter the job relies on was replaced by an incomplete one. No receipt can finish the job until a complete letter arrives.';

/**
 * TERMINAL reports progress made in the other programs, once, when the case's phase moves forward. It moves back in
 * one way only before the end: an incomplete letter replaced the complete one (Start over goes back to Repeating and
 * writes its own lines). `relied` is the delivery the job relies on now.
 */
export function phaseLines(phase: CasePhase, previous: CasePhase, relied: { complete: boolean } | null = null): TranscriptLine[] {
  if (previous === 'ready-to-finish' && phase !== 'repeating' && phase !== 'finished' && relied && !relied.complete) return [[FALL_BACK_LINE, 'warning']];
  if (phaseIndex(phase) <= phaseIndex(previous)) return [];
  switch (phase) {
    case 'capture-retained': return [['TERMINAL: ECHO captured the glass, writing and all. The letter comes next.', 'success']];
    case 'draft-ready': return [['TERMINAL: CANVAS has the letter: the picture and Mara’s words. It still has to be delivered.', 'success']];
    case 'ready-to-finish': return [['TERMINAL: POSTMAN delivered the letter to guest. Its receipt is here.', 'success'], ['Finish the session to close the job.', 'muted']];
    default: return [];
  }
}

/** The closing lines, written once when the job accepts the receipt. */
export const FINISH_LINES: readonly TranscriptLine[] = [
  ['ACK receipt · delivered to guest@haunt, the next person at this desk.', 'system'],
  [`${GHOST_PREFIX} ${FINAL_LINE}`, 'ghost'],
  ['last.session closed. Session finished.', 'success'],
];
