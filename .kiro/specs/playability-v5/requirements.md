# Playability and a visible ending (v5) — requirements

Kiro IDE session, November 8, 2026. Brief: `PROMPT_KIRO_05_JUGABILIDAD_Y_CIERRE_VISIBLE.md`, based on Codex's `docs/development/26_V4_Independent_Review_And_Experience_Priorities.md`. This iteration repairs v4 and improves decisions inside it. It keeps HAUNT OS's visual identity, the four programs, the story of contract 23 and every v4 data contract (`.kiro/specs/os-case-v4/`). Positions on Codex's proposals are in `design-review.md`.

## 1. Baseline reproduced before any change

`scripts/v5-baseline.mjs` ran against the v4 build (`haunt-Bxlu_uWT.js`) with real pointer and keyboard actions; no case state was injected. Results are in `output/playwright/v5-baseline.json`, screenshots in `output/playwright/v5-baseline/`.

| # | Finding | Reproduced result |
| --- | --- | --- |
| A1 | History eviction after Finish session | After 13 returned sends to Mara, 12 deliveries remain and accepted letter A (id 2) is gone while the acknowledgment still names it. Reload: "The saved case could not be read", a new run, phase Repeating, 0 deliveries. |
| A2 | The same flood before Finish (not in review 26) | The intended delivery (id 2) is evicted; the phase falls back to Letter draft ready; reload also resets the case. |
| B | Lost writing after reload | Before reload: writing `lost`, Undo enabled. After: still `lost`; the readiness line and the Writing panel both say "Undo brings it back"; Undo and Lift the writing are disabled. |
| C | Minimum window sizes at 1366×768 | TERMINAL 480×420, Bell page: Back to the prompt, Muffle the bell and Stop the call are clipped or outside the window. Hint page: Tell me exactly is outside it. ECHO 640×480, Captures: the capture status is clipped; after Use this capture, Discard is outside the window. ECHO Live, CANVAS 680×500 and POSTMAN 640×460 reported no problems of their own. |
| D | Default guidance | The opening job strip says "Next: Stop the call." before any attempt or hint. Are you okay? answers "the call starts the same minute again". POSTMAN labels the recipients "Mara, who wrote the note (1987)" and "you, at this desk now" before the choice. |
| E | Final release | At 1366×768 on the standard route the hand is at (669.6, 306.2) and `elementFromPoint` there is `window-terminal`; the release runs behind TERMINAL and POSTMAN. |

A Tab-order probe (`output/playwright/tab-probe.json`) shows the existing "keyboard-only" route relied on programmatic focus in places; natural traversal had not been checked.

## 2. Scope

**In scope:** the five findings above, a perceptible CANVAS decision, a visible ending, adaptive layouts at every allowed window size, and a natural-keyboard route check.

**Not added:** programs, plot branches, a second puzzle in CANVAS, new storage formats, dependencies or a restyle.

## 3. Requirements and acceptance criteria

**R1 Retention.** Bounded mail history never removes the delivery the job relies on (the intended one) or the one it accepted.
1. With 13 or more returned sends before or after Finish session, the intended and accepted deliveries remain. Reload restores the same run, phase, letter and receipt.
2. History stays bounded at 12 deliveries per run (6 archived). Save validation stays strict: an unresolved reference is still rejected.
3. After Finish session, Send to guest delivers another copy. It never asks to replace, never changes the job's accepted letter and is labelled as a copy sent after the end.

**R2 Recovery in CANVAS.**
1. Every recovery instruction names an action that is available at that moment, in the current panel, including after a reload.
2. When the writing was lost, Recover the writing restores the captured lines from the letter's own copy of the capture onto the paper. It keeps the frame, mist, paper and note position.
3. A capture without writing (session or limited) can never gain words.
4. The control that only removed the words ("Take it off the paper") is removed.

**R3 Every allowed window size is usable.**
1. At each app's minimum size and at default, maximized and unusual placements, at 1366×768, 1440×900 and 1920×1080, the following are visible, unclipped and hit at their centres, or reachable in a real scroll region by pointer and keyboard: every control of TERMINAL (session, every inspector page, Under the hood), ECHO (Live, Captures, confirmation), CANVAS (draft, recovery, reframe, reset) and POSTMAN (draft, confirmations, receipt).
2. A minimum size is changed only with a stated reason.
3. The layout audit is not relaxed to pass: a partially visible control is accepted only inside a genuinely scrollable region.

**R4 Orientation without the answer.**
1. Before any investigation or help, no default surface names the exact fix (Stop the call). It names the problem: what is still pending.
2. The watched return, the bell and the cord give the causal evidence. The hint gives a nudge first; the exact answer comes only on a second request. An early correct action still works, and no failure is required.
3. POSTMAN keeps both addresses recognisable and the guest identity visible. Labels state facts (who last signed in when). They do not state the story's conclusion before the choice. The confirmation after delivery and explicit help stay.

**R5 A CANVAS decision with a visible consequence.**
1. CANVAS presents what the photograph keeps (the handprint in the mist, the figure behind it, or both) as previews rendered from the letter's own capture data. Their captions are the subjects actually present.
2. Choosing changes the delivered picture. A choice that would erase writing still in the mist says so before it is made.
3. Lift the writing shows which captured material moves to the paper and where it goes.
4. The same choices work by keyboard. A quick route remains. No precision task, invented words or single required composition.

**R6 A visible ending.**
1. At the receipt, TERMINAL shows a live view of the same glass at the handprint, beside the delivered letter, without moving, closing or minimizing any window.
2. Finish session commits once. The release then plays in that view and on the desktop; it reads the same model at the same coordinates.
3. Reload, interruption and reduced motion show the same final state. The finished card shows the actual letter and names what its photograph keeps.

**R7 Keyboard reachability.** A browser check completes the whole case using only Tab, Shift+Tab, Enter, Space, arrows, typed text and documented shortcuts, with no programmatic focus. It records how many key presses each step needed.

**R8 Honest verification.** Build, unit tests, all browser checks, new regressions for R1–R7 and inspected screenshots at three PC sizes and the minimum sizes. Documentation states what was verified and what still needs people.
