# Please Haunt Yourself

Please Haunt Yourself is a short Halloween mystery set in a fictional desktop. Follow Mara's unfinished letter through TERMINAL, ECHO, CANVAS, and POSTMAN.

Open [the game on GitHub Pages](https://gustavogarciapucp.github.io/please-haunt-yourself/haunt.html) in a desktop browser. The **Session finished** status confirms that the case is complete. For local setup, see [Open the current version locally](#open-the-current-version-locally).

The repository includes [Kiro specifications and verification](.kiro/specs/reproducible-build-v9/tasks.md) and a [development record](docs/kiro-usage.md). The [MIT license](LICENSE) covers the project code. The Pages build includes Vite's notices for its generated runtime helper.

**Independent build confirmation, November 10:** [Review34](docs/development/34_V9_Build_Repair_Independent_Verification.md) confirms typecheck, fresh build, 166 tests, and all 22 targeted browser outcomes. All seven rebuilt files match the previous v9 and the served game byte for byte. The build failure in the earlier review below is historical. The tested game and first-visit evidence remain the same.

**Build repaired, November 10 (Kiro IDE, [prompt10](PROMPT_KIRO_10_COMPILACION_REPRODUCIBLE_Y_CIERRE_V9.md)):**
- `npm.cmd run build` passes again on the current tree. The cause was the v9 test's source check, which read files through `node:fs` without declared Node types. It now reads them through Vite (`import.meta.glob` with `?raw`). No dependency or setting changed.
- The rebuilt `dist/` is byte-identical (SHA-256) to the served v9. A clean install of the declared dependencies, in an isolated folder, type-checks, builds and passes the 166 unit tests.
- `check:typing`, `check:active` and `check:case` pass on the rebuilt files.
- Details are in [reproducible-build-v9](.kiro/specs/reproducible-build-v9/tasks.md). The review 33 note below describes the tree before this repair.

**Independent v9 review, November 10:** the served game passed 166 unit tests, all 106 outcomes in 16 browser scripts and the 210-state PC visual route. A first-visit agent completed the four-app case without Hint. [Review33](docs/development/33_V9_Independent_QA_And_First_Visit.md) records both agent trials and the build error that prompt10 subsequently fixed.

**Kiroween 2026:** The project is prepared for Costume Contest. The submission deadline is December 4, 2026 at 17:00 Lima. See [the category and judging review](docs/development/31_Official_Category_And_Judging_Refresh.md) for the criteria.

A fictional Halloween desktop for Kiroween 2026. **The Unsent Letter:** Mara's unfinished session from 31 October 1987 keeps trying to deliver a picture and a note to "the next person at this desk". Four programs on HAUNT OS each do one part of that one job: TERMINAL, ECHO, CANVAS and POSTMAN. The job ends back in TERMINAL, when the matching receipt arrives.

**Independent v8 checkpoint, November 9:** Codex rebuilt v8 and confirmed 161 unit tests, all 93 outcomes in 14 browser scripts and the 210-state PC route with zero reported audit/page errors. An additional long-input route now wraps correctly and finishes; an isolated Edge route completes replacement, correction, Finish, reload, an unattached copy and Replay. [Review30](docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md) finds no new progression blocker on those routes. It records measured redundant rendering while typing and a minor active-window frame inconsistency after close. [Prompt09](PROMPT_KIRO_09_ESCRITURA_FLUIDA_SIN_CAMBIAR_EL_JUEGO.md) is prepared for that bounded polish, not implemented. Preserve the current game; first-visit understanding/enjoyment still need observation. Older reviews below describe their original builds.

**Current build: v9 (Kiro IDE, November 10, 2026).** It is the v8 case, flow and look. Under [prompt09](PROMPT_KIRO_09_ESCRITURA_FLUIDA_SIN_CAMBIAR_EL_JUEGO.md), after Codex's [review 30](docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md), it makes two bounded repairs:
- **A key typed in POSTMAN does POSTMAN's work only.**
  - What happens: the key updates the draft, what POSTMAN shows of it, and the save, at once. ECHO, CANVAS, TERMINAL and the desktop no longer rewrite or redraw themselves for it. POSTMAN no longer redraws its attached letter on every key.
  - How it was measured: the same 60 keys on both builds, in Chrome at 1366×768, with the four programs open.
    - DOM mutation records per key: 63 on v8, none on v9. Drawing calls per key: 766 on v8, none on v9.
    - The synchronous work of a key fell from 13.9–20.0 ms to 1.3–1.5 ms (medians over repeated runs).
  - Every key is still saved immediately. These numbers come from instruments, not from a person typing.
- **The active window looks active.** When the active window closes or minimizes, the window that becomes active shows the active frame at once. In v8 it kept the inactive frame until it was minimized and restored, and a minimized window kept the active class.
- **Nothing else changed:** no program, step, text limit, picture or saved field.

Specs, the accept/modify/reject positions on Codex's proposals and the verification record are in [.kiro/specs/fluid-typing-v9/](.kiro/specs/fluid-typing-v9/tasks.md). The before/after sheets of the active window are in `output/playwright/v9-compare/`, and the typing profiles are in `output/playwright/v9-profile-*.json`. As delivered, the v9 tree did not build; prompt10 repaired one test without changing the built files (note at the top). No person has played v9 yet; the [first-visit protocol](.kiro/specs/confirmation-flow-v7/first-visit-protocol.md) is ready.

**v8 (Kiro IDE, November 9, 2026)** was the v7 case, flow and look. Under [prompt08](PROMPT_KIRO_08_TEXTO_LIBRE_Y_CIERRE_VISUAL.md), after Codex's [review 29](docs/development/29_V7_Deep_QA_And_Long_Text_Layout.md), POSTMAN lays out the text the person types inside its panes:
- A subject or message at its limit (120 and 600 characters), even with no space at all, wraps inside the list and the reading pane. In v7 such text set the width of both. The text and the letter were cut off, and the list row's sender, time and badge went out of view.
- The letter keeps its shape and scales to the pane (at most 560 px, as before).
- The same holds in each of these views:
  - the subject alone, and the message alone;
  - Sent, Returned and the kept draft;
  - an incomplete letter at POSTMAN's minimum size, where Fix it in CANVAS now stays in view;
  - the notice that repeats an unknown 80-character address.
- Nothing typed is hidden or shortened. The list shows the whole subject; a list taller than its column scrolls and is a keyboard region. The field limits and the stored text are unchanged.
- The layout audit now also reports a picture cut off by its pane (`picture-clipped`).

v8's specs are in [.kiro/specs/free-text-v8/](.kiro/specs/free-text-v8/tasks.md), and its before/after sheets in `output/playwright/v8-compare/`.

**Independent v7 QA, November 9:** Codex confirmed 161 unit tests, 83 browser outcomes and the 210-state normal-content route. An additional isolated Edge route completed replacement/recovery, finish, reload, copy and replay. [Review29](docs/development/29_V7_Deep_QA_And_Long_Text_Layout.md) records a remaining valid-input layout problem with long unbroken subjects/messages in POSTMAN; stored data and completion remain intact. v8 (above) is the repair that prompt08 prepared.

**v7 (Kiro IDE, November 9, 2026)** was the v6 case, flow and look, with POSTMAN's send confirmations repaired under [prompt07](PROMPT_KIRO_07_CONFIRMACIONES_Y_CIERRE_QA.md), after Codex's [review 28](docs/development/28_V6_Independent_QA_And_Confirmation_Flow.md):
- Sending an incomplete letter while Guest Inbox holds the job's complete one now asks **one** question. It names what the letter lacks, the complete letter it would replace (by its delivery time), and that no receipt will finish the job until a complete letter arrives. In v6 two questions alternated forever and nothing was sent.
- An answer only applies to the send it was asked about. If the letter, the recipient, the attachment or the session changes before the answer, nothing is sent; POSTMAN closes the question and says why.
- "Attach the letter from CANVAS" can be unticked again (in v6 it stayed ticked and briefly wrote a string into the save).
- After an incomplete letter replaces a complete one, every surface says so: the letters are marked *Incomplete* and *Replaced*, TERMINAL writes one line and refuses the old receipt without pointing to the incomplete letter, and the phase help starts again at the question.

v7's specs are in [.kiro/specs/confirmation-flow-v7/](.kiro/specs/confirmation-flow-v7/tasks.md), and its before/after sheets in `output/playwright/v7-compare/`.

**v6 (Kiro IDE, November 9, 2026)** was the v5 case, flow and look, with the defects of Codex's [review 27](docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md) fixed under [prompt06](PROMPT_KIRO_06_PRECISION_VISUAL_Y_QA.md):
- Mara's unfinished note in TERMINAL's session window stays on its paper wherever it is drawn: ECHO live and paused, the kept capture, and the photograph of a letter. Its layout comes from the measured ink of the fonts in use.
- ECHO's LIVE / PAUSED status has its own bar above the picture, so the session window's drawn header (the recorded minute and the PID) is never covered.
- The session window is described as what it shows: an *Unfinished note* that stops at "PER—", never "No writing" or "empty".
- Found by the new checks and fixed: the capture negative and CANVAS's Below letter were sized with the wrong aspect (Below covered Compose); the paused ghost line covered the note; the first frames of Lift pushed the signature past the letter's edge.

v6's specs are in [.kiro/specs/visual-precision-v6/](.kiro/specs/visual-precision-v6/tasks.md), and its before/after sheets in `output/playwright/v6-compare/`. Codex's independent review of v6 ([review 28](docs/development/28_V6_Independent_QA_And_Confirmation_Flow.md)) confirmed 137 unit tests, 75 browser outcomes and the 210-state route, and found the confirmation loop that v7 fixes.

**v5 (Kiro IDE, November 8, 2026)** was the v4 case and look, with the defects of Codex's [review 26](docs/development/26_V4_Independent_Review_And_Experience_Priorities.md) fixed and the experience improved under [prompt05](PROMPT_KIRO_05_JUGABILIDAD_Y_CIERRE_VISIBLE.md):
- Mail retention survives a reload.
- Lost writing can be recovered after a reload.
- Every allowed window size is usable.
- The default guidance names the problem, not the fix.
- CANVAS has a real choice of what the photograph keeps.
- The hand lets go of the glass inside TERMINAL's receipt, where it can be seen.

v5's specs are in [.kiro/specs/playability-v5/](.kiro/specs/playability-v5/tasks.md); v4's are in [os-case-v4](.kiro/specs/os-case-v4/tasks.md). No person has played v4–v9 yet; see [Limits](#limits).

**Independent QA of v5, November 9:** Codex confirmed the build, 125 unit tests and 57 browser journeys, reran the 177-state route and exercised additional early-correct/out-of-order/recovery paths. [Review 27](docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md) recorded the canvas-note overflow, the overlaid ECHO header and the source-description mismatch that v6 fixes. As it noted, a clean HTML layout audit does not detect text painted outside its paper inside a canvas; v6 adds a check that does (`check:drawn`).

The root page `/` still opens the preserved paper-bridge prototype from November 5. It is not the haunted desktop.

## Open the current version locally

```powershell
npm.cmd ci                      # only for a fresh checkout; Node 22.13.1 was used
npm.cmd run build               # type-checks, then writes dist/
npm.cmd run preview -- --port 5174 --strictPort
```

Open **http://127.0.0.1:5174/haunt.html**. To be sure you are not looking at an older build:

1. Run the build again after any change. `vite preview` serves `dist/` exactly as built; it never rebuilds.
2. If port 5174 is busy, an older preview may still be running. Stop it or use another port, for example `npm.cmd run preview -- --port 5180 --strictPort`.
3. In the page, choose **HAUNT → About HAUNT OS**. It must say **HAUNT OS 4 · build v9** (HAUNT OS 4 is the fictional system; v9 is this build). The page source has `<meta name="haunt-build" content="v9">`, and the script is `assets/haunt-CgO5uN2S.js` for the build recorded in [tasks.md](.kiro/specs/fluid-typing-v9/tasks.md). If About says build v8, the browser or the preview is serving the previous build.
4. If the browser shows old files, reload without the cache (Ctrl+F5).
5. For a fresh first visit (boot line, callout, open job), use a private window, or choose **HAUNT → Start the case over…**. A v3 save is migrated automatically, and an update notice is shown once.

## The case

1. **TERMINAL** restores `last.session` (Mara, recorded 31 Oct 1987 23:59). A line appears that nobody typed: `MARA@1987> I'll finish in a minute.` Choose **Look inside**.
2. In the session, **Watch it try to finish**. The figure is made of its own output. It reads the note, writes "FOR THE NEXT PER—", the bell rings and the recorded minute starts again (`HELP ME.`). The job strip only says what is pending: "Find out what keeps bringing it back." Select the **Bell**: its inspector explains the cord and stays in view. **Muffle the bell** only silences it. **Stop the call** is the fix. The phase help gives a hint first, and the exact answer only on a second request.
3. **Let it finish this time.** The figure walks into the glass. Mist forms over the whole desktop, a hand presses against it at TERMINAL's edge, and the note is written in the mist behind the window. The recorded clock reads 1 Nov 1987, 00:00:00.
4. **ECHO** opens on TERMINAL's **Session window**: the recorded minute, with Mara's unfinished note on its paper. The bar above the picture says what ECHO is doing (LIVE, PAUSED, GLASS); a capture keeps only the picture. Choose **Desktop glass**. The monitor shows exactly the glass behind ECHO, so move ECHO over the hand. The chips say what is in the frame (Handprint, Figure, Writing). Wiping beside the palm, on the desktop or the monitor, uncovers the figure behind the glass. **Capture** keeps the full image; the photo frame can still be moved and resized afterwards.
5. **Use this capture** opens **CANVAS** on that capture.
   - **Lift the writing** moves Mara's words onto the paper, verbatim. Pointing at it outlines the lines it will move and where they go.
   - **The photograph keeps** offers three presets drawn from the letter's own capture: **Handprint** (all the mist), **Handprint and figure** (thin mist) or **Figure** (no mist). Pointing at one previews it in the letter; the arrow keys choose.
   - Clearing all the mist while the words are still in it loses them ("Not the words."). **Recover the writing** puts them back on the paper, even after a reload. Ctrl+Z works too, within the session.
   - The mist slider, **Reframe…**, the paper and the note position remain.
6. **Compose in POSTMAN** opens a draft with that letter attached. The addresses say who they are: "Mara · last signed in 31 Oct 1987" and "guest · signed in now". **Reply** to Mara's unsent 1987 message and **Send** comes back: "That went back to the sender." Send it to **guest@haunt**, the person at this desk now. It arrives in **Guest Inbox** with its receipt.
7. **Return to the request** brings TERMINAL forward on that receipt. The receipt shows **the glass, live**, where the hand is pressed, beside **your letter**. **Finish session** closes the job: the hand lets go in that view and on the desktop, and the card ends on "The glass is clear." and says what the photograph keeps. The session writes "You were the next person. You can close the window now." The prompt and every program keep working; the letter stays in Guest Inbox.

**Other behaviour:**

- One phase, the same everywhere (tray, job strip, help, About): Repeating → Call stopped · letter pending → Capture retained → Letter draft ready → Delivered · ready to finish → Session finished. The tray's phase button opens help for the current step: a question, then **Show me**, then **Tell me exactly**.
- The phase follows the real data. An incomplete letter can be sent if you confirm, but it never readies the job. Before the end, sending a second complete letter asks to **Replace** the first; the first stays exactly as it was sent, marked *Replaced*, and its receipt is refused. Sending an incomplete letter while a complete one is held asks one question that names both facts (**Send anyway and replace**); if you accept, the job falls back until a complete letter arrives, and fixing the letter and sending it again needs no further question. Each answer applies only to the send it was asked about. After the end, a letter to guest is a *Copy*, and the job keeps the letter it accepted (*Accepted*). The mail history keeps the 12 latest deliveries per run, but never drops the one the job relies on.
- **What you type in POSTMAN** (To 80, Subject 120, Message 600 characters) is shown whole wherever it appears: the list, the reading pane, Sent, Returned, drafts and notices. Long text wraps inside its pane, even a word with no spaces; the message keeps its line breaks, and a pane or list that gets taller than its window scrolls.
- **Desktop files** (`last.job`, `capture-N`, `letter`, `receipt`) open their own objects with a double-click or Enter.
- **Windows:** titlebar drag (a maximized window restores under the pointer), resizing from any edge or corner, maximize/restore (button or double-click), minimize and close. The window icon opens a menu with keyboard **Move** and **Size**. **HAUNT → Arrange windows** restores the default layout. Escape closes menus and cancels moves; it never closes a window.
- **Keyboard:** every step works without a pointer, and the whole case can be played with Tab, Shift+Tab, Enter, the arrows and typing (`check:keys`).
  - ECHO's sources and CANVAS's presets are native radios (arrow keys).
  - The wipe cursor on ECHO's monitor moves with the arrows and wipes with Space held. A photo frame moves with the arrows and resizes with + and −.
  - CANVAS has its own Undo and Redo (Ctrl+Z, Ctrl+Y). In POSTMAN, Ctrl+Enter sends.
  - A panel that does not fit its window scrolls, and Tab reaches it.
- **Small windows:** every window works at its minimum size (TERMINAL 480×420, ECHO 640×480, CANVAS 680×500, POSTMAN 640×460). The layout tightens, and a panel scrolls where it must.
- **TERMINAL commands:** `help`, `ps`, `jobs`, `inspect last.session`, `kill [-TERM|-KILL] <PID>` (current run only), `echo`, `ask status`, `ask who was here`, `cat last.job`, `finish`, `open echo|canvas|postman`, `clear`. Nothing typed reaches the computer.
- **Saving:** the case lives in `haunt.case.v4` in this browser, and a reload continues it. If the browser keeps nothing, the tray shows **Session only** and the case still finishes in that tab. **Start the case over…** begins a new run; earlier letters move to POSTMAN's Archive and cannot finish it. Window positions are not saved. Sound is off until the tray's bell button turns it on.

## Verification

```powershell
npm.cmd run build          # tsc --noEmit, then Vite; check that it exits 0 (the browser checks read dist/ and cannot see a failed build)
npm.cmd test
npm.cmd run check:windows
npm.cmd run check:drag
npm.cmd run check:halloween
npm.cmd run check:echo
npm.cmd run check:letter
npm.cmd run check:case
npm.cmd run check:console
npm.cmd run check:recovery
npm.cmd run check:guide
npm.cmd run check:keys     # the whole case with natural keys only; counts key presses
npm.cmd run check:drawn    # text drawn into canvases: on its paper, uncovered; DPR 1, 1.25, 1.5, 2; simulated fallback fonts
npm.cmd run check:paths    # early correct action, out-of-order programs, Force, pause, replacement, recovery, recipients
npm.cmd run check:confirm  # POSTMAN's questions: combinations, cancels, changes before the answer, keys, copies, minimum size
npm.cmd run check:text     # POSTMAN's free text at its limits: three sizes, normal/maximized/minimum, views, keys, reload, controls
npm.cmd run check:typing   # typing in POSTMAN: editing, paste, Undo, Send at once, reload; no other window works; questions, storage, A/B
npm.cmd run check:active   # the active frame after close/minimize (button, taskbar, window menu), the last window, order, focus
npm.cmd run review:v6      # screenshots + DOM and drawn-text audits of 70 states at each of 1366×768, 1440×900, 1920×1080
node scripts/v9-typing-profile.mjs   # review 30's profile, the same keys and instruments on any build (HAUNT_BASE_URL, HAUNT_PROFILE_LABEL)
node scripts/v9-active-baseline.mjs  # the active-window probe, step by step (HAUNT_PROFILE_LABEL names the output)
node scripts/v9-compare.mjs          # before/after sheets of the active window, in output/playwright/v9-compare/
```

The browser checks drive the served build with Chrome through Playwright, one at a time. Run them after the build has finished, never during it. They write reports and screenshots to `output/playwright/`. The target is `http://127.0.0.1:5174` unless `HAUNT_BASE_URL` says otherwise; `HAUNT_CPU_THROTTLE=4` slows the page's CPU, and `HAUNT_CHANNEL=msedge` runs a check in the installed Edge instead of Chrome. `review:v4` and `node scripts/capture-v4-route.mjs` are kept from v4, `review:v5` and `scripts/v5-baseline.mjs` from v5, `scripts/v6-baseline.mjs` and `v6-compare.mjs` from v6, `scripts/v7-baseline.mjs` and `v7-compare.mjs` from v7, and `scripts/v8-baseline.mjs` and `v8-compare.mjs` from v8. To compare v8 and v9 under the same conditions, the v8 build was kept in `output/playwright/v9-before-dist/` and served with `npx.cmd vite preview --outDir output/playwright/v9-before-dist --port 5175 --strictPort`. No video encoder is installed.

**Build repair results (prompt10, November 10):**

- **Before:** `npm.cmd run typecheck` and `npm.cmd run build` exited 1 on the delivered v9 tree, with review 33's five errors, while `npm.cmd test` passed. `dist/` was still the build of 14:00:09, made before the new test existed.
- **After:** both exit 0. The build writes the same seven files, byte for byte (`haunt-CgO5uN2S.js` / `haunt-9asRCWsn.css`), and 166 unit tests pass.
- **Clean install:** `npm.cmd ci` from the lockfile in an isolated temporary folder (no `@types/node`) type-checks, builds the same bytes and passes the 166 tests. There, the old test fails the type-check and the repaired one fails if a skipping view reads the mail draft.
- **Browser:** `check:typing` (8), `check:active` (5) and `check:case` (9) pass on the rebuilt files, with no page errors.

**v9 results (November 10):**

- 166 unit tests pass (161 before). They include a property test over 250 random sequences of edits, sends, questions, the end and storage failures, and its negative control.
- 16 browser checks pass with 106 recorded outcomes and no page errors, including the new `check:typing` (8) and `check:active` (5). Both new checks fail on the v8 build at the defect they target.
- At 4× CPU throttle, `check:letter`, `check:case`, `check:keys`, `check:paths`, `check:confirm`, `check:text`, `check:typing` and `check:active` also pass.
- `check:typing`, `check:active` and `check:text` also pass in the installed Edge 157.
- `review:v6`, rerun on the v9 build: 210 states, 0 problems.
- **Review 30's profile, the same 60 keys on both builds,** alternating between v8 (kept in `output/playwright/v9-before-dist/`) and v9:
  - DOM mutation records per key fell from 63 to 0, and drawing calls per key from 766 to 0.
  - The synchronous work of a key fell from 13.9–20.0 ms to 1.3–1.5 ms (median).
  - Paced at one key every 120 ms, Chrome's time from a key to the next frame fell from 48 ms to 16 ms, the same as a plain text field.
  - Every key is still saved immediately on both builds.
- **The active-window probe:** the frame disagreed with the active window at 5 of 13 steps on v8, at none on v9. Focus is identical at all 13 steps.

The full table, and what the screenshots showed, are in [tasks.md](.kiro/specs/fluid-typing-v9/tasks.md).

**v8 results (November 9):**

- 161 unit tests pass (unchanged: the repair is CSS, one keyboard region and checks).
- 14 browser checks pass with 93 recorded outcomes and no page errors, including the new `check:text` (10 outcomes, 35 audited states).
- At 4× CPU throttle, `check:letter`, `check:case`, `check:keys`, `check:paths`, `check:confirm` and `check:text` also pass. `check:text` first timed out while typing 601 keys under throttle; that was Playwright's 30 s default, not an assertion. With a longer typing timeout it passed.
- `check:text` also passes in the installed Edge 157.
- `review:v6`, rerun on the v8 build with the new `picture-clipped` rule: 210 states, 0 problems.
- Review 29's probe:
  - **Before:** on v7, each long-text state had 6–23 DOM reports, and the list or the reading pane scrolled sideways (the pane up to 4209 px; `output/playwright/v8-baseline.json`).
  - **After:** on v8, 0 reports and no sideways scroll in every state (`v8-after.json`), with the stored text identical.
  - The before/after sheets are in `output/playwright/v8-compare/`.

Details, including what the screenshots showed and what was changed because of them, are in [tasks.md](.kiro/specs/free-text-v8/tasks.md).

**v7 results (November 9):**

- 161 unit tests pass, including a property-based test over 300 random sequences of edits, sends and answers.
- 13 browser checks pass with 83 recorded outcomes and no page errors, including the new `check:confirm` (8). The five that send mail or depend on timing (`check:letter`, `check:case`, `check:keys`, `check:paths`, `check:confirm`) also pass at 4× CPU throttle.
- `review:v6`, rerun on the v7 build: 210 states, each with the DOM layout audit and the drawn-text audit: 0 problems.
- Review 28's probe: on v6 every question accepted seven times in a row still did not send (`output/playwright/v7-baseline.json`); on v7 one acceptance delivers once (`v7-after.json`). The before/after sheets are in `output/playwright/v7-compare/`.

Details, including what the screenshots showed and what was changed because of them, are in [tasks.md](.kiro/specs/confirmation-flow-v7/tasks.md).

**v6 results (November 9):**

- 137 unit tests pass.
- 12 browser checks pass with 75 recorded outcomes and no page errors, including the new `check:drawn` (12) and `check:paths` (6). All 12 also pass at 4× CPU throttle.
- `review:v6`: 210 states (70 at each size), each with the DOM layout audit and the drawn-text audit: 0 problems. The same route at 1440×900 with DPR 2: 0 problems.
- Review 27's probe: 172 audit problems on v5 (`output/playwright/v6-baseline.json`), 0 on v6 (`v6-after.json`), with the same states and file names; the before/after sheets are in `output/playwright/v6-compare/`.

Details, including what the screenshots showed and what was changed because of them, are in [tasks.md](.kiro/specs/visual-precision-v6/tasks.md). The drawn-text audit replays each canvas text call through Chrome's own rasterizer and compares its ink with the paper found in the canvas pixels; it does not read the app's layout numbers. Fallback fonts are simulated by rewriting canvas font lists, not by uninstalling fonts.

**v5 results (November 8):**

- 125 unit tests pass.
- 10 browser checks pass with 57 journeys and no page errors.
- Seven of those checks also pass at 4× CPU throttle.
- The layout audit reports no problems in any of the 177 reviewed states (59 at each size). They include each app at its default, maximized, minimum and corner placements, every TERMINAL inspector page and every confirmation.
- Review 26's probes, rerun: before in `output/playwright/v5-baseline.json` and `v5-baseline/`, after in `v5-after.json` and `v5-after/`. Every finding is fixed.

Details, including what the screenshots showed and how it was fixed, are in [tasks.md](.kiro/specs/playability-v5/tasks.md). `test:browser` is still the historical paper-bridge suite.

## Limits

- No human playtest of v4–v9. A [first-visit protocol](.kiro/specs/confirmation-flow-v7/first-visit-protocol.md) is ready; nobody was available to run it. Whether a first visit can say why the minute came back, what their photograph kept and who received the letter, whether the CANVAS choice feels like a decision, and whether people read POSTMAN's four-sentence question before answering are open questions.
- Not verified: screen readers, audible sound (checks use a recording AudioContext), touch, real background tabs, input methods (IME), Firefox and Safari. Edge ran `check:text`, `check:typing` and `check:active` only; every other check ran in Chrome. The PC sizes are primary; phones get full-screen windows only. Canvas text was checked at DPR 1, 1.25, 1.5 and 2 and with simulated fallback fonts, not on systems that lack the fonts.
- A very long subject is shown whole. A 120-character subject with no spaces takes 8 lines in POSTMAN's list and 6 in the reading pane's heading (10 at POSTMAN's minimum); with a 600-character message too, the letter starts below the fold. That is the cost of hiding nothing; the case's own subject takes one line.
- **What a key typed in POSTMAN still costs.** About 1.4 ms of the page's own work on the development machine: the median, instrumented in headless Chrome. Under Chrome's 4× CPU simulation it is 6–8 ms.
  - Most of it is the save, which is still written on every key: about 0.9 ms, mainly encoding the glass's fog grid.
  - It was not reduced further. A cached encoding would have to be invalidated by every in-place change of the grid ([design review §2](.kiro/specs/fluid-typing-v9/design-review.md)).
  - How a person perceives typing speed, on v8 or v9, was not observed.
- At ECHO's minimum size the session note's signature is inside its paper but about 5 px tall.
- Timing targets (6–9 minutes first use, about 110 s for a known route, about 2:50 of video) are editorial goals, not measurements. The scripted route took 52 s of automated input; that is not a play time.
- The case runs in the browser. The mail, camera, and operating system are fictional.

## History and attribution

- **Story and direction (Codex):** [The Unsent Letter contract](docs/development/23_The_Unsent_Letter_Narrative_Contract.md), [review 24](docs/development/24_V3_Critical_Review_And_Real_OS_Direction.md), [review 25](docs/development/25_Consistency_Across_The_Four_Programs.md), [review 26](docs/development/26_V4_Independent_Review_And_Experience_Priorities.md), [review 27](docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md), [review 28](docs/development/28_V6_Independent_QA_And_Confirmation_Flow.md), [review 29](docs/development/29_V7_Deep_QA_And_Long_Text_Layout.md), [review 30](docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md), the event and provenance reviews [31](docs/development/31_Official_Category_And_Judging_Refresh.md) and [32](docs/development/32_Development_Dates_And_Submission_Provenance.md), the v9 review and agent first visits [33](docs/development/33_V9_Independent_QA_And_First_Visit.md), and the prompts [PROMPT_KIRO_03](PROMPT_KIRO_03_PC_Y_JUGABILIDAD.md), [PROMPT_KIRO_04](PROMPT_KIRO_04_SO_REAL_Y_CASO_COMPLETO.md), [PROMPT_KIRO_05](PROMPT_KIRO_05_JUGABILIDAD_Y_CIERRE_VISIBLE.md), [PROMPT_KIRO_06](PROMPT_KIRO_06_PRECISION_VISUAL_Y_QA.md), [PROMPT_KIRO_07](PROMPT_KIRO_07_CONFIRMACIONES_Y_CIERRE_QA.md), [PROMPT_KIRO_08](PROMPT_KIRO_08_TEXTO_LIBRE_Y_CIERRE_VISUAL.md), [PROMPT_KIRO_09](PROMPT_KIRO_09_ESCRITURA_FLUIDA_SIN_CAMBIAR_EL_JUEGO.md) and [PROMPT_KIRO_10](PROMPT_KIRO_10_COMPILACION_REPRODUCIBLE_Y_CIERRE_V9.md).
- **Build repair (Kiro IDE, November 10):** after Codex's [review 33](docs/development/33_V9_Independent_QA_And_First_Visit.md) found the failing build and [prompt10](PROMPT_KIRO_10_COMPILACION_REPRODUCIBLE_Y_CIERRE_V9.md) asked for a bounded repair, the reproduction, the cause, the choice between alternatives, the repaired test and its verification ([reproducible-build-v9](.kiro/specs/reproducible-build-v9/design.md)).
- **v9 (Kiro IDE, November 10):** the positions on Codex's [review 30](docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md) and prompt09 in [fluid-typing-v9](.kiro/specs/fluid-typing-v9/design-review.md); the measurements (the typing profile, the sampling profiles and the active-window probe), the change kinds of the case store, POSTMAN's keyed rendering, the active-frame repair, `check:typing`, `check:active` and the property test.
- **v8 (Kiro IDE, November 9):** the positions on Codex's [review 29](docs/development/29_V7_Deep_QA_And_Long_Text_Layout.md) and prompt08 in [free-text-v8](.kiro/specs/free-text-v8/design-review.md), the layout repair, the `picture-clipped` audit rule and `check:text`.
- **v7 (Kiro IDE, November 9):** the positions on Codex's [review 28](docs/development/28_V6_Independent_QA_And_Confirmation_Flow.md) and prompt07 in [confirmation-flow-v7](.kiro/specs/confirmation-flow-v7/design-review.md), the confirmation policy, the implementation and the checks.
- **v6 (Kiro IDE, November 9):** the positions on Codex's [review 27](docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md) and prompt06 in [visual-precision-v6](.kiro/specs/visual-precision-v6/design-review.md), the drawn-text audit, the implementation and the checks.
- **v5 (Kiro IDE, November 8):** the positions on Codex's [review 26](docs/development/26_V4_Independent_Review_And_Experience_Priorities.md) and [prompt05](PROMPT_KIRO_05_JUGABILIDAD_Y_CIERRE_VISIBLE.md) in [playability-v5](.kiro/specs/playability-v5/design-review.md), and the implementation and checks.
- **v4 (Kiro IDE, November 7):** the design decisions in [os-case-v4](.kiro/specs/os-case-v4/), including what was accepted, modified or rejected from Codex's proposals, and the implementation and checks.
- **v3 (Kiro IDE, November 6):** the TERMINAL/ECHO checkpoint and the desktop glass ([pc-agency-v3](.kiro/specs/pc-agency-v3/tasks.md)). **v2 and earlier:** [terminal-experience-v2](.kiro/specs/terminal-experience-v2/), [task 16](docs/development/16_Terminal_Application_Recovery.md), [the window foundation](docs/development/2026-11-06-window-foundation.md) and [the ECHO rehearsal](docs/development/2026-11-06-echo-rehearsal.md). Earlier design documents in `docs/diseno/` are historical.
- The [tool usage record](docs/kiro-usage.md) says which tool produced what. The project folder was renamed from `LaVentanaEquivocada` on November 6 at the participant's request; it is the same Git history.
