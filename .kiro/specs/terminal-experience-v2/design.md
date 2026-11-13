# TERMINAL experience v2 — design

Kiro IDE session, November 6, 2026. This design implements `requirements.md` in this folder. It builds on the task17 design, which keeps one model with pure presentation functions and two views.

## 1. Model additions (`legacy-session.ts`)

| Addition | Purpose | Invariant kept |
| --- | --- | --- |
| `observe()` | One complete attempt to leave: advance until `recalled` or `threshold`, recorded as **one** Undo step, with `lastAction: 'observe'` | Its transitions equal calling `step()` repeatedly. PIDs, cycles and phases are identical. |
| `lastEvent(): { id, kind }` | A monotonic event identity that is **not** part of the snapshot. Views use it to tell a new event from a re-render. Undo and reset are events of their own. | Snapshot equality tests are unaffected. |
| `new LegacySession(saved?)` | Starts settled from a validated saved outcome | `reset()` still returns to the haunted initial state with PID 3087. |

`step()` stays. It is offered as **Step one moment** under Under the hood, for anyone who wants the slow trace.

## 2. Presentation (`haunting-presentation.ts`, pure)

- **New functions:**
  - `primaryAction(state)` returns the intent and label:
    - `observe`: "Watch it try to leave" or "Watch it try again";
    - `door`: "Go to the way out";
    - `resume`: "Call the shadow back";
    - `handover`: "Take back the prompt".
  - `roomHint(state, explicit)` returns an observation line, or with `explicit` the direct help.
  - `doorCopy(state)` describes the way out.
- **Narration** for `observe`:
  - "It tried to leave. At the way out, the bell rang and pulled it back to start again…"
  - "…the bell stayed quiet… it is waiting at the way out."
- **Shell copy:**
  - The released banner says "The prompt is yours again."
  - `shellIntro(state)` opening lines depend on the state when the shell is built, so reopening after release does not claim that something is still writing.
  - `handoverLines(state)` gives the one-time handover text.

## 3. Cue ownership (`terminal-cues.ts`, new)

`CueSet` owns Web Animations created by a view:
- `play(element, keyframes, options)` registers the animation. A rejection handler is attached to `finished`, so cancelling never raises an unhandled rejection.
- `cancel()` cancels every registered animation.
- `size` reports how many are active (used by checks through the DOM, not exported globally).

**When cues are cancelled.** The room cancels on these new events: `undo`, `reset`, `observe`, `step`, `term`, `kill`, `resume`. Object toggles (`output`, `archive`, `restart`) keep a running cue, because "the bell already rang" is still true. Every cancellation also calls `terminalBell.silence()`. The shell's tab bell follows the same rule.

**Other boundaries:**
- `leave()` (Back or Take back the prompt), `suspend()` (minimize) and `dispose()` (close) cancel cues and silence the bell.
- A `matchMedia('(prefers-reduced-motion: reduce)')` change listener cancels cues and re-renders, so poses settle at once. CSS already makes the letters complete.

**Reduced-motion CSS.** Inside `.terminal-console` it sets `transition: none !important` on every element. That removes the 0.01 ms transitions the global rule creates (baseline B1). The desktop-wide rule is unchanged, so ECHO and window behavior are untouched.

## 4. Audio (`terminal-bell.ts`)

- **Tracking.** `ring(delay)` registers each voice (an oscillator and its gain). Each voice removes itself on `ended`.
- **Silencing.** `silence()` cancels the scheduled gain values, sets the gain to 0 at `currentTime`, calls `stop(currentTime)` (which also prevents a not-yet-started voice from sounding) and disconnects.
- **Muting.** `setEnabled(false)` calls `silence()`.
- **Verification limit.** Regressions use a recording fake `AudioContext` injected by the check. That proves the cancellation calls only; nothing is claimed about audible playback.

## 5. The room (`legacy-view.ts`)

```
.legacy-interior (flex column, fills the window)
├─ header.legacy-heading      source label · Back to the prompt
├─ .room-body (scrolls)
│   ├─ intro: kicker, title
│   ├─ .spectral-scene: moon (decorative) · whisper (decorative)
│   │    button.scene-note[data-object=archive] · button.scene-ghost[data-object=output]
│   │    button.scene-bell[data-object=restart] · button.scene-door[data-object=door]
│   ├─ p.haunt-narration (role=status, the only live region)
│   ├─ section#room-panel (one panel; content follows the selected object)
│   └─ details.under-hood (mapping, BASIC, PID line, trace, Step one moment, commands)
└─ footer.room-footer
    ├─ #room-hint (shown on request): observation line · "Tell me exactly"
    └─ primary (data-main-action, data-legacy = intent) · Undo · Hint (?)
```

- **Panel actions.** Each panel shows only its own buttons, and the selectors stay unique for the scripted paths:
  - note: `data-link="archive"`;
  - ghost: `data-link="output"`;
  - bell: `data-link="restart"` and Bell sound;
  - way out: `data-legacy="term"`, plus `data-legacy="kill"` styled as secondary.
- **Selection.** Selection is view state, not saved. Pressing the selected object again closes the panel. `Go to the way out` selects the door and moves focus to Guide it out.
- **Focus.** When the pressed button becomes disabled or hidden, focus moves to the primary action (or Back if that is unavailable).
- **Ring marks.** These are event-driven (`ringing`): shown for a new ring and kept through object toggles, cleared by any cancelling event. They are never re-created from an old snapshot, so Undo cannot bring back a past ring.
- **Choreography for a new event** (skipped with reduced motion; the scene shows the final pose instead):
  - **observe from phase 0:** read for 0–700 ms (note glow, the ghost leans), whisper for 700–1800 ms (letters written with a base delay), walk to the door for 1800–2500 ms, then either the bell swings at about 2500 ms and the ghost is pulled back by about 3300 ms, or the ghost stays at the door. Starting from phase 1 or 2 skips the earlier beats.
  - **failed `term` / `kill`:** walk (700 ms, or a 350 ms shove for kill), bell swing, pull back.
  - **successful `term`:** the CSS exit to `gone`, the designed motion.
  - **`kill` into a shadow:** CSS colour and filter change only.

## 6. The shell (`terminal-view.ts`)

- **Banner buttons:**
  - Follow the ghost / Follow the shadow / Look inside again (`data-enter-session`);
  - Are you okay?;
  - **Say something** (`data-say`), which fills `echo `, focuses the input and places the caret at the end;
  - **Haunt it again** (`data-haunt-again`), on the released banner only, which runs `restore terminal`.
- **Transcript styling.** Output lines that start with `MARA@1987>` are styled as ghost writing (`console-ghost`).
- **Handover.** `showShell({ handover: true })` focuses the input. It prints `handoverLines` once per release event.
- **Tab bell.** Owned by a `CueSet`, cancelled by the same events, and also on suspend, dispose and reduced motion.
- **Banner writing.** Animated only for a new return (a ring event), a reset or opening the window. Undo writes it without animation.

## 7. Layout

- **Phones (≤640 px).** `#window-terminal` fills the stage (`inset: 0`, no radius or translate). The title bar is 44 px high. The heading shows only Back. The guide's step-2 rule is overridden to keep the card above the window.
- **Room proportions.**
  - Scene: `clamp(150px, 34vh, 250px)`.
  - Narration: at least 2 lines at 13–14 px.
  - Footer: one row of primary, Undo and Hint, each at least 44 px high on phones.
  - Under 580 px tall, the intro title is hidden and the scene is 132–150 px.
- **Wide desktops.** *(Revised.)* The left position is kept. A centred variant broke the tested console + ECHO side-by-side workflow and was reverted (requirements §5.3).
- **Room height.** On desktop the room has a fixed height, so the window does not jump as the narration or panel changes. The scene grows to `clamp(170px, 34vh, 340px)`.
- **Short wide screens.** Below 580 px tall and at least 560 px wide (landscape phones, 800×450, 200% zoom), the scene and the narration sit side by side.
- **Safe areas.** `viewport-fit=cover` is added. The menu bar and dock pad with `env(safe-area-inset-*)`; these are 0 on desktop browsers.
- **Text sizes.** Scene labels and chips are at least 11 px.

## 8. Save (`terminal-save.ts`, new)

- **Format.** The key `haunt.terminal.v1` holds `{ v: 1, outcome: 'remembered' | 'blank', returns: 0–999 }`.
- **Writing.** `saveTerminalOutcome(state)` writes only settled outcomes and removes the key otherwise, so Undo out of an ending forgets it.
- **Reading.** `loadTerminalOutcome()` validates, removes corrupt or unexpected values and returns `null`. Storage exceptions are ignored.
- **Startup.** `desktop.ts` builds `LegacySession` from the loaded outcome, saves on every change, and marks the desktop task at startup.
- **Not saved.** Audio, cues, the selected panel and the guide.

## 9. Verification design

- **Unit tests:**
  - `observe` equals steps and is one Undo step;
  - `lastEvent` kinds;
  - restore from a saved outcome;
  - save validation (fake storage);
  - `primaryAction` and hints.
- **`check:halloween`, rewritten for the new flow and keeping the earlier semantic assertions.** New regressions:
  - B1 in the same task;
  - B2 Undo;
  - B3 live reduced motion;
  - B4 fast repair;
  - B5 a fake-audio voice stop on mute, Undo and leaving;
  - first view at four sizes plus the 640×400 zoom equivalent;
  - 44 px targets;
  - the footer never covering the narration;
  - handover and Say something before and after release;
  - save and reload of both endings, Haunt it again, and corrupt-save handling.
- **`check:recovery`.** It opens the relevant object or door before acting. Its assertions are unchanged.
- **Guide, windows, ECHO and console checks** run unchanged.
