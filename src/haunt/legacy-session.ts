import type { ConsoleResult } from './process-session';

export type LegacyLink = 'output' | 'archive' | 'restart';
export type LegacyHealth = 'haunted' | 'residue' | 'remembered' | 'blank';
export interface LegacySnapshot {
  pid: number | null;
  output: boolean;
  archive: boolean;
  restart: boolean;
  phase: number;
  cycles: number;
  health: LegacyHealth;
  trace: string;
  moment: 'waiting' | 'memory' | 'voice' | 'return' | 'changed' | 'ended';
}
export interface LegacyResult extends Omit<ConsoleResult, 'action'> { action?: 'enter-session' | 'return-shell'; }
export const LAST_LINE = "I'll finish in a minute.";
export const isSettled = (state: LegacySnapshot): boolean => state.health === 'remembered' || state.health === 'blank';

/** One application-owned encounter; every UI projection reads the same state. */
export class LegacySession {
  private state: LegacySnapshot = this.initial();
  private nextPid = 3088;
  private undoStack: LegacySnapshot[] = [];
  private listeners = new Set<() => void>();

  private initial(): LegacySnapshot {
    return { pid: 3087, output: true, archive: true, restart: true, phase: 0, cycles: 0, health: 'haunted', moment: 'waiting', trace: 'The exit hook is waiting. A finished command keeps returning.' };
  }
  snapshot(): LegacySnapshot { return { ...this.state }; }
  canUndo(): boolean { return this.undoStack.length > 0; }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private notify(): void { this.listeners.forEach(listener => listener()); }
  private remember(): void { this.undoStack.push(this.snapshot()); if (this.undoStack.length > 24) this.undoStack.shift(); }

  step(): void {
    if (this.state.pid === null || isSettled(this.state)) return;
    this.remember();
    const phase = this.state.phase;
    this.state.moment = phase === 0 ? 'memory' : phase === 1 ? 'voice' : 'return';
    this.state.phase = (phase + 1) % 3;
    if (phase === 0) this.state.trace = this.state.archive ? `READ last-session → “${LAST_LINE}”` : 'READ last-session → empty. There is no retained line.';
    if (phase === 1) this.state.trace = this.state.output ? `PRINT → ${this.state.archive ? LAST_LINE : '[empty archive]'}` : 'PRINT → disconnected. Quiet output; the exit callback still exists.';
    if (phase === 2) {
      if (this.state.restart) {
        this.state.cycles++;
        this.state.pid = this.nextPid++;
        this.state.trace = `END → on_exit → RUN last.session. A new copy starts as PID ${this.state.pid}.`;
      } else { this.state.phase = 2; this.state.trace = 'END → no callback. No new copy is scheduled. Send TERM to release the paused session.'; }
    }
    this.notify();
  }

  toggle(link: LegacyLink): void {
    if (isSettled(this.state)) return;
    this.remember();
    this.state[link] = !this.state[link];
    this.state.moment = 'changed';
    this.state.trace = link === 'output' ? this.state.output ? 'stdout reconnected.' : 'stdout disconnected. A silent loop can still be alive.' :
      link === 'archive' ? this.state.archive ? 'The saved human line is retained again.' : 'The saved line will not be retained. Ending the loop is a separate decision.' :
        this.state.restart ? 'on_exit callback reconnected. It can launch another copy.' : 'on_exit callback disconnected. The current copy still needs a clean exit.';
    this.notify();
  }

  terminate(forced = false): LegacyResult {
    if (this.state.pid === null) return { tone: 'warning', lines: [isSettled(this.state) ? 'The legacy session has already ended.' : 'Only a residue remains. Resume it, then choose how to close it.'] };
    this.remember();
    const old = this.state.pid;
    if (this.state.restart) {
      this.state.pid = this.nextPid++;
      this.state.cycles++;
      this.state.phase = 0;
      this.state.moment = 'return';
      this.state.trace = `${forced ? 'KILL' : 'TERM'} ${old} → on_exit → new PID ${this.state.pid}. Stopping a copy did not remove its callback.`;
      this.notify();
      return { tone: 'warning', lines: [this.state.trace] };
    }
    this.state.pid = null;
    this.state.moment = 'ended';
    this.state.health = forced ? 'residue' : this.state.archive ? 'remembered' : 'blank';
    this.state.trace = forced ? 'KILL skipped the release handler. The copy is gone; a prompt residue remains.' : this.state.archive ? 'TERM acknowledged. The line became history instead of another command.' : 'TERM acknowledged. The loop ended with a blank archive.';
    this.notify();
    return { tone: forced ? 'warning' : 'success', lines: [this.state.trace, 'Return to the shell. Ask how it is doing.'] };
  }

  resumeResidue(): void {
    if (this.state.health !== 'residue') return;
    this.remember();
    this.state.health = 'haunted'; this.state.pid = this.nextPid++; this.state.phase = 0;
    this.state.moment = 'changed';
    this.state.trace = 'Residue resumed. Your connection choices are kept; a clean exit is still possible.';
    this.notify();
  }
  undo(): void { const previous = this.undoStack.pop(); if (previous) { this.state = previous; this.notify(); } }
  reset(): void { this.state = this.initial(); this.nextPid = 3088; this.undoStack = []; this.notify(); }

  status(): string[] {
    if (this.state.health === 'remembered') return ['TERMINAL: Yes. I remember her line. I do not have to repeat it.', 'The prompt is yours now. The saved line can be read with cat last-session.'];
    if (this.state.health === 'blank') return ['TERMINAL: It is quiet now. I cannot remember the line.', 'You chose a blank archive. The prompt is yours.'];
    if (this.state.health === 'residue') return ['TERMINAL: You pushed it away, but its shadow is still on my screen.', 'Follow the ghost to finish its farewell, or undo your last action.'];
    if (!this.state.output) return ['TERMINAL: You hushed the whisper. The ghost is still here.', 'Quiet is not the same as free.'];
    return ['TERMINAL: Not yet. Every goodbye calls it back.', 'Someone left a line here. Something will not let its echo leave.'];
  }

  execute(command: string): LegacyResult | null {
    const trimmed = command.trim();
    if (trimmed.length > 200 || /[;&|`<>\n\r]/.test(trimmed)) return null;
    if (/^enter (last\.session|\d+)$/.test(trimmed)) {
      const target = trimmed.slice(6);
      if (target !== 'last.session' && target !== String(this.state.pid)) return { tone: 'error', lines: ['That PID is no longer current. Use enter last.session to find the live session.'] };
      return { tone: 'normal', lines: ['Entering the terminal’s own session.'], action: 'enter-session' };
    }
    if (/^ask (status|are you (okay|ok|better)\??|how are you\??)$/i.test(trimmed)) return { tone: isSettled(this.state) ? 'success' : 'warning', lines: this.status() };
    if (/^ask (who was here|what happened)\??$/i.test(trimmed)) return { tone: 'normal', lines: ['TERMINAL: Mara. A saved session, 31 October 1987.', 'The retained line is not the same thing as the callback that runs it.', 'I do not know what happened after she left.'] };
    if (trimmed.startsWith('ask ')) return { tone: 'normal', lines: ['Try ask status, ask are you okay, or ask who was here. These are local conversation prompts.'] };
    if (trimmed === 'cat last-session') return { tone: 'normal', lines: this.state.archive ? ['31 OCT 1987 / MARA / last retained line', LAST_LINE, isSettled(this.state) ? 'Archived text. It is no longer executable.' : 'This line is still connected to the legacy session.'] : ['No human line was retained. The archive is blank.'] };
    if (trimmed === 'inspect last.session' || (this.state.pid !== null && trimmed === `inspect ${this.state.pid}`)) return { tone: 'normal', lines: [`last.session [${this.state.pid ?? 'stopped'}] / ${this.state.health}`, 'A saved PRINT command ends, then an on_exit callback starts another copy.', 'Enter this session to watch the execution path. Its saved line and executable callback are separate connections.'] };
    if (trimmed === 'restore terminal') { this.reset(); return { tone: 'normal', lines: ['Terminal encounter restored. The mirror workshop was not changed.'] }; }
    if (trimmed.startsWith('echo ')) return { tone: 'normal', lines: [trimmed.slice(5), ...(this.state.health === 'haunted' && this.state.output ? [`MARA@1987> ${this.state.archive ? LAST_LINE : '[empty archive]'}`] : this.state.health === 'residue' ? ['[an unreleased caret still owns a prompt]'] : [])] };
    const signal = /^kill (?:(-TERM|-15|-KILL|-9) )?(\d+)$/.exec(trimmed);
    if (signal) {
      const pid = Number(signal[2]);
      if (pid === this.state.pid) return this.terminate(signal[1] === '-KILL' || signal[1] === '-9');
      if (pid >= 3087 && pid < this.nextPid) return { tone: 'error', lines: ['That legacy PID has ended. ps lists its current replacement.'] };
    }
    return null;
  }
}
