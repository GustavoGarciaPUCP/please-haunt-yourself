# V9 independent QA and first-visit simulation

Codex review, 10 November 2026, of the participant-operated Kiro IDE prompt09 delivery. Served production: `haunt-CgO5uN2S.js` / `haunt-9asRCWsn.css`, About **HAUNT OS 4 · build v9**. No application, dependency, Git history or publication changes were made in this review.

Follow-up: [review34](34_V9_Build_Repair_Independent_Verification.md) independently confirms that prompt10 repaired the source-build failure described below. The rebuilt game is byte-identical to the v9 tested here; the gameplay and first-visit evidence remains applicable.

## Verdict

**The served v9 case completes, both targeted polish checks pass independently, and a fresh agent completed the story without knowing its solution. However, the current source tree fails `npm.cmd run build`.** The build discrepancy must be repaired before calling the deliverable reproducible or ready to publish.

Keep the current design, four-program scope and narrative. The first-visit evidence supports the causal handoffs in this one agent's route; it does not establish human enjoyment or eliminate every UX uncertainty. The highest-priority next implementation is a small build/test-typing repair, not a redesign.

## Independent technical results

| Check | Observed result | Boundary |
| --- | --- | --- |
| `npm.cmd test` | 166 tests in 15 files pass | Executed in this tree, independently of the Kiro delivery report. |
| All 16 browser scripts | 106 recorded outcomes pass, no page errors | Existing built v9, normal-speed Chrome. Includes `check:typing` (8) and `check:active` (5). |
| `npm.cmd run build` | **Fails**, reproduced twice | TypeScript exits before Vite. The live preview still serves the existing v9 output. |
| Three-PC-size visual review | 210 states, zero reported DOM/drawn-text problems and zero page errors | Historical `review:v6` script rerun on v9 at 1366×768, 1440×900 and 1920×1080. Selected screenshots also inspected visually. |
| Git dates | 20 reachable commits across all refs, earliest 5 November; none before opening | Same chronology as review32. No dates were changed; this is not a certification of every file's origin. |

Evidence: `output/playwright/codex-v9-review/checks.json`, per-script logs and `build.log`. The 106 outcomes are scripted checks, not 106 people. No independent repetition of Kiro's Edge subset, full 4× suite, alternating timing benchmark or sampling profiles is claimed in this pass.

Before/after SHA-256 comparison confirmed all 98 files checked under `src/`, `scripts/`, `tests/`, plus `haunt.html`, `index.html` and `package.json`, unchanged by this review. Local document links resolve and `git diff --check` passes. New diagnostic scripts and trial copies remain under ignored output.

### Confirmed release blocker: test imports undeclared Node types

`tests/fluid-typing-v9.test.ts:3` imports `readFileSync`/`readdirSync` from `node:fs`. The strict `tsconfig.json` includes `tests`. `@types/node` is absent from the installed package directory, the direct development dependencies and the lockfile package entries. Node here is v22.13.1.

Both independent builds report:

```text
tests/fluid-typing-v9.test.ts(3,43): error TS2591: Cannot find name 'node:fs'.
tests/fluid-typing-v9.test.ts(103,45): error TS7006: Parameter 'name' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(103,79): error TS7006: Parameter 'name' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(104,37): error TS7006: Parameter 'file' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(105,25): error TS7006: Parameter 'file' implicitly has an 'any' type.
```

Vitest executing these tests successfully does not imply the separate TypeScript build step passes. Likewise, an already generated `dist` can run while rebuilding its current source fails. The cause of the Kiro report's earlier successful-build statement was not established; do not invent a different environment, misreport or chronology to explain it.

The prepared [prompt10](../../PROMPT_KIRO_10_COMPILACION_REPRODUCIBLE_Y_CIERRE_V9.md) asks Kiro to reproduce this exact result and choose a minimal repair: correctly declared Node test types or an equally meaningful check supported by the declared test environment. Preserve strict checking and the actual v9 behavior. No source repair or dependency installation was performed by Codex.

## What v9 demonstrably improved

| Before | After | Why |
| --- | --- | --- |
| V8 message-only typing woke unrelated app views and drew unchanged images. | V9's independently executed typing check passes its eight cases: no unrelated DOM/drawing work in the exercised message-only interval, while drafts, immediate save and real changes remain correct. | Removes unnecessary work without trading away data integrity or truthful updates. Subject changes can legitimately update a row that shows the subject. |
| After closing/minimizing an active window, the frame could disagree with the actual input window. | V9's independently executed active-window check passes all five outcomes, including close/minimize/restore and focus policy. | The desktop consistently shows which window is active. |

Kiro expanded review30's drawing instrumentation to include more drawing operations and offscreen fog canvases. Its reported 766 calls per key is broader than Codex's original limited `drawImage`/`fillText`/`clearRect` count. The scope difference is documented in the v9 design review; do not conflate those counts or relabel instrumented timings as human-perceived latency.

## First-visit agent trials

Two independent agents were started with no conversation history, no solution and no source/spec/check access. Each received only the playable URL, neutral exploration instructions and a way to load the automation library. They used fresh headless Chrome contexts at PC size with normal motion. They could inspect visible UI/ARIA, use pointer/keyboard/drag and the app's own help; hidden state/storage injection was prohibited. These are Codex agent simulations, not human participants or Kiro tasks.

### Trial A: interrupted by the automation instrument

The agent followed the entry/tutorial, opened the session, watched one failed attempt and inspected Note and Figure. It understood that Mara was trying to deliver a picture and a note, repeatedly failing to finish a minute.

`page.getByText('Bell', {exact:true}).click()` then exceeded the REPL's 30-second tool window. The kernel reset, losing its browser handles. No completed Bell click or final state was confirmed; the original browser transport could not be reattached. The agent did not start a second run under the same first-visit label. This is an interrupted instrument session, not evidence that a person could not click Bell or finish the game.

Copied evidence: `output/playwright/codex-v9-review/first-visit-a/`, including six screenshots, pre-action notes and `informe-visita-ciega-parcial.md`.

### Trial B: complete fresh route

A different agent, still without the solution or history of trial A, completed one continuous new-context visit. It used the tutorial, object explanations and application text; **no Hint, Under the hood, typed terminal command or external solution** was used.

Observed path:

1. Entry/tutorial → Look inside → watch the failed minute.
2. Inspect Note, Figure and Bell; interpret the difference between muting sound and stopping the return.
3. Stop the call → Let it finish this time → minimize TERMINAL to see the mark on the desktop glass.
4. Wipe one strip, then explore ECHO and choose Desktop glass.
5. Move ECHO from 0/5 to 5/5 visible lines → Capture → Use this capture.
6. In CANVAS, Lift the writing → Compose in POSTMAN.
7. Select `guest@haunt`, reasoning from the note's next-person recipient and the signed-in desktop user → Send.
8. Return to the request → Finish session.

It recognized **Session finished**, the accepted receipt, clear glass and the line identifying the player as the next person, then stopped. Its spontaneous explanation connected Mara's unfinished delivery, the repeating minute, the glass impression, the kept picture/writing, delivery to the current guest and the receipt that lets the session finish.

This supports comprehension of the principal handoffs in this simulated route. It does not validate discovery of all wrong-action recovery paths; the regression checks address those separately. It also does not establish a human playtime, emotional effect, enjoyment rating, accessibility result or comparison with winning projects.

Trial B had setup/automation issues before entry (module loading and Chrome location) and one 3.5-second locator timeout when looking for a radio as a button. It corrected that lookup using visible ARIA and retained the same browser context. These are recorded separately from product behavior.

Copied evidence: `output/playwright/codex-v9-review/first-visit-b/report.md`, `notes.txt` and 22 screenshots. Useful states include `10-glass.png`, `13-glass-source.png`, `14-framing.png`, `17-writing-lifted.png`, `19-sent.png` and `22-finished.png`.

## Remaining UX questions, ranked against the observed route

| Observation | Interpretation | Next useful validation |
| --- | --- | --- |
| After the first failed minute the agent did not yet know what could change; it inspected objects and found the relevant controls. | A short exploration resolved the uncertainty through the intended interface. No blockage or need for extra automatic guidance was demonstrated. | Observe whether people also recognize those objects as inspectable before adding a stronger tutorial. |
| After wiping a strip, the agent was unsure how much to clean or what cleaning accomplished. It opened ECHO and continued. | The glass-to-capture transition was the least direct part of its account. This is a real recorded uncertainty, not a proven failure rate. | Ask a person to explain what wiping preserves/removes and what they expect ECHO to do, without coaching. |
| The agent feared wiping might remove the writing; CANVAS later explained the relationship. | The consequence is meaningful, but its discoverability before wiping merits observation. Existing recovery paths remain important. | Observe a genuine mistaken wipe and whether its feedback/recovery makes sense. |
| ECHO said a capture retains the whole glass while showing 0/5 lines in view. The agent framed 5/5 and did not test another frame. | It may infer that all lines must be framed even though source retention and photograph framing have distinct contracts. This is a candidate copy issue, not confirmed lost data or an impossible puzzle. | Test a brief distinction between what the frame photographs and what the capture retains; preserve the full-source contract. Do not change capture mechanics based on one agent. |

These points do not justify a new program, another mandatory task or a narrative reset. Optional copy refinements should be tested against actual misunderstanding rather than added automatically to the build repair.

## Dates and remaining delivery work

The same 20-commit history is still present; earliest author date is 5 November 2026 at 20:17 Lima and none of the checked author/committer dates predates the official opening. Dates were preserved, not corrected to appear newer. Review32's provenance condition remains in force for the exact eventual submission materials.

The local root still has no LICENSE/COPYING candidate. Publication/access, an open-source license choice, public source, public YouTube demo and final English/Kiro-use submission materials remain separate delivery steps. No commit, push, license selection, account change, publication or submission occurred in this review.

**Next implementation:** execute prompt10 to make the build reproducible, retaining the current game. **Next experience validation:** a first visit with people; trial B already supplies a useful agent baseline. Avoid promising 100% validation or a winning result from automated checks and one completed simulation.
