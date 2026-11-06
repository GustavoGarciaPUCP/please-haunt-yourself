# Kiro IDE task — make the existing terminal haunting playable without programming

This is a Codex-prepared brief for the participant to run in Kiro IDE. It is NOT evidence that Kiro or Opus has already executed this task. Work in `C:/Users/51924/Documents/Kiroween2026/PleaseHauntYourself`.

## Read first

Read the latest AGENTS.md instruction, docs/development/17_Halloween_Without_Programming.md, then the existing terminal recovery model/view and relevant checks. Task17 refines task16's existing encounter; do not replace the application-owned recovery loop with a separate game beside the terminal. Root index/src/core remain the historical paper-bridge prototype and must be preserved. ECHO is a preserved workshop, not the focus of this task.

The participant wants a beautiful Halloween experience understandable to someone who has never programmed. Their correction is substantive: the spooky behavior, interaction and repair must be part of this particular application's function. Merely adding pumpkins, ghost wallpaper or renaming technical buttons will not suffice.

## Critique and flow before coding

Use Spec mode if available; otherwise create a concise local spec directly. Write actual `requirements.md`, `design.md` and `tasks.md` under `.kiro/specs/terminal-halloween/`. Do not call existing Codex planning Kiro-authored. Explain one weakness in this brief and improve it with a concrete feasible choice. Avoid claims of global originality, prize-worthiness or human-tested fun.

Define the first60seconds, what the player sees/understands/does, each wrong intervention's observable consequence, and both successful endings. Then implement this one encounter. Do not stop after cosmetic CSS or write a spec claiming unimplemented behavior exists.

## The same TERMINAL owns the haunting

1. **Before:** a spectral presence behind the text writes an old farewell. The real player input remains usable. An explicit Listen/check-in button and Follow the ghost/enter action require no typed command.
2. **Inside:** the same terminal window becomes a small spectral scene. Its old note, whisper and terminal bell are meaningful native elements, not unrelated fantasy props. The bell calls the presence back when it tries to leave. The existing restart boolean remains the source of this behavior.
3. **Experiment:** Watch the next moment advances the real model. Hush the whisper stops its words while the ghost remains. Keeping/fading the note changes what is retained. Quieting the bell prevents the next return. The player should be able to infer cause from visible actions and feedback, rather than memorizing callback/process terminology.
4. **Exit:** Guide it out maps to the existing clean release; Force it out leaves a recoverable shadow. Undo and a gentler farewell remain available. Sound is optional and no action depends on hearing.
5. **Return:** the presence clears and the normal shell changes. Are you okay? answers from actual state. The preserved note versus blank archive must remain genuinely different. Existing `echo` behavior must stay repaired after a clean exit. Returning or hushing alone is not a successful recovery.

Default visible actions/narration must use plain English. PID, stdout, BASIC, TERM/KILL and callbacks belong in a clearly optional Under the hood section, while typed commands continue to work for people who want them. Preserve technical identity through the actual terminal, history, writing, output and bell; do not hide a generic minigame behind a terminal border.

## Prepared scaffolding — inspect before using

- `src/haunt/legacy-session.ts` remains the independent model. Codex added a semantic `moment` to snapshots so presentation need not parse technical trace strings.
- `src/haunt/haunting-presentation.ts` contains draft plain-language narration/health mapping; critically improve copy as needed.
- `src/haunt/specter-art.ts` contains original inline SVG ghost/note/whisper/bell artwork. It is a starting point, not an already integrated visual result. Prefer refining code-native art over adding dependencies or remote copyrighted assets.
- Existing `legacy-view.ts`, `terminal-view.ts`, `desktop.css` and `first-run.ts` still need the Halloween/non-programmer presentation work. Do not claim this scaffold has completed it.

## Interaction and motion requirements

Use a bounded ghost-writing reveal that does not steal input or continuously spam output/assistive announcements. Show complete text immediately with reduced motion. No flashing, incessant glitching, forced sound, mandatory waits, timed puzzle or repeated jumpscare. A clear ghost remains after a mere hush; successful release clears its presence. Cues and narrative must be derived from actual state, never just a success class applied for appearance.

Keep focus/keyboard access, Skip/Escape/guide navigation, reduced motion, app close/reopen state and390×844 /800×450 layouts usable. Technical commands remain a fictional bounded game shell, not host OS process execution. Do not change existing process semantics or silently simplify both endings into one.

## Scope and execution constraints

Implement TERMINAL only. No new apps, package/framework installs, purchases, account/region changes, publication, uploads, git push or submission. Preserve original code/history, genuine prior `.kiro` evidence and the ECHO workshop. Do not repeatedly retry the CLI from the IDE. Use the model actually selected/available in the IDE and never claim Opus/max if unavailable. No raw private reasoning, credentials or account identifiers in files.

## Verification and final report

Run `npm.cmd run build`, `npm.cmd test`, and relevant existing `check:recovery`, `check:guide`, `check:windows`, `check:echo`, `check:console` against the local server if available. Add or adapt meaningful browser checks for real ghost/voice/bell feedback, both endings, optional technical inspection, bounded/reduced-motion text and narrow layouts. Do not remove useful assertions just to pass changed copy. Record actual commands/results and what could not be checked.

End with: changed files; actual spec/implementation contributions; tests run/results; limitations; and one remaining creative/usability risk. Do not declare it human-tested or a winning game. Codex will independently review files and rendered behavior after this task.
