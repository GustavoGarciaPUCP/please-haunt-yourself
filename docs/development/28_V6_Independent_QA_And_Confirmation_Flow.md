# v6 independent QA and the combined confirmation flow

Codex, November 9, 2026. Independent review of the participant-operated Kiro IDE prompt06 delivery. This pass rebuilds, rechecks the complete case, inspects the audit changes and exercises a combination not covered by the existing routes. It changes review/handoff/status documents and ignored diagnostic scripts, not application source.

## Judgment

v6 is a substantial precision improvement. The session note fits its paper, the monitor's status no longer covers the source header, and the source labels now describe the unfinished note honestly. CANVAS's Below letter fits its stage and Compose remains usable. These are real improvements, not merely a higher test count.

The main four-program route remains coherent and functional on the exercised paths. Preserve the desktop design, the shared glass, the capture/letter/delivery identity and the photograph choice. The next repair is a **P2 secondary-operation defect**: two POSTMAN confirmations alternate indefinitely when an incomplete letter is meant to replace an already delivered complete letter. The previous valid delivery survives, and the case can still be finished with it.

This is progress toward a polished complete product. Automated correctness, visual containment and a coherent route do not establish enjoyment or a competitive winning standard. Further work should follow observed failures and first-visit evidence, rather than adding programs or compulsory actions.

## Independently verified

- Rebuilt with `npm.cmd run build`; loaded `haunt-Db2YorXu.js` and `haunt-WVQaX4Df.css` in isolated Chrome at `/haunt.html`.
- **137 unit tests in 13 files passed.**
- All **12 browser scripts passed again**, **75 recorded outcomes**, no recorded page errors: windows 7, drag 5, Halloween 4, ECHO 7, letter 9, case 9, natural keys 1, console 5, recovery 5, guide 5, drawn text 12 and paths 6.
- Re-ran `review:v6`: **70 states at each of 1366×768, 1440×900 and 1920×1080**, 210 generated screenshots, zero reported DOM/drawn-text problems and zero page errors on that route. Selected images were inspected, not every pixel of all 210 images.
- Inspected the independent current session-source screenshot and the Kiro before/after sheet for CANVAS Below. The former note/header defects are visibly repaired; the latter comparison explains a genuine aspect/interaction repair.
- An additional real-input route reproduced the combined-confirmation defect and then cancelled it and finished using the original immutable letter.
- Additional negative controls demonstrated that the current DOM and drawn-text audits still detect deliberately introduced faults and return to clean after those faults are removed.
- A separate ending probe resized TERMINAL to its minimum, used Arrange, finished and waited for motion to settle. No horizontal scroll or layout error was reproduced in that settled state; the final line was complete. Do not treat intermediate spectral-text frames as confirmed lost words.

The twelve checks were rerun at normal CPU speed here. Kiro's reported full 4× run was not independently repeated. `check:drawn` itself covers its DPR/fallback configurations; the separate 70-state DPR 2 screenshot route was not repeated by this Codex pass.

## The complete flow

| Stage | Actual role in the case | Assessment |
| --- | --- | --- |
| TERMINAL | Observe a return; distinguish muting the bell from stopping retry; let the minute finish | Causal and recoverable. Early correct actions work; a failed attempt is not compulsory. |
| ECHO | Explore the same glass by moving its window, retain the source and choose the picture's frame | The clearest distinctive interaction. Status and source content now have separate space. |
| CANVAS | Preserve actual captured words and choose what the photograph keeps | A real expressive choice whose result reaches the artifact, with a quick default. It is not an additional mandatory logic puzzle. |
| POSTMAN | Relate the note to guest, send the actual letter and retain its receipt | Normal, returned, incomplete, copy and ordinary replacement routes work in the existing checks. Their **combined** incomplete/replacement branch has the defect below. |
| TERMINAL | Accept the matching receipt, show the actual delivered letter and the same live glass release | Functional close with continuity. Its emotional strength and how much a person notices remain untested. |

The core is one unfinished delivery. Its several moments must not be advertised as four independent deep puzzles. The value is how familiar applications transform the same haunted material and return the player's actual composition.

## Confirmed defect: incomplete B replacing complete A loops between confirmations

**Priority P2. A broken allowed secondary operation, not a total-game blocker or data loss.**

Reproduction with real controls:

1. Complete letter A and send it to guest. Do **not** choose Finish session yet.
2. Return to CANVAS → Letter → Reset to the capture… → Reset. B is now incomplete: its writing remains in the mist.
3. Compose in POSTMAN, choose guest and Send.
4. The incomplete-letter warning appears. Choose **Send anyway**.
5. The existing-complete-letter warning appears. Choose **Replace**.
6. The incomplete-letter warning appears again. Send anyway brings back Replace. The operation never reaches a new delivery.

Observed sequence:

| Action | Warning shown next | Delivery count | Phase |
| --- | --- | ---: | --- |
| Send B | Incomplete: send anyway? | 1 | ready-to-finish |
| Send anyway | Complete A exists: replace? | 1 | ready-to-finish |
| Replace | Incomplete: send anyway? | 1 | ready-to-finish |
| Send anyway again | Complete A exists: replace? | 1 | ready-to-finish |

Cause: `src/haunt/postman-view.ts` commands `send-anyway` and `replace` each submit only one acceptance. `MailModel.send()` checks incomplete first, replacement second. On Replace, `this.confirm.kind` is already `replace`, so `confirmIncomplete` becomes false; accepting incomplete loses the replacement acceptance in turn.

The original delivery A remained byte-for-byte unchanged and remained the intended delivery. After cancelling, opening A in Guest Inbox, returning its receipt and choosing Finish session, the same case finished successfully. This scope matters: do not call it save corruption or claim the primary route is broken.

Required result: an honest, finite decision sequence or combined confirmation, with cancellation and strict completeness/receipt rules preserved. If decisions are remembered between steps, bind them to the actual draft/content, recipient and affected delivery; do not reuse acceptance after unrelated edits. The replacement warning must not imply that an incomplete new receipt can finish the job. Claude should compare a minimal implementation with the existing contract, not bypass validation or silently replace A.

Add combined-path regressions. Existing tests cover an incomplete first send and a complete replacement separately, so their passing results do not contradict this finding.

## Audit changes: checked rather than assumed

Reviewed the relevant code in `scripts/layout-audit.mjs` and `scripts/drawn-text-audit.mjs`. The documented exemptions for a descendant dialog/menu opened over content are consistent with the desktop model. Windows themselves are also dialogs, and the code distinguishes those from in-window overlays. The1px clipping-edge sampling tolerance is local; it does not exclude an entire app or state.

In an isolated page, after recording clean ECHO audits, Codex temporarily inserted:

- A button covered by an opaque sibling in its own window. The DOM audit reported **covered** and **text-covered**.
- A synthetic canvas with words outside its light paper and outside the canvas. The drawn audit reported **ink-outside-paper**, **ink-outside-canvas** and **ink-tight-margin**.

After removing the synthetic elements, both audits returned to zero problems. These injected faults are diagnostic controls, **not v6 application defects**. They show that the audits still respond to those fault classes; they do not prove every past false-positive classification or every possible pixel layout correct.

## Before / After / Why

Confirmed v6 improvements and the proposed next repair are distinguished in the After column.

| Before | After | Why |
| --- | --- | --- |
| Note fragment/signature outside their paper | **Verified in v6:** measured ink layout fits the note | Source evidence is readable and physically consistent |
| LIVE badge on recorded header | **Verified in v6:** a separate monitor-status bar | Transport state does not obscure or enter the capture |
| Below letter could cover Compose | **Verified in v6:** sizing by the letter's actual aspect | A layout choice must not block the next action |
| Incomplete and replacement guards each work alone | **Proposed next:** one finite, content-specific confirmation path when both apply | Allowed combinations need the same integrity as the main route |
| Concern that audit exemptions might hide all real overlap | **Verified diagnostic:** deliberate obstructions and overflowing ink are detected | A clean result remains meaningful for these tested fault classes |

## What to maintain and what still deserves observation

Maintain the current app identities and OS shell, real dragging/resizing, shared world coordinates, genuine source-based images, local recovery, immutable delivered snapshots, bounded retention, natural keyboard route and reduced motion. Keep the photograph decision optional; its visible artifact difference is the benefit, not a new gate.

The session signature at ECHO's minimum is very small. That is a known legibility limitation, not an overflow defect. The author/date are also available in the surrounding case context; this review did not find a required decision dependent solely on reading those 5 px glyphs. A larger signature or a zoom control is not automatically the right next change. Observe an actual first visit before spending another iteration on a new viewer or layout.

Likewise, CANVAS's small presets already preview in the large letter, and POSTMAN already provides a larger delivered-letter view. Kiro's reasoned decision not to add another lightbox is defensible. If a first-time player cannot distinguish a temporary preview from their committed choice, that would justify a small specific improvement; the current lack of human observation does not justify inventing that failure.

The next useful experience evidence is whether an unfamiliar player can explain why the minute returned, identify what their photograph preserved and connect the recipient to the person at the desk, without reading our design documents. A future blind agent visit can find friction but must be labelled simulated. No such agent or person was silently counted in this review.

## Evidence and boundaries

Ignored local evidence:

- `output/playwright/codex-v6-review/checks.json` and twelve per-script logs: independent normal-speed reruns.
- `output/playwright/v6-review.json` and `v6/`: the independent210-state audit route.
- `output/playwright/codex-v6-review/extra-probes.json`: current assets, negative controls, confirmation sequence, unchanged A and successful fallback finish.
- `session-default.png`, `incomplete-replacement-loop.png`, `original-still-finishes.png` and `synthetic-negative-controls.png` in that directory.
- `settled-ending.json` / `settled-ending.png`: settled state after minimum/Arrange/Finish.

Prepared next task: `PROMPT_KIRO_07_CONFIRMACIONES_Y_CIERRE_QA.md`. It asks Claude to reproduce and critique this finding and implement a bounded repair, not redesign the game.

No new app-source changes, dependency installation, Kiro run/credit usage, human play, screen reader, audible sound, physical touch, true background-tab, real missing-font system, non-Chrome run, measured first-use/demo time, publication, push or submission is attributed to this review. Official rules and comparative winners were not rechecked. `PITCH.md`'s local build/evidence status is refreshed; its narration/timing remains a plan, not a recording.
