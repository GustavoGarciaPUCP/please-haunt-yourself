/**
 * Original code-native artwork. No external images, fonts or sound files are required.
 * Codex drew the first ghost silhouette and the three card icons. The Kiro IDE task17 pass separated the ghost's
 * eyes/mouth/lips for hushed and shadow states and added the scene bell, doorway and moon.
 * No gradient or filter IDs: the shell and the room each hold a copy, and duplicate IDs inside a
 * hidden view can fail to paint.
 */
export const SPECTER = `<svg class="specter-art" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
  <ellipse class="specter-floor" cx="122" cy="224" rx="62" ry="8" fill="#000" opacity=".32"/>
  <g class="specter-figure">
    <path class="specter-body" d="M58 208q5-33 17-57-11 9-25 11 16-24 19-55 2-54 47-65 45-9 58 32 7 24 2 50 15 26 29 34-18 6-32-9 9 37 20 62l-29-13-12 19-26-13-23 15-18-16z" fill="currentColor"/>
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
    <path class="bell-tie" d="M15 57q25 11 50 0M35 61l-5 18M45 61l5 18" fill="none" stroke="#c9b0dd" stroke-width="3" stroke-linecap="round"/>
  </g>
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

export const NOTE_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M15 8h29l7 9v39H15z" fill="currentColor" opacity=".22"/><path d="M15 8h29l7 9v39H15zM44 8v12h7M23 29h18M23 36h14M23 43h17" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
export const WHISPER_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 29q15-17 28 0-13 17-28 0z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 39q19 17 40 0M9 46q25 19 46 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/></svg>`;
export const BELL_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M28 13a4 4 0 1 1 8 0M17 44q6-7 6-20a9 9 0 0 1 18 0q0 13 6 20z" fill="currentColor" opacity=".2"/><path d="M28 13a4 4 0 1 1 8 0M17 44q6-7 6-20a9 9 0 0 1 18 0q0 13 6 20zM27 49q5 8 10 0M14 20l-5-5M50 20l5-5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></svg>`;
