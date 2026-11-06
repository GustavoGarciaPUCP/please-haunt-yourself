import { describe, expect, it } from 'vitest';
import { LegacySession, LAST_LINE, type LegacySnapshot } from '../src/haunt/legacy-session';
import { desktopTask, ghostPose, hauntingNarration, interiorHint, justRang, objectCopy, shellPresentation, whisperText } from '../src/haunt/haunting-presentation';

const TECHNICAL = /\b(PID|stdout|BASIC|TERM|KILL|SIGTERM|callback|on_exit)\b/;
const surfaces = (state: LegacySnapshot): string[] => {
  const shell = shellPresentation(state), objects = objectCopy(state);
  return [hauntingNarration(state), interiorHint(state), desktopTask(state), shell.label, shell.condition, shell.prefix, shell.line, shell.lineSr, shell.enter, shell.footer,
    ...Object.values(objects).flatMap(copy => [copy.state, copy.action])];
};

describe('TERMINAL Halloween presentation', () => {
  it('keeps the process outcome of a long sequence identical while attributing each moment', () => {
    const session = new LegacySession();
    session.step(); session.step(); session.step();
    session.toggle('output');
    session.step(); session.step(); session.step();
    session.terminate();
    session.toggle('restart');
    for (let i = 0; i < 4; i++) session.step();
    expect(session.snapshot()).toMatchObject({ pid: 3090, cycles: 3, phase: 2, health: 'haunted', moment: 'threshold', lastAction: 'step' });
    session.terminate();
    expect(session.snapshot()).toMatchObject({ pid: null, cycles: 3, phase: 2, health: 'remembered', moment: 'ended', lastAction: 'term' });
  });

  it('names the bell as the cause of every return, including the player’s own failed farewell', () => {
    const session = new LegacySession();
    session.step(); session.step(); session.step();
    let state = session.snapshot();
    expect(state).toMatchObject({ moment: 'recalled', lastAction: 'step', cycles: 1 });
    expect(justRang(state)).toBe(true);
    expect(ghostPose(state)).toBe('present');
    expect(hauntingNarration(state)).toMatch(/bell rings.*pulled back.*once/);
    session.terminate();
    state = session.snapshot();
    expect(state).toMatchObject({ moment: 'recalled', lastAction: 'term', cycles: 2, health: 'haunted' });
    expect(hauntingNarration(state)).toMatch(/^You guided it.*bell rang.*twice/);
    session.terminate(true);
    expect(hauntingNarration(session.snapshot())).toMatch(/^You forced it out, but the bell rang/);
    expect(shellPresentation(session.snapshot()).condition).toContain('3 times');
  });

  it('hushing silences the words but the ghost stays, in the room and behind the shell text', () => {
    const session = new LegacySession();
    session.toggle('output');
    const state = session.snapshot();
    expect(whisperText(state)).toBe('');
    expect(ghostPose(state)).toBe('present');
    expect(shellPresentation(state)).toMatchObject({ ghost: 'hushed', lineKind: 'hushed' });
    expect(hauntingNarration(state)).toMatch(/hushed the whisper.*still here/);
    expect(objectCopy(state).output.action).toBe('Let it whisper');
    expect(desktopTask(state)).not.toContain('recovered');
  });

  it('object changes never move the ghost or erase what it last did', () => {
    const session = new LegacySession();
    session.toggle('restart');
    session.step(); session.step(); session.step();
    expect(session.snapshot().moment).toBe('threshold');
    expect(ghostPose(session.snapshot())).toBe('leaving');
    session.toggle('archive');
    let state = session.snapshot();
    expect(state).toMatchObject({ moment: 'threshold', lastAction: 'archive', archive: false });
    expect(ghostPose(state)).toBe('leaving');
    expect(justRang(state)).toBe(false);
    expect(hauntingNarration(state)).toMatch(/let the note fade.*does not free it/);
    session.toggle('restart');
    expect(ghostPose(session.snapshot())).toBe('leaving');
    expect(justRang(session.snapshot())).toBe(false);
    session.step();
    state = session.snapshot();
    expect(state).toMatchObject({ moment: 'recalled', cycles: 1 });
    expect(justRang(state)).toBe(true);
    expect(whisperText(state)).toBe('. . .');
  });

  it('gives the kept note and the blank page different, presence-free endings', () => {
    const kept = new LegacySession();
    kept.toggle('restart'); kept.terminate();
    const blank = new LegacySession();
    blank.toggle('archive'); blank.toggle('restart'); blank.terminate();
    const a = kept.snapshot(), b = blank.snapshot();
    expect([a.health, b.health]).toEqual(['remembered', 'blank']);
    for (const state of [a, b]) {
      expect(ghostPose(state)).toBe('gone');
      expect(shellPresentation(state).ghost).toBe('gone');
      expect(whisperText(state)).toBe('');
      expect(desktopTask(state)).toMatch(/^✓ TERMINAL recovered\./);
    }
    expect(shellPresentation(a)).toMatchObject({ lineKind: 'kept', line: `“${LAST_LINE}”` });
    expect(shellPresentation(b)).toMatchObject({ lineKind: 'blank', line: '(a blank page)' });
    expect(hauntingNarration(a)).not.toBe(hauntingNarration(b));
    expect(desktopTask(a)).not.toBe(desktopTask(b));
    expect(kept.status()).not.toEqual(blank.status());
  });

  it('a forced exit leaves a shadow that is not a recovery and can be called back', () => {
    const session = new LegacySession();
    session.toggle('restart'); session.terminate(true);
    let state = session.snapshot();
    expect(ghostPose(state)).toBe('shadow');
    expect(shellPresentation(state)).toMatchObject({ ghost: 'shadow', enter: 'Follow the shadow' });
    expect(desktopTask(state)).not.toContain('recovered');
    session.resumeResidue();
    state = session.snapshot();
    expect(state).toMatchObject({ health: 'haunted', moment: 'waiting', lastAction: 'resume', restart: false });
    expect(ghostPose(state)).toBe('present');
    expect(hauntingNarration(state)).toMatch(/called the shadow back/);
  });

  it('answers check-ins from the bell’s actual state', () => {
    const session = new LegacySession();
    session.toggle('restart');
    expect(session.status().join(' ')).toMatch(/^TERMINAL: Not yet\. The bell is quiet/);
    session.toggle('output');
    expect(session.status().join(' ')).toMatch(/Quiet is not the same as free\. The bell is quiet now/);
  });

  it('keeps every default surface free of process vocabulary', () => {
    const session = new LegacySession();
    const seen: LegacySnapshot[] = [session.snapshot()];
    const record = (action: () => void) => { action(); seen.push(session.snapshot()); };
    for (let i = 0; i < 3; i++) record(() => session.step());
    record(() => session.terminate());
    record(() => session.terminate(true));
    record(() => session.toggle('output'));
    record(() => session.toggle('archive'));
    record(() => session.toggle('restart'));
    for (let i = 0; i < 3; i++) record(() => session.step());
    record(() => session.terminate(true));
    record(() => session.resumeResidue());
    record(() => session.terminate());
    record(() => session.undo());
    record(() => session.toggle('archive'));
    record(() => session.terminate());
    expect(new Set(seen.map(state => state.health))).toEqual(new Set(['haunted', 'residue', 'blank', 'remembered']));
    for (const state of seen) for (const text of surfaces(state)) expect(text).not.toMatch(TECHNICAL);
  });
});
