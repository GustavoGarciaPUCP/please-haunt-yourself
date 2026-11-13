# v5 QA: the complete flow and text drawn inside images

Codex, November 9, 2026. Independent review of the participant-operated Kiro IDE prompt05 delivery. The participant supplied an ECHO screenshot with text extending past the note. This review reproduces that screenshot defect, rechecks the case and prepares a focused next IDE task. It does not change application source or claim another Kiro run.

## Judgment

The v5 changes improve the actual case, not only its appearance. The previous save-retention, lost-writing recovery and minimum-window defects are repaired on the exercised routes. Default guidance no longer prints the Bell solution. CANVAS offers an expressive photograph choice that reaches the delivered letter; the final receipt presents the same live glass and the player's letter together.

Keep that base and visual identity. The next pass should repair drawn-image layout and a source-description contradiction, then verify them through the whole artifact chain. This QA did not find a new functional blocker on the tested complete routes. It does not establish that every path is defect-free or that the game is outstanding to a person.

The strongest distinctive operation remains ECHO as a movable view onto the same desktop glass. CANVAS now expresses a real choice about the resulting image. That choice is optional and expressive; it should not be sold as another required logic puzzle. POSTMAN still asks the player to connect the note to the guest identity. Adding a mandatory program, arbitrary gate or more clicks is not justified by these findings.

## Verified current build

Rebuilt production and loaded its exact assets in an isolated Chrome session:

- JavaScript: `haunt-DuQWST70.js`.
- CSS: `haunt-CxGB5zKC.css`.
- Fictional OS: HAUNT OS 4; implementation identifier: v5; save: `haunt.case.v4`.
- URL checked: `http://127.0.0.1:5174/haunt.html`. The root entry is still the preserved paper-bridge prototype.
- `npm.cmd run build`: passed.
- `npm.cmd test`: **125 tests in 12 files passed**.
- Ten existing browser scripts: **57 journeys**, no recorded page errors.

| Browser check | Journeys |
| --- | ---: |
| windows | 7 |
| drag | 5 |
| Halloween | 4 |
| ECHO | 7 |
| letter | 9 |
| case | 9 |
| natural keys | 1 |
| console | 5 |
| recovery | 5 |
| guide | 5 |

`review:v5` was rerun: **59 states at each of 1366×768, 1440×900 and 1920×1080**, 177 generated screenshots, zero reported DOM audit problems and zero page errors. Selected screenshots were inspected, including minimum TERMINAL, CANVAS, the receipt and finished states, and independent ECHO session-source screenshots. This is not a claim that every pixel of all 177 images was manually examined.

## Additional exploratory QA

No internal case state was injected. The gameplay routes use the real interface. One diagnostic hook observed canvas text calls and their font measurements while allowing the original draw calls to run normally.

### Opening programs early and solving the first encounter early

1. Open CANVAS before a capture: it explains the missing source.
2. Open POSTMAN before the letter: Mara's recovered message is available.
3. Return to TERMINAL, inspect the Bell and stop the call **before watching a failed attempt**.
4. Let the minute finish: the impression reaches the glass with **zero returns**. An unnecessary failure is not imposed.
5. Capture the glass with ECHO, use it in CANVAS, lift the writing and choose Figure / no mist.
6. Compose, attempt the address `admin`: the error states the two actual local mailboxes and keeps the draft.
7. Correct to guest, deliver and finish. The snapshot contains **Figure**, mist 0 and Mara's **five lines**.
8. Reload: the same run remains finished.

Result: completed, with no page errors. `figure-choice.png` and `figure-ending.png` show the actual artifact, including the selected framing. A partial figure at a frame edge is a player composition, not proof of an accidental crop. Do not automatically replace the player's frame to make a prettier demo.

### Force, retry and recovery remain causally connected

1. With retry on, choose Force it out from the **Way out** inspector. The job returns once; it has not been permanently removed.
2. Stop the call, then force it out. A shadow remains and there is no glass impression yet.
3. Call it back and let it finish. The impression reaches the glass and contains the five lines; retry stays off.

Result: completed, with no page errors. The first exploratory harness selected the Figure inspector for Force, although the control belongs to Way out. The harness was corrected; that hidden-button timeout was not an application defect. The final exploratory report records the correctly exercised route.

## Open defect 1: both text runs extend beyond the paper in ECHO's session image

**Confirmed visual defect.** Reproduced in the current production build at default and maximized ECHO, and still present in the paused source and retained session capture. It matches the participant's screenshot.

Location: `src/haunt/glass-render.ts`, `drawSessionFrame()`, the "Mara's note" block. It draws the session in a **320×200 logical coordinate space**. The paper is **70×34**, rotated slightly. Its text has fixed fonts and start positions; there is no text layout within the available paper width.

Measured with the actual installed handwriting font used by Chrome:

| Text | Font | Start x | Measured width | Right edge | Paper right edge |
| --- | --- | ---: | ---: | ---: | ---: |
| `FOR THE NEXT PER—` | 7 px handwriting | 5 | 81.53 | **86.53** | 70 |
| `— Mara, 31 Oct 1987` | 5 px handwriting | 22 | 59.31 | **81.31** | 70 |

Scaling ECHO scales paper and text together, so maximizing cannot repair these proportions. A CSS `overflow` fix on ECHO's window would not lay out these canvas glyphs.

Required next result: keep the intended fragment and signature visibly inside the paper with margins, using actual text metrics, sensible wrapping/positioning and a readable layout. A final clip may guard the paper boundary, but must not be the sole fix that simply hides letters. Check bearings/italic overhang, font availability, rotation, DPR and the logical layout used by small and large render targets.

The dash in `FOR THE NEXT PER—` is an intentional **unfinished sentence**, not an instruction to supply the complete letter early. Do not repair the drawing by inserting all five glass-writing lines into a session capture. Session images must remain unable to provide the complete recoverable writing.

## Open defect 2: the LIVE/PAUSED label covers the session's own header

**Confirmed visual overlap.** In default and maximized ECHO, `.echo-overlay-source` lies over the canvas-drawn `last.session — recorded 23:59 [PID]` header. In the independently captured default view, the overlay starts at approximately (651.0, 141.6), inside a canvas starting at (619.0, 132.6); both paint the same top strip. The screenshot shows mixed header text through/around the badge.

Entry points: `src/haunt/echo-view.ts` (`.echo-overlay-source`, `renderLive()`), `desktop.css` and `drawSessionFrame()`'s header. Give source/transport metadata and the image's own content deliberate, non-overlapping space. Claude should choose the smallest coherent layout, preserving LIVE/PAUSED clarity, recorded time and useful request identity.

Test Live, Pause, Resume, minimum/default/maximum, captures and source changes. Moving or hiding a header in only one view must not create inconsistent retained images or falsely change the case. Do not hide the entire source image or make the metadata tiny just to fit.

## Wording inconsistency: "No writing" beside a visibly written note

**Confirmed interface mismatch; severity for comprehension is untested with people.** The session source visibly contains the unfinished paper note and signature, but its chips say **No writing** and its capture verdict says it holds no writing. The model means "no complete recoverable glass-writing layer". A person sees ordinary written words on a note.

Preserve the model distinction, but express it in the player's terms. Possible direction: "Unfinished note" for that source and a brief explanation that the complete message has not reached the glass. The exact wording must follow the case phase, including the empty-window state, and must not give the Bell solution away. Claude should critique this wording; the goal is consistent evidence, not technical terminology or another tutorial paragraph.

## Before / After / Why

The After column below is a **recommended next result**, not a claim that these repairs are already implemented.

| Before | After | Why |
| --- | --- | --- |
| Note fragment and signature run past a 70-unit paper | Measured, readable layout keeps both inside the paper with margins | The drawing must respect its own physical object |
| LIVE/PAUSED badge overlays the recorded-session header | One coherent allocation for transport metadata and source content | Both identities remain readable |
| Session chips say No writing next to a written fragment | Distinguish the unfinished note from the complete glass message | The visible evidence and description agree |
| DOM audit reports zero issues even when drawn words overflow | Add targeted canvas-layout/ink checks plus inspected raster screenshots | Text painted in pixels is absent from the DOM text audit |
| Choosing what the photograph keeps changes the delivered snapshot | Preserve that same visible choice in the letter and ending | This is actual agency already working in v5 |
| Early correct Bell action reaches the glass with zero failures | Preserve the successful early route | Guidance must not turn discovery into compulsory mistakes |

## What to keep

- The current desktop/window design and distinct application identities. Do not reskin the whole OS in response to a localized drawing defect.
- One actual case across four programs; same source, retained capture, editable letter, immutable delivery and matching acknowledgment.
- The repaired retention limit, post-finish Copy semantics, visible Recover the writing and compact minimum-size windows.
- Optional help with an explicit answer only on request; honest incorrect-address feedback.
- The same live glass in the receipt and the visible final letter; no automatic rearrangement of the player's windows.
- The photograph choice as a real expressive decision, and the possibility of accepting its default. Do not add an obligatory cosmetic selection merely to claim more depth.
- Undo for current edits, reload continuity, source ownership, strict save validation, keyboard access, reduced motion and sound-off behavior.

## Next experience improvements to evaluate, without a redesign

1. **Recognizable image choices.** The three CANVAS previews are small at 1366×768. Hover/focus and selection affect the larger letter, which helps. Verify that the player can see the actual difference and distinguish a temporary preview from the chosen result. Improve presentation only if the evidence warrants it; preserve identical pointer/keyboard choices.
2. **A readable keepsake.** The receipt correctly scales the real letter, but its thumbnail is small. Evaluate an explicit read/view action for the same immutable delivered letter if the existing Guest Inbox view is insufficient. A larger inspection view is a usability improvement, not another puzzle or required ending step. No automatic window resizing or replacement by a generic card.
3. **Pacing with a person.** The default route is now more coherent, but the optional photograph choice may still be ignored and the final glass view may feel small. Those are open player-experience questions. A useful first visit asks the person to explain the retry cause, what they kept in the photograph and who received the letter, without leading them to an answer.

Do not claim a simulation or automated route proves enjoyment, novelty against every game, a winner-level standard or a measured human play time. This pass found a stable tested flow with remaining visual precision work, not grounds for another central-concept reset.

## Evidence and limits

Ignored local evidence:

- `output/playwright/codex-v5-qa/checks.json` and the ten per-script logs: independently rerun existing checks.
- `output/playwright/v5-review.json` and `v5/`: rerun of the existing 177-state route.
- `output/playwright/codex-v5-qa/exploratory.json`: measured text overflow, current bundle IDs, early-correct/out-of-order/invalid-address route and Force/recovery route.
- `session-default.png`, `session-maximized.png`, `session-paused.png` and `session-retained.png` in that directory: the note and header defects through multiple surfaces.
- `figure-choice.png`, `figure-ending.png`, `forced-shadow.png`: actual gameplay artifacts and states.

No new human playtest, audible sound verification, real screen reader, physical touch test, true background-tab test, non-Chrome run, CPU-throttle rerun or human/demo time measurement was performed. The functional checks are evidence for their specific routes, not a blanket 100% QA certification. Official hackathon rules and earlier winners were not rechecked in this local technical review.

No application code, dependency installation, native desktop automation, Kiro credit usage, publication, push or submission is attributed to this Codex review. The next prepared task is `Kiro brief 06`.
