import { describe, expect, it } from 'vitest';
import { CALL_STOPPED, FIRST_PID, GHOST_LINES, LAST_LINE, LegacySession, NOTE_LINES, REQUEST_ID } from '../src/haunt/legacy-session';

describe('Mara’s job: the v3 request model', () => {
  it('keeps the note in the data from the start, verbatim, under one request identity', () => {
    expect(NOTE_LINES).toEqual(['FOR THE NEXT PERSON AT THIS DESK', 'This picture is yours.', 'Keep what matters.', '— Mara, 31 October 1987']);
    expect(REQUEST_ID).toBe('mara-1987-10-31');
    expect(new LegacySession().snapshot()).toMatchObject({ pid: FIRST_PID, retry: true, muffled: false, attempts: 0, presence: 'terminal', said: [], casePhase: 'repeating' });
  });

  it('a failed finish with the call armed reissues the job once per attempt, with a new PID and bounded ghost lines', () => {
    const session = new LegacySession();
    session.observe();
    expect(session.snapshot()).toMatchObject({ attempts: 1, pid: FIRST_PID + 1, moment: 'recalled', presence: 'terminal' });
    expect(session.lastEvent()).toMatchObject({ kind: 'observe', line: 'help' });
    session.observe();
    expect(session.lastEvent().line).toBe('same-minute');
    session.observe();
    expect(session.lastEvent().line).toBeUndefined();
    expect(session.snapshot()).toMatchObject({ attempts: 3, pid: FIRST_PID + 3, said: ['help', 'same-minute'] });
    expect([GHOST_LINES.help, GHOST_LINES['same-minute']]).toEqual(['HELP ME.', 'I keep starting the same minute.']);
  });

  it('muffling silences the bell but not the call, and the ghost says so once', () => {
    const session = new LegacySession();
    session.toggleMuffle();
    session.observe();
    expect(session.snapshot()).toMatchObject({ muffled: true, retry: true, attempts: 1, presence: 'terminal' });
    expect(session.lastEvent().line).toBe('cannot-hear');
    expect(GHOST_LINES['cannot-hear']).toBe("I can't hear it. It still brings me back.");
    expect(session.status().join(' ')).toMatch(/muffled, but the call still brings it back/);
    session.observe();
    expect(session.lastEvent().line).toBe('help');
  });

  it('stopping the call is partial progress; letting it finish reaches the glass exactly once and commits', () => {
    const session = new LegacySession();
    session.observe();
    session.toggleRetry();
    expect(session.snapshot()).toMatchObject({ retry: false, presence: 'terminal' });
    expect(session.status()[0]).toBe(`TERMINAL: ${CALL_STOPPED}`);
    expect(session.canUndo()).toBe(true);
    session.observe();
    expect(session.snapshot()).toMatchObject({ presence: 'glass', pid: null, moment: 'impressed', attempts: 1, retry: false });
    expect(session.canUndo()).toBe(false);
    const committed = session.lastEvent().id;
    session.observe(); session.step(); session.toggleRetry(); session.toggleMuffle(); session.undo(); session.resumeResidue();
    expect(session.terminate().tone).toBe('warning');
    expect(session.lastEvent().id).toBe(committed);
    expect(session.snapshot().presence).toBe('glass');
  });

  it('stepping moment by moment reaches the same outcomes as one observation', () => {
    const stepped = new LegacySession(), observed = new LegacySession();
    for (let i = 0; i < 3; i++) stepped.step();
    observed.observe();
    const { lastAction: a, ...rest1 } = stepped.snapshot(), { lastAction: b, ...rest2 } = observed.snapshot();
    expect([a, b]).toEqual(['step', 'observe']);
    expect(rest1).toEqual(rest2);
    stepped.toggleRetry(); observed.toggleRetry();
    for (let i = 0; i < 3; i++) stepped.step();
    observed.observe();
    expect(stepped.snapshot().presence).toBe('glass');
    expect(observed.snapshot().presence).toBe('glass');
  });

  it('forcing it out: with the call on it comes back; with the call off it leaves a recoverable shadow and nothing reaches the glass', () => {
    const session = new LegacySession();
    expect(session.terminate(true).lines[0]).toMatch(/Stopping the run did not stop the call/);
    expect(session.snapshot()).toMatchObject({ attempts: 1, presence: 'terminal' });
    session.toggleRetry();
    session.terminate(true);
    expect(session.snapshot()).toMatchObject({ presence: 'shadow', pid: null, attempts: 1 });
    expect(session.status().join(' ')).toMatch(/forced it out before it could finish/);
    session.resumeResidue();
    expect(session.snapshot()).toMatchObject({ presence: 'terminal', retry: false, pid: FIRST_PID + 2 });
    session.observe();
    expect(session.snapshot().presence).toBe('glass');
  });

  it('Undo restores earlier states but never unsays a line or reuses an event id', () => {
    const session = new LegacySession();
    const initial = session.snapshot();
    session.observe();
    const first = session.lastEvent();
    session.undo();
    expect(session.lastEvent().kind).toBe('undo');
    expect(session.lastEvent().id).toBeGreaterThan(first.id);
    const { said, ...core } = session.snapshot();
    const { said: _initialSaid, ...initialCore } = initial;
    expect(core).toEqual(initialCore);
    expect(said).toEqual(['help']);
    session.observe();
    expect(session.lastEvent().line).toBe('same-minute');
  });

  it('typed commands answer from state, and only the current run of last.session accepts signals', () => {
    const session = new LegacySession();
    expect(session.execute('ps')?.lines.join('\n')).toMatch(/3087\s+repeating\s+last\.session[\s\S]*echo\.link/);
    // playability-v5 R4: the default status names the open question, not its fix (v4 printed "next: stop the call").
    expect(session.execute('jobs')?.lines.join(' ')).toMatch(/picture and a note.*address is on the note.*retry on.*Repeating · next: find out what keeps bringing it back/);
    expect(session.execute('kill echo.link')?.tone).toBe('error');
    expect(session.execute('kill 999')?.lines[0]).toMatch(/Only last\.session/);
    expect(session.execute('kill -TERM 3087')?.tone).toBe('warning');
    expect(session.snapshot()).toMatchObject({ attempts: 1, pid: 3088 });
    expect(session.execute('kill 3087')?.lines[0]).toMatch(/earlier minute/);
    session.toggleRetry();
    expect(session.execute('kill -TERM 3088')?.tone).toBe('success');
    expect(session.snapshot().presence).toBe('glass');
    expect(session.execute('ps')?.lines.join('\n')).toMatch(/finished\s+last\.session\s+its last impression is on the glass/);
    expect(session.execute('cat last-session')?.lines.join(' ')).toMatch(/finished once, in the mist on the glass/);
  });

  it('echo: the ghost breaks in while it is in TERMINAL; after the glass only the player’s words return', () => {
    const session = new LegacySession();
    expect(session.execute('echo hello')?.lines).toEqual(['hello', `MARA@1987> ${LAST_LINE}`]);
    session.toggleRetry(); session.terminate(true);
    expect(session.execute('echo hello')?.lines).toEqual(['hello', '[an unfinished caret still owns this prompt]']);
    session.resumeResidue(); session.observe();
    expect(session.execute('echo hello')?.lines).toEqual(['hello']);
  });

  it('never shows the whole note in TERMINAL before the glass, and read-only commands never mutate', () => {
    const session = new LegacySession();
    const before = session.snapshot();
    const texts = ['ask status', 'ask who was here', 'cat last-session', 'jobs', 'ps', 'inspect last.session', 'inspect echo.link', 'enter last.session']
      .flatMap(command => session.execute(command)?.lines ?? []);
    expect(session.snapshot()).toEqual(before);
    for (const line of NOTE_LINES.slice(1)) expect(texts.join('\n')).not.toContain(line);
    expect(texts.join('\n')).toContain('The address is on the note.');
  });

  it('refuses shell syntax instead of interpreting it', () => {
    const session = new LegacySession();
    const before = session.snapshot();
    for (const command of ['kill -9 3087; help', 'enter $(pwd)', 'ask <script>', 'echo a | b', 'ask status\nkill 3087', 'x'.repeat(201)]) {
      expect(session.execute(command)).toBeNull();
      expect(session.snapshot()).toEqual(before);
    }
  });

  it('restores a saved case without its PID history and round-trips the saved fields', () => {
    const session = new LegacySession({ retry: false, muffled: true, attempts: 4, presence: 'terminal', said: ['same-minute', 'help', 'help'] as never });
    expect(session.snapshot()).toMatchObject({ pid: FIRST_PID + 4, retry: false, muffled: true, attempts: 4, said: ['help', 'same-minute'], moment: 'waiting' });
    expect(session.toSaved()).toEqual({ retry: false, muffled: true, attempts: 4, presence: 'terminal', said: ['help', 'same-minute'] });
    expect(session.canUndo()).toBe(false);
    const glass = new LegacySession({ retry: true, muffled: false, attempts: 2, presence: 'glass', said: [] });
    expect(glass.snapshot()).toMatchObject({ presence: 'glass', pid: null, retry: false, moment: 'impressed' });
  });

  it('reports the case phase it is given, in the same words as every surface, and starts over with the run', () => {
    const session = new LegacySession();
    session.observe(); session.toggleRetry(); session.observe();
    session.setCasePhase('capture-retained');
    expect(session.lastEvent().kind).toBe('phase');
    expect(session.status().join(' ')).toMatch(/ECHO has a capture of the glass, with the writing/);
    expect(session.execute('jobs')?.lines.join(' ')).toMatch(/Capture retained · next: a finished letter/);
    const id = session.lastEvent().id;
    session.setCasePhase('capture-retained');
    expect(session.lastEvent().id).toBe(id);
    session.reset();
    expect(session.snapshot()).toMatchObject({ presence: 'terminal', attempts: 0, casePhase: 'repeating', said: [] });
    expect(session.lastEvent().kind).toBe('reset');
  });

  it('finishes only from the glass, once, with the final line said once and no ghost output afterwards', () => {
    const session = new LegacySession();
    expect(session.finish()).toBe(false);
    session.toggleRetry(); session.observe();
    expect(session.finish()).toBe(true);
    expect(session.lastEvent()).toMatchObject({ kind: 'finish', line: 'next-person' });
    expect(session.snapshot()).toMatchObject({ presence: 'released', moment: 'released', pid: null });
    expect(session.canUndo()).toBe(false);
    expect(session.finish()).toBe(false);
    expect(session.execute('echo hello')?.lines).toEqual(['hello']);
    expect(session.execute('ps')?.lines.join('\n')).toMatch(/closed\s+last\.session\s+delivered to guest/);
    expect(session.execute('finish')?.action).toBe('finish');
    expect(session.terminate().lines[0]).toMatch(/closed/);
    const restored = new LegacySession(session.toSaved());
    expect(restored.snapshot()).toMatchObject({ presence: 'released', retry: false, said: expect.arrayContaining(['next-person']) });
  });
});
