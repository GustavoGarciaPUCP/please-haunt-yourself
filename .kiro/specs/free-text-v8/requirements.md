# POSTMAN's free text (v8) — requirements

Kiro IDE session, November 9, 2026. Brief: `Kiro brief 08`, based on Codex's `docs/development/29_V7_Deep_QA_And_Long_Text_Layout.md`. This iteration repairs how POSTMAN lays out text the person typed, inside v7. It keeps the four programs, the story of contract 23, v6's drawn-text repairs, v7's confirmations, and every earlier data contract (`.kiro/specs/os-case-v4/`, `playability-v5/`, `visual-precision-v6/`, `confirmation-flow-v7/`). Positions on Codex's proposals are in `design-review.md`.

## 1. Baseline reproduced before any change

`scripts/v8-baseline.mjs` ran on the v7 build (`haunt-U_tkFtyC.js`, About "build v7") with real input: the main route up to CANVAS, then the draft's fields filled through the form and sent. No case state was injected and no limit was exceeded: POSTMAN's own fields accept Subject 120, Message 600 and To 80 characters. The probe enters text with Playwright's `fill`, which inserts it into the real field; typing one key per character gives the same field values and the same stored delivery (measured later, `output/playwright/v8-experiments.json`, and in `check:text`). Results: `output/playwright/v8-baseline.json`, a summary in `v8-baseline-summary.txt`, screenshots in `v8-baseline/`.

| # | Finding | Reproduced result |
| --- | --- | --- |
| A | Both fields at their limits, unbroken (review 29) | At 1366×768 the reading pane is 394 px wide with a scroll width of 4209 px; the heading and the message are 4176.8 px wide; the letter is drawn at 560 px and cut off. At POSTMAN's minimum the pane is 242 px wide, with the same 4209 px. The list is 225 px wide with a scroll width of 866 px, and the selected item's subject is 1506.7 px wide starting 110.8 px left of the list, taking the sender, time and badge out of view. DOM audit: 21 reports at 1366×768 (20 at 1440×900, 17 at 1920×1080), maximized 19. The same in Sent, and after Finish session and a reload. The stored delivery keeps exactly 120 and 600 characters, and the case finished. |
| B | The subject alone | The list as in A; the reading pane 2022 px wide. 19 reports. |
| C | The message alone (new) | The list is fine, but the message widens the whole reading pane to 4209 px: the message and the receipt's sentence are cut off at the pane's edge, and the letter is drawn at 560 px and cut off. The short heading and From/To lines still show, but their boxes are 4176.8 px wide, which the audit reports. 13 reports, at POSTMAN's default size and at its minimum. |
| D | Returned, and the kept draft | The Returned view behaves as A (21 reports). The draft kept after a return shows the long subject in the Drafts list the same way (6 reports). |
| E | An unknown recipient of 80 characters (new) | POSTMAN's notice repeats the address unwrapped, which widens the draft editor to 564 px: the notice is cut off and the To, Subject and Message fields run past the window's edge (the labels' text still shows; their boxes are reported). At POSTMAN's minimum the guest@haunt suggestion and the attached letter's preview are cut off too. 7 reports at 1366×768, 11 at the minimum. |
| F | An incomplete letter with long fields, POSTMAN at its minimum (new) | Fix it in CANVAS lies outside the visible pane; Tab gives it focus, but it is still not in view. 23 reports. |
| G | Neither audit sees a cut-off picture (new) | In A–D the letter canvas lies partly outside its pane, but the DOM audit reports only the text, and the drawn-text audit reports nothing: it checks ink against the paper inside the canvas, not the canvas against its pane. |
| H | Controls with no defect | Long text with spaces and 8 line breaks (113 + 600 characters), a short Unicode sample (Latin accents, CJK, emoji, Arabic, Hebrew, a combining accent), the case's normal content, and a long unbroken command in TERMINAL: 0 reports, no horizontal overflow, stored text identical. (The probe enters 300 characters in TERMINAL; the field's own limit keeps 200, measured in the after run. The v7 run named it a 300-character command.) |

Not changed by any of this: the stored deliveries (exact text), receipts, the phase, and the ability to finish.

## 2. Scope

**In scope:** the findings above; any other place where POSTMAN shows text the person typed; a check of the picture against its pane.

**Not added or changed:** programs, plot, a required step, the field limits (120/600/80), the stored data, the mail model, or dependencies. The save stays `haunt.case.v4`.

## 3. Requirements and acceptance criteria

**R1 No typed text sets a width.**
1. In the message list, the reading pane (delivered, sent, returned, recovered), the draft editor and its notices, no column, track or box grows wider than its pane because of text the person typed.
2. Nothing is pushed out of view sideways: the sender, time, badge, heading, From/To/Delivered lines, receipt sentence, message, actions and the letter stay inside their pane at 1366×768, 1440×900 and 1920×1080, with POSTMAN as it opens, maximized and at its minimum (640×460).
3. A long word breaks only where it does not fit; ordinary words wrap at spaces as before.

**R2 The content stays whole and readable.**
1. The heading shows the full subject and the reading pane the full message, with its line breaks, wrapped and scrolled vertically as needed. No text of the message is hidden.
2. The list shows the whole subject and sender/recipient too, wrapped (a summary was allowed by prompt08 and tried; see design §2 for why it was dropped). A list taller than its column is a keyboard region.
3. Stored deliveries keep exactly the text that was sent (the subject's existing trimming of surrounding spaces is unchanged).

**R3 The letter keeps its shape and fits its space.** The delivered letter keeps its aspect (1.62 Beside, 0.82 Below), scales to the pane's width (at most 560 px as before), and never takes its width from text.

**R4 Actions stay reachable.** Return to the request, Fix it in CANVAS, Open the draft and Send are inside the pane and reachable by pointer and by keyboard; a pane that scrolls stays a keyboard region. The case still finishes, and a reload keeps the end.

**R5 The audits see this class of defect.** The DOM audit also reports a picture (canvas or image) cut off sideways by a box that clips it. No existing rule is relaxed and no exemption is added.

**R6 Preserved contracts.** v7's questions and their keys, immutable snapshots, Copy after the end, the bounded history, the keyboard route, the drawn text of v6 and the main route are unchanged.

**R7 QA.** Regressions with real input for A–H; Guest Inbox, Sent and Returned; a copy after the end; reload; pointer and keyboard; three PC sizes with POSTMAN as it opens, maximized and at its minimum; DOM and drawn-text audits; inspected screenshots; a second browser already installed (Edge) on the main reproduction. Build, unit tests, every browser check and the review route, all rerun.

**R8 Honest records.** Specs, README, AGENTS.md, steering and kiro-usage state what was done and verified, and what was not.
