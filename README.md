# Please Haunt Yourself

A fictional haunted desktop for Kiroween 2026. Six deleted applications become the cast and tools of a small interactive production. The current implementation includes **WINDOW-01 and ECHO-01: working windows and the first playable rehearsal**, not the completed game.

The project directory was renamed from `LaVentanaEquivocada` to `PleaseHauntYourself` on November 6 at the participant's request. It retains the same Git history. The earlier paper-bridge prototype remains at the root index page and is not presented as the new experience.

## Run the haunted desktop

Use the existing installed development dependencies, or `npm.cmd ci` for a fresh checkout. Node 22.13.1 was used for local development.

```powershell
npm.cmd run dev -- --port 5174 --strictPort
```

Open **http://127.0.0.1:5174/haunt.html**. The root `/` still opens the preserved bridge prototype.

- TERMINAL starts open. Use **Open ECHO** or its taskbar button.
- Close, minimize and restore either window. Reopening during a close keeps the latest request.
- Keyboard focus raises a window; Escape closes the active window and restores the taskbar trigger.
- Reduced-motion preference is respected at startup and when changed.
- In ECHO, move the UNINSTALL scenery over its private self-view while keeping the public stage clear. Drag its header, focus the panel and use arrow keys (Shift for fine moves), or use directional buttons. Help offers an explicit alignment aid.
- Rehearse the labeled example entrance. Choose Collapse or Scare back in Edit set for different performances. Leave cancels immediately; minimizing pauses until explicit Resume or Edit.

ECHO's privacy interaction, cast poses and two reactions are implemented in inline SVG/HTML/CSS. This take uses an explicitly labeled example. Personal recording, body extraction, mail/postcards, saved show and the other tableaux remain unimplemented.

## Verification

```powershell
npm.cmd run build
npm.cmd run check:windows
npm.cmd run check:echo
npm.cmd test
```

The browser check requires the development server above plus the already installed local Chrome/Playwright environment. It exercises real window controls, cancellation, focus, reduced motion and wide/narrow layouts; reports/captures go to `output/playwright/`. An alternative server origin can be supplied through `HAUNT_BASE_URL`.

Build output includes both `dist/haunt.html` and the preserved `dist/index.html`. Unit tests now include seven ECHO geometry/edit-boundary cases alongside 35 preserved prototype tests. `test:browser` is the historical bridge suite; `check:echo` exercises the new scene. The visibility-handler case uses a simulated hidden event, not an observed real OS background-tab transition.

## Current design and tool evidence

- [Build-readiness and motion contract](docs/diseno/11_Build_Readiness_and_Motion.md), [scene/art direction](docs/diseno/10_Scenes_Art_and_Novelty_Review.md) and [experience rules](docs/diseno/09_Experience_Contract.md).
- [Actual window-foundation work and checks](docs/development/2026-11-06-window-foundation.md).
- [Actual ECHO work, corrections and checks](docs/development/2026-11-06-echo-rehearsal.md).
- [Kiro-authored foundation scope](.kiro/specs/please-haunt-yourself/window-foundation.md) with later review notes, and [tool usage record](docs/kiro-usage.md).
- [Illustrative concept board](docs/diseno/concept-art/scene-board-v2.png), which is a visual target rather than a game screenshot.

Native Kiro with Claude Sonnet 4.5 wrote the new scope notes and first foundation, then applied a directed correction. It also wrote the first ECHO logic/view and integration pass before returning a monthly usage-limit error. Codex repaired the impossible initial geometry and incomplete lifecycle, rebuilt the ECHO controller/art integration and verified the result. Opus 5.5 was requested first but rejected by the account; it was not used. No maximum-effort execution or exact promotional-credit debit is claimed.

No external deployment, public repository publication or submission has occurred. `.kiro/` remains tracked. License/asset review, the complete game, human observation and final submission materials remain pending. Historical plans and the old prototype retain their dates and status in Git.
