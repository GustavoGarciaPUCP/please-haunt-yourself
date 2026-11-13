# v4 independent review and experience priorities

Codex review, November 8, 2026. This reviews the participant-operated Kiro IDE delivery of prompt04. It is an independent source review and automated Chrome walkthrough, not a human playtest or a new Kiro run. Application source was not changed by this review.

## Judgment

The four-program case is now implemented. It is no longer accurate to say that CANVAS, POSTMAN or the final receipt still need to be built. TERMINAL changes the shared glass, ECHO retains actual source data, CANVAS prepares the letter, POSTMAN delivers an immutable snapshot, and TERMINAL accepts its receipt. The desktop now reads as a workstation, with distinct application palettes, a taskbar, working window controls and real case files. Preserve that visual direction.

This is a credible complete first version, not a verified outstanding player experience. Its strongest distinctive interaction is moving ECHO as a window onto the same haunted glass. The middle of the main route is less convincing: the default CANVAS solution is Lift the writing then Compose; POSTMAN immediately labels guest as "you, at this desk now". More programs, text, effects or clicks would not by themselves improve it. The next task should fix reproducible failures, give the existing decisions better presentation and protect the final payoff.

The previous critique also needs correction: Kiro made substantial, real changes and documented positions that accepted, modified and rejected Codex proposals. This review does not assume its own proposed solutions are superior. Prompt05 asks Claude to reproduce the facts and challenge the recommendations.

## Independently verified build

- Rebuilt with `npm.cmd run build`; current production bundles are `haunt-Bxlu_uWT.js` and `haunt-B4vw9n-o.css`. A fresh isolated Chrome page loaded those exact bundles at `http://127.0.0.1:5174/haunt.html`.
- `npm.cmd test`: **113 tests in 11 files passed**. These include the preserved paper-bridge suites.
- All nine existing browser scripts passed again: **50 journeys**, no recorded page errors. Windows 7; drag 5; Halloween 4; ECHO 7; letter 7; case 5; console 5; recovery 5; guide 5.
- Re-ran `review:v4`: **22 recorded states at each of 1366×768, 1440×900 and 1920×1080**, with zero reported layout problems and zero page errors on that scripted route. Inspected screenshots of the desktop, session, ECHO, CANVAS, POSTMAN and finish, plus independent diagnostic states.
- The passing default-layout audit does **not** cover every supported window size. The additional minimum-size walkthrough below found real clipping.
- Additional probes reproduced lost-writing recovery after reload, history eviction after finishing, minimum-size layouts and the location of the hand at the final action. Initial range-event simulation was corroborated by actual keyboard Home on the slider and reload. No internal case state was injected to manufacture progress.

Existing regression passes and new failures can both be true: they exercise different routes. Do not change the old tests merely to hide these new failures.

## Defect 1: a bounded mail history can invalidate a legitimate finished save

**Priority: fix before submission. Confirmed data loss on reload.**

Reproduction with real application actions:

1. Complete the normal route, deliver letter A to guest and choose Finish session.
2. Open CANVAS and Compose in POSTMAN again.
3. Address the draft to Mara. Send 13 returned attempts, changing the message between attempts and reopening Drafts to edit. This is permitted by the application.
4. The retained deliveries now contain 12 entries, but no longer contain A. The acknowledgment still references A.
5. Reload. The loader rejects this save; the UI says the saved case could not be read and starts a fresh repeating case with a new run and no deliveries.

Cause: `mail-model.ts` caps the list by unconditionally removing its oldest entries in `MailModel.send()`. That can remove `intendedId` or the delivery referenced by `CaseStore.ack`. `case-save.ts` correctly refuses unresolved references. Weakening that validation would hide the problem rather than preserve the letter.

Required outcome: bounded history must retain the current intended delivery and the acknowledged final artifact, or hold those essential snapshots outside the evictable history. Extra experiments must not revoke a delivery or invalidate a save. Choose the smallest sound design and preserve compatible v4 saves. Do not solve it with unlimited storage, a backend, or a ban on ordinary postgame viewing/editing.

Also review post-finish Send/Replace wording. A finished job must continue to refer to the actual letter it accepted, even if the player subsequently sends another copy. This wording review is separate from the confirmed eviction defect.

## Defect 2: after reload, CANVAS recommends an unavailable Undo

**Priority: fix recovery feedback and action. Confirmed misleading recovery, not a permanent dead end.**

1. Use a valid glass capture in CANVAS; leave the writing in the mist.
2. Focus Mist and press Home to set it to 0. Writing becomes `lost`; Undo works in this session.
3. Reload and reopen CANVAS.
4. The message still says "The writing was cleared away with the mist. Undo brings it back." The writing panel repeats that advice. Undo is disabled, and Lift the writing is also disabled.

Cause: the lost state is saved, but `LetterModel` does not persist its Undo stack. The copy does not check whether its promised recovery is available.

There **is** a recovery: Letter → Reset to the capture… → Reset, then Lift the writing. This was exercised successfully. It is an undisclosed route with broader effects than restoring the missing writing.

Preferred result: show an available recovery in the current panel. For example, restore the writing from the draft's own retained capture when Undo is unavailable, without discarding the player's frame, paper or layout. Use actual captured lines; a session/limited source with no writing must not gain any. Claude may choose a better approach, including bounded history, but must test reload and preserve the save's truthful state.

## Defect 3: permitted minimum window sizes clip real controls

**Priority: fix supported PC window layouts. Confirmed with real pointer resizing.**

At a 1366×768 desktop:

- TERMINAL may shrink to **480×420**. In the session's Bell inspector, Back to the prompt is cut horizontally and Muffle the bell / Stop the call extend below the usable content. They are not simply text in a normal scrollable list. The default-size visibility repair does not cover this allowed size.
- ECHO may shrink to **640×480**. In Captures, the capture status is cut below the window; after the handoff the audit also reports Discard outside its window.
- CANVAS at **680×500** uses a scrollable layers area; content below that scroll boundary is not automatically a defect. No new CANVAS-owned clipping was reported in this minimum-size probe.
- POSTMAN at **640×460** uses a scrollable reading pane; no layout problem was reported in this probe. A short subject input showing only part of its editable value is not itself lost message data.

Source entry points: `window-geometry.ts` (`MIN_SIZE`), `desktop.css` session/inspector/ECHO layout, `window-drag.ts` and the layout-audit script. Prefer adaptive internal layout and real scrolling where appropriate. Raising a minimum is acceptable if justified, but still support the agreed desktop sizes and ordinary window use. Do not just hide controls or change the audit exclusions.

## Experience 1: default guidance exposes a solution before the player investigates

**Observed interface fact; its effect on enjoyment is a design judgment, untested with people.**

The opening TERMINAL job strip says **"Next: Stop the call."** before the player watches a return or requests a hint. `PHASES.repeating.pending` supplies the action. This undermines the otherwise good decision to give Muffle and Stop equal visual weight. The phase system already has a useful question — "What keeps bringing it back?" — and separate optional hint/answer levels.

Recommendation: distinguish objective, evidence and solution. State the unfinished problem on the default surface. Let a watched return and the cord/bell relationship supply causal evidence. Provide the exact command/action when the player requests the explicit hint. Keep the clear labels on controls, let an early correct deduction work, and never force an intentional mistake to unlock progress.

POSTMAN similarly labels both addresses with their story roles before the recipient decision. The labels are excellent for usability but weaken the proposed "the next person is you" discovery. Explore a small, honest change in when the explanatory copy appears, preserving recognizable addresses, the guest OS identity, access to Mara's original note and explicit help. Do not make a user guess a hidden address or add arbitrary trials. This is a tradeoff to test, not proof that the current copy must be removed.

## Experience 2: CANVAS has real data operations but little required agency

The data contract is good: the draft owns its source; a retained full negative supplies the actual writing; delivered snapshots are independent. Keep those properties.

The correct default route can nevertheless finish this app with Lift the writing → Compose in POSTMAN. Mist, reframing, paper and layout are optional. An automated short route does not prove boredom, and an accessible direct action is not inherently bad. The concern is that the player may feel they merely approved the next instruction.

Candidate direction for Claude to improve or reject: make the preservation of writing and revelation of the photograph one legible editing moment. Show which captured material is selected and what will move to paper; preview how changing mist affects the actual picture and retained marks. Direct manipulation of the real layer may be supported alongside keyboard selection/preview/confirmation with the same choices. The final composition must use these exact edits.

This proposal alone is **not** a new puzzle or proof of innovation. Do not replace one click with a required drag to a single correct target. Compare it with a better alternative that gives a perceptible choice/consequence, then implement the stronger bounded option. Protect a quick, understandable route; no second wipe puzzle, pixel hunt, invented handwriting or new fiction.

## Experience 3: the final release can happen behind the applications

**Confirmed overlap; whether the current ending satisfies a person remains untested.**

On the independent standard pointer route at 1366×768, immediately before Finish session, the hand's world point is about **(669.6, 306.2)**. `elementFromPoint()` reports **window-terminal** there. The letter/receipt windows also cover much of the figure region. The release runs on the underlying glass for 1400 ms. Screenshots at 700 ms and after settling show the room clearing around a stack of applications, with the important hand location obscured.

The state transition is correct and the delivered letter is real. The presentation gives insufficient assurance that the player sees the presence let go.

Improve the final staging while respecting the window-as-world contract. One option: the receipt offers a clearly named, player-invoked view of the **same live glass** before Finish; the release can be witnessed there while the real letter stays available. Another: an explicit, reversible overview of the actual desk. Claude should compare and may propose better.

Do not silently rearrange, close or minimize every window, move the hand to a newly convenient place, capture recursively, or show a decorative duplicate with unrelated state. Do not require an extra reveal action just to gain a receipt. Finish still commits once immediately; cancellation, reload and reduced motion must show the same honest final state.

## Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| Oldest mail can be removed while the final acknowledgment references it | Retain the essential delivery independently of bounded incidental history | Ordinary experimentation must not erase the finished case on reload |
| Reload keeps `lost` writing but drops Undo; copy still promises Undo | Offer the real available recovery and preserve unrelated edits | The explanation must lead to an action the player can perform |
| Minimum-size TERMINAL hides Bell actions; ECHO clips its capture status | Responsive internal layout or justified minima, tested at the actual limits | A resizable OS needs usable resized apps |
| The opening job strip names Stop the call | Default objective/question, causal evidence, optional explicit answer | Support understanding while leaving a discovery to make |
| CANVAS's shortest route is two supplied actions | A legible, source-based editing decision with an immediately visible consequence | Improve agency without adding chores |
| Recipient role is explained before it is considered | Evaluate progressive context and optional help using the real note and guest identity | Balance comprehensibility with the intended recognition |
| The release happens under a stack of windows | Let the player witness the same live presence while retaining their letter | Make the actual climax perceptible |

## What the next implementation should finish

Keep four programs and the current visual identity. First repair retention/reload/minimum-size defects. Then resolve the guidance tradeoff, strengthen the CANVAS editing moment and stage a visible final release. Review the handoffs together so they do not add duplicate confirmations, tutorial overlays or contradictory labels.

The narrative contract remains Mara as sender, guest as the next person, one actual picture/note, a single TERMINAL retry/bell producer and an immutable delivered letter. No invented death, extra antagonist, new mandatory app or new branching campaign. English product copy, PC-first behavior and the preserved paper-bridge entry remain.

## Acceptance checks to add where they prove a real requirement

1. Reach a finished case, exceed the mail-history cap with valid UI actions, reload: same run, acknowledged letter, receipt and finished phase remain. Also protect a valid intended delivery before finishing. Check limits remain bounded.
2. Lose captured writing, reload, reopen CANVAS: every recovery instruction names an available action; recover the actual captured lines while retaining chosen paper/layout/frame. A source with no writing cannot produce any.
3. Resize each app to every allowed minimum and inspect session, Bell inspector, Under the hood, ECHO Live/Captures/confirmations, CANVAS recovery/reframe and POSTMAN draft/receipt. Include pointer hit tests, scrolling, keyboard reachability and screenshots. Do not count background-window overlap as a broken active control.
4. Fresh route without optional hints: default surfaces give a clear objective but do not print the exact Bell solution before investigation. Early correct actions still work. Requested exact help remains available.
5. Demonstrate CANVAS's selected editing mechanism with a short real interaction and actual before/after artifact data; explain the choice and consequence rather than calling extra clicks a puzzle. Check keyboard and reduced-motion equivalents.
6. At the three PC sizes and with unusual window placements, verify that the proposed final presentation can show the actual hand/figure release. Also test immediate reload during the release, cancellation and reduced motion. No duplicate finish, new delivery or state reversal.
7. Repeat A delivered → B edited and source discarded → letter reopened. The ending and all previews must refer to the real delivered snapshot.

## Evidence and remaining uncertainty

Ignored local artifacts, not committed submission evidence:

- `output/playwright/codex-v4-review/checks.json` and the nine check logs.
- `output/playwright/v4-review.json` and `v4/` screenshots: the re-run of the existing 22-state route.
- `output/playwright/codex-v4-review/probes.json`: both reload defects, loaded bundle IDs and final overlap.
- `output/playwright/codex-v4-review/minimums.json`: pointer-resized minima and real-keyboard lost-writing recovery.
- `output/playwright/codex-v4-review/finish-details.json`: the final transcript's DOM geometry; this probe did not reproduce a text-layout clipping error in that default final state. Do not turn an uncertain screenshot impression into another confirmed defect.
- Diagnostic screenshots alongside those JSON files show the lost-writing panel, minimum windows, the release at 700 ms and its settled state, and the fresh case after eviction/reload.

No new human observation, screen-reader run, audible-sound verification, physical touch test, real background-tab test, cross-browser check, CPU-throttle rerun or measured first-use/demo time is claimed. The existing "keyboard-only" regression uses programmatically focused elements at several steps; it proves those controls and handlers can achieve the same outcome, not a fully audited natural Tab traversal or human comprehension.

The first-visit protocol in `.kiro/specs/os-case-v4/first-visit-protocol.md` is still unrun. A brief actual non-programmer visit should tell us whether the person can explain why the call returns, what CANVAS changed and who received the letter. An automated agent does not substitute for that evidence. It is useful to implement the confirmed repairs now; no person needs to be invented or silently counted as a playtester.

Official hackathon pages and comparative winners were not rechecked in this technical review. The earlier verified obligations remain references to revalidate before submission, not a fresh eligibility or prize claim. No app source, purchases, account settings, Git push or submission were changed by this review.
