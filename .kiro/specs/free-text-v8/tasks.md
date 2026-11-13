# POSTMAN's free text (v8) — tasks and verification record

Kiro IDE session, November 9, 2026. Brief: `PROMPT_KIRO_08_TEXTO_LIBRE_Y_CIERRE_VISUAL.md`. Requirements in `requirements.md`, design in `design.md`, positions on Codex's proposals in `design-review.md`.

## Tasks

- [x] 1. **Reproduce on v7 before changing anything.** `scripts/v8-baseline.mjs` ran on the v7 build with real input: findings A–H (requirements §1). Output: `output/playwright/v8-baseline.json`, `v8-baseline-summary.txt` and 55 screenshots in `v8-baseline/`.
- [x] 2. **Find the cause.** Implicit `auto` tracks, fit-content items and the base button rule's centring (design §1). Measured alternative: `overflow-wrap: break-word` instead of `anywhere` leaves the message 4177 px wide (design review §2).
- [x] 3. **Fix in `src/haunt/desktop.css`.**
  - Bounded tracks (`minmax(0, 1fr)`) on `.reading-pane`, `.mail-head`, `.mail-body`, `.draft-editor` and `#desktop-root .message-item`.
  - `overflow-wrap: anywhere` on `.mail-head h3`, `.mail-message`, `.item-subject` and `.mail-notice`.
- [x] 4. **The list.**
  - A two-line clamp was tried and dropped: the audit reported the clamped subject's hidden lines as covered by the badge.
  - The list now shows the whole text, and `src/haunt/postman-view.ts` makes `.message-list` a keyboard region ("Messages") when it is taller than its column.
- [x] 5. **The audit sees a cut-off picture.** `scripts/layout-audit.mjs` gains `picture-clipped` (design §3). No rule relaxed, no exemption.
- [x] 6. **A second browser.** `scripts/haunt-helpers.mjs` reads `HAUNT_CHANNEL` (default `chrome`; `msedge` for the installed Edge).
- [x] 7. **`check:text`** (`scripts/check-free-text.mjs`, `npm.cmd run check:text`): the regressions of R7 with real input, and negative controls.
- [x] 8. **Build identifier v8.** `haunt.html` (meta and About) and `scripts/check-first-run.mjs`.
- [x] 9. **Rerun everything.** Build, unit tests, every browser check, `review:v6`, Edge, 4× CPU throttle.
- [x] 10. **After record.** The probe rerun on the final build (`v8-after.json`, `v8-after/`) and `scripts/v8-compare.mjs` for the before/after sheets (`output/playwright/v8-compare/`).
- [x] 11. **Self-review.** Every sheet inspected. Corrections to the records and to `check:text` are listed in design review §3.
- [x] 12. **Records.** README, AGENTS.md, `.kiro/steering/project-contract.md` and `docs/kiro-usage.md`.

## Verification record

All runs target the served production build at `http://127.0.0.1:5174`. They use Chrome through Playwright, with real pointer and keyboard input, unless Edge is named. These are automated checks, not human play.

**Build.** `npm.cmd run build` (type-check, then Vite) writes `assets/haunt-CjGjZ4b_.js` and `assets/haunt-9asRCWsn.css`. `haunt.html` has `<meta name="haunt-build" content="v8">`, and About says "HAUNT OS 4 · build v8". The paper-bridge bundles are unchanged (`index-DtwU5Nqx.js`, `index-CI5aaKki.css`). v7 was `haunt-U_tkFtyC.js` / `haunt-WVQaX4Df.css`.

**Unit tests.** `npm.cmd test`: 161 tests in 14 files pass, as in v7. No unit test was added: the change is CSS, one `scrollRegion` call and scripts. What matters is measured in the page by `check:text`; none of its assertions compares a CSS declaration.

**Browser checks at normal speed** (`node output/playwright/v6-run-all.mjs v8-final` → `output/playwright/v6-run-v8-final.json`): 14 checks, all exit 0, 93 recorded outcomes, 0 page errors.

| Check | Outcomes | Seconds |
| --- | --- | --- |
| windows | 7 | 6.6 |
| drag | 5 | 9.5 |
| halloween | 4 | 23.7 |
| echo | 7 | 20.6 |
| letter | 9 | 79.8 |
| case | 9 | 108.5 |
| keys | 1 | 17.1 |
| console | 5 | 6.7 |
| recovery | 5 | 11.2 |
| guide (About says build v8) | 5 | 20.5 |
| drawn | 12 | 224.8 |
| paths | 6 | 59.3 |
| confirm | 8 | 165.1 |
| **text (new)** | **10** | 189.9 |

Six of these run the DOM layout audit, now with `picture-clipped`, and require it to be empty: halloween, case, drawn, paths, confirm and text.

**`check:text`, final run** (`output/playwright/free-text-results-chrome.json`, also copied to `free-text-results.json`; Chrome 157.0.8103.38): 10 outcomes, 0 page errors, 35 audited states. The full-suite run above used an earlier version of this check that entered every field with `fill`; the final version, which types the main case key by key and records the typing time, was run separately afterwards. Each state is checked for:
- no horizontal scroll in the reading pane or the list;
- every part of the message and of the selected row inside its pane: receipt, state, heading, From/To lines, message, notice, question, fields, letter and buttons;
- the letter at 1.62 ±0.02 and at most 560 px wide;
- the heading and message equal to the entered text, with at least as many line boxes as typed lines;
- the row showing, and naming, the whole subject;
- the stored delivery equal to what was entered;
- no DOM or drawn-text problem.

The outcomes:
1. **1366×768, both fields at their limits.** The text is typed one key per character, one past each limit; the fields keep 120 and 600 (121 keys in 3.6 s, 601 keys in 19.7 s). As POSTMAN opens: pane 394 px, letter 362 px. Maximized: 970 px, letter 560 px. Minimum: 242 px, letter 210 px. Then Sent, Return to the request by pointer, Finish session, a reload (the case still finished), and the delivery shown again.
2. **1440×900**, the same with `fill`: pane 437 px, letter 405 px; maximized 1044 / 560; minimum 242 / 210.
3. **1920×1080**, the same: pane 562 px, letter 530 px; maximized 1524 / 560; minimum 242 / 210.
4. **One field at a time and the controls.** The subject alone; the message alone; spaced text with 8 line breaks (113 + 600 characters, its lines kept); a short Unicode sample; the case's normal content. Each as POSTMAN opens and at its minimum.
5. **Returned.** A reply to Mara with both long fields, as it opens and at the minimum. Open the draft shows the kept draft with both fields whole.
6. **An 80-character unknown address.** The notice repeats it whole and wraps; the fields stay inside the window; the draft's row shows the whole address; nothing was sent.
7. **An incomplete letter with both long fields, POSTMAN at its minimum.**
   - Keyboard: after Send anyway, focus is on Return to the request. Tab reaches Fix it in CANVAS, in view. Shift+Tab twice reaches the reading pane as a region, and End scrolls it 761 px until the letter is in view.
   - Pointer: Fix it in CANVAS opens CANVAS; Lift, Compose, the same long fields, Send (no question: nothing complete was held), Finish session.
8. **Three copies with 120-character subjects after Finish session, at the minimum.** Each is a Copy, and the accepted letter is unchanged. The list is taller than its column, so it is a keyboard region: 5 Tab presses from the mailboxes reach it, and PageDown scrolls it.
9. **Negative controls.**
   - A canvas made wider than the reading pane is reported as `picture-clipped`.
   - With v7's track and wrapping rules put back by an injected stylesheet, the audit reports 22 problems: 1 picture-clipped, 11 text-clipped, 10 text-offscreen. The 21 text reports match v7's baseline for that state exactly.
   - Both cases are clean again once the stylesheet is removed.
10. **The count:** 35 audited states with no problem.

**Edge.** `HAUNT_CHANNEL=msedge node scripts/check-free-text.mjs` in Edge 157.0.4341.42 (installed, temporary profile), with the final version of the check: 10 outcomes, 0 page errors, 35 states (`output/playwright/free-text-results-msedge.json`). The 121 keys took 4.9 s and the 601 keys 23.4 s. The negative control gave the same 22 reports as in Chrome. An earlier Edge run with the `fill`-only version also passed. The other checks were not run in Edge.

**4× CPU throttle** (`HAUNT_CPU_THROTTLE=4`; the five checks v7 ran at 4×, plus `check:text`):
- `v6-run-all.mjs v8-throttle4 text confirm letter case` → `output/playwright/v6-run-v8-throttle4.json`: letter 9 outcomes (119.6 s), case 9 (180.5 s), confirm 8 (346.9 s), all exit 0.
- **`check:text` failed in that run** (exit 1 after 70.8 s). Playwright's 30 s default timeout expired while it typed the 601-key message one key at a time. That is the harness, not an assertion: no layout or content check had failed. The timeout for typing is now 300 s, and the check records the typing time (design review §5).
- Rerun alone (`v8-throttle4-text` → `v6-run-v8-throttle4-text.json`, `free-text-results-throttle4.json`): 10 outcomes, 0 page errors, 488.6 s. The 121 keys took 15.6 s and the 601 keys 87.1 s.
- `v8-throttle4-more keys paths` → `v6-run-v8-throttle4-more.json`: keys 1 outcome (21.7 s), paths 6 (118.4 s), exit 0.

**Review route.** `npm.cmd run review:v6` on the v8 build (`output/playwright/v6-review.json`, screenshots in `v6/`): 70 states at each of 1366×768, 1440×900 and 1920×1080, 210 in all. Each has the DOM audit (now with `picture-clipped`) and the drawn-text audit: 0 problems, 0 page errors. The route uses the case's normal content, so it shows that nothing regressed and that the new rule reports nothing in ECHO, CANVAS, TERMINAL or POSTMAN as they normally are.

**The probe after** (`HAUNT_PROBE_DIR=output/playwright/v8-after node scripts/v8-baseline.mjs` on the final build → `v8-after.json`, `v8-after-summary.txt`, 55 screenshots with the same names as before): every state of findings A–F has 0 DOM and 0 drawn-text reports, and no horizontal overflow, against 6–23 DOM reports per state on v7.
- **Letter widths:** 362×223.5 at 1366×768, 405×250 at 1440×900, 530×327.2 at 1920×1080, 560×345.7 maximized and 210×129.6 at the minimum, all at 1.62.
- **Incomplete case:** focus ["return", "open-canvas"], in view (v7: not in view).
- **Notice:** 362 px as POSTMAN opens and 210 px at its minimum, inside (v7: 531.9 px, outside). The attached letter's preview fits at the minimum (210 px; v7: 300 px, cut off).
- **Controls (H):** still 0. The TERMINAL command kept 200 of 300 characters, at the field's limit.

**Experiments for the design review** (scratch, in `output/playwright/`):
- **`v8-experiments.json`** (`v8-experiments.mjs`).
  - What `fill` and key-by-key typing keep: TERMINAL 200 of 300 or 210; subject 120 of 121 or 122; message 600 of 606 or 601. The message typed one key per character took 18.4 s, and the typed delivery was stored exactly.
  - A 120 × W row: 203 px, 8 lines.
  - `break-word` instead of `anywhere`: pane scroll 4193 px, message 4177 px, row subject 1507 px, list scroll 1519 px, 4 DOM reports.
- **`v8-clamp-experiment.json`** (`v8-clamp-experiment.mjs`). The dropped two-line clamp, re-created on v8: 1 text-covered report per long-subject state (the subject by the Receipt badge), with a 97 px row. The normal subject's row is 80 px with or without it.
- **`v8-lines.json`** (`v8-lines.mjs`), both long fields at 1366×768. The heading takes 6 lines as POSTMAN opens and 10 at its minimum; the message 12 and 20; the list subject 8. The letter starts 599 px down a 580 px pane, and 933 px down a 384 px pane at the minimum.
- **`v8-typing-cost.json`** and **`v8-typing-cost-split.json`** (design review §5).
  - Per key in POSTMAN's Message: 31 ms, against 3 ms in a plain textarea; 114 ms against 10 ms at 4× throttle. One 38.5 KB save write per key.
  - Synchronous work per input event: 19.7 ms with the four programs open, 7.8 ms with only POSTMAN, 7.5 ms without the save write.
  - Recorded, not changed.

**Screenshots inspected.** The nine before/after sheets in `output/playwright/v8-compare/`:
- 00: the desktop;
- 01: both fields at three sizes;
- 02: maximized, minimum and Sent;
- 03: one field at a time;
- 04: Returned and the kept draft;
- 05: the unknown address;
- 06: the incomplete letter at the minimum;
- 07: after the reload;
- 08: the controls.

What they showed, and what was changed because of them, is in design review §3.

## Not verified

- Human play. No person has played v4–v8; the first-visit protocol in `.kiro/specs/confirmation-flow-v7/` is ready and unrun.
- Screen readers (accessible names were checked in the DOM only), audible sound, touch, real background tabs and timing targets.
- Firefox and Safari. Edge ran `check:text` only.
- Input methods (IME) beyond key presses and Playwright's text insertion.
- Measured and left for its own task: the cost of a key in POSTMAN (design review §5).
- The session context reported the model as Claude Opus 5.5; effort and credits were not visible.

Nothing was published, pushed or submitted.
