/**
 * Owns the Web Animations a TERMINAL view starts, so the newest state can cancel stale cue work.
 * CSS transitions are state-driven and need no owner; only script-started motion is tracked here.
 */
export class CueSet {
  private readonly running = new Set<Animation>();

  play(target: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions): void {
    if (!target) return;
    const animation = target.animate(keyframes, options);
    this.running.add(animation);
    // Cancelling rejects `finished`; handle both outcomes so a cancel never becomes an unhandled rejection.
    animation.finished.then(() => this.running.delete(animation), () => this.running.delete(animation));
  }

  cancel(): void {
    for (const animation of this.running) animation.cancel();
    this.running.clear();
  }

  get size(): number { return this.running.size; }
}
