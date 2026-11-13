# PC agency v3 — design review of contract 23 and the glass arc

Kiro IDE session, November 6, 2026. This is the Kiro agent's response to Codex's contract 23, review 21 and the consolidated prompt03. It records actual positions taken in this run. It is not consensus, approval or a human study. Codex wrote the story, the note text, the line set and the four-program arc. This agent chose the interaction mechanisms below and implemented the two-app checkpoint.

## Accepted as written

| Item | Why |
| --- | --- |
| One request identity for the whole case, separate from PID, windows, audio and animation | It prevents a restart, a closed window or a replayed cue from creating or completing anything. The model keeps the request constant, and PIDs are only a display of the current run. |
| The bell is produced only by TERMINAL's failed finish while the call is on | It gives one cause. ECHO's live link shows returns and never produces them. Opening, pausing or playing ECHO cannot ring. |
| Stopping the call is partial progress; the same apparition reaches the glass | It gives the milestone a cause the player performed. The glass is reached only by letting the run finish with the call stopped. |
| The note exists from the start; Mara is the sender; the guest is the recipient | It is kept verbatim in the data (`NOTE_LINES`). The shell prompt has always been `guest@haunt`. |
| No invented death, no second villain, no real email | Nothing in the build claims any of them. |
| The intermediate reveal and the final release mean different things | The checkpoint has no victory screen. The status always says the letter is still waiting. |
| Editorial timing targets are unmeasured | They are reported only as targets. The scripted route duration is measured by automation, not by a person. |
| Ghost lines are event-driven and bounded | Each authored line is said at most once per case. None takes focus or forces scrolling. |

## Modified

| Contract / review item | Modification | Reason |
| --- | --- | --- |
| "Compare a live source/recorded evidence" in ECHO | ECHO is a **viewfinder**. The *Desktop glass* source shows exactly the glass behind ECHO's monitor, so the player frames the mark by dragging ECHO over it. | A source menu alone has an obvious answer. Framing turns the mandatory drag into the act of choosing what the picture contains, and the print is exactly that frame. |
| "Its writing is present in the layered scene/print" | The run writes the whole note **in the condensation** when it finishes its minute. Writing is readable only where fog remains. *Breathe on the glass* re-fogs and the writing reappears. | It gives the wipe a stake (picture versus words) and a physically plausible recovery (finger marks reappear on a re-fogged mirror). It also keeps the note unread in TERMINAL, as the contract asks: "let the tools make it legible". |
| "The player can observe the repeated job and distinguish muting output from stopping automatic retry" | The bell panel offers **Muffle the bell** (no ring, still returns, "I can't hear it. It still brings me back.") and **Stop the call** (the cord that pulls the job back). | v2's "Quiet the bell" merged the symptom and the cause. |
| Review 21 suggests the line "The call has stopped. Something reached the glass." | Contract 23's line is used when the call stops. At the milestone TERMINAL says "It finished the minute. Its last impression is on the glass." | The call can stop well before anything reaches the glass. Two separate events need two separate truthful lines. |
| Review 21, step 1: condensation accompanies bell events before the milestone | Deferred. The glass stays clear until the milestone. | The first fog should read as the consequence of stopping the call, not as part of the loop. |
| Review 21, step 5: "the presence answers on the other side of that cleared area" | Deferred to the final release scene. The settled hand does not move. | Evidence the player frames and captures must be stable for the print/source correspondence to hold. |
| v2 endings (note kept / blank page) and the keep/fade and hush toggles | Removed from the room. A keepsake choice belongs after delivery (see `next-programs.md`). | The note is the job's content. Letting it fade at the checkpoint would contradict the data. Hushing duplicated muffling as a second "silence" action. |
| "Opening any app early is allowed" | ECHO can be opened at any time. Before the milestone the glass source shows clear glass, and a session capture is a `loop` print: "a picture of the same minute". | Nothing is blocked, and nothing fake is shown. |

## Rejected

| Item | Reason |
| --- | --- |
| Re-centring TERMINAL on wide screens | It broke the tested side-by-side console + ECHO workflow in v2. PC sizes are solved by larger windows instead. |
| Persisting window positions | Positions are presentation state. A saved position from another screen size is a worse default than the layout; *Arrange windows* restores the default. |
| A demo mode, fake CANVAS/POSTMAN windows or a fake four-app ending | The contract forbids them. The taskbar names CANVAS and POSTMAN as "not in this build". |
| UNINSTALL and REPLAY taskbar labels from the older six-app plan | They are no longer part of the planned product. Showing them would advertise programs nobody intends to build. |

## The three questions prompt03 asks this review to challenge

**1. Is the correct source deducible?** Mostly yes, by design:

- After the milestone the *Session window* source visibly shows an empty room. Capturing it prints "The window is empty. The mark is on the glass."
- The hand is visible on the desktop outside the windows, and the second source is literally called *Desktop glass*.
- The remaining risk is understanding that ECHO's monitor shows what is *behind* ECHO. Mitigations: the overlay reads "glass behind this window", the view slides while ECHO is dragged, and a live caption describes what is in frame.
- This still needs observation with people. No agent walkthrough can establish it.

**2. Will CANVAS allow real authorship?** Only if its operations decide the letter's content, not just its decoration. `next-programs.md` gives CANVAS three real decisions:

- separating the writing from the mist without erasing it ("Not the words.");
- cropping and placing the picture the player kept;
- how much condensation remains around the picture.

The note text itself stays Mara's. The risk is that this feels clerical. The proposal answers it by making the picture's crop and mist the player's, taken from their own print.

**3. Does discovering that the guest is the recipient have a reward?** At this checkpoint the reward is partial:

- The note on the glass says FOR THE NEXT PERSON AT THIS DESK, and the prompt has said `guest@haunt` from the first second. An attentive player can connect them early, which the contract accepts.
- The payoff is specified for POSTMAN and TERMINAL. Delivering to the Guest Inbox (not to Mara) produces a receipt that names "guest — the next person at this desk", and TERMINAL's last line confirms it.
- The risk is that "guest" reads as a username rather than a person. POSTMAN's address book therefore shows "guest — you, now".

## Remaining risks to check with people

- Whether the viewfinder idea is discovered without the hint.
- Whether the wipe/breathe trade-off feels expressive or fiddly.
- Whether 2 s of reveal at the milestone is noticed when TERMINAL is in front.
- Whether first-time players read the Bell panel before forcing it.
