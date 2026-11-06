/**
 * Optional audible terminal bell, like a terminal's "audible bell" preference. It is off by default and
 * enabled only by an explicit button press. The visual bell is always shown, so nothing depends on hearing.
 * The chime is synthesized; no audio files are loaded.
 */
type AudioConstructor = typeof AudioContext;
const AudioCtor: AudioConstructor | undefined = typeof window === 'undefined' ? undefined
  : window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioConstructor }).webkitAudioContext;

let enabled = false;
let context: AudioContext | null = null;

export const terminalBell = {
  supported: AudioCtor !== undefined,
  get enabled(): boolean { return enabled; },
  /** Must be called from a user gesture so the browser allows audio. */
  setEnabled(value: boolean): void {
    enabled = value && AudioCtor !== undefined;
    if (!enabled) return;
    try {
      context ??= new AudioCtor!();
      void context.resume();
    } catch {
      enabled = false;
    }
  },
  /** Schedules one short chime `delay` seconds from now on the audio clock (no timers). */
  ring(delay = 0): void {
    if (!enabled || !context) return;
    const start = context.currentTime + delay;
    for (const [frequency, level] of [[784, 0.05], [1568, 0.018], [2352, 0.008]] as const) {
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
      tone.connect(gain).connect(context.destination);
      tone.start(start);
      tone.stop(start + 1.7);
    }
  },
};
