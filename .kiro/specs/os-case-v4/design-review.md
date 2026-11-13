# OS and complete case v4 — design review

Kiro IDE session, November 7, 2026. These are the Kiro agent's positions on Codex's review 24, document 25 and prompt04. They are not consensus. Codex authored the story (contract 23), the vocabulary proposal, the full-negative recommendation and the scenarios. This run chose the mechanisms below and implemented them.

## Accepted

| Item | How it is realised |
| --- | --- |
| A single workstation convention with a bottom taskbar and tray; no hero copy on the wallpaper | Taskbar with launcher, apps and tray. Version, scope and attribution moved to About. |
| Contextual inspector instead of a panel below the room | The inspector slot replaces the narration (or sits beside the scene when wide). Hit-tested at control centres at three PC sizes. |
| Native radio semantics for ECHO sources | `fieldset` + `input type=radio` |
| Full negative + separate photo frame | `Negative` union and `Capture.frame`; see design §3 |
| Old v3 prints stay limited | The `limited` negative kind: picture only, no writing, never complete |
| Vocabulary table, used everywhere | requirements §4. *Reply* only addresses a draft; *Send* commits. |
| Delivered snapshot A is immutable; receipt A certifies A only | `Delivery` and `Receipt` are copies, with a hash; draft edits never touch them |
| Explicit replay creates a new run identity; archived receipts cannot finish it | The run id is in every capture, draft, delivery and receipt |
| *Finish session* in TERMINAL owns the climax; the model commits before the animation | `store.finish()` first, then the presentation |
| *Session only* when storage really fails | `persist()` reports the result; the tray shows it only in that case |
| The same phase words everywhere | One `phaseInfo()` table |
| Maximize/restore, bounded resize and a keyboard window menu | §6 of the design |

## Modified

| Proposal | Change | Reason |
| --- | --- | --- |
| "The negative keeps the writing that was in the source" | The glass model owns a **writing layer**, written at the milestone from the job's note data. Wiping removes mist only, so captures always copy the layer. | It honours "do not take it from global constants": the capture copies the glass's own data, set by the session when it finished the note. It also explains v3's breathe mechanic physically. |
| Subject feedback "Handprint / Figure / Only mist" | A chip row reports subjects in words. The geometry thresholds stay internal, but the chips make the result visible before Capture and while reframing. | No secret percentages to hunt, while keeping a deterministic validity rule for the letter |
| The keyboard alternative for wiping | A focusable **wipe cursor** on the monitor (arrows move, Space wipes) replaces the old "wipe an oval" button | It produces the same data as a pointer wipe, wherever the player chooses |
| "Separate the writing from the mist" (CANVAS) | **Lift the writing** is a button. The plausible error is clearing the mist (slider to 0) while the writing is still in it. | The mistake follows directly from the layer relationship the UI shows ("Writing: in the mist"). Undo restores it. No second wipe puzzle. |
| POSTMAN's thread | Mara's unfinished message lives in **Recovered · 1987**, restored with her session. *Compose in POSTMAN* opens a draft in that thread. | *Reply* is then the natural but wrong mail action, and sending to `guest` delivers into the player's own Guest Inbox: "the next person is you" happens in the app. |
| Incomplete messages | *Send* asks first ("This letter is missing the writing. Send anyway?"). If sent anyway, the message is stored and marked incomplete, and its receipt cannot finish. | It shows the honest attempt the scenario asks for without making it the default |
| Explicit replacement | Replacing is required only when the intended delivery is already valid. An incomplete earlier delivery is superseded without asking. | It is easier to fix a mistake, and it is explicit whenever a valid letter would be displaced |
| Escape closes the active window (WINDOW-01) | Escape now closes menus and popovers and cancels move or size modes. It never closes app windows. | With four apps and an editor, Escape closing CANVAS or POSTMAN is surprising and loses focus. This is not OS behaviour. |
| First-run spotlight tour (v2) | Replaced by one optional callout and phase help | Review 24 P2: no tour that asks to open an already open app |
| v3 room with a big title and a sheet ghost | A session pane in TERMINAL's own language (header, recorded clock, inspector), with a figure made of its own output | Review 24 P1 tone, and prompt04 §8 |

## Rejected

| Item | Reason |
| --- | --- |
| A file manager, settings, login, Wi-Fi or a notification centre with fake items | They are not needed for the case. The desktop files and the tray carry the OS impression, using only actions that work. |
| A keepsake / "decline the copy" ending choice | Not needed for an honest ending. Contract 23 allows "ship one honest complete ending". The letter stays in Guest Inbox. |
| A general mail sync or recall-after-finish | Only the case's small local transaction is modelled |
| Editing Mara's words in CANVAS | The note is hers. The player authors the picture (frame, mist, cleared region) and the layout, not her text. |
| Flying thumbnails between apps | Handoffs reuse window open motion. With reduced motion the next window shows the same object at once. |

## Ambiguities resolved

1. **Where reframing happens.** In ECHO's *Captures* tab, where the negative and its frame are shown. CANVAS has *Reframe…*, which uses the same editor on the draft's own copy, because document 25 scenario 3 reframes in CANVAS. The capture's frame and the draft's frame are separate edits.
2. **Which revision POSTMAN sends.** The mail draft attaches the live CANVAS letter until *Send*, which takes the snapshot. After delivery, CANVAS edits make the draft a newer revision. Guest Inbox keeps showing the delivered snapshot, and TERMINAL's receipt card names "the letter you sent".
3. **How the receipt reaches TERMINAL.** TERMINAL always reflects the intended delivery (the same case). *Return to the request* only brings TERMINAL forward on that receipt. The typed command `finish` validates the intended delivery's receipt.
4. **Phase of a migrated v3 case.** Glass prints are limited, so the phase is *Call stopped · letter pending* until a new glass capture exists. The notice says why.
5. **The recorded clock.** Shown only inside the session pane, labelled "recorded", and running only during an attempt's cue. The taskbar clock is today's time.
6. **After Finish session.** Nothing reopens the case. Opening CANVAS shows the draft (a copy). *Compose* still works, but a new send to guest after finishing is stored as an extra delivery and never changes the finished job.

## Still uncertain (needs people)

- Whether "Lift the writing" is understood before the mist slider is tried.
- Whether players read the recipient choice as meaningful or obvious.
- Whether the text-made figure reads as a presence or as decoration.
- Whether the final release is noticed while the letter card is in front.

## Changed during implementation and visual review (same session)

| Planned | Changed to | Reason |
| --- | --- | --- |
| Toasts at the bottom right, above the taskbar | One notification at a time, inside the taskbar's free middle | The screenshots showed toasts covering CANVAS's Compose button and POSTMAN's attachment. In the taskbar they cover nothing. |
| *Stop the call* styled as the primary action in the Bell inspector | *Muffle the bell* and *Stop the call* look the same | Highlighting one of them gave the answer away. The footer keeps its single primary action. |
| The milestone glass placed by the desktop after TERMINAL's event | The case store presses the impression in the same transaction as the milestone | A save could otherwise be written for a finished minute with no impression (it would load as corrupt). A unit test now checks every save written along the route. |
| A handprint counts whenever 35 % of it is in the frame and any mist is left | It also needs mist around it (mean condensation × the Mist layer ≥ 0.3) | The print is a cut in the condensation. Wiping the hand away, or clearing CANVAS's mist below about 30 %, removes it from the picture, in the render and in the rule. |
| Using the same capture again in ECHO did nothing | It updates only the letter's frame (one undoable edit, reported as *reframed*) | Otherwise a frame moved in ECHO after *Use this capture* could never reach the letter without starting over. |
| A disabled Capture button when ECHO holds 8 captures | Capture stays enabled and explains the limit | A disabled button gave no explanation. |
| Paper and Note position as two separate layers | One *Paper* section with two choice rows | All the layers now fit at 1366×768 without scrolling. |
| The first-visit callout under *Look inside* | Beside TERMINAL when there is room, otherwise under the button | Under the button, it covered TERMINAL's boot lines. |
| *Return to the request* always shown on a receipt | Hidden once the session is finished | After the end it only led to "already finished". |
| `restore terminal` reset the case from TERMINAL | It points to *Start the case over…* in the HAUNT menu | One replay path, with a real confirmation dialog. |
