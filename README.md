# Please Haunt Yourself

A fictional haunted OS for Kiroween 2026. The current direction is **application recovery**: each haunted program has its own malfunction, an intervention inside its native system and a changed function afterward. The first implemented recovery encounter belongs to TERMINAL. The earlier ECHO theatre remains a separate working workshop, not the current game's finished central loop.

The project directory was renamed from `LaVentanaEquivocada` to `PleaseHauntYourself` on November 6 at the participant's request. It retains the same Git history. The earlier paper-bridge prototype remains at the root index page and is not presented as the new experience.

## Run the haunted desktop

**Current collaborative handoff:** the participant's Kiro IDE task17 delivered the Halloween room, ghost writing, plain actions, bell evidence and optional technical inspection. Codex independently confirmed build/63 unit tests and inspected desktop/mobile. Its Halloween browser check failed on reduced motion, and stale recall animations were reproduced after Undo/live preference change; this is not a fully green release. [Review18](docs/development/18_Opus_Experience_Review.md) records evidence and [PROMPT_KIRO_02_EXPERIENCIA.md](PROMPT_KIRO_02_EXPERIENCIA.md) is the next user-operated IDE task. The earlier [task17 prompt](PROMPT_KIRO_HALLOWEEN.md) is retained for provenance.

Use the existing installed development dependencies, or `npm.cmd ci` for a fresh checkout. Node 22.13.1 was used for local development.

```powershell
npm.cmd run dev -- --port 5174 --strictPort
```

Open **http://127.0.0.1:5174/haunt.html**. The root `/` still opens the preserved bridge prototype.

- TERMINAL starts open with an old session attached. Try `ask status`, `echo hello`, then **Enter looping session** or `enter last.session`.
- Inside the same window, step execution and change separate archive/stdout/exit-hook connections. A stopped copy can return; a muted screen can still be haunted. A clean exit changes TERMINAL's appearance, actual `echo` output and conversation. Keeping or discarding the saved line produces different valid endings.
- Return to the prompt and ask **Are you okay?** Read the retained result with `cat last-session`. `restore terminal` resets only this encounter; closing/reopening the app keeps its state in the current page. A page reload currently resets recovery.
- ECHO's earlier capture workshop remains available through **Open ECHO** or its taskbar button.
- The version2 first-visit guide introduces TERMINAL's anomaly, check-in and own session. Skip/Escape and direct topics remain available. Dismissal is remembered in browser storage when available. The tour never repairs the application or kills a process.
- The system menu, desktop shortcuts, current-app label and local clock form the OS shell. Opening guidance pauses an active workshop take; resuming stays explicit. Terminal recovery and workshop rehearsal acknowledgements are separate.
- TERMINAL accepts `help`, `ps`, `inspect`, `kill`, `restore mirror`, `open echo` and `clear`. Its commands control fictional local game services. Use `ps` to find the current PIDs, then inspect their dependencies. The console has command history and a reduced-motion-aware block cursor.
- Close, minimize and restore either window. Reopening during a close keeps the latest request.
- Keyboard focus raises a window; Escape closes the active window and restores the taskbar trigger.
- Reduced-motion preference is respected at startup and when changed.
- In ECHO, move the UNINSTALL scenery over its private self-view while keeping the public stage clear. Drag its header, focus the panel and use arrow keys (Shift for fine moves), or use directional buttons. Help offers an explicit alignment aid.
- Alternatively, stop the reflection's restart supervisor and ask the current watcher to exit cleanly. A direct child kill is restarted with a new PID; a forced stop skips the fictional display cleanup and leaves an afterimage. These states appear in ECHO's private monitor. Coverage remains a valid solution. `restore mirror` resets the example services.
- Rehearse the labeled example entrance. Choose Collapse or Scare back in Edit set for different performances. Leave cancels immediately; minimizing pauses until explicit Resume or Edit.

The ECHO workshop's privacy interaction, cast poses and two reactions remain implemented. They do not yet constitute ECHO's own application-recovery encounter. The new recovery brief defines candidate mechanics for the other programs; these are not implemented apps. The older shared-show/visitor-recording documents are historical, superseded product proposals. The console is a bounded functional game shell, not a host OS shell or full BASIC interpreter.

## Verification

```powershell
npm.cmd run build
npm.cmd run check:windows
npm.cmd run check:echo
npm.cmd run check:console
npm.cmd run check:guide
npm.cmd run check:recovery
npm.cmd test
```

The browser check requires the development server above plus the already installed local Chrome/Playwright environment. It exercises real window controls, cancellation, focus, reduced motion and wide/narrow layouts; reports/captures go to `output/playwright/`. An alternative server origin can be supplied through `HAUNT_BASE_URL`.

Build output includes both `dist/haunt.html` and the preserved `dist/index.html`. There are55 unit tests: seven terminal-recovery tests, seven ECHO geometry/edit cases, six mirror-process tests and35 historical prototype tests. Browser harnesses cover five recovery, seven guide, eight window, nine ECHO and six process-console journeys (35 total). `test:browser` remains the historical bridge suite. Visibility coverage uses a simulated hidden event, not an observed real OS background-tab transition.

The three game regression harnesses explicitly mark onboarding dismissed before loading; `check:guide` separately exercises a fresh visitor, first-run storage/focus, real spotlight geometry, mobile/short layouts, pause/Leave priority and unavailable storage. Simulated novice agent reports identified and drove UI repairs; they do not substitute for human enjoyment tests.

## Current design and tool evidence

- [Current application-recovery direction, TERMINAL encounter and tool evidence](docs/development/16_Terminal_Application_Recovery.md).
- Historical shared-show references: [motion contract](docs/diseno/11_Build_Readiness_and_Motion.md), [scene/art direction](docs/diseno/10_Scenes_Art_and_Novelty_Review.md) and [experience rules](docs/diseno/09_Experience_Contract.md).
- [Actual window-foundation work and checks](docs/development/2026-11-06-window-foundation.md).
- [Actual ECHO work, corrections and checks](docs/development/2026-11-06-echo-rehearsal.md).
- [App identity and process interaction](docs/development/14_App_Identity_and_Process_Rehearsal.md), with actual implementation/check status below its brief.
- [First-run guide, OS shell and independent agent findings](docs/development/15_First_Run_and_Desktop_Shell.md).
- [Kiro-authored foundation scope](.kiro/specs/please-haunt-yourself/window-foundation.md) with later review notes, and [tool usage record](docs/kiro-usage.md).
- [Illustrative concept board](docs/diseno/concept-art/scene-board-v2.png), which is a visual target rather than a game screenshot.

Native Kiro with Claude Sonnet 4.5 wrote the new scope notes and first foundation, then applied a directed correction. It also wrote the first ECHO logic/view and integration pass before returning a monthly usage-limit error. Codex repaired the impossible initial geometry and incomplete lifecycle, rebuilt the ECHO controller/art integration and verified the result. Opus 5.5 was requested first but rejected by the account; it was not used. No maximum-effort execution or exact promotional-credit debit is claimed.

The subsequent app-identity/process-console increment was implemented and checked in Codex while the known Kiro monthly-limit blocker remained. No new Kiro execution or usage is claimed for it. The process simulator is a new bounded extension; the earlier When/Then production editor, full save contract and remaining app encounters are still planned.

For the new recovery direction, Codex actually retried a bounded native Kiro Sonnet4.5 review at the participant's request. The service rejected it at prompt stage with a monthly usage-limit error before file work. No review file or new Kiro-generated code is claimed. Codex authored the recovery design/model/view/integration and checks. This error does not establish the status of the participant's promotional credit balance.

No external deployment, public repository publication or submission has occurred. `.kiro/` remains tracked. License/asset review, the complete game, human observation and final submission materials remain pending. Historical plans and the old prototype retain their dates and status in Git.
