/**
 * Optional audible terminal bell, like a terminal's "audible bell" preference. It is off by default and
 * enabled only by an explicit button press. The visual bell is always shown, so nothing depends on hearing.
 * The chime is synthesized; no audio files are loaded. Every voice is tracked so it can be silenced,
 * including voices scheduled for the future that have not started yet.
 */
type AudioConstructor = typeof AudioContext;
interface Voice { tone: OscillatorNode; gain: GainNode; }
const AudioCtor: AudioConstructor | undefined = typeof window === 'undefined' ? undefined
  : window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioConstructor }).webkitAudioContext;

let enabled = false;
let context: AudioContext | null = null;
const voices = new Set<Voice>();

function release(voice: Voice): void {
  voices.delete(voice);
  try { voice.tone.disconnect(); voice.gain.disconnect(); } catch { /* Already disconnected. */ }
}

export const terminalBell = {
  supported: AudioCtor !== undefined,
  get enabled(): boolean { return enabled; },
  /** Voices scheduled or sounding; exposed for diagnostics only. */
  get voiceCount(): number { return voices.size; },
  /** Must be called from a user gesture so the browser allows audio. Turning it off silences everything now. */
  setEnabled(value: boolean): void {
    enabled = value && AudioCtor !== undefined;
    if (!enabled) { this.silence(); return; }
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
      const voice = { tone, gain };
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
      tone.connect(gain).connect(context.destination);
      tone.onended = () => release(voice);
      tone.start(start);
      tone.stop(start + 1.7);
      voices.add(voice);
    }
  },
  /** Stops scheduled and sounding voices immediately. Safe to call at any time. */
  silence(): void {
    if (!context) { voices.clear(); return; }
    const now = context.currentTime;
    for (const voice of [...voices]) {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(0, now);
        voice.tone.stop(now);
      } catch { /* A voice that already ended cannot be stopped again. */ }
      release(voice);
    }
  },
};
