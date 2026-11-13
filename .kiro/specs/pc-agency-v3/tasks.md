# PC agency v3 — tasks

Kiro IDE session, November 6, 2026. A task is marked done only after its check has actually run.

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Baseline: real drag displacement and window geometry at 1366×768, 1440×900, 1920×1080 (`output/playwright/v3-baseline.json`) | R1, R6 | done |
| 2 | Specs: requirements, design, design review, next programs, tasks | all | done |
| 3 | Request model v3 (`legacy-session.ts`) and console (`process-session.ts`) | R2 | done |
| 4 | Glass model (`glass-model.ts`) | R3 | done |
| 5 | ECHO studio model (`echo-studio.ts`) | R4 | done |
| 6 | Case save and migration (`case-save.ts`); `terminal-save.ts` folded in | R5 | done |
| 7 | Drag helpers and controller (`window-drag.ts`) and desktop integration | R1 | done |
| 8 | Glass rendering and desktop view (`glass-render.ts`, `glass-view.ts`) | R3 | done |
| 9 | ECHO studio view (`echo-view.ts`, rewritten); `echo-scene.ts` retired | R4 | done |
| 10 | TERMINAL room and shell v3, presentation copy, guide copy, desktop shell, Session menu | R2, R7 | done |
| 11 | PC CSS, version identifier, taskbar labels | R6, R7 | done |
| 12 | Unit tests (retired tests replaced; see below) | all | done |
| 13 | Browser checks: new `check:drag`; rewrite halloween, echo, console, recovery; update guide; keep windows | all | done |
| 14 | Build, sequential checks against `dist`, PC screenshots, route recording, visual iteration | R3, R6 | done (recording is a frame sequence, see below) |
| 15 | Docs: AGENTS.md status, steering, README, PITCH.md, kiro-usage | R7 | done |

## Future tasks (not in this build; see `next-programs.md`)

| # | Task | Acceptance |
| --- | --- | --- |
| F1 | CANVAS: layered print board, writing separation, crop/mist, compose | C1–C6 |
| F2 | POSTMAN: Mara thread, reply-returns, Guest Inbox delivery, receipt | P1–P6 |
| F3 | TERMINAL acknowledgment, glass release scene, keepsake choice | T1–T5 |
| F4 | `haunt.case.v4` migration | v3 data kept, nothing delivered |

## Verification record (actual commands and results)

All final browser runs used the production build served by the already-running `vite preview` at `127.0.0.1:5174`. Each run started after `npm.cmd run build` had finished, one check at a time. During development this session used its own dev server at `127.0.0.1:5176`.

**Build identity.** After the final build, `/haunt.html` on 5174 referenced `haunt-CnGAsoj1.js` and `haunt-D2WOSIBp.css` and contained `v3-checkpoint` (meta tag and taskbar `data-build`). The paper-bridge assets kept their hashes: `index-CI5aaKki.css` and `index-DtwU5Nqx.js`.

| Command | Result |
| --- | --- |
| `npm.cmd run build` | Passed (tsc + Vite) |
| `npm.cmd test` | 9 files, **84 tests passed**: 50 v3 tests in 6 files plus the 34 unchanged paper-bridge tests |
| `npm.cmd run check:drag` (new) | **12/12**, no page errors |
| `npm.cmd run check:halloween` (rewritten) | **15/15**, no page errors |
| `npm.cmd run check:echo` (rewritten) | **12/12**, no page errors |
| `npm.cmd run check:console` (rewritten) | **7/7**, no page errors |
| `npm.cmd run check:recovery` (rewritten) | **6/6**, no page errors |
| `npm.cmd run check:guide` (updated) | **7/7**, no page errors |
| `npm.cmd run check:windows` (kept) | **8/8**, no page errors |
| `HAUNT_CPU_THROTTLE=4` on halloween, drag, echo, recovery | 15/15, 12/12, 12/12, 6/6 on the final build (also passed on the preceding build) |

Total: **67 browser journeys** on the final build.

**Measured, not estimated:**

- Drag follows the pointer with ≤ 1 px error on every move event at all three PC sizes.
- Pixel difference between ECHO's glass monitor and the desktop glass behind it: 0.41–0.51 of 255 at three framings.
- The milestone reveal was observed for about 2.3–2.7 s from its first drawn frame to the settled state (polling granularity).
- Automated route recording: 55.0 s of scripted input with deliberate pauses (`output/playwright/v3-route-capture.json`). This is not a human play time.

### Retired tests and their replacements

| Retired (v2 or earlier) | Why | Replacement |
| --- | --- | --- |
| `tests/echo-scene.test.ts` (7) | The private-monitor coverage puzzle no longer exists | `tests/echo-studio.test.ts`, `tests/glass-model.test.ts` |
| `tests/process-session.test.ts` (6, watchd/mirror.watch) | Those fictional processes were removed | `tests/process-session.test.ts` (console syntax and drag geometry) |
| `tests/legacy-session.test.ts`, `haunting-presentation.test.ts`, `terminal-experience.test.ts` (v2 endings, hush, keep/fade, v1 save) | Those mechanics were replaced by the letter story | `tests/legacy-session.test.ts`, `tests/haunting-presentation.test.ts`, `tests/case-save.test.ts` (v3) |
| Browser journeys for the old ECHO theatre, watchd console, v2 endings and v2 recovery | Same reasons | `check:echo`, `check:console`, `check:halloween`, `check:recovery` (v3) |

Infrastructure behaviours from the retired journeys were kept and re-asserted:

- Undo cancels cues.
- Live reduced motion cancels within two frames.
- Fake-audio chime cancellation.
- A corrupt save is removed.
- Hidden page and reduced motion stop motion.
- Injection is refused.
- Close and reopen keep state.

### Failures found during this task and fixed

- **Undo stayed enabled after the milestone.** Views rendered before the Undo stack was cleared. The model now commits before it notifies.
- **The reveal was not saved as seen,** so a reload would have replayed it. The glass view now reports `revealSeen` and the desktop saves.
- **The ghost vanished 600 ms into the milestone cue.** The CSS visibility transition beat the cue. The cue now animates `visibility` too.
- **ECHO overflowed the right edge between 1100 and 1320 px.** Its centre is now capped (`min(72%, 100% − half width − margin)`).
- **During guide step 2 on phones, the job card pushed TERMINAL's reply out of view.** The card now hides with the banner during that step.
- **Lines of the note counted as readable when up to 20 % lay outside the frame.** Visible letters were cut while the print said "5 of 5". The threshold is now 95 %.
- **At 1440 and 1920 the monitor barely fitted the note and hand.** ECHO is wider from 1400 px and the note block is slightly smaller.

### Not verified

- No human playtest.
- No audible-sound test (fake AudioContext only).
- No real background-tab transition (simulated `document.hidden`).
- No touch, pen or screen-reader test.
- **The recording is a sequence of 536 real Chrome screencast frames, not a video file.** Playwright's `.webm` recorder needs its separately downloaded ffmpeg binary, which is not installed, and no tools were installed in this task.
- The editorial timing targets (first use 6–9 minutes, known route about 110 s, video about 2:50) are unmeasured.
