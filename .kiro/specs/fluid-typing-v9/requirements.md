# Fluid typing and the active window (v9) — requirements

Kiro IDE session, November 10, 2026 (the brief and the reviews it builds on are dated November 9). Brief: `Kiro brief 09`, sections 1–9. It builds on Codex's `docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md`, with the event context of reviews 31 and 32.

This iteration changes two things in the v8 build, and nothing else:
- the work a keystroke in POSTMAN causes;
- the active-window frame after a window closes or minimizes.

It keeps the four programs, the story of contract 23, the v8 free-text repairs and every earlier data contract (`.kiro/specs/os-case-v4/`, `playability-v5/`, `visual-precision-v6/`, `confirmation-flow-v7/`, `free-text-v8/`). Positions on Codex's proposals are in `design-review.md`.

## 1. Baseline measured before any change

### 1.1 The typing profile

**How it was run.**
- `scripts/v9-typing-profile.mjs` drives the real route with real input up to POSTMAN's draft: the call stopped, the glass, ECHO framing the hand, Capture, Use this capture, Lift the writing, Compose.
- It then types the same 60 keys (`abcdefghij` × 6) one at a time with Playwright's `pressSequentially`, at 1366×768 in headless Chrome 157.
- Per key it records:
  - the synchronous work of the `input` event (a capture listener and a bubble listener on `window`);
  - DOM mutation records, attributed to the window they happened in;
  - canvas drawing calls (`drawImage`, `putImageData`, `fillRect`, `clearRect`, `fillText`, `strokeText`, `fill`, `stroke`);
  - case-save writes.
- A plain textarea with no app listener is the control.
- A "light" page repeats two conditions with only the timer and the save counter, to show the instruments' own cost.

**The build.** The v8 build (`haunt-CjGjZ4b_.js`) was copied to `output/playwright/v9-before-dist/` before any change. It is served on port 5175, so later runs compare both builds under the same conditions. Two runs (`v9-profile-v8-a.json`, `v8-b.json`, summary in `v9-summary-v8-a+v8-b.txt`) gave identical counts. Their wall times per key differed by up to 28 %. Two later v8 runs, alternating with v9, are in `tasks.md`.

| v8, 60 keys | Wall time per key | Synchronous work, median | Save writes | Mutation records per key | Drawing calls per key |
| --- | --- | --- | --- | --- | --- |
| Control textarea, four programs open | 2.7–5.3 ms | 0.0 ms | 0 | 0 | 0 |
| Message, four programs, ECHO on Captures | 27.8–38.6 ms | 16.3–20.0 ms | 60 | 63: ECHO 26, CANVAS 15, POSTMAN 14, desktop 6, TERMINAL 1, detached 1 | 766: offscreen 398, POSTMAN 270, ECHO 98 |
| Same, light instruments | 27.1–27.6 ms | 14.7–14.8 ms | 60 | not counted | not counted |
| Message, ECHO on Live · Desktop glass | 31.6–32.6 ms | 17.5–18.9 ms | 60 | 52 | 766 |
| Message, only POSTMAN open | 12.6–15.5 ms | 6.9–8.6 ms | 60 | 20: POSTMAN 14, desktop 6 | 505: POSTMAN 270, offscreen 235 |
| Message after Finish session, 3 deliveries | 29.8–30.5 ms | 17.6–17.9 ms | 60 | 66 (TERMINAL 5) | 859 (TERMINAL 93: the receipt's live glass) |
| Message, four programs, 4× CPU (Chrome simulation) | 125–132 ms | 94.6–99.2 ms | 60 | 63 | 766 |

### 1.2 Where the time goes

`output/playwright/v9-cpu-profile.mjs` ran on an unminified build of the same v8 source (`output/playwright/v9-v8-unminified/`). It used Chrome's sampling profiler at 100 µs, over the same 60 keys (`v9-cpu-v8-unminified.json`). Inclusive time per key:

| Work after one key | ms per key | Share |
| --- | --- | --- |
| Everything under `MailModel.updateDraft` | 19.6 | 100 % |
| ECHO's `render` (it rebuilds the capture list and redraws the capture's picture) | 8.6 | 44 % |
| POSTMAN's `render`; of it, `drawLetters` (redrawing the attached letter) | 6.65; 6.0 | 34 %; 31 % |
| CANVAS's `render` (no drawing: forced layout from reading sizes, and DOM writes) | 2.7 | 14 % |
| `CaseStore.persist` (serializing and writing the save) | 1.0 | 5 % |
| The desktop shell's `render` | 0.35 | 2 % |
| `CaseStore.computePhase` | 0.11 | < 1 % |
| TERMINAL's `renderReceipt` | 0.02 | < 1 % |

By self time, `getBoundingClientRect` alone took 11 % of all sampled time: forced synchronous layouts, after one view wrote to the DOM and the next read a size.

### 1.3 Findings

| # | Finding | Evidence |
| --- | --- | --- |
| A | A keystroke in POSTMAN makes ECHO, CANVAS, TERMINAL and the desktop render, although none of them shows the mail draft. | Mutation records in all four windows (table above). In `src/haunt/`, `store.mail.draft` is read only in `postman-view.ts`. The phase does not read the mail draft (`derivePhase`). |
| B | ECHO redraws the selected capture's picture and rebuilds its capture list on every key. | ECHO: 98 drawing calls and 26 mutation records per key; 8.6 ms per key. |
| C | POSTMAN redraws its attached letter on every key, although neither the letter nor its size changed. | POSTMAN: 270 drawing calls per key, and 235 more in offscreen canvases; `drawLetters` 6.0 ms per key. |
| D | POSTMAN rebuilds its mailbox list and message list, and rewrites unchanged attributes and text, on every key. | 14 mutation records per key in POSTMAN for a key that changes only the Message (the list does not show it). |
| E | After Finish session, TERMINAL redraws the receipt's live glass on every key typed in a copy. | TERMINAL: 93 drawing calls per key. Review 30's profile did not include this state. |
| F | The save is written on every key and is a small part of the cost. | 60 writes per 60 keys; `persist` 1.0 ms per key, of which the storage write itself is about 0.3 ms (`output/playwright/v8-typing-cost-split.json`, free-text-v8). |
| G | The active-window frame disagrees with the active window after a window closes or minimizes. | Reproduced, with no typing instrument: TERMINAL active; open ECHO; close it with X; TERMINAL is pressed in the taskbar, but its frame keeps the inactive style; a click in its field does not correct it. Also: with only POSTMAN left (profile A), `.is-active` is false while the taskbar shows it pressed. A minimized window keeps `.is-active` while hidden. |
| H | The scripts' `bringForward` helpers decide from `.is-active` whether to press a taskbar button. While G holds, they can minimize the very window they meant to bring forward. | `scripts/check-free-text.mjs` and others; Codex's first typing harness stopped on this (review 30). |
| I | Typing at machine speed (as fast as the page accepts keys) delays frames. | Chrome's Event Timing in headless Chrome: keydown to next frame, median 104–168 ms on v8 against 24 ms for the control. This is a backlog of automated input, not a person's latency; paced typing is measured separately (design §5). |

## 2. Scope

**In scope:**
- Findings A–H.
- The measurement itself: the profile and the comparison, before and after under the same conditions.

**Not added or changed:** programs, plot, puzzles, help, a required step, the field limits (To 80, Subject 120, Message 600), what is saved, when it is saved, image quality, or dependencies. The save stays `haunt.case.v4`. No state framework, no event layer beyond what A needs, no deferred save, no grouping of keys per frame.

## 3. Requirements and acceptance criteria

**R1 A key in POSTMAN does POSTMAN's work only.**
1. Typing in To, Subject or Message updates the mail draft, POSTMAN's pertinent content and the save. ECHO, CANVAS, TERMINAL and the desktop do not render: no DOM mutation and no drawing in their windows.
2. POSTMAN does not redraw a letter whose content and canvas size are unchanged, and does not rebuild lists whose content is unchanged.
3. Every other change still reaches every view: a capture, a letter edit, a send, the phase, a receipt, Finish session, Start the case over, recovery, and the save state (Saved / Session only).
4. A reopened or restored window shows the current state without needing another event.

**R2 Typing stays exact.**
1. Every character reaches the draft, within the same limits, with the same Unicode handling.
2. The caret, selection, editing in the middle, paste, delete and the field's own Undo keep working. The active field is never replaced or rewritten while it is being typed in.
3. Send right after the last key sends exactly what was typed. Closing and reopening POSTMAN, and a reload, show exactly what was typed.

**R3 Questions stay honest.** An open question closes when its draft, letter, attachment, recipient or the session changes (v7's contract). No answer sends something other than what it was asked about.

**R4 Data stays whole.**
1. The save is still written synchronously on every edit; the last key is never lost.
2. "Session only" and "Draft saved" stay true.
3. Delivered letter A and draft B stay independent; copies after the end do not change the accepted letter.

**R5 The active window looks active.**
1. At every moment, the window that the model treats as active (the one the taskbar shows pressed) has the active frame, and no other window has it. A minimized or closing window is not active.
2. Closing or minimizing the active window gives the frame to the window that becomes active, at once. No focus moves as a side effect: close and minimize keep v4's focus policy.
3. Window order, geometry and the case are not reset.

**R6 Evidence.**
1. The same profile and conditions, before and after, on both builds at the same time.
2. The counts (mutations, drawing calls, saves) are compared exactly; the timings as ranges over repeated runs.
3. Paced typing and a 4× CPU simulation are labelled as such. The instruments' cost is shown.
4. No claim is made about how a person perceives speed.

**R7 QA.**
- Key-by-key typing, editing in the middle, selection and replacement, paste near the limits.
- Send right after the last key, close and reopen, reload.
- An open question, then a real change of its content.
- The four programs open, minimized and restored, and only POSTMAN.
- Storage blocked, then readable again.
- A and B, and copies after the end.
- The full route by pointer and keyboard.
- The active window: close and minimize with a window behind it, click and type in the one that remains, close the last one, restore, and keyboard.
- Build, unit tests, every browser check, the 210-state review route, Edge for the new checks.

**R8 Honest records.** Specs, README, AGENTS.md, steering and kiro-usage state what was done and verified, and what was not. The dates and the history are not changed (brief §9).
