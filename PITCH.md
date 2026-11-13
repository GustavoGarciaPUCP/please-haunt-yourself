# PLEASE HAUNT YOURSELF — planned short submission video

November 6, 2026, using pitch-timebox. Updated through November 9 for the built v8 route and independently checked evidence. **Capture plan, not a recording.** The four programs and the final acknowledgment now exist, but the video has not been recorded or rehearsed. The historical shared-show plan is preserved in [PITCH_Shared_Show_Historical.md](docs/development/PITCH_Shared_Show_Historical.md).

## Time, speakers and evidence boundary

**Official video constraint:** less than three minutes; judges need not watch beyond three minutes. Public YouTube upload and working-device footage are required. No separate live-stage/Q&A allowance is assumed. [Official rules](https://kiroween.devpost.com/rules)

**Official refresh, November 9:** authenticated Devpost data confirms a December 4, 2026 deadline at 17:00 Lima and five criteria weighted 20% each: Potential Impact, Technological Implementation, Design, Innovation/Idea and Presentation. Costume Contest uses the same criteria. See [review31](docs/development/31_Official_Category_And_Judging_Refresh.md) for current sources and the release checkpoints, including the requirements for public access and licensing. This is not a recorded demo or completed submission.

**Production target:** approximately 2:50 of content, export at or below 2:55 for margin. **Presenter:** the solo participant; English narration/captions. The game may take longer than the video. The proposed first-use target is 6–9 minutes; the known main route should be demonstrable with real actions in approximately 110 seconds. These are unmeasured design allocations.

**Current reality (v9, Kiro IDE, November 10; v8 was independently reviewed by Codex on November 9):**

- **Built:** every gameplay row below, on HAUNT OS (taskbar, windows, desktop files).
  - TERMINAL: the call, the bell, and Muffle the bell versus Stop the call. The milestone presses the hand and writes the note in the mist on the desktop glass.
  - ECHO: a full-image capture with a movable photo frame.
  - CANVAS: Lift the writing, and "The photograph keeps" (handprint, figure or both), previewed from the capture. Also "Not the words." when the mist is cleared too early, then Recover the writing.
  - POSTMAN: Reply returns to Mara; delivery to guest@haunt comes with its receipt.
  - TERMINAL again: Finish session. The receipt shows the live glass where the hand is pressed, beside the delivered letter, and the hand lets go there.
- **Measured so far:** a scripted v4 route with three deliberate mistakes took 52.3 s of automated input, recorded as screencast frames in `output/playwright/v4-route/`. That is not a play time and not the submission video. The 110-second gameplay block below is still an allocation; v5 added one optional choice in CANVAS and no extra step.
- **Evidence:**
  - **v8, independently checked by Codex:** 161 unit tests, all 93 recorded outcomes in 14 browser checks, and the 210-state three-PC-size route with zero reported audit/page errors. Additional long-input completion and an isolated adverse route in installed Edge also passed. [Review30](docs/development/30_V8_Functional_Checkpoint_And_Typing_Review.md) confirmed the earlier repairs and recorded two bounded polish items: redundant typing work and an active-frame marker inconsistency after close.
  - **v9 repairs both** (Kiro record in [v9 tasks.md](.kiro/specs/fluid-typing-v9/tasks.md)). It passes 166 unit tests and 106 recorded outcomes in 16 browser checks, and the 210-state route has 0 problems.
  - The case completes and retains its data on these tested routes. No human has played the current build. These checks are not a measured demo or human play time.

**Narrative source:** [The Unsent Letter contract](docs/development/23_The_Unsent_Letter_Narrative_Contract.md). Mara's unfinished job must deliver an actual picture and note to the next person at the desk, the current guest. TERMINAL retries, ECHO retains the impression, CANVAS finishes the letter, POSTMAN delivers it locally and the matching receipt closes the original job. Do not substitute an unrelated recipient or a different cause for the bell in this narration.

**Independent readiness check, November 10:** [review33](docs/development/33_V9_Independent_QA_And_First_Visit.md) confirms v9's 166 unit tests, 106 browser outcomes and 210-state PC route. One fresh no-solution agent completed and explained the case; that is a simulation, not human play or a timed rehearsal. The source build failure from that review was repaired in the subsequent Kiro IDE session.

**Build repaired, November 10 (Kiro IDE, prompt10):** the current tree builds again. The rebuilt files are byte-identical to the served v9, and a clean install of the declared dependencies type-checks, builds and passes the 166 unit tests ([reproducible-build-v9](.kiro/specs/reproducible-build-v9/tasks.md)). The repository and playable build are now public. The video and Devpost materials still need to be completed.

**Independently verified after prompt10:** [review34](docs/development/34_V9_Build_Repair_Independent_Verification.md) confirms the fresh build, 166 tests and 22 targeted browser outcomes. Its seven files match the served v9 byte for byte. The review closed the build blocker. Recording and timed rehearsal remain pending.

## Word budget

The pitch-timebox heuristic of 130–150 words/minute minus a 10% allowance gives approximately 341–394 words over 175 seconds. Use less for this screen-led demonstration. Row caps total **295 words**. The draft narration below is **257 words** (the v4 count of 259, minus one word each in the CANVAS and TERMINAL rows rewritten for v5; every row is within its cap), leaving silent viewing time. This is not measured speech duration. Rehearse and cut before speaking faster.

## Timing table

| Start–End | Speaker | Section | Word cap | Draft narration and real capture instruction | Handoff |
| --- | --- | --- | --- | --- | --- |
| 0:00–0:12 | Solo participant | Hook | 20 | **Draft narration:** “An old desktop keeps restarting an unfinished letter. Four programs can finish it, if I discover who should receive it.” Open on a real in-game anomaly, then the readable desktop. No concept art standing in for gameplay. | Show the original request. |
| 0:12–0:25 | Solo participant | Audience and promise | 25 | **Draft narration:** “Please Haunt Yourself is a short Halloween mystery for people who enjoy technology, including people who do not code.” Establish the fictional desktop and one case. No lecture listing four tutorials. | Demonstrate the return. |
| 0:25–0:45 | Solo participant | TERMINAL: stabilize | 35 | **Draft narration:** “Every time Mara's session tries to finish, the bell rings and the same minute starts again. Muffling the bell changes nothing. I stop the call, but the letter still waits.” Show a real return, the muffled return and Stop the call with TERMINAL's confirmation. | Let it finish; follow it to the glass. |
| 0:45–1:10 | Solo participant | ECHO: obtain evidence | 45 | **Draft narration:** “It finishes once and presses its hand to the glass, its note written in the mist. ECHO sees the glass behind it, so I frame the hand, wipe beside the palm and capture. The full image is kept; the frame is my picture.” Show the reveal, ECHO framing the hand, a wipe, the chips and the Captures view with the frame. | Use this capture: CANVAS opens on it. |
| 1:10–1:30 | Solo participant | CANVAS: make it legible | 35 | **Draft narration:** “CANVAS lifts Mara's writing out of the mist, word for word. I choose what the photograph keeps: the handprint, the figure behind the mist, or both. My picture and her note become one letter.” Show Lift the writing, point at the three presets of The photograph keeps, choose one and show the finished letter. Optionally show “Not the words.” and Recover the writing. This is the content later delivered. | Compose in POSTMAN. |
| 1:30–1:50 | Solo participant | POSTMAN: resolve correspondence | 35 | **Draft narration:** “Mara wrote it in 1987. Replying to her just sends it back. The note is for the next person at this desk, so I send it to guest, and its receipt arrives with it.” Show Recovered · 1987, the returned message, then Guest Inbox with the same letter and the receipt. Never imply real email was sent. | Return to the request. |
| 1:50–2:15 | Solo participant | TERMINAL return and payoff | 40 | **Draft narration:** “The receipt goes back to the job that started all this. Finish session. Beside the letter I sent, the hand on the glass lets go, and the prompt is mine again.” Show Return to the request, the receipt card with the live glass and the letter, Finish session and the release in the card. End on “The glass is clear.” and one normal command (`help`). | Show how the implementation was developed. |
| 2:15–2:40 | Solo participant | Actual Kiro contribution | 45 | **Draft narration:** “I worked in Kiro's spec workflow: requirements, a design that kept or rejected each proposal, and tasks marked done only after their checks ran. Here are the specs, the four programs’ files and the checks.” Use `.kiro/specs/os-case-v4/` and `.kiro/specs/playability-v5/`, and one real check run. Keep the Codex/Kiro attribution from docs/kiro-usage.md. | Return to the final desktop. |
| 2:40–2:50 | Solo participant | Close | 15 | **Draft narration:** “The letter arrived. I was the next person at this desk.” Hold the final desktop with the clear glass and the letter in Guest Inbox. Do not replay the haunting automatically. | End narration. |
| 2:50–2:55 | None | Export margin | 0 | Up to five seconds of transition/final-frame margin. Keep the whole exported video below three minutes. | End video. |

The gameplay block is **0:25–2:15 = 110 seconds**. Its purpose is to show one connected case, not four app trailers. Keep the request/artifact/receipt consistent across shots so the viewer can follow what changed. The glass scene is an intermediate reveal and a final payoff, not repeated filler after each app.

## Capture and fallback

No final recording or tested backup exists yet. This event uses a submitted video; there is no invented live-stage fallback. After the integrated route works, capture the real game locally and keep the raw footage and a separate local backup. If a capture fails, repair and recapture.

A known route must execute actual model states; no demo-only bypass or pre-solved fake completion. If editing removes thought/waiting time, keep the discontinuity honest and do not describe the result as an uncut 110-second playthrough. Speeding up an interaction or replacing the ending with a rendered movie cannot establish normal working behavior.

Record from a fresh desk (a private window, or Start the case over…) on the current build, checked as build v9 in About. The mistakes shown on screen (muffle, clearing the mist, Reply) must be real actions in the same run. Keep TERMINAL's receipt card in view for the ending. Public upload, source publication and submission remain separate actions; this document performs none.

## Questions and evidence to prepare

These are preparation prompts, not evidence that there will be a live Q&A.

| Criterion | Likely question | Evidence needed / honest answer shape | Owner |
| --- | --- | --- | --- |
| Audience/value | Why would someone play this rather than watch a horror clip? | Demonstrate understandable experiments, different consequences and a retained result; no invented user study or audience size | Solo participant |
| Kiro implementation | Which delivered changes did Kiro actually produce? | Genuine relevant specs/source/checks and contribution record, distinguishing Codex review from Kiro generation; no credit-spend claim | Solo participant |
| Design | Can a non-programmer follow the four-app chain, and can the scene be interrupted? | Real first-use observation when available, keyboard/reduced-motion route and executed recovery/lifecycle checks | Solo participant |
| Innovation | Are the extra programs necessary, and how does this differ from existing desktop games? | Show distinct native operations, the actual transformed data and removal-test results; no world-first or winner-standard guarantee | Solo participant |
| Presentation | Does the original problem really end, and can you show another choice? | Fresh-state complete route, matching receipt, restored function and a separate reproducible alternate/wrong-action recovery | Solo participant |

## Rehearsal checklist — pending, not completed

- [x] All four native contributions and the return to the original request work in the real build (automated checks, November 7; not yet seen by a person).
- [ ] First-use playtest recorded separately; actual duration and comprehension findings are stated without treating an agent as a human.
- [ ] Known route timed from a fresh state: actual duration pending.
- [ ] One wrong-source/route intervention and recovery timed separately: pending.
- [ ] Saved/reloaded continuation preserves the chain and does not falsely mark the case complete.
- [ ] Timed video rehearsal 1: actual duration pending; no row is rushed or skipped.
- [ ] Timed video rehearsal 2 after edits: actual duration pending; export below 2:55 target.
- [ ] Silent viewing/captions communicate cause, chosen action and consequence.
- [ ] PC footage shows readable UI, real window movement and the actual retained artifact.
- [ ] Kiro contribution words match delivered files and docs/kiro-usage.md.
- [ ] Raw recording and local backup exist and play correctly before upload.
- [ ] No concept art, placeholder app, fixed victory movie or hidden shortcut is presented as implemented gameplay.

See [the timing, winner-reference and integration review](docs/development/22_One_Case_Four_Programs_And_A_Three_Minute_Demo.md) for current source checks and the four-app scope decision.
