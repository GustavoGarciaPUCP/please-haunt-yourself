# App identity and process rehearsal

November6,2026. Codex-authored bounded implementation brief responding to the participant's request for more recognizable software interfaces and meaningful fictional `kill` actions. This extends the earlier experience contract only for the current example rehearsal. Personal recording, the complete show, saving and other app encounters remain pending.

## Design plan and critique

Keep the shared nocturnal OS chrome and illustrated cast. App interiors must communicate their functions through controls and behavior, not merely different colors.

| App | Visual/interaction vocabulary | Scope now |
| --- | --- | --- |
| TERMINAL | Carbon #090f14, phosphor #b4d5c0, diagnostic amber #d7b681, lavender #b6a6d7; Cascadia Code/Consolas; fixed-width process table, selectable output, command history, prompt and blinking block cursor | Implement |
| ECHO | Slate #1c2933, monitor #0f1820, signal blue #a9c8e3; system sans for app controls; input/output monitors, source indicator, transport status; illustrated theatre stays inside its public output | Implement |
| CANVAS | Future checkerboard, layer list, selection handles and paper source sheet | Planned, no fake working controls |
| REPLAY | Future event strip, playhead and comparison checkpoints | Planned |
| POSTMAN | Future inbox, envelopes and readable returned-view postcards | Planned |
| UNINSTALL | Current movable farewell scenery; future bounded exit dialogue | Keep existing prop |

Layout: TERMINAL `[session tab / transcript / prompt / discoverable command shortcuts]`; ECHO `[capture toolbar / source + scene brief / public output | private monitor / transport + editing tools]`. Console text is left-aligned and monospace. The theatrical quotation can retain a serif while technical controls use a sans face.

Critique: recoloring the same card would miss the request. The console must accept commands and show changing process data, while ECHO must render those same changes. Do not add a decorative browser/address bar where no browser exists. Blinking belongs only to the active empty terminal prompt, stops on blur/minimize/reduced motion, and is not accompanied by mandatory sound. No child entrance stagger or fake boot delay.

## Bounded gameplay contract

Two fictional local processes maintain the reflection: `watchd` PID400 supervises `mirror.watch`, initially PID410. They belong only to this browser game's session; commands never invoke a shell, operating-system process API or remote service.

1. `ps` reveals live process relationships and display-buffer state.
2. `inspect 410` explains the private-reflection dependency and its supervisor. `inspect 400` explains the supervisor's deliberately bounded behavior: stopping it disables restarts but leaves its current child running.
3. `kill -TERM 410` while watchd is active is acknowledged, but watchd immediately starts a new watcher with a new PID. ECHO's reflection remains live. Output explains the causal failure.
4. `kill -TERM 400`, followed by TERM to the current mirror PID, releases the reflection cleanly. ECHO's private monitor goes blank with an explicit released label. The public stage must still be unobstructed, then the player can rehearse normally without covering the monitor.
5. `kill -9 <mirror PID>` bypasses the fictional cleanup handler. The last frame remains as an afterimage. With watchd active, a fresh watcher also starts; without it, the afterimage alone still blocks privacy. This is the game's declared framebuffer rule, not a claim that every real OS behaves this way.
6. Covering the private monitor remains an equally valid solution, including after an unclean shutdown. There is no forced command puzzle or penalty for restoring the example.
7. `restore mirror` resets both services and the private feed, without moving the scenery or choosing a host reaction. Rehearsal, completion, Leave and scene visibility keep their existing contracts.

Commands: `help`, `ps`, `inspect <PID|watchd|mirror>`, `kill [-TERM|-15|-KILL|-9] <PID>`, `restore mirror`, `open echo`, `clear`. Unknown commands/PIDs produce useful errors with no mutation. No chains, wildcards, execution, `eval`, arbitrary file operations or broad kill targets. Help lists the actual grammar. Shortcuts fill commands and focus the prompt; Enter or Run executes. ArrowUp/Down browse history. Ctrl+L clears the console only.

The session is shared by both app controllers and survives closing an app window in the current page. A page reload resets this example; no persistence is claimed. Process changes during a performance cancel its cues and return it to editing with an explicit notice, requiring a new rehearsal. They cannot silently certify a changed production. Subscriptions/listeners are disposed with each app window.

## Verification plan

Pure process tests must cover respawn/new PID, stale PID rejection, graceful stop ordering, forced-stop afterimage, restore, malformed commands and no mutation, plus public-stage obstruction even when the private feed is released. Browser journeys must type commands, observe the same state in ECHO, test the two alternative privacy methods, terminal history/errors, interruption, narrow layout and reduced-motion cursor. Preserve existing seven ECHO unit cases,35 old unit tests and the window/ECHO browser journeys. Capture actual app identities and report gaps without claiming human enjoyment or winner-level originality.

## Implemented and verified

Codex implemented this bounded increment in `process-session.ts`, `terminal-view.ts`, desktop integration/styles and ECHO's shared session rendering. No new Kiro run was attempted after its preceding monthly usage-limit error, and no new Kiro contribution/credit debit is claimed. The runtime uses no new dependencies, backend, host process control, audio requirement or real camera feed.

The two interventions work: an opaque scene prop can hide the monitor, or a clean process shutdown can release it. The new console changes actual shared game state, not just transcript text. Respawn changes PIDs, forced exit visibly preserves a desaturated last frame, and a clean release blanks the monitor. Process edits cancel an active take and require rehearsal; an already departed entrance stays departed. Closing an app preserves the page's process session; reload resets it. Command output is inserted with textContent, not interpreted as markup or script.

Executed: production build/TypeScript; **48 unit tests** (six new process tests, seven prior ECHO tests,35 historical prototype tests); **six new process-console browser journeys**, the **nine existing ECHO journeys**, and the **eight window checks**. No page errors were reported. The console journeys cover real typing/history, cursor/reduced motion, supervisor respawn/stale PIDs, clean release without a mask, forced-stop afterimage with coverage recovery, performance cancellation, Leave priority, shared state across reopening, harmless invalid text and390×844/800×450 controls. Window bounds also cover1100×800. Visibility coverage retains the earlier simulated-event limitation.

Actual screenshots/reports are generated locally under ignored `output/playwright/`, including `app-identities-desktop.png`, `process-clean-release.png`, `process-afterimage.png` and `terminal-mobile.png`. Codex inspected the dual-app layout and mobile console. The first desktop render exposed overlapping console controls and excessive vertical height; narrower console placement and a smaller centered monitor composition corrected those issues. Other application names remain labels; their identity table is not evidence of implemented apps.

Competitive critique: this adds a second causal intervention and a visible cross-application dependency, strengthening the technology premise. The commands are deliberately discoverable rather than a large unrestricted shell. It still needs human testing for comprehension, surprise and enjoyment, and it does not establish global novelty or winning quality. The intended four-tableau arc, visitor recording, production editor, save/recovery and premiere remain unfinished. No publication, purchase, installation or submission occurred.
