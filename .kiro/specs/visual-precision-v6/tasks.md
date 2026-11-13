# Visual precision and QA of the v5 route (v6) — tasks

Kiro IDE session, November 9, 2026. A task is marked done only after its check has actually run.

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Baseline on v5: drawn-text audit, DOM text-covered rule, screenshots and crops (`v6-baseline.mjs`) | — | done (`output/playwright/v6-baseline.json`) |
| 2 | Specs: requirements, design, design-review, tasks | all | done |
| 3 | Measured note layout, drawn at the reference size, clip guard; TERMINAL's note shape | R1 | done |
| 4 | Monitor status bar; ghost line in the quiet zone (padded box); corner marks for the glass only; no label on a session negative | R2 | done |
| 5 | Negative view and CANVAS letter sized by their real aspect; Lift's drift bounded | R3 | done |
| 6 | Wording: session chips, titles, verdicts, ghost line; CANVAS; missing reasons per source | R4 | done |
| 7 | Unit tests: `layoutNote` with synthetic fonts; missing phrases | R1, R4 | done (12 tests) |
| 8 | Checks: `check:drawn`, `check:paths`, `review:v6`; existing checks updated where wording changed | R5, R6 | done |
| 9 | Run everything; rerun the probe as "after"; build the before/after sheets | R6 | done |
| 10 | Inspect the screenshots; second critique; fixes | R1–R4 | done (below) |
| 11 | Docs: README, AGENTS.md, steering, kiro-usage, this record | R7 | done |

## Verification record

All runs are against the served production build at `http://127.0.0.1:5174` (Chrome through Playwright, real pointer and keyboard input). Automated checks, not human play.

**Build.** `npm.cmd run build` (type-check, then Vite): `assets/haunt-Db2YorXu.js` and `assets/haunt-WVQaX4Df.css`; `haunt.html` has `<meta name="haunt-build" content="v6">` and About says "HAUNT OS 4 · build v6". The paper-bridge bundles are unchanged (`index-DtwU5Nqx.js`, `index-CI5aaKki.css`).

**Unit tests.** `npm.cmd test`: 137 tests in 13 files pass. New: `tests/visual-precision-v6.test.ts` (12): `layoutNote` with four synthetic fonts (every word inside the margins; the fragment verbatim, wrapped only between words, "PER—" whole; a wide script wraps like TERMINAL's note; a far too wide font reports that it does not fit), the quiet zone's position, and the incompleteness reasons for session, bare glass, limited, missing attachment and TERMINAL's refusal; a session capture still never gains writing.

**Browser checks**, one at a time, final build (`output/playwright/v6-run-release.json`):

| Check | Outcomes | Time |
| --- | --- | --- |
| `check:windows` | 7 | 6.6 s |
| `check:drag` | 5 | 8.7 s |
| `check:halloween` | 4 | 22.8 s |
| `check:echo` | 7 | 18.3 s |
| `check:letter` | 9 | 68.8 s |
| `check:case` | 9 | 94.1 s |
| `check:keys` | 1 (the whole case by natural keys) | 14.8 s |
| `check:console` | 5 | 5.4 s |
| `check:recovery` | 5 | 8.8 s |
| `check:guide` | 5 | 17.0 s |
| `check:drawn` (new) | 12 | 185.9 s |
| `check:paths` (new) | 6 | 57.5 s |

75 outcomes, no page errors. The ten v5 checks still record their 57 outcomes. After this run `check:drawn` gained two fractional-DPR configurations and was rerun alone on the same build: 12 outcomes, no page errors.

**At 4× CPU throttle** (`HAUNT_CPU_THROTTLE=4`, `output/playwright/v6-run-throttle4.json`): all 12 checks pass with the same 75 outcomes and no page errors (`check:case` 178.4 s, `check:paths` 122.1 s). `check:drawn` gained its two fractional-DPR configurations after that run and was rerun alone at 4× (`v6-run-throttle4-drawn.json`): 12 outcomes, no page errors, 447.6 s.

**`check:drawn`** (`output/playwright/drawn-text-results.json`, screenshots in `output/playwright/drawn/`):
- The session window at 1366×768, 1440×900 and 1920×1080, DPR 1 and 2, and at 1536×864 DPR 1.25 and 1707×960 DPR 1.5 (Windows display scaling at 125 % and 150 %): live, maximized, ECHO at its minimum, paused, and the kept thumbnail, negative and picture. Every word of the note is on its paper; the tightest is 0.47 em from the paper's edge (the audit requires 0.25 em and 1 device pixel). Nothing of ECHO's covers the header or the note; the status bar is above the picture.
- Paused, as ECHO opens and at its minimum, in the same eight configurations: the ghost line's footprint, glow included and measured from screenshots, lies on the session window's bare wall (the brightest channel under it is 38/255; the limit is 80), its box cuts off no letter, and Resume live clears it.
- Four simulated fallbacks (the canvas font lists rewritten before the app starts: no Segoe Print; none of the listed hand fonts; no Segoe UI; Verdana as the hand font): the note stays on its paper, tightest 0.48–0.50 em.
- After the minute: No figure / Unfinished note / No handprint; "Only the note is left here. The mark is on the glass."; "The note left behind". A letter made from it is described as TERMINAL's window in CANVAS, POSTMAN and TERMINAL, carries no words and stays incomplete.
- Mara's five lines on the letter's paper and off its photograph in CANVAS (Beside; Below on Night paper), POSTMAN, the receipt and the end, at 1366×768 DPR 1, 1920×1080 DPR 2 and with generic cursive. The Below letter fits its stage at its 0.82 shape, and CANVAS's Compose takes a pointer click there.
- Lift stepped with Playwright's fake clock on Night paper, Below: 8 frames (1366×768) and 7 frames (1920×1080 DPR 2) with words drawn, from 16 to 600 ms, none with a word past or crowding the edge.

**`check:paths`** (`output/playwright/paths-results.json`):
- Early correct action: the Bell and Stop the call before any return, then Let it finish this time: the glass with 0 returns and no bell scheduled (recording AudioContext); the whole case then finishes, still at 0 returns.
- Programs opened before they are needed: honest empty states in ECHO's Captures, CANVAS and POSTMAN, each with a way on. Reply → guest → Send with nothing attached asks first, arrives incomplete, and TERMINAL's receipt says "The letter that arrived is incomplete: no letter is attached. Fix it in CANVAS and send it again." with no Finish session. The case stays Repeating.
- Force it out with the call on is one more return; with the call off it leaves a shadow (job strip, ECHO chips "A shadow", capture "A shadow in the window"); Call it back, then Let it finish, reaches the glass with no further return.
- Pause and process: TERMINAL came back once while ECHO was paused; the caption says so; the paused picture and a capture made then draw PID 3087 (read from the canvas calls); Resume live draws 3088. A letter from that session capture, then a glass capture: Use asks; Keep the letter as it is keeps it; Replace takes the glass; Undo in CANVAS brings the session letter back; Redo the glass.
- Lost writing on Night paper, Below, with a moved frame; a reload; Recover the writing keeps the frame, paper, layout and mist 0. An empty and an unknown recipient ("admin") send nothing; guest delivers it complete with that frame, paper and layout. After Finish session a send to guest is a Copy with no Replace prompt, and a reload keeps the accepted letter.
- 21 named states audited with no layout or drawn-text problem.

**`review:v6`** (`output/playwright/v6-review.json`, screenshots in `output/playwright/v6/`): the v5 route plus the session window in ECHO (live, paused, kept; default, maximized, minimum), the session window after the minute, CANVAS on Night paper, Below (default, maximized, minimum) and a letter made from the session window. 70 states at each of 1366×768, 1440×900 and 1920×1080, each with the DOM layout audit and the drawn-text audit: 0 problems, no page errors; 45 states per size draw the session window's note. The same route at 1440×900 with DPR 2 (`HAUNT_SCALE=2 HAUNT_SIZES=1440x900`, `output/playwright/v6-review-dpr2.json`, screenshots in `v6-dpr2/`): 70 states, 0 problems.

**Before and after.** The probe (`scripts/v6-baseline.mjs`) ran on v5 (`haunt-DuQWST70.js`) and on the final v6 build with the same states and file names: 172 audit problems before, 0 after. Key measurements:

| | v5 | v6 |
| --- | --- | --- |
| Note ink off the paper, 1366×768 live | fragment 101 of 580 ink pixels, signature 57 of 281, up to 33 px past the edge | none (on every surface the closest word is 0.47 em inside, `check:drawn`) |
| ECHO's badge on the drawn header | at every size | the status is in a bar above the picture |
| Paused ghost line | over the signature | on the wall, top left |
| Negative view overflow (1366 / 1440 / 1920) | 49.5 / 71.3 / 85.9 px over the chips and caption | 0 |
| CANVAS Below letter, 1366×768 | 621.9 px tall in a 539.9 px stage; Compose not clickable | 475.8 px tall inside the stage; Compose clickable |
| Session source words | "No writing", "Empty window", "only mist" | "Unfinished note", "its note stops at “PER—”" |
| Lift, first frame, Below, Night (`v6-lift-frames-*.json`) | 3 (1366) and 25 (1920) signature pixels outside the letter | none |

Sheets, each labelled with both bundles: `output/playwright/v6-compare/01-note-on-its-paper.png`, `02-note-when-kept.png`, `03-note-fallback-fonts.png`, `04-header-and-status.png`, `05-paused.png`, `06-capture-negative.png`, `07-canvas-below.png`, `08-session-words.png`. Small crops are enlarged with nearest-neighbour scaling.

**Expectations changed in existing checks, and why.**
- `check-echo-scene.mjs`: the session capture's verdict and chips now name the unfinished note (R4; v5 said "It holds no writing and no handprint").
- `check-terminal-recovery.mjs`: CANVAS's sentence for a migrated v3 print no longer uses the internal word "milestone" (R4).
- `check-letter.mjs`: the readiness line and Writing layer of a letter made from the session window (R4).
- `check-first-run.mjs`: the build identifier is v6.
- Selectors only: `haunt-helpers.mjs` `frameHand` and `check-case.mjs`'s keyboard Move centre ECHO on the picture (`.echo-screen`), since the monitor now has a bar above it.
- Audits: `layout-audit.mjs` gained `text-covered`; points within 1 px of a clipping edge are not sampled (see below).

## Second critique: what the screenshots and checks showed

1. **The ghost line's own clip cut a letter (H).** At ECHO's minimum, "picture." starts a line and the italic tail of its "p" reached about 1.5 px left of the new box; the clip cut 4 pixels. Fixed with 0.2 × 0.3 em of padding inside the same box; the pixel check now passes everywhere.
2. **Lift's first frames (I).** Found when `check:paths` audited right after Recover. Fixed by bounding the drift (design §3); reproduced and verified frame by frame with a fake clock, before (a build with the v5 formula) and after.
3. **Audit false positives, fixed in the audits, not the app.** The first `review:v6` run reported 69 problems: in three CANVAS states at each size, plus one TERMINAL state at 1920×1080. They were CANVAS's Reframe and Reset dialogs over the letter, which the person opened (the DOM audit already exempts dialogs; the drawn audit now does too); the letter canvas being inert behind those dialogs, so hit testing reached its ancestor (an ancestor is never over its canvas); and one TERMINAL transcript line at 1920×1080 with TERMINAL at its minimum, sampled 0.6 px inside the transcript's clip edge, where Chrome's hit test returned the prompt below (the two boxes touch at 445.08 px and do not overlap). Points within 1 px of a clipping edge are no longer sampled, in both audits. Rerun: 0.
4. **Not changed: the signature at ECHO's minimum.** It is inside the paper but about 5 px tall, readable only enlarged; the paper itself is 74×36 px there. A larger signature would shrink the fragment, which carries the story; the chips and the verdict say where the note stops.
5. **Not changed: the bar's cost.** At ECHO's minimum the picture is 339×212 px instead of v5's 385×240 (12 % smaller in each dimension). The header, the note's two lines and the ghost line stay legible in the minimum screenshots. A thinner bar would win 6 px at most.

## Not verified

- Human play: nobody has played v6; whether "Unfinished note" reads as intended is a question for people.
- Screen readers, audible sound (a recording AudioContext only), touch, browsers other than Chrome.
- Missing fonts on a real system: fallbacks were simulated by rewriting canvas font lists. Device pixel ratios other than 1, 1.25, 1.5 and 2.
- Timing targets (first use, known route, video length) are editorial goals, not measurements.
