/** Fictional processes for this rehearsal only. No command ever reaches the host OS. */
import type { CoverageResult } from './echo-scene';

export type MirrorFrame = 'live' | 'released' | 'afterimage';
export interface ProcessSnapshot {
  supervisorRunning: boolean;
  mirrorPid: number | null;
  frame: MirrorFrame;
  restarts: number;
  revision: number;
}
export interface ConsoleResult {
  lines: string[];
  tone: 'normal' | 'success' | 'warning' | 'error';
  action?: 'clear' | 'open-echo';
}

export function assessStage(coverage: CoverageResult, frame: MirrorFrame) {
  const privateSafe = frame === 'released' || coverage.privateFullyCovered;
  return { privateSafe, publicClear: !coverage.publicOverlap, ready: privateSafe && !coverage.publicOverlap };
}

const HELP = [
  'ps                         list reflection processes',
  'inspect <PID|watchd|mirror>  inspect a process and its dependencies',
  'kill [-TERM|-15|-KILL|-9] PID',
  '                           TERM asks for cleanup; KILL skips it',
  'restore mirror             restart the example reflection services',
  'open echo                  open the capture studio',
  'clear                      clear this console transcript',
  'ArrowUp/Down: history. Ctrl+L: clear. Commands are local to this game.',
];

export class ProcessSession {
  private state: ProcessSnapshot = { supervisorRunning: true, mirrorPid: 410, frame: 'live', restarts: 0, revision: 0 };
  private nextPid = 411;
  private listeners = new Set<() => void>();

  snapshot(): ProcessSnapshot { return { ...this.state }; }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private changed(): void {
    this.state.revision++;
    for (const listener of this.listeners) listener();
  }

  execute(command: string): ConsoleResult {
    const tokens = command.trim().split(/\s+/);
    const [verb, arg] = tokens;
    const error = (message: string): ConsoleResult => ({ tone: 'error', lines: [message] });
    if (!command.trim()) return { tone: 'normal', lines: [] };
    if (command.length > 200 || /[;&|`<>\n\r]/.test(command)) return error('One game command at a time. Type help for the supported syntax.');
    if (verb === 'help' && tokens.length === 1) return { tone: 'normal', lines: HELP };
    if (verb === 'clear' && tokens.length === 1) return { tone: 'normal', lines: [], action: 'clear' };
    if (verb === 'open' && arg === 'echo' && tokens.length === 2) return { tone: 'normal', lines: ['Opening ECHO capture studio.'], action: 'open-echo' };
    if (verb === 'ps' && tokens.length === 1) return { tone: 'normal', lines: [
      'PID   PPID  STATE       PROCESS',
      this.state.supervisorRunning ? '400      1  listening   watchd' : '400      -  stopped     watchd',
      this.state.mirrorPid !== null ? `${this.state.mirrorPid}    ${this.state.supervisorRunning ? '400' : '  1'}  observing   mirror.watch` : '---      -  stopped     mirror.watch',
      '', `Private display buffer: ${this.state.frame}. Restarts: ${this.state.restarts}.`,
      'Only these fictional services accept signals. inspect explains their roles.',
    ] };
    if (verb === 'inspect' && tokens.length === 2) {
      if (arg === '400' || arg === 'watchd') return { tone: 'normal', lines: [
        `watchd [400] — ${this.state.supervisorRunning ? 'listening' : 'stopped'}`,
        'Job: restart mirror.watch whenever it exits.',
        'TERM stops the restart service; its current child keeps running.',
        'The child must then receive its own signal. Inspect it before choosing one.',
      ] };
      if (arg === 'mirror' || (this.state.mirrorPid !== null && arg === String(this.state.mirrorPid))) return { tone: 'normal', lines: [
        `mirror.watch [${this.state.mirrorPid ?? 'stopped'}] — private self-view`,
        'ECHO: "I was deleted. Why am I still watching myself?"',
        `Supervisor: watchd [400], ${this.state.supervisorRunning ? 'will restart me' : 'restart disabled'}.`,
        'TERM runs my display-release handler. KILL leaves my last frame behind.',
        'A released or fully covered private view lets ECHO rehearse.',
      ] };
      return error(`No current process matches ${arg}. Run ps; a restarted service gets a new PID.`);
    }
    if (verb === 'restore' && arg === 'mirror' && tokens.length === 2) {
      this.state = { supervisorRunning: true, mirrorPid: this.nextPid++, frame: 'live', restarts: 0, revision: this.state.revision };
      this.changed();
      return { tone: 'normal', lines: [`Example restored. watchd [400] → mirror.watch [${this.state.mirrorPid}].`, 'Scenery and host choice were kept. Rehearse again after editing.'] };
    }
    if (verb === 'kill') {
      const signal = tokens.length === 2 ? '-TERM' : arg;
      const target = tokens.length === 2 ? arg : tokens[2];
      if ((tokens.length !== 2 && tokens.length !== 3) || !['-TERM', '-15', '-KILL', '-9'].includes(signal ?? '') || !/^\d+$/.test(target ?? '')) {
        return error('Usage: kill [-TERM|-15|-KILL|-9] <PID>. Example: inspect 400');
      }
      const pid = Number(target);
      const forced = signal === '-KILL' || signal === '-9';
      if (pid === 400 && this.state.supervisorRunning) {
        this.state.supervisorRunning = false;
        this.changed();
        return { tone: 'success', lines: ['watchd [400] stopped. Automatic restarts disabled.', this.state.mirrorPid === null ? 'No child is running. Inspect the display buffer with ps.' : `mirror.watch [${this.state.mirrorPid}] is still running. It now owns its exit.`] };
      }
      if (pid !== this.state.mirrorPid || this.state.mirrorPid === null) return error(`No live signal target ${target}. Run ps to see current PIDs.`);
      this.state.mirrorPid = null;
      this.state.frame = forced ? 'afterimage' : 'released';
      const lines = forced ? [`mirror.watch [${pid}] killed. Cleanup skipped.`, 'Its last frame remains in the private display buffer.'] : [`mirror.watch [${pid}]: TERM received.`, 'Display released. "Thank you. You can stop looking now."'];
      if (this.state.supervisorRunning) {
        this.state.mirrorPid = this.nextPid++;
        this.state.frame = 'live';
        this.state.restarts++;
        lines.push(`watchd [400] restarted mirror.watch as [${this.state.mirrorPid}].`, 'ECHO: "It came back. Something is keeping it alive."');
      } else if (forced) lines.push('The service is gone; the image is not. Cover it, or restore mirror to try a clean exit.');
      else lines.push('ECHO: "The monitor is finally quiet. Let me try my entrance."');
      this.changed();
      return { tone: this.state.frame === 'released' ? 'success' : 'warning', lines };
    }
    return error(`Unsupported command. Type help for the game console's commands.`);
  }
}
