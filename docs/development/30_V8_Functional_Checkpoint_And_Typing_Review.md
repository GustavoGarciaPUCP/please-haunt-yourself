# V8 functional checkpoint and typing review

Independent Codex review, 9 November 2026. Reviewed production: `haunt-CjGjZ4b_.js` / `haunt-9asRCWsn.css`, About **HAUNT OS 4 · build v8**, at `/haunt.html`. The fictional OS and save remain version 4. This reviews the participant-operated Kiro IDE delivery of prompt08; it does not claim another Kiro run.

## Judgment

**The implemented four-program case completes, and no new progression blocker was observed on the exercised routes.** Review29's long-input layout defect is repaired without shortening the accepted text. The earlier confirmation-loop repair still holds, including replacement, correction, a finished-case copy, reload and replay.

Keep the current story, applications and visual identity. V8 is a suitable baseline for a first-visit playtest. Another program or puzzle is not justified by these findings. Two bounded polish items remain: unnecessary rendering while typing in POSTMAN, and an inconsistent active-window frame after closing another window. Neither prevented completion. Neither establishes that people understand the mystery or enjoy it; that still needs observation.

## Independently repeated checks

| Check on v8 | Result | Scope |
| --- | --- | --- |
| `npm.cmd run build` | Pass | Current production assets above; historical prototype also builds. |
| `npm.cmd test` | 161 tests, 14 files, pass | Existing unit/model tests. |
| All 14 browser scripts | 93 recorded outcomes, all pass; no page errors | Normal-speed Chrome, including text, confirmations, drawn text, paths, windows/drag, letter, case and keyboard. |
| `npm.cmd run review:v6` | 210 states, zero reported DOM/drawn-text problems or page errors | Historical script name; rerun on v8 at 1366×768, 1440×900 and 1920×1080. Generates 210 screenshots; selected screenshots also inspected visually. |
| Additional isolated Edge route | Pass; no page errors | Installed Edge 157.0.4341.42; adverse replacement/recovery, finish, reload, unattached copy and replay. |
| Additional allowed-long-input route | Pass; no page errors | Actual form input and UI actions, exact 120-character subject and 600-character message; default/minimum layout, delivery, receipt and Finish. |

The 93 recorded outcomes are not 93 distinct human sessions. The 210-state audit does not prove that every possible screen or every pixel is correct. All runs used temporary headless profiles, without controlling the participant's desktop or personal browser session.

The 14 scripts were `check-free-text`, `check-drawn-text`, `check-paths`, `check-haunt-windows`, `check-window-drag`, `check-terminal-halloween`, `check-echo-scene`, `check-confirmations`, `check-letter`, `check-case`, `check-keys`, `check-process-console`, `check-terminal-recovery` and `check-first-run`.

## Why the flow now holds together

The case is one unfinished delivery, rather than four independent minigames:

1. **TERMINAL** contains the repeating session. Stopping the call changes the same apparition and produces the desktop-glass material. Muting the bell alone is not substituted for that outcome.
2. **ECHO** observes that material through its movable window and keeps a capture. A capture retains its source, with its frame separately recorded; it is not silently changed by later live events.
3. **CANVAS** lifts the writing and constructs the letter from the capture. Its photograph choice changes what the letter keeps. The photograph choice is expression within the case, not another mandatory deduction.
4. **POSTMAN** sends an actual snapshot to the current guest. Replying to Mara, using an unknown address, omitting the attachment or sending incomplete writing do not silently satisfy the delivery.
5. **TERMINAL** checks the receipt for the currently eligible complete letter. Finish acknowledges that actual delivery and releases the hand on the live glass beside the delivered letter.

This gives each program a necessary role and a concrete handoff. It is a short authored case with recovery and expressive variation, not a large branching adventure. Technical knowledge is not required to operate the available controls, but whether a newcomer understands their narrative purpose remains unverified.

### Recovery route exercised independently in Edge

Delivered complete A → reset CANVAS → send incomplete B to replace A → answer one combined question → B is delivered, A remains byte-for-byte intact → receipt refuses to finish and names the missing writing → lift writing → send complete C without an unnecessary replacement question → return receipt → Finish → reload preserves accepted C → send an unattached copy after one appropriate question → accepted C and finished state survive another reload → Replay creates a new run with four old deliveries archived.

The post-replacement refusal read: “The letter that arrived is incomplete: the writing is still in the mist. Fix it in CANVAS and send it again.” This is a recoverable state with truthful feedback, rather than the former alternating-confirmation dead end.

## Visual findings: retain the v8 repairs

| Before | After | Why |
| --- | --- | --- |
| Review29/v7: valid unbroken text expanded POSTMAN's reader to 4209 px and clipped the attached letter. | V8 additional probe: reader width and scrollWidth are both 242 px at minimum; heading/message wrap inside a 210 px content width. | Layout contains permitted input without altering its payload or the letter's shape. |
| Review29/v7: a long list subject pushed row content outside its column. | V8 additional probe: list scrollWidth equals clientWidth, 225 px; subject width is 201 px within the column. | Sender/status and selection stay usable without a horizontal escape. |
| Long text requires more vertical space than one minimum-sized pane can show. | V8 retains the whole subject/message and permits vertical scrolling; independent default/minimum audits both report zero problems. | Content below the fold is accessible, rather than deleted or made artificially tiny. |

The long-text route sent exactly Subject=`W` × 120 and Message=`abcdef` × 100 and then finished the case. The default and minimum screenshots were inspected. A maximum-length subject occupies many lines at minimum size; that is a boundary tradeoff, not grounds to replace the current normal-content design.

The 210-state route reports no recurrence of the tested note/header/image overlaps. This is corroborating layout evidence, not a blanket promise that no overlap can ever occur.

## Polish 1: measured redundant work while typing

Kiro's v8 design-review §5 identified typing cost and intentionally deferred it. Codex reproduced the underlying work independently, after the full browser/audit battery finished, so that the benchmark did not compete with that battery.

The ignored profiler followed the real case to POSTMAN, typed 60 ASCII keys with `pressSequentially`, and compared a plain textarea with no app listeners, POSTMAN with four programs open, and POSTMAN alone. It measured synchronous input-event work, wall time including automation, per-window DOM mutations, actual `drawImage`/`fillText`/`clearRect` calls, and save writes. ECHO was on **Captures** in both four-program POSTMAN conditions. A 4× CPU setting is a Chrome simulation, not another physical computer.

| Condition, 60 keys each | Wall time per key | Median synchronous work | P95 synchronous work | Case-save writes |
| --- | ---: | ---: | ---: | ---: |
| Plain textarea, four programs open | 3.0 ms | 0.0 ms | 0.1 ms | 0 |
| POSTMAN Message, four programs open | 29.7 ms | 16.9 ms | 30.1 ms | 60 |
| POSTMAN Message, only POSTMAN open | 15.7 ms | 8.1 ms | 10.9 ms | 60 |
| Plain textarea, four programs open, simulated 4× CPU | 12.7 ms | 0.2 ms | 0.4 ms | 0 |
| POSTMAN Message, four programs open, simulated 4× CPU | 122.1 ms | 91.3 ms | 107.3 ms | 60 |

These are single-run instrumented comparisons, not human typing latency, input-to-paint measurements or universal performance targets. Instrumentation and browser automation add overhead. The controls isolate substantial app work, but closing/reopening programs is not an identical-state randomized experiment: TERMINAL's reopened view is recorded in the JSON. The matched ECHO view removes the larger live-versus-captures confound from an earlier diagnostic run.

The more direct finding is repeated work unrelated to the changed Message. At normal speed, 60 input events produced:

| Surface | DOM mutation records during those events | Actual instrumented drawing calls |
| --- | ---: | ---: |
| TERMINAL | 60 | 0 |
| ECHO | 1560 | 120 |
| CANVAS | 900 | 0 |
| POSTMAN | 840 | 360 |

The same four-app counts occurred in the matched 4× condition. A further 420 mutation records were classified as desktop-or-detached, so they are not all attributed to a specific visible component. Mutation records are not pixel paints. Cached CANVAS/TERMINAL drawing is not claimed to rerun when no corresponding draw calls were seen. The final message persisted exactly, and there were no page errors.

### Source evidence and proposed boundary

`src/haunt/case-store.ts` subscribes to all mail changes with `changed()`, which recomputes phase, saves and emits to general listeners. TERMINAL, ECHO, CANVAS and the desktop subscribe to that store; POSTMAN also redraws a letter whose source has not changed. This explains a draft edit waking unrelated views. Saving each edit may remain correct; the profile does not justify simply removing persistence.

| Before | After | Why |
| --- | --- | --- |
| V8: message-only input mutates unrelated app DOM and draws unchanged ECHO/POSTMAN images. | **Proposed, not implemented:** scope the notification or skip view work using a relevant stable identity/revision; keep draft/save/confirmation updates immediate and truthful. | Reduce repeated work without changing gameplay, picture quality, input limits or accepted data. |

Prompt09 asks Kiro to compare small alternatives and challenge this diagnosis. It must preserve native input/caret/selection/Undo, the last key before Send/reload, stale-question invalidation, immutable delivered snapshots, storage failure behavior and refresh on real changes/reopen. It must demonstrate comparable before/after work rather than merely add a debounce or claim a new millisecond target. Do not make a broad state-framework rewrite for this finding.

## Polish 2: active-window frame disagrees with the actual active window

**P3 visual consistency defect, independently confirmed without the typing instrument.** Newly observed on v8; introduction in v8 is not established.

Reproduce from a fresh case: TERMINAL has the active frame → open ECHO → close ECHO with X → click TERMINAL's command field. The taskbar marks TERMINAL active, it is not inert, and the command field receives focus. Its frame/title still use the inactive presentation. Minimize and restore TERMINAL: the active styling returns.

| Before | After | Why |
| --- | --- | --- |
| V8 after close/click: taskbar `aria-pressed=true`, focused command field, `.is-active=false`, border `rgb(42, 58, 64)`. | **Proposed, not implemented:** synchronize the active marker with the actual remaining active window; initial/restored active border is `rgb(54, 73, 79)`. | The desktop should identify the window that will receive input consistently. |

In `src/haunt/window-manager.ts`, `raise()` synchronizes `.is-active`. Close/minimize select the remaining active context without applying that same visual synchronization. `isActive()` already regards the remaining highest-z open instance as active, so a click inside it need not call `raise()` to correct the marker. This is a model/presentation discrepancy, not a broken text field or failed game action.

An early typing harness waited for that visual class and stopped. The harness was corrected to inspect the actual taskbar state, and the issue was then reproduced separately. That early diagnostic stop is not reported as a player progression failure. The final profile completed all five conditions.

Fix the visual marker without stealing focus, changing the accessible close/restore policy or resetting window geometry/z-order/case state. Cover close/minimize with a second window, the last window, restoration, keyboard and subsequent typing.

## Next decision

1. If another Kiro polish pass is desired, run the prepared [prompt09](../../PROMPT_KIRO_09_ESCRITURA_FLUIDA_SIN_CAMBIAR_EL_JUEGO.md). It targets these two bounded findings and preserves v8's scope.
2. Use the existing [first-visit protocol](../../.kiro/specs/confirmation-flow-v7/first-visit-protocol.md) on this coherent baseline. Observe what the person thinks the bell does, what is being transferred between apps, whether they can recover without coaching, and how they interpret the receipt/ending. Record actual hesitation and understanding before adding help or another mechanic.
3. Rehearse/record the real demo separately, with an actual timer. Passing the game checks is not evidence of a successful timed explanation or of submission readiness.

No human or blind-agent playtest was conducted in this review. An agent can later expose copy/interaction ambiguities, but it would still be an agent simulation, not evidence that people had fun.

## Evidence and boundaries

Ignored, local evidence under `output/playwright/codex-v8-review/`:

- `checks.json` and per-script logs: all 14 browser-script exits are zero.
- `additional-routes.mjs/.json`, `long-fields-default.png`, `long-fields-minimum.png`, `edge-combined.png`, `edge-finished.png`.
- `typing-profile.mjs/.json`: **final matched-view run**, five conditions, exact saved message, zero page errors. `typing-profile-initial.json` is a partial diagnostic; `typing-profile-first-complete.json` predates the matched ECHO-view correction and is not the table's source.
- `window-activation.mjs/.json`, `active-window-after-close.png`: independent P3 reproduction.
- Existing `output/playwright/v6-review.json` and `v6/`: the current v8 210-state review, despite the historical names.

Application source, existing test/check source and build configuration were not edited by this Codex review. New diagnostics and this documentation are separate from Kiro's implemented prompt08. Before/after SHA-256 comparison confirmed all 92 files in `src/`, `scripts/`, `tests/`, plus `haunt.html`, `index.html` and `package.json`, unchanged. Document targets resolve and `git diff --check` passes. Existing uncommitted/untracked Kiro work is preserved; no commit, push, publication or submission was performed.

Not independently exercised here: the full 14-script suite in Edge, Kiro's full set of CPU-throttled regressions, Firefox/Safari, screen-reader operation, audible sound, touch, IME composition, genuine missing-font systems or a human timed first visit. The 4× results above concern the new typing profile only. Official event rules, eligibility, deadlines and past winners were not re-audited in this product QA turn; this review makes no fresh compliance or prize claim. No new Kiro model, effort, credit usage or human results are inferred.
