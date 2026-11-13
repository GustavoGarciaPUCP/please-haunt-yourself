# Reproducible build, keeping v9 — tasks and verification record

Kiro IDE session, November 10, 2026. Brief: `PROMPT_KIRO_10_COMPILACION_REPRODUCIBLE_Y_CIERRE_V9.md`. Requirements and findings in `requirements.md`, design and positions on Codex's proposals in `design.md`.

## Tasks

- [x] 1. **Read** AGENTS.md, the steering file, review 33, prompt10 and `.kiro/specs/fluid-typing-v9/`.
- [x] 2. **Keep the served v9 for comparison:** `dist/` copied to `output/playwright/v10/before-dist/`, with the SHA-256 of every file in `dist-before.sha256.txt`.
- [x] 3. **Reproduce** the type-check and build failure on the delivered tree (requirements §1).
- [x] 4. **Find the cause and why the v9 record said the build passed** (requirements §2: package files, lockfile, installed packages, TypeScript's program, file times).
- [x] 5. **Compare the alternatives and choose** (design §2).
- [x] 6. **Repair `tests/fluid-typing-v9.test.ts`** (design §3).
- [x] 7. **Check the repair** (below):
  - type-check, build and unit tests in the project;
  - the glob against the file system;
  - a clean install in an isolated directory, with the old test, the new test and a negative control;
  - `dist/` compared byte for byte;
  - `check:typing`, `check:active` and `check:case`.
- [x] 8. **Correct the v9 record** (`.kiro/specs/fluid-typing-v9/tasks.md`, Build) and update README, AGENTS.md, `.kiro/steering/project-contract.md` and `docs/kiro-usage.md`.

## Verification record

Logs, lists and scratch files are in `output/playwright/v10/`.

**Environment:**
- Windows NT 10.0.26200.0, PowerShell 5.1.26100.9711.
- Node v22.13.1, npm 10.9.2.
- TypeScript 7.0.2, Vite 8.3.6, Vitest 5.1.0, Playwright 1.65.0, Chrome 157.0.8103.39.

**Timeline on November 10, from file times:**

| Time | What |
| --- | --- |
| 13:56–13:59 | v9's last source changes (`case-store.ts` 13:56:24 … `haunt.html` 13:59:59) |
| 14:00:09 | The v9 build writes all seven files of `dist/` |
| 14:15:23 | `tests/fluid-typing-v9.test.ts` is created; last written at 14:19:19 |
| 14:25:57 | `package.json` gains `check:typing` and `check:active` (scripts only) |
| 15:57:04 | The v9 delivery's last check: `npm.cmd test`, 166 pass (`output/playwright/v9-final-unit.log`). No build was run in it. |
| 16:42:13 | This task keeps the served `dist/` and its hashes |
| 16:42:30–16:42:32 | The type-check and the build fail (`typecheck-before.log`, `build-before.log`) |
| 16:43:20 | The test is repaired |
| 16:44:20 | The type-check passes (`typecheck-after.log`) |
| 16:49:02 | The repaired build writes `dist/` again |

**Before the repair:**
- `npm.cmd run typecheck` exits 1 and `npm.cmd run build` exits 1, with the five errors of requirements §1 (`typecheck-before.log`, `build-before.log`).
- After the failed build, `dist/assets/haunt-CgO5uN2S.js` still had its 14:00:09 write time.
- `npm.cmd test` exits 0: 166 tests in 15 files.

**The repair.** `tests/fluid-typing-v9.test.ts`: 7 lines added, 4 removed (`test-repair.diff`). SHA-256 before `DA2F1303C83EAAF8F637A3A92780FEC867A2DC45824A8DB0A2E38DA8B75C04C1`, after `907DAA3CD99713677823E5BE95D3B01690EB95C7613E617385E666C7B91F4375`.
- The file is untracked, so Git holds no earlier copy. The pre-repair text was rebuilt from the file as it was read before the edit (`fluid-typing-v9.test.before.ts`).
- In the clean install it gives the five errors at the same lines and columns as review 33's log, which confirms the rebuild.
- Nothing else in the project's code or configuration changed.
  - `package.json` was last written at 14:25:57 on November 10, `package-lock.json` and `vite.config.ts` on November 6, and `tsconfig.json` on November 5.
  - Under `src/`, `tests/` and `scripts/`, the only file written after 16:00 is this test.
  - SHA-256 for later comparison: `package.json` `7EE9F5C281125BA039FD888BB961D472BCC4EA75ECCE05E8C7E450716D161044`, `package-lock.json` `C7BA449AFAC6AC2CD71E63C85E2B231D6D29C8388665439BF19C860D452E2933`, `tsconfig.json` `12F1CCF631A9BD081981228B816AFB93E3642A7B9503234CD5CF9892D9997834`.

**In the project, after the repair:**

| Command | Exit | Result |
| --- | --- | --- |
| `npm.cmd run typecheck` | 0 | no output (`typecheck-after.log`) |
| `npm.cmd run build` | 0 | Vite 8.3.6, 46 modules; the same seven file names (`build-after.log`) |
| `npm.cmd test` | 0 | 166 tests in 15 files (`unit-after.log`) |
| `npm.cmd ls --all` | 0 | no extraneous, missing or invalid package; `@types/node` only as an unmet optional peer of `vite` and `vitest` (`npm-ls.log`) |

The IDE reports no diagnostics for the test.

**`dist/`, byte for byte.** The seven files written at 16:49:02 have the same names and SHA-256 as the served v9 files of 14:00:09: 0 differences (`dist-before.sha256.txt`, `dist-after.sha256.txt`).

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `haunt.html` | 7934 | `40A75DB19AA2083B6892A4B37A9F6BE45B887E4E30CBA7D48D9C801B04E8EB3C` |
| `assets/haunt-CgO5uN2S.js` | 227250 | `48E3AD06E9EF83D844685434E6130398721413ED3CF3ADC0BF165C10E126D005` |
| `assets/haunt-9asRCWsn.css` | 52968 | `1D4A078042C01C35E23F755BFB7670E9D12268EF996431C8D045F2518D7BF4B1` |
| `index.html` | 658 | `0FD9FF0DEB8F7A376D3C5C947BBB20E3C711814C961D037585C178EEFDCA6A1D` |
| `assets/index-DtwU5Nqx.js` | 45985 | `72412E7547816F8B8AE49368D5EB1C413C3820AE8484E8C16361A4F7CABE85E6` |
| `assets/index-CI5aaKki.css` | 9625 | `9B3A1615144486A120C54C986E2013B31388081289469CA2A4994F4DD30F6634` |
| `assets/modulepreload-polyfill-P2Xu9kJm.js` | 670 | `418C206484B89B68EF5F067277831E583FC9193A62AADF4DE269ACAAEB12A85F` |

The served page has `<meta name="haunt-build" content="v9">` and About says "HAUNT OS 4 · build v9".

**The glob against the file system.** A scratch probe (`glob-probe.test.ts` with `vitest.probe.config.mjs`, not a project test) reads `src/haunt/*.ts` both ways in one Vitest run: 32 files and 445,066 characters each way, with the same names and identical texts (`glob-probe.log`).

**Clean install, isolated.**
- **The copy.** The project without `node_modules`, `dist`, `output`, `.git` and `test-results` (216 files) went to `C:\Users\51924\AppData\Local\Temp\haunt-v10-clean-20261110-165309`.
- **Isolation.** No directory above it has a `node_modules`, `NODE_PATH` is empty, and neither `~\.node_modules` nor `~\.node_libraries` exists. Its `package.json` and `package-lock.json` are identical (SHA-256) to the project's.
- **The install.** `npm.cmd ci --prefer-offline --no-audit --no-fund` exits 0: "added 42 packages in 5s".
  - The versions and integrity hashes come from the lockfile; `--prefer-offline` lets npm take matching tarballs from its cache.
  - The only package with an install script is `fsevents` (optional, macOS).
  - `node_modules/@types` holds `chai`, `deep-eql` and `estree`, with no `node`.
  - `npm.cmd ls --all` exits 0.
- **With the repaired test:**
  - `npm.cmd run typecheck` exits 0.
  - `npm.cmd run build` exits 0, and its seven files are byte-identical to the project's `dist/`.
  - `npm.cmd test` exits 0: 166 tests in 15 files (`clean-*.log`, `clean-dist.sha256.txt`).
- **With the old test:**
  - `npm.cmd run typecheck` exits 1, with the five errors at the same positions (`clean-typecheck-old-test.log`).
  - `npx.cmd vitest run tests/fluid-typing-v9.test.ts` exits 0, 5 of 5 (`clean-vitest-old-test.log`). This is the mismatch review 33 found: the tests pass while the type-check fails.
- **Negative control.** With the repaired test back, this line was added to the copy's `echo-view.ts`: `export const negativeControlReadsDraft = (store: { mail: { draft: unknown } }): unknown => store.mail.draft;`. The test then fails: "echo-view.ts reads the mail draft: expected true to be false" (`clean-negative-control.log`). The file was restored, and the copy was then deleted.

**Browser checks** (served rebuilt `dist/` at `http://127.0.0.1:5174`, Chrome through Playwright, headless, normal speed; logs `check-*.log`):

| Check | Exit | Outcomes | Page errors | Seconds |
| --- | --- | --- | --- | --- |
| `check:typing` | 0 | 8 | 0 | 33.3 |
| `check:active` | 0 | 5 | 0 | 8.0 |
| `check:case` (the closing route) | 0 | 9 | 0 | 92.4 |

`check:case` covers these routes:
- the pointer route at 1440×900, to Finish session;
- a reload after the end;
- Start the case over;
- the keyboard route at 1366×768;
- storage blocked at 1920×1080;
- retention through 13 returned sends before and after the end;
- the release seen in the receipt, a reload during it, and reduced motion.

The per-check result files (`fluid-typing-results.json`, `active-window-results.json` and the case's) now hold these runs.

**Not rerun, and why:**
- The other 13 browser checks, `review:v6`, the Edge runs, the 4× CPU runs and the typing profiles.
- The runtime they test is byte-identical to the v9 `dist/` on which they passed. That is recorded in `.kiro/specs/fluid-typing-v9/tasks.md`, and review 33 repeated the 16 checks and the 210 states independently.

## Not verified

- Human play of v4–v9, and how a person perceives the game.
- Review 33's agent observations about wiping and framing were not acted on. They wait for observation with people.
- Screen readers, IME, touch, Firefox and Safari, as before.
- The exact command and output of the last v9 rebuild: no log was kept (requirements, finding F).
- The session context reported the model as Claude Opus 5.5; effort and credits were not visible.

Nothing was committed, pushed, published or submitted, and no licence was chosen. Git history and dates are unchanged.
