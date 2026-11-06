/** Bounded spectral handwriting. The letters are decorative; callers keep accessible text elsewhere. */
const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
export const prefersReducedMotion = (): boolean => motion?.matches ?? false;

const LETTER_DELAY_MS = 42;
/** Caps the stagger so a reveal always ends in under two seconds, whatever the text length. */
const MAX_STAGGERED_LETTERS = 30;

/**
 * Writes `text` into `target`. When animated, each letter fades in once with a staggered delay; nothing repeats,
 * focus is never moved and no live region is touched. With reduced motion (or `animate = false`) the complete
 * text appears immediately.
 */
export function writeGhostly(target: HTMLElement, text: string, animate: boolean): void {
  target.replaceChildren();
  if (!animate || !text || prefersReducedMotion()) {
    target.textContent = text;
    return;
  }
  let index = 0;
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { target.append(part); continue; }
    const word = document.createElement('span');
    word.className = 'ghost-word';
    for (const character of part) {
      const letter = document.createElement('span');
      letter.className = 'ghost-letter';
      letter.textContent = character;
      letter.style.animationDelay = `${Math.min(index++, MAX_STAGGERED_LETTERS) * LETTER_DELAY_MS}ms`;
      word.append(letter);
    }
    target.append(word);
  }
}
