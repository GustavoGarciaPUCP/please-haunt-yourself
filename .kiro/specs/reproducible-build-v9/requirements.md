# Reproducible build, keeping v9 — requirements

Kiro IDE session, November 10, 2026. Brief: `Kiro brief 10`, after Codex's review 33 (`docs/development/33_V9_Independent_QA_And_First_Visit.md`). This is a bounded build repair. The game, its four programs and v9's behaviour stay as they are. Design in `design.md`, verification record in `tasks.md`.

## 1. Reproduced before any change

On the delivered tree, before the repair (logs in `output/playwright/v10/`):

| Command | Exit | Result |
| --- | --- | --- |
| `npm.cmd run typecheck` (`tsc --noEmit`) | 1 | the five errors below (`typecheck-before.log`) |
| `npm.cmd run build` (`tsc --noEmit && vite build`) | 1 | the same five errors; Vite did not run (`build-before.log`) |
| `npm.cmd test` (`vitest run`) | 0 | 166 tests in 15 files pass |

```text
tests/fluid-typing-v9.test.ts(3,43): error TS2591: Cannot find name 'node:fs'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node` and then add 'node' to the types field in your tsconfig.
tests/fluid-typing-v9.test.ts(103,45): error TS7006: Parameter 'name' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(103,79): error TS7006: Parameter 'name' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(104,37): error TS7006: Parameter 'file' implicitly has an 'any' type.
tests/fluid-typing-v9.test.ts(105,25): error TS7006: Parameter 'file' implicitly has an 'any' type.
```

These are the errors of review 33's `output/playwright/codex-v9-review/build.log`, at the same positions. The failed build left `dist/` as it was: all seven files kept their write time of 14:00:09.

Environment: Windows NT 10.0.26200.0, PowerShell 5.1.26100.9711, Node v22.13.1, npm 10.9.2, TypeScript 7.0.2, Vite 8.3.6, Vitest 5.1.0.

## 2. Findings

| # | Finding | Evidence |
| --- | --- | --- |
| A | **The cause is one import.** `tests/fluid-typing-v9.test.ts` imports `readFileSync` and `readdirSync` from `node:fs` for its source check. `tsconfig.json` includes `tests`, so `tsc` checks the test, and nothing in the program declares Node's modules. The four implicit-`any` errors follow from the first: without the module's types, the callbacks' parameters have no type. | The errors above. No other file has an error. |
| B | **Node's types are not part of the declared environment.** | `package.json` declares five devDependencies, none of them `@types/node`. In `package-lock.json` (lockfile version 3, 87 package entries), `@types/node` appears only as an optional peer dependency of `vite` (`^20.19.0 \|\| >=22.12.0`) and `vitest` (`^22.0.0 \|\| >=24.0.0`); no entry installs it. `node_modules/@types` holds `chai`, `deep-eql` and `estree`. `npm.cmd ls --all` exits 0: no extraneous, missing or invalid package. |
| C | **Installing `@types/node` alone would not be enough.** TypeScript 7.0.2 here does not add installed `@types` packages to the program by itself. | `tsc --noEmit --listFilesOnly`: of the three installed `@types` packages, `chai` and `deep-eql` are in the program, reached through Vitest's own declarations; `estree` is installed but not included. The error message itself asks for `'node'` in the `types` field as well. |
| D | **Why the tests passed.** Vitest transforms TypeScript without checking types, and Node provides `node:fs` at run time. | 166 tests pass. In the clean install below, the old test passes 5 of 5 while `tsc` fails on it with the same five errors. |
| E | **Why the v9 record said the build passed.** The v9 build that wrote `dist/` ran at 14:00:09, before the test existed. | File times: every file in `dist/` was last written at 14:00:09. `tests/fluid-typing-v9.test.ts` was created at 14:15:23. Its final version fails `tsc` (finding A). A successful build rewrites every file in `dist/` (the repaired build did, at 16:49:02), and the files still had their 14:00:09 write time before the repair. So no build succeeded between 14:00:09 and the repair. |
| F | **What the v9 record got wrong.** | The v9 `tasks.md` says `npm.cmd run build` writes `haunt-CgO5uN2S.js`; that describes the 14:00:09 build, not the delivered tree. The v9 delivery report also said "A rebuild gives the same hash". That last rebuild could only fail at `tsc`: the installed packages were the same then. `node_modules/@types` was last changed on November 5 at 20:40:39, and `node_modules/.package-lock.json` was written at 20:40:44 that day; the only later entries in `node_modules` are the tool caches `.vite-temp` and `.vitest-cache`. Its hash comparison could only see the 14:00:09 files, and the build's own exit status was not checked. No log of that command was kept, so its exact command and output cannot be shown here. The browser checks read `dist/`, so they could not notice a failing build. |
| G | **The served v9 matches the current source.** Shown after the repair (`tasks.md`). | The repaired build writes seven files byte-identical (SHA-256) to the served ones of 14:00:09. Of the build's inputs, only `package.json` changed after 14:00:09 (at 14:25:57, adding the `check:typing` and `check:active` scripts), and it is not part of the bundle. |

## 3. Requirements

**R1. The strict type-check passes on the delivered tree.**
- `npm.cmd run typecheck` and `npm.cmd run build` exit 0.
- `tsconfig.json` is unchanged and still includes `tests`. The `build` script still runs `tsc --noEmit` before Vite.
- No `any`, `@ts-ignore`, `@ts-expect-error`, cast through `any` or test exclusion is added.

**R2. The source check keeps its guarantee.**
- It still fails when a view that skips `'mail-draft'` reads `mail.draft`, and when the set of skipping views is not exactly the four.
- It reads the same files and the same text as before.
- It cannot pass by reading something other than the sources.

**R3. The declared dependencies are enough.**
- A clean install from `package.json` and `package-lock.json`, in an isolated temporary directory, type-checks, builds and passes the unit tests.
- No dependency is added unless it is needed. If one is, it is declared, with a coherent lockfile.

**R4. v9 is unchanged.**
- The rebuilt `dist/` is byte-identical to the served v9 (`haunt-CgO5uN2S.js` / `haunt-9asRCWsn.css`), or every difference is explained.
- `check:typing`, `check:active` and the closing route (`check:case`) pass on it.
- The build identifier stays v9.

**R5. The records say what happened.**
- The v9 record's build statement is corrected where it stands, with what can be shown about why it was wrong.
- These requirements, the design and the tasks hold the problem and the repair. README, AGENTS.md, the steering file and `docs/kiro-usage.md` are updated with real attribution: Codex found the failure (review 33) and wrote prompt10; the Kiro agent reproduced and repaired it.

**Out of scope:**
- Changes to the game, including copy changes from review 33's agent observations. Those are simulations, not tests with people, and the instrument's timeouts are not game defects.
- New puzzles, animations or tutorials.
- Rerunning the performance profiles: the runtime does not change.
- A licence, a commit, a push, a publication or a submission.
