# ECHO-01 — first playable entrance

November 6, 2026. Local implementation and verification record. This completes the bounded task13, not the four-tableau game or its competition validation.

## Actual tool contributions

Codex prepared task13, the current authorization/steering update and the geometry acceptance checks. Native Kiro CLI3.1.0 with **Claude Sonnet4.5** read the permitted source and wrote `echo-rehearsal.md`, `echo-scene.ts`, `echo-view.ts` and the first desktop/CSS integration changes. The event stream contains file reads, writes and replacements. No Kiro shell/browser verification is claimed.

The run then exited with a service error: **monthly usage limit reached**. It did not finish normally. Its successful file work is retained in the reviewed result; the failed ending is not presented as a successful completed Kiro task. Private event logs remain outside the repository. No private reasoning, credentials or account identifiers are included here.

Codex reviewed the generated files, repaired the geometry/state boundaries and rebuilt the controller and scene composition. The first pass was not ready to ship: its private view intersected the public stage, making successful coverage impossible, and its panel started beyond the board edge. Three of the five initial geometry tests failed. The window creation path also looked up its controller before registering the window, so ECHO never initialized. Pause/resume, live reduced-motion changes, drag cleanup and Leave semantics needed completion. Codex made those corrections, scoped the styles, reused/refined the WINDOW-01 vector cast, and added repeatable browser checks.

The participant's earlier authorization permits available Kiro models; this run did not use Opus5.5 or a maximum-effort setting. Exact promotional-credit spending remains unknown. The monthly-limit error does not establish whether the participant's promotional balance is exhausted or correctly associated with this CLI session. No plan purchase, account change, dependency installation, publication or submission occurred.

## Implemented encounter

- **Cause:** ECHO is afraid of its own private self-view. The paper host waits on a separate public stage.
- **Intervention:** Move opaque UNINSTALL scenery over the entire private region without covering any of the public footage. Drag, arrow keys, Shift fine adjustment and four directional buttons use the same model coordinates. An alignment aid is available only after opening Help.
- **Consequence:** Rehearse a clearly labeled **Example entrance**. ECHO appears, the host either folds down or scares back, and ECHO smiles or recoils with a different response. The cast is local vector art; no sound or network inference is required.
- **Modes:** Editing permits scenery/reaction changes. Invalid rehearsal reports exposure/obstruction and requires Edit set. Playback freezes editing. Edit preserves the authored placement/reaction while resetting actors. Rehearse again starts from an empty public stage.
- **Exit/recovery:** Leave immediately invalidates the run and clears its timer. Close stops the scene; detached reopen creates a new controller. Minimize/hidden-document events pause at a semantic checkpoint. Restoring/returning never silently resumes. Explicit Resume restarts that checkpoint's short cue duration, rather than claiming frame-exact playback.
- **Motion:** Entrance280ms, host240ms, ECHO response160ms. Reduced motion uses stable poses and50ms semantic checkpoints; a live preference change cannot advance an already paused or departed run. Closing/editing reset without exit choreography.

Current ECHO board coordinates are SVG/screen coordinates (positive y downward), independent of the preserved bridge physics model: board640×410; public rectangle(20,70,380,260); private rectangle(450,70,160,110); opaque panel180×140, initially(430,240). Nested clipped SVG viewports and percentage-positioned scenery match those rectangles at responsive sizes. This supersedes Kiro's unsatisfiable first-pass coordinates, preserved as historical notes in the scope file.

## Executed verification

- Production build and TypeScript checks pass for both HTML entry points.
- `npm.cmd test`: **42 tests pass**: seven new ECHO geometry/edit-boundary tests and35 preserved bridge tests. The old tests do not validate the new game.
- `npm.cmd run check:windows`: **eight checks pass** for actual window motion, cancellation, focus, keyboard/reduced motion and responsive bounds after integration.
- `npm.cmd run check:echo`: **nine browser journeys pass**, with no page errors: invalid exposure; actual pointer/keyboard/click placement and one-unit gaps; public obstruction and both reactions; Leave at all three phases; minimize/explicit resume; close/fresh reopen; simulated hidden-event/pause behavior; live reduced motion; mobile/short-screen controls.

The browser harness uses the existing Playwright library and local Chrome. Visibility coverage deliberately simulates `document.hidden` plus its event; it does not claim an observed real operating-system background-tab transition. Reports and real desktop/mobile captures are generated under ignored `output/playwright/`; scripts and unit tests are tracked. Visual inspection covered the edit state, collapse, scare-back and390×844 composition. A float-serialization assertion was corrected to a small coordinate tolerance; a real reduced-motion CSS override conflict was fixed rather than relaxing its zero-transition assertion.

## Remaining product work

Personal visitor recording, shared replay, CANVAS body construction/source gap, REPLAY decisions, POSTMAN correspondence/access, save/recovery and the connected premiere remain planned. Other taskbar app names are still labels. A completed example rehearsal is not a visitor-policy implementation or finished show.

This is one readable, responsive encounter with two acted consequences. It is not evidence that the whole experience is outstanding or comparable to winners. Human comprehension/enjoyment tests, the multi-scene arc, asset/license review and final submission materials remain pending. The participant's10,000-line suggestion expresses ambition for the complete product; adding padding, duplicate implementations or generated bulk would not resolve those gaps.
