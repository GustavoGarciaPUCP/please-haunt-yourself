# ECHO-01 — make the first scene respond

November 6, 2026. Codex-prepared bounded task after the participant requested continued implementation and review. Use native Claude Sonnet4.5, then Codex checks; do not claim Opus/max or finished full-game quality.

## Outcome

Turn ECHO's static illustration into the first playable rehearsal: a public stage, a separate private self-view, and an opaque UNINSTALL farewell prop that the player can position. ECHO cannot act while seeing its private reflection. Cover that entire region without blocking the public stage, then rehearse the same explicitly labeled example entrance. The host either collapses or scares ECHO back. This is one scene, not completed recording/CANVAS/POSTMAN/save gameplay.

Use the existing project/style/art as the base. The source of behavior is an **Example entrance**, not a recording attributed to the player. Keep the paper host and ink creature identifiable. All text is English. Sound is unnecessary; reduced motion and keyboard access retain the same outcomes.

## Scope and files

Read AGENTS, current `src/haunt/desktop.ts`, `desktop.css` and `window-motion.ts` as needed. Write a concise genuine Kiro scope/design note at `.kiro/specs/please-haunt-yourself/echo-rehearsal.md`, then implement one pass.

New files: `src/haunt/echo-scene.ts` for isolated scene/state/geometry logic; `src/haunt/echo-view.ts` for the DOM/SVG interaction/controller. Modify only `src/haunt/desktop.ts` and `desktop.css` for integration. Keep the existing window-motion module, dependencies, old bridge app, package metadata and source elsewhere unchanged. No shell commands, browser commands, research, new agents, installs or publication. Codex will run checks. Keep final summary concise and factual.

## Scene and interaction

- Use one responsive board with declared logical coordinates, e.g.640×410. Define public stage and private self-view as distinct fixed rectangles; the opaque prop's width/height and positions live in the same coordinates. This makes camera coverage deterministic across screen sizes. The prop starts outside both views.
- Render the public cast as separate SVG groups so ECHO appearance/recoil and the host's chosen reaction can animate. The private thumbnail shows the same nervous ECHO, not a real camera feed.
- The farewell panel is declared stage scenery, not the authoring inspector or whole OS window. Drag its header using pointer capture; convert rendered positions to board coordinates; clamp it inside the board. Arrow keys move the focused panel; Shift offers fine adjustment. Provide clearly labeled directional buttons for click/keyboard alternatives. Do not demand drawing or pixel-perfect dragging.
- Readiness requires full private-region coverage and **no opaque overlap of the public-stage rectangle**. Distinguish private exposure from obstructed public footage. A gap, partial coverage or covering the full stage cannot pass. Show small labeled readiness indicators and a short in-world clue; a requested Help action can explain the two regions.
- An accessible alignment/pin aid may appear after an explicit Help request; no secret solution, no stopwatch, no penalty for hints. Keep the initial hierarchy focused on the stage rather than a dashboard of controls.
- Controls: Rehearse entrance, Edit set, Leave now, optional Pause/Resume as needed; Host reaction (Scare back / Collapse) is chosen in editing and remains the same during a run. Do not allow simultaneous editing and playback. Going back to editing resets transient actors/cues but preserves the prop position and chosen reaction.

## Behavior and cancellation

- Editing starts with a provisional host and nervous reflection. Rehearse is an explicitly accepted example entrance. If geometry is invalid, report the actual condition and wait until Edit set is requested; do not auto-solve or repeatedly jump-scare. The same example is reusable after editing.
- A valid run performs appearance, host reaction, then a short ECHO response. Suggested initial motion: appearance280ms, host240ms, response160ms. UI controls never wait on those durations. The final pose/status differs for Collapse versus Scare back.
- Leave now has priority at every phase. Cancel outstanding animation/timer work and invalidate the run so no stale callback can reveal, award completion or change status after departure. A fresh Rehearse starts cleanly. Resetting or editing likewise invalidates the old run.
- Keyboard focus/real Escape and window controls retain their existing lifecycle. Minimizing ECHO or hiding the browser tab pauses an active performance; returning requires explicit Resume or Edit set. Closing ECHO disposes listeners and pending work. Reopening starts a fresh scene rather than inheriting a dead controller.
- On reduced-motion change, cancel travel and use stable key poses with the same explicit semantic sequence/checkpoints. Do not accidentally complete a run already left or paused. No layout-changing blanket animation on the stage, status text or navigation controls.

## Review boundary

Keep type/state logic separate from DOM where useful. Codex will inspect real geometry (partial/full/incorrect coverage), both reactions, Leave/close/minimize/tab interruptions, live reduced-motion changes, keyboard/pointer equivalence, responsive bounds and the existing window regression journeys. Do not claim tests, personal replay, visitor-policy robustness or human fun were observed unless actually executed.
