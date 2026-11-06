# TERMINAL Halloween encounter — design

**Authored:** November 6, 2026, in a Kiro IDE session (session context: Claude Opus 5.5; effort setting not verified). Implements `requirements.md` in this folder.

## 1. Principle

One state model, two projections. `LegacySession` stays the only source of truth. The shell banner and the ghost's room are views that read the same snapshot and never keep their own idea of whether the ghost is free. Every visible cue is computed from the snapshot by pure functions in `haunting-presentation.ts`, which can be unit-tested without a browser.

```
LegacySession (model) ──snapshot──► haunting-presentation.ts (pure words, poses, labels)
      ▲                                   │
      │ step / toggle / terminate /       ├──► TerminalController (shell banner, tab bell, footer)
      │ resume / undo / execute           ├──► LegacyView (the ghost's room, under the hood)
      │                                   └──► DesktopShell (desktop task line)
      └──── buttons and typed commands
```

## 2. Model refinement (`legacy-session.ts`)

Only presentation metadata changes. Every process property keeps its previous values and transitions.

| Field | Before | After |
| --- | --- | --- |
| `moment` | `waiting \| memory \| voice \| return \| changed \| ended` | `waiting \| memory \| voice \| recalled \| threshold \| ended` |
| `lastAction` | — | `step \| output \| archive \| restart \| term \| kill \| resume \| null` |

- `step()` sets `lastAction: 'step'`. Phase 2 yields `recalled` when the bell is active (a new copy starts, as before) or `threshold` when it is quiet (the phase stays at 2, as before).
- `toggle(link)` sets `lastAction: link` and **leaves `moment` alone**, so changing an object never moves the ghost.
- `terminate()` sets `lastAction` to `term` or `kill`; it yields `recalled` when the bell is active and `ended` otherwise.
- `resumeResidue()` sets `lastAction: 'resume'` and `moment: 'waiting'`.
- `undo()` restores the whole earlier snapshot, including both fields. `reset()` returns to `waiting`/`null`.
- `status()` now also distinguishes "bell quiet but not released". The phrases the existing checks rely on stay: "Not yet", "hushed the whisper", "Quiet is not the same as free", "do not have to repeat", "remember her line", "cannot remember the line".

`moment` had no consumer other than Codex's draft narration, which this task rewrites.

## 3. Presentation functions (`haunting-presentation.ts`)

| Function | Used by | Derived from |
| --- | --- | --- |
| `hauntingHealth` | shell label | health, output |
| `shellPresentation` | banner, footer, tab, enter button | health, output, archive, restart, cycles |
| `hauntingNarration` | room live region | health, lastAction, moment, output, archive, restart, cycles |
| `ghostPose` | room ghost position | health, moment |
| `whisperText` | room whisper | health, output, archive |
| `justRang` | ring marks | moment, lastAction |
| `objectCopy` | note, whisper and bell cards | health, archive, output, restart, cycles |
| `interiorHint` | room hint | health |
| `desktopTask` | desktop masthead | health, archive |

`ghostPose`: settled → `gone`; residue → `shadow`; `memory` → `reading`; `voice` → `speaking`; `threshold` → `leaving`; anything else → `present`. Because object changes no longer overwrite `moment`, the pose stays where the ghost's own last moment left it.

`justRang` is true only when the latest change was a step or a farewell that the bell answered. After any object change, the ring marks disappear but the tally stays.

## 4. The ghost's room (`legacy-view.ts`)

Order on screen: heading (Bell sound toggle, Back to the prompt), short title, scene, narration, object cards, actions, hint, Under the hood.

- **Scene** (`aria-hidden`; its content is duplicated in text by the cards and narration):
  - The amber moon, scanlines and a vignette.
  - **The way out** at the right edge: an arched doorway. The bell hangs above it, like a shop-door bell that rings when someone leaves. This makes the bell's job readable without explanation.
  - **Mara's note** at the bottom left: paper with handwriting, or a blank page when faded. During `memory` it lifts and glows.
  - **The ghost**, positioned by `data-pose`. Mouth open or closed by `data-whisper`. As a shadow it turns dark and loses its eyes; when gone it passes through the doorway and fades.
  - **The whisper**: phosphor letters above the ghost, written by `ghost-writing.ts`. Empty when hushed.
  - **The bell**: swings once per new return (Web Animations API, skipped with reduced motion). Ring marks are shown while `justRang`. A cloth tie is shown while quiet. The tally shows the cycle count.
- **Object cards** in the scene's left-to-right order. Each has an icon from `specter-art.ts`, a name, its current state and one toggle button with `data-link` (`archive`, `output`, `restart`).
- **Actions**: Watch the next moment (`data-legacy="step"`), Guide it out (`term`), Force it out (`kill`), Call the shadow back (`resume`, only shown for a shadow), Undo (`undo`). Existing selectors are kept so typed and scripted paths still work.
- **Narration**: the only live region in the room (`role="status"`, polite). It is updated only when its text changes. After Undo, it starts with "Undone."
- **Under the hood**: a closed `<details>` with the mapping (note = archive, whisper = stdout, bell = `on_exit` callback, Guide = TERM, Force = KILL), the BASIC listing, `PID … / cycles … / health` (`.legacy-execution`), the technical trace (not live) and the typed commands.
- **Focus**: when the pressed button becomes disabled or hidden, focus moves to Call the shadow back, otherwise Watch the next moment, otherwise Back to the prompt.

### Event-keyed motion

| Event | Detected by | Visual | Reduced motion |
| --- | --- | --- | --- |
| Entering the room | `entered()` counter | whisper is written once | text appears complete |
| A whisper (`voice`) | `voice-<cycles>` key | whisper is rewritten | text appears complete |
| Whisper text changes (unhush, note faded or kept) | text comparison | rewritten | complete |
| Bell return | `cycles` increased and `moment === 'recalled'` | ghost goes to the door and is pulled back; bell swings; optional chime | still poses, ring marks, tally |
| Object change | `lastAction` is a link | card state and object change; ghost does not move | same |

Nothing animates on idle except a slow drift of the ghost (transform only), which is removed with reduced motion and once the ghost has gone.

## 5. Shell (`terminal-view.ts`)

- **Banner** (`.terminal-anomaly`, still the guide's target): the ghost is drawn behind the banner text at the right (`.shell-ghost`, `aria-hidden`). Label, condition and line come from `shellPresentation`. The line is written once per opening of the window and once per new return (`cycles`). Its accessible text sits in a separate `sr-only` span that is not a live region.
- **Buttons**: Follow the ghost / Follow the shadow / Look inside again (`data-enter-session`), Are you okay? (`data-ask-status`), Read the note (`data-read-note` runs `cat last-session`, so the transcript shows the command).
- **Tab bell**: after the first return, a small bell and count appear in the console tab, like the bell indicator in a real terminal tab. It swings once per new return.
- **Transcript intro and footer** in plain words; typed commands are unchanged. The commands row is captioned "If you like typing".
- **After release**: `data-ghost="gone"` hides the ghost (opacity, then `visibility: hidden`). The banner shows the kept note on paper or a blank page. The existing calm blue skin stays.

## 6. Helpers

- `ghost-writing.ts`: `writeGhostly(target, text, animate)`. It builds word and letter spans with staggered CSS animation delays, capped so a reveal ends in under 2 seconds. With reduced motion or `animate = false` it writes plain text. It never moves focus and never writes to a live region.
- `terminal-bell.ts`: optional Web Audio chime, three decaying sine partials. It is off by default, enabled only by a button press, and scheduled on the audio clock without timers. If Web Audio is unavailable, the toggle is hidden.

## 7. Art (`specter-art.ts`)

Refines Codex's original ghost: separate eye, glint, mouth and closed-lips shapes so CSS can show hushed and shadow states. It adds a scene bell (swing group, clapper, ring marks, quiet tie), a doorway and a moon. Everything is inline SVG with `currentColor` and no gradient IDs, because the shell and the room both hold a copy and duplicate IDs inside a hidden view can fail to render.

## 8. Guide and desktop copy

`first-run.ts` keeps its four steps, targets, navigation, Skip, Escape and focus rules. Only the words change. `desktop-shell.ts` and `haunt.html` use `desktopTask`, keeping "✓ TERMINAL recovered."

## 9. Verification plan

- **Unit**: the existing seven recovery cases still pass. A new presentation suite checks that each consequence is described from state, that a hushed ghost stays present, that the two endings differ, that object changes do not move the ghost, and that the new fields do not alter PIDs, cycles or health.
- **Browser, existing**: `check:recovery`, `check:guide`, `check:windows`, `check:echo` and `check:console`, unchanged.
- **Browser, new** (`check:halloween`):
  - Shell ghost and bounded writing, with focus and typing preserved during the reveal.
  - Plain default text, and Under the hood holding the technical terms.
  - The memory, whisper and bell moments.
  - Hush keeps the ghost. A failed guide rings the bell.
  - Quiet bell, then the ghost waits at the door.
  - Both clean endings, with the cleared presence and different banners, check-ins and notes.
  - Force leaves a shadow; resume and Undo work.
  - Reduced motion shows complete text and still poses.
  - The sound toggle is off by default.
  - Focus after release.
  - 390×844 and 800×450 without horizontal overflow.
  - No page errors.

## 10. Risks and trade-offs

- **More controls.** The room has more controls than the brief's minimum: five actions, three toggles, the sound toggle and the disclosure. Mitigations: object toggles sit under their objects, Watch is visually primary, and the hint says nothing is timed. This is the main usability risk left for human testing.
- **Scrolling on short screens.** At 800×450 the room needs vertical scrolling between the scene and the controls. The heading is sticky so Back to the prompt is always visible.
- **No human testing.** The design reasoning has not been tested with people who do not program.
