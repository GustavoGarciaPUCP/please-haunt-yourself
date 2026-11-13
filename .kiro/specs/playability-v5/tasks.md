# Playability and a visible ending (v5) — tasks

Kiro IDE session, November 8, 2026. A task is marked done only after its check has actually run.

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Baseline: reproduce review 26 (A1, A2, B, C, D, E) and the Tab order on the v4 build | — | done (`output/playwright/v5-baseline.json`, `tab-probe.json`) |
| 2 | Specs: requirements, design, design-review, tasks | all | done |
| 3 | Retention: protected eviction, acceptance, standing, sends after the end, POSTMAN wording | R1 | done (unit, `check:case` 6, probe A1/A2) |
| 4 | CANVAS recovery: Recover the writing, copy, removal of Take it off the paper | R2 | done (unit, `check:letter` 8–9, probe B) |
| 5 | CANVAS decision: The photograph keeps (previews), lift highlight and placeholder | R5 | done (unit, `check:letter` 8, `check:keys`) |
| 6 | Orientation: pending objective, Are you okay?, POSTMAN labels | R4 | done (unit, probe D) |
| 7 | Adaptive layouts at the minimum sizes, scroll regions, audit refinement | R3 | done (`review:v5`, probe C) |
| 8 | Visible ending: live glass in the receipt card, release, final card | R6 | done (unit, `check:case` 7, `check:keys`, probe E) |
| 9 | Unit tests | R1, R2, R4–R6 | done (125 pass) |
| 10 | Browser checks: regressions for A, B and the ending, `check:keys`, `review:v5` | R3, R7, R8 | done |
| 11 | Visual review at three sizes and the minima; second critique; fixes | R3, R5, R6 | done (see below) |
| 12 | Docs: README, AGENTS.md, steering, kiro-usage, PITCH (only what changed), this record | R8 | done |

## Verification record

All results below are from the final build: `dist/assets/haunt-DuQWST70.js` and `haunt-CxGB5zKC.css`, served by `vite preview` at http://127.0.0.1:5174/haunt.html. About says **HAUNT OS 4 · build v5**; the page has `<meta name="haunt-build" content="v5">`. The paper-bridge page at `/` still builds to the same files (`index-CI5aaKki.css`, `index-DtwU5Nqx.js`). Headless Chrome through Playwright, one check at a time, after the build had finished.

**Build.** `npm.cmd run build` (tsc, then vite): no errors.

**Unit tests.** `npm.cmd test`: 12 files, 125 tests pass (113 from v4, 12 new in `tests/playability-v5.test.ts`). Two v4 expectations were changed, each because it asserted a behaviour v5 corrects:
- `tests/letter-mail.test.ts`: the lost-writing line expected "Undo brings it back" (defect B). It now expects "Recover it from the capture".
- `tests/legacy-session.test.ts`: `jobs` expected "next: stop the call" (review 26 §4). It now expects "next: find out what keeps bringing it back".

**Browser checks.** 10 checks, 57 journeys, no page errors:

| Check | Journeys | Changes in v5 |
| --- | --- | --- |
| `check:windows` | 7 | — |
| `check:echo` | 7 | — |
| `check:console` | 5 | — |
| `check:guide` | 5 | Build identifier v5 in the meta and About (was v4). |
| `check:recovery` | 5 | — |
| `check:halloween` | 4 | — |
| `check:drag` | 5 | — |
| `check:letter` | 9 | Two copy assertions follow the new wording (same facts). New: a refused receipt shows no glass. New journey 8: pointing at Lift and at an option previews without editing; option names come from the capture; No mist warns; scenario B (lost words, reload, Undo empty, Recover); the choice reaches the delivered letter. New journey 9: a session-window capture hides the mist choice and points to ECHO. |
| `check:case` | 9 | New journeys 6–9: 13 returned sends before and after Finish, then reloads (scenarios A2, A1). The receipt's view of the glass is compared with the desktop canvas at the hand (mean difference 1.1/255 before, 0.7/255 after). The view changes through the release. A reload mid-release lands finished. Reduced motion shows the final state at once. |
| `check:keys` (new) | 1 | The whole case with Tab, Shift+Tab, Enter, arrows and typing only: 48 key presses, and the check never sets focus. Each focused control was on screen and uncovered when pressed. |

At 4× CPU throttle (`HAUNT_CPU_THROTTLE=4`), on the same build, seven checks pass: `check:case` 9, `check:letter` 9, `check:keys` 1, `check:halloween` 4, `check:drag` 5, `check:echo` 7 and `check:recovery` 5. The first throttled `check:case` run failed. One fixed-time sample of the release did not catch an intermediate frame on the slow machine. The check now samples the view throughout the release; the product was unchanged.

Key presses per step in `check:keys`:

| Step | Presses |
| --- | --- |
| Look inside | 4 |
| Watch it try to finish | 1 |
| Inspect the bell | 3 |
| Stop the call | 5 |
| Let it finish | 2 |
| Back to the prompt | 1 |
| Open ECHO | 6 |
| Source: Desktop glass | 3 |
| Capture | 4 |
| Use this capture | 1 |
| Lift the writing | 1 |
| The photograph keeps (arrow key) | 1 |
| Compose in POSTMAN | 6 |
| Type guest, then Send | 8 |
| Return to the request | 1 |
| Finish session | 1 |

ECHO's default frame already held the handprint, so the photo-frame keys were not needed on this route.

**Visual review.** `npm.cmd run review:v5`: 59 states at each of 1366×768, 1440×900 and 1920×1080 (177 screenshots in `output/playwright/v5/`, report `output/playwright/v5-review.json`). The layout audit found 0 problems and there were 0 page errors. The states:
- TERMINAL at default, minimum, maximized and pushed into a corner. Each inspector page appears at the default size and again at the minimum: narration, note, figure, bell, door, hint, hint exactly and Under the hood.
- ECHO Live and Captures at default, maximized, minimum and corner.
- CANVAS: draft, pointing at Lift, Reframe, lost words, pointing at Recover, the keep choice and the reset confirmation. They appear at default, and the draft, Reframe and reset confirmation again at the minimum; CANVAS is also checked maximized and in a corner.
- Confirmations: ECHO's replace confirmation, and POSTMAN's incomplete and replace confirmations (the replace confirmation also at the minimum).
- POSTMAN: Recovered, returned, delivered, maximized, and delivered at the minimum.
- TERMINAL: receipt (default and minimum), the release, finished (default, minimum, maximized), Start over and About.

**Before and after.** `scripts/v5-baseline.mjs` ran on v4 (before) and on this build (after, `HAUNT_PROBE_DIR=output/playwright/v5-after`). Same routes, same screenshot names.

| Finding | v4 (`v5-baseline.json`) | v5 (`v5-after.json`) |
| --- | --- | --- |
| A1 flood after Finish, reload | accepted letter evicted; "could not be read", new run, Repeating | accepted kept; finished, same run, released, 12 deliveries |
| A2 flood before Finish, reload | intended evicted; reset | intended kept; Delivered · ready to finish |
| B lost words, reload | "Undo brings it back", Undo and Lift disabled | "Recover it from the capture", Recover the writing shown |
| C minima | TERMINAL bell 6 problems, hint 4, hood 2; ECHO Captures 1, Live 0, after Use 3 (the CANVAS and POSTMAN states repeat ECHO's 3, visible behind them) | 0 problems in every state |
| D default guidance | "Next: Stop the call."; "the call starts the same minute again"; recipient roles stated | "Next: Find out what keeps bringing it back."; "something pulls it back"; "Mara · last signed in 31 Oct 1987", "guest · signed in now" |
| E the release | runs under TERMINAL at the hand | still under TERMINAL at the hand (nothing moves), and shown in the receipt: impressed → releasing → clear |

**Minimum sizes.** Unchanged: TERMINAL 480×420, ECHO 640×480, CANVAS 680×500 and POSTMAN 640×460. At 480×420 the session scene keeps a 104 px floor, and the inspector keeps 147 px with its actions in view (about 3 lines of its text visible, the rest scrolls). ECHO's capture details fit at 640×480 without scrolling. CANVAS's layers panel scrolls at 680×500 and fits at its default size at 1366×768. No measurement called for a larger minimum.

## Found and fixed during the visual review

- **The release looked like nothing at a fixed sample.** This was a check-timing artifact, not a product defect; handled as above.
- **Paper section below the fold at 1366×768.** The first CANVAS layout (three stacked option cards) pushed the Paper section below the fold of the default window. The options became a row of three presets, Reframe… moved into the Photograph heading, and the panel padding tightened. It now fits at the default size.
- **Highlight on programmatic focus.** CANVAS opens with Lift focused, which showed the highlight with no pointing. The highlight now follows the pointer, or keyboard focus only when it is visible (`:focus-visible`).
- **"Her handprint".** It implied the handprint is Mara's own. The apparition is the remnant of her session (contract 23), so the copy says "the handprint" and "the figure".
- **Transcript scroll after a resize.** After a maximize/restore or a resize to the minimum, the transcript stopped showing its last line. It now stays pinned to the bottom when it was there, as in a terminal emulator.
- **Letter thumbnail overflow.** The receipt's small letter drew its words past the paper because of a 6 px font floor. The floor is now 2 px: a thumbnail is the same letter, smaller.
- **Session-window captures.** A letter from a session-window capture offered three "Bare glass" options and suggested moving a frame it does not have. The mist choice is now hidden, with a note, and the readiness line points to ECHO's captures (shown). A fixed v3 print no longer suggests Reframe either.
- **Bell and way out labels.** In the 104 px scene the two labels touched; the bell is smaller in short windows.
- **Small images on large screens.** On a large TERMINAL (at least 640×640), the receipt's glass and letter are larger: 120 px, and 150 px at the end.
- **The end did not name the choice.** The finished card now says what the delivered photograph keeps, from the delivered snapshot.

## Not verified

- Human play. Whether "The photograph keeps" feels like a decision, and whether the new orientation is clear without the answer, need people. The first-visit protocol from v4 still applies.
- Screen readers, audible sound, touch, real background tabs and browsers other than Chrome.
- Timing targets.
