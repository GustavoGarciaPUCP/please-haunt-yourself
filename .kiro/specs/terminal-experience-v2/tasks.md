# TERMINAL experience v2 — tasks

Kiro IDE session, November 6, 2026. A task is marked done only after its check has actually been run.

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Baseline diagnostics before source changes (B1–B6) | — | done |
| 2 | Spec: alternatives, decisions, first 60 seconds, layouts, ownership, closure, acceptance | all | done |
| 3 | Model: `observe()`, `lastEvent()`, restore from a saved outcome | R2.4, R4.3, R5.1 | done |
| 4 | Cue ownership (`terminal-cues.ts`), tracked voices and `silence()` (`terminal-bell.ts`), reduced-motion transitions scoped to TERMINAL | R1 | done |
| 5 | Room: scene objects as buttons, one panel, contextual primary action, hint on request, three-part layout | R2 | done |
| 6 | Shell: Say something, ghost-styled interruption, handover, Haunt it again, tab bell ownership, state-aware intro | R4.1, R4.2, R4.4 | done |
| 7 | Layout: phone active-app mode, safe areas, readable text, short and wide side-by-side layout. Wide-desktop re-centring was **reverted** (see requirements §5.3). | R3 | done (R3.7 revised) |
| 8 | Save (`terminal-save.ts`) and desktop integration: load, save, and suspend on minimize | R4.3–R4.5 | done |
| 9 | Unit tests (`tests/terminal-experience.test.ts`, 11 new) | R1, R2, R4, R5 | done |
| 10 | Browser checks: rewrite `check:halloween` (18 journeys), adapt how `check:recovery` reaches controls, run the rest unchanged | all | done |
| 11 | Before and after screenshots, results recorded, playtest protocol (`playtest-protocol.md`) | — | done; protocol not yet run |

## Verification record (actual commands and results)

All final browser runs used the production build served by the already-running `vite preview` at `127.0.0.1:5174`. Each run started only after `npm.cmd run build` had finished. During development, a dev server this session started at `127.0.0.1:5175` was used.

| Command | Result |
| --- | --- |
| `npm.cmd run build` | Passed. The paper-bridge assets kept their content hashes (`index-CI5aaKki.css`, `index-DtwU5Nqx.js`). |
| `npm.cmd test` | 8 files, **74 tests passed**: the 63 earlier tests plus 11 new ones |
| `npm.cmd run check:halloween` | **18/18**, no page errors. Also passed twice more, and once with `HAUNT_CPU_THROTTLE=4` (4× slower CPU), to look for timing races. |
| `npm.cmd run check:recovery` | 5/5. Only how controls are reached changed; every assertion is unchanged. |
| `npm.cmd run check:guide` | 7/7, unchanged |
| `npm.cmd run check:windows` | 8/8, unchanged |
| `npm.cmd run check:echo` | 9/9, unchanged |
| `npm.cmd run check:console` | 6/6, unchanged (after the revert described below) |

### Baseline defects and how each one is now checked

| # | Before | Now (check:halloween journey) |
| --- | --- | --- |
| B1 | A 0.01 ms `visibility` transition on the shell ghost under reduced motion; my task17 check raced it | 16: in the **same task** as the restore, the shell ghost has 0 animations and the whole terminal subtree has 0 |
| B2 | The recall and the swing kept running after Undo | 5: 0 script cues right after Undo; ring marks cleared; ghost still 250 ms later |
| B3 | The recall kept moving after a live switch to reduced motion | 6: 0 script cues within two frames of the switch; the ghost does not move over the next 100 ms; ring evidence stays |
| B4 | A stale recall competed with the designed exit | 7: in the final state only `CSSTransition`s run on the ghost; 0 script cues; ghost then hidden |
| B5 | Muting or Undo did not stop a scheduled chime | 15 (fake audio clock): Undo, mute, Back and minimize each stop the chime before it starts; restoring the window brings back no cue |
| B6 | 8 enabled buttons; Watch below the fold at 320/390/800 px wide | 3: 7 visible controls, of which only the primary changes state. 18: scene, narration and primary visible together at 320×568, 390×844, 768×1024, 800×450 and 640×400; text at least 11 px; phone targets at least 44 px; no sideways overflow |

### Failures found during this task and fixed

- **The desktop re-centring broke `check:console`.** In that check the terminal console is used while clicking ECHO beside it. The change was reverted, and the decision is documented.
- **The first version of the B3 regression asserted on the same frame as the preference switch.** It failed because browsers report media changes at the next rendering step. The check now waits two frames, which is the platform's notification latency. Before the fix the cue ran for at least 80 ms; it is now cancelled within those two frames.
- **The panel's `data-object` duplicated the objects' selector** (strict-mode collision). It was renamed to `data-panel`.
- **`echo` with `<…>` is refused** by the game shell's existing safety filter. The handover check therefore uses plain words. Markup injection is still covered by `check:console`.

## Not verified

- Audible playback (only a fake audio clock was checked).
- Real phones, tablets and physical touch input.
- Screen-reader announcements.
- The OS text-size setting. 640×400 only stands in for 200% browser zoom.
- Browsers other than Chrome.
- Notched safe areas (the `env()` insets are 0 in desktop Chrome).
- The paper-bridge `test:browser` suite (not run; its built assets kept their content hashes).
- People who do not program: see `playtest-protocol.md`, not yet run.
