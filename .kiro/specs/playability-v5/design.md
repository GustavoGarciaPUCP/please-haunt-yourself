# Playability and a visible ending (v5) — design

Kiro IDE session, November 8, 2026. Implements `requirements.md` on the v4 code. No new dependency, storage key or program; `haunt.case.v4` stays the save format.

## 1. Retention (R1) — `mail-model.ts`, `case-store.ts`, `postman-view.ts`

- **Accepted delivery.** `MailModel` learns which delivery the job accepted with `accept(id)`. The case store calls it in `finish()`, and on load from the saved acknowledgment. `startRun()` clears it. The mail's own saved form does not change, because the acknowledgment is already in the case save.
- **Eviction.** Past 12 deliveries, the oldest are removed **except** the intended and the accepted delivery. At most one id is protected at a time (after acceptance, intended = accepted), so the bound always holds. `parseMail` and `parseCaseSave` keep rejecting unresolved references.
- **After acceptance.** A send to guest:
  - never asks to replace and never moves `intended`;
  - still creates its receipt, as every guest delivery does;
  - is stored as a copy.
- **Standing.** `standing(delivery)` gives one word per delivery: `accepted`, `intended`, `replaced` (superseded before acceptance), `copy` (sent after acceptance), `returned` or `archived`. POSTMAN's badges and texts use it. `isReplaced` becomes a wrapper.
- **Wording.**
  - Draft after the end: "The job already accepted your letter. Sending again delivers another copy; the accepted letter stays as it was."
  - A copy's badge: *Copy* — "Another copy, sent after the session finished. The job keeps the letter it accepted."

## 2. Recovery and the CANVAS decision (R2, R5) — `letter-model.ts`, `canvas-view.ts`, `glass-render.ts`

**Model.**
- `recoverWriting()`: when the writing is `lost` and the draft's own source has writing, it becomes `paper` (one undoable edit, change `recover`). Frame, mist, paper and layout are unchanged. With no captured writing it does nothing.
- `removeWriting()` and its button are removed.
- `MISSING_TEXT['writing-lost']` becomes "The writing went with the mist. Recover it from the capture."
- `keepPreview(draft, mist)` is a pure helper. It returns the subjects at that mist level and whether the writing still in the mist would be lost.
- `KEEP_LEVELS = [1, 0.4, 0]`.

**Writing section.** One primary action at a time:
- *Lift the writing* (in the mist);
- nothing to do (on the paper, verbatim);
- *Recover the writing* (lost);
- *Open ECHO's captures* (the source has no writing).

Pointing at *Lift the writing* or *Recover the writing*, or reaching it with the keyboard (`:focus-visible`), outlines the captured lines in the preview's photograph and draws a dashed place for them on the paper. Focus that CANVAS itself moves to Lift on opening does not count. The model is unchanged until the button is pressed. Pressing it plays the existing 600 ms lift: the lines rise onto the paper.

**Photograph section.** It replaces the separate Mist and Photo sections.
- **The choice.** A radio group, "The photograph keeps", shows its three options as a row of presets: mist 100 %, 40 % and 0 %.
  - Each preset is a thumbnail rendered from the letter's own capture at that mist. Its caption names the subjects actually present: Handprint / Handprint and figure / Figure / Only mist.
  - Pointing at a preset previews it in the large letter without choosing it. Arrow keys move through the presets, as with any native radio group.
- **The warning.** While the writing is still in the mist, a line under the row says "No mist would take the writing with it." The 0 % input is described by it.
- **Finer control.** The *Mist* slider stays below. *Reframe…* is in the section's heading row.
  - A slider value between the levels selects no preset, which is honest.
- **Session-window captures.** They show TERMINAL, not the glass, so the choice and the slider are hidden and a note says there is no mist to keep or clear.

**Readiness line.** It names the photograph's subject and the words, for example "Ready: the photograph keeps the handprint, and Mara's words are on the paper." Each instruction names an action available to this letter: a session-window capture, or a fixed v3 print, points to ECHO's captures rather than to Reframe….

**Render.** `drawLetter` options:
- `highlightWriting` outlines the writing boxes inside the photograph;
- `placeholder` draws the dashed note area.

Both are used only by CANVAS's own preview. Deliveries render without them.

## 3. Adaptive layouts (R3) — `desktop.css`, `window-geometry.ts`, `scroll-region.ts`, `layout-audit.mjs`

**Containers.**
- `.terminal-app` and `.echo-app` become size containers (`container-type: size`; their size comes from the window).
- Height queries compact the chrome: the job strip in the session view, the pane header and the footer.
- They also shrink the scene to a floor and turn the inspector into `auto / minmax(0, 1fr) / auto` rows. Its text scrolls and its actions stay visible.
- Width queries drop the recorded date (the time stays) and let the job row and footers wrap.

**ECHO Captures.** The detail column becomes a scroll region, and the list column narrows in small containers.

**Scroll regions.** `scrollRegion(element, label)` gives a region `tabindex=0`, `role=region` and a label only while it actually overflows, so keyboard users can scroll it. Chrome makes such scrollers focusable on its own, but this does not rely on it.

**Minimum sizes.** They change only if the adaptive layout cannot keep the scene readable. Measured results are recorded in tasks.md.

**Audit.** A control partly cut by a region that really scrolls (overflow auto or scroll, scrollHeight > clientHeight) is reachable, so it is not reported as covered or outside its window. Everything else is unchanged.

## 4. Orientation (R4) — `case-phase.ts`, `legacy-session.ts`, `postman-view.ts`

- **Repeating.** `pending` becomes "Find out what keeps bringing it back." The question, hint and answer levels are unchanged; the answer is the only place that says Stop the call.
- **Are you okay?** "…something pulls it back to the start of the same minute."
- **POSTMAN suggestions.**
  - `mara@haunt` — "Mara · last signed in 31 Oct 1987";
  - `guest@haunt` — "guest · signed in now".
- **Recipient status.** The line under the toolbar that said "To the next person at this desk" while typing is removed. The chosen suggestion shows as pressed.
- **Unchanged.** "To guest@haunt (you, at this desk)" after delivery, the Recovered · 1987 message, phase help and TERMINAL's final line.

## 5. The visible ending (R6) — `glass-model.ts`, `terminal-view.ts`, `desktop.ts`, `desktop.css`

**`handRegion(placement, stage)`.** A 16:10 box around the hand, extended towards the figure: width 0.5 × stage height, centre 0.12 h outward from the hand and 0.03 h above it, clamped to the stage. These replace the first estimate (0.56 h, 0.07 h, 0.02 h), which cut the ends of the written lines on the hand's other side. The box holds the whole print, the figure's head and the reaching arm.

**Receipt card.**
- **When.** With a receipt ready, the card holds two figures above its text: *The glass, live* (a canvas drawing `drawGlass` of `handRegion` from the shared `GlassSurface`) and *Your letter* (the delivered snapshot).
- **Redraw.** The canvas redraws on `glassView.onDraw`, so wipes, the reveal and the release match the desktop frame for frame.
- **Finish session.** Unchanged: the model commits, then `GlassView` starts the release (450 ms, then 1400 ms). The card's glass plays it at the same progress and ends on the clear night, captioned "The glass is clear."
- **Reload, reduced motion, hidden page.** They draw the final state.
- **Refused receipts.** They show the letter only.

**Layout.** The card's text and Finish session come first, then `.receipt-media`: the two figures side by side, wrapping if needed. Both images keep their aspect ratios (16:10 and the letter's).

**Sizing.** The images are 104 px high (124 px when finished). In a short TERMINAL (content under 560 px) they are 68 px. In a large one (at least 640×640) they are 120 px (150 px when finished).

**Finished text.** It names what the delivered photograph keeps, from the delivered snapshot: "Its photograph keeps the handprint."

**Wiring.** `TerminalController` receives `{ glassView }` from `desktop.ts`, as ECHO already does.

**Also changed while reviewing.**
- **Transcript.** It stays pinned to its last line across resizes when it was showing it.
- **Letter text.** It has no 6 px floor, so a thumbnail letter keeps its words on the paper.
- **Build identifier.** It is v5: the meta tag and About show "HAUNT OS 4 · build v5". The fictional OS keeps its name.

## 6. Checks and tests (R7, R8)

**Unit tests.**
- Retention before and after acceptance, the 12 bound, standing, sends after acceptance, and save round trips after a flood.
- Recovery (lines verbatim, other edits kept, nothing gained without writing).
- `keepPreview` captions and loss flags.
- The repeating copy never naming the answer before help.
- `handRegion` containing the hand inside the stage.

**Browser checks.**
- `check:letter`: lost writing → reload → Recover the writing (scenario B); the keep choices change the delivered picture.
- `check:case`: the 13-send flood before and after Finish, then reload (scenarios A1 and A2); the receipt's glass view and the release, including reload mid-release and reduced motion.
- `check:keys` (new): the whole route with natural keys only, counting presses per step.
- `review:v5` (new): default, minimum, maximized and unusual placements at 1366×768, 1440×900 and 1920×1080, every inspector page and confirmation, with the layout audit and screenshots.
- `v5-baseline.mjs` reruns on the new build as the "after" comparison.
