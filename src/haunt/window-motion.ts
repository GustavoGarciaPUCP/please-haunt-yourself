/** Native window transitions. Epochs keep canceled completions from changing a newer request. */
export type MotionPreference = "full" | "reduced";
interface AnimationHandle { cancel: () => void; finished: Promise<void> }
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const epochs = new WeakMap<HTMLElement, number>();
let preferenceChangeCallback: (() => void) | null = null;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export function getPreference(): MotionPreference { return motionQuery.matches ? "reduced" : "full"; }
export function onPreferenceChange(callback: () => void): void { preferenceChangeCallback = callback; }
motionQuery.addEventListener("change", () => preferenceChangeCallback?.());

function nextEpoch(element: HTMLElement): number {
 const epoch = (epochs.get(element) ?? 0) + 1;
 epochs.set(element, epoch);
 return epoch;
}

/** Preserve the current painted pose before reversing a transition. */
export function cancelAllAnimations(element: HTMLElement): void {
 nextEpoch(element);
 const pose = getComputedStyle(element);
 const opacity = pose.opacity;
 const transform = pose.transform;
 element.getAnimations().forEach(animation => animation.cancel());
 element.style.opacity = opacity;
 element.style.transform = transform === "none" ? "" : transform;
 element.style.willChange = "";
}

function setOrigin(element: HTMLElement, trigger: HTMLElement | null): void {
 // Retain the origin while reversing an interrupted motion to avoid a visual jump.
 if (element.style.transformOrigin) return;
 const rect = element.getBoundingClientRect();
 const target = trigger?.getBoundingClientRect();
 element.style.transformOrigin = target
  ? `${target.left + target.width / 2 - rect.left}px ${target.top + target.height / 2 - rect.top}px`
  : "center bottom";
}

function transition(element: HTMLElement, showing: boolean, duration: number, hiddenTransform: string): AnimationHandle {
 const epoch = nextEpoch(element);
 const settle = (): void => {
  if (epochs.get(element) !== epoch) return;
  element.style.opacity = showing ? "1" : "0";
  element.style.transform = "";
  element.style.willChange = "";
 };
 if (motionQuery.matches) {
  settle();
  return { cancel: () => { nextEpoch(element); }, finished: Promise.resolve() };
 }
 const pose = getComputedStyle(element);
 const from = {
  opacity: Number(pose.opacity),
  transform: pose.transform === "none" ? (showing && Number(pose.opacity) === 0 ? hiddenTransform : "none") : pose.transform
 };
 element.style.willChange = "transform, opacity";
 const animation = element.animate([from, {
  opacity: showing ? 1 : 0,
  transform: showing ? "none" : hiddenTransform
 }], { duration, easing: EASE_OUT, fill: "forwards" });
 return {
  cancel: () => { nextEpoch(element); animation.cancel(); element.style.willChange = ""; },
  finished: animation.finished.then(() => {
   if (epochs.get(element) === epoch) settle();
   animation.cancel(); // The settled inline pose owns the result; no persistent fill effect.
  }).catch(() => { /* The next requested operation owns the element. */ })
 };
}

export function animateOpen(element: HTMLElement, trigger: HTMLElement | null): AnimationHandle {
 setOrigin(element, trigger);
 return transition(element, true, 240, "scale(0.94) translateY(12px)");
}
export function animateClose(element: HTMLElement): AnimationHandle {
 return transition(element, false, 160, "scale(0.97) translateY(6px)");
}
export function animateMinimize(element: HTMLElement, trigger: HTMLElement | null): AnimationHandle {
 setOrigin(element, trigger);
 return transition(element, false, 180, "scale(0.9) translateY(8px)");
}
export function animateRestore(element: HTMLElement, trigger: HTMLElement | null): AnimationHandle {
 return animateOpen(element, trigger);
}
