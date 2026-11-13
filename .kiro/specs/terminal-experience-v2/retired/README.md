# Retired v2 files (kept for the record)

The v3 run (`.kiro/specs/pc-agency-v3/`) replaced two v2 files that had never been committed. These are verbatim copies, renamed `.txt`, so they are not compiled or run. Git cannot restore them otherwise.

| File | What it was | What replaced it in v3 |
| --- | --- | --- |
| `terminal-save.ts.txt` (was `src/haunt/terminal-save.ts`) | Saved only a completed v2 ending under `haunt.terminal.v1` | `src/haunt/case-save.ts`: `haunt.case.v3` for the whole case. It migrates `haunt.terminal.v1` by removing that key, without completing anything. |
| `terminal-experience.test.ts.txt` (was `tests/terminal-experience.test.ts`) | 11 v2 unit tests: observe, events, endings, v1 save, v2 copy | `tests/legacy-session.test.ts`, `tests/haunting-presentation.test.ts` and `tests/case-save.test.ts` |

The v2 mechanics they tested (the two endings, hush, keep or fade the note) were removed from play by the v3 story. See `../../pc-agency-v3/design-review.md`.
