import { describe, expect, it } from 'vitest';
import { ProcessSession, assessStage } from '../src/haunt/process-session';
import { SCENE_CONFIG, createScene, setPropPosition, validateCoverage } from '../src/haunt/echo-scene';

describe('fictional reflection processes', () => {
  it('respawns a terminated child with a new PID while its supervisor is active', () => {
    const session = new ProcessSession();
    const result = session.execute('kill -TERM 410');
    expect(result.tone).toBe('warning');
    expect(session.snapshot()).toMatchObject({ mirrorPid: 411, frame: 'live', restarts: 1 });
    expect(result.lines.join(' ')).toContain('watchd [400] restarted');
    const prior = session.snapshot();
    expect(session.execute('kill -TERM 410').tone).toBe('error');
    expect(session.snapshot()).toEqual(prior);
  });

  it('allows a clean release only after restart supervision has stopped', () => {
    const session = new ProcessSession();
    session.execute('kill -15 400');
    expect(session.snapshot()).toMatchObject({ supervisorRunning: false, mirrorPid: 410, frame: 'live' });
    expect(session.execute('kill 410').tone).toBe('success');
    expect(session.snapshot()).toMatchObject({ mirrorPid: null, frame: 'released' });
  });

  it('retains the framebuffer after forced child termination and offers reversible recovery', () => {
    const session = new ProcessSession();
    session.execute('kill 400');
    session.execute('kill -9 410');
    expect(session.snapshot()).toMatchObject({ mirrorPid: null, frame: 'afterimage' });
    expect(session.execute('inspect mirror').lines.join(' ')).toContain('KILL leaves my last frame');
    session.execute('restore mirror');
    expect(session.snapshot()).toMatchObject({ supervisorRunning: true, frame: 'live', mirrorPid: 411, restarts: 0 });
  });

  it('requires privacy and a clear public output for both alternative interventions', () => {
    const exposed = validateCoverage(createScene(), SCENE_CONFIG);
    expect(assessStage(exposed, 'released').ready).toBe(true);
    expect(assessStage(exposed, 'afterimage').ready).toBe(false);
    expect(assessStage(exposed, 'live').ready).toBe(false);
    const covered = validateCoverage(setPropPosition(createScene(), { x: 440, y: 60 }, SCENE_CONFIG), SCENE_CONFIG);
    expect(assessStage(covered, 'afterimage').ready).toBe(true);
    const blocked = validateCoverage(setPropPosition(createScene(), { x: 100, y: 100 }, SCENE_CONFIG), SCENE_CONFIG);
    expect(assessStage(blocked, 'released').ready).toBe(false);
  });

  it('treats shell syntax, unknown commands, invalid targets and reads as non-mutating', () => {
    const session = new ProcessSession();
    const initial = session.snapshot();
    for (const command of ['kill -9 -1', 'kill -TERM 0', 'kill -BOGUS 410', 'kill -TERM 410 extra', 'kill -9 410; clear', 'kill $(pwd)', 'kill 400\nkill 410', 'restore all', 'inspect 999', 'echo <script>', 'help extra', 'A'.repeat(201)]) {
      expect(session.execute(command).tone, command).toBe('error');
      expect(session.snapshot()).toEqual(initial);
    }
    for (const command of ['help', 'ps', 'inspect mirror', 'inspect watchd', 'open echo', 'clear']) {
      expect(session.execute(command).tone).toBe('normal');
      expect(session.snapshot()).toEqual(initial);
    }
  });

  it('notifies both app subscribers once per mutation and disposes listeners independently', () => {
    const session = new ProcessSession();
    let a = 0, b = 0;
    const unsubscribe = session.subscribe(() => a++);
    session.subscribe(() => b++);
    session.execute('ps');
    session.execute('kill 400');
    unsubscribe();
    session.execute('kill 410');
    expect([a, b]).toEqual([1, 2]);
    const snapshot = session.snapshot();
    snapshot.frame = 'afterimage';
    expect(session.snapshot().frame).toBe('released');
  });
});
