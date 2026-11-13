# Fluid typing and the active window (v9) — tasks and verification record

Kiro IDE session, November 10, 2026. Brief: `Kiro brief 09`, sections 1–9. Requirements in `requirements.md`, design in `design.md`, positions on Codex's proposals in `design-review.md`.

## Tasks

- [x] 1. **Keep v8 for comparison.** Before any change, the v8 build (`haunt-CjGjZ4b_.js`) was copied to `output/playwright/v9-before-dist/` and served on port 5175. The current `dist/` is served on 5174.
- [x] 2. **Measure first, on v8** (findings A–I, requirements §1):
  - the typing profile (`scripts/v9-typing-profile.mjs`), two runs;
  - Chrome's sampling profiler on an unminified build of the same source (`output/playwright/v9-cpu-profile.mjs`, scratch);
  - the active-window probe (`scripts/v9-active-baseline.mjs`).
- [x] 3. **The case store says what changed** (`src/haunt/case-store.ts`): `CaseChange`, `'mail-draft'` for mail-draft changes, `'case'` for everything else, including the save state and a moved phase.
- [x] 4. **The views that never show the mail draft skip it:** `echo-view.ts`, `canvas-view.ts`, `terminal-view.ts` (the receipt) and `desktop-shell.ts`, one filter each.
- [x] 5. **POSTMAN does only the pertinent work** (`src/haunt/postman-view.ts`): keyed letter canvases, keyed mailbox and message lists, guarded writes, one copy of the deliveries per render.
- [x] 6. **The window manager** (`src/haunt/window-manager.ts`): `setSubtitle` writes only when it differs; `syncActive()` from raise, close and minimize.
- [x] 7. **Build identifier v9:** `haunt.html` (meta and About) and `scripts/check-first-run.mjs`.
- [x] 8. **Unit tests:** `tests/fluid-typing-v9.test.ts`.
- [x] 9. **Browser checks:** `check:typing` (`scripts/check-fluid-typing.mjs`) and `check:active` (`scripts/check-active-window.mjs`), each also run on v8 as a negative control.
- [x] 10. **Rerun everything:** build, unit tests, every browser check, `review:v6`, Edge, 4× CPU.
- [x] 11. **After records:**
  - the profile alternating v8 and v9, two runs each with the final profiler;
  - the sampling profiler on an unminified v9 build;
  - the probe on v9;
  - the before/after sheets (`scripts/v9-compare.mjs`).
- [x] 12. **Self-review after use** (design review §3). The typing check was corrected after its first full-suite run.
- [x] 13. **Records:** README, AGENTS.md, `.kiro/steering/project-contract.md`, `docs/kiro-usage.md`, PITCH.md's build line and the first-visit protocol's build line.

## Verification record

All runs target served production builds: v9 at `http://127.0.0.1:5174`, v8 at `http://127.0.0.1:5175`. They use Chrome 157.0.8103.39 through Playwright, headless, at 1366×768, with real pointer, keyboard and clipboard input, unless Edge is named. These are automated checks and instrumented measurements, not human play.

**Build.**
- `npm.cmd run build` (type-check, then Vite) writes `assets/haunt-CgO5uN2S.js` and `assets/haunt-9asRCWsn.css`. The stylesheet is v8's, unchanged.
- `haunt.html` has `<meta name="haunt-build" content="v9">`, and About says "HAUNT OS 4 · build v9".
- The paper-bridge bundles are unchanged (`index-DtwU5Nqx.js`, `index-CI5aaKki.css`).
- **Correction, November 10 (prompt10; see `.kiro/specs/reproducible-build-v9/`).**
  - The first line holds for the build of 14:00:09, which ran before `tests/fluid-typing-v9.test.ts` existed. That test imported `node:fs`, whose types are not declared, so `tsc --noEmit` failed on it. `npm.cmd run build` therefore failed on the tree this record delivered, and `dist/` stayed the 14:00:09 build.
  - The delivery report's "a rebuild gives the same hash" was wrong for the same reason.
  - After the repair, the build passes and writes the same seven files byte for byte, so the results below still describe the current source.

**Unit tests.** `npm.cmd test`: 166 tests in 15 files pass (161 before). The new `tests/fluid-typing-v9.test.ts` has 5 tests:
- **Change kinds.** Typing, Compose, Reply, the attachment and Discard are `'mail-draft'` only; Send is `'case'`; every key is saved exactly.
- **Storage failing during a key.** Session only is announced as `'case'` before the key's `'mail-draft'`, and again when the next write succeeds. The first good write holds everything typed meanwhile.
- **Source check.** The four views that skip `'mail-draft'` (and only they) never read `mail.draft`. Since prompt10 it reads the sources through Vite (`import.meta.glob` with `?raw`) instead of `node:fs`, and checks that POSTMAN, which shows the draft, does read it.
- **Property, 250 random sequences of 8–40 steps over 26 operations.** The operations include draft edits, Unicode, letter edits, captures, Send, answers, Return, Dismiss, Finish, Start over, and storage failing and coming back. It checks the four assertions of design §4. One run: 1881 draft-only steps, 143 `'case'` steps that also changed the draft, 48 save-state flips during a draft edit, 406 failed writes and 60 finished cases, so none of the cases is vacuous.
- **Negative control.** A store patched to announce every change as `'mail-draft'` fails the property's first assertion on a single letter edit.

**Browser checks at normal speed** (`node output/playwright/v6-run-all.mjs v9-final2` → `output/playwright/v6-run-v9-final2.json`): 16 checks, all exit 0, 106 recorded outcomes, 0 page errors.

| Check | Outcomes | Seconds |
| --- | --- | --- |
| windows | 7 | 6.5 |
| drag | 5 | 9.2 |
| halloween | 4 | 22.8 |
| echo | 7 | 18.1 |
| letter | 9 | 67.5 |
| case | 9 | 93.2 |
| keys | 1 | 14.9 |
| console | 5 | 5.4 |
| recovery | 5 | 9.2 |
| guide (About says build v9) | 5 | 17.5 |
| drawn | 12 | 212.6 |
| paths | 6 | 58.0 |
| confirm | 8 | 155.4 |
| text | 10 | 184.8 |
| **typing (new)** | **8** | 32.5 |
| **active (new)** | **5** | 6.9 |

**`check:typing`** (`output/playwright/fluid-typing-results.json`):
1. **Message with the four programs open.**
   - Keys, a key typed in the middle (the caret stays at 4), a selection replaced, Backspace, the field's own Ctrl+Z (it gave "Hilo"), a real clipboard paste at the limit (590 + 20 kept as 600), and Unicode typed key by key. After every step, the saved draft equals the field.
   - The page waits until it is quiet, then records. During the 9 edit events and around them, POSTMAN had 0 mutation records, no other window or the desktop changed, nothing was drawn, and the attached letter kept its pixels.
2. **Subject and To.** Keys still update the Drafts row's subject and recipient, and the guest suggestion once "guest" is typed. The saved draft follows.
3. **A real letter change** (Night paper in CANVAS) redraws POSTMAN's attached letter: its pixels change.
4. **The last key, then Ctrl+Enter at once:** A is delivered with exactly the typed message.
5. **Draft B.** Typed, POSTMAN closed and reopened, more typed, the page reloaded: the field and the save hold exactly what was typed. A is byte-identical.
6. **A question about B.**
   - A key typed closes it; nothing is sent.
   - Asked again, then the letter changed in CANVAS: the question closes and says why; nothing is sent.
   - With TERMINAL, ECHO and CANVAS minimized, the answer delivers exactly B, and A stays byte-identical.
   - Restored: CANVAS says it is the letter sent, TERMINAL shows its receipt, and ECHO marks the capture in the letter.
7. **After Finish session, a copy typed with storage blocked.**
   - The first key turns on Session only, in the tray and in CANVAS. With storage back, the next key turns it off ("Draft saved").
   - After a reload, the draft holds all four keys.
   - Sent, it is a Copy, and the accepted letter B is byte-identical.
8. **Only POSTMAN open.** Every key is saved; 0 mutation records, nothing drawn. TERMINAL and CANVAS reopened show the finished case.

**`check:active`** (`output/playwright/active-window-results.json`), 14 states:
1. **ECHO closed with X over TERMINAL.**
   - TERMINAL has the active frame at once, with the border and titlebar of a fresh case.
   - Focus returns to ECHO's taskbar button, as in v4. TERMINAL did not move.
   - A click in its field, typing and Enter work in the same transcript.
2. **ECHO minimized,** by its button and by its taskbar button. It has no active frame while minimized; TERMINAL has it at once. Restored, ECHO has it again.
3. **Three windows, the top one closed.** The next in z-order has the frame, and the others keep their order.
4. **By keyboard,** the window menu's Minimize and Close.
   - The frame follows the active window.
   - With only a minimized window left, no window is active.
   - Restored and reopened windows have the frame.
   - The case phase is unchanged.
5. **At every step,** exactly the taskbar's pressed window has the active frame, and it looks active.

**Negative controls on v8** (port 5175):
- **`check:typing`** fails at "during the input events, no other window or the desktop changed". The 9 edit events made ECHO 234, CANVAS 135, POSTMAN 126, the taskbar 36, the desktop 18, TERMINAL 9 and detached 9 mutation records (`check-typing-on-v8.log`, `fluid-typing-results-on-v8.json`).
- **`check:active`** fails at "ECHO closed with X": TERMINAL is pressed in the taskbar, with border rgb(42, 58, 64) (`check-active-on-v8.log`).

**Edge.** `HAUNT_CHANNEL=msedge` in the installed Edge 157.0.4341.42, with a temporary profile and a real clipboard paste: `check:typing` 8 outcomes, `check:active` 5, `check:text` 10; 0 page errors (`*-results-msedge.json`). The other checks were not run in Edge.

**4× CPU throttle** (Chrome's simulation; `HAUNT_CPU_THROTTLE=4 node output/playwright/v6-run-all.mjs v9-throttle4 letter case keys paths confirm text typing active` → `output/playwright/v6-run-v9-throttle4.json`): 8 checks, all exit 0, 56 outcomes, 0 page errors.

| Check | Outcomes | Seconds |
| --- | --- | --- |
| letter | 9 | 108.4 |
| case | 9 | 167.6 |
| keys | 1 | 21.0 |
| paths | 6 | 122.2 |
| confirm | 8 | 326.3 |
| text | 10 | 414.7 |
| typing | 8 | 52.7 |
| active | 5 | 11.1 |

The per-check results files now hold the throttled runs. The normal-speed runs are in `v6-run-v9-final2-*.log`.

**Review route.** `npm.cmd run review:v6` on the v9 build (`output/playwright/v6-review.json`, screenshots in `v6/`, log `review-v6-v9.log`): 70 states at each of 1366×768, 1440×900 and 1920×1080, 210 in all. Each state has the DOM audit (with `picture-clipped`) and the drawn-text audit: 0 problems, 0 page errors.

**The typing profile, before and after** (`output/playwright/v9-profile-*.json`; ranges over every run; built by the scratch `v9-table.mjs` into `v9-table.md`):
- **Runs.** v8: runs a and b (before any change), then c and d alternating with v9. v9: trial, c and d. Paced conditions exist only in the later runs.
- **Columns.**
  - "Sync work" is the synchronous work of one input event.
  - "Keydown to next frame" is Chrome's Event Timing, headless, in 8 ms steps; only entries of 16 ms or more are reported.
  - Counts are per key, during the input events. Over the whole typing window they are the same, and the idle 800 ms before each condition showed no work.

| Condition (60 keys) | Build | Runs | Wall ms per key | Sync work, median ms | Sync p95 ms | Keydown to next frame, median ms | Mutation records per key | Drawing calls per key | Save writes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Control textarea, four programs | v8 | 4 | 2.43–5.25 | 0 | 0.1 | 24 | 0 | 0 | 0/60 |
|  | v9 | 3 | 2.6–2.78 | 0 | 0–0.1 | 24 | 0 | 0 | 0/60 |
| Message, four programs, ECHO on Captures | v8 | 4 | 24.18–38.57 | 13.9–20 | 16.9–29.8 | 96–168 | 63 | 766 | 60/60 |
|  | v9 | 3 | 4.83–5.9 | 1.3–1.5 | 1.8–2.9 | 24 | 0 | 0 | 60/60 |
| Same, light instruments | v8 | 4 | 27.05–29.25 | 14.7–16.3 | 18.9–22.8 | – | – | – | 60/60 |
|  | v9 | 3 | 4.35–4.85 | 1.2–1.3 | 1.8–2 | – | – | – | 60/60 |
| Same, paced (a key every 120 ms) | v8 | 2 | 142.63–142.72 | 11.5–12.1 | 14.6–17 | 48 | 63 | 766 | 60/60 |
|  | v9 | 3 | 133–133.48 | 1.2–1.3 | 2.1–2.4 | 16 | 0 | 0 | 60/60 |
| Control textarea, paced | v8 | 2 | 128.8–131.7 | 0 | 0–0.1 | 16 | 0 | 0 | 0/60 |
|  | v9 | 3 | 127.85–130.83 | 0 | 0.1 | 16 | 0 | 0 | 0/60 |
| Subject, four programs | v8 | 4 | 25.35–36.87 | 13.4–21.6 | 16.5–29.9 | 88–168 | 63 | 766 | 60/60 |
|  | v9 | 3 | 5.4–5.57 | 2 | 3.1 | 24 | 1 | 0 | 60/60 |
| Message, ECHO on Live · Desktop glass | v8 | 4 | 30.88–32.55 | 15.4–18.9 | 20.3–25.7 | 128–144 | 52 | 766 | 60/60 |
|  | v9 | 3 | 4.43–5.52 | 1.2–1.4 | 1.9–2.5 | 24–40 | 0 | 0 | 60/60 |
| Message, only POSTMAN open | v8 | 4 | 10.95–15.45 | 6–8.6 | 7.6–11.3 | 48–64 | 20 | 505 | 60/60 |
|  | v9 | 3 | 4.38–5.48 | 1.1–1.4 | 1.8–2.2 | 24 | 0 | 0 | 60/60 |
| Message after Finish session, 3 deliveries | v8 | 4 | 29.78–30.45 | 17.6–18.6 | 22.7–25.7 | 112–128 | 66 | 859 | 60/60 |
|  | v9 | 3 | 4.98–5.63 | 1.6–1.8 | 2.6–3 | 24–40 | 0 | 0 | 60/60 |
| Message, four programs, 4× CPU (simulation) | v8 | 4 | 111.27–131.72 | 82–99.2 | 99.1–125.6 | 152–176 | 63 | 766 | 60/60 |
|  | v9 | 3 | 22.05–23.47 | 6–6.6 | 9.1–9.9 | 32 | 0 | 0 | 60/60 |
| Same, paced, 4× CPU (simulation) | v8 | 2 | 228.45–234.55 | 89.9–98.3 | 108.8–122.4 | 144–152 | 63 | 766 | 60/60 |
|  | v9 | 3 | 142.22–143.58 | 7.6–8.2 | 9.5–10.5 | 32 | 0 | 0 | 60/60 |

Read with the table:
- **Subject on v9** costs 1 mutation record per key: the Drafts row, which shows the subject, is rebuilt. That is pertinent work.
- **"Same, light instruments"** has only the event timer and the save counter. On v8, the full instrument's median was between 2.4 ms lower and 5.3 ms higher than the light one in the same run, so its cost is within the variation between runs. On v9 it adds about 0.1–0.2 ms.
- **The 24–40 ms ranges on v9** (ECHO on Live, after the end) come from one run each at 40 ms, with no extra work counted in that run.

**Where the time goes, before and after** (Chrome's sampling profiler, 100 µs; the same 60 keys and route on unminified builds of each source, `output/playwright/v9-cpu-v8-unminified.json` and `v9-cpu-v9-unminified.json`). Inclusive time per key:

| Work after one key | v8 | v9 |
| --- | --- | --- |
| Everything under `MailModel.updateDraft` | 19.56 ms | 1.37 ms |
| ECHO's `render` | 8.62 ms | — (not called) |
| POSTMAN's `render`; of it, `drawLetters` | 6.65 ms; 6.02 ms | 0.37 ms; 0.03 ms |
| CANVAS's `render` | 2.72 ms | — (not called) |
| `CaseStore.persist` (the save) | 1.00 ms | 0.87 ms (of it, encoding the fog grid 0.56 ms) |
| The desktop's `render` | 0.35 ms | — (not called) |
| `CaseStore.computePhase` | 0.11 ms | 0.08 ms |
| TERMINAL's `renderReceipt` | 0.02 ms | — (not called) |

**The active-window probe** (`scripts/v9-active-baseline.mjs` → `output/playwright/v9-active-v8.json`, `v9-active-v9.json`, screenshots in `v9-active-v8/` and `v9-active-v9/`):
- 13 steps on each build.
- The frame disagreed with the model at 5 steps on v8 (3, 4, 5, 8, 9) and at none on v9.
- Focus was on the same element at all 13 steps on both builds.
- On both builds, "help" was typed in TERMINAL, and the reopened TERMINAL showed the same 4 transcript lines.

**Screenshots inspected.**
- **The before/after sheets** in `output/playwright/v9-compare/`: 01 after the close, 02 after the click, 03 after the minimize. TERMINAL's titlebar is cropped and enlarged ×1.5.
- **ECHO fading out after its X** (`v9-closing-v8/`, `v9-closing-v9/`, scratch `v9-closing-frames.mjs`).

What they showed is in design review §3.

**Scratch tools** (in `output/playwright/`, not checks):
- `v9-cpu-profile.mjs` (the sampling profiler);
- `v9-summarize.mjs` and `v9-table.mjs` (the summaries);
- `v9-closing-frames.mjs`;
- the unminified builds `v9-v8-unminified/` and `v9-v9-unminified/`, served on ports 5176 and 5177 for the sampling profiles only.

## Not verified

- How a person perceives typing speed, before or after; human play of v4–v9. The first-visit protocol is ready and has not been run.
- Screen readers, IME composition, touch, Firefox and Safari. Edge ran `check:typing`, `check:active` and `check:text` only.
- A physically slower computer: the 4× runs are Chrome's simulation.
- The session context reported the model as Claude Opus 5.5; effort and credits were not visible.

Nothing was published, pushed or submitted.
