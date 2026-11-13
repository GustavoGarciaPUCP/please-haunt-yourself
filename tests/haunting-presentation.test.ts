import { describe, expect, it } from 'vitest';
import { CALL_STOPPED, FINAL_LINE, LAST_LINE, LegacySession, NOTE_START, type LegacySnapshot } from '../src/haunt/legacy-session';
import {
  FINISH_LINES, OBJECTS, bootLines, eventLines, figurePose, jobStrip, objectCopy, phaseLines, primaryAction, recordedClock, sessionHint, sessionNarration, whisperText,
} from '../src/haunt/haunting-presentation';
import { PHASES } from '../src/haunt/case-phase';

const TECHNICAL = /\b(PID|stdout|BASIC|TERM|KILL|SIGTERM|callback|on_exit|on_finish|RETRY)\b/;
/** Default surfaces a non-programmer reads. Under the hood and typed commands are allowed to be technical. */
const surfaces = (state: LegacySnapshot): string[] => {
  const copy = objectCopy(state), strip = jobStrip(state);
  return [sessionNarration(state), sessionHint(state, false), sessionHint(state, true), primaryAction(state).label, strip.phase, strip.next, copy.muffle, copy.call,
    ...OBJECTS.flatMap(object => [copy[object].state, copy[object].quote]), ...bootLines(state).map(([text]) => text)];
};
const journey = (): LegacySnapshot[] => {
  const session = new LegacySession(), states = [session.snapshot()];
  session.observe(); states.push(session.snapshot());
  session.toggleMuffle(); session.observe(); states.push(session.snapshot());
  session.toggleRetry(); session.setCasePhase('call-stopped'); states.push(session.snapshot());
  session.terminate(true); states.push(session.snapshot());
  session.resumeResidue(); states.push(session.snapshot());
  session.observe(); states.push(session.snapshot());
  session.setCasePhase('capture-retained'); states.push(session.snapshot());
  return states;
};

describe('TERMINAL v4 presentation', () => {
  it('offers exactly one contextual primary action at every stage of the job', () => {
    const session = new LegacySession();
    expect(primaryAction(session.snapshot())).toEqual({ intent: 'observe', label: 'Watch it try to finish' });
    session.observe();
    expect(primaryAction(session.snapshot())).toEqual({ intent: 'observe', label: 'Watch it try again' });
    session.toggleRetry();
    expect(primaryAction(session.snapshot())).toEqual({ intent: 'observe', label: 'Let it finish this time' });
    session.terminate(true);
    expect(primaryAction(session.snapshot())).toEqual({ intent: 'resume', label: 'Call it back' });
    session.resumeResidue(); session.observe();
    expect(primaryAction(session.snapshot())).toEqual({ intent: 'detach', label: 'Back to the prompt' });
  });

  it('names the call as the cause and the bell only as its sound', () => {
    const session = new LegacySession();
    session.observe();
    expect(sessionNarration(session.snapshot())).toMatch(new RegExp(`${NOTE_START}.*nothing delivered.*bell rang.*same minute again.*once`));
    session.toggleMuffle(); session.observe();
    expect(sessionNarration(session.snapshot())).toMatch(/muffled bell made no sound, but it still started the same minute again.*twice/);
    expect(objectCopy(session.snapshot()).bell.state).toMatch(/cord pulls the job back.*muffled, so it makes no sound/);
    session.toggleRetry();
    expect(sessionNarration(session.snapshot())).toContain(CALL_STOPPED);
    expect(objectCopy(session.snapshot()).bell.state).toMatch(/unhooked/);
    expect(objectCopy(session.snapshot()).call).toBe('Hook the call back on');
  });

  it('hints teach observation first; the explicit answer only when asked, and it distinguishes muffling from stopping', () => {
    const session = new LegacySession();
    expect(sessionHint(session.snapshot(), false)).toMatch(/end of the minute/);
    session.observe();
    expect(sessionHint(session.snapshot(), false)).not.toMatch(/stop the call/i);
    expect(sessionHint(session.snapshot(), false)).toMatch(/rings above the way out/);
    expect(sessionHint(session.snapshot(), true)).toMatch(/Stop the call\. Muffling the bell only silences it/);
    session.toggleRetry(); session.observe();
    expect(sessionHint(session.snapshot(), true)).toMatch(/move TERMINAL aside.*ECHO/);
  });

  it('the job strip uses the case’s phase words, the same table as the tray and help', () => {
    const session = new LegacySession();
    expect(jobStrip(session.snapshot())).toEqual({ phase: PHASES.repeating.label, next: `Next: ${PHASES.repeating.pending}` });
    session.toggleRetry(); session.setCasePhase('call-stopped');
    expect(jobStrip(session.snapshot()).phase).toBe('Call stopped · letter pending');
    session.observe(); session.setCasePhase('ready-to-finish');
    expect(jobStrip(session.snapshot())).toEqual({ phase: 'Delivered · ready to finish', next: 'Next: Finish the session in TERMINAL.' });
    session.finish(); session.setCasePhase('finished');
    expect(jobStrip(session.snapshot()).phase).toBe('Session finished');
  });

  it('poses, whispers and the recorded clock follow the session’s own moments', () => {
    const session = new LegacySession();
    expect(recordedClock(session.snapshot())).toEqual({ date: '31 Oct 1987', time: '23:59', ended: false });
    session.step();
    expect(figurePose(session.snapshot())).toBe('reading');
    session.step();
    expect(figurePose(session.snapshot())).toBe('writing');
    expect(whisperText(session.snapshot())).toBe(NOTE_START);
    session.step();
    expect(whisperText(session.snapshot(), session.lastEvent())).toBe('HELP ME.');
    expect(whisperText(session.snapshot())).toBe(LAST_LINE);
    session.toggleRetry(); session.observe();
    expect(figurePose(session.snapshot())).toBe('gone');
    expect(whisperText(session.snapshot())).toBe('');
    expect(recordedClock(session.snapshot())).toEqual({ date: '1 Nov 1987', time: '00:00:00', ended: true });
  });

  it('adds transcript lines only for real changes, once per event, and leaves the finish to its own lines', () => {
    const session = new LegacySession();
    let previous = session.snapshot();
    session.observe();
    expect(eventLines(session.snapshot(), session.lastEvent(), previous).map(([text]) => text)).toEqual([
      '↺ last.session started the same minute again · the bell rang · returns: 1', 'MARA@1987> HELP ME.']);
    previous = session.snapshot();
    session.toggleRetry();
    expect(eventLines(session.snapshot(), session.lastEvent(), previous)).toEqual([[`TERMINAL: ${CALL_STOPPED}`, 'success']]);
    previous = session.snapshot();
    session.observe();
    expect(eventLines(session.snapshot(), session.lastEvent(), previous).map(([text]) => text).join(' ')).toMatch(/last impression is on the glass.*ECHO can capture/);
    previous = session.snapshot();
    session.finish();
    expect(eventLines(session.snapshot(), session.lastEvent(), previous)).toEqual([]);
    expect(FINISH_LINES.map(([text]) => text)).toContain(`MARA@1987> ${FINAL_LINE}`);
  });

  it('reports progress from the other programs only when the phase moves forward', () => {
    expect(phaseLines('capture-retained', 'call-stopped').map(([text]) => text).join(' ')).toMatch(/ECHO captured the glass, writing and all/);
    expect(phaseLines('ready-to-finish', 'draft-ready').map(([text]) => text).join(' ')).toMatch(/Its receipt is here/);
    expect(phaseLines('call-stopped', 'capture-retained')).toEqual([]);
    expect(phaseLines('finished', 'ready-to-finish')).toEqual([]);
  });

  it('the opening transcript is ordinary, tells the truth after a reload and reports a migration once', () => {
    const fresh = bootLines(new LegacySession().snapshot(), 'migrated-v1').map(([text]) => text).join(' ');
    expect(fresh).toMatch(/Restored 1 session: last\.session \(Mara, recorded 31 Oct 1987 23:59\)/);
    expect(fresh).toMatch(/older version belongs to an earlier story/);
    expect(bootLines(new LegacySession().snapshot(), 'migrated-v3').map(([text]) => text).join(' ')).toMatch(/limited captures: their picture only, no writing/);
    const restored = new LegacySession({ retry: false, muffled: false, attempts: 2, presence: 'glass', said: ['help', 'same-minute'] });
    const intro = bootLines(restored.snapshot()).map(([text]) => text);
    expect(intro.join(' ')).toMatch(/finished its minute.*glass/);
    expect(intro).toContain('MARA@1987> HELP ME.');
    const closed = new LegacySession({ retry: false, muffled: false, attempts: 2, presence: 'released', said: ['help', 'next-person'] });
    expect(bootLines(closed.snapshot()).map(([text]) => text)).toContain(`MARA@1987> ${FINAL_LINE}`);
    expect(bootLines(new LegacySession().snapshot(), 'corrupt').map(([text]) => text).join(' ')).toMatch(/could not be read/);
  });

  it('keeps every default surface free of process vocabulary and never claims the letter arrived early', () => {
    for (const state of journey()) for (const text of surfaces(state)) {
      expect(text).not.toMatch(TECHNICAL);
      expect(text).not.toMatch(/at peace|recovered|you win|session complete|You were the next person|The letter arrived/i);
    }
  });
});
