# Playability and a visible ending (v5) — design review

Kiro IDE session, November 8, 2026. These are the Kiro agent's positions on Codex's review 26 and prompt05. They are not consensus and involve no users. Evidence refers to `output/playwright/v5-baseline.json` (before) and to the results recorded in `tasks.md` (after).

## 1. Facts versus opinions in review 26

| Review 26 item | Kind | Reproduced? |
| --- | --- | --- |
| Eviction of the accepted delivery, reload resets the case | Defect | Yes (A1). I also found the same eviction before Finish (A2). |
| CANVAS promises Undo after reload | Defect | Yes (B). Undo and Lift are disabled; only Reset… recovers. |
| TERMINAL 480×420 and ECHO 640×480 clip controls | Defect | Yes (C). The hint page also loses Tell me exactly. |
| "Next: Stop the call." before investigation | Observed fact; the effect on enjoyment is a judgment | Yes (D). Are you okay? also names the call as the cause. |
| POSTMAN labels explain the recipient before the choice | Observed fact; whether it spoils anything is a judgment | Yes (D) |
| CANVAS's required route is Lift → Compose | Fact; "little agency" is a judgment | Yes |
| The release happens behind windows | Fact at the standard route | Yes (E): `window-terminal` covers the hand |
| The keyboard regression used programmatic focus | Fact | Yes (tab probe) |

## 2. Positions

| Codex proposal | Position | Reason and evidence |
| --- | --- | --- |
| Keep the intended and accepted deliveries out of eviction, or hold them outside the evictable history | **Accept the first option** | It is the smallest sound change. No save format change or migration, validation stays strict, and the bound of 12 holds. The second option needs a new structure and a migration for the same effect. Unlimited history and banning post-finish mail are rejected, as review 26 itself says. |
| Review post-finish Send/Replace wording | **Accept and extend** | After acceptance, "Replace it?… only the new receipt can finish the job" is false. A send to guest after the end becomes a copy: no Replace prompt, the accepted letter stays the job's letter, and a *Copy* badge. |
| Restore the writing from the draft's own capture when Undo is unavailable, keeping frame, paper and layout | **Modify** | Accept the source and what it keeps. Change two things. (1) Recovery puts the words **on the paper**, not back in the mist: the loss happened because the mist was cleared, and putting words back into a cleared photograph would contradict the picture the player chose. (2) *Recover the writing* is offered whenever the words are lost, not only when Undo is gone. One visible action is clearer than two depending on history. Undo still works. Persisting the Undo stack was rejected: a larger save, and the copy would still need fixing. |
| — (found in review) | **Remove "Take it off the paper"** | My v4 control only turned lifted words into lost words. It had no purpose for a player, and was a second way into the defect. |
| Adaptive internal layout and real scrolling at the minima; raise a minimum only if justified | **Accept** | Compact chrome and a shrinking scene, with an inspector whose text scrolls while its actions stay visible. ECHO's capture detail becomes a scroll region. Minimum changes, if any, are justified in tasks.md with measurements. |
| Do not relax the audit | **Accept, with one precise refinement** | A control partly hidden at the edge of a region that genuinely scrolls is reachable, so it is not a defect. The audit checks that the region really scrolls. It does not exclude windows, apps or states. |
| Default surface: objective, not the fix; evidence from the return; hint then answer on request | **Accept** | Pending text becomes "Find out what keeps bringing it back." Are you okay? now says "something pulls it back" instead of "the call". The bell's inspector still explains the cord: that is the evidence the player goes to look at. An early correct action still works. |
| POSTMAN: show the explanatory copy later | **Modify** | Delaying or hiding the roles was rejected: it would make a mandatory address unclear, or depend on a failed attempt. Instead the labels state **facts** the OS knows: "Mara · last signed in 31 Oct 1987" and "guest · signed in now". The note says "for the next person at this desk"; the person connects it to who is signed in now. The confirmation after delivery ("you, at this desk") and the help answer stay explicit. The typing status "To the next person at this desk", which confirmed the role during the choice, is removed. |
| CANVAS: visible selection and separation of the writing, previews of what the mist changes, optional direct manipulation with a keyboard equivalent | **Modify: accept the previews, reject the gesture** | Selecting or dragging lines adds a gesture to the same instruction: every line must move, to one target. Kept: the lift shows which captured lines move and where they go. Chosen as the decision: **what the photograph keeps** (see §3). |
| Final: a player-invoked view of the same live glass from the receipt, or an explicit reversible overview of the desk | **Modify the first** | The live view of the glass at the handprint is **part of the receipt card**, not an extra action. A required extra click would make watching a condition. An overview (peek) needs a click at the climax, and the 1.4 s release would already be over when it opens. Rejected: an automatic fade of all windows (it takes over the player's windows), moving the hand, a decorative copy of the presence. |
| A natural Tab/Shift+Tab route | **Accept** | New `check:keys`, with no programmatic focus and key presses counted per step. |

## 3. Alternatives compared

### CANVAS: the decision

| Option | What the player decides | Consequence in the letter | Problems |
| --- | --- | --- | --- |
| A. Select lines, then drag them onto the paper (Codex's direct-manipulation idea) | Nothing new: all five lines must move to the only target | Same letter as Lift | More gestures for one instruction; motor precision |
| B. Leave the words in her hand in the mist, or lift them | Handwriting in the photograph, or words on the paper | Visible | It makes Lift optional and the default route zero actions. It also reintroduces "the frame must contain all five lines", which v4 deliberately removed. |
| C. Force a picture choice before Compose | One of three pictures | Visible | It is a gate. The capture's default picture is already valid. |
| **D. Chosen: what the photograph keeps — handprint (mist), figure (no mist) or both (thin mist)** | Her trace or her presence, a real trade-off of the glass model: the print is a cut in the mist, the figure is behind it | The delivered photograph, Guest Inbox and the ending show it | Optional, with a default. The value of the choice needs people to confirm. |

Why D:
- It follows from the physics the player already saw in ECHO, and it is a single choice.
- It echoes the note's own "Keep what matters." without inventing text.
- Its previews are rendered from the letter's own capture, so a frame without the figure honestly says "Only mist" and points to Reframe….
- It makes v4's plausible error ("Not the words.") an informed choice. While the words are still in the mist, a line under the presets says "No mist would take the writing with it", before it happens.

Honest summary: *Lift the writing* is still a direct required action. The new expressed decision is what the photograph keeps. It is optional, with the capture's own picture as the default.

### The ending

| Option | Visible? | Player control | Problems |
| --- | --- | --- | --- |
| Do nothing (v4) | Often not: the hand is under TERMINAL | Full | The climax plays behind windows |
| Explicit "show desk" peek | Yes, if pressed in time | Full | An extra action at the climax; the release ends before it opens |
| Automatic fade of all windows during the release | Yes | Taken away | It rearranges the player's desktop without asking |
| Move the hand to an open spot | Yes | Full | It breaks the glass's coordinates (forbidden) |
| **Chosen: the receipt card shows the live glass at the handprint, beside the letter** | Yes, in the focused window, before and during Finish | Full; nothing moves | A small view is less dramatic than the whole desk. The desk still releases behind the windows too. |

## 4. Six questions per interaction

### TERMINAL: the opening objective
1. **Goal.** Understand why the old job never finishes, and make it finish.
2. **Can observe and decide.** The job strip says what is pending. The scene shows the attempt, the bell and the cord. The bell's inspector offers two different actions.
3. **What changes.** Watching shows the return; muffling silences the bell, but it still returns; stopping the call ends the returns, and the strip, tray and transcript say so.
4. **Can it be corrected?** Undo before the milestone; the call can be hooked back on; muffle and unmuffle.
5. **Why here and why Halloween.** The terminal owns the job. A bell that tolls at every failed ending, and a figure trapped in one minute, are a haunting made of a process.
6. **Strongest objection.** A player who never opens the bell could feel stuck. Answer: the hint on request points to the bell first, then gives the exact action.

### CANVAS: what the photograph keeps
1. **Goal.** Finish Mara's letter: her words and a picture.
2. **Can observe and decide.** Three previews of their own capture, each naming what it shows, the lines that will move, and where they go.
3. **What changes.** The photograph in the letter, in Guest Inbox and at the end.
4. **Can it be corrected?** Any option can be chosen again. Losing the words shows Recover the writing, and Undo stays.
5. **Why here and why Halloween.** Developing a picture belongs in an editor. Choosing between a ghost's handprint and its figure is a quiet, eerie decision about what to keep of someone.
6. **Strongest objection.** Optional choices are often ignored. If people skip it, the letter is still correct but less personal. Only observation can say.

### POSTMAN: who receives it
1. **Goal.** Send the letter to the right person.
2. **Can observe and decide.** Mara's 1987 message, the note's words, two addresses with who last signed in when, and the OS's own "guest".
3. **What changes.** Sending to Mara comes back; sending to guest arrives in Guest Inbox with its receipt.
4. **Can it be corrected?** The returned draft keeps its content; change the address and send.
5. **Why here and why Halloween.** Mail is where the sender and the recipient are distinct. Realising the dead session's letter is for you is the story's turn.
6. **Strongest objection.** "signed in now" may still give it away, or may confuse someone who has not noticed the tray. Untested either way; the help answer remains.

### The ending
1. **Goal.** End the session properly.
2. **Can observe and decide.** The letter that was actually delivered, and the glass with the hand still pressed on it, then Finish session.
3. **What changes.** The hand lets go in that view and on the desktop. The job and the transcript close, and the letter stays.
4. **Can it be corrected?** Nothing to correct. Replay is explicit (Start the case over…).
5. **Why here and why Halloween.** The terminal owns the job it started. The release is the end of the haunting, shown on the same glass.
6. **Strongest objection.** It is smaller than a full-screen moment. That choice keeps the player's desk theirs.

### Recovery after lost words
1. **Goal.** Get Mara's words back.
2. **Can observe and decide.** "The writing went with the mist", and a button that says what it does.
3. **What changes.** The captured lines return on the paper; the photograph stays as chosen.
4. **Can it be corrected?** Undo is still there in the session.
5. **Why here and why Halloween.** The capture kept the writing layer; only the letter lost it.
6. **Strongest objection.** Recovery onto the paper skips Lift, so the mistake costs little. That is intended: the mistake should teach the trade-off, not punish it.

## 5. Ambiguities resolved

- **Sends after the end.** A delivery to guest after acceptance still gets a receipt (every guest delivery does), but it can never finish anything, and POSTMAN calls it a copy.
- **Keep options between levels.** If the slider sits between 100 %, 40 % and 0 %, no option is selected. The slider shows the true value.
- **Exact mist levels.** 100 %, 40 % and 0 % come from the subject rules: the handprint needs mean mist ≥ 0.3 around it, and the figure needs ≤ 45 % mist. For the standard frame on the hand, `keepPreview` names them Handprint, Handprint and figure and Figure (unit test), and the rendered presets show the same (`output/playwright/v5/*-canvas-keeps-both.png`).

## 6. Results against the positions

Evidence: `output/playwright/v5-after.json` (the same probes as the baseline), the browser checks and `output/playwright/v5-review.json`; details in tasks.md.

- **Retention (accepted).** Thirteen returned sends before and after Finish session keep the intended and the accepted delivery. Reloads keep the run and the phase. A send to guest after the end is a *Copy*, with no Replace prompt.
- **Recovery (modified).** After a reload, CANVAS says "Recover it from the capture" and shows *Recover the writing*. The five lines return verbatim, and the photograph keeps its mist. Undo still works within the session.
- **Minimum sizes (accepted).**
  - 177 states at three sizes have 0 audit problems. They cover default, maximized, minimum and corner placements, every TERMINAL inspector page and every confirmation.
  - No minimum changed.
  - The audit refinement exempts only controls and text inside a panel that really scrolls. It adds a check that such a panel can be reached from the keyboard.
- **Orientation (accepted / modified).** The default surfaces name the open question. The only places that say *Stop the call* are the control itself, the explicit answer, the explicit hint and feedback after a wrong fix ("Stopping the run did not stop the call.").
- **CANVAS (modified).**
  - "The photograph keeps" is a row of three presets drawn from the letter's own capture. Pointing at one previews it in the letter.
  - The choice reaches the delivered snapshot and the end card.
  - The keyboard route chooses it with one arrow key.
- **Ending (modified first option).**
  - TERMINAL's receipt shows the desktop glass at the hand, live: the mean pixel difference against the desktop canvas is 1.1/255.
  - Finish session plays the release there: impressed → releasing → "The glass is clear."
  - Reload mid-release and reduced motion land on the same final state. No window moves.
- **Keyboard (accepted).** `check:keys` completes the case in 48 key presses, and the check never sets focus.

## 7. Second self-critique (after inspecting the screenshots)

What still seems weak, by my own reading of the screenshots, not by observation of people:

1. **The final glass is a dark rectangle.** It is honest: the hand let go and the region is clear night. Beside the letter it reads as before and after only if the player saw the hand there seconds earlier. I did not brighten it or substitute another region, because either would stop it being the same glass.
2. **The receipt's view is small.** It is 166×104 px at the default size at 1366×768, and larger on a large TERMINAL. The release is visible but not dramatic. The desktop also releases behind the windows; nothing forces a better view.
3. **The presets are small at 1366×768 (about 66×41 px).** The difference between Handprint and Handprint and figure is subtle at that size. Mitigated by the previews in the letter on pointing, and by the immediate change in the large letter on choosing.
4. **The choice is optional.** Players who skip it get a correct letter. Whether anyone feels the choice is unknown.
5. **"signed in now" may still give the recipient away, or may be missed.** Untested either way.
6. **TERMINAL at 480×420 is cramped.** The scene is 104 px high and the inspector shows about three lines at a time. That is acceptable at a minimum the player chose, and it is not a default.
7. **Scroll regions add a Tab stop when they overflow.** Expected, but one more stop for keyboard users at small sizes.

Rejected during this critique: auto-enlarging the receipt at the release (it would change the player's layout), drawing the lost words faintly while Recover is pointed at (the outlined boxes already show where they come from), and raising TERMINAL's minimum height (measurements did not require it).
