# Visual precision and QA of the v5 route (v6) — design

Kiro IDE session, November 9, 2026. Implements `requirements.md` on the v5 code. No new dependency, storage key or program; the save stays `haunt.case.v4` and the fictional OS stays HAUNT OS 4.

## 1. The note inside its paper (R1) — `glass-render.ts`

**Measured text.**
- `measureInk(text, family)` measures at a 100 px reference with `measureText`'s actual bounding box: left and right bearings, ink ascent and descent, in em. Results are cached per resolved font string (the canvas `font` getter), so a simulated fallback is measured as what it is.
- `drawInk(ctx, text, x, y, size, family)` draws at the same 100 px reference under a `size / 100` scale. Shaping is then identical to the measurement at every output size, and small-size hinting cannot move the words.

**`layoutNote(paper, fragment, signature, measure)`** is a pure function: the measurer is passed in, so unit tests use synthetic fonts.
- **Inner box:** the paper minus margins of 7 % of its width and 10 % of its height.
- **Size:** the fragment is wrapped greedily by words, never inside `PER—`. The size is the largest from 7.5 down to 3.5 logical px (steps of 0.1) at which every line's ink, at most three lines, and the signature fit.
- **Signature:** about 0.66 × the size, in the UI font, as in TERMINAL's own note.
- **Placement:** each line's ink starts at the inner left edge (the bearing is compensated). The first line's ink top touches the inner top, the signature's ink bottom touches the inner bottom, with a minimum gap above it.
- **Result:** in Segoe Print it gives "FOR THE NEXT" / "PER—", then the signature — the same shape as TERMINAL's scene note.

**Drawing.**
- The paper stays at (28, 146) in the 320×200 session space, 70×34, rotated −0.05 rad.
- New: a soft shadow and faint rules under the lines, as TERMINAL's note has.
- The text is drawn inside a clip to the paper. The clip is only a guard: the check replays text without clips.
- Colours: the lines in `#2b2520`, the signature in `#5f5547`, as in TERMINAL.

**Unchanged.** The header text, the bell, the cord, the doorway and the figure.

## 2. The monitor: status beside the image, not on it (R2) — `echo-view.ts`, `desktop.css`

**Structure.** `.echo-monitor` becomes a column:
- a status bar (`.echo-monitor-bar`) with the transport on the left (`● LIVE · last.session`, `Ⅱ PAUSED · last.session`, `◎ GLASS · behind this window`) and the return flash on the right;
- then the viewport (`.echo-viewport`, 16:10), which holds the canvas.

The monitor's width is `min(100cqw, (100cqh − bar − 3 px) × 1.6)`, so the image keeps 16:10 and the bar costs 29 px of height (the 26 px bar, its border and the monitor's).

**The glass viewfinder.** `frameRect()` is the canvas's own rectangle, so the viewfinder still shows exactly the glass behind the canvas.

**Ghost line.**
- The session drawing exports its quiet zone, `SESSION_QUIET`, where it never paints: x 8–112, y 20–96 of 320×200. This is left of the cord and figure, between the header and the note.
- The ghost line is positioned in that zone, in viewport percentages, with a font size relative to the viewport (`cqw`, clamped 11–20 px).
- Its box has a padding of 0.2 em × 0.3 em. The italic hand's overhangs (the tail of a line-initial "p") fall inside the padding, so the box's `overflow: hidden` stays a guard and cuts no letter (finding H).

**Corner marks.** They move to the viewport and appear only for the glass source.

**Capture editor.** The "Picture" label is hidden for negatives that have no frame to move (session, limited).

**Coherence.** The transport state is never drawn into the image, so captures are unchanged. The recorded minute stays in the image's header, and no OS clock is added to the monitor.

## 3. Images sized by their real aspect (R3) — `frame-editor.ts`, `canvas-view.ts`

- `FrameEditor.show()` sets the CSS custom property `--aspect` from the negative's extent, instead of an inline `aspect-ratio`. The CSS width formula and the aspect ratio then agree for session (1.6), limited and every stage size.
- CANVAS's preview sets `--aspect` from `LETTER_ASPECT` (1.62 Beside, 0.82 Below), so the Below letter fits its stage.
- **Lift and Recover (finding I), `drawLetter`.** The baselines are computed first. The animation's drift (the words settle from up to 1.2 em lower) is bounded by the room left under the block's measured ink (`actualBoundingBoxDescent` of each line) inside the note area. Beside, where the block is centred, the words still settle from lower; Below, where the block nearly fills the note, the drift is a few pixels and the animation is mostly the fade. The final layout is unchanged.

## 4. Words for what is seen (R4) — `echo-view.ts`, `letter-model.ts`, `canvas-view.ts`, `postman-view.ts`, `case-store.ts`

**ECHO, session source (Live and capture head):**
- **Chips:** [`The figure, repeating` | `A shadow` | `No figure`], `Unfinished note` (on), `No handprint`.
- **Capture titles:** `The same minute`, `A shadow in the window`, `The note left behind`.
- **Verdict:**
  - Before the minute ends: "TERMINAL’s session window: its note stops at “PER—”. No handprint."
  - After: "TERMINAL’s session window after the minute: the figure has gone; the note still stops at “PER—”. No handprint."
- **Ghost line in the capture after the minute** (the same line the Live caption ends with): "Only the note is left here. The mark is on the glass."

**CANVAS:**
- **Writing layer:** "Only the unfinished note, as TERMINAL shows it. The letter needs Mara’s whole note." (session); "This old picture kept no writing." (limited); "The glass had no writing yet when this was captured." (bare glass).
- **Readiness line** for a session letter: "This capture is TERMINAL’s session window: its note stops at “PER—”, and there is no handprint. Use a capture of the glass from ECHO."

**Incompleteness reasons.** `missingPhrases(kind, missing, attached)` gives the short reasons for a letter's own kind. POSTMAN uses it in the attachment caption, the confirmation and the receipt; TERMINAL in `receiptMessage`.
- Session: "the picture is TERMINAL’s window, not the glass"; "its note stops at “PER—”".
- No letter attached: "no letter is attached".
- Glass: the v5 reasons ("the picture shows only mist", "the writing is still in the mist", …).

No text names Stop the call. Provenance is untouched.

## 5. Checks (R5, R6)

**`scripts/drawn-text-audit.mjs`.**
- **Probe (init script).** It records every `fillText`/`strokeText`, with transform, font, alignment and composite, and the canvas it lands on. It carries text through `drawImage` from offscreen layers. It marks text on layers later masked by a destructive composite (the figure made of its own output, the writing cut into the mist): that text is shaped on purpose and is not ink.
- **Audit.** Each run is replayed alone, without clips, on a scratch canvas: its ink pixels. Dark words are compared with the largest light region touching them in the canvas pixels (the paper, as a convex outline). Light words are compared with the canvas edges.
- **Pictures and covering.** Pictures drawn into the same canvas (a letter's photograph) are obstacles. Elements of the same window painted over the ink are found with pointer events forced on, including `::before` and `::after` of the canvas's ancestors.
- **Reported kinds:** `ink-outside-paper`, `ink-tight-margin`, `ink-outside-canvas`, `ink-over-image`, `drawn-text-covered`.

**`layout-audit.mjs`, new kind `text-covered`.**
- **What it reports:** text with something of its own window painted over it — a background, a border, text or a picture. Only the part of the text that is not scrolled away counts.
- **Not reported:** menus and dialogs opened inside the window; letters of the same line touching; the figure's texture.

**The checks.**
- **`check:drawn` (new):**
  - the audits on every surface above, at three sizes, DPR 1 and 2, and two Windows scaling configurations (DPR 1.25 and 1.5), the window minimums and maximized, plus four simulated fallbacks;
  - the paused ghost line from Chrome's own pixels, four screenshots each time (shown, hidden, without its glow, without its glow or its clip): its footprint must lie on the session window's bare wall, and its box must cut no glyph. This uses none of the app's zone numbers;
  - CANVAS's Lift stepped frame by frame with Playwright's fake clock (`page.clock`), each frame audited;
  - the wording, the status bar's geometry and the Below letter's fit and clickable Compose.
- **`check:paths` (new):**
  - an early correct Bell action with zero returns and no bell scheduled, then the whole case;
  - programs opened before their material, and an empty early delivery that TERMINAL refuses;
  - Force with and without the call, the shadow in TERMINAL and ECHO, and its recovery;
  - Pause versus the process: the paused picture, the capture made then and the live picture after Resume, read from the canvas calls (PID 3087 and 3088);
  - a wrong source, then an explicit replacement of the letter's source, Keep, Replace, Undo and Redo;
  - lost writing after a reload, recovered with frame, paper and layout kept;
  - an empty or unknown recipient, the delivery, the end, and a copy after the end;
  - every named state audited for layout and drawn text.
- **`review:v6`:** the v5 route plus the new states. It runs the drawn-text audit on every screenshot.
- **`v6-baseline.mjs`:** reruns as the "after" probe.
- **`v6-compare.mjs`:** puts the before and after screenshots and crops side by side.
