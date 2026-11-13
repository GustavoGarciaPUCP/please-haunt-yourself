# The Unsent Letter — one story across the desktop

November 6, 2026. Codex's narrative-closure review, requested by the participant before the next Kiro implementation. This document fixes the default story for the revised prompt03. It is a design contract and paper walkthrough, not implemented gameplay, a human playtest or Opus's approval.

## What the review found and settled

The previous design had a useful program sequence but still deferred the actual request, message and recipient. It also offered competing causes for the bell: source updates versus an unfinished request being restarted. CANVAS could consequently become an arbitrary processing step, and a glass apparition could look like a second unrelated threat.

This contract supplies one default explanation, actual fictional content and a consistent ending. It supersedes conflicting story examples in reviews20–22. Their PC, interaction, motion, timing and evidence requirements remain relevant. The previous exploratory prompt is archived as earlier Kiro brief 03; the consolidated root prompt is the current instruction.

## The story in one paragraph

A restored Halloween workspace contains Mara's unfinished session from 31 October 1987. Its last job was to leave a picture and a note for the next person who used that desk. The session keeps restarting because the delivery was never acknowledged. Its apparition speaks through program output and tries to complete the job, but each new attempt starts the same minute again. You stop the repetition, capture the final impression it can now leave on the desktop glass, finish the letter from its actual picture and writing, and deliver it to the current desk's inbox. The next person is you. A real local delivery receipt lets TERMINAL close the original request. The hand releases the glass; the working desktop and your chosen keepsake remain.

## Facts the fiction must keep consistent

- **Mara** is the fictional former user already named by the existing encounter. Her retained line is `I'll finish in a minute.` This review does not invent how she died, or assert that she died at all.
- **The apparition** is the visible remnant of her unfinished software session. It is the same entity in TERMINAL, ECHO's view and the glass scene. It is not a different ghost arriving after every repair.
- **The original job** is `Deliver the final picture and note to the next person at this desk.` Both pieces matter because that is the task the session was left doing, not because four app icons must turn green.
- **The bell** accompanies a failed finish attempt that reissues the job while automatic retry is armed. TERMINAL's request model produces that event. A video frame, ECHO preview playback and opening a window do not produce additional retries.
- **Stopping retry** is genuine progress but does not deliver the letter. The current run can finish presenting its final impression instead of being replaced by another run. That is when the apparition reaches the desktop glass.
- **The picture** is a retained image of the in-game scene/presence and the region the player cleared. It is not a camera image of the player or a screenshot of their real computer.
- **The note** exists from the start as content of Mara's unfinished job. Its writing is present in the layered scene/print; it is not generated after a successful click or inferred by an unimplemented OCR service.
- **The recipient** is the next user of this fictional desktop: the current `guest` session. Mara is the sender. Replying to Mara is not delivering the message to its intended recipient.
- **Delivery** means storing the finished letter in the current guest's local fictional inbox and producing a matching receipt. It does not mean contacting another person, proving someone read a real email or obtaining an answer from the dead.
- **The ending** follows acknowledgment of that exact delivered letter. Silence, a paused picture, a stopped process, an app visit or an animation finishing cannot substitute for delivery.

## The actual letter

Default original content, available in the source data from the beginning:

> FOR THE NEXT PERSON AT THIS DESK
>
> This picture is yours.
> Keep what matters.
>
> — Mara, 31 October 1987

The loop's `I'll finish in a minute.` is the old session's repeated status, not the complete letter. Finishing delivers something new relative to that repetition: the original note plus a picture shaped by the player's intervention.

The player may choose the retained framing/cleared region and, after resolving the job, whether to keep a local souvenir. Do not require a fixed drawing, exact animation frame, password or verbatim typing. A no-keepsake choice can remove the optional personal copy after acknowledgment; it cannot erase the delivered record and still pretend the same receipt refers to an intact letter. If the implementation cannot explain two endings cleanly, ship one honest complete ending and make later artifact deletion an explicit separate action.

## Reveal the story through use

The author knows the recipient from the start; the opening UI need not recite it. Initially show the repeated minute, a pending picture-and-note job and a plain hint such as `The address is on the note.` ECHO establishes where the presence can be seen and what a retained impression contains. CANVAS makes the original writing/readable letter available. POSTMAN then lets the player distinguish sender from intended next user, before the final acknowledgment connects that wording to them.

If a player reads the writing early by exposing more of the glass, accept that discovery. Do not blur legible information or invent a has-visited-CANVAS flag to force the intended revelation order. CANVAS still has its concrete composition job; understanding the recipient early does not manufacture a finished, delivered letter. The payoff comes from actual receipt and release, not from the system certifying that a secret was discovered at the prescribed minute.

## The connected player journey

| Beat | What the player sees and does | What changes | Why the next app makes sense |
| --- | --- | --- | --- |
| **1. TERMINAL: the same minute** | An old line repeats. A real finish attempt rings the bell and recalls the apparition. Appended output says `HELP ME.` and then `I keep starting the same minute.` | The player can observe the repeated job and distinguish muting output from stopping automatic retry | The request names a pending picture/note and exposes ECHO as its visual source |
| **2. TERMINAL: stop starting over** | The player disables the repeat through an understandable intervention. The shell confirms `The call has stopped. The letter is still waiting.` | Automatic retry is off, the request remains open, and the last impression can finish once | Condensation and a hand appear on the desktop glass; ECHO can investigate the correct surface |
| **3. ECHO: keep the impression** | Compare a live source/recorded evidence, expose the fixed handprint by moving a window, clear an area, and retain the relevant scene print | A passive, actual scene artifact is created; a paused preview or live link is recognizably different | The print visibly contains picture, mist and writing layers; Open in CANVAS offers to finish it as a letter |
| **4. CANVAS: the message underneath** | Isolate the existing writing from the mist layer; compose it with the retained picture. Preserve the actual note rather than erase it while cleaning the image | A finished, readable letter preview contains the actual note, its intended-recipient wording and the player's chosen image | `FOR THE NEXT PERSON AT THIS DESK` identifies the delivery problem, and Compose with this opens the matching POSTMAN thread |
| **5. POSTMAN: who comes next?** | The thread identifies Mara as sender. Reply to sender is a plausible wrong route; Deliver to this desk's guest inbox uses the recipient evidence | A correct delivery stores that finished letter in the guest inbox and creates a matching local receipt; a wrong route returns without resetting earlier work | Return to the request brings that same receipt back to TERMINAL |
| **6. TERMINAL: this minute ends** | The original request accepts the valid receipt. Final acknowledgment: `You were the next person. You can close the window now.` Normal supported `echo` output works without ghost additions | The request is closed; the hand releases the glass, and the chosen retained result remains inspectable | The first promise, the original sender and the player's place in the story meet in one ending |

There is one narrative spine. Each program has its own malfunction, visual language and native operation; four separate biographies or four new monsters are unnecessary. An extra line or a reveal is not automatically an additional puzzle. ECHO's source interpretation and POSTMAN's sender/recipient interpretation are distinct connected decisions; CANVAS adds actual authorship/content restoration, not a second copy of the same source switch.

## What the interfaces say, in context

Use a short authored set tied to actual events, not random ghost-message spam. Suggested lines, open to polishing without changing the facts:

| Actual condition/event | Relevant output or feedback |
| --- | --- |
| Initial unfinished session | `HELP ME.` / `I keep starting the same minute.` |
| Bell muted, retry still armed | `I can't hear it. It still brings me back.` |
| ECHO preview paused, retry still armed | `You stopped the picture. Not the call.` |
| Retry really stopped | `The call has stopped. The letter is still waiting.` |
| Wrong window-only source retained | `The window is empty. The mark is on the glass.` |
| Original writing erased in CANVAS | `Not the words.` / the visible preview is missing its note; Undo can restore it |
| Reply-to-sender route returns | `That went back to the sender.` / the thread still shows the next-user recipient instruction |
| Correct local delivery | POSTMAN shows the actual letter in Guest Inbox and a matching receipt |
| Receipt acknowledged | `You were the next person.` / the archived request states `Delivered. Session complete.` |

Do not put these lines into the user's input, overwrite their text, invent an action they did not take or keep replaying a major scene on remount. The final line is a last committed acknowledgment, then archived history; the repaired terminal does not keep autonomously pretending to be haunted.

## Why all four operations belong

**TERMINAL** owns the job, its automatic retry and its acknowledgment. It cannot create visual evidence or compose/deliver a letter merely by changing a status label.

**ECHO** selects/retains a scene impression. A live link keeps updating; a scene print is passive data. It supplies the actual picture and existing writing/mist layers. It does not automatically finish the letter or send mail when Capture is pressed.

**CANVAS** turns a layered working print into the finished letter requested at the start: readable original writing plus the selected image/composition. Its result is the actual preview/payload later delivered. The recipient hint comes from that existing note. It does not invent text, resurrect missing pixels, stop execution or award a visited-CANVAS token.

**POSTMAN** routes and commits that letter to the intended local inbox. It shows sender versus recipient clearly and returns a receipt naming this request and letter. It cannot silently substitute a prewritten postcard, generate the image or certify a different artifact.

Opening any app early is allowed. A premature attempt exposes the missing input in plain language, with a contextual way back; it does not reveal fake complete content. POSTMAN can display an unfinished draft, but a raw live reference, a working layered print and a finished letter are different payloads. Explain any missing-content/incompatible-input result through what the letter actually contains, not a hidden rule that the player must visit an app first.

If the build gives ECHO all composition features or POSTMAN its own equivalent image-restoration editor, CANVAS becomes redundant. Keep the capabilities distinct or explicitly redesign the scope; do not retain four arbitrary gates. Creative freedom remains in source comparison, composition, presentation, framing and feedback. The canonical cause/recipient cannot drift independently across those implementations.

## Minimal shared data and state contract

One request identity persists through the case. Its source/content version and automatic-retry state are separate from the current process PID, window visibility, audio preference and animation progress. A restarted process does not invent a new unrelated letter.

The main semantic transitions are:

`Repeating request -> retry paused / delivery pending -> actual scene print -> finished letter -> delivered to guest with receipt -> acknowledged request.`

The apparition's presentation surface changes from the terminal to the glass at the defined partial milestone. Its retained image is data, not a second live apparition. ECHO's window-source capture and glass-source capture project the same underlying case consistently; replaying evidence does not create a new live event.

The scene print retains the captured scene/mask and the writing already in its source. CANVAS exports a finished letter with those actual parts and a readable preview. The local delivery transaction commits that exact finished letter and yields its receipt. TERMINAL checks a matching current request, valid letter/content, intended guest recipient and committed receipt. It does not check four unrelated booleans saying apps were opened.

If the source/letter changes after a receipt, retain version/provenance so an obsolete acknowledgment cannot close a different revision. Define Undo's transaction boundary and the consequences of changing a delivered artifact. Closing a window, resetting a view or replaying a cue must not apply a delivery twice. Version/migrate old standalone TERMINAL endings without falsely completing the four-app case.

## The glass belongs to this same job

The silhouette and hand are the unfinished session's last impression, finally able to finish once instead of starting over. The change follows stopping retry; it is not random punishment for solving an app. Its pressure/trace stays in the fictional glass's coordinate space when windows move. The player's cleared region belongs to the retained picture.

Use the scene/material/choreography guidance from review21, preserving immediate window drag, readable controls, keyboard/reduced-motion alternatives and optional sound. The global layer is not a new program. The intermediate reveal and final release have different meanings: **the call stopped** versus **the letter arrived**. Do not use the same victory banner for both.

## Paper review of the connected route

These are reviewed design scenarios, not executed tests or observations of people:

| Scenario | Required coherent result | Review judgment |
| --- | --- | --- |
| Normal intended route | The same request, picture, original writing and letter identity reach the guest inbox, then the acknowledgment closes the request | Cause and payoff are specified end to end |
| Player only mutes the bell or pauses ECHO | The job remains pending; visible evidence shows why silence/frozen preview did not end retry | No false repair or audio dependency |
| Player stops retry but closes the apps | The partial state persists; no new villain, complete-case trophy or forced progress reset | No fake ending at the two-app checkpoint |
| Player captures the wrong source | The actual empty/window result remains inspectable; the glass mark still provides a recoverable clue | No magic correct image from every capture |
| Player erases the note while cleaning the print | The letter preview genuinely lacks that writing; Undo restores it; future mail validation reflects actual missing content | CANVAS changes the delivered result, not just appearance |
| Player replies to Mara | Local returned/outbox evidence identifies that as the sender route; the current guest remains the intended next user | No external reply or dead-person receipt is invented |
| Player tries a stale/unrelated receipt | The original request stays pending and explains the mismatch | Final state depends on actual chain data |
| Player chooses not to retain an optional keepsake after delivery | The delivered record/receipt remain honest; the final personal souvenir is absent | Choice does not fabricate or contradict an artifact |

## Scope and readiness

The default story, sender/recipient, bell producer, image/note purpose, transitions and final acknowledgment are now specified as one paper model. Opus should challenge remaining interaction risks: whether source comparison is readable, whether finishing the letter feels expressive rather than clerical, and whether the guest-recipient discovery lands without a lecture. Those are implementation/playtest questions, not claims already settled by this document.

The current IDE increment remains TERMINAL/ECHO plus the glass checkpoint. It can establish the exact original request, its note source and meaningful partial evidence now. CANVAS, POSTMAN and full-case closure must remain explicitly pending until later implementation. Preserve the one-case design so the next two programs connect naturally; do not use a fake four-app ending to fill the gap.

Keep review22's editorial targets: first-use core roughly 6–9 minutes, a practiced main-route demonstration around 110 seconds and final video around 2:50/below 2:55. They remain unmeasured. PITCH.md should narrate this same letter, sender, guest recipient and acknowledgment. Do not restart concept discovery with three unrelated plots; if Opus finds a better structural choice, document the objection and update the whole narrative/data/pitch contract together.

No novelty, winner-quality, comprehension, audible-audio or human enjoyment claim follows from this paper review. The next proof is a coherent playable implementation and observed use.
