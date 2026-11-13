# V9 build repair: independent verification

Codex review, 10 November 2026, following the participant-operated Kiro IDE delivery of prompt10. **Review33's source-build blocker is closed.** The repaired source regenerates exactly the game already tested as v9.

## What was verified independently

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | Exit 0, with `tests` still included and strict checking intact. |
| `npm.cmd run build -- --outDir <fresh review directory>` | Exit 0. TypeScript and Vite ran; Vite transformed 46 modules and wrote seven new files. The separate output did not interrupt the existing preview. |
| `npm.cmd test` | Exit 0: 166 tests in 15 files. |
| Targeted Chrome checks | `check:typing` 8, `check:active` 5 and `check:case` 9; all 22 outcomes pass with zero page errors. |
| Exact artifact comparison | All seven freshly rebuilt files match the saved pre-repair v9 files, current `dist/`, and the bytes delivered over the local preview HTTP server. Zero differences in all three comparisons. |
| Compared technical files | Against the 98-file review33 snapshot, only `tests/fluid-typing-v9.test.ts` changed. The current `package-lock.json` and `tsconfig.json` also have no diff from HEAD. |
| History | HEAD remains `739c548`; 20 commits reachable from HEAD and across all refs. This check does not change or recertify prior material provenance. |

The independent build is in `output/playwright/codex-prompt10-review/rebuilt-dist/`. Exact SHA-256 values, file inventory and comparison results are in `output/playwright/codex-prompt10-review/byte-comparison.json`. The main assets remain `haunt-CgO5uN2S.js` and `haunt-9asRCWsn.css`.

## Why the repair is appropriate

The existing Vite test setup already supports importing the relevant source files as text. Replacing the filesystem import with `import.meta.glob` and `?raw` removes the undeclared Node types requirement without changing the application or relaxing TypeScript. The positive control checks that the scan sees POSTMAN's real draft read. This remains a structural guard over the source, supplemented by the browser behavior checks, rather than a complete proof against every possible way to access the draft.

The Kiro report also corrects the previous build claim: its recorded file times place the v9 output before the failing test, and it did not retain the earlier command's log. The current result no longer depends on that reconstruction: Codex checked the successful exit and compared output written into a previously absent directory. Merely observing the old output hash would not have closed review33.

The [Kiro verification record](../../.kiro/specs/reproducible-build-v9/tasks.md) additionally records an isolated lockfile install, a clean rebuild, the old-test failure and a negative control. Their retained logs were reviewed; Codex did not repeat `npm ci`, install another dependency or repeat the negative-control mutation in this pass.

## Browser and delivery boundary

The targeted browser reruns use the served files, verified byte-identical to this independent rebuild. Results are in `output/playwright/codex-prompt10-review/check-*.log`. The earlier complete browser/visual battery and first-visit simulation in [review33](33_V9_Independent_QA_And_First_Visit.md) apply to the same runtime; no repeat of every browser, profile or agent trial is needed merely because this test changed.

There is no new gameplay finding that justifies widening scope. Keep v9, pursue first-visit human feedback on the glass/encuadre question when available, and prepare the actual delivery package. A root open-source license, public repository and working demo access, public video and final submission materials remain separate checkpoints. No runtime, license, Git history, account, remote or submission was changed by this review.
