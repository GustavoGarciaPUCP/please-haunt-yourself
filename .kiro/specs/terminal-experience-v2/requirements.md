# TERMINAL experience v2 — requirements

**Authored:** November 6, 2026, Kiro IDE session (the session context reports Claude Opus 5.5; the effort setting and credits were not visible and are not claimed).
**Inputs:** `Kiro brief 02` and `docs/development/18_Opus_Experience_Review.md` (both Codex-authored), plus the task17 delivery at commit `739c548`. The task17 spec in `.kiro/specs/terminal-halloween/` stays unchanged as history.
**Scope:** TERMINAL only. ECHO, the process console, `src/core` and the paper-bridge `index.html` are out of scope.

Everything in sections 1–3 was observed before any source change. Sections 4–8 are the plan; `tasks.md` records what was actually implemented and verified.

## 1. Official context, re-checked in this session

- **Overview page fetched** (https://kiroween.devpost.com/). The Costume Contest asks for "a haunting user interface that's polished and unforgettable" with "spooky design elements that enhance your app's function." The judging criteria are Potential Impact, Technological Implementation (how well Kiro is used), Design ("a complete, coherent product experience"), Innovation/Idea and Presentation.
- **Rules page not fetched.** https://kiroween.devpost.com/rules returned HTTP 403 to this session's fetch tool. The equal 20% weights stated in review 18 could not be re-confirmed here. That is a verification gap, not a known discrepancy.
- **Submission requirements** (overview page): a working app, a public open-source GitHub repository with `/.kiro` at the root, a public YouTube demo under 3 minutes, and a write-up on Kiro use. This task does none of them: no publishing, push, submission or video.

## 2. Audience and value hypothesis (to be tested, not established)

- **Audience:** people who enjoy short Halloween browser stories, including people who do not program.
- **Value:** they enter a familiar app that behaves strangely, discover by watching why it keeps repeating, make one meaningful choice about what to keep, and get the working app back.
- **Claims not made:** no educational claim and no market figures. The playtest protocol in `tasks.md` tests these hypotheses.

## 3. Baseline evidence (before changes)

Source: `output/playwright/v2-baseline.json`, produced by `output/playwright/v2-baseline-diagnostics.mjs` against the unchanged source. That folder is git-ignored; the numbers are copied here.

| # | Observation | Finding |
| --- | --- | --- |
| B1 | `check:halloween` line 232 (reported by Codex) | The one animation is a **`CSSTransition` on `visibility`, 0.01 ms**, on `.shell-ghost .specter-art`, read in the same task as `restore terminal`. Two frames later the count is 0. **Cause:** the desktop-wide reduced-motion rule sets `transition-duration: 0.01ms` on every element, and every element's default `transition-property` is `all`. So the visibility the SVG inherits from the ghost becomes a 0.01 ms transition. The drift animation is not involved. My task17 check read the count on the same frame and raced that transition. |
| B2 | Undo after a failed farewell | The ghost's 1150 ms recall animation and the bell swing are still `running` after Undo, while the model is back to `present`, cycles 0. |
| B3 | Reduced motion switched on mid-recall | The recall is still running 80 ms later, and the ghost's `left` moved from 348.8 px to 364.0 px. |
| B4 | Fast clicks: farewell, quiet the bell, farewell | The final state is `remembered` and `gone`. The designed exit (CSS transitions, 900 ms and 0 ms) runs **together with a stale recall** (Web Animations API, 1150 ms). |
| B5 | Audio, using a recording fake AudioContext (not audible) | After muting, and after Undo, the scheduled chime voices received only their own original stop call. Nothing cancelled them. |
| B6 | First view of the room | **8 enabled buttons at every size.** The primary "Watch" button is outside the first view at 320×568 (room 387 px tall, content 936 px), 390×844 (647 px vs 930 px) and 800×450 (269 px vs 555 px). At 320×568 and 800×450 the narration is also outside the first view. The smallest text is 9 px. There is no horizontal overflow. |

## 4. What this brief got right, and what I challenged

- **Line 232.** The brief asks whether it is a cancellation defect or a synchronization flaw. **It is both, in a narrow sense.** The assertion raced a 0.01 ms transition, and the product created needless transitions under reduced motion. Fix: remove the source inside TERMINAL, and keep the strict assertion, now made deterministic and also checked in the same task.
- **"Stale recall" versus the designed exit.** Accepted, and made testable: a recall is a Web Animations `Animation`, while the designed exit is a `CSSTransition`. The regression requires no `Animation` to be running in the final state and allows the exit transition.
- **Muting.** The brief asks that muting silence scheduled and active voices. That is accepted, and widened: Undo, reset, a new farewell, Back to the prompt, minimize and close also stop TERMINAL's cues and chimes.
- **Sticky controls.** The brief says sticky controls must not cover narration. I go further: there is no overlaying sticky element at all. The room becomes header / scrolling body / footer, so content can never sit under a control.
- **Movable desktop windows.** Evaluated and **not added** (see §5.3).
- **"Personal first line".** Evaluated and **not added as stored text** (see §5.4).

## 5. Alternatives and decisions

### 5.1 How the room is arranged

| Option | What it is | Verdict |
| --- | --- | --- |
| A. Guided storyboard | One button plays a return; object controls unlock only after it; the farewell unlocks after the bell is quieted | **Rejected.** It gates experienced players behind a compulsory tutorial, which the brief forbids, and it hides choices instead of ranking them. Its one-button observation is kept. |
| **B. Scene-first objects, one contextual action** | The scene is the interface. Note, Ghost, Bell and Way out are labelled, always-available buttons drawn as the objects. Selecting one opens **one** panel with that object's action. The footer holds **one** primary action that changes with the state, plus Undo and Hint. Farewells exist only at the way out. | **Selected.** At first view there is exactly one state-changing action. The spooky objects *are* the controls (Costume Contest: spooky elements enhance function). Nothing is gated, and every action works with pointer, touch and keyboard. |
| C. Conversation in the transcript | The ghost writes in the transcript and the player answers with choice chips | **Rejected.** It turns a cause into a menu or quiz, tells the bell's role instead of showing it, and drifts toward the fake chat the brief forbids. |

### 5.2 Phone layout

| Option | Verdict |
| --- | --- |
| Floating window scaled down (current) | **Rejected.** About 36 px of width is lost, the heading wraps into two rows, and the actions start below the first view. |
| **Active-app mode** (≤640 px wide): the TERMINAL window fills the workspace between the menu bar and the dock; its title bar acts as the app bar, Minimize returns to the desktop, and the dock switches apps | **Selected.** It keeps the OS identity and app switching, and gives the encounter the whole workspace. |
| A separate mobile page or a drawn phone frame | **Rejected.** It breaks the OS fiction, and the brief forbids miniature devices. |

### 5.3 Desktop composition and movable windows

- **Composition: planned, implemented, then reverted.** The plan was to centre TERMINAL to the right of the masthead on screens ≥1100 px wide, so the recovery line stays visible. I implemented it, but `check:console` failed: typing in the console while clicking ECHO beside it is a tested workflow, and a centred TERMINAL covered ECHO's controls.
  - **Decision:** TERMINAL keeps its left position, and the right side of the wallpaper is deliberately reserved for ECHO.
  - **Where completion now appears:** at the point of play (room narration, Take back the prompt, the "At peace" banner) instead of the masthead.
- **Titlebar dragging: not added.** It is an OS-wide window behavior that would also change ECHO's tested lifecycle. It does not address any observed first-use defect, and the brief warns against letting it displace that work. It is recorded as a possible later OS task.

### 5.4 Closure

| Option | Verdict |
| --- | --- |
| **Deliberate handover of the prompt** | **Selected.** After the farewell, the room's primary action becomes **Take back the prompt**. The shell then prints a one-time handover and offers **Say something**, which fills `echo ` into the real prompt. While the ghost is present, the player's words come back followed by the ghost's line, in ghost styling. After release, only the player's words come back. The restored function is demonstrated with the app's own command, not a badge. |
| Player-written first line, stored and reused | **Rejected for now.** It adds a stored free-text artifact (validation, persistence, privacy) without a clearer payoff than seeing `echo` return your own words. |
| Retained artifact | **Kept**, as the existing kept note or blank page. It now also survives a reload (§7). |

## 6. The selected first 60 seconds

1. **0–10 s.** TERMINAL opens. A ghost behind the banner writes "I'll finish in a minute." The banner offers **Follow the ghost** (primary), **Are you okay?** and **Say something**.
2. **10–25 s (optional).** Say something, then "hello": the transcript shows "hello" and then the ghost's line breaking in. Are you okay? answers "Not yet. Every goodbye calls it back."
3. **25–35 s.** Follow the ghost. In the same window: the scene with labelled Note, Ghost, Bell and Way out; one sentence of narration; one primary action, **Watch it try to leave**.
4. **35–45 s.** Watch: the ghost reads the note, whispers its line, and walks to the way out. The bell above the door swings, and the ghost is pulled back. The tally reads "rang once" and the narration names the bell. The whole sequence takes about 3 s, any action interrupts it, and with reduced motion it settles at once.
5. **45–60 s.** The player selects the Bell, for curiosity or from the Hint. The panel explains that it rings whenever the ghost leaves and calls it back, and offers **Quiet the bell**.
6. **After that.** Quiet, then Watch: the ghost waits at the way out. The primary action becomes **Go to the way out**, which opens the door panel with **Guide it out** (and a secondary **Force it out**). After release, the primary action becomes **Take back the prompt**.

## 7. Requirements and acceptance

### R1 — Authoritative state and cue ownership

1. Each view SHALL own its Web Animations cues and SHALL cancel them on:
   - Undo, reset, a new observation, step or farewell, and resume;
   - leaving the room, minimize and close;
   - a live switch to reduced motion.
   Toggling an object SHALL NOT cancel a truthful running cue.
2. After Undo, no recall or bell animation SHALL be running, and the scene SHALL show the restored pose at once.
3. A live switch to reduced motion SHALL leave no running cue, and the ghost's position SHALL not change afterwards.
4. In a fast farewell → quiet → farewell sequence, the final state SHALL have no running recall `Animation`. The designed exit transition MAY run.
5. The chime module SHALL track every voice. Muting, Undo, reset, a new farewell, leaving the room, minimize and close SHALL stop scheduled and playing voices.
6. Under reduced motion, TERMINAL elements SHALL create no transitions. A state change SHALL leave zero animations on the shell ghost, even within the same task.

### R2 — Hierarchy and discovery

1. In the first room view there SHALL be exactly one enabled state-changing action, the primary one. The objects, Back, Undo (disabled until something happens) and Hint SHALL be the only other controls.
2. Note, Ghost, Bell and Way out SHALL be real buttons with visible labels, pressable by pointer, touch and keyboard. Selecting one SHALL open one panel and report `aria-expanded`.
3. The primary action SHALL follow the state: Watch it try to leave, then Go to the way out (waiting at the door), Call the shadow back (shadow), and Take back the prompt (released).
4. **Watch** SHALL perform one complete attempt to leave as a single undoable step, ending either pulled back by the bell or waiting at the door.
5. Hint SHALL first offer an observation, and only on a second request explicit help.
6. Force it out, Bell sound and Under the hood SHALL remain available inside their context (door panel, bell panel, end of the body) without competing with the primary action.
7. The meanings from task17 SHALL hold:
   - hushing is not recovery;
   - fading the note alone is not recovery;
   - returning early is not recovery;
   - forcing leaves a shadow that can be called back;
   - both clean endings stay distinct.

### R3 — Layouts

1. At 320×568, 390×844, 768×1024 and 800×450 the first room view SHALL show the scene, the narration and the primary action without scrolling.
2. There SHALL be no horizontal overflow at any of those sizes.
3. Primary actions and object targets SHALL be at least 44×44 px on phones.
4. Meaningful text SHALL be at least 11 px.
5. The footer SHALL never cover the narration or the objects.
6. At 640 px wide and below, TERMINAL SHALL fill the workspace between the menu bar and the dock. The dock and the menu bar SHALL respect safe-area insets.
7. *(Revised during verification, see §5.3.)* On wide desktops TERMINAL SHALL keep the side-by-side layout with ECHO. Completion SHALL be visible where the player is: the room narration, the handover and the shell banner.
8. A 640×400 viewport (equivalent to 200% zoom on a 1280×800 screen) SHALL remain usable without horizontal overflow.

### R4 — Closure and return

1. **Take back the prompt** SHALL return to the shell, focus the input and print a one-time handover.
2. **Say something** SHALL fill `echo ` into the real prompt. While haunted, `echo` output SHALL include the ghost's line in ghost styling. After release, it SHALL include only the player's words, rendered as text and never executed.
3. A completed outcome (note kept or page blank, plus the return count) SHALL be saved under one versioned key, `haunt.terminal.v1`. A reload SHALL show that outcome. Unfinished sessions SHALL NOT be saved: they restart on reload. Corrupt, old or unexpected data SHALL be ignored and removed.
4. **Haunt it again** (on the released banner) and `restore terminal` SHALL reset the encounter and clear the save.
5. Audio consent, animations and the guide SHALL NOT be saved.

### R5 — Preservation

1. Process outcomes SHALL stay identical: PIDs, cycles, phases, health, Undo, resume and typed commands.
2. The existing recovery, guide, window, ECHO and console checks SHALL pass. Where the room's flow changed, a check MAY open the relevant object before acting, and the change SHALL be explained. No semantic assertion SHALL be removed.
