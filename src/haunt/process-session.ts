/**
 * The game console's shared syntax. Every command is local fiction: nothing typed here ever reaches the host
 * operating system, and text is rendered as text, never evaluated. Case-specific commands live in LegacySession.
 * v3 retired the watchd/mirror.watch processes of the old ECHO rehearsal; v4 adds `finish` and `open <program>`.
 */
export type ProgramName = 'terminal' | 'echo' | 'canvas' | 'postman';
export interface ConsoleResult {
  lines: string[];
  tone: 'normal' | 'success' | 'warning' | 'error';
  action?: 'clear' | 'open';
  app?: ProgramName;
}

/** One command at a time, bounded length; shell metacharacters are refused rather than interpreted. */
export const isRefusedInput = (command: string): boolean => command.length > 200 || /[;&|`<>\n\r]/.test(command);

export const HELP: readonly string[] = [
  'Commands are part of this game. Nothing here reaches your computer.',
  '',
  'ask status              how TERMINAL is doing (also: ask are you okay)',
  'ask who was here        whose session this is',
  'cat last.job            the job that was left open',
  'jobs                    the job, its retry and its progress',
  'ps                      what is running',
  'inspect last.session    the same job in technical terms',
  'enter last.session      look inside the session',
  'kill [-TERM|-KILL] PID  signal the current run of last.session',
  'echo <text>             see whose words come back',
  'finish                  accept the receipt for this job (Finish session)',
  'open echo|canvas|postman  open another program',
  'clear                   clear this transcript (Ctrl+L)',
  'ArrowUp / ArrowDown: command history.',
];

const PROGRAMS: Readonly<Record<string, ProgramName>> = { terminal: 'terminal', echo: 'echo', canvas: 'canvas', postman: 'postman' };

/** Commands every console understands, whatever the case state. Unknown input gets a plain error. */
export function baseCommand(command: string): ConsoleResult {
  const trimmed = command.trim();
  const error = (message: string): ConsoleResult => ({ tone: 'error', lines: [message] });
  if (!trimmed) return { tone: 'normal', lines: [] };
  if (isRefusedInput(trimmed)) return error('One game command at a time. Type help for the supported syntax.');
  if (trimmed === 'help') return { tone: 'normal', lines: [...HELP] };
  if (trimmed === 'clear') return { tone: 'normal', lines: [], action: 'clear' };
  const open = /^open (\w+)$/i.exec(trimmed);
  if (open) {
    const app = PROGRAMS[open[1]!.toLowerCase()];
    if (!app) return error('There is no program by that name here. Try open echo, open canvas or open postman.');
    return { tone: 'normal', lines: [`Opening ${app.toUpperCase()}.`], action: 'open', app };
  }
  if (trimmed === 'restore terminal' || trimmed === 'restore terminal --confirm') return { tone: 'warning', lines: ['To start the whole case over, choose Start the case over… in the HAUNT menu.'] };
  if (/^kill\b/.test(trimmed)) return error('Usage: kill [-TERM|-KILL] <PID>. Run ps to see the current run of last.session.');
  return error('Unsupported command. Type help for the game console’s commands.');
}
