# POSTMAN's confirmations and QA closure (v7) — tasks

Kiro IDE session, November 9, 2026. A task is marked done only after its check has actually run.

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Baseline on v6: the probe with real input (`scripts/v7-baseline.mjs`), the attachment probe, the legibility measurement | — | done (`output/playwright/v7-baseline.json`) |
| 2 | Specs: requirements, design, design-review, tasks, first-visit protocol | all | done |
| 3 | `MailModel.attempt()` and its key; one question per attempt; answers carry the key; `changed`; the boolean attachment flag | R1–R3 | done |
| 4 | POSTMAN: one `Confirm` state, the combined question, stale questions closed with a reason, the checkbox listener, the status lines | R1–R3 | done |
| 5 | The state after an incomplete replacement: TERMINAL's refusal and transcript line, phase help, toasts, the Replaced badge text | R4 | done |
| 6 | ECHO's minimum: measure; change only if an essential fact is only in illegible text | R7 | done (no change, design-review §3) |
| 7 | Unit tests, including a property-based test; existing tests adapted to the key | R1–R5 | done (24 new) |
| 8 | `check:confirm`; build identifier v7 in `check:guide` | R6 | done |
| 9 | Run everything; rerun the probe as "after"; the before/after sheets | R6 | done |
| 10 | Inspect the screenshots; second critique; fixes | R1–R6 | done (below) |
| 11 | Docs: README, AGENTS.md, steering, kiro-usage, this record | R8 | done |

## Verification record

All runs are against the served production build at `http://127.0.0.1:5174` (Chrome through Playwright, real pointer and keyboard input). Automated checks, not human play.

**Build.** `npm.cmd run build` (type-check, then Vite): `assets/haunt-U_tkFtyC.js` and `assets/haunt-WVQaX4Df.css` (the stylesheet is v6's, unchanged); `haunt.html` has `<meta name="haunt-build" content="v7">` and About says "HAUNT OS 4 · build v7". The paper-bridge bundles are unchanged (`index-DtwU5Nqx.js`, `index-CI5aaKki.css`).

**Unit tests.** `npm.cmd test`: 161 tests in 14 files pass (137 before). New: `tests/confirmation-flow-v7.test.ts` (24):
- review 28's route: one question naming both facts, one delivery on the answer, A byte-identical and replaced, the phase falling back, neither receipt finishing the job, the same answer twice delivering once;
- the other order (a Replace question whose letter becomes incomplete before the answer);
- eight changes between a question and its answer (lift, paper, unattach, message, subject, recipient to Mara, discard and compose again, Finish session): the old answer sends nothing;
- the key is a function of the attempt, not a counter;
- B without its attachment, and B from a session-window capture (no words invented);
- B corrected to complete (Replace only); a complete letter after an incomplete replacement (no question); cancel and finish with A; copies after the end; every save readable;
- the words of the four questions, TERMINAL's two refusals of a replaced receipt, the transcript line once, the boolean attachment flag;
- a property-based test (fast-check, 300 random sequences of 6–30 steps over 16 operations: CANVAS edits, compose, recipients, attach/detach, message, discard, send, answer, an old answer, Finish session). Checked at every step: at most one delivery, only on Send or an answer; a delivery that needed a question was made with that very attempt's key; every incomplete letter to guest and every replacement of a complete letter before the end was asked about; a delivery is complete exactly when its own letter is; a stale answer never sends; answering the question just asked, with nothing changed, always delivers; every delivery stays byte-identical; the accepted letter never changes; the attachment flag is a boolean; the mail save stays readable. The test also counts the interesting cases so it cannot pass vacuously; one run counted 79 combined questions asked, 22 combined deliveries, 59 stale answers refused, 22 replacements delivered and 11 copies after the end (random, so the counts vary).

Changed in existing unit tests, and why: `case-store.test.ts`, `playability-v5.test.ts` and `visual-precision-v6.test.ts` answered with `{ confirmIncomplete: true }` or `{ confirmReplace: true }`; they now answer with the question's key (`keyOf`, added to `case-helpers.ts`), and the incomplete question's expected result includes `replaces: null`, `copy: false` and the key. The facts they check are the same.

**Browser checks**, one at a time, final build (`output/playwright/v6-run-v7final.json`):

| Check | Outcomes | Time |
| --- | --- | --- |
| `check:windows` | 7 | 8.5 s |
| `check:drag` | 5 | 14.0 s |
| `check:halloween` | 4 | 26.7 s |
| `check:echo` | 7 | 22.0 s |
| `check:letter` | 9 | 90.6 s |
| `check:case` | 9 | 99.2 s |
| `check:keys` | 1 (the whole case by natural keys) | 16.4 s |
| `check:console` | 5 | 5.8 s |
| `check:recovery` | 5 | 10.1 s |
| `check:guide` | 5 | 18.3 s |
| `check:drawn` | 12 | 221.3 s |
| `check:paths` | 6 | 58.6 s |
| `check:confirm` (new) | 8 | 152.7 s |

83 outcomes, no page errors. The twelve v6 checks record their 75 outcomes; only `check:guide`'s build identifier changed.

**At 4× CPU throttle** (`HAUNT_CPU_THROTTLE=4`, `output/playwright/v6-run-v7throttle4.json`), the checks that send mail or depend on timing, on the same build: `check:letter` 9, `check:case` 9, `check:keys` 1, `check:paths` 6 and `check:confirm` 8 pass with no page errors (`check:confirm` 349.2 s). The other eight checks were not rerun throttled for v7; they passed at 4× on v6 and at normal speed on v7.

**`check:confirm`** (`output/playwright/confirmations-results.json`, screenshots in `output/playwright/confirm/`):
- Review 28's route by pointer (1366×768): one combined question with Keep editing focused; Send anyway and replace delivered exactly one letter, marked Incomplete, which the job relies on; A byte-identical and Replaced; the phase fell back to Capture retained; TERMINAL wrote the fall back once and refused A's receipt without pointing to the incomplete letter; the ready-to-finish toast went and the phase help started at the question, not at the "Tell me exactly" level reached before; lifting the writing and sending again asked nothing, and that letter finished the case.
- Natural keys: Ctrl+Enter, Escape (closes, sends nothing, focus back on Send), Ctrl+Enter, Tab, Tab, Enter: one delivery, focus on Return to the request.
- Cancel: Keep editing, Open CANVAS and back (the question stays, still true), Discard draft, and a reload with the question open sent nothing; the save stayed readable and A finished the case.
- The attachment: click, Space and the label toggle it; the save holds a boolean; toggling it closes an open question; unattached, one question ("no letter is attached") and a letter-less Incomplete delivery.
- A letter from a session-window capture: one question in its own words, delivered with no words.
- Answers bound to their attempt: completing B in CANVAS, resetting a complete B, changing the recipient, typing a message and finishing the session in TERMINAL each closed the open question without sending; the next Send asked about what would then happen.
- A double click on the answer: one delivery.
- Each question (incomplete, replace, combined at the default size; combined, replace and the incomplete copy with POSTMAN at its minimum) at 1366×768, 1440×900 and 1920×1080: 18 states, no DOM or drawn-text problem, every button of the question in view without scrolling.

**`review:v6`** rerun on the v7 build (`output/playwright/v6-review.json`, screenshots in `output/playwright/v6/`): 70 states at each of the three PC sizes, each with the DOM and drawn-text audits: 0 problems, no page errors. The route includes the incomplete question, the replace question and the replace question at POSTMAN's minimum.

**Before and after.** The probe ran on v6 (`haunt-Db2YorXu.js`) and on the final v7 build with the same states and file names (`v7-baseline.json`, `v7-after.json`, summaries `*-summary.txt`):

| | v6 | v7 |
| --- | --- | --- |
| A + incomplete B, every question accepted (pointer, three sizes; keys) | 7 acceptances, still asking; 1 delivery | 1 acceptance; 2 deliveries; B Incomplete and intended, A Replaced and byte-identical |
| B from a session-window capture | loops the same way | 1 acceptance; delivered with no words |
| B unattached | not possible (the checkbox stayed ticked) | 1 acceptance; a letter-less delivery |
| Incomplete B asked about, then lifted in CANVAS | the question still says incomplete; answering it leads to Replace and a complete delivery | the question closes, "The letter changed after you pressed Send, so nothing was sent."; Send asks Replace |
| Complete B asked to Replace, then reset in CANVAS | loops | the question closes with the same notice |
| Cancel, reload, finish with A | A finishes | A finishes |
| After Finish session: incomplete and complete copies | one question for the incomplete copy; Copies | the same |

Sheets, labelled with both bundles: `output/playwright/v7-compare/00-sequence.png` (the questions asked, in order), `01-the-question.png`, `02-after-one-acceptance.png`, `03-letter-changed.png`, `04-postman-minimum.png`.

## Second critique: what playing it showed

1. **The combined question was too long for POSTMAN's minimum.** Its first text (about 60 words) pushed "Send anyway and replace" below the reading pane's fold at 640×460, in the first after-run's screenshot (since overwritten by the final run; the shortened version is `output/playwright/v7-shot-minimum-shorter-1366.png`). Shortened to 44 words with the same facts; all three buttons are now in view (`check:confirm`).
2. **A toast contradicted the tray.** After the answer, the taskbar still showed "Delivered · ready to finish — Guest Inbox has the letter and its receipt." for its 6.5 s, next to a tray saying Capture retained. A backward phase move now removes it.
3. **After the end, the copy question did not fit at the minimum** either: the "The job already accepted your letter…" line stood above it. The line is hidden while that question, which says the same, is open. Found by `check:confirm`'s in-view assertion, which v6 had no equivalent of.
4. **The property test was first vacuous for the combined case.** fast-check's default array size kept sequences around ten steps, and Finish session was as frequent as any other step, so no combined delivery ever happened. The operations are now weighted, sequences are 6–30 steps, and the test fails if the interesting cases did not occur. Its first counterexample (`compose, mara, answer, lift`) was a fault in the test (an answer with no question open is a plain Send in the model); it also led to a guard in POSTMAN: an answer button does nothing if its question has already closed.
5. **Not changed: Return to the request on an incomplete receipt.** TERMINAL then explains what is missing (v4 scenario 13). Removing the button would hide that explanation.
6. **Not changed: A cannot be reinstated.** After an incomplete replacement, the way back is to fix the letter (Lift, or Undo the reset in CANVAS) and send it; nothing complete is held, so no Replace question appears. The question says no receipt will finish the job until a complete letter arrives.

## Not verified

- Human play: nobody has played v7. Whether people read a four-sentence question before answering is untested; `first-visit-protocol.md` is prepared, not run.
- Screen readers (the notice uses `role="alert"`; no assistive technology was used), audible sound, touch, browsers other than Chrome.
- Timing targets (first use, known route, video length) are editorial goals, not measurements.
