# Please Haunt Yourself

A fictional haunted desktop for Kiroween 2026. Six deleted applications become the cast and tools of a small interactive production. The current implementation is **WINDOW-01: a working desktop/window-motion foundation**, not the completed game.

The project directory was renamed from `LaVentanaEquivocada` to `PleaseHauntYourself` on November 6 at the participant's request. It retains the same Git history. The earlier paper-bridge prototype remains at the root index page and is not presented as the new experience.

## Run the new foundation

Use the existing installed development dependencies, or `npm.cmd ci` for a fresh checkout. Node 22.13.1 was used for local development.

```powershell
npm.cmd run dev -- --port 5174 --strictPort
```

Open **http://127.0.0.1:5174/haunt.html**. The root `/` still opens the preserved bridge prototype.

- TERMINAL starts open. Use **Open ECHO** or its taskbar button.
- Close, minimize and restore either window. Reopening during a close keeps the latest request.
- Keyboard focus raises a window; Escape closes the active window and restores the taskbar trigger.
- Reduced-motion preference is respected at startup and when changed.

The ECHO stage is representative inline SVG artwork. The privacy puzzle, personal recording, body extraction, mail/postcards and saved show are still design scope; their artwork and gameplay are not implemented by this window study.

## Verification

```powershell
npm.cmd run build
npm.cmd run check:windows
```

The browser check requires the development server above plus the already installed local Chrome/Playwright environment. It exercises real window controls, cancellation, focus, reduced motion and wide/narrow layouts; reports/captures go to `output/playwright/`. An alternative server origin can be supplied through `HAUNT_BASE_URL`.

Build output includes both `dist/haunt.html` and the preserved `dist/index.html`. The existing `npm.cmd test` and `npm.cmd run test:browser` suites belong to the paper-bridge prototype; their historical results do not validate new game mechanics.

## Current design and tool evidence

- [Build-readiness and motion contract](docs/diseno/11_Build_Readiness_and_Motion.md), [scene/art direction](docs/diseno/10_Scenes_Art_and_Novelty_Review.md) and [experience rules](docs/diseno/09_Experience_Contract.md).
- [Actual window-foundation work and checks](docs/development/2026-11-06-window-foundation.md).
- [Kiro-authored foundation scope](.kiro/specs/please-haunt-yourself/window-foundation.md) with later review notes, and [tool usage record](docs/kiro-usage.md).
- [Illustrative concept board](docs/diseno/concept-art/scene-board-v2.png), which is a visual target rather than a game screenshot.

Native Kiro with Claude Sonnet 4.5 wrote the new scope notes and first foundation, then applied a directed correction. Codex reviewed and repaired remaining motion/focus issues, refined the inline art and interface, integrated the second build entry and ran checks. Opus 5.5 was requested first but rejected by the account; it was not used. No maximum-effort execution or exact promotional-credit debit is claimed.

No external deployment, public repository publication or submission has occurred. `.kiro/` remains tracked. License/asset review, the complete game, human observation and final submission materials remain pending. Historical plans and the old prototype retain their dates and status in Git.
