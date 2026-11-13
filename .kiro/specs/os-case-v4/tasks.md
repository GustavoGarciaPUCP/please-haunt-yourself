# OS and complete case v4 — tasks and verification record

Kiro IDE session, November 7, 2026. A task is marked done only after its check has actually run. Checks ran against the production build served by `vite preview` on `http://127.0.0.1:5174` (final bundle `haunt-Bxlu_uWT.js` / `haunt-B4vw9n-o.css`, `haunt-build` meta `v4`).

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Baseline: Bell action outside the window at 1440×900; ECHO radio arrow keys; before stills | — | done (`output/playwright/v4-baseline.json`) |
| 2 | Specs: requirements, design, design-review, tasks | all | done |
| 3 | Models: case-store (phase, run, intents, persist, milestone placement), letter-model, mail-model, echo-studio v4, glass writing/subjects/release, legacy finish | R3–R7 | done (unit tests) |
| 4 | case-save v4 + migration from v3 and v1 | R7 | done (unit tests, `check:recovery`) |
| 5 | Window geometry, drag, manager: maximize/restore, resize, clamp, defaults, window menu | R2 | done (unit tests, `check:windows`, `check:drag`) |
| 6 | OS shell: haunt.html, desktop.css rewrite, taskbar, launcher, tray, files, boot, callout, phase help, About | R1, R9 | done (`check:guide`, visual review) |
| 7 | TERMINAL shell and session pane (inspector slot, text-made figure, recorded clock, receipt card, Finish session) | R3 | done (`check:halloween`, `check:console`) |
| 8 | Glass render v4: wallpaper, reflection made of text, handprint anatomy, writing from data, release | R8 | done (visual review; `check:echo` pixel comparison) |
| 9 | ECHO v4: native radios, Live/Captures, wipe cursor, negative + frame editor, limited prints | R4 | done (`check:echo`, `check:recovery`) |
| 10 | CANVAS | R5 | done (`check:letter`) |
| 11 | POSTMAN | R6 | done (`check:letter`) |
| 12 | Final acknowledgment, release presentation, finished state | R3.5–6, R8 | done (`check:case`) |
| 13 | Unit tests | all | done: 113 passing |
| 14 | Browser checks (9) and DOM layout audit | all | done: 50 journeys, no page errors |
| 15 | Visual review at three PC sizes; fix and re-verify | R9 | done (automated walkthrough plus inspected screenshots; see below) |
| 16 | Docs: AGENTS.md, steering, README, PITCH.md, kiro-usage, this record, first-visit protocol | R10 | done |

## Results

**Unit tests (`npm.cmd test`): 113 passing in 11 files.** This includes the unchanged paper-bridge suites. The v4 tests cover phase derivation, the milestone/glass transaction, subjects (including a wiped or thin-mist print), negatives and frames, letter completeness and "Not the words.", snapshot immutability, Reply/Send/returned/replace/incomplete, receipt validation (other run, replaced, tampered, incomplete), finish and replay, v3/v1 migration and corrupt saves, window geometry, console syntax and TERMINAL's presentation copy.

**Browser checks: 9 scripts, 50 journeys, no page errors.**

| Script | Journeys | Covers |
| --- | --- | --- |
| `check:windows` | 7 | Taskbar minimize/restore, raise, close; maximize and double-click restore; resize bounds; keyboard Size and Move with Escape; Escape never closes; remembered bounds; Arrange windows leaves the case untouched; viewport clamp; motion interruption |
| `check:drag` | 5 | Pointer-delta precision at 1366×768, 1440×900, 1920×1080; outside-viewport release; Escape cancels a drag; blur ends it; dragging a maximized window restores under the pointer after 6 px |
| `check:halloween` | 4 | Stop the call, Muffle the bell and the main action hit at their centres inside TERMINAL with no scrolling at all three sizes; muffle is not stop; one producer of the bell (recording AudioContext); ECHO never rings or retries; Undo; shadow; recorded clock; live reduced-motion switch |
| `check:echo` | 7 | Native radio arrow keys; session versus glass captures before and after the milestone; full negative with five lines; immutability after wipe and breathe (stored data and rendered pixels); keyboard frame editing; Discard and Undo; eight-capture limit; maximize and viewport change |
| `check:letter` | 7 | Scenarios 3, 4, 5, 6, 7 and 13: narrow frame then Reframe…; Not the words. with Ctrl+Z/Ctrl+Y; discarded capture; incomplete send; Reply/return/correct; A then B with explicit Replace; editing after the end |
| `check:case` | 5 | Full pointer route; reload after finishing; Start the case over and the archived receipt; a keyboard-only route with the window menu, wipe cursor and frame keys; blocked storage (Session only) |
| `check:console` | 5 | help, refusals, ps/kill/TERM, echo/ask/finish/cat, history and Ctrl+L, open canvas |
| `check:recovery` | 5 | v3 migration to limited and session captures (reported once), v1 ending removed, corrupt save, minimizing mid-cue silences the bell |
| `check:guide` | 5 | Boot on a fresh desk only, callout beside TERMINAL, phase help levels, About content and storage, desktop files open their objects |

`check:halloween`, `check:drag`, `check:echo`, `check:recovery` and `check:case` also passed with `HAUNT_CPU_THROTTLE=4`.

**Visual review (`npm.cmd run review:v4`).** 22 states at each PC size (desktop, launcher, phase help, session, Bell inspector, after a return, call stopped, milestone, ECHO live, captures, maximized, CANVAS draft, Not the words., lifted letter, POSTMAN draft, Recovered · 1987, returned, delivered, TERMINAL receipt, the letter at Finish, finished, About). The DOM layout audit (`scripts/layout-audit.mjs`) reports **0 problems** in every state: no clipped text, no control covered inside its own window or on the taskbar, nothing off screen and no page scroll. Screenshots: `output/playwright/v4/`.

Inspecting those screenshots found defects that the audit could not see. Each was fixed and re-verified:

1. The figure's text was missing: the button rule's inherited `white-space: nowrap` put the whole text on one line above its head.
2. The text made the canvas reflection a solid shape: `source-in` applied per row erased earlier rows. Rows and outline are now intersected in one draw.
3. Floating notifications covered CANVAS's Compose button and POSTMAN's attachment. They now live in the taskbar's free middle.
4. Stop the call was styled as the primary action next to Muffle the bell, which gave the answer away. Both are now equal.
5. A wiped hand still showed a drawn crease: the creases and the mottling now need moisture, and the subject rule also requires mist around the print.
6. The CANVAS layers panel did not fit at 1366×768; Paper and Note now share one section.
7. The note's "—" wrapped alone; the callout covered the boot line (it now sits beside TERMINAL when there is room); POSTMAN still offered Return to the request after the end; the job strip repeated Look inside inside the session.

**Route capture (`node scripts/capture-v4-route.mjs`).** 913 Chrome screencast frames at 1366×768 in `output/playwright/v4-route/frames/`, beats in `output/playwright/v4-route-capture.json`, and stills `output/playwright/v4-final-*-{1366x768,1440x900,1920x1080}.png`. The scripted route took **52.3 s** of automated input, with 600 ms pauses and three deliberate mistakes: Muffle the bell, Mist to 0, Send to Mara. This is not a human play time and not the submission video.

## Not verified

- No person has played v4. The first-visit protocol is in `first-visit-protocol.md`; nobody was available to run it during this session.
- Screen readers, audible sound (only a recording AudioContext was used), touch, real background tabs and browsers other than Chrome.
- The editorial timing targets: 6–9 minutes first use, about 110 s for a known route and about 2:50 of video. None of them has been measured.
