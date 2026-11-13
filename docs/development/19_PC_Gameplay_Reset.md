# PC-first interaction and substantive gameplay correction

November 6, 2026. Codex review after the participant delivered Kiro's second-task report in the attached Texto pegado.txt and explicitly prioritized PC, movable windows and visibly stronger gameplay. This prepares a third IDE task; it does not silently replace the delivered application code.

## What the current delivery actually changed

The second IDE delivery is present under `.kiro/specs/terminal-experience-v2/` and in the source tree. It adds owned/cancellable cues, audio cancellation, contextual object panels, a bounded Observe action, prompt handover and validated local ending saves. Codex independently ran the unit suite: **74 passed**. Its `check:halloween` run completed **18/18**. The earlier motion defects are not carried forward as current open failures after this delivery's fixes/checks.

These are real engineering and interaction improvements. They do not establish a new core puzzle. The recovery model still turns on the same output/archive/restart decisions. `observe()` groups existing step transitions; the primary action/panels expose them differently. This explains why someone can correctly perceive the experience as largely unchanged.

Responsibility for scope: prompt02 emphasized mobile and explicitly confined work to TERMINAL while preserving the existing puzzle meanings. Desktop dragging was optional. Kiro's report openly declined it and kept ECHO out of scope. That was permitted by the brief; claiming the user simply failed to refresh would miss the actual problem. The next brief must change those constraints.

## Fresh PC verification

The production response at `http://127.0.0.1:5174/haunt.html` returned 200. Served asset references matched the current `dist/haunt.html`: `haunt-CmzbS9qt.js` and `haunt-Dz6LtHAS.css`. A new headless Chrome context at 1440×900, with the guide dismissed and only that context's saved terminal outcome removed, displayed **Watch it try to leave** and the v2 scene-object UI.

This verifies that the reviewed server is serving v2. It does not identify which URL/assets an already-open user tab has cached. To identify v2 visually, look for that exact action plus selectable scene objects and an object panel. Refreshing cannot turn the unchanged core decisions into a new puzzle.

Real pointer-hold/move/release attempts on blank titlebar areas produced:

| Window | Pointer motion attempted | Actual window displacement |
| --- | --- | --- |
| TERMINAL | 120px horizontally, 70px vertically | 0px, 0px |
| ECHO | 120px horizontally, 70px vertically | 0px, 0px |

`desktop.ts` has no titlebar pointer-drag implementation. ECHO still opens **Example entrance / Don't let me watch myself**, and neither `echo-view.ts` nor `echo-scene.ts` is modified in this delivery. Its theatre/coverage encounter is genuinely unchanged. Screenshots and raw UI observations are under ignored `output/playwright/codex-v2-*`.

A preliminary automation attempted the farewell panel before its Observe transition made that action available and timed out on the intentionally hidden button. That is not reported as an application defect. The corrected review captured the available controls; the dedicated 18-journey harness verified the complete current route.

## Review

| Before (observed) | After (required in next task, not implemented here) | Why |
| --- | --- | --- |
| Desktop windows cannot be repositioned | Real titlebar drag for both existing app windows, workspace constraints and recoverable placement | Core PC/OS affordance requested explicitly by the participant |
| TERMINAL's interface is clearer but its underlying decision graph is largely preserved | A material change to what the player discovers, changes and creates | UI restructuring alone cannot meet the requested jump in agency |
| ECHO remains an isolated old workshop | ECHO gains a native, consequential role within the existing two-app recovery experience | The participant expected the programs themselves to develop, not just one scene's controls |
| Small-screen geometry dominated prompt02 | Desktop composition at 1366×768, 1440×900 and 1920×1080 is primary | Matches the participant's actual platform priority |

The official [platform rule](https://kiroween.devpost.com/rules) requires the project to work on its declared platform; it does not prescribe mobile. PC-first is the participant's choice. Costume Contest still expects the spooky interface to enhance function. This is a focused platform/design check, not a complete eligibility audit or organizer approval.

## Proposed creative direction for Opus to challenge

Retain the haunted-program recovery promise and useful artwork. Let ECHO reveal/capture something that TERMINAL cannot distinguish: a live repeating signal versus a frozen memory. A player-generated still can preserve a ghost without executing the loop that traps it. A wrong intervention has a visible effect in the other application; a correct repair changes both native behavior and the retained artifact. The player may arrange the two real windows to compare evidence without a time limit.

This is a candidate, not an approved implementation or claim of invention. Opus may replace it with a more compelling mechanism, but must demonstrate actual different decisions/consequences in the existing two apps. Do not fall back to the same bell switch with more elaborate instructions, add arbitrary extra locks, require simultaneous timed actions or resurrect the rejected walk-across-windows platformer concept.

## New scope and freedoms

`PROMPT_KIRO_03_PC_Y_JUGABILIDAD.md` is the next user-operated IDE brief. Titlebar dragging and PC-first are mandatory. Substantive gameplay work may modify both existing TERMINAL and ECHO; the older TERMINAL-only restriction and exact-bell-puzzle invariants are superseded for that task. Technical safety, readable cause/effect, no mandatory programming, real application recovery, cancellation, keyboard access, reversible experimentation and honest evidence remain required. Existing endings/saves may be explicitly migrated/versioned if the mechanic changes; do not falsely mark a new case complete from an old flag or silently delete unrelated local data.

No new app or framework is requested. Passing old tests alone does not certify a new experience; changed mechanics need new meaningful scenarios and an explicit old/new behavior comparison. The current v2 delivery remains intact for Kiro's next iteration. No source implementation was changed by this review.
