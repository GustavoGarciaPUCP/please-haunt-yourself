import { describe, expect, it } from 'vitest';
import { LegacySession, isSettled, LAST_LINE } from '../src/haunt/legacy-session';

describe('TERMINAL application recovery', () => {
  it('revives terminated copies through their callback and rejects stale PIDs', () => {
    const session = new LegacySession();
    session.execute('kill -TERM 3087');
    expect(session.snapshot()).toMatchObject({ pid: 3088, cycles: 1, health: 'haunted' });
    expect(session.execute('kill -TERM 3087')?.tone).toBe('error');
    expect(session.execute('ask status')?.lines.join(' ')).toContain('Not yet');
  });
  it('distinguishes silencing output from stopping the repeating session', () => {
    const session = new LegacySession();
    session.toggle('output'); session.step(); session.step();
    expect(session.snapshot().trace).toContain('disconnected');
    session.step();
    expect(session.snapshot()).toMatchObject({ cycles: 1, health: 'haunted', pid: 3088 });
    expect(session.status().join(' ')).toContain('Silence is not a clean exit');
  });
  it('turns executable memory into retained history after a clean release', () => {
    const session = new LegacySession();
    expect(session.execute('echo hello')?.lines).toHaveLength(2);
    session.toggle('restart'); session.terminate();
    expect(isSettled(session.snapshot())).toBe(true);
    expect(session.snapshot()).toMatchObject({ health: 'remembered', pid: null, archive: true });
    expect(session.execute('echo hello')?.lines).toEqual(['hello']);
    expect(session.execute('cat last-session')?.lines).toContain(LAST_LINE);
    expect(session.execute('ask are you okay')?.lines.join(' ')).toContain('do not have to repeat');
  });
  it('permits a distinct blank ending; deleting the saved line alone is not a repair', () => {
    const session = new LegacySession();
    session.toggle('archive'); session.terminate();
    expect(isSettled(session.snapshot())).toBe(false);
    session.toggle('restart'); session.terminate();
    expect(session.snapshot().health).toBe('blank');
    expect(session.execute('cat last-session')?.lines.join(' ')).toContain('blank');
    expect(session.status().join(' ')).toContain('cannot remember');
  });
  it('makes a forced exit residue recoverable without restoring the callback', () => {
    const session = new LegacySession();
    session.toggle('restart'); session.terminate(true);
    expect(session.snapshot()).toMatchObject({ health: 'residue', pid: null, restart: false });
    expect(isSettled(session.snapshot())).toBe(false);
    session.resumeResidue(); session.terminate();
    expect(session.snapshot().health).toBe('remembered');
  });
  it('undoes a completed repair and keeps read-only conversation/entry non-mutating', () => {
    const session = new LegacySession();
    const initial = session.snapshot();
    for (const command of ['ask status', 'ask who was here', 'inspect last.session', 'enter last.session', 'cat last-session']) session.execute(command);
    expect(session.snapshot()).toEqual(initial);
    session.toggle('restart');
    const before = session.snapshot();
    session.terminate(); session.undo();
    expect(session.snapshot()).toEqual(before);
  });
  it('resets only the local encounter and never interprets input as source or shell code', () => {
    const session = new LegacySession();
    const initial = session.snapshot();
    for (const command of ['kill -9 3087; help', 'enter $(pwd)', 'ask <script>', 'kill -9 -1', 'ask status\nkill 3087']) {
      session.execute(command);
      expect(session.snapshot()).toEqual(initial);
    }
    session.toggle('restart'); session.terminate(); session.execute('restore terminal');
    expect(session.snapshot()).toEqual(initial);
    expect(session.canUndo()).toBe(false);
  });
});
