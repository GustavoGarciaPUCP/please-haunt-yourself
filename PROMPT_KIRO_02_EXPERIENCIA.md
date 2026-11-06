# Kiro IDE / Opus — turn the haunted terminal into a complete short experience

This is a Codex-prepared next-task brief after review of your delivered task17. It is not evidence that this second task already ran. Work in the same `PleaseHauntYourself` folder, using the model actually selected in the IDE. Do not retry the failing CLI or change accounts/plans.

## Your role and standard

Act as a game director, product designer and software engineer with critical judgment. You have creative authority to improve this brief. Do not simply agree, decorate the same layout or implement every suggestion. Compare2–3 meaningfully different experience arrangements, select one and explain what you rejected and why. Make at most a few coherent improvements that substantially change understanding, agency and closure. More code/effects/buttons are not evidence of quality.

Read AGENTS.md's latest instruction, docs/development/18_Opus_Experience_Review.md, your existing `.kiro/specs/terminal-halloween/`, and the actual source/checks before proposing changes. Work from the delivered task17 checkpoint and preserve any additional uncommitted user work you find; never assume a clean tree or reset/clean/overwrite history. The previous CLI failures are separate from the user's actual IDE delivery.

## Purpose and official constraints

Current product: a fictional Halloween OS where each haunted application has its own strange behavior, an intervention inside its native system, and a changed function afterward. This task deepens **TERMINAL only**. Its old farewell repeats; the player can observe the ghost, change the note/whisper/bell, choose how to let it leave, return and check that the shell has changed. ECHO is a preserved workshop, not a new app-recovery task.

Audience hypothesis: people who enjoy short Halloween browser stories, including non-programmers. Value hypothesis: let them discover a strange cause by playing with a familiar interface, make a small meaningful choice, and reclaim a working application. Test these hypotheses; do not invent market statistics or learning results. Entertainment is legitimate; calling it useful or educational needs demonstrated support. Keep product text in clear English.

Read the actual official pages if web access is available: https://kiroween.devpost.com/ and https://kiroween.devpost.com/rules. Costume Contest requires spooky interface elements to enhance function. The five judging areas have equal20% weights: impact, Kiro implementation, design, innovation and presentation. The next experience should strengthen these with observable evidence, not claim a win. Preserve genuine `.kiro` work and attribution; requirements include a working app, public/open-source GitHub with root `.kiro`, English materials and a public under3minute YouTube demo for eventual submission. **Do not publish, push, submit, contact anyone or create a video in this task.** If official facts differ now, record the discrepancy and do not silently invent rules.

## First resolve the independently observed defects

Codex confirmed build and63 unit tests, but could not reproduce your reported11/11 Halloween browser result. After a successful build, `check:halloween` failed at line232: the shell specter still had1 animation after reduced motion. Investigate whether this is a real transition/cancellation defect or a synchronization flaw; repair the cause without weakening coverage.

Further local browser evidence is in `output/playwright/codex-kiro-review.json`:

- Undo after a failed farewell leaves the prior1150ms recall animation running while the model is back at `present`.
- Enabling reduced motion mid-recall leaves that WAAPI animation running and moving after80ms.
- Rapid farewell → quiet bell → clean farewell leaves earlier recall work active during the final state. Distinguish a deliberately designed success exit from stale return motion; opacity during an intentional exit fade alone is not proof of a bug.
- Source has no clear ownership/cancellation of these animation handles or scheduled audio voices. Verify stop/mute/return/close/minimize/live preference changes. Muting audio must silence scheduled and active voices, not merely prevent future ring calls. Do not claim an audible test from a fake audio clock.

Make the newest model/action authoritative. Own and cancel cue work at its lifecycle boundaries. Undo/reset/close/reopen must not resurrect a prior visual, chime or false success. Reduced motion must settle stable semantic poses live. Preserve normal action immediacy, both endings, recovery, focus and no-sound play.

## Improve the actual player experience

### 1. Discovery and agency

At present the desktop room exposes8 enabled buttons immediately. On390×844, the room viewport is647px while content is930px; the bell control and Watch/Guide/Force start below the initial view. A novice is asked to choose before seeing the cause.

Choose a better hierarchy: one clear invitation, a recognizable supernatural event, contextual exploration, then a deliberate farewell. Consider a bounded one-button observation of a return, or a scene-first layout with inspectable objects and one contextual action. These are candidates, not mandatory solutions. The player may act early; do not gate an expert behind a compulsory tutorial or punish experimentation. Never hide an exit, Undo or essential feedback.

Reduce simultaneous secondary decisions. Sound, technical inspection, force and replay/reset can be available without competing with the first action. Do not replace an action wall with undiscoverable hover-only hotspots. Every important object/action must work with pointer, touch-style input and keyboard. A hint should teach observation before offering explicit assistance; assistance remains a valid choice.

The haunting must stay specific to TERMINAL: ghost-writing, a terminal bell that calls the old session back, a retained line that need not execute again, and the recovered prompt. Avoid generic fantasy combat, a separate platform game, random pumpkins or a mandatory programming lesson.

### 2. A real mobile mode

Compare a windowed desktop layout with an active-app mobile layout. Choose deliberately; do not render a miniature phone or miniature desktop inside the page. Preserve OS identity and app switching/back navigation while giving the active encounter usable space.

Also evaluate genuinely movable desktop windows as an OS affordance, rather than assuming “mobile” only means a small screen. Add titlebar dragging only if it improves the chosen desktop experience: exclude buttons/text selection, preserve focus and window motion, clamp to the workspace, handle resizing, and provide a keyboard/reset-position alternative. Mobile may use a focused full-viewport app instead of window dragging. Do not add this as decorative complexity or let it displace the core first-use work. Position a single active desktop encounter intentionally; large empty wallpaper should be a conscious composition choice.

At390×844 the scene, current consequence and primary next action must be usable together without first scrolling through all object cards. Test320×568,390×844,768×1024 and800×450. Use readable text, practical touch targets, safe-area-aware controls, visible focus and no horizontal overflow. Sticky controls must not cover narration or selectable objects. Test a real enlarged-text/zoom scenario if feasible; document unverified physical keyboard, touch-device and screen-reader behavior honestly.

### 3. Closure and a reason to return

The two clean endings must still retain different note artifacts, check-in responses and actual shell behavior. Quieting output is not recovery. Fading the note alone is not recovery. Returning early is not recovery. A forced stop leaves a recoverable shadow. Preserve these meanings even if the order of presentation changes.

Make the ending feel like regaining the application, not receiving only a badge. Compare options such as a deliberate handover of the prompt, an optional first line written by the player that the recovered shell actually uses, or a meaningful retained artifact. Choose at most one if it makes the experience stronger; do not add a questionnaire, fake AI chat or generic achievement system. Any player text must remain bounded local text, never executable markup/shell/code. Both memory choices must be legitimate, not an unsupported moral judgment.

Consider a small versioned **local terminal-only** save so a refresh/reopen can honor the player's outcome. If implemented, validate untrusted/old/corrupt saved data, define incomplete-session behavior, and provide a clear reset/reopen-case action. Do not persist audio consent, animation jobs or guide overlays. No backend, accounts or full-game save architecture. If persistence is deferred, communicate that honestly and justify the priority.

## Spec and execution workflow

1. Record the current baseline and issues before changing source. Read the actual live UI with browser tools if available.
2. Create `.kiro/specs/terminal-experience-v2/requirements.md`, `design.md`, `tasks.md`. Include the audience/value hypothesis, alternatives, selected first60seconds, mobile/desktop layouts, interaction states, motion/audio ownership, ending/return behavior and acceptance checks. Preserve the earlier task17 spec as history. Clearly distinguish planned from implemented.
3. Implement the cancellation fixes, chosen experience hierarchy/mobile mode and bounded closure improvements. You may refactor the model/views if justified, but preserve or explicitly migrate current invariants. No other apps, dependencies, account changes or publication. Do not add Kiro hooks/tools merely to list more features: use available Kiro capabilities where they solve real development problems, and record the actual benefit.
4. Run meaningful validation. Start/locate the local server; do not run browser checks while `dist` is being rebuilt. Run build, unit tests, `check:halloween`, recovery, guide, windows, ECHO and console checks. Add real regressions for rapid actions, Undo, live reduced motion and audio cancellation, plus first-view mobile action visibility, no clipping and the two endings/save recovery if added. You may update tests for a changed UI flow, explaining why; never remove the semantic failure assertions to obtain green results.
5. Use screenshots and computed behavior to assess the result. Automated/agent walkthroughs are not human testing. Provide a short neutral playtest protocol for at least3 non-programmers (not fabricated results): what brought the ghost back, what their intervention changed, what was kept, and whether they know when they are done. State hypotheses/targets separately from observations.

## Final report

Give: actual changed files; what you challenged in this brief; selected/rejected alternatives; the player-facing flow and restored native behavior; actual checks and failures; before/after screenshots; remaining risks. Record only genuine Kiro work. The previous IDE spec reported Opus5.5 from session context; do not invent a reasoning setting, exact credit use, human study, compatibility audit or organizer approval. Leave source locally reviewable for Codex; no git push or submission.

The standard is a coherent, accessible and surprising completed encounter whose Halloween interaction explains its behavior. Do not end with a winner claim or an arbitrary numerical quality score.
