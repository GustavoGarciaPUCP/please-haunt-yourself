# First-run guidance and OS shell

November6,2026. Codex-authored implementation brief. The participant explicitly requested a simulated novice agent, contextual focus/blur helpers and a more recognizable operating system. This is a bounded extension of the existing rehearsal, not completion of the remaining apps.

## Design and scope

Use the existing nocturnal palette, ivory wallpaper lettering and app-specific interiors. Add a quiet system menu bar (#111b24), working desktop shortcuts, a session menu, current app context, local clock and a persistent Guide button. Keep the running-app dock. Future app names are explicitly labeled as unrecovered/planned, not disguised as working launch controls. The system chrome uses system sans; terminal remains monospace, capture controls remain sans and the illustrated stage remains theatrical.

Layout: `[HAUNT OS | Session | current app ........ Guide | local clock]` above `[wallpaper / two real desktop shortcuts / app windows]` above `[running-app dock]`. A smaller wallpaper masthead gives the desktop shortcuts room. No fake network, battery, notifications or working app claims.

Apply frontend-design, emil-design-eng and choreograph: one clear focus per guide step, stable readable controls, no child stagger, short optional container fade, immediate Skip/Escape, visible keyboard focus, reduced motion and focus restoration. Product explanations remain English. No new dependencies or computer-desktop automation.

## Review

| Before | After | Why |
| --- | --- | --- |
| A novice agent clicked `ps` and saw no output because it only filled the input | Read-only shortcut buttons execute their named query immediately | Match the visible action and remove an unnecessary hidden second step |
| Opening the page immediately exposes a console with no overview of the goal | Optional first-visit guide introduces ECHO, its private monitor, the console and rehearsal | Establish cause and location without performing the repair |
| Windows sit on a large title without much desktop affordance | Working menu bar, app context, desktop launch icons and clock | Make the surrounding surface act as a fictional OS |
| Several apps compete for attention at once | Spotlight with dimmed/blurred surroundings and one readable coach card | Help the player locate the next relevant object |

## Guide contract

- First visit starts a four-step optional tour. Skip and Escape are available immediately. Completing or dismissing it is remembered under versioned localStorage; storage failure must not break the app. Guide always reopens it, without restoring/resetting services or scenery.
- Steps: (1) open ECHO from its actual dock control, (2) identify its private monitor and two possible interventions, (3) open TERMINAL and optionally run read-only `ps`, (4) locate ECHO's rehearsal controls and start exploring. Navigation does not kill processes, align props or start a performance.
- Real targets are spotlighted using their rendered rectangles, with a fixed scrim/coach layer. Recompute after window motion, resize and scroll. Keep the coach in the viewport; on a small screen use a bounded bottom sheet and scroll the target into view. No timed advance or hidden autoplay.
- Back, Next/action and Skip use normal buttons. Keyboard focus stays within guide controls and any intentionally interactive highlighted target; Escape closes the guide without closing a game window. Nonmodal guided editing is not mislabeled as a fully isolated modal. On dismissal restore focus to a valid visible target or the Guide trigger.
- Reopening guidance during a performance pauses it. Ending guidance must not silently resume, complete, reset an authored set or override a recorded Leave. Resume/Edit remain explicit.
- The guide is instructional. It cannot demonstrate enjoyment or certify originality. An independent simulated novice reviews the real UI before/after without reading implementation/solutions; retain actual actions/confusion, not fabricated human emotions or user timings.

## Verification

Dedicated fresh-context browser checks cover first-visit display, real spotlight bounds and blur, steps, explicit query execution, no solution mutation, Skip/Escape priority, remembered dismissal/reopening, storage failure, focus, narrow layouts, motion preference and pause/resume. Existing game regression harnesses deliberately mark the tour dismissed before loading so they continue testing game behavior; the dedicated guide harness exercises the actual fresh-user path. Preserve existing process/ECHO unit and browser cases. Record observed agent findings and unresolved gaps separately.

## Implemented and checked

Codex implemented the guide and shell, direct execution of read-only console shortcuts, real completed-rehearsal feedback and a topic selector. Dismissal/reopening works with versioned localStorage and handles storage denial. Guidance tracks real targets during window motion, scroll and resize. Opening it pauses a take; it never resumes on dismissal or revives an ended entrance. Selecting a topic opens the relevant app without changing processes or scenery. Trying the actual rehearsal ends guidance and keeps ECHO/repair feedback visible. The OS task records completed host reactions and the last privacy method for the current page session; this is not a saved game or an extra recovered application.

Used skills: `frontend-design` for app/shell hierarchy, `emil-design-eng` for action semantics, focus and review detail, and `choreograph` for a single focus surface and interruptible guidance. The Before/After review above records their concrete application. No new skill/runtime dependency was downloaded. No native Kiro run, credit debit, purchase, account change, desktop automation or publication is claimed.

Executed checks: build and TypeScript pass;48 existing unit tests pass;seven fresh-user guide browser journeys pass in addition to the eight window, nine ECHO and six process-console journeys (30 total), with no page errors. Guide checks cover a real spotlight/blur, query execution without repair, an actual failed rehearsal releasing the coach, dismissal persistence/direct topics, Escape/Tab/focus, working shell controls/clock, pause/explicit resume, Leave priority, mobile/short layouts and denied storage. The ECHO journey also verifies that completing both reactions updates the desktop task. Agent/browser visibility checks retain the earlier distinction from physical-device, screen-reader and real-human testing.

## Independent simulated novice findings

The participant explicitly requested an agent as a novice. `jugador_nuevo` used a fresh headless Chrome context and only the rendered UI; it was instructed not to read source, specs, tests or solutions. Its first pass completed Collapse and Scare back in12 intentional game decisions, with two extra Tab navigation actions. Those counts describe the agent's recorded route, not human completion time or difficulty.

| Observed finding | Change / status |
| --- | --- |
| `ps` looked executable but only filled the input | Fixed: read-only chips execute and show output immediately |
| No clear global first-task/recovered-app scope | Added explicit first task, recovered/missing explanation and actual completion/last-take acknowledgement |
| Step2 hid the scenery while explaining coverage | Fixed: the full scene board stays sharp so public stage, private monitor and panel can be related |
| Step4 kept failed-rehearsal feedback blurred | Fixed: clicking the real Rehearse dismisses the coach and leaves ECHO at the front |
| Step3 mobile coach physically covered the terminal table | Fixed: separate vertical layout on390×844, side layout on800×450; guided ps scrolls to the beginning of its result |
| Returning to guidance required repeating steps | Added direct topic selector; tested independently by the guide harness |
| Assistance can bypass the spatial experiment | Retained as explicitly requested placement assistance; using it is not evidence of an independently solved puzzle |
| Two acting reactions provide limited replay depth | Still open at the product level. Onboarding does not replace the remaining tableaux or create deeper authored consequences |

The second pass completed a console-based act using only UI help/inspection. A final fresh390×844 pass confirmed no coach/terminal overlap, automatic ps header/both rows visibility, usable scroll/input/Enter, and the changed desktop task after Collapse with a released feed. It did not test the two-reaction task message; that assertion is in the ECHO browser harness. The agent's earlier reports describe earlier builds; their now-fixed observations are not presented as current defects.

On the narrow viewport the app window covers the wallpaper task, so the final agent checked its rendered DOM wording, not an unobscured visual notification. No human salience/celebration result is claimed from that acknowledgement.

Raw UI reports/captures remain local under ignored `output/playwright/dummy-before-*`, `dummy-after-*`, `dummy-final-*` and `dummy-final-latest-*`. Representative generated implementation captures include `guide-private-monitor.png`, `guide-console-mobile.png`, `guide-mobile.png` and `desktop-shell.png`. No private model reasoning is included. This tracked summary preserves findings and fixes without claiming a human usability study.

## Remaining limits

This is still one encounter with two preselected host reactions and two privacy interventions. The terminal dependency route was understandable to this agent, but that does not demonstrate enjoyment, global novelty or parity with winning projects. The full multi-scene arc, personal recording, richer authored consequences, save/recovery, remaining application encounters and premiere remain unfinished. The first scene's explicit assistance and inspect explanations trade difficulty for accessibility. Real human/physical-device/screen-reader testing is still needed; do not label this a completed entertainment validation.
