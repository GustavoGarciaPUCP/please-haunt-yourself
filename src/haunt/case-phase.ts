/**
 * The case's phases (.kiro/specs/os-case-v4 requirements §5). One table, used by the job file, the tray, notifications,
 * TERMINAL, help and About, so every surface uses the same words for the same facts. Derived from data, never stored.
 */
export type CasePhase = 'repeating' | 'call-stopped' | 'capture-retained' | 'draft-ready' | 'ready-to-finish' | 'finished';
export const PHASE_ORDER: readonly CasePhase[] = ['repeating', 'call-stopped', 'capture-retained', 'draft-ready', 'ready-to-finish', 'finished'];

export interface PhaseInfo {
  /** The phase name, everywhere. */
  label: string;
  /** What is still pending. */
  pending: string;
  /** The one question this phase asks (help). */
  question: string;
  /** A nudge, on request. */
  hint: string;
  /** The explicit answer, only on a second request. */
  answer: string;
}

export const PHASES: Readonly<Record<CasePhase, PhaseInfo>> = {
  // The pending line states the problem, never its fix: the fix is the answer, given only on request (playability-v5 R4).
  repeating: {
    label: 'Repeating', pending: 'Find out what keeps bringing it back.',
    question: 'What keeps bringing it back?',
    hint: 'Look inside TERMINAL and watch it try to finish. Something rings at the end of every minute.',
    answer: 'Inspect the Bell and choose Stop the call. Muffling the bell only silences it.',
  },
  'call-stopped': {
    label: 'Call stopped · letter pending', pending: 'Capture the impression.',
    question: 'Where did its last impression go?',
    hint: 'Let it finish once. Its last impression lands on the glass behind TERMINAL.',
    answer: 'Move TERMINAL aside, open ECHO, choose Desktop glass and Capture.',
  },
  'capture-retained': {
    label: 'Capture retained', pending: 'A finished letter.',
    question: 'What does the writing say?',
    hint: 'A capture of the glass keeps the writing too. CANVAS can lift it out of the mist.',
    answer: 'In ECHO’s Captures, frame the handprint and choose Use this capture. In CANVAS, choose Lift the writing.',
  },
  'draft-ready': {
    label: 'Letter draft ready', pending: 'A deliberate delivery.',
    question: 'Who is the next person at this desk?',
    hint: 'The note says who it is for. Mara wrote it; she is the sender.',
    answer: 'Choose Compose in POSTMAN and send it to guest: the person at this desk now.',
  },
  'ready-to-finish': {
    label: 'Delivered · ready to finish', pending: 'Finish the session in TERMINAL.',
    question: 'Can the session end now?',
    hint: 'The receipt belongs to the job that started all this.',
    answer: 'Choose Return to the request on the receipt, then Finish session in TERMINAL.',
  },
  finished: {
    label: 'Session finished', pending: 'Nothing. The letter arrived.',
    question: 'The letter arrived.',
    hint: 'Your letter stays in POSTMAN’s Guest Inbox.',
    answer: 'To play again, choose Start the case over… in the HAUNT menu.',
  },
};

export const phaseIndex = (phase: CasePhase): number => PHASE_ORDER.indexOf(phase);
