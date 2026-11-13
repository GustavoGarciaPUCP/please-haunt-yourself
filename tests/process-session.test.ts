import { describe, expect, it } from 'vitest';
import { HELP, baseCommand, isRefusedInput } from '../src/haunt/process-session';
import {
  KEY_STEP, KEY_STEP_LARGE, MIN_SIZE, clampBounds, defaultBounds, keyboardResize, keyboardStep, maximizedBounds, moveBounds, resizeBounds, restoreUnderPointer,
} from '../src/haunt/window-geometry';

describe('game console syntax (v4)', () => {
  it('answers help, clear and open; lists the case commands including finish', () => {
    expect(baseCommand('help').lines).toEqual([...HELP]);
    expect(HELP.join('\n')).toMatch(/jobs[\s\S]*ps[\s\S]*kill \[-TERM\|-KILL\] PID[\s\S]*finish[\s\S]*open echo\|canvas\|postman/);
    expect(HELP.join('\n')).not.toMatch(/watchd|mirror|restore terminal/);
    expect(baseCommand('clear')).toMatchObject({ action: 'clear', lines: [] });
    expect(baseCommand('open echo')).toMatchObject({ action: 'open', app: 'echo' });
    expect(baseCommand('open POSTMAN')).toMatchObject({ action: 'open', app: 'postman' });
    expect(baseCommand('open notepad')).toMatchObject({ tone: 'error' });
    expect(baseCommand('restore terminal').lines[0]).toMatch(/Start the case over/);
    expect(baseCommand('')).toEqual({ tone: 'normal', lines: [] });
  });

  it('refuses shell syntax and oversized input and never treats input as code', () => {
    for (const command of ['help; ls', 'a && b', 'echo `id`', '<script>', 'x'.repeat(201), 'ps\nps']) {
      expect(isRefusedInput(command)).toBe(true);
      expect(baseCommand(command).tone).toBe('error');
    }
    expect(baseCommand('format c:').lines[0]).toMatch(/Unsupported command/);
    expect(baseCommand('kill').lines[0]).toMatch(/Usage: kill/);
  });
});

describe('window geometry (v4)', () => {
  const ws = { width: 1366, height: 720 };

  it('keeps a window inside the workspace and never below its minimum size', () => {
    expect(clampBounds({ left: -40, top: -10, width: 580, height: 624 }, ws, MIN_SIZE.terminal)).toEqual({ left: 0, top: 0, width: 580, height: 624 });
    expect(clampBounds({ left: 1000, top: 300, width: 580, height: 624 }, ws, MIN_SIZE.terminal)).toEqual({ left: 786, top: 96, width: 580, height: 624 });
    expect(clampBounds({ left: 10, top: 10, width: 100, height: 100 }, ws, MIN_SIZE.echo)).toMatchObject({ width: 640, height: 480 });
    expect(clampBounds({ left: 0, top: 0, width: 3000, height: 3000 }, ws, MIN_SIZE.echo)).toEqual({ left: 0, top: 0, width: 1366, height: 720 });
    // A workspace smaller than the minimum: the window fills it instead of overflowing.
    expect(clampBounds({ left: 0, top: 0, width: 700, height: 600 }, { width: 600, height: 400 }, MIN_SIZE.canvas)).toEqual({ left: 0, top: 0, width: 600, height: 400 });
  });

  it('resizes from any edge with the opposite edge fixed, bounded by the minimum and the workspace', () => {
    const start = { left: 200, top: 100, width: 700, height: 500 };
    expect(resizeBounds(start, 'e', 120, 0, ws, MIN_SIZE.echo)).toEqual({ ...start, width: 820 });
    expect(resizeBounds(start, 'w', -150, 0, ws, MIN_SIZE.echo)).toEqual({ left: 50, top: 100, width: 850, height: 500 });
    expect(resizeBounds(start, 'w', 500, 0, ws, MIN_SIZE.echo)).toEqual({ left: 260, top: 100, width: 640, height: 500 });
    expect(resizeBounds(start, 'n', 0, -400, ws, MIN_SIZE.echo)).toEqual({ left: 200, top: 0, width: 700, height: 600 });
    expect(resizeBounds(start, 'se', 2000, 2000, ws, MIN_SIZE.echo)).toEqual({ left: 200, top: 100, width: 1166, height: 620 });
    expect(keyboardResize(start, 20, 0, ws, MIN_SIZE.echo)).toEqual({ ...start, width: 720 });
  });

  it('maximizes to the workspace and restores a dragged maximized window under the pointer', () => {
    expect(maximizedBounds(ws)).toEqual({ left: 0, top: 0, width: 1366, height: 720 });
    const normal = { left: 100, top: 60, width: 600, height: 500 };
    // The pointer held the titlebar at 50% of the maximized width: it stays at 50% of the restored width.
    expect(restoreUnderPointer(normal, { x: 683, y: 20 }, 0.5, 20, ws, MIN_SIZE.terminal)).toEqual({ left: 383, top: 0, width: 600, height: 500 });
    expect(moveBounds(normal, 5000, 0, ws, MIN_SIZE.terminal)).toEqual({ ...normal, left: 766 });
  });

  it('lays out every program inside each PC workspace, at least at its minimum size', () => {
    for (const workspace of [{ width: 1366, height: 720 }, { width: 1440, height: 852 }, { width: 1920, height: 1032 }]) {
      for (const app of ['terminal', 'echo', 'canvas', 'postman'] as const) {
        const bounds = defaultBounds(app, workspace);
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.top).toBeGreaterThanOrEqual(0);
        expect(bounds.left + bounds.width).toBeLessThanOrEqual(workspace.width);
        expect(bounds.top + bounds.height).toBeLessThanOrEqual(workspace.height);
        expect(bounds.width).toBeGreaterThanOrEqual(MIN_SIZE[app].width);
        expect(bounds.height).toBeGreaterThanOrEqual(MIN_SIZE[app].height);
      }
      // The desktop files keep a free column to the left of TERMINAL.
      expect(defaultBounds('terminal', workspace).left).toBeGreaterThanOrEqual(112);
    }
  });

  it('moves by fixed keyboard steps', () => {
    expect(keyboardStep('ArrowLeft', false)).toEqual({ dx: -KEY_STEP, dy: 0 });
    expect(keyboardStep('ArrowDown', true)).toEqual({ dx: 0, dy: KEY_STEP_LARGE });
    expect(keyboardStep('Enter', false)).toBeNull();
  });
});
