# TERMINAL Halloween encounter — requirements

**Authored:** November 6, 2026, in a Kiro IDE session. The IDE session context reports the model as Claude Opus 5.5. The reasoning-effort setting and any credit consumption were not visible in the session and are not claimed.
**Scope:** task17 (`PROMPT_KIRO_HALLOWEEN.md`, `docs/development/17_Halloween_Without_Programming.md`). TERMINAL only.
**Inputs inherited from Codex (not Kiro work):** the brief, task16's recovery model and views, the semantic `moment` field, draft narration in `haunting-presentation.ts`, and the original SVG drawings in `specter-art.ts`.

## 1. Critique of the brief

### The weakness: consequences are not attributable

The brief asks the player to "infer cause from visible actions and feedback", but the prepared model and draft narration cannot tell the player *which* action caused *which* result:

- A failed **Guide it out** (the bell is still active) and a natural **Watch the next moment** return both produce the same semantic moment, `return`. The draft narration therefore says "The bell answers the farewell" in both cases. A player who tries to guide the ghost out first sees "it came back" and cannot tell whether their action did anything.
- Every object change produces the same moment, `changed`, which erases which object changed. The draft narration for `changed` describes the bell even after the player fades the note.
- Nothing in the brief requires the bell itself to carry evidence. If the only sign of the bell's role is a sentence, a first-time player falls back to pressing every button until something works. `docs/development/dead-programs-review.md` already identified that button-guessing risk.

### The improvement (concrete and implemented in this task)

1. **Attribute every result in the model, without changing process behavior.** The snapshot gains `lastAction` (`step`, `output`, `archive`, `restart`, `term`, `kill`, `resume` or none). The `return` moment splits into `recalled` (the bell pulled it back) and `threshold` (no bell; it waits at the way out). Object changes no longer overwrite the ghost's moment. PIDs, cycles, phases, health and the two endings are unchanged.
2. **Put the evidence on the bell.** Every return swings the bell (when motion is allowed), shows ring marks, and adds to a permanent tally ("It has called the ghost back twice"). The narration names the player's own attempt: "You guided it toward the way out, but the bell rang and called it back."
3. **Make the ghost's position evidence.** Changing the note, the whisper or the bell never moves the ghost. Only the ghost's own moments and the two farewells move it. When the ghost waits at the way out, the bell is quiet. When the ghost is pulled back, the bell has rung.

## 2. Workflow for this task

1. Read the current instructions and code, critique the brief, write this spec (`requirements.md`, `design.md`, `tasks.md`).
2. Implement in dependency order: model semantics, then pure presentation functions, then art and helpers, then the interior scene, then the shell, then CSS, then guide and desktop copy.
3. Verify: production build with type checking, unit tests, the five existing browser checks (`check:recovery`, `check:guide`, `check:windows`, `check:echo`, `check:console`) and a new `check:halloween` browser check. Inspect the rendered screenshots.
4. Record actual commands and results in `tasks.md` and `docs/kiro-usage.md`. Report what was implemented, what was verified, and what remains.

## 3. The encounter in plain words

| What the player sees | What it means in the program | Model property |
| --- | --- | --- |
| Mara's handwritten note: "I'll finish in a minute." | The saved session text | `archive` |
| The ghost's whisper: glowing words written on the screen | The old program's output | `output` |
| The bell | The terminal bell that rings whenever the old program ends and starts it again | `restart` |
| Watch the next moment | Run one more step of the old program | `step()` |
| Guide it out | Ask it to finish cleanly | `terminate()` |
| Force it out | Stop it abruptly, skipping its clean-up | `terminate(true)` |
| A shadow stuck on the screen | Residue left by an abrupt stop | `health: residue` |

### First 60 seconds

- **0–10 s.** The desktop opens with TERMINAL in front. A first-time player sees the skippable guide. Inside the terminal, a pale ghost rises behind the banner and writes "I'll finish in a minute." one letter at a time. The banner says "A presence is writing" and "Someone's last note keeps writing itself on this screen." Two buttons need no typing: **Follow the ghost** and **Are you okay?**
- **10–20 s.** **Are you okay?** prints TERMINAL's answer in the transcript: "Not yet. Every goodbye calls it back."
- **20–35 s.** **Follow the ghost** turns the same window into the ghost's room: the note on the left, the ghost in the middle with its words glowing above it, the bell on the right and a faint "way out" at the right edge. The narration explains that the ghost keeps saying goodbye and coming back. The main button is **Watch the next moment**.
- **35–60 s.** Three watches show the whole loop: the ghost reads the note; it whispers the words onto the screen; it turns toward the way out, the bell rings and the ghost is pulled back. The bell's tally reads "once". Each object has one plain button under the scene.

### Wrong interventions and what the player observes

| Intervention | Observable consequence | Model result |
| --- | --- | --- |
| Guide it out while the bell can ring | The bell rings, its tally grows, the ghost is back in the middle; the narration names the bell | `recalled`, new copy, still haunted |
| Force it out while the bell can ring | Same, with "You forced it out, but the bell rang and dragged it back" | `recalled`, still haunted |
| Hush the whisper only | The words vanish and the mouth closes; the ghost stays visible in the scene and behind the shell text; `echo` stops showing her line; Are you okay? says "Quiet is not the same as free" | still haunted |
| Let the note fade only | The note becomes a blank page; the ghost whispers dots; the next farewell is still recalled | still haunted |
| Back to the prompt early | Nothing changes; the ghost still writes behind the banner; the desktop task stays open | still haunted |
| Quiet the bell, then Force it out | The ghost vanishes abruptly and a dark shadow stays on the glass; **Call the shadow back** appears; Undo works | `residue`, not recovered |

### Successful endings

- **A — The note is kept.** Quiet the bell, keep the note, Guide it out. The ghost slips out through the way out; the note stays in the room. Back at the prompt, the ghost is gone from behind the text, the skin turns calm blue, and the banner shows the note as a kept memory. Are you okay? answers "Yes. I remember her line. I do not have to repeat it." `echo` prints only the player's words. **Read the note** shows her line and "It is no longer executable." The desktop task shows "✓ TERMINAL recovered."
- **B — The page is blank.** Let the note fade, quiet the bell, Guide it out. The ghost slips out; the page in the room stays blank. The banner shows a blank page. Are you okay? answers "It is quiet now. I cannot remember the line." **Read the note** shows "The archive is blank." The desktop task shows "✓ TERMINAL recovered" with the blank-page wording.

Both endings are valid. They differ in the retained text, the banner, the check-in reply and the desktop task line.

## 4. Requirements and acceptance criteria

### R1 — The haunted shell

1. WHEN TERMINAL is open and the session is haunted, THE shell SHALL show a ghost figure behind the banner text and SHALL write the farewell line letter by letter once per writing event (opening the window, a new return, or a change of what the ghost can write).
2. WHILE the line is being written, THE input SHALL keep focus and accept typing; the writing SHALL NOT add transcript lines or move focus.
3. THE banner SHALL offer **Follow the ghost**, **Are you okay?** and **Read the note**, all usable without typing.
4. THE banner's default text SHALL NOT contain PID, stdout, BASIC, TERM, KILL, callback or on_exit.
5. WHEN the bell has called the ghost back, THE terminal tab SHALL show a visual bell mark, as real terminals do for a bell character.

### R2 — Inside the same window

1. WHEN the player presses Follow the ghost or types `enter last.session`, THE same TERMINAL window SHALL show the ghost's room; no second window SHALL open.
2. THE room SHALL show the note, the ghost and its whisper, the bell and the way out. Each SHALL reflect its model property at all times: note ↔ `archive`, whisper ↔ `output`, bell ↔ `restart`.
3. EACH object SHALL have one plain-language control next to its current state, in the same left-to-right order as the room.

### R3 — Experiments with visible results

1. **Watch the next moment** SHALL call `step()` and show, in turn: the ghost reading the note; the ghost whispering; the ghost turning to leave, then either being pulled back by the ringing bell or waiting at the way out.
2. **Hush the whisper** SHALL remove the written words and close the ghost's mouth while the ghost stays visible in the room and behind the shell banner.
3. **Keep the note / Let the note fade** SHALL change the note immediately. Fading alone SHALL NOT free the ghost.
4. **Quiet the bell** SHALL mark the bell as quiet. The next attempt to leave SHALL NOT bring the ghost back.
5. EVERY return SHALL leave visible evidence on the bell (ring marks and a return tally) and narration that names the player's attempt when there was one.
6. CHANGING an object SHALL NOT move the ghost.

### R4 — Farewells

1. **Guide it out** SHALL call the clean release. With the bell quiet it frees the ghost; otherwise the bell recalls it.
2. **Force it out** SHALL call the forced release. With the bell quiet it leaves a shadow; **Call the shadow back** SHALL then appear, and Undo SHALL remain available.
3. NO action SHALL depend on hearing. Sound SHALL be off by default. An optional "Bell sound" toggle MAY play a short synthesized chime when the bell rings.

### R5 — Return to the prompt

1. AFTER a clean release, THE ghost SHALL disappear from the room and from behind the shell text, and the shell skin SHALL change.
2. **Are you okay?** SHALL answer from the actual state: haunted with an active bell, hushed, bell quiet, shadow, kept note or blank page.
3. AFTER a clean release, `echo` SHALL print only the player's words, and `cat last-session` SHALL show the kept line or the blank archive.
4. RETURNING to the prompt, hushing, fading the note or forcing SHALL NOT mark TERMINAL recovered.

### R6 — Under the hood (optional)

1. A collapsed **Under the hood** section SHALL hold the PID/cycles/health line, the technical trace, the BASIC listing, the mapping to `archive`/`stdout`/`on_exit`/TERM/KILL and the typed commands.
2. ITS content SHALL NOT be a live region.

### R7 — Motion, access and layout

1. EACH writing reveal SHALL finish within 2 seconds and SHALL NOT repeat for the same event. With reduced motion, text SHALL appear complete immediately, and the ghost, bell and note SHALL use still poses.
2. THERE SHALL be no flashing, glitch storms, timers, required waits or repeated jump scares.
3. EACH view SHALL have one polite live region for its plain-language result, updated only when the state changes.
4. EVERY action SHALL be a button reachable by keyboard. WHEN the pressed button becomes disabled or hidden, focus SHALL move to the most relevant enabled control.
5. AT 390×844 and 800×450, THE terminal SHALL have no horizontal overflow and every control SHALL be reachable.
6. CLOSING and reopening TERMINAL SHALL keep the encounter's state; a page reload resets it (unchanged).

### R8 — Preservation

1. PROCESS behavior SHALL stay identical: PID changes, cycles, phases, health outcomes, Undo, resume and `restore terminal`.
2. TYPED commands SHALL keep working. The ECHO workshop, the mirror process console and the paper-bridge prototype SHALL be unchanged.
3. NO new applications or dependencies.

### R9 — Guidance copy

1. THE first-run guide and the desktop task line SHALL describe the encounter in plain words and SHALL keep their existing targets, navigation, Skip and Escape behavior.

## 5. Out of scope

Other applications, new windows, persistence across reloads, a BASIC interpreter, host terminal access, recorded audio files, and any claim of human-tested enjoyment or originality.
