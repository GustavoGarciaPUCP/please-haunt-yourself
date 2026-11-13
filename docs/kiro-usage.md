# How Kiro is being used

Factual development record, November 5, 2026. This is a work log, not the final submission write-up. Planned work, failed attempts and completed contributions are distinguished below.

## Starting material and tool roles

The V3/R1 concept, Spanish design references and initial handoff existed before the first Kiro task. Their original planning dates are retained. They were developed through discussion and review in Codex, not by Kiro.

Codex coordinates and reviews local work. The participant's authenticated Kiro CLI 3.1.0 operates in this project through its native interface. No desktop automation is used. No authentication tokens are extracted or routed to a third-party model harness.

The brief names below refer to internal working material in the repository history. The current tree includes the implemented Kiro specifications and verification records.

## Executed work

**November 10, Kiro IDE task: reproducible build, keeping v9 (prompt10).** The participant ran `Kiro brief 10` in Kiro IDE after Codex's review 33 found that `npm.cmd run build` failed on the delivered v9 tree. The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Reproduced it before changing anything.**
  - It kept the served `dist/` and its SHA-256 list.
  - `npm.cmd run typecheck` and `npm.cmd run build` exited 1 with review 33's five errors, while `npm.cmd test` passed. The failed build left `dist/` as it was.
- **Found the cause, and why the v9 record was wrong.**
  - The cause: the v9 test imported `node:fs`. Node's types are not declared or installed; `@types/node` is only an optional peer of vite/vitest in the lockfile. TypeScript 7.0.2 here also does not include installed `@types` by itself.
  - The record: file times show the v9 `dist/` was written at 14:00:09 and the test created at 14:15:23. No build succeeded after that. The v9 report's "a rebuild gives the same hash" (written by the Kiro agent in that run) compared files the failed build had not written, and its exit status was not checked. No log of that command exists.
- **Compared five alternatives** and repaired one test (`tests/fluid-typing-v9.test.ts`, 7 lines added, 4 removed). It now reads `src/haunt/*.ts` through Vite's `import.meta.glob` with `?raw`, and has a positive control.
  - Declaring `@types/node` was rejected: it also needs `"types": ["node"]` in the shared tsconfig, which would let Node's globals type-check in the browser source.
  - No dependency, lockfile, tsconfig, script or app source changed.
- **Verified from the same tree.**
  - Type-check and build exit 0, and 166 unit tests pass. The rebuilt `dist/` is byte-identical to the served v9.
  - A scratch probe showed the glob reads the same 32 files and text as `node:fs`.
  - A clean `npm ci` in an isolated temporary folder type-checks, builds the same bytes and passes 166 tests. There, the old test fails `tsc`, and a negative control fails the repaired check. The folder was deleted afterwards.
  - `check:typing` (8), `check:active` (5) and `check:case` (9) pass.
- **Records:** `.kiro/specs/reproducible-build-v9/` (requirements, design with positions on Codex's proposals, tasks), a correction in `.kiro/specs/fluid-typing-v9/tasks.md`, README, AGENTS.md, the steering file and PITCH.md's readiness line.

Codex authored review 33 (including both agent first-visit trials) and the prompt; the Kiro agent reproduced, diagnosed and repaired the build and verified it. Nothing was committed, pushed, published or submitted, and no licence was chosen.

**November 10, Kiro IDE task v9 (fluid typing and the active window, prompt09).** The participant ran `Kiro brief 09` in Kiro IDE, including its sections 8 (official context) and 9 (dates and provenance). The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Before changing code.**
  - **Kept v8 for comparison.** It copied the v8 build aside and served it on its own port, so both builds could be measured alternately under the same conditions.
  - **Wrote the typing profile** (`scripts/v9-typing-profile.mjs`). It types the same 60 keys after the real route on any build, and records the synchronous work of each input event, DOM mutation records and canvas drawing calls by window, and save writes. It also uses Chrome's Event Timing, a paced condition, a 4× CPU simulation and a light instrument that shows the instruments' own cost.
  - **Ran it on v8, and reproduced Codex's numbers.** The mutation counts per app are exact. It found that review 30's drawing counts covered three canvas methods, against 766 drawing calls per key in all, and that after the end TERMINAL also redraws its receipt's glass on every key.
  - **Located the time** with Chrome's sampling profiler on an unminified build of the same source: ECHO 44 %, POSTMAN 34 %, CANVAS 14 %, the save 5 %.
  - **Probed the active window step by step:** 5 of 13 steps were inconsistent on v8, including a minimized window that kept the active class.
  - **Wrote `.kiro/specs/fluid-typing-v9/`:** requirements, design (with six alternatives compared), a design review with accept/modify/reject positions on Codex's proposals, and tasks.
- **Code.**
  - `case-store.ts`: `CaseChange`. A mail-draft change is announced as `'mail-draft'`, everything else as `'case'`. The save is still written synchronously on every change.
  - `echo-view.ts`, `canvas-view.ts`, `terminal-view.ts`, `desktop-shell.ts`: one filter each, skipping `'mail-draft'`.
  - `postman-view.ts`: keyed letter canvases (the letter's identity and backing size), keyed mailbox and message lists, writes guarded by equality, and one copy of the deliveries per render.
  - `window-manager.ts`: `syncActive()` from raise, close and minimize, and a `setSubtitle` guard.
  - `haunt.html`: build v9.
- **Checks.**
  - Unit: `tests/fluid-typing-v9.test.ts`, 5 tests. They include a property test over 250 random sequences with storage failures and a negative control, and a source check that the views skipping `'mail-draft'` never read the mail draft.
  - Browser: the new `check:typing` and `check:active`, both run on v8 too, where each fails at the defect it targets. Also `scripts/v9-active-baseline.mjs`, `scripts/v9-compare.mjs`, and `check:guide`'s build identifier.
- **Self-review after use.** It inspected the before/after sheets and the closing frames.
  - **Corrected:** its own typing check counted the end of CANVAS's Lift animation as typing work, in the first full-suite run. The check now waits for a quiet page and also counts work during the keys' own input events.
  - **Added after use:** Subject and To typing still updating the Drafts row and the guest suggestion.

Results on the final build (`haunt-CgO5uN2S.js` / `haunt-9asRCWsn.css`):
- **Per key in Message,** four programs open, 60 keys:
  - DOM mutation records: 63 on v8, 0 on v9. Drawing calls: 766 on v8, 0 on v9.
  - Synchronous work (median over repeated runs): 13.9–20.0 ms on v8, 1.3–1.5 ms on v9.
  - At 4× CPU (simulation): 82–99 ms on v8, 6.0–6.6 ms on v9.
  - Every key still saved: 60 writes for 60 keys on both builds.
- **The active frame:** consistent at all 13 probe steps on v9, with focus identical to v8 at every step.
- **Tests and checks.**
  - 166 unit tests.
  - 106 outcomes in 16 browser checks with no page errors.
  - `review:v6`: 0 problems in 210 states.
  - `check:typing`, `check:active` and `check:text` also pass in Edge 157.0.4341.42.
  - At 4× CPU, the eight checks that send mail, depend on timing or are new pass: 56 outcomes.

The record is in `.kiro/specs/fluid-typing-v9/tasks.md`. These are automated checks and instrumented measurements, not human play or a person's perception of speed. Codex authored review 30, reviews 31–32 and the prompt; the Kiro agent measured, chose and built the changes and checks above.

Provenance (brief §9): a read-only check found 20 reachable commits, not shallow, the earliest 5 November 2026 20:17 Lima, as in review 32. The v3–v9 work is uncommitted in the working tree. No history, timestamp, dependency or licence was changed or chosen, and no outside code or asset was incorporated. Nothing was published, pushed or submitted.

**November 9, Kiro IDE task v8 (POSTMAN's free text, prompt08).** The participant ran `Kiro brief 08` in Kiro IDE. The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Before changing code.**
  - It reproduced review 29's defect on the v7 build with real input (`scripts/v8-baseline.mjs` → `output/playwright/v8-baseline.json`). It entered the fields' own limits (Subject 120 × W, Message `abcdef` × 100, To 80) at three PC sizes, with POSTMAN as it opens, maximized and at its minimum, in Guest Inbox, Sent, Returned and the kept draft, and after Finish session and a reload.
  - That probe also found four related cases: the message alone widening the reading pane; the notice for an unknown 80-character address pushing the fields outside the window; Fix it in CANVAS out of view at the minimum; and a cut-off letter that neither audit reported.
  - It wrote `.kiro/specs/free-text-v8/`: requirements, design, a design review with its accept/modify/reject positions on Codex's proposals, and tasks.
- **Code.**
  - `desktop.css`: bounded grid tracks and `overflow-wrap: anywhere` for typed text in POSTMAN (the cause was implicit tracks, fit-content items and the base button rule's centring).
  - `postman-view.ts`: the message list becomes a keyboard region when it is taller than its column.
  - `haunt.html`: build v8.
  - A two-line list summary was tried and dropped after the audit reported it, rather than adding an audit exemption.
- **Checks.**
  - `scripts/layout-audit.mjs`: the new `picture-clipped` rule.
  - `scripts/haunt-helpers.mjs`: `HAUNT_CHANNEL` (Edge).
  - The new `check:text` (`scripts/check-free-text.mjs`), with negative controls; `scripts/v8-compare.mjs` for the before/after sheets; `check:guide`'s build identifier.
  - Scratch measurements of the alternatives (`output/playwright/v8-experiments.mjs`, `v8-clamp-experiment.mjs`).
- **Visual review.** It inspected the nine before/after sheets. It corrected three of its own findings that the images showed were overstated, and made `check:text` type its main case key by key instead of calling it "typed" while using `fill`.
- **Recorded, not changed.** Typing key by key exposed the cost of a key in POSTMAN: about 31 ms against 3 ms in a plain field, and 114 ms at 4× throttle. Most of it is the other programs rendering again for each draft change. It is recorded in the design review as its own future task.

Results on the final build (`haunt-CjGjZ4b_.js` / `haunt-9asRCWsn.css`):
- 161 unit tests.
- 93 outcomes in 14 browser checks with no page errors.
- Six checks that send mail or depend on timing also pass at 4× CPU throttle: letter, case, keys, paths, confirm and text. Text passed after its typing timeout was raised from Playwright's 30 s default.
- `check:text` also passes in Edge 157.0.4341.42.
- `review:v6`: 0 problems in 210 states, with the new rule.
- The probe went from 6–23 DOM reports per long-text state on v7 to 0 on v8, with the stored text identical.

The record is in `.kiro/specs/free-text-v8/tasks.md`. These are automated checks, not human play. Codex authored review 29 and the prompt; the Kiro agent chose and built the repair and checks above. Nothing was published, pushed or submitted.

**November 9, Kiro IDE task v7 (POSTMAN's confirmations and QA closure, prompt07).** The participant ran `Kiro brief 07` in Kiro IDE. The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Before changing code.**
  - It reproduced review 28's loop on the v6 build with real pointer and keyboard input (`scripts/v7-baseline.mjs` → `output/playwright/v7-baseline.json`) at three PC sizes, by natural keys and with a session-window letter, together with the cancel/reload/finish route, copies after the end and content changes between a question and its answer. That probe also found the loop in the other order, questions that outlive the letter they describe, and an attachment checkbox that could not be unticked.
  - It measured the session note's drawn text at ECHO's minimum and where the same facts appear as text (no change made).
  - It wrote `.kiro/specs/confirmation-flow-v7/`: requirements, design, a design review with its accept/modify/reject positions on Codex's proposals, tasks and a first-visit protocol (not run).
- **Code.**
  - `mail-model.ts`: `attempt()` and its key, `questionFor`, `questionWords`, a key-carrying `send`, the `changed` result and a boolean attachment flag.
  - `case-store.ts`: `send({ confirm })`, `sendAttempt()`, and TERMINAL's refusal of a replaced receipt depending on the newer letter.
  - `postman-view.ts`: one question state, the combined question, stale questions closed with a reason, the checkbox listener, the status lines.
  - `haunting-presentation.ts`, `terminal-view.ts`, `desktop-shell.ts`: the fall-back line, the phase help reset and the stale toast.
  - The build identifier moved to v7.
- **Checks.**
  - Unit: `tests/confirmation-flow-v7.test.ts`, 24 tests, including a property-based test (fast-check, already a dev dependency); three earlier tests now answer with the question's key.
  - Browser: the new `check:confirm`, the probe rerun as "after", and `v7-compare.mjs` for the before/after sheets; `check:guide`'s build identifier.
- **Visual review.** It inspected the questions at three PC sizes and at POSTMAN's minimum and the state after an answer. It fixed what it saw: the combined question was shortened so its buttons stay in view at the minimum, a stale toast is removed, and the "already accepted" line is hidden while the copy question is open. It also made its own property test non-vacuous.

Results on the final build (`haunt-U_tkFtyC.js`): 161 unit tests; 83 outcomes in 13 browser checks with no page errors; `review:v6` 0 problems in 210 states; the probe went from seven acceptances without a delivery on v6 to one delivery on one acceptance on v7; five checks that send mail or depend on timing also pass at 4× CPU throttle. The record is in `.kiro/specs/confirmation-flow-v7/tasks.md`. These are automated checks, not human play. Codex authored review 28 and the prompt; the Kiro agent chose and built the mechanisms above. Nothing was published, pushed or submitted.

**November 9, Kiro IDE task v6 (visual precision and QA, prompt06).** The participant ran `Kiro brief 06` in Kiro IDE. The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Before changing code.**
  - It reproduced review 27's findings on the v5 build with real pointer and keyboard input (`scripts/v6-baseline.mjs` → `output/playwright/v6-baseline.json`). For that it wrote an audit of text drawn into canvases (`scripts/drawn-text-audit.mjs`: each text call replayed through Chrome's rasterizer and compared with the paper found in the canvas pixels) and a DOM rule for covered text (`layout-audit.mjs`). The probe also found the paused ghost line over the note, a label and a corner mark on the drawn header, and two images sized with the wrong aspect, one of which blocked CANVAS's Compose.
  - It wrote `.kiro/specs/visual-precision-v6/`: requirements, design, a design review with its accept/modify/reject positions on Codex's proposals, and tasks.
- **Code.**
  - `glass-render.ts`: measured-ink text (`measureInk`, `drawInk`) and `layoutNote` for the session window's note; `SESSION_NOTE` and `SESSION_QUIET`; the letter's Lift drift bounded by the measured room under the words.
  - `echo-view.ts` and `desktop.css`: the monitor's status bar and viewport, the ghost line in the quiet zone, corner marks for the glass only, and the session source's wording.
  - `frame-editor.ts` and `canvas-view.ts`: images sized by their real aspect; CANVAS's words for session, old and bare-glass letters.
  - `letter-model.ts`, `case-store.ts`, `postman-view.ts`, `terminal-view.ts`: incompleteness reasons in the words of each letter's own source.
  - The build identifier moved to v6.
- **Checks.**
  - Unit: `tests/visual-precision-v6.test.ts`, 12 tests.
  - Browser: the new `check:drawn` and `check:paths`, `review:v6` (70 states at each PC size, each with the DOM and drawn-text audits) and `v6-compare.mjs` for the before/after sheets. Four existing checks got updated expectations, each with its reason in tasks.md.
- **Visual review.** It inspected the before/after sheets and the review screenshots. It fixed what its own checks found on the way: the ghost line's box cutting a letter, the first frames of Lift, and three audit false positives (dialogs, an inert canvas, sub-pixel clip edges).

Results on the final build (`haunt-Db2YorXu.js`): 137 unit tests; 75 outcomes in 12 browser checks with no page errors, all 12 also passing at 4× CPU throttle; `review:v6` 0 problems in 210 states at three PC sizes and in 70 more at 1440×900 DPR 2; review 27's probe 172 audit problems on v5 and 0 on v6. The record is in `.kiro/specs/visual-precision-v6/tasks.md`. These are automated checks, not human play. Codex authored review 27 and the prompt; the Kiro agent chose and built the mechanisms above. Nothing was published, pushed or submitted.

**November 8, Kiro IDE task v5 (playability and a visible ending, prompt05).** The participant ran `Kiro brief 05` in Kiro IDE. The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Before changing code.**
  - It reproduced review 26's findings on the v4 build with real pointer and keyboard input (`scripts/v5-baseline.mjs` → `output/playwright/v5-baseline.json`). These were the eviction before and after Finish session, lost writing after a reload, the minimum-size layouts, the default guidance and the hidden release. It also recorded the natural Tab order.
  - It wrote `.kiro/specs/playability-v5/`: requirements, design, a design review with its accept/modify/reject positions on Codex's proposals, and tasks.
- **Models.**
  - `mail-model.ts`: protected eviction, acceptance and standing, with copies after the end.
  - `letter-model.ts`: `recoverWriting`, `keepPreview`, `KEEP_LEVELS` and `keepsPhrase`.
  - `glass-model.ts`: `handRegion`.
  - `case-store.ts`: acceptance on Finish session and on load.
  - Copy in `case-phase.ts` and `legacy-session.ts`.
- **Views.**
  - CANVAS rewritten: Recover the writing; "The photograph keeps" presets with previews; Lift's outline of the captured lines; session-capture handling.
  - TERMINAL's receipt: the live glass and the release; transcript pinning on resize.
  - POSTMAN: standing badges and copy wording.
  - The new `scroll-region.ts`, size-container layouts for TERMINAL and ECHO in `desktop.css`, and `drawLetter` options.
  - The build identifier moved to v5.
- **Checks.**
  - Unit: `tests/playability-v5.test.ts`, 12 tests.
  - Browser: new journeys in `check:letter` and `check:case`, the new `check:keys` (natural keys, no programmatic focus) and `review:v5` (177 states).
  - The audit refinement in `layout-audit.mjs`.
  - Changed v4 expectations, each with its reason in tasks.md: two unit tests (the Undo promise, "next: stop the call") and four browser assertions (two CANVAS wordings, and the build identifier in the meta and About).
- **Visual review.** It inspected screenshots at three PC sizes and the minimum sizes, wrote a second self-critique and fixed what it found (listed in tasks.md).

Results on the final build: 125 unit tests; 57 browser journeys in 10 checks with no page errors; seven checks also pass at 4× CPU throttle; 0 layout-audit problems in 177 states. These are automated checks, not human play. Codex authored review 26 and the prompt; the Kiro agent chose and built the mechanisms above. Nothing was published, pushed or submitted.

**November 7, Kiro IDE task v4 (HAUNT OS and the complete case, prompt04 with section 14).** The participant ran `Kiro brief 04` in Kiro IDE. The session context reported the model as Claude Opus 5.5; effort and credit charges were not visible and are not claimed.

What the Kiro agent did:
- **Before changing code.** It read the sources and reproduced the two review-24 defects in a headless Chrome baseline (`output/playwright/v4-baseline.json`). It wrote `.kiro/specs/os-case-v4/`: requirements, design, a design review recording accepted, modified and rejected Codex positions, and tasks.
- **Models.** It implemented the case store, letter, mail, capture-negative, glass writing-layer, phase and v4 save models, with v3 and v1 migration.
- **Desktop and programs.** It built a new window manager (maximize/restore, resize, keyboard Move and Size), the HAUNT OS shell, TERMINAL's job strip, session pane and Finish session, and the ECHO v4 studio with its shared frame editor. CANVAS and POSTMAN are new. It rewrote the stylesheet and `haunt.html`.
- **Checks.** It rewrote the 7 v3 browser checks, added `check:letter`, `check:case`, a DOM layout audit, the visual review script `review:v4` and `capture-v4-route.mjs`.
- **Visual review.** It inspected the screenshots at three PC sizes and fixed what they showed (listed in tasks.md).

Results: 113 unit tests; 50 browser journeys in 9 checks with no page errors; five checks also pass at 4× CPU throttle. These are automated checks, not human play.

Codex authored the story contract, reviews 24–25 and the prompt; the Kiro agent chose and built the mechanisms above. The v3 `scripts/capture-v3-route.mjs` targets the retired v3 page and no longer runs against v4. Nothing was published, pushed or submitted.

**November 7, additive consistency pass.** The participant explicitly asked to preserve review24/prompt04 and analyze further. Codex added [review25](development/25_Consistency_Across_The_Four_Programs.md), appended prompt04 section14 and current instruction pointers, without deleting the earlier review/prompt content. This pass clarifies capture/frame purpose, native action meanings, immutable delivery versus editable draft, cross-app data ownership, spatial and narrative phases, replay identity and an actual-content final payoff. The scenarios are paper-defined acceptance checks, not executed v4 tests or human findings. No app source, new Kiro execution, credits, publication or submission are claimed.

**November 7, Codex independent v3 review and proposed v4 handoff.** Codex inspected the actual delivered v3 specs/source and fresh headless Chrome PC views, rebuilt the production app and independently confirmed 84 unit tests plus all seven existing browser checks (67 journeys, no page errors). It measured a real 100×40px drag, reproduced the hidden Bell action and missing radio ArrowRight behavior, and performed source-informed wrong/correct framing and retained-print walkthroughs. These are not human playtests, an audible-sound test, real background-tab testing or a new Kiro run. The model/effort/credit charge of the preceding IDE task remain unobserved as recorded below.

Codex wrote [review24](development/24_V3_Critical_Review_And_Real_OS_Direction.md) and prompt04, proposing a coherent OS desktop, visibility/input repairs, an explicit negative/crop data contract and migration, stronger scene art and completion of CANVAS/POSTMAN/receipt. These are prepared next-task instructions, not implemented v4 features. Application source is preserved; only review/prompt/status documents and ignored review artifacts were authored in this Codex turn. No new Kiro credits, upload, publication, push or submission are claimed.

**November 6, Kiro IDE task v3 (PC agency and The Unsent Letter checkpoint, prompt03).** The participant ran `Kiro brief 03` in Kiro IDE. This record does not name the model: it was not displayed to the agent in this session. Effort and credits were not visible either and are not claimed.

What this Kiro run did:
- **Baseline.** It measured zero titlebar displacement for both windows and their geometry at 1366×768, 1440×900 and 1920×1080 before changing source.
- **Specs.** It wrote `.kiro/specs/pc-agency-v3/` (requirements, design, design-review, next-programs, tasks).
  - The critique named three weak points: an obvious source menu, a wipe with no stake, and mute versus stop.
  - It chose three improvements:
    - ECHO as a viewfinder that frames the glass behind itself;
    - the note written in the mist, which wiping can hide and breath brings back;
    - Muffle the bell versus Stop the call.
  - design-review.md records accept/modify/reject positions on Codex's contract 23 and review 21.
- **Models:**
  - `legacy-session.ts` (v3 request);
  - `glass-model.ts`;
  - `echo-studio.ts`;
  - `case-save.ts` (with migration of `haunt.terminal.v1`);
  - `window-drag.ts`;
  - `process-session.ts` reduced to the shared console syntax.
- **Views and integration:**
  - `glass-render.ts` and `glass-view.ts` (the desktop glass);
  - `echo-view.ts` (rewritten studio);
  - `legacy-view.ts` and `terminal-view.ts` (v3 room and shell);
  - `desktop.ts` (drag, glass, save, Session menu), `desktop-shell.ts`, `first-run.ts`, `desktop.css`, `haunt.html`;
  - the bell cloth and call cord in `specter-art.ts`.
- **Retired:** `echo-scene.ts`, `terminal-save.ts` and the tests of those mechanics.
- **Tests:** six v3 unit test files (50 tests); `check:drag` (new); halloween, echo, console and recovery rewritten; guide updated; windows kept; `scripts/haunt-helpers.mjs`; `scripts/capture-v3-route.mjs`.

Verification on the final production build, served by `vite preview` at 5174:
- 84 unit tests passed.
- 67 browser journeys passed with no page errors: drag 12, halloween 15, echo 12, console 7, recovery 6, guide 7, windows 8.
- Halloween, drag, echo and recovery also passed at 4× CPU throttling.
- The paper-bridge asset hashes are unchanged.
- The route was recorded as 536 real screencast frames plus stills at three PC sizes. A `.webm` was not possible without Playwright's ffmpeg download, and no tools were installed.
- Failures found during the run, and their fixes, are listed in [the task record](../.kiro/specs/pc-agency-v3/tasks.md).

**Kiro features.** The spec workflow structured the work. No hooks, MCP or powers were added, because none addressed a problem in this task.

**Not done:** human playtest, audible-sound test, real background tabs, touch or screen-reader tests, publication, commit or push. CANVAS, POSTMAN and the final receipt are specified, not built.

**November 6, final handoff packaging.** Codex made creative authority explicit in the consolidated prompt: Kiro should identify the weakest point, compare at least three concrete improvements and implement its best choices within the current increment, updating story/data/pitch together for structural changes. The prompt also consolidates the first-minute guide, native functional app behavior and review evidence expected in the delivery. This is preparation of the participant-operated IDE task, not a new Kiro run, source implementation or credit debit.

**November 6, narrative-cohesion closure.** At the participant's request, Codex reviewed the full proposed flow and found unsettled request/message/recipient content, competing bell producers and a weakly motivated CANVAS handoff. Codex wrote [contract23](development/23_The_Unsent_Letter_Narrative_Contract.md): Mara's unfinished local picture-and-note delivery to the next desk user, the current guest; one TERMINAL retry event produces the bell; the same apparition reaches the glass; ECHO retains the print, CANVAS finishes that letter, POSTMAN delivers it locally, and its matching receipt closes the original request. Codex consolidated the root prompt, archived its prior exploratory version, aligned PITCH.md and current instruction files, and paper-reviewed wrong-action/recovery scenarios. This is documentation and paper reasoning, not Kiro execution, observed comprehension, a four-app build or verified credit use. No application source, upload or submission changed in this review.

**November 6, duration and final-route correction.** Codex rechecked the public official video requirements after the Devpost connector returned UNAUTHORIZED/requires reauthentication, reviewed relevant 2025 winner pages, and verified public YouTube metadata durations of 172 seconds for InteractionKit and 180 seconds for SpookBnB. Seance's video returned LOGIN_REQUIRED and no duration is claimed. This is metadata/published-scope research, not complete video playback or hands-on winner testing. Codex wrote [review22](development/22_One_Case_Four_Programs_And_A_Three_Minute_Demo.md), expanded prompt03 section 4F, archived the historical shared-show pitch and rewrote PITCH.md with a timed future four-program demonstration. The proposed final case needs four distinct contributions and returns to TERMINAL; the current two-app increment remains a checkpoint. First-use, route and narration targets are estimates, not executed playtest results. No app source, new Kiro session, credit charge, upload or submission occurred.

**November 6, global desktop scene design iteration.** The participant proposed condensation, a silhouette and a hand across the fictional screen as progress becomes visible, and asked Codex to contribute further ideas and improve the same prompt. Codex wrote [document21](development/21_The_Glass_And_The_Desktop_Arc.md), expanded prompt03 section 4E, and updated current scope instructions. The proposal connects a real milestone to a change of presentation surface, a trace exposed by moving a window, an optional cleared region and an actual retained scene artifact. It includes a motion timeline, usability/interruption requirements and explicit objections. This is documentation/design work only, not an executed Kiro run, new application source, implemented cinematic, human validation or credit charge. Runtime code is left intact; no new build/browser-test result is claimed for the proposed scene.

**November 6, design addendum for the third IDE brief.** Following the participant's request for Codex's own opinion and a stronger relationship between the programs, Codex expanded prompt03 and wrote [review20](development/20_Causal_Desktop_Codex_Opinion.md). The proposal covers contextual ghost output, an explicit causal role for the bell/ECHO and two additional candidate program contracts. Opus is asked to accept, change or reject the proposals with reasons, complete the current two-app case and specify the expansion. This is Codex design documentation, not a new Kiro execution, completed four-app game, actual consensus, human test or credit charge. No application source was changed in this addendum.

**November 6, independent review of the second IDE delivery and third brief.** Codex read the participant's returned report, the actual v2 specs/source and rendered PC interface. It independently reran **74 unit tests and 18/18 Halloween journeys**, verified the current production assets at `127.0.0.1:5174/haunt.html`, and measured zero displacement after real titlebar drag attempts on both windows. Earlier first-delivery motion failures were addressed by v2; ECHO and the core TERMINAL decision graph remain largely unchanged. The user's perception of limited gameplay change is supported by the delivered scope. This review does not independently rerun all 53 browser journeys reported below or establish human enjoyment.

Codex prepared [review19](development/19_PC_Gameplay_Reset.md), the third IDE brief and current instruction/status corrections. The new brief prioritizes PC, makes window dragging mandatory and permits substantive changes to both existing apps. It is not an executed Kiro task. No application source was changed by this Codex review, no new Kiro credits are claimed, and there was no push or publication. The participant will run the brief in Kiro IDE; model/effort/billing must be reported from actual observed context.

**November 6, Kiro IDE task v2 (TERMINAL experience, review 18).** The participant ran `Kiro brief 02` in Kiro IDE. The session context reported the model as Claude Opus 5.5. The effort setting and credits were not visible and are not claimed.

What this Kiro run did:
- **Baseline before any source change.** It reproduced the four defects Codex reported and diagnosed the cause of the `check:halloween` line-232 failure. Results are in `output/playwright/v2-baseline.json`, which is not tracked; the spec copies the numbers. The failure was a 0.01 ms `visibility` transition: the desktop-wide reduced-motion rule creates such transitions, and the task17 check raced it. The other three defects were stale Web Animations after Undo, after a live switch to reduced motion, and after a rapid farewell.
- **Spec.** It wrote `.kiro/specs/terminal-experience-v2/` (requirements, design, tasks, playtest protocol). The spec compares three room arrangements, three phone layouts and three closure options, and records what was rejected.
- **Implementation:**
  - `observe()` and an event identity outside the snapshot in `legacy-session.ts`;
  - cue ownership (`terminal-cues.ts`);
  - tracked, silenceable voices (`terminal-bell.ts`);
  - a scene-first room in which the objects are the controls, with one contextual primary action (`legacy-view.ts`);
  - the shell handover and Say something (`terminal-view.ts`);
  - a validated save of completed endings only (`terminal-save.ts`);
  - phone active-app mode and safe areas (`desktop.css`, `haunt.html`);
  - suspend on minimize (`desktop.ts`).
- **Checks.** `check:halloween` was rewritten for the new flow (18 journeys), and `check:recovery` was adapted only in how it reaches controls. There are 11 new unit tests.

Verification:
- **Results.** 74 unit tests passed, and 53 browser journeys passed with no page errors on the production build.
- **Repeat runs.** `check:halloween` was repeated, including once with 4× CPU throttling.
- **Revert.** A desktop re-centring broke the tested console + ECHO side-by-side workflow (`check:console`) and was reverted.
- **Kiro features.** The spec workflow was used to drive the implementation and the checks. No hooks, MCP or powers were added, because none addressed a problem in this task.
- **Not done.** No human playtest, audible test, real device or screen-reader test, publication or push took place.

**November6 independent review after actual IDE delivery:** the participant returned Kiro IDE's completed task17 report and the workspace contains its specs/source/tests. The specs say the IDE context reported Claude Opus5.5; Codex did not observe the reasoning-effort control or credit billing. This is genuine reported IDE work supported by the delivered files, separate from the failed CLI. Codex independently confirmed build and63 unit tests, inspected the live room, and reproduced stale recall motion after Undo/live reduced motion. Its `check:halloween` execution loaded after the rebuild but failed at line232 (1 animation instead of0), so the earlier reported11/11 is not independently reproduced here. No fabrication is inferred from differing runs. Source remains intact; [review18](development/18_Opus_Experience_Review.md) and the second IDE brief identify the actual strengths, limits and next fixes.

**November 6, Kiro IDE task17 (TERMINAL Halloween encounter).** The participant ran `Kiro TERMINAL Halloween brief` in Kiro IDE. The session context reported the model as Claude Opus 5.5. The reasoning-effort setting and any credit charge were not visible in the session and are not claimed.

What this Kiro run did:
- **Spec.** Wrote `.kiro/specs/terminal-halloween/requirements.md`, `design.md` and `tasks.md`. They include a critique of the brief: results were not attributable to their causes. The fix is a `lastAction` field, split return moments, evidence on the bell itself, and a ghost that object changes never move.
- **Model.** Added presentation-only fields and state-accurate check-ins in `legacy-session.ts`. Process outcomes are unchanged.
- **Presentation and art.**
  - Rewrote `haunting-presentation.ts`.
  - Refined the ghost and added a scene bell, doorway and moon in `specter-art.ts`.
  - Added `ghost-writing.ts` (bounded reveal) and `terminal-bell.ts` (opt-in chime).
- **Views.**
  - Rewrote `legacy-view.ts` as the ghost's room inside the same window.
  - Extended `terminal-view.ts`: a ghost behind the banner, written line, Read the note button and tab bell.
  - Added task17 styles to `desktop.css`.
  - Rewrote copy in `first-run.ts`, `desktop-shell.ts` and `haunt.html`.
- **Checks.** Added `tests/haunting-presentation.test.ts` and `scripts/check-terminal-halloween.mjs` (`npm run check:halloween`).

Verification:
- The production build passed.
- 63 unit tests passed.
- 46 browser journeys across six checks passed with no page errors. These are the new check plus the unchanged recovery, guide, window, ECHO and console checks.
- A phone layout regression surfaced by `check:windows` was fixed.

Codex's brief, `moment` field, draft narration and original ghost/icon drawings are scaffolding and are not counted as Kiro work. No human testing, installs, publication, push or account changes took place. Details and the "not verified" list are in [the task record](../.kiro/specs/terminal-halloween/tasks.md).

**November6 Opus Halloween attempt and IDE handoff:** the participant requested Opus to help redesign the current encounter for non-programmers with functional Halloween actions. The native catalog omitted Opus; an actual exact `claude-opus-5.5`/max read-only critique attempt warned about unsupported effort and exited1 at prompt stage with UsageLimitReachedError / MONTHLY_REQUEST_COUNT. No critique/source was generated. The participant then offered to operate Kiro IDE manually. Codex prepared `Kiro TERMINAL Halloween brief`, task17 and stable model/narration/SVG scaffolding. The IDE's entitlement/model/credit state and any later output remain unverified. These prepared files are Codex-authored, not new Kiro use. No plan, account or region changes occurred.

**November6 actual recovery-review retry:** the participant explicitly repeated their request to use Kiro. Codex queried the native model catalog (Sonnet4.5 was available) and launched a bounded native Sonnet4.5 design review of task16, permitted to write only `terminal-recovery-review.md`. The run exited1 with **UsageLimitReachedError at prompt stage**, before file tools; that review file was not created. No actual Kiro critique or recovery source is claimed. Codex resolved its own design risks and implemented/tested the first application-owned TERMINAL recovery. Private failure logs remain outside Git. This is an attempted Kiro task, not a successful new contribution or proof that4,000 promotional credits were consumed. No plan/account/model bypass was used. See [task16's actual record](development/16_Terminal_Application_Recovery.md).

**November6 first-run/OS shell:** Codex implemented the optional spotlight guide and OS shell using frontend-design, emil-design-eng and choreograph. At the participant's explicit request, a separate agent tested the actual UI without reading source/solutions, then checked repairs on desktop/mobile. The guide/agent work is not Kiro execution or human research. The prior service-limit error was not bypassed. Actual changes, observations and limitations are in [task15](development/15_First_Run_and_Desktop_Shell.md).

**November6 app identity/process console:** Codex implemented the participant-requested characteristic console/capture interfaces and fictional supervisor/child signal mechanic after Kiro's preceding monthly-limit error. This adds no new Kiro session or confirmed credit use. Prior genuine Kiro scope/contributions remain preserved; do not attribute `process-session.ts`, `terminal-view.ts` or their checks to Kiro. See [task14 and its implementation record](development/14_App_Identity_and_Process_Rehearsal.md).

**November6 ECHO-01:** native Kiro Claude Sonnet4.5 wrote a genuine scene scope and the first geometry/view/integration pass, then returned a monthly usage-limit error. Codex found and repaired an impossible coverage layout, out-of-bounds initial placement and incomplete controller/lifecycle handling, rebuilt the scene view, and verified seven new unit cases plus nine new browser journeys. This is actual but incomplete Kiro file work followed by substantial Codex review/implementation, not a normally completed Kiro run or proof of a specific promotional-credit debit. See [the detailed ECHO record](development/2026-11-06-echo-rehearsal.md).

**November6 new-project increment:** native Kiro Claude Sonnet4.5 generated the short `.kiro/specs/please-haunt-yourself/window-foundation.md` and the separate `haunt.html`/`src/haunt/` foundation. A targeted correction completed after Codex stopped an earlier correction attempt whose file-replacement permissions had failed before approval. Codex made final motion/focus/type-check fixes, refined local vector art/UI, integrated the build and executed eight browser checks. The requested Opus5.5/max attempt was rejected before code generation; it was not used. The participant explicitly authorized the available-model substitution before Sonnet ran. See [the detailed record](development/2026-11-06-window-foundation.md). This is actual Kiro file work, not proof that the full game exists or that a particular number of promotional credits was charged.

| Local run | Actual Kiro contribution | Review/outcome |
| --- | --- | --- |
| Requirements, V3 spec mode | Read the V3/R1 references and generated `requirements.md` in English, with source references, N01–N12 and separate human/software checks | Generated file retained. Some repair operations failed because the caller's initial tool allowance omitted editing; a subsequent task applied them |
| Design, resumed V3 spec mode | Corrected requirements and wrote `design.md` after concrete implementation decisions supplied through Codex | Design file retained and reviewed. The command stalled after writing and was stopped; no Kiro-generated task list is claimed |
| Core setup, V2 | Created initial `package.json`, `tsconfig.json` and `vite.config.ts`; revised technical design | Service throttled before engine implementation. Codex subsequently updated dependencies/configuration and implemented the playable engine and UI |
| Geometry, V2 | Read relevant sources | Service throttled; no geometry code or tests were produced. Current `geometry.ts` was implemented through Codex |
| Sonnet properties, V2 | Attempted a smaller test task | Service throttled; no tests from this attempt are claimed |
| Physics tests, V3 default, Claude Sonnet 4.5 | Wrote `tests/physics-properties.test.ts`, covering projection, contacts, routes, edit transactions and save validation | All 14 initial tests passed independently. Type checking exposed an unused import; review also identified a vacuous conditional and opportunities for stronger randomized checks |
| Physics review, V3 default, Claude Sonnet 4.5 | Corrected the import, replaced a vacuous check with concrete 20/19 contact boundaries, and added randomized rollback and bridge-save tests | Kiro ran type checking and the suite, corrected a failing fixture, then obtained 28 passing tests. Codex independently confirmed the results and tightened save coverage to encode during the unsupported preview, rather than before the attempted edit |
| Opening performance, V3 default, Claude Sonnet 4.5 | Read the project steering contract; wrote `src/core/opening.ts`, integrated the opening into controller/view/types, and added unit/browser checks | Type checking and unit checks executed. A browser run left a passed report, but the CLI remained waiting and was stopped. Completed files are retained; a normal command completion is not claimed |
| Opening review, V3 default, Claude Sonnet 4.5 | Applied concrete review on reduced-motion holding, Help interruption, focus transfer and a physically clearer local path; extended browser coverage | Task finished normally without running commands, as requested. Codex independently tested the changes, fixed a remaining zero-time reduced-motion pose and incorrect test selector/expectations, then obtained 35 passing unit/property tests and 9 passing browser checks |
| Concept audit after participant criticism, V3 default, Claude Sonnet 4.5 | Produced `Kiro concept audit` with a redesign verdict and three alternatives | Task finished, but its direction recommendation was rejected: independent predecessor searches contradicted its originality claim; other unsupported claims and a timing inconsistency are marked at the top of the retained draft |
| Review of the participant's dead-program desktop idea, V3 default, Claude Sonnet 4.5 | Read the new candidate brief and wrote `Kiro dead programs review`, identifying button-guessing, superficial characterization and disconnected-case risks | Task finished. Codex added qualifications about SIGTERM handling and recoverable clues. This is document review, not human validation or new application implementation |
| Adversarial critique of inherited functions, V3 default, Claude Sonnet 4.5 | Read Codex's new design exploration and wrote `Kiro critique of inherited functions` | Task finished with no application-code changes. Codex retained the concern about opaque combinations, rejected unsupported thresholds and inconsistent audit-log examples, and refined a paper walkthrough. No agent approval or written walkthrough is counted as player validation |

Codex authored the first playable engine, workshop UI/controller, `tests/route.test.ts` and initial browser end-to-end tests. Kiro authored the later opening module and integration/tests; Codex review fixes are identified above. Codex also added the home aperture closing when its frame moves, a visible final grip, and the visual correction that keeps opening text off the figure's feet. Kiro specs informed the implementation, but they do not make all subsequent code Kiro-authored.

## Evidence and limits

Requirements/design live in `.kiro/specs/the-wrong-window/`. The task tracker there is explicitly Codex-maintained and was created after the first playable build. Steering was prepared through Codex, and the opening run's Read File events confirm it was consumed. Its practical constraints were used in the task and reviewed in the output: unchanged mechanisms, equivalent motion choices, truthful evidence and local-only work.

No production defect is claimed to have been discovered by the physics PBT suite in this iteration. It provides regression coverage; review and verification did reveal and correct test-fixture and opening-integration problems. We have not used Kiro hooks, Crew or MCP for this implementation and do not claim otherwise.

The participant subsequently authorized changing the central idea and proposed the Halloween desktop direction. Its candidate brief was developed through Codex from the participant's idea, then reviewed by Kiro as recorded above. Earlier playable tests remain evidence for the preserved paper-bridge prototype only. They do not establish the new concept's quality or behavior.

Actual CLI event streams are retained privately outside the repository. The public-facing record excludes private model reasoning, credentials and account data. Local Git commits preserve reviewed artifacts; this record does not fabricate sessions or alter dates.

No exact credit debit or remaining balance has been independently verified. The participant last reported `0/4000` used. Successful Kiro file changes establish real execution, not a particular charge or usage threshold.

## November 8 — Codex independent v4 review and prepared prompt05

The participant reported completing the manual Kiro IDE prompt04 and requested a critical review that preserves the visual direction and Claude's freedom to question Codex. Codex independently rebuilt the current production bundles (`haunt-Bxlu_uWT.js` / `haunt-B4vw9n-o.css`), confirmed 113 unit tests in 11 files, and reran nine browser scripts with 50 journeys and no recorded page errors. The existing 22-state visual route ran at three PC sizes with zero reported layout problems on that route.

Additional isolated Chrome probes found failures outside those checks: after Finish, enough returned mail attempts evict the acknowledged delivery and make reload reset the case; lost writing survives reload but Undo history does not, while the UI still recommends Undo (the Reset menu remains a working recovery); permitted minimum TERMINAL/ECHO sizes clip controls/content. An independent finish route also located the hand behind TERMINAL during the release. Review26 separates those facts from judgments about early solution disclosure, CANVAS agency and the ending's presentation.

Codex authored `docs/development/26_V4_Independent_Review_And_Experience_Priorities.md` and `Kiro brief 05`, and updated review/status pointers. All application, existing test and check source is retained; diagnostic scripts/evidence are under ignored `output/playwright/codex-v4-review/`. The prepared next task asks Claude to reproduce and challenge the findings, implement scoped repairs and experience improvements, and report accepted/modified/rejected proposals with actual evidence.

No new Kiro execution, model/effort/credit usage, human playtest, measured first-use time, publication, push or submission is claimed for this Codex review. The earlier user-operated Kiro v4 contribution remains genuine and separately recorded. Prompt05 is prepared, not executed.

## November 9 — Codex QA of v5 and prepared visual-precision task

The participant supplied an ECHO screenshot with writing outside its note and requested QA of playability, the flow and relationships. Codex independently rebuilt the participant's v5 delivery (`haunt-DuQWST70.js` / `haunt-CxGB5zKC.css`), confirmed 125 unit tests in 12 files and reran ten browser scripts with 57 journeys and no recorded page errors. `review:v5` generated and DOM-audited 177 states at three PC sizes, with zero reported issues; selected screenshots were inspected.

Additional isolated Chrome routes verified opening apps before their material exists, stopping the Bell call before any return, correcting an invalid address, delivering the actual Figure photograph with five note lines, finishing and reloading the same run. A Force/retry/shadow route also reached the glass correctly. The diagnostic canvas observer measured the participant's note defect without changing the draw calls: text edges at 86.53 and 81.31 in a paper whose right edge is 70. Independent screenshots also reproduce the LIVE/PAUSED badge over the session header. Review27 distinguishes these defects, the No writing wording mismatch and open subjective questions about the photograph choice and final keepsake.

Codex authored `docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md` and the prepared `Kiro brief 06`, and updated current review pointers. All application and existing test/check source is retained. Diagnostics are under ignored `output/playwright/codex-v5-qa/`. The new task asks Claude to reproduce and critique the findings, repair image text/layout and preserve the working v5 case.

No new Kiro execution or credit/effort claim, human playtest, measured first-use/demo time, CPU-throttle rerun, publication, push or submission belongs to this Codex QA pass. Prompt06 is prepared, not executed; the actual previous Kiro IDE contributions retain their attribution.

## November 9 — independent Codex review of v6 and combined-confirmation handoff

After the participant returned the prompt06 delivery report, Codex rebuilt v6 (`haunt-Db2YorXu.js` / `haunt-WVQaX4Df.css`), confirmed 137 unit tests in 13 files, reran all 12 browser scripts with 75 outcomes and no page errors, and reran the 210-state three-PC-size DOM/drawn-text audit route with zero reported problems. Selected source, Below-letter and ending images were inspected. The v6 fixes remain actual Kiro work, not changes authored by this review.

An additional real-input route found a P2 combination not exercised by the passing checks: before Finish, incomplete B meant to replace complete delivered A alternates Send anyway and Replace. The snapshot A stays unchanged; cancelling and returning A's receipt still finishes the case. Diagnostic negative controls temporarily inserted a covered button and overflowing canvas words in an isolated page: both auditors detected them and returned to zero after removal. These are audit controls, not application defects. A settled ending after minimum/Arrange/Finish was also checked without reproducing a horizontal-scroll or text-layout failure.

Codex authored review28 and `Kiro brief 07`, updated current pointers and refreshed PITCH's build/evidence status. The application and existing check/test source remains unchanged. Ignored scripts/evidence are in `output/playwright/codex-v6-review/`. The next prepared task asks Claude to reproduce and challenge the combined-confirmation finding and implement a finite, content-specific repair while preserving v6.

No new Kiro execution, effort/credit spend, human/agent playtest, measured demo time, CPU-throttle rerun, publication, push or submission is claimed. Prompt07 is prepared, not executed.

## November 9 — independent deep QA of v7 and long-text layout handoff

The participant requested a deep review of overlap, flow, completion and recovery, then supplied the detailed prompt07 delivery report during the same review. Codex rebuilt v7 (`haunt-U_tkFtyC.js` / `haunt-WVQaX4Df.css`), confirmed 161 unit tests in 14 files, reran all 13 browser scripts (83 outcomes, no page errors) and the 210-state three-PC-size normal-content route (zero reported DOM/drawn-text problems). The existing v7 repairs remain attributed to the user-operated Kiro IDE run.

An additional headless route in already installed Edge 157.0.4341.42 completed A delivered → incomplete B replacing A → refusal → corrected C → Finish → reload → unattached copy → Replay. A remained immutable, the accepted C stayed accepted after copy/reload and replay created another run with historical mail archived. No personal browser profile, installation or native desktop control was used.

Another real-input Chrome route used the accepted maximum of 120 unbroken subject characters and 600 unbroken message characters. It reproduced a P2 visual-layout failure in POSTMAN at default and minimum: oversized list/reader contents clip text and the letter. The payload stayed intact and the route still finished. The usual-content clean audit and this additional failure describe different inputs.

Codex authored review29 and `Kiro brief 08`, updated status pointers and refreshed PITCH's local evidence status. Application and existing check/test source is retained; diagnostics are under ignored `output/playwright/codex-v7-review/`. Prompt08 asks Claude to reproduce and critique the finding and repair layout without changing input limits, stored content, the story or v7's confirmation rules.

No new Kiro run, effort/credit spend, human/agent playtest, measured demo/first-use time, throttled rerun, Firefox/Safari claim, publication, push or submission belongs to this review. The Edge route is not a full repetition of the suite in every browser. Prompt08 is prepared, not executed.

*Later the same day (added by the Kiro IDE v8 run):* the participant ran prompt08; see the v8 entry at the top of "Executed work". The paragraph above describes this review as it was written.

## November 9 - independent v8 checkpoint and bounded polish handoff

The participant supplied the completed prompt08 report and requested a deep review of flow, completion and defects. Codex rebuilt v8 (`haunt-CjGjZ4b_.js` / `haunt-9asRCWsn.css`), confirmed 161 unit tests in 14 files, reran all 14 browser scripts (93 outcomes, no page errors) and the 210-state three-PC-size route (zero reported DOM/drawn-text/page errors). An additional real-form long-input route confirms the reader/list remain bounded at default/minimum, preserves the exact 120/600-character payload and finishes the case. An isolated route in already installed Edge completes replacement, correction, Finish, reload, an unattached copy and Replay. These results corroborate the actual Kiro IDE repair attributed in the v8 entry above.

After that battery finished, Codex independently profiled typing with 60 real key inputs per condition, a plain textarea control, four programs versus POSTMAN alone and simulated 4x CPU. The final matched-ECHO-view profile records unrelated DOM mutations and unchanged ECHO/POSTMAN drawing during message-only input. Instrumented wall time is not human latency. The final message persisted exactly; no page errors occurred. A separate, uninstrumented UI reproduction confirms a P3 active-frame marker that stays inactive after the other active window closes, although taskbar state, focus and input work. Neither finding prevented completion and neither is claimed to have originated in v8.

Codex authored review30 and `Kiro brief 09`, and refreshed current status/evidence pointers without changing the app, existing checks/tests or build configuration. Diagnostics are in ignored `output/playwright/codex-v8-review/`. Prompt09 is prepared, not executed: it asks Kiro to challenge the measurements, preserve v8 and make only justified typing/active-marker improvements. Existing application changes remain attributed to the participant-operated Kiro IDE runs.

No new Kiro execution, effort/credit usage, human/agent first-visit playtest, measured human demo time, installation, native desktop control, commit, push, publication or submission occurred. The extra Edge route is not the full suite in Edge. This pass did not repeat Kiro's full throttled regression set; only the new typing profile includes a 4x simulation. The coherent v8 baseline is suitable for the existing first-visit protocol, but comprehension/enjoyment and submission readiness are not inferred from these checks.

*Later (added by the Kiro IDE v9 run, November 10):* the participant ran prompt09; see the v9 entry at the top of "Executed work". The paragraphs in this section and the next two describe their reviews as they were written.

## November 9 - live official category and judging refresh

After the participant reconnected Devpost and authorized the review, Codex successfully fetched Kiroween 2026 overview, formal rules, criteria, submission requirements and dates from the authenticated Devpost connector. Review31 records the current Costume Contest recommendation, equal 20% formal weights, the deadline converted to Lima, concrete local release checkpoints and the limits of the check. It notes the structured scoring-scale discrepancy without inventing a product score. The local root lacks an open-source license candidate; no license or publication was created.

Codex appended that official context to prompt09 and refreshed current README/AGENTS/PITCH pointers. The typing/active-frame task, app source and existing tests/checks remain unchanged. No new Kiro run, credit spend, dummy/human playtest, rules acknowledgment, registration, push or submission occurred. An agent first-visit simulation is proposed after the next bounded polish iteration is verified; it is not claimed as completed or as human research.

## November 9 - development-date and provenance condition

The participant explicitly required compliance with the rule excluding projects started before the submission period. Codex re-fetched the formal rules and opening instant through authenticated Devpost, checked all 20 reachable commits across all refs (non-shallow repository), and found no author/committer timestamp before October 30 at 16:00 UTC. The earliest retained commit and the recorded change to the dead-program desktop direction are both November 5. Review32 records the hashes, dates and the limits of Git timestamps as provenance evidence.

Codex added a persistent delivery condition to AGENTS.md, steering and prompt09: preserve genuine history, identify incorporated prior material, and resolve any actual pre-opening implementation before inclusion. Historical notes, references and fictional dates are not retimestamped or concealed. This is a documentation/history inspection, not an eligibility certification. No app source, Git dates/history, Kiro usage, remote, publication or submission was changed.

## November 10 - independent v9 QA and first-visit agent simulation

The participant supplied Kiro's completed prompt09 report and authorized the dummy/first-visit trial. Codex confirmed the served v9 assets, independently ran 166 unit tests in 15 files, all 16 browser scripts (106 outcomes, no page errors) and the 210-state PC visual route (zero reported DOM/drawn-text/page errors). Both new typing/active-window checks pass. This pass did not repeat Kiro's alternating timing benchmark, CPU profiles, Edge subset or throttled regression suite.

Codex also reproduced a build discrepancy twice: npm.cmd run build fails before Vite on fluid-typing-v9.test.ts's import of node:fs and the resulting implicit-any parameters. Node types are absent from this installation, the direct development dependencies and the lockfile package entries. The existing v9 production output still runs. The reason for the earlier reported successful build was not established. No app/test source, types package or configuration was changed to conceal or repair the error in this review.

Two independent no-history/no-solution Codex agents were used. Trial A stopped after its REPL reset during a Bell locator wait; it is documented as an interrupted instrument session, not a gameplay blockage. A different fresh trial B completed one continuous route from tutorial to Session finished and explained the causal story, using visible UI/object explanations but no Hint, Under the hood, commands, source or stored state. It recorded uncertainty about wiping versus preserving the glass, and framing versus full-source capture. Those are observations for subsequent human validation, not human results or automatic redesign requirements. No human playtime or enjoyment metric is claimed.

Codex authored review33 and Kiro brief 10 and refreshed the current pointers. The next prepared task is a bounded reproducible-build repair, not an executed Kiro contribution. Diagnostics and copied trial records are under ignored output/playwright/codex-v9-review/. Git's 20-commit chronology is unchanged, no root license was added, and no new Kiro credits, commit, push, publication or submission belongs to this review.

*Later the same day (added by the Kiro IDE prompt10 run):* the participant ran prompt10. The build failure described above is reproduced and repaired; see the prompt10 entry at the top of "Executed work". This section describes the review as it was written.

## November 10 - independent confirmation of prompt10

Codex independently ran typecheck, a fresh build into an unused review directory, all 166 unit tests and the typing/active/case browser checks (22 outcomes, zero page errors). All seven built files match the saved v9, current dist and preview HTTP bodies byte for byte. The 98-file snapshot differs only in fluid-typing-v9.test.ts; HEAD/history is unchanged. The original build blocker in review33 is closed. Review34 distinguishes these independent results from Kiro's clean-install and negative-control logs.

No new Kiro execution, dependency installation, source change, human trial, license, commit, push, publication or submission was performed by this review. The unchanged game retains the earlier full browser/visual and agent-visit evidence.

## Competition boundary

On November 6, the participant explicitly requested independent-agent criticism and a defined concept with different interactions per application. Two Codex collaboration agents contributed creative design and critique; Codex consolidated `One Last Function design`. These were Codex agents, not additional Kiro CLI tasks, and are not reported as Kiro credit usage or human testing. Only documentation changed during this design phase.

The participant then requested five or more English-language programs and stronger personalization. The same two Codex agents challenged the proposed extension: REPLAY must not duplicate TERMINAL and POSTMAN must not be a decorative visitor menu. Codex defined their separate behavioral/access/reaction roles and consolidated `Please Haunt Yourself concept`. Those design discussions are not Kiro usage, working personalization or independent human validation. Source, tests and dependencies remain untouched.

In a subsequent competitive review, the Codex critic identified a remaining risk: a recording of three abstract menu choices could feel like a questionnaire with a replaying puppet. Codex revised the same design document with object-based rehearsal, immediate recognizable replay, and controlled comparisons of scene changes versus visitor changes. The review used published winner submissions and did not include hands-on winner-demo evaluation or human playtesting.

For the participant's November6 request to resolve experience risks before further Kiro work, two Codex agents exchanged creative/adversarial objections directly, and a third Codex agent cold-read proposed player copy without the project history. Codex consolidated `Shared-show experience contract`, corrected contradictions in08, and updated project instructions. This was document critique and specified paper scenarios, not a Kiro run, an implemented simulation, a human usability session or verified credit spending. No application source, tests, dependencies or build configuration were changed in this revision.

The participant then challenged whether the contract actually provided a beautiful OS and multiple memorable scenes. Two Codex design/critique agents and a third art-direction agent identified a real gap between behavioral consistency and experiential variety. Codex documented the revision in10, rechecked published predecessors and winner write-ups, and used the built-in image-generation tool for an illustrative concept board and a targeted correction after inspecting defects. This is not Kiro use or a playable implementation. Four tableaux, body extraction and returned-view postcards remain design requirements; art images do not prove those behaviors, actual fun or a prize standard. No new Kiro credits are claimed.

At the participant's subsequent explicit skill-download request, Codex installed pitch-timebox, playwright, find-animation-opportunities and choreograph into the user-scoped Codex skills directory. The community pitch guide's supporting files were included and its plugin-root path references adapted locally, preserving the original. Codex read the guides, rechecked official judging/video constraints and produced11 plus a clearly planned root PITCH.md. This closed shared-entry, first-run, animation/interruption and save/recovery decisions. No new native Kiro run, app source, test files, runtime dependency install, browser verification or exact credit spending is claimed. The recommendation is to begin Kiro specification and a polished slice after an implementation request, not to call the four-scene proposal an already tested or winning product.

[Official rules, section 4](https://kiroween.devpost.com/rules) accept Kiro CLI and leave sufficiency of Kiro use to the judges. There is no numeric usage threshold stated there. Spending credits alone is not our acceptance criterion.

Before submission, review the actual development contributions and explain how specific Kiro outputs affected the working product. Keep `.kiro/` in the public source, provide the required write-up and ensure it agrees with files, history and demonstrated behavior. We do not claim organizer approval, completed human playtesting or guaranteed eligibility.
