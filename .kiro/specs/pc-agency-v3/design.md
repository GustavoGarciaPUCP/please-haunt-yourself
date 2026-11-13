# PC agency v3 — design

Kiro IDE session, November 6, 2026. Implements `requirements.md` in the existing TypeScript/Vite/canvas stack. No new dependencies.

## 1. Modules

| Module | Kind | Responsibility |
| --- | --- | --- |
| `legacy-session.ts` | model | The request: retry ("the call"), muffle, attempts, presence (`terminal` / `shadow` / `glass`), PID, Undo, ghost lines said once, evidence flag, typed commands |
| `glass-model.ts` | model | Impression placement, 128×72 fog grid, wipe and breathe, region measurements, frame classification, grid encoding |
| `echo-studio.ts` | model | Source, paused frame, prints (≤ 6), keep, discard, undo discard, serialization |
| `case-save.ts` | model | `haunt.case.v3` validation, load and save, migration of `haunt.terminal.v1` |
| `window-drag.ts` | model + controller | Clamp and translate helpers; `WindowDrag` pointer-capture controller and keyboard handle |
| `process-session.ts` | model | Shared console syntax: help, clear, open echo, input guard |
| `haunting-presentation.ts` | model | Every player-facing string for TERMINAL and the desktop, derived from snapshots |
| `glass-render.ts` | view | Draws the glass region (night, silhouette, fog, writing, hand) for the desktop, ECHO's monitor and prints with one function |
| `glass-view.ts` | view | Desktop canvas, wipe input, the reveal, resize |
| `echo-view.ts` | view | ECHO studio UI (rewritten) |
| `legacy-view.ts`, `terminal-view.ts` | view | TERMINAL room and shell for v3 |
| `desktop.ts`, `desktop-shell.ts`, `first-run.ts` | integration | Lifecycle, drag wiring, case save, Session menu, desktop task lines, guide |

Retired: `echo-scene.ts` (the old private-monitor theatre), `terminal-save.ts` (folded into `case-save.ts`), the watchd/mirror.watch processes and their tests.

## 2. Request model (`LegacySession`)

```ts
interface LegacySnapshot {
  pid: number | null; retry: boolean; muffled: boolean; phase: 0 | 1 | 2; attempts: number;
  presence: 'terminal' | 'shadow' | 'glass';
  moment: 'waiting' | 'reading' | 'writing' | 'recalled' | 'impressed' | 'forced';
  lastAction: LegacyAction | null; trace: string;
  said: readonly GhostLineId[];   // monotonic, outside Undo
  evidence: 'none' | 'kept';      // set by ECHO integration, outside Undo
}
interface LegacyEvent { id: number; kind: ...; line?: GhostLineId }  // monotonic, outside Undo
```

**Transitions.**

- `advance()` at phase 0 reads, at phase 1 writes "FOR THE NEXT PER—", at phase 2 finishes. With the call on, finishing means attempts + 1, a new PID and `recalled`. With the call off, it is the milestone: `presence = 'glass'`, `moment = 'impressed'`, PID null, and the Undo stack is cleared after the event.
- `observe()` advances until `recalled` or `impressed`, as one Undo step.
- `toggleRetry()` and `toggleMuffle()` work before the milestone.
- `terminate(false)` (TERM) ends the minute now. `terminate(true)` (KILL) with the call off leaves `shadow`.
- `resumeResidue()` returns from the shadow with a new PID.
- Ghost lines: the first return says `help`, the second `same-minute`, and the first return while muffled says `cannot-hear` (that line takes priority). Each is said once per case, and Undo does not unsay it.

## 3. Glass model

- **Coordinates.** Positions are normalized to the desktop stage (u, v ∈ [0, 1]). Shape sizes are fractions of stage height, so the hand keeps its proportions at any aspect ratio. The fog is a 128×72 `Uint8Array` over the stage.
- **Placement** (once, at the milestone): `placeImpression(stage, terminalRect, occluders)` tries TERMINAL's right edge, then its left edge. The part of the hand that peeks out must be visible and on-stage. The hand box is 0.19 h × 0.25 h, and about 38 % of it peeks out past the window edge. The note block sits on the inner side of the hand (behind TERMINAL). The figure stands behind the hand, offset outward.
- **Fog base:** deterministic value noise, ≈ 0.78 ± 0.12, denser toward the bottom.
- **Wipe:** a capsule brush along the pointer segment multiplies fog by `1 − 0.9·falloff`.
- **Breathe:** moves cells inside a rectangle back to their base value.
- **Writing legibility:** a line is readable in a frame when ≥ 95 % of its box is inside the frame and the mean fog over it is ≥ 0.45. Writing is a cut in the fog, so it needs fog to be seen. (An 80 % threshold was tried first; it let a print claim "5 of 5 lines" while visible letters were cut off.)
- **Picture:** the figure (a 0.30 h × 0.54 h box, centred 0.15 h outward from the hand) counts as visible when cleared cells (fog < 0.35) inside the frame add up to ≥ 3.5 % of the figure box. That is about a 60 px square beside the palm at 1366×768, so no particular shape is required.
- **Kinds:** `impression` = hand ≥ 0.6 + ≥ 2 readable lines + figure visible. `empty-glass` = nothing of the impression in frame. Otherwise `partial`, with reasons: `hand`, `writing-outside`, `writing-wiped`, `figure-fogged`.

## 4. Rendering (`glass-render.ts`)

`drawGlass(ctx, scene, region, outW, outH, t)` draws the stage region `region` (stage px) into an output canvas:

1. **Night behind the glass:** the same gradients as the desktop background. The desktop canvas is opaque, so the monitor and the desktop share pixels.
2. **Silhouette:** the TERMINAL specter's body path with an arm reaching to the hand. Pale and low contrast, softly blurred inside the canvas (not a root blur).
3. **Fog layer** (offscreen): the grid upscaled with smoothing, uneven droplet texture, a light rim around the print. Writing (`destination-out` handwriting, stretched to its model box so geometry and pixels agree, plus seeded drips) and the handprint are cut through it. The handprint has a diffuse palm, stronger finger and fingertip contact, and a thumb.
4. The fog layer is composited over 1–2.

The reveal parameter `t ∈ [0, 1]` drives four overlapping beats (table in §8). `t = 1` is the static state used by reduced motion, prints and ECHO.

Prints call the same function with their stored stage size, placement and fog sub-grid, so a print never depends on the current glass.

## 5. ECHO studio

- **Monitor canvas.** For the glass source it draws `drawGlass` for the monitor's own stage rectangle at device-pixel scale. The "enhanced" look is a CSS filter on the element, so canvas pixels stay comparable with the desktop canvas. Redraws happen on `haunt:window-moved`, glass changes and resize, coalesced to one per frame.
- **Session source.** A mini room drawn from the `LegacySession` snapshot: note, door, bell (muffled cloth / unhooked cord), ghost or shadow, or empty. An idle drift runs only while live, visible and without reduced motion. Pause stores a `SessionFrame` copy.
- **Pointer wiping on the monitor** maps monitor coordinates to the stage and calls the same wipe. The monitor uses its own pointer capture, independent of the titlebar.
- **Capture** first finishes any reveal, then stores a `GlassFrame` (stage size, frame rect, placement, fog sub-grid, facts) or a `SessionFrame`. Facts are computed once at capture time.

## 6. Window drag

- **Position model.** A window that has never been moved keeps its CSS position (`left/top %` + `translate: -50% -50%`). On first drag or keyboard move, its layout box (`offsetLeft/Top` + parsed `translate`) becomes inline `left/top` px with `translate: none`, so it does not jump. `transform`/`opacity` stay owned by `window-motion.ts`.
- **Pointer drag.** `pointerdown` on the titlebar (primary button, not on `button, input, select, textarea, a, [contenteditable]`, and not with a non-collapsed selection inside the titlebar) calls `setPointerCapture`. Each `pointermove` sets `left/top` synchronously, clamped to the stage. `pointerup` / `pointercancel` / `lostpointercapture` end the drag.
- **Cancellation.** `close`, `minimize`, Escape (which also restores the start position), `blur` and `visibilitychange` call `cancel()`. The global Escape handler does not close a window while it is being dragged.
- **Keyboard.** A titlebar grip button: arrows move 20 px, Shift + arrows 80 px, Home arranges this window.
- **Resize.** A stage `ResizeObserver` and a per-window `ResizeObserver` re-clamp placed windows.
- **Arrange.** Clears inline positions for both windows.
- **Small screens.** At ≤ 640 px drag is disabled and positions are cleared, so the CSS active-app layout applies.
- **Events.** Every position change dispatches `haunt:window-moved` on `document`.

## 7. Persistence

```json
{ "v": 3,
  "terminal": { "retry": false, "muffled": false, "attempts": 2, "presence": "glass", "said": ["help", "same-minute"] },
  "glass": { "hand": [0.47, 0.42], "side": "right", "fog": "<base64 9216 bytes>", "revealSeen": true },
  "studio": { "prints": [ ... ≤ 6 ], "retained": 3, "nextId": 5 } }
```

- **Validation.** Every field is type- and range-checked, the raw string is ≤ 200 000 chars, grid lengths must match, and unknown kinds are rejected. A corrupt save removes only `haunt.case.v3`.
- **Migration.** If `haunt.case.v3` is absent and `haunt.terminal.v1` is present (valid or not), only `haunt.terminal.v1` is removed. A fresh case starts, and TERMINAL prints a one-time notice. Other keys (`haunt.guide.v2`, the paper-bridge save) are never touched.
- **Writes** happen after model events, at wipe end and after capture, keep or discard. A reset removes the v3 key.

## 8. Choreography

| Element | Role | Starts | Duration | Motion | Notes |
| --- | --- | --- | --- | --- | --- |
| Watch it try (call on) | Lead | 0 | ≈ 3 s | Note glow, write, walk to the way out, bell swings, pulled back | v2 cue ownership; cancelled by Undo, reset, leaving, minimize and reduced motion |
| Let it finish (call off) | Lead | 0 | ≈ 2.4 s | Read, write, ghost presses forward and fades; a handprint forms on the room's screen | The model state commits at 0 ms; motion only presents it |
| Condensation | Support | 120 ms after the milestone | 600 ms | Fog cells appear with staggered delays | Canvas only; UI stays readable |
| Silhouette | Support | 500 ms | 650 ms | Fades in, drifting toward the hand | Low contrast |
| Palm | Lead | 850 ms | 750 ms | Pressure grows (scale 0.92 → 1, cut strength 0 → 1) | Then stays as evidence |
| Writing | Lead | 1100 ms | 900 ms | Lines appear one after another, left to right | Readable only through fog |
| Wipe | Lead (player) | Pointer or button | Immediate | The fog grid changes on the same frame | No cursor lag |
| Window drag | — | Pointer | Immediate | Position equals the pointer delta | No animation |

The reveal is skipped (lands on `t = 1`) on reduced motion, page hide, reset, a wipe, a capture or any ECHO glass action. `revealSeen` is saved so a reload shows the static state.

**What does not move:** window controls, taskbar, menu bar, primary labels, the settled handprint and window positions.

## 9. Testing strategy

- **Unit (vitest):**
  - `legacy-session` transitions and commands.
  - Presentation copy (including no technical vocabulary on default surfaces).
  - Glass placement, wipe and breathe, classification and encoding.
  - ECHO studio kinds, limits, keep and discard.
  - Save validation and migration.
  - Drag clamp and translate parsing.
- **Browser (Playwright, Chrome, against `dist` through `vite preview`):**
  - `check:drag` (new): real pointer geometry at the three PC sizes and every drag requirement.
  - `check:halloween` (rewritten): the TERMINAL case, cue cancellation, reduced motion, fake-audio cancellation and layouts.
  - `check:echo` (rewritten): sources, live/pause/print, viewfinder pixel correspondence, wrong source, wipe and breathe, tray.
  - `check:console` (rewritten): the console on the case.
  - `check:recovery` (rewritten): persistence, migration, reload, interruption and replay.
  - `check:guide` (updated).
  - `check:windows` (kept).
- **Visual:** PC screenshots at 1366×768, 1440×900 and 1920×1080, and a recorded video of the route (`scripts/capture-v3-route.mjs`).
