import type { ConsoleResult } from './process-session';
import { PHASES, type CasePhase } from './case-phase';

/**
 * Mara's unfinished job (docs/development/23_The_Unsent_Letter_Narrative_Contract.md, .kiro/specs/os-case-v4).
 * One request identity persists through the case; the PID only names the current run of that job.
 * TERMINAL's failed finish while the call (automatic retry) is armed is the only thing that rings the bell.
 * The job closes only through finish(), which the case store calls after validating a real receipt.
 */
export const REQUEST_ID = 'mara-1987-10-31';
export const LAST_LINE = "I'll finish in a minute.";
/** The note exists from the start. TERMINAL never shows it whole: the minute restarts first. */
export const NOTE_LINES = ['FOR THE NEXT PERSON AT THIS DESK', 'This picture is yours.', 'Keep what matters.', '— Mara, 31 October 1987'] as const;
export const NOTE_START = 'FOR THE NEXT PER—';
/** The signature on the note in TERMINAL's session window (and in ECHO's view of it). */
export const NOTE_SIGN = '— Mara, 31 Oct 1987';
export const CALL_STOPPED = 'The call has stopped. The letter is still waiting.';
export const FINAL_LINE = 'You were the next person. You can close the window now.';
export const FIRST_PID = 3087;
const MAX_ATTEMPTS = 999;

export type Presence = 'terminal' | 'shadow' | 'glass' | 'released';
export type CaseMoment = 'waiting' | 'reading' | 'writing' | 'recalled' | 'impressed' | 'forced' | 'released';
/** The latest change, so presentation can attribute each consequence. It never drives the job's behaviour. */
export type LegacyAction = 'step' | 'observe' | 'retry' | 'muffle' | 'term' | 'kill' | 'resume' | 'finish';
export type GhostLineId = 'help' | 'same-minute' | 'cannot-hear' | 'next-person';
export const GHOST_LINES: Readonly<Record<GhostLineId, string>> = {
  help: 'HELP ME.',
  'same-minute': 'I keep starting the same minute.',
  'cannot-hear': "I can't hear it. It still brings me back.",
  'next-person': FINAL_LINE,
};
export const GHOST_LINE_IDS = Object.keys(GHOST_LINES) as GhostLineId[];
/** Monotonic identity of the latest mutation, kept outside the snapshot so Undo can never restore an old event. */
export interface LegacyEvent { id: number; kind: LegacyAction | 'undo' | 'reset' | 'start' | 'phase'; line?: GhostLineId; }

interface Core {
  pid: number | null;
  /** The call: at the end of an undelivered minute, start the same minute again. */
  retry: boolean;
  /** A cloth on the bell's clapper. It silences the ring; it does not stop the call. */
  muffled: boolean;
  phase: 0 | 1 | 2;
  /** Failed finishes that reissued the job. Each one rang the bell once (unless muffled). */
  attempts: number;
  presence: Presence;
  moment: CaseMoment;
  lastAction: LegacyAction | null;
  trace: string;
}
/** `casePhase` is the whole case's phase, derived by the case store; TERMINAL reports it, it never decides it. */
export interface LegacySnapshot extends Core { said: readonly GhostLineId[]; casePhase: CasePhase; }
/** Persisted progress. PID, Undo history, presentation and audio preference are never saved. */
export interface SavedCase { retry: boolean; muffled: boolean; attempts: number; presence: Presence; said: GhostLineId[]; }
export interface LegacyResult extends Omit<ConsoleResult, 'action'> { action?: 'enter-session' | 'finish'; }

function initialCore(): Core {
  return { pid: FIRST_PID, retry: true, muffled: false, phase: 0, attempts: 0, presence: 'terminal', moment: 'waiting', lastAction: null,
    trace: 'A saved job is still open: deliver a picture and a note. At the end of each minute it starts again.' };
}

/** One application-owned request; every UI projection reads the same state. */
export class LegacySession {
  private core: Core = initialCore();
  private nextPid = FIRST_PID + 1;
  private undoStack: Core[] = [];
  private listeners = new Set<() => void>();
  private eventCount = 0;
  private event: LegacyEvent = { id: 0, kind: 'start' };
  private said: GhostLineId[] = [];
  private casePhase: CasePhase = 'repeating';
  private pendingLine: GhostLineId | undefined;

  constructor(saved: SavedCase | null = null) {
    if (saved) this.restore(saved);
  }

  private restore(saved: SavedCase): void {
    const attempts = Math.max(0, Math.min(MAX_ATTEMPTS, Math.floor(saved.attempts)));
    const presence = saved.presence;
    const done = presence === 'glass' || presence === 'released';
    this.core = {
      ...initialCore(),
      pid: presence === 'terminal' ? FIRST_PID + attempts : null,
      retry: done ? false : saved.retry,
      muffled: saved.muffled,
      attempts,
      presence,
      moment: presence === 'released' ? 'released' : presence === 'glass' ? 'impressed' : presence === 'shadow' ? 'forced' : 'waiting',
      trace: presence === 'released' ? 'Restored from this browser. The job was delivered and closed.'
        : presence === 'glass' ? 'Restored from this browser. The run finished its minute; its impression is on the glass.'
          : presence === 'shadow' ? 'Restored from this browser. A shadow remains; the job is still open.'
            : 'Restored from this browser. The job is still open.',
    };
    this.nextPid = FIRST_PID + attempts + 1;
    this.said = GHOST_LINE_IDS.filter(id => saved.said.includes(id));
  }

  toSaved(): SavedCase {
    const { retry, muffled, attempts, presence } = this.core;
    return { retry, muffled, attempts, presence, said: [...this.said] };
  }

  snapshot(): LegacySnapshot { return { ...this.core, said: [...this.said], casePhase: this.casePhase }; }
  lastEvent(): LegacyEvent { return { ...this.event }; }
  canUndo(): boolean { return this.undoStack.length > 0; }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  private notify(kind: LegacyEvent['kind']): void {
    const line = this.pendingLine;
    this.pendingLine = undefined;
    this.event = line ? { id: ++this.eventCount, kind, line } : { id: ++this.eventCount, kind };
    this.listeners.forEach(listener => listener());
  }
  /** Type-checked partial update of the undoable state. */
  private patch(values: Partial<Core>): void { Object.assign(this.core, values); }
  private remember(): void { this.undoStack.push({ ...this.core }); if (this.undoStack.length > 24) this.undoStack.shift(); }

  /** Each authored line is said at most once per run. The muffled line answers the player's own action first. */
  private sayNext(): void {
    const order: GhostLineId[] = this.core.muffled ? ['cannot-hear', 'help', 'same-minute'] : ['help', 'same-minute'];
    const next = order.find(id => !this.said.includes(id));
    if (next) { this.said.push(next); this.pendingLine = next; }
  }

  private recall(trace: (pid: number) => string): void {
    const pid = this.nextPid++;
    this.patch({ attempts: Math.min(MAX_ATTEMPTS, this.core.attempts + 1), pid, phase: 0, moment: 'recalled', trace: trace(pid) });
    this.sayNext();
  }

  /** The milestone: the run finishes its minute once and its last impression reaches the desktop glass. */
  private impress(trace: string): void {
    this.patch({ presence: 'glass', pid: null, phase: 0, moment: 'impressed', retry: false, trace });
  }

  /** The milestone is a commit: the glass and its captures depend on it, so it cannot be undone (replay is explicit). */
  private commitIfImpressed(): void { if (this.core.presence === 'glass') this.undoStack = []; }

  private advance(): void {
    const phase = this.core.phase;
    if (phase === 0) { this.patch({ moment: 'reading', phase: 1, trace: 'READ job → deliver a picture and a note. The address is on the note.' }); return; }
    if (phase === 1) { this.patch({ moment: 'writing', phase: 2, trace: `WRITE note → “${NOTE_START}” The minute is almost over.` }); return; }
    if (this.core.retry) this.recall(pid => `FINISH → no delivery confirmed → RETRY. The same minute starts again as PID ${pid}.`);
    else this.impress('FINISH → no delivery confirmed, no retry. The run finishes its minute; its last impression reaches the glass.');
  }

  step(): void {
    if (this.core.presence !== 'terminal') return;
    this.remember();
    this.advance();
    this.core.lastAction = 'step';
    this.commitIfImpressed();
    this.notify('step');
  }

  /** One complete attempt to finish: the same transitions as step() until it is called back or reaches the glass, as one Undo step. */
  observe(): void {
    if (this.core.presence !== 'terminal') return;
    this.remember();
    do this.advance(); while (this.core.moment !== 'recalled' && this.core.moment !== 'impressed');
    this.core.lastAction = 'observe';
    this.commitIfImpressed();
    this.notify('observe');
  }

  private get settledOnGlass(): boolean { return this.core.presence === 'glass' || this.core.presence === 'released'; }

  toggleRetry(): void {
    if (this.settledOnGlass) return;
    this.remember();
    this.core.retry = !this.core.retry;
    this.core.lastAction = 'retry';
    this.core.trace = this.core.retry ? 'RETRY armed. The next undelivered minute will start again.' : `RETRY off. ${CALL_STOPPED}`;
    this.notify('retry');
  }

  toggleMuffle(): void {
    if (this.settledOnGlass) return;
    this.remember();
    this.core.muffled = !this.core.muffled;
    this.core.lastAction = 'muffle';
    this.core.trace = this.core.muffled ? 'Bell muffled. A retry will be silent; the call is unchanged.' : 'Bell unmuffled. Every retry rings again.';
    this.notify('muffle');
  }

  /** TERM ends the current minute now; KILL skips its end. Only the current run of last.session accepts signals. */
  terminate(forced = false): LegacyResult {
    if (this.core.presence === 'released') return { tone: 'warning', lines: ['last.session is closed. Its letter was delivered.'] };
    if (this.core.presence === 'glass') return { tone: 'warning', lines: ['last.session already finished its minute. Its last impression is on the glass.'] };
    if (this.core.pid === null) return { tone: 'warning', lines: ['Only a shadow remains. Call it back before signalling it.'] };
    this.remember();
    const old = this.core.pid, signal = forced ? 'KILL' : 'TERM';
    this.core.lastAction = forced ? 'kill' : 'term';
    if (this.core.retry) {
      this.recall(pid => `${signal} ${old} → no delivery confirmed → RETRY → PID ${pid}. Stopping the run did not stop the call.`);
      this.notify(forced ? 'kill' : 'term');
      return { tone: 'warning', lines: [this.core.trace] };
    }
    if (forced) {
      this.patch({ presence: 'shadow', pid: null, phase: 0, moment: 'forced',
        trace: 'KILL skipped the end of the minute. Nothing reached the glass; a shadow remains on the screen.' });
      this.notify('kill');
      return { tone: 'warning', lines: [this.core.trace, 'Call the shadow back to let it finish.'] };
    }
    this.impress(`TERM ${old} → the run finishes its minute without a retry. Its last impression reaches the glass.`);
    this.commitIfImpressed();
    this.notify('term');
    return { tone: 'success', lines: [this.core.trace] };
  }

  resumeResidue(): void {
    if (this.core.presence !== 'shadow') return;
    this.remember();
    const pid = this.nextPid++;
    this.patch({ presence: 'terminal', pid, phase: 0, moment: 'waiting', lastAction: 'resume',
      trace: `The shadow is back as PID ${pid}. ${this.core.retry ? 'The call is on: it will repeat.' : 'The call is still off: it can finish this time.'}` });
    this.notify('resume');
  }

  /**
   * Closes the job. Only the case store calls this, after validating a real receipt for this run. It writes the final
   * line once and cannot be undone; replay is a new run.
   */
  finish(): boolean {
    if (this.core.presence !== 'glass') return false;
    this.patch({ presence: 'released', moment: 'released', lastAction: 'finish', trace: 'ACK receipt → delivered to guest, the next person at this desk. The job is closed.' });
    this.undoStack = [];
    if (!this.said.includes('next-person')) { this.said.push('next-person'); this.pendingLine = 'next-person'; }
    this.notify('finish');
    return true;
  }

  undo(): void { const previous = this.undoStack.pop(); if (previous) { this.core = previous; this.notify('undo'); } }

  /** Explicit replay: the whole request starts over (a new run). The case store clears everything else. */
  reset(): void {
    this.core = initialCore();
    this.nextPid = FIRST_PID + 1;
    this.undoStack = [];
    this.said = [];
    this.casePhase = 'repeating';
    this.notify('reset');
  }

  /** The case store reports the whole case's phase, so TERMINAL's words match every other surface. */
  setCasePhase(phase: CasePhase): void {
    if (phase === this.casePhase) return;
    this.casePhase = phase;
    this.notify('phase');
  }

  /** Conversation answers come from the actual state, never from the last button pressed. */
  status(): string[] {
    const { presence, retry, muffled } = this.core;
    if (presence === 'released') return ['TERMINAL: Session finished. The letter arrived.', 'You were the next person at this desk. The prompt is yours.'];
    if (presence === 'glass') {
      switch (this.casePhase) {
        case 'ready-to-finish': return ['TERMINAL: The letter was delivered. Its receipt is here.', 'Finish the session to close the job.'];
        case 'draft-ready': return ['TERMINAL: The letter is ready in CANVAS.', 'It still has to be delivered. The address is on the note.'];
        case 'capture-retained': return ['TERMINAL: ECHO has a capture of the glass, with the writing.', 'The letter still has to be finished and delivered.'];
        default: return ['TERMINAL: The window is empty now. Its last impression is on the glass.', 'The letter is still waiting. ECHO can capture the glass.'];
      }
    }
    if (presence === 'shadow') return ['TERMINAL: You forced it out before it could finish. Its shadow is still on my screen.', 'Call the shadow back, or undo your last action.'];
    if (!retry) return [`TERMINAL: ${CALL_STOPPED}`, 'Nothing will pull it back now. It can finish this minute.'];
    if (muffled) return ['TERMINAL: The bell is muffled, but the call still brings it back.', 'Quiet is not the same as stopped.'];
    return ['TERMINAL: Not yet. Every time it tries to finish, something pulls it back to the start of the same minute.', 'Someone left a job here: a picture and a note. The address is on the note.'];
  }

  /** One line about where the job stands, for jobs and the shell. Same words as every other surface. */
  progress(): string {
    if (this.core.presence === 'shadow') return `${PHASES[this.casePhase].label} · forced out before the end of the minute`;
    return `${PHASES[this.casePhase].label} · next: ${PHASES[this.casePhase].pending.replace(/\.$/, '').toLowerCase()}`;
  }

  private ps(): string[] {
    const { presence, pid, retry, attempts } = this.core;
    const row = (id: string, state: string, name: string, note: string) => `${id.padEnd(6)}${state.padEnd(11)}${name.padEnd(15)}${note}`;
    const session = presence === 'terminal' ? row(String(pid), retry ? 'repeating' : 'finishing', 'last.session', 'Mara · 31 Oct 1987')
      : presence === 'shadow' ? row('---', 'stopped', 'last.session', 'a shadow remains (forced out)')
        : presence === 'released' ? row('---', 'closed', 'last.session', 'delivered to guest')
          : row('---', 'finished', 'last.session', 'its last impression is on the glass');
    return [row('PID', 'STATE', 'NAME', 'NOTE'), session, row('---', 'read-only', 'echo.link', 'ECHO’s live view; not a process'), '',
      `Retry: ${retry ? 'on' : 'off'}. Returns: ${attempts}. Only last.session accepts signals.`];
  }

  private jobRecord(): string[] {
    const ending = this.core.presence === 'released' ? 'Delivered to the next person at this desk. Session finished.'
      : this.core.presence === 'glass' ? 'The note was finished once, in the mist on the glass.'
        : this.core.presence === 'shadow' ? 'Forced out before the end of the minute. The note is still unfinished.'
          : `The note was never finished here. Each minute it starts again: “${NOTE_START}”`;
    return ['31 OCT 1987 · MARA · last job', 'Deliver a picture and a note. The address is on the note.', `Status: “${LAST_LINE}”`, ending];
  }

  execute(command: string): LegacyResult | null {
    const trimmed = command.trim();
    if (trimmed.length > 200 || /[;&|`<>\n\r]/.test(trimmed)) return null;
    const { presence, pid, retry, muffled, attempts } = this.core;
    if (/^enter (last\.session|\d+)$/.test(trimmed)) {
      const target = trimmed.slice(6);
      if (target !== 'last.session' && target !== String(pid)) return { tone: 'error', lines: ['That PID is not the current run. Use enter last.session.'] };
      return { tone: 'normal', lines: ['Entering the terminal’s own session.'], action: 'enter-session' };
    }
    if (/^(finish|jobs finish)$/.test(trimmed)) return { tone: 'normal', lines: [], action: 'finish' };
    if (/^ask (status|are you (okay|ok|better)\??|how are you\??)$/i.test(trimmed)) return { tone: presence === 'glass' || presence === 'released' ? 'success' : 'warning', lines: this.status() };
    if (/^ask (who was here|what happened|who is mara)\??$/i.test(trimmed)) return { tone: 'normal', lines: ['TERMINAL: Mara. Her last session, on Halloween night, 31 October 1987.',
      'Her last job was a picture and a note for someone. The address is on the note.', 'I do not know what happened after she left.'] };
    if (trimmed.startsWith('ask ')) return { tone: 'normal', lines: ['Try ask status, ask are you okay, or ask who was here. These are local conversation prompts.'] };
    if (trimmed === 'cat last-session' || trimmed === 'cat note' || trimmed === 'cat last.job') return { tone: 'normal', lines: this.jobRecord() };
    if (trimmed === 'jobs') return { tone: 'normal', lines: ['JOB 1  deliver a picture and a note · to: the address is on the note',
      `       retry ${retry ? 'on' : 'off'}${muffled ? ' (bell muffled)' : ''} · returns ${attempts}`, `       ${this.progress()}`] };
    if (trimmed === 'ps') return { tone: 'normal', lines: this.ps() };
    if (trimmed === 'inspect last.session' || (pid !== null && trimmed === `inspect ${pid}`)) return { tone: 'normal', lines: [
      `last.session [${pid ?? 'no run'}] / ${presence}`,
      'job: deliver picture + note → the address on the note',
      `on_finish without a receipt → ${retry ? 'RETRY last.session (the call)' : 'no retry: the call is off'}`,
      `bell: ${muffled ? 'muffled' : 'rings on every retry'}. The bell only reports a retry; the call is what restarts the minute.`,
    ] };
    if (trimmed === 'inspect echo.link') return { tone: 'normal', lines: ['echo.link — ECHO’s live view of this session.', 'It only watches. It cannot finish, retry or stop the job.'] };
    if (trimmed === 'echo' || trimmed.startsWith('echo ')) {
      const ghost = presence === 'terminal' ? [`MARA@1987> ${LAST_LINE}`] : presence === 'shadow' ? ['[an unfinished caret still owns this prompt]'] : [];
      return { tone: 'normal', lines: [trimmed.slice(5), ...ghost] };
    }
    const signal = /^kill (?:(-TERM|-15|-KILL|-9) )?(\S+)$/.exec(trimmed);
    if (signal) {
      const target = signal[2]!;
      if (target === 'echo.link') return { tone: 'error', lines: ['echo.link is ECHO’s read-only view, not a process you can stop.'] };
      if (!/^\d+$/.test(target)) return { tone: 'error', lines: ['Usage: kill [-TERM|-KILL] <PID>. Run ps to see the current run.'] };
      const n = Number(target);
      if (pid !== null && n === pid) return this.terminate(signal[1] === '-KILL' || signal[1] === '-9');
      if (n >= FIRST_PID && n < this.nextPid) return { tone: 'error', lines: ['That PID belonged to an earlier minute. ps lists the current run.'] };
      return { tone: 'error', lines: [`No process ${target}. Only last.session accepts signals here.`] };
    }
    return null;
  }
}
