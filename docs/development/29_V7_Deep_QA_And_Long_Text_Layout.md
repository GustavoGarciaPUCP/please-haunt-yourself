# v7 deep QA: completion, recovery and long-text layout

Codex, November 9, 2026. Independent review of the participant-operated Kiro IDE prompt07 delivery, requested to verify visual overlap, the complete flow and the ability to finish. The participant's subsequent detailed report was incorporated into the same review. Application source was not changed by this pass.

## Judgment

The game can be completed on the verified routes. V7's combined confirmation resolves the previous loop, and the route remains finishable after deliberately replacing a valid letter with an incomplete one, correcting it, reloading and sending a post-finish copy. The current desktop design and four-app case should be retained.

With the normal story content, the existing 210-state route reported no DOM or drawn-text layout problems. This is scoped evidence, not a claim that every possible input is free of overlap. Additional QA found one **P2 long-text layout defect** in POSTMAN: permitted unbroken text expands the reading content and message list, clipping text and the letter. The data stays intact and the tested case still finishes.

Prioritize that bounded repair and then first-visit evidence. Another application, compulsory interaction or visual reset is not justified by the current findings. Technical stability is substantially better; fun and comprehension with an unfamiliar person remain unobserved.

## Independently verified current build

- `npm.cmd run build`: passed. Isolated browser pages loaded `haunt-U_tkFtyC.js` and `haunt-WVQaX4Df.css` from `/haunt.html`.
- `npm.cmd test`: **161 tests in 14 files passed**, including the new confirmation/property tests.
- All **13 existing browser scripts passed again**, **83 recorded outcomes**, no recorded page errors. Counts: windows 7, drag 5, Halloween 4, ECHO 7, letter 9, case 9, natural keys 1, console 5, recovery 5, guide 5, drawn text 12, paths 6 and confirmations 8.
- Re-ran `review:v6` against **v7**: **70 states at each of 1366×768, 1440×900 and 1920×1080**, 210 generated screenshots, zero reported DOM/drawn-text problems and zero page errors. Selected screenshots were inspected; this is not a pixel-by-pixel manual review of all 210 images.
- Additional independent **Microsoft Edge 157.0.4341.42** headless route at 1366×768 completed an adverse four-app case, incomplete replacement/recovery, final acknowledgment, reload, an unattached post-finish copy and explicit Replay. Edge was already installed; a temporary isolated browser profile was used.
- A separate Chrome route tested the allowed maximum subject/message with unbroken text, recorded the resulting layout failures at default and minimum size, then successfully finished the case.

The normal-speed suite was rerun here. Kiro's reported five 4× checks were not repeated in this pass. The Edge route is additional compatibility evidence for that route, not a full Edge repetition of all 13 scripts or proof about Firefox/Safari.

## The previous defect is closed on the exercised paths

The combined question states both incompleteness and replacement. One answer commits one new delivery. It does not reuse an answer for a changed draft; the attachment flag remains boolean and can be changed through the real interface. The new checks exercise cancelled, stale, double-click and keyboard answers, including POSTMAN's minimum and all three PC sizes.

In the independent Edge route:

1. Delivered complete A, before finishing the job.
2. Reset the letter in CANVAS so B was incomplete, then composed and sent it.
3. Accepted **Send anyway and replace** once. B arrived incomplete; A remained byte-identical. The phase correctly fell back to Capture retained.
4. Opened B's receipt in TERMINAL: it explained the missing writing and offered no Finish session.
5. Lifted the writing in CANVAS and sent complete C. No unnecessary Replace question appeared.
6. Returned C's receipt and chose Finish session. The glass released and the actual final letter remained available.
7. Reloaded: the same run and accepted C remained.
8. Composed another copy, unticked the attachment and accepted its incomplete-copy question. This created a letter-less copy; accepted C and the finished phase remained, also after reload.
9. Explicit Replay created another run, with no current deliveries and four historical deliveries in Archive.

That is a concrete tested way through the error and to the real ending. It does not reinstate A after replacement; the documented recovery is to correct and send the letter again.

## New defect: accepted long text controls POSTMAN's intrinsic widths

**P2 visual robustness defect. Confirmed. No observed data loss or total-game block.**

Reproduction using the actual form and real sends:

1. Prepare a complete letter normally through TERMINAL, ECHO and CANVAS.
2. Compose in POSTMAN.
3. Set Subject to 120 consecutive `W` characters — exactly the allowed maximum.
4. Set Message to `abcdef` repeated 100 times — 600 characters, exactly its allowed maximum.
5. Send to guest. Inspect the delivered message, its list row, receipt and letter at default size.
6. Resize POSTMAN to 640×460 and inspect again.

Observed at 1366×768:

- The list's subject runs outside its column, including to the left; sender/time/badge visibility is also affected.
- The reader's text establishes a huge internal width, so the subject, body, metadata, receipt text and photograph extend beyond the visible panel. The letter is scaled/clipped by that expanded layout rather than simply fitting its pane.
- At minimum size, the reading pane is **242 CSS px** wide with a **4209 px scroll width**. Its heading/body children measure roughly **4177 px** wide. The message-list pane is 226 px wide with 866 px scroll width; the subject itself is about 1507 px wide.
- The DOM audit records **21 reports at default and 21 at minimum**. These are repeated manifestations of the same long-content layout problem, not 42 independent defects.
- The stored delivery retains exactly 120 subject and 600 message characters. Return to the request remained usable in this probe; the case reached finished.

The limits are supplied by the application itself (`MAX_SUBJECT=120`, `MAX_MESSAGE=600`). This was neither a modified save nor an input beyond those limits. It is an optional-content boundary case; the default narrative text did not reproduce it.

Entry points: `src/haunt/desktop.css` around `.message-item`, `.item-subject`, `.reading-pane`, `.mail-head`, `.mail-body` and `.mail-message`. The code allows unbroken content to establish intrinsic grid widths; the text blocks lack suitable wrapping/minimum-width constraints. Inspect tracks and inherited alignment as well as text wrapping before choosing the smallest fix. Do not merely force the outer window to hide the overflow.

Required result: render all accepted content within bounded columns, with readable wrapping and normal vertical scroll. Keep the exact stored payload and the photograph's aspect. An intentional list summary can be considered, but the full content must remain accessible in the reading view. Do not lower the input limits, silently truncate delivered data, change the picture or relax the auditors to obtain a pass.

Add separate subject-only and message-only regressions as well as the combined case, normal spaced text and a short Unicode sample. Test the shared Delivered/Sent/Returned views, reload and actual pointer/keyboard access. The current probe establishes the combined case; it does not claim those separate cases were independently exercised already.

## Before / After / Why

The After column distinguishes verified v7 behavior from the proposed next repair.

| Before | After | Why |
| --- | --- | --- |
| Incomplete replacement alternated between two questions | **Verified v7:** one combined question, one delivery | The allowed operation completes without losing its warnings |
| A question could outlive its letter | **Verified by the current checks:** answers are tied to the actual attempt | A stale answer must not send different content |
| Attachment edits could store a string and fail to untick | **Verified v7:** boolean flag and functioning checkbox | Unattached sends are an honest, testable state |
| Main-flow verification had been limited to Chrome | **Additional evidence:** one complete adverse route in installed Edge | Broader evidence of actual completion without installing software |
| Unbroken allowed subject/body expand list and reader | **Proposed next:** constrained tracks, wrapping and unchanged payload | Optional customization must not break reading or obscure the letter |

## Experience and design decision

Keep the current OS, characteristic application palettes, real window motion, source/retained-capture relationship, photograph choice and visible live-glass release. The same object passes through the four apps and returns at the ending. This is the project's coherent core.

The complete route is not four unrelated puzzles. TERMINAL resolves the retry cause; ECHO supplies spatial exploration; CANVAS gives the player an expressive image decision; POSTMAN asks the recipient question; the receipt closes the original job. These decisions have different roles. Do not count clicks, automatic animations or explicit help as extra puzzles.

No new required interaction is recommended by this review. The optional photograph choice, the four-sentence combined question and the small signature remain things to observe in a first visit. Essential author/date facts are available outside the small drawing; this QA did not find a progression gate that requires reading only its 5 px signature.

The existing first-visit protocol is ready in `.kiro/specs/confirmation-flow-v7/first-visit-protocol.md`. A later blind agent visit could find friction but would be a simulation, not a person or proof of enjoyment. Neither such an agent nor a human playtest was run in this pass. Avoid claiming 100% QA or a winning standard from the test counts.

## Evidence and limits

Ignored local artifacts:

- `output/playwright/codex-v7-review/checks.json` and 13 per-script logs: current independent suite.
- `output/playwright/v6-review.json` / `v6/`: the 210-state route rerun on the v7 bundle.
- `output/playwright/codex-v7-review/additional-routes.json`: Edge adverse completion/copy/reload/replay, and the allowed long-content measurements. A diagnostic section marked `ok` means its route completed; the nested audit reports explicitly retain the long-text failure.
- `edge-combined.png`, `edge-finished.png`, `long-fields-default.png` and `long-fields-minimum.png` in that directory.

No app-source changes, dependency installation, native desktop control, new Kiro run/credit spend, human play, real screen reader, audible speaker verification, physical touch, true background-tab test, Firefox/Safari run, new throttled run, measured human/demo timing, publication, push or submission is claimed. Official rules and past winners were not rechecked in this local QA review.

The prepared next participant-operated task is `PROMPT_KIRO_08_TEXTO_LIBRE_Y_CIERRE_VISUAL.md`. It asks Claude to reproduce and critique the new finding and repair this bounded layout case while preserving v7. PITCH's local build/evidence status is refreshed; its timing and narration remain a plan.
