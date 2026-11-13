# Consistency across the four programs

November 7, 2026. Second design pass requested by the participant after review24. This is an additive clarification of prompt04: retain all previous findings, fixes, OS direction, story and completion requirements. It does not implement v4, rerun the application tests, establish human comprehension or claim a new Kiro execution.

## The consistency problem

The proposed pieces can each work while the whole still feels inconsistent: a full negative can make framing meaningless; changing a draft can accidentally revoke a real delivery; Reply can behave like Send; resizing a window can change a saved picture; deleting a tray item can break a letter in another app; or an intermediate success can look like the final resolution.

The aim of this pass is not more programs or puzzles. It is to give the same objects, words and actions the same meaning from the desktop through the final receipt. Contract23 governs the story; review24 still governs the observed v3 defects; this document clarifies the proposed v4 interactions/data where previous wording left room for contradictory implementations.

## One meaningful decision per tool

| Tool | Decision or operation it owns | Consequence carried forward |
| --- | --- | --- |
| TERMINAL | Distinguish silencing a symptom from stopping the request's automatic repetition | The call actually stops; the letter is still pending and the same session can finish its impression |
| ECHO | Identify the relevant source, retain that moment and select a photographic view of the presence or its trace | An immutable capture from that source, plus an explicit chosen frame |
| CANVAS | Separate the captured writing and compose the actual picture/note without destroying the message | A readable letter draft whose visual content reflects the player's choices |
| POSTMAN | Distinguish sender from intended recipient and deliberately send that letter | A committed local delivery to Guest Inbox or a recoverable returned attempt |
| TERMINAL return | Verify the real delivery and deliberately finish the original session | One acknowledged request, release of the glass and normal app behavior |

Do not require an incorrect attempt, a tutorial visit or a prescribed observation order. A player who understands early may act early. Four tools do not require four unrelated riddles. The restoration/composition step can create expressive authorship without pretending every handle is a new deduction.

## 1. A full capture does not make the photo frame irrelevant

Retain review24's preferred full layered negative plus independent photo crop. Make the two representations visible and understandable: the full capture preserves source material; the photo frame decides which part becomes the picture in the letter. Both previews must refer to the same captured moment.

The requested picture is of the last impression, not an arbitrary blank rectangle. A handprint, partial reflected figure or another legible trace of that same captured presence can be a valid subject. Do not require the whole hand, a perfect face and all five note lines inside one photo rectangle. A frame containing only empty mist should say so immediately and be reframable from the retained full capture, without another exposure.

Use visible subject feedback such as Handprint / Figure / Only mist, not hidden coverage percentages the player must hunt. The implementation may use geometry, but it must support a readable preview and several valid compositions. The note is a separate captured layer that CANVAS can work with; changing the photo frame cannot destroy its data.

A wrong source remains a real error: a session-window capture does not acquire glass writing from another source. A later capture does not mutate the earlier one. Original limited v3 prints remain limited after migration. This clarification does not license inventing missing content or discarding the source distinction that makes ECHO interesting.

## 2. Freeze a small vocabulary and honor it

Choose the exact English labels during implementation and use them consistently. Suggested meanings:

| Word/action | Meaning | Must not secretly do |
| --- | --- | --- |
| Pause preview | Freeze the viewed live link | Stop TERMINAL's repetition or finish its job |
| Muffle | Silence the bell and its corresponding ring evidence | Remove the underlying retry |
| Stop repeating / stop the call | Disarm automatic reissue of the unfinished job | Deliver or acknowledge the letter |
| Capture | Retain an immutable record of the selected source | Send a letter, complete the case or later read a changed source |
| Use this capture | Select the input for a letter draft | Certify delivery or overwrite another finished letter |
| Photo frame | Choose a view within that retained capture | Recapture the world or discard the stored writing layer |
| Save draft | Preserve the current editable letter revision | Send it |
| Compose in POSTMAN | Open a mail draft with that letter | Send or deliver without a Send action |
| Reply | Prepare a draft addressed to the sender | Immediately send, return or fail a message |
| Send | Commit a delivery attempt using the current address and letter | Decide the address silently or modify the original note |
| Return to the request | Open TERMINAL with the actual receipt available | Pretend a different version was delivered |
| Finish session | Accept that matching delivery and close the original job | Merely close the app window or delete the player's letter |

Thus the earlier phrase Reply to sender produces a return means **sending the reply to that route** produces a return. Clicking Reply alone prepares a draft. This keeps POSTMAN understandable as a mail application and still preserves the intended wrong-route experiment.

Prefer a small player vocabulary: Capture, Picture, Writing, Letter, Delivery. Negative, format/version identifiers, PIDs and hashes may live in a secondary inspector. Do not turn the main path into a lesson about internal data formats.

## 3. Sent content is a snapshot; an editor contains a draft

This closes an ambiguity in the earlier stale-receipt requirement.

1. CANVAS makes draft revision A.
2. POSTMAN's Send commits an immutable snapshot of A to the selected local inbox and creates receipt A for that exact delivery.
3. Later edits create draft revision B. They do not rewrite the letter already in Guest Inbox and do not retroactively revoke a valid receipt for A.
4. Receipt A cannot certify delivery of B. It still certifies the real delivery of A.
5. If the player explicitly sends B as a replacement before finishing the session, record that replacement and make the intended delivery/receipt clear. Do not infer replacement from every brush, crop or Save.
6. After the original session is finished, opening or editing a copy cannot automatically reopen it or bring the ghost back. Replaying the case is a separate explicit action.

Bind the pending job to its explicitly chosen committed delivery, not to whatever draft version currently happens to be displayed by CANVAS. A stale/unrelated receipt must fail when offered for another delivery; an honest previously delivered snapshot must not fail merely because the player edited a new draft copy.

If a before-acknowledgment Recall/Replace action is implemented, make it explicit, invalidate its own delivery/receipt consistently and keep the draft recoverable. Do not confuse archiving/deleting a personal inbox view after completion with undoing historical delivery and restarting the haunting. Avoid building a general mail synchronization system; only the case's small local transaction needs this behavior.

## 4. Passing an object between apps cannot create fragile links

The desktop file, ECHO tray, CANVAS preview, POSTMAN draft, Guest Inbox and TERMINAL receipt must refer to recognizable versions of the same chain.

- Opening a captured object passes its identity/data, not a new generic placeholder.
- A draft must retain what it needs from its source capture. Discarding a tray thumbnail cannot silently remove a picture from an already composed letter. Use retained references or an embedded snapshot; do not require a visible duplicate app to stay open.
- Retaking a picture creates a new capture. Replacing a draft's source is an explicit edit with visible before/after and Undo; it does not mutate previous deliveries.
- One delivery commits its inbox snapshot and receipt together. Double-clicking Send, remounting a view, replaying a cue or reloading must not create duplicate deliveries.
- Metadata and previews must agree. The content shown in Guest Inbox is what its receipt identifies, not a newly rendered current draft.
- If storage is actually unavailable, the case may still work in memory, with a concise Session only status. Do not claim Saved locally when no durable save succeeded. This is an error-state design, not an extra warning imposed on every player.

Use one authoritative case/data contract with views derived from it. This does not require a new framework, a monolithic rewrite or adding a backend.

## 5. One spatial world, two kinds of coordinates

Define the render/input relationship in the v4 design, rather than allowing each app to invent it:

1. The wallpaper and case's glass surface form the shared world.
2. App windows, menus and actual file controls stay usable above it.
3. ECHO's Glass source projects that shared surface, not a recursive screenshot of ECHO and every window covering it.
4. A retained capture records the selected source at its own dimensions and moment. Its photograph frame is expressed in that capture's coordinates.

The fixed trace remains fixed in the world when a window moves. Resize/maximize changes the live view or available editing space, not the retained source or an existing letter's semantic content. A capture made at 1440×900 and reopened at 1920×1080 must retain the same writing/picture, even if the presentation is scaled.

Do not claim a surface is in front of every app while implementing it as a completely different object behind ECHO. A presentational tint or brief accent can be separate, but the capturable hand, writing and mist read the same model. Keep the browser/game boundary and window inputs clear; no real OS capture or camera is involved.

Keep normal window bounds for restore and same-page reopen; clamp them when the viewport changes. Reload may reasonably arrange windows for a different screen, but that layout policy cannot reset story progress or rewrite saved captures. Arrange windows is a layout action, not a case reset.

## 6. The story's clocks and states must be readable

Mara's 31 October 1987 timestamp identifies an archived session. The desktop's current guest/time is a different context. If a frozen/repeating clock is shown, label it as the recorded minute; do not suggest the player must wait a real minute or that the browser's actual clock changed. The known-route timing budget does not justify compulsory waits.

The guest identity should be present naturally in the OS profile/prompt, so the note's next person at this desk has a visible referent. No real login, actual personal information or external identity account is required.

Use the same phase meaning in the job file, notification, app captions and final screen:

| Phase | What is true | What is still pending |
| --- | --- | --- |
| Repeating | The old job reissues on failed finish | Stop automatic repetition and obtain the last impression |
| Call stopped | Retry is disarmed; the current impression can finish | Capture/finish/deliver the letter |
| Capture retained | Source data exists and can be inspected | A finished letter and delivery |
| Letter draft ready | Picture and original writing are composed | A deliberate valid delivery |
| Valid delivery / ready to finish | Guest Inbox contains the complete intended letter; its matching receipt exists | Explicitly finish the original session in TERMINAL |
| Session finished | Matching delivery acknowledged; glass released | Only optional inspection, copies and replay |

Do not use the same Complete, Recovered or 100% badge for Call stopped and Session finished. A wrong reply cannot set retry back on or ring the old bell merely because something was returned in the mail UI. Its local return feedback belongs to POSTMAN.

An incomplete stored message, if the implementation permits one, is not a valid completed delivery for this job. Show its missing content and a recoverable path to the draft; do not put the case into Ready to finish merely because something was saved in an inbox. A later corrected attempt reuses the valid earlier source/composition work.

Sending alone should not bury the climactic release behind another app. Return to the request opens the matching receipt; a clear Finish session action commits acknowledgment immediately and stages the short final release. Closing a window before that preserves Delivered / waiting to finish. Animation completion never decides whether delivery/acknowledgment is valid.

## 7. Recovery must preserve successful work

Allow programs to be opened out of order. With no input, show a real empty/draft state and a contextual path to the needed object, not a fake finished artifact or an access-denied puzzle.

Make Undo local to the active editing task. Text fields retain normal text undo. Image edits, source replacement and draft composition have explicit transaction boundaries. A window move is layout; a paper edit is content; an acknowledged delivery is case history. A generic Undo must not unexpectedly restore old PIDs, erase a sent letter or reopen a solved case.

Use a separate case-run identity for explicit Replay/Start over. Reload continues the same run. Replay can preserve a deliberately archived keepsake but must not allow its old receipt to finish the new run. Explain what an actual reset removes; never clear unrelated browser storage. These are refinements of the existing reset/migration requirements, not another required game subsystem.

Old v3 cropped prints remain limited and inspectable; the migrated case remains at its real partial stage. A new exposure can obtain the missing full source without making the player repeat the solved call. Never relabel old limited data as a complete new negative.

## Visible continuity and the final reward

The player should recognize the same work without reading object IDs or a wall of mission text. Keep the actual capture thumbnail visible when CANVAS opens it, the actual finished-letter preview when POSTMAN composes it, and that exact delivered image/writing in Guest Inbox and the receipt's preview. The actual data, source name and restrained visual treatment carry the connection; a generic attachment icon or substituted postcard does not.

A contextual handoff opens the receiving app with its relevant object selected and a useful control visible. It does not close the source app, discard unfinished edits, reposition every window unnecessarily or demand manual file hunting to recreate the connection. Use the existing window motion to carry one coherent entrance, not a flying thumbnail followed by a delayed second interface reveal. Interaction remains available; reduced motion uses the same object immediately.

The dramatic thread can follow one understandable question per phase: what keeps returning; where the last impression went; what the writing says; who the next person is; whether the delivered letter lets this session finish. Those are pacing questions, not five mandatory overlays or reasons to block an early deduction. Help can expose the relevant question when needed; the normal desktop remains a desktop.

The final composition should first make the player's actual delivered letter recognizable, then release the same presence that occupied the glass. It may acknowledge the cleared region, selected hand/figure framing and composition by displaying those real choices. Do not manufacture a psychological personality analysis or a pre-rendered congratulations image. The revelation that the guest is the next person rewards the ongoing job; the tangible letter rewards the player's authorship even if they inferred the recipient earlier.

After release, the ordinary prompt and recovered tools provide a quiet contrast. The letter remains inspectable as sent content. The game does not need another task, jump scare, browser takeover or automatic restart to make the ending feel bigger. Different replayed compositions can yield different actual keepsakes without inventing another plot.

## Before / After / Why

After is a proposed consistency rule for v4, not an implemented result.

| Before / possible ambiguity | After | Why |
| --- | --- | --- |
| Capturing a full source seems to make framing pointless | A retained full capture supplies material; the chosen picture frame visibly changes the delivered image | Preserve authorship without demanding one pixel-perfect crop |
| Reply may be coded as immediate delivery failure | Reply prepares an address; Send performs the attempt | Native application vocabulary remains predictable |
| Editing the current draft can invalidate a real sent message | Immutable delivered A, editable draft B, receipt A certifies only A | Protect both data integrity and a finished story |
| Deleting a tray item breaks a downstream letter | A draft/delivery retains its necessary source snapshot | Progress survives ordinary app cleanup |
| Maximize/resize accidentally changes a saved picture | Live world coordinates and captured artifact coordinates are separate | Familiar OS behavior cannot corrupt content |
| Sending triggers an unseen ending behind POSTMAN | Receipt returns to the original request; Finish session owns the climax | Close the narrative where it started, with player agency |
| A normal post-game edit brings the ghost back | Finished case is stable; editing a copy/replay is explicit | Reward does not become punishment |

## Cross-app acceptance scenarios

These are paper-defined future checks, not tests executed by this document:

1. Correct source -> chosen hand/figure frame -> separated original note -> letter A -> Guest Inbox A -> receipt A -> Finish session: all views agree on content and phase.
2. Wrong source -> stored wrong capture -> clear feedback -> new exposure: previous work is not silently rewritten, and no note appears from another source.
3. Capture with a narrow photo crop -> CANVAS opens the actual full negative -> reframe/separate writing -> complete letter: no missing words are invented and no pixel hunt is needed.
4. Reply to Mara -> draft only; Send -> local returned attempt: no delivery receipt, no call rearmed, all capture/composition work remains.
5. Send A -> edit draft B -> inspect Guest Inbox: A unchanged; receipt A still matches A, never B. Explicit replacement is the only operation that changes the job's intended delivered revision.
6. Finish A -> edit a copy or archive a personal view -> reopen TERMINAL: the session remains finished and the final recognition is archived, not another live haunting.
7. Capture -> create letter -> discard its tray entry -> reopen letter: required picture/writing remain intact or the UI explicitly prevents the destructive dependency change; no broken placeholder.
8. Capture at one PC size -> maximize/resize/reload at another: same source/writing/crop content and same case phase, with safe presentation bounds.
9. Reload after Send or Finish session: no duplicated message, receipt or acknowledgment. A hidden/cancelled cinematic resumes as the correct state without reapplying gameplay effects.
10. Explicit replay -> new run -> offer archived receipt: it cannot close the new request.
11. Full keyboard route reaches the same valid letter/delivery outcome as a pointer route, including selected-region/crop operations; no success is granted merely by pressing an accessibility button.
12. Real storage failure during play -> concise Session only state, playable coherent in-memory delivery, no false promise that a reload will retain it.
13. Incomplete message attempt -> no Ready to finish state; visible missing-content feedback -> corrected draft/delivery without repeating the already solved call.

## Integration instructions for Opus

Keep all review24 and prompt04 content. Implement this as the consistency contract for their proposed v4; do not start a fifth app, a new plot, an email backend or a settings simulator. In the v4 design, record the object lifecycle, action vocabulary, render planes and phase meanings once, then derive the four apps from them.

The earlier rule that a stale receipt must not complete another revision is preserved: **receipt A cannot certify B, but it still certifies the immutable delivery of A**. This clarifies earlier wording; it does not make edited drafts and delivered snapshots the same object.

If a suggested mechanism is improved, update the affected contracts and show the resulting action sequence and artifact. Do not claim these paper scenarios passed or that Opus/Codex reached consensus before a real implementation review. The next proof remains the complete playable case and observed first use.
