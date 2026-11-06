# TERMINAL Halloween encounter — tasks

Kiro IDE session, November 6, 2026. A status is set to done only after the work and its check were actually run.

| # | Task | Requirements | Status |
| --- | --- | --- | --- |
| 1 | Critique the brief; define the first 60 seconds, wrong interventions and both endings; write requirements, design and tasks | all | done |
| 2 | Model: add `lastAction`, split `return` into `recalled`/`threshold`, stop object changes from overwriting `moment`, make `status()` reflect the bell | R3.5, R3.6, R5.2, R8.1 | done |
| 3 | Pure presentation functions: narration, poses, object copy, shell banner, desktop task | R1, R3, R5 | done |
| 4 | Art: ghost with separate eyes/mouth/lips; scene bell with swing group, ring marks and quiet tie; doorway; moon | R2.2, R3.2, R3.5 | done |
| 5 | Helpers: bounded ghost writing (`ghost-writing.ts`); optional audible bell, off by default (`terminal-bell.ts`) | R1.1, R1.2, R4.3, R7.1 | done |
| 6 | The ghost's room in the same window: object cards, plain actions, narration live region, Under the hood, focus handling | R2, R3, R4, R6, R7.3, R7.4 | done |
| 7 | Shell: ghost behind the banner, written line, Read the note, tab bell, plain intro and footer | R1, R5 | done |
| 8 | CSS for banner, room, poses, reduced motion, 390×844 and 800×450 | R7 | done |
| 9 | Guide, desktop task and static page copy in plain words | R9 | done |
| 10 | Unit tests for the presentation mapping and unchanged process outcomes (`tests/haunting-presentation.test.ts`) | R3, R5, R8.1 | done |
| 11 | New browser check `check:halloween`; run all existing checks; inspect screenshots | R1–R9 | done |
| 12 | Record actual results here and in `docs/kiro-usage.md` | — | done |

## Verification record (actual commands and results)

| Command | Result |
| --- | --- |
| `npm.cmd run build` (TypeScript, then Vite) | Passed. The paper-bridge `index` assets kept their previous content hashes (`index-CI5aaKki.css`, `index-DtwU5Nqx.js`). |
| `npm.cmd test` | 7 files, **63 tests passed**: the 55 existing tests plus 8 new presentation tests. |
| `npm.cmd run check:halloween` (new) | **11/11** journeys passed, no page errors. |
| `npm.cmd run check:recovery` | 5/5 passed, unchanged script. |
| `npm.cmd run check:guide` | 7/7 passed, unchanged script. |
| `npm.cmd run check:windows` | 8/8 passed, unchanged script (after the fix below). |
| `npm.cmd run check:echo` | 9/9 passed, unchanged script. |
| `npm.cmd run check:console` | 6/6 passed, unchanged script. |

The final browser runs used the production build served at `127.0.0.1:5174`. That `vite preview` process was already running before this session and was not started by it; it served each rebuilt `dist`. During iteration, the same checks also ran against a dev server this session started on port 5175.

**Regression found and fixed.** `check:windows` failed at 390×844. The taller haunted banner pushed the shell window 24 px past the taskbar, because the window is centred at 55%, so it overflows before reaching its max-height. Fixes:
- Phones hide the optional command caption and the keyboard hint, and use a 200 px transcript.
- A terminal-only max-height now matches each offset centre (53%, 55% or 50%), so the transcript shrinks instead of the window overflowing.
- `check:halloween` now asserts that the longest banner copy (hushed, bell quiet) still fits above the taskbar.

## Not verified

- Actual audio output of the optional bell. Only the toggle state and the absence of page errors are checked.
- Behavior with a real screen reader. Only live-region structure and text were checked.
- Browsers other than Chrome.
- A real background tab.
- The paper-bridge Playwright suite (`test:browser`) was not run. Its built bundle has unchanged content hashes.
- Comprehension or enjoyment by people who do not program. No human test took place.
