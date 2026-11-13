# PC agency v3 — requirements

Kiro IDE session, November 6, 2026. Source brief: `PROMPT_KIRO_03_PC_Y_JUGABILIDAD.md` and `docs/development/23_The_Unsent_Letter_Narrative_Contract.md` (Codex). This spec was written by the Kiro agent during the run. It records the agent's design choices; it is not Codex's approval, a human playtest or consensus.

## 1. Scope

**Implemented in this increment (development checkpoint, not the final case):**

- TERMINAL and ECHO, rebuilt around Mara's unfinished job (contract 23).
- Real titlebar dragging for both windows, a keyboard move handle and a visible *Arrange windows* action.
- One global scene on the desktop glass: condensation, the apparition's silhouette, its handprint and the note written in the mist. The player can wipe and re-fog the glass.
- ECHO as a capture studio with two sources, a live link that can be paused and passive prints that can be kept for the letter.
- A versioned save (`haunt.case.v3`) with migration of the old TERMINAL ending.
- PC-first layout at 1366×768, 1440×900 and 1920×1080, and a visible build identifier.

**Specified only (see `next-programs.md`):** CANVAS, POSTMAN, the receipt and TERMINAL's final acknowledgment. They are not shown as working programs.

**Preserved:** the paper-bridge prototype (`index.html`, `src/core`, `src/ui`, `src/main.ts`), uncommitted Codex documents, window lifecycle and motion cancellation, reduced motion, optional sound.

## 2. The story this build tells (contract 23, as implemented)

On 31 October 1987, Mara left a session open on this desk. Its last job was to deliver a picture and a note to the next person at this desk. Nothing ever confirmed the delivery, so at the end of every minute the job starts the same minute again. Its status line is "I'll finish in a minute."

The note exists in the data from the start:

> FOR THE NEXT PERSON AT THIS DESK
> This picture is yours.
> Keep what matters.
> — Mara, 31 October 1987

TERMINAL never shows the whole note at the start. The ghost only gets as far as "FOR THE NEXT PER—" before the minute restarts. The job card says "The address is on the note." The prompt has read `guest@haunt` since v1, so the recipient is in plain sight for an attentive player.

When the player stops the call, the run can finish its minute once. It writes the whole note in the condensation on the desktop glass and presses its hand there. That is partial progress: the letter still has to be kept (ECHO, now), finished (CANVAS, later), delivered to the guest inbox (POSTMAN, later) and acknowledged (TERMINAL, later).

## 3. Critique of the brief and the chosen improvements

**Weakest points found:**

1. *ECHO source selection could be a menu with an obvious answer.* "Pick the glass source" is a click, not a discovery.
2. *Wiping the glass had no stake.* Clearing fog only made things easier to see, so there was nothing to decide.
3. *"Mute" and "stop" were ambiguous.* v2's "Quiet the bell" both silenced the bell and stopped the restart, which merges the symptom and the cause that the contract wants separated.
4. *v2 controls no longer fit the story.* "Hush the whisper" and "Keep/let the note fade" belonged to the farewell story. In the letter story the note is the job's content, so fading it would contradict the data.

**Improvements compared (player value, clarity, personality, effort, risk):**

| # | Improvement | What the player gains | Clarity | Personality | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | **ECHO is a viewfinder.** The *Desktop glass* source shows the glass directly behind ECHO's monitor. To frame the hand, the player drags ECHO over it. | Source choice becomes a spatial act that uses the mandatory drag. The print is exactly the framed region. | High once the view slides with the window | Strong: a camera that sees through itself | Medium | Players may not guess the monitor shows what is behind it. Mitigated by the overlay "behind this window" and a live caption. | **Chosen** |
| B | **The note is written in the mist.** The apparition writes it with a finger on the fogged glass. Writing is readable only where condensation remains. *Breathe on the glass* re-fogs, and the writing reappears, as finger marks on a fogged mirror do. | Wiping becomes a trade-off: clear the picture without wiping away the words. Wiping too much is a plausible error with a physical recovery. | Medium-high | Strong Halloween image (messages on a fogged mirror) | Medium | The trade-off could feel fiddly. Mitigated because no exact shape is needed, only ≥ 2 readable lines and some cleared figure. | **Chosen** |
| C | **Muffle the bell vs Stop the call.** The bell panel separates the symptom (ring) from the cause (the cord that pulls the job back). | A wrong fix that teaches something: muffled, it still comes back and says so. | High | Medium | Low | Players could pick *Stop the call* without trying anything. That is acceptable; the first minute is about understanding. | **Chosen** |
| D | Source dropdown alone | Little | High | Low | Low | Obvious answer | Rejected (see A) |
| E | Persist window positions across reloads | Convenience | — | — | Low | Old positions break at another screen size; arrange covers recovery | Rejected |
| F | Re-centre TERMINAL on wide desktops | — | — | — | Low | Broke the side-by-side console workflow in v2 | Rejected |
| G | Fake CANVAS/POSTMAN windows | A finished-looking route | — | — | Medium | Dishonest; the contract forbids it | Rejected |
| H | Faint condensation on every bell event before the milestone (review 21, step 1) | Foreshadowing | Medium | Medium | Medium | The first fog would no longer read as the result of stopping the call | Deferred |
| I | The hand opens its palm when the player wipes near it (review 21, step 5) | A response | Medium | Strong | Medium | A moving mark makes the print/source correspondence unstable | Deferred to the final release scene |

## 4. The first 60 seconds

1. The desktop opens with TERMINAL focused. A ghost behind the banner writes "I'll finish in a minute." once. The job card says: *Deliver a picture and a note. The address is on the note.* Status: *Repeating the same minute.*
2. One primary action is offered in the room: **Watch it try to finish.** The ghost reads the note, starts writing "FOR THE NEXT PER—", reaches the way out, the bell rings and it starts again. The transcript gains `MARA@1987> HELP ME.`
3. Hint (on request): *Every time the minute ends, something rings above the way out.* The Bell panel offers **Muffle the bell** and **Stop the call**.

No timers, no forced waits, no more than one state-changing action highlighted at a time.

## 5. Actions, states and consequences

### 5.1 TERMINAL (the request)

| State | How it is reached | Primary action | What the player sees |
| --- | --- | --- | --- |
| Repeating (retry on) | Start | Watch it try to finish / try again | Bell rings, PID changes, returns tally increases, ghost lines appear once each |
| Repeating, muffled | Bell → Muffle the bell | Watch it try again | No ring and no chime, but it still comes back: "I can't hear it. It still brings me back." |
| Call stopped | Bell → Stop the call | Let it finish this time | Bell cord unhooked; shell: "The call has stopped. The letter is still waiting." |
| Shadow | Way out → Force it out with the call stopped | Call the shadow back | Eyeless shadow; no impression was left; nothing reaches the glass |
| On the glass (milestone) | Let it finish with the call stopped (or `kill -TERM`) | Back to the prompt | Room empty; the hand, silhouette and note appear on the desktop glass; Undo history cleared |

Forcing it out while the call is on is answered by the call (bell, new PID). Undo works until the milestone. The milestone is a commit: the glass and any prints depend on it. Explicit replay is *Session → Start the case over* or `restore terminal`. Both ask for confirmation when the glass or prints would be lost.

### 5.2 The glass (shared desktop surface)

- Before the milestone the glass is clear.
- At the milestone the impression is placed once, in glass coordinates. The hand crosses TERMINAL's right edge (or its left edge if that side is covered or off-screen). The note sits beside the hand, behind TERMINAL. The silhouette is behind the glass.
- Moving or closing windows never moves the impression.
- **Wipe:** dragging on the bare glass, or on ECHO's glass monitor, clears condensation. Wipes never start on a window, button or icon.
- **Breathe on the glass** (ECHO) re-fogs the framed region. The writing reappears there.
- **Wipe inside the frame** (ECHO) is the keyboard equivalent of wiping.

### 5.3 ECHO (the capture studio)

| Thing | Behaviour |
| --- | --- |
| *Session window* source, live | A live link of TERMINAL's session. It follows the actual state, including each return. |
| *Session window*, paused | A frozen frame. TERMINAL keeps running. With the call still on, the ghost writes "You stopped the picture. Not the call." on the frozen frame. Resume returns to live. A paused frame is never kept unless captured. |
| *Desktop glass* source | The glass directly behind ECHO's monitor, updated while ECHO is dragged and while the glass is wiped. No pause. |
| Print | Passive data in a tray (max 6). It is re-rendered from its own data and never changes when the glass changes later. It persists across reloads. |
| Use for the letter | Keeps one print for the letter and states what it contains and what is missing. |
| Open in CANVAS | Disabled: "CANVAS isn't in this build yet. The letter is still waiting." |

**Print kinds:** `loop` (session while repeating), `shadow`, `empty-window` (session after the milestone: "The window is empty. The mark is on the glass."), `empty-glass`, `partial` and `impression`. An `impression` has ≥ 60 % of the hand in frame, ≥ 2 readable lines of writing, and some of the figure visible through a cleared area.

## 6. Shared data

One request identity (`mara-1987-10-31`) persists through the case. It is separate from the current PID, window visibility, audio preference and animation progress.

```
Repeating request → call stopped (letter pending) → impression on the glass → print kept for the letter → [CANVAS: finished letter] → [POSTMAN: delivered to guest + receipt] → [TERMINAL: acknowledged]
```

The bracketed steps are specified, not implemented.

## 7. Voices (event-driven, each line at most once per case)

| Condition / event | Where | Text |
| --- | --- | --- |
| First return (call on) | TERMINAL transcript + room whisper | `HELP ME.` |
| Second return | TERMINAL transcript + room whisper | `I keep starting the same minute.` |
| First return while muffled | TERMINAL transcript + room whisper | `I can't hear it. It still brings me back.` |
| Call really stopped | TERMINAL (shell line + room narration) | `The call has stopped. The letter is still waiting.` |
| ECHO live link paused, call on | ECHO frozen frame | `You stopped the picture. Not the call.` |
| Empty session window captured | ECHO print | `The window is empty. The mark is on the glass.` |
| Final acknowledgment (future) | TERMINAL | `You were the next person. You can close the window now.` |

Lines never go into the input, never take focus and never force the transcript to scroll while the player is reading earlier lines. Reduced motion shows complete text.

## 8. Requirements and acceptance criteria

**R1 Titlebar drag (mandatory).**
1. Pressing the primary button on an empty part of a titlebar and moving the pointer moves that window by exactly the pointer delta on every move event, with no easing.
2. Minimize/Close buttons, the move handle's keyboard use, inputs, links and selected text never start a drag.
3. The dragged window is raised and becomes the app context.
4. Pointer capture is released on pointerup, pointercancel, lostpointercapture, close, minimize, Escape (which also restores the start position), window blur and page hide.
5. Windows stay inside the workspace above the taskbar, including when the pointer leaves the viewport.
6. Browser resize and window size changes re-clamp moved windows.
7. *Session → Arrange windows* and the keyboard handle (arrow keys, Shift for larger steps) give equivalent movement.
8. Animated `transform` is never used for position.
9. Phones (≤ 640 px) keep the full-screen active-app layout without drag.

**R2 TERMINAL request.**
1. A failed finish with the call on is the only producer of the bell, and it produces it once per return.
2. Muffling stops the ring and the chime but not the return.
3. Stopping the call prints "The call has stopped. The letter is still waiting."
4. Letting it finish with the call stopped reaches the glass exactly once.
5. Forcing with the call stopped leaves a recoverable shadow.
6. Undo restores earlier states until the milestone.
7. `ps`, `jobs`, `kill`, `echo`, `ask`, `cat` and `inspect` answer from state. `kill` targets only `last.session`.

**R3 Glass.**
1. The impression stays at fixed glass coordinates while windows move.
2. Wipes and breaths change one shared fog model, which the desktop, ECHO's monitor and prints all read.
3. The reveal lasts about 2 s, never blocks controls and lands on the same static state as reduced motion.
4. The reveal plays once per case and never replays on reload.
5. The root is never blurred.

**R4 ECHO.**
1. Live, paused and print are visibly and behaviourally different.
2. The monitor's glass view corresponds pixel-for-pixel to the glass behind it.
3. A capture stores exactly the framed data, and its facts never change afterwards.
4. Capturing the empty window explains where the mark is.
5. The tray is limited to 6 prints. A full tray, discarding (with a one-step undo) and keeping are explained.

**R5 Persistence.**
1. `haunt.case.v3` stores the request, glass and prints, validated and bounded.
2. An old `haunt.terminal.v1` ending is removed (only that key) without completing anything, with a one-time notice.
3. Corrupt saves are discarded safely.
4. Window positions, paused frames, Undo history and audio consent are not saved.

**R6 PC presentation.**
1. At 1366×768, 1440×900 and 1920×1080 both windows fit above the taskbar.
2. Body text is at least 12 px, with larger windows and text from 1600 px wide.
3. A build identifier is visible in the taskbar.
4. Smaller screens remain usable.

**R7 Honesty.** CANVAS/POSTMAN are labelled "not in this build". The checkpoint never shows a victory. The status always says the letter is still waiting.

## 9. Before and after

| Player action | Before (v2) | After (v3) |
| --- | --- | --- |
| Watch it try | Leaves, bell recalls it | Tries to *finish the job*; the note is cut off at "FOR THE NEXT PER—"; the bell recalls it; history adds "HELP ME." |
| Silence the bell | "Quiet the bell" stopped the restart (cause and symptom merged) | "Muffle the bell" only silences: it still comes back and says so. "Stop the call" is the real fix. |
| Successful intervention | Two endings (note kept / blank), shell recovered | Partial progress only: the call stops, the run finishes once and its impression reaches the desktop glass. The letter is still waiting. |
| Drag a window | Nothing moved | The window follows the pointer; moving TERMINAL exposes the fixed handprint. |
| Open ECHO | Separate theatre puzzle (cover a private monitor) | A capture studio on the same case: live link, pause, glass viewfinder, prints. |
| Wipe | n/a | Clears fog to reveal the figure but can wipe away the words; breathing brings them back. |
| Reload | Only endings survived | The case, glass and prints survive; old endings are migrated without completing anything. |
