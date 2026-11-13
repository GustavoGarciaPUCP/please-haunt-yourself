# Reproducible build, keeping v9 — design

Kiro IDE session, November 10, 2026. Requirements and findings in `requirements.md`; verification in `tasks.md`.

## 1. What the source check guarantees

v9 lets ECHO, CANVAS, TERMINAL's receipt and the desktop skip `'mail-draft'` changes. That is safe only while none of them shows the mail draft. The check in `tests/fluid-typing-v9.test.ts` guards this over all of their code, not only the routes a browser check drives:
- the files that skip `'mail-draft'` are exactly those four;
- none of them reads `mail.draft`.

`check:typing` tests the same behaviour with real input, but only on its routes. So the check stays; only the way it reads the files changes.

## 2. Alternatives

| Alternative | What it takes | Cost | Decision |
| --- | --- | --- | --- |
| **A. Declare Node's types:** `@types/node` 22.x as a devDependency, plus `"types": ["node"]` | A download, a new entry in `package.json` and `package-lock.json`, and a `tsconfig.json` change (finding C) | One `tsconfig.json` covers `src` and `tests`. Node's globals (`process`, `Buffer`, `require`, `__dirname`) would then type-check in the browser source too, and `tsc` would stop flagging them there. Keeping them out of `src` needs a second tsconfig for the tests and a second `tsc` run in `build`. | Rejected: a dependency and more configuration for one test, and a weaker check of `src` without them |
| **B. Read the sources through Vite:** `import.meta.glob('../src/haunt/*.ts', { query: '?raw', import: 'default', eager: true })` | One test changes, nothing else | The check now depends on Vite's glob, which works only where Vite transforms the test. That is Vitest, the project's declared test runner (5.1.0, on Vite 8.3.6). The types come from `vite/client`, already referenced by `src/vite-env.d.ts`, so `?raw` values are typed `string`. | **Chosen** |
| **C. Declare `node:fs` by hand** in a local `.d.ts` | A small shim | Hand-written types for someone else's module, which can drift from Node | Rejected |
| **D. Replace the source check with a behavioural unit test** | Rendering the four views in a unit test | The unit tests run in Node without a DOM (`environment: 'node'`), and no jsdom or happy-dom is declared, so this needs a new dependency. `check:typing` already tests the behaviour on its routes. | Rejected |
| **E. Exclude the test from `tsc`, drop `tsc` from `build`, use `any` or `@ts-ignore`, or delete the check** | — | Hides the error or the guarantee; prompt10 rules these out | Rejected |

## 3. The change

Only `tests/fluid-typing-v9.test.ts` changes: 7 lines added, 4 removed (`output/playwright/v10/test-repair.diff`).
- **The import of `node:fs` and the file reading are replaced by the glob.** Its values are typed `string`, so the callbacks are typed and the four implicit-`any` errors go with the first error.
- **The pattern gets a name, `readsDraft`, and a positive control.** POSTMAN, which shows the draft, must read it. If the glob ever returned something other than the source text, or the pattern stopped matching how the code reads the draft, the test fails instead of passing silently.
- **Unchanged:** `tsconfig.json`, `package.json`, `package-lock.json`, `vite.config.ts`, every source file and every other test. No dependency is added, and the build identifier stays v9.

## 4. What it relies on, and how each part was checked

| Reliance | Check (`tasks.md`) |
| --- | --- |
| The glob reads the same files and the same text as `readdirSync`/`readFileSync` did | A scratch probe compares both in one Vitest run: 32 files, 445,066 characters, identical |
| The declared dependencies are enough | A clean `npm ci` from the lockfile, in a temporary directory outside the project with no `node_modules` above it, type-checks, builds and passes 166 tests. It has no `@types/node`. |
| The check still fails on what it guards | In that copy, a read of `store.mail.draft` added to `echo-view.ts` fails the test with "echo-view.ts reads the mail draft" |
| The bundle does not change: tests are not part of it | The rebuilt `dist/` is byte-identical to the served v9, in the project and in the clean copy |

## 5. Positions on prompt10 and review 33

| Codex proposal | Position | Reason and evidence |
| --- | --- | --- |
| Reproduce the discrepancy before correcting; confirm the cause; review why the earlier record said the build passed, without inventing an environment or a past run | **Accept** | Reproduced in the project and in a clean install. The cause is finding A. Findings E and F say what the file times show, and that no log of the last v9 rebuild exists. |
| Compare declaring Node's types with a check supported by the declared environment, and choose with the cost explained | **Accept** | §2. B keeps the check and adds nothing. A's cost includes a weaker check of `src` unless a second tsconfig is added. |
| If a dev dependency is needed, declare it and keep a coherent lockfile; no global or accidental packages | **Accept; none is needed** | `package.json` and `package-lock.json` are unchanged. `npm.cmd ls --all` exits 0 in the project and in the clean copy. |
| Keep the check strict: no removing `tsc`, excluding tests, `any`, `@ts-ignore`, or deleting a guarantee without a replacement | **Accept** | §3. The guarantee is kept and gains a positive control. |
| If the source-text test is too fragile, replace it with a meaningful test | **Keep it** | It is the only check of the invariant over all of the four views' code. A text check can be fooled by unusual code (a destructured `draft`, for example). The positive control fails if POSTMAN's way of reading the draft changes, which is when the pattern needs a look. |
| Keep all of v9's improvements | **Accept** | The runtime is byte-identical. `check:typing`, `check:active` and `check:case` pass on it. |
| Verify from the delivered tree: typecheck, build, test; report commands, outputs, environment and hashes | **Accept** | `tasks.md`. |
| If only types or test configuration change, show the runtime and presentation are the same; no version bump just to count | **Accept** | Byte-identical `dist/`. The identifier stays v9, and About still says "HAUNT OS 4 · build v9". |
| Repeat `check:typing`, `check:active` and the relevant closing route; do not repeat heavy profiles without a reason | **Accept** | The closing route is `check:case`: pointer and keyboard routes to Finish session, reload after the end, Start over, storage blocked, retention and the release. No profile was rerun. |
| Record the problem and the repair in requirements, design, tasks and `docs/kiro-usage.md`, without attributing Codex's results to Kiro | **Accept** | This folder, plus the README, AGENTS.md, steering and kiro-usage entries. |
| Review 33's agent observations are not tests with people; automation timeouts are not game defects; no redesign from them | **Accept** | Nothing in the game changed, including the copy that trial B was unsure about. |
| Close honestly: no licence, commit, push, publication or submission | **Accept** | None was done. |

## 6. The lesson for the records

The browser checks read `dist/`, and Vitest does not check types. Neither can show that `dist/` still comes from the current tree. The v9 record took a build's success from a hash comparison. This record gives the exit status of every command it reports, and compares `dist/` by SHA-256 only after a build that exited 0.
