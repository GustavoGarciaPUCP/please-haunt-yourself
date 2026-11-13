/**
 * Original code-native artwork. No external images, fonts or sound files are required.
 * Codex drew the first ghost silhouette and the three card icons. The Kiro IDE task17 pass separated the ghost's
 * eyes/mouth/lips for hushed and shadow states and added the scene bell, doorway and moon. The Kiro IDE v3 pass
 * exported the body path for the desktop glass and ECHO and added the bell's cloth and the call's cord.
 * No gradient or filter IDs: the shell and the room each hold a copy, and duplicate IDs inside a
 * hidden view can fail to paint.
 */
/** The ghost's body outline (viewBox 240×240). v3 also draws it on the desktop glass and in ECHO, so it is the same apparition everywhere. */
export const SPECTER_BODY = 'M58 208q5-33 17-57-11 9-25 11 16-24 19-55 2-54 47-65 45-9 58 32 7 24 2 50 15 26 29 34-18 6-32-9 9 37 20 62l-29-13-12 19-26-13-23 15-18-16z';
export const SPECTER = `<svg class="specter-art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
  <ellipse class="specter-floor" cx="122" cy="224" rx="62" ry="8" fill="#000" opacity=".32"/>
  <g class="specter-figure">
    <path class="specter-body" d="${SPECTER_BODY}" fill="currentColor"/>
    <path class="specter-sheen" d="M108 57q-21 14-21 43m51-46q17 9 21 28" fill="none" stroke="#f4f7ec" opacity=".38" stroke-width="3" stroke-linecap="round"/>
    <g class="specter-eyes">
      <ellipse cx="108" cy="102" rx="7.5" ry="12.5" fill="#132226"/>
      <ellipse cx="137" cy="104" rx="7.5" ry="12.5" fill="#132226"/>
      <circle class="specter-glint" cx="110.5" cy="97" r="2.2" fill="#e9f3ff"/>
      <circle class="specter-glint" cx="139.5" cy="99" r="2.2" fill="#e9f3ff"/>
    </g>
    <ellipse class="specter-mouth" cx="121" cy="137" rx="7" ry="11" fill="#2b3833"/>
    <path class="specter-lips" d="M112 138q9 1.2 18 0" fill="none" stroke="#2b3833" stroke-width="3.2" stroke-linecap="round"/>
    <path class="specter-folds" d="M90 169q-5 15-2 22m64-26 6 20" stroke="#667f77" stroke-width="2" fill="none" opacity=".45"/>
  </g>
</svg>`;

/** A shop-door bell: it hangs above the way out and rings whenever someone leaves. */
export const SCENE_BELL = `<svg class="scene-bell-art" viewBox="0 0 80 100" aria-hidden="true" focusable="false">
  <path class="bell-bracket" d="M20 5h40M40 5v13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".7"/>
  <g class="bell-waves" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M13 42q-6 11 0 22M6 36q-10 17 0 34"/>
    <path d="M67 42q6 11 0 22M74 36q10 17 0 34"/>
  </g>
  <g class="bell-swing">
    <path class="bell-body" d="M40 18c-12 0-18 9-18 21 0 14-3 21-9 27h54c-6-6-9-13-9-27 0-12-6-21-18-21z" fill="currentColor" fill-opacity=".24" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path class="bell-rim" d="M11 66h58" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle class="bell-clapper" cx="40" cy="75" r="5.5" fill="currentColor"/>
    <!-- v3: a cloth wrapped round the clapper when the bell is muffled (the call still pulls; only the ring stops). -->
    <g class="bell-cloth"><path d="M22 58q18 9 36 0l3 12q-21 9-42 0z" fill="#c9b8a0" stroke="#7d6a58" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M40 66l-6 16 6-4 6 4z" fill="#c9b8a0" stroke="#7d6a58" stroke-width="1.2" stroke-linejoin="round"/></g>
  </g>
</svg>`;

/** v3: the cord that runs from the bell to the job (the call). Drawn across the room scene; unhooked when the call stops. */
export const CALL_CORD = `<svg class="scene-cord-art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path class="cord-hooked" d="M86 9C70 30 40 22 22 62" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.2 1.6" vector-effect="non-scaling-stroke"/>
  <path class="cord-loose" d="M22 62C24 50 30 44 33 52C35 58 31 63 29 68" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.2 1.6" vector-effect="non-scaling-stroke"/>
</svg>`;

export const DOORWAY = `<svg class="scene-door-art" viewBox="0 0 90 170" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
  <path class="door-glow" d="M14 170V58a31 31 0 0 1 62 0v112z" fill="currentColor" fill-opacity=".09"/>
  <path class="door-frame" d="M8 170V56a37 37 0 0 1 74 0v114" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".75"/>
  <path class="door-inner" d="M14 170V58a31 31 0 0 1 62 0v112" fill="none" stroke="currentColor" stroke-width="1" opacity=".35"/>
  <path class="door-step" d="M0 168h90" stroke="currentColor" stroke-width="2" opacity=".5"/>
</svg>`;

export const MOON = `<svg class="scene-moon-art" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
  <circle cx="30" cy="30" r="22" fill="#f0c47a"/>
  <circle cx="22" cy="24" r="4" fill="#d6a45a" opacity=".55"/>
  <circle cx="36" cy="35" r="6" fill="#d6a45a" opacity=".45"/>
  <circle cx="33" cy="19" r="2.4" fill="#d6a45a" opacity=".5"/>
</svg>`;

/**
 * v4 (.kiro/specs/os-case-v4 R8): the presence is made of its own output. A faceless standing figure (viewBox 100×240,
 * both subpaths wound the same way so they unite) is filled with repeated lines of what the session keeps printing.
 * TERMINAL's scene masks HTML text with it; the glass and ECHO clip canvas text to the same outline.
 */
export const FIGURE_VIEW = { w: 100, h: 240 } as const;
export const FIGURE_PATH = 'M50 12C41 12 36 20 36 30C36 41 42 48 50 48C58 48 64 41 64 30C64 20 59 12 50 12Z'
  + 'M45 46L44 55C36 56 28 58 24 64C21 69 20 80 19 96C18 112 17 128 16 142C16 147 21 148 22 143C24 128 26 112 29 98L31 86C32 100 33 112 32 124'
  + 'C29 150 24 186 20 228C30 233 40 230 50 233C60 230 70 233 80 228C76 186 71 150 68 124C67 112 68 100 69 86L71 98C74 112 76 128 78 143'
  + 'C79 148 84 147 84 142C83 128 82 112 81 96C80 80 79 69 76 64C72 58 64 56 56 55L55 46Z';
/** The torso and head only: on the glass the arm is drawn separately, from the shoulder to the pressed palm. */
export const FIGURE_TORSO_PATH = 'M50 12C41 12 36 20 36 30C36 41 42 48 50 48C58 48 64 41 64 30C64 20 59 12 50 12Z'
  + 'M45 46L44 55C36 56 28 58 24 64C22 70 25 80 30 86L31 86C32 100 33 112 32 124C29 150 24 186 20 228C30 233 40 230 50 233C60 230 70 233 80 228'
  + 'C76 186 71 150 68 124C67 112 68 100 69 86L70 86C75 80 78 70 76 64C72 58 64 56 56 55L55 46Z';
/** The figure's outline as a CSS mask (TERMINAL's scene), so its text never spills outside the body. */
export const FIGURE_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 240'><path d='${FIGURE_PATH}'/></svg>`)}")`;
/** What the presence is made of. */
export const PRESENCE_TEXT = "I'll finish in a minute.";
/** The scene's figure: the mask comes from the `--figure-mask` property the desktop sets once on the document. */
export function presenceMarkup(): string {
  return `<span class="presence" aria-hidden="true"><span class="presence-lines">${`${PRESENCE_TEXT} `.repeat(70)}</span></span>`;
}

export const NOTE_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M15 8h29l7 9v39H15z" fill="currentColor" opacity=".22"/><path d="M15 8h29l7 9v39H15zM44 8v12h7M23 29h18M23 36h14M23 43h17" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
export const WHISPER_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 29q15-17 28 0-13 17-28 0z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 39q19 17 40 0M9 46q25 19 46 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/></svg>`;
export const BELL_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M28 13a4 4 0 1 1 8 0M17 44q6-7 6-20a9 9 0 0 1 18 0q0 13 6 20z" fill="currentColor" opacity=".2"/><path d="M28 13a4 4 0 1 1 8 0M17 44q6-7 6-20a9 9 0 0 1 18 0q0 13 6 20zM27 49q5 8 10 0M14 20l-5-5M50 20l5-5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></svg>`;
