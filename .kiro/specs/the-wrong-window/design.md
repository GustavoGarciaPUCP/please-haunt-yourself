# The Wrong Window — Technical Design

**Spec:** the-wrong-window
**Status:** Technical design reviewed for the first playable milestone. Implementation is in progress; `tasks.md` records current progress and remaining work. The design is not a claim that every feature is implemented.
**Date:** November 5, 2026.
**Requirements:** `.kiro/specs/the-wrong-window/requirements.md`

This design implements the full game in sequenced milestones. M1 is a working playable
route that validates geometry and state rules; its modules are reused by all later
milestones, not thrown away.

---

## 1. Architecture principles

1. **Geometry and state are pure and rendering-independent.** All model logic lives in small
   pure modules with no DOM access. The UI layer calls them; it never duplicates their logic.
2. **Model coordinates have y upward.** SVG conversion is explicit and isolated in one
   module. No geometry or state code references screen pixels.
3. **No hardcoded solutions.** The route algorithm computes path feasibility from geometry.
   It never checks whether `Lₓ` or `θ` equals a known-good value.
4. **No formulas, preset solutions, success traffic lights, or generic sliders** in the UI.
   Controls manipulate visible materials (lamp cart, pivot handle, frame), not abstract
   parameters. (Sources: `01-§5`, `AGENTS.md`, `vis-§`.)
5. **Small dependencies.** TypeScript + Vite + SVG/HTML/CSS. No UI framework, no animation
   library, no external assets in M1. Pinned versions only. (Sources: `AGENTS.md`, `04-§4`.)

---

## 2. Module structure

```
src/
  geometry/
    constants.ts      all model constants (single source of truth)
    projection.ts      project(Lx, theta) → 3 shadow vertices (pure)
    profile.ts         upperEnvelope(vertices) → sorted walkable segments (pure)
    surfaces.ts         build support surfaces from config (pure)
    frame.ts            frame pads, walking surface, contact validation (pure)
    route.ts            route algorithm: can the figure reach the gallery? (pure)
    bounds.ts           epsilon comparisons, slope checks (pure)
  state/
    types.ts            Configuration, GameState, HistoryEntry types
    machine.ts          state machine + transitions
    transaction.ts      atomic edit validation (validate full config before commit)
    history.ts          undo stack (max 20 confirmed ops)
    persistence.ts      versioned localStorage save/load/validate
  ui/
    coordinates.ts      model ↔ SVG coordinate conversion (isolated)
    render.ts           SVG rendering of stage, shadow, frame, figure
    controls/
      lamp.ts           lamp drag / click-on-rail / keyboard arrows
      cutout.ts         cutout drag-on-arc / click-on-arc / keyboard arrows
      frame.ts          frame drag / place+confirm / keyboard arrows+Enter+Escape
      trial.ts          Pause / Continue / Stop via focus + Enter/Space
    feedback.ts         local failure feedback (text + shape, no traffic lights)
    preferences.ts      language, sound, motion preferences
    i18n.ts             English / Spanish string tables
  game/
    main.ts             entry point: wires modules, runs state machine
```

Every `geometry/` and `state/` module is pure: deterministic, no I/O, no DOM. They are
unit-tested without a browser. The `ui/` and `game/` modules depend on them but never
re-implement their logic.

---

## 3. Geometry layer

### 3.1 Constants (`geometry/constants.ts`)

All constants from `02-§3`, `02-§4`, and `impl-§` in one place:

| Constant | Value | Source |
| --- | --- | --- |
| Pivot C₀ | (400, 100) | `02-§3` |
| Cutout local vertices v₀,v₁,v₂ | (0,0), (225,90), (375,90) | `02-§3` |
| Projection scale | 2 | `02-§3` |
| Lamp L | (Lₓ, 220), Lₓ ∈ [500, 740] | `02-§3` |
| Cutout angle θ | [0°, 90°] | `02-§3` |
| Initial floor | x ∈ [−250, 220], y = 0 | `impl-§` |
| Gallery | x ∈ [1120, 1500], y = 160 | `impl-§` |
| Frame | width 340, height 180, border 10 | `02-§4` |
| Frame pads | two, each 40 wide, at lower corners; min 20 overlap | `impl-§` |
| Frame home | centre x = −40, upright, on initial floor | `impl-§` |
| Figure body | width 40, height 100 | `impl-§` |
| Figure start | centre x = 170, foot y = 0 | `impl-§` |
| Slope limit | 30° | `01-§3`, `02-§3` |
| Step limit | 20 model units (up or down) | `01-§3`, `02-§3` |
| Contact reach | max 48, includes 40-wide foot + any correction | `02-§3`, `impl-§` |
| Frame placement reach | nearest flat support within 30, x unchanged | `impl-§` |
| Comparison epsilon | small model-space value, documented in code | `impl-§` |

The epsilon is used only for floating-point equality in contact/overlap checks. It must not
introduce additional gameplay reach — it tightens comparisons, never widens them.

### 3.2 Projection (`geometry/projection.ts`)

Pure function:

```
project(Lx: number, thetaDeg: number): Vec3  // 3 projected points
```

For each cutout vertex `vᵢ`, compute `Sᵢ = 2(C₀ + Rθ · vᵢ) − L`.

`Rθ` is the 2D rotation matrix by `thetaDeg` degrees. The function returns the three
projected points. It does not interpret them as walkable or not — that is `profile.ts`.

Key property: increasing `Lₓ` by `d` translates every shadow vertex by `(-d, 0)` —
the signed offset from `S = 2(C₀ + Rθ·vᵢ) − L`. Changing `θ` rotates the template. The lamp
never scales or rotates the projection. (Verification: N01, design-review correction 1.)

### 3.3 Upper shadow profile (`geometry/profile.ts`)

Pure function:

```
upperEnvelope(vertices: Vec3): Segment[]
```

Takes the 3 projected points and returns the segments forming the **upper boundary** — the
surface the figure walks on. Algorithm:

1. Sort the 3 points by x (break ties by y, highest first).
2. The upper envelope is the chain of segments connecting sorted points such that each
   segment is the top boundary. For a triangle where the middle point is above the line
   from leftmost to rightmost, the envelope is leftmost → middle → rightmost. If the middle
   is below, the envelope is just leftmost → rightmost.
3. Return the resulting segments, each with computed slope = (yEnd − yStart) / (xEnd − xStart).

The shadow is a **one-way support**: it supports from above and does not block from below or
from the sides. A high vertical shadow above the floor does not prevent the figure from
walking on the floor underneath it.

### 3.4 Support surfaces (`geometry/surfaces.ts`)

Pure function:

```
buildSurfaces(config: Configuration): Surface[]
```

Assembles all walkable surfaces from the current confirmed configuration:

1. **Floor:** flat segment, x ∈ [−250, 220], y = 0.
2. **Shadow:** segments from `upperEnvelope(project(Lx, θ))`. Each segment is included only
   if `|slope| ≤ tan(30°)`; segments exceeding the slope limit are **not walkable** but still
   exist as one-way supports (they block nothing from below).
3. **Frame** (only if validly placed, see §3.5): the bottom member's top surface is at
   `y = placedY + 10`, spanning the frame's full width. The frame's top member at
   `y = placedY + 180` is also a one-way support, included consistently — it is not omitted
   by a special-case assumption, even though it is unreachable in the known examples. The
   frame's uprights are **not** solid walls — the figure passes through them laterally.
   (Design-review correction 5.)
4. **Gallery:** flat segment, x ∈ [1120, 1500], y = 160.

Each `Surface` carries: `source`, sorted segments, x-range, y at each end, and a flag
indicating walkability.

### 3.5 Frame contact validation (`geometry/frame.ts`)

Pure functions:

```
framePads(centerX: number): [Pad, Pad]     // left and right, each 40 wide
padOverlap(pad: Pad, support: Surface, y: number): number  // actual geometric overlap
isFrameValid(config: Configuration): { valid: boolean, reason?: string }
```

**Pad geometry.** Frame centre `cx`, width 340:
- Left pad: `[cx − 170, cx − 130]` (40 wide).
- Right pad: `[cx + 130, cx + 170]` (40 wide).

**Overlap is real geometric intersection**, not a tolerance check. For a pad `[a, b]` and a
flat support at height `y` spanning `[c, d]`: `overlap = max(0, min(b,d) − max(a,c))`.

**Validity requires all of:**
- Left pad overlap with a flat support at the same height ≥ 20.
- Right pad overlap with a flat support at the same height ≥ 20.
- Both supporting surfaces are at the **same height** (so the frame is level).
- The frame is upright and unrotated (no second rotation mechanic, per `impl-§`).

Documented examples (from `02-§4`):
- Config B (cx=985): left pad [815, 855] vs plateau [550, 850] → overlap 35 ✓.
  Right pad [1115, 1155] vs gallery [1120, 1500] → overlap 35 ✓. **Valid.**
- Lx=740 (cx=970): left pad [800, 840] vs plateau [510, 810] → overlap 10 < 20. **Invalid.**

These are **not** hardcoded success conditions — the overlap check is generic and applies to
any placement. The numbers 35 and 10 are consequences of the geometry, not special cases.

**Frame walking surface.** When valid, the top of the bottom border (y = placedY + 10) is
the walking surface. The frame's top border (y = placedY + 180) is also a one-way support
included consistently — it is not omitted by a special-case assumption, even though it is
unreachable in the known successful examples (step > 20 from the walking surface). The
uprights allow lateral passage — they do not block the figure entering or leaving the frame
interior. (Design-review correction 5.)

### 3.6 Route algorithm (`geometry/route.ts`)

This is the core of the game. It is **generic**: it computes whether the figure can traverse
from its start to the gallery using the actual geometry, never by matching known-good
parameter values.

```
tryRoute(config: Configuration): RouteResult
```

`RouteResult` = `{ success: boolean, waypoints: Waypoint[], failure?: { x: number, y: number, reason: string, safePrefix: Waypoint[] } }`.

`Waypoint` = `{ x: number, y: number, surface: string }` — the figure's centre position and
the support surface it stands on at that point. On success, `waypoints` is the full path from
start to gallery. On failure, `safePrefix` is the safely reachable portion before the failure
point, so the UI can animate the figure to the failure location, not a fabricated
straight-line path. (Design-review correction 2.)

#### 3.6.1 Model

The figure is a body of width 40 and height 100. Its **foot** is the 40-wide horizontal
contact. The figure walks left-to-right along the **upper profile** — the highest walkable
surface at each x position. It does not jump.

#### 3.6.2 Walkable segment check

A segment is walkable if `|slope| ≤ tan(30°)`. The slope is computed on the **actual
continuous segment** (`(yEnd − yStart) / (xEnd − xStart)`), never by sampling the segment into
small steps. A steep segment (slope > 30°) is not walkable — discretizing it into small
horizontal intervals and checking each interval's local slope is **forbidden**; the overall
segment slope governs.

Rationale: a steep ramp sampled at fine resolution would have each tiny sub-step at a
locally shallow angle, falsely passing the slope check. The algorithm must reject the whole
segment based on its true slope.

#### 3.6.3 Transition check (between surfaces)

When the figure moves from surface A to surface B, evaluate at **actual overlapping
positions** using the height of each segment at that position, not unrelated start/end
heights. Include the figure's initial x and segment intersections among transition
candidates. Avoid taking a globally high profile that the figure cannot reach.
(Design-review correction 3.)

1. **Horizontal reach.** `gap = xB_start − xA_end`. The figure can transition if `gap ≤ 48`.
   This 48 **includes** the 40-wide foot and any automatic correction. The foot is **not**
   added again. If A and B overlap (`gap < 0`), the figure transitions within the overlap.
   - The figure's foot (40) must be supported at the transition: at least part of the foot
     rests on A or B. The 48 total reach covers the foot width plus up to 8 of correction.
2. **Vertical step.** `|yB_at_transition − yA_at_transition| ≤ 20` at the actual transition
   x. If A and B overlap, evaluate both segment heights at the overlap x — not their
   unrelated endpoint values. The critical x-coordinates include segment endpoints, the
   figure's start x, and positions where the height difference is exactly 0 or ±20.
3. **B is walkable.** B's first segment has `|slope| ≤ tan(30°)` — computed on the actual
   continuous segment, never by sampling into small steps.

If any check fails, the route fails at the transition point with a reason:
- `"gap"` — horizontal gap exceeds 48 (includes footprint; neither foot nor correction
  counted twice).
- `"step"` — vertical step exceeds 20.
- `"slope"` — segment slope exceeds 30°.
- `"contact"` — frame pad overlap insufficient (< 20).

#### 3.6.4 One-way support and lateral passage

Surfaces are one-way: they support from above and do not block from below or from the sides.

- A high shadow above the floor does not block the figure walking on the floor underneath.
- The frame's uprights do not block the figure entering or leaving the frame interior.
- The frame's top border does not trap the figure inside (it supports from above only).

In the algorithm, this means: at each x, the figure is on the **highest surface it has
reached**. A surface above the figure's current position does not force the figure onto it
or block forward movement — the figure continues on its current surface. The figure only
moves to a higher surface if there is a walkable transition (ramp or step ≤ 20) to it.

#### 3.6.5 Algorithm steps

The traversal is **deterministic** using a finite graph or equivalent explicit interval
method over actual segments and legal transitions. For overlapping segments, include
interval boundaries and the critical positions where their height difference is 0 or ±20,
as well as start/arrival positions. Walk forward along genuinely walkable segments and allow
bounded transitions between supports. A sampled vertical delta is not a replacement for a
continuous-segment slope check. Preserve a single total horizontal reach of 48, with no
separately added foot reach. (Design-review correction 4.)

```
1. Build surfaces from config (floor, shadow, frame-if-valid, gallery).
2. Start: figure on floor at x = 170, y = 0.
3. Walk rightward along the composite upper profile:
   a. Follow the current surface to its right end (or until a higher surface is reachable).
   b. At each critical x, check if a higher surface begins within reach (overlap + step ≤ 20):
      - If yes, transition to the higher surface (e.g., floor → shadow ramp).
      - If the current surface ends, look for the next surface within 48 horizontally.
   c. Apply transition checks (§3.6.3). If any fails, return failure at that point
      with the safe prefix walked so far.
   d. Continue along the new surface.
4. Arrival check (§3.6.6).
```

The walk is monotonic left-to-right. The figure never moves left (it returns to start on
failure, which is a state action, not part of the route walk).

#### 3.6.6 Arrival check

Arrival is confirmed only when **all** hold:

1. The figure's entire foot (40 wide) is on the gallery (foot left edge ≥ 1120).
2. The figure's entire foot is past the frame's right edge (foot left edge ≥ frameRight).
   Since the frame extends past the gallery start (frameRight > 1120), the binding
   constraint is `footLeft ≥ frameRight`.
3. The figure's support does not depend on the frame — it is fully on the fixed gallery.

This implements the documented rule: arrival is confirmed only after the figure has fully
left the frame and stands on the fixed gallery. The figure then collects the frame from the
reached side; this is a state transition (ARRIVAL → FINAL), not part of the route walk.

#### 3.6.7 What the route algorithm does NOT do

- It does not check `Lₓ` or `θ` against known-good values. Any configuration satisfying the
  geometric constraints succeeds; any that doesn't, fails. (N02, N03.)
- It does not sample steep segments into small steps to bypass the slope limit.
- It does not add the footprint (40) or any correction a second time to the 48 reach. (N12.)
- It does not treat the frame's uprights as solid walls. (N04.)
- It does not allow a shadow alone or a frame alone to reach the gallery. The shadow's
  maximum width is 750; even with 48 at each end, max reach is 1066 < 1120. The frame's 340
  + 96 < 900. Both are enforced by the actual geometry, not by special-case checks. (N03.)

---

## 4. State layer

### 4.1 Configuration type (`state/types.ts`)

```
Configuration = {
  lamp: { x: number },              // Lx ∈ [500, 740]
  cutout: { angle: number },          // θ ∈ [0, 90] degrees
  frame: {
    centerX: number,
    placed: boolean,                  // is the frame out of its home?
    placedY: number | null,           // y of frame bottom (160 when on gallery height)
  }
}
```

The frame home (centre x = −40, on the floor) is the default when `placed = false`.

### 4.2 State machine (`state/machine.ts`)

States (from `01-§7`):

| State | Behaviour |
| --- | --- |
| COVER | Preferences, New game, Continue. No auto-solution. |
| EDITING | Figure at safe start. Manipulation and preview. Trial uses only confirmed values. |
| TENTATIVE | Frame manipulation in progress. Cancel or invalid confirm restores full prior config. Focus loss or area change cancels provisional first. |
| TRIAL | Configuration locked. Figure walks the route. Pause / Continue / Stop available. |
| TRIAL_PAUSED | Trial paused. Resume or Stop. Closing Help does not auto-resume. |
| FAILED | Readable consequence. Return to EDITING. No loss of objects. |
| ARRIVAL | Whole foot on gallery, past frame. Save final before collection animation. |
| FINAL | Frame collected. Review restores prior config. Restart asks confirmation. |

Transitions:

```
COVER → EDITING           (New game or Continue)
EDITING → TENTATIVE       (begin frame manipulation)
TENTATIVE → EDITING       (cancel, or valid confirm)
TENTATIVE → EDITING       (invalid confirm → restore prior state, no history consumed)
EDITING → TRIAL           (request trial; locks config)
TRIAL → TRIAL_PAUSED      (pause)
TRIAL_PAUSED → TRIAL       (continue)
TRIAL → FAILED            (route fails at some point)
TRIAL_PAUSED → EDITING    (stop; return to start, preserve config)
TRIAL → ARRIVAL           (route succeeds, arrival confirmed)
ARRIVAL → FINAL            (collection animation completes; final saved first)
FAILED → EDITING          (acknowledge failure)
FINAL → EDITING           (Review; restores config prior to successful trial)
FINAL → COVER             (Restart; asks confirmation; preserves preferences)
```

Key rules:
- In EDITING, the figure waits at its start. Changing the lamp or cutout does not push the
  figure — it is a configuration trial, not a continuous simulation on the figure's body. (N07.)
- In TRIAL, the configuration is locked. Lamp, cutout, and frame controls are disabled. (N07.)
- A failed trial returns to EDITING with the configuration preserved. (N08.)
- Resuming an interrupted trial (e.g., browser closed during TRIAL) returns to EDITING with
  the stable configuration. (N08.)

### 4.3 Atomic edit validation (`state/transaction.ts`)

Every confirmed change to lamp, cutout, or frame is a **transaction** over the full
configuration:

```
commitEdit(current: Configuration, tentative: Configuration): { ok: boolean, restored?: Configuration }
```

1. Compute the tentative full configuration.
2. If the frame is placed, run `isFrameValid(tentative)` — check both pads have ≥ 20 overlap
   with flat supports at the same height, using the shadow from the tentative lamp/cutout.
3. If valid: commit. Push the previous config to undo history. Return `{ ok: true }`.
4. If invalid: **reject the entire tentative configuration** and restore the prior confirmed
   state. Do not save or rehearse the invalid state. Return `{ ok: false, restored: current }`.
   An invalid adjustment does **not** consume undo history.

This covers the case where moving the lamp shifts the shadow plateau away from a frame pad:
the confirmation is rejected, the prior state (with the old lamp position and the valid
frame) is restored entirely. No floating frame is saved. (N11.)

To make a broad change safely, the player can first withdraw the frame to its home or to a
broad surface (the initial floor), then change the lamp/cutout, then re-place the frame. Undo
remains accessible throughout.

### 4.4 Undo history (`state/history.ts`)

- Stack of up to 20 confirmed editing operations (each stores a full `Configuration`).
- Preserves access settings and view arrangement; does not save images.
- An invalid adjustment does not consume history.
- Undo pops the most recent confirmed config and validates it before applying. (N08.)

### 4.5 Versioned persistence (`state/persistence.ts`)

Persist the **canonical configuration** plus final/review metadata. Do not maintain a second
mutable copy of frame position or trust a stored `supported` boolean. Derive support by
validation and ownership from the current phase. Saving a final result and reviewing its
pre-trial plan must not duplicate the frame. (Design-review correction 6.)

Versioned save in `localStorage`:

```
SaveRecord = {
  version: number,
  config: Configuration,            // canonical, single source of truth
  history: Configuration[],        // bounded, max 20
  preferences: { language, sound, motion },
  introAttended: boolean,
  planPriorToFinalTrial: Configuration | null,
  terminationState: 'playing' | 'arrived' | 'final',
}
```

Rules (from `01-§7`):
- Each history point and the full configuration are **validated** before allowing restore.
- No drags, animations, or partial trials are saved.
- An illegible or wrong-version record offers a safe new game and never duplicates objects.
- Reloading during ARRIVAL/FINAL recovers the final result, not a figure mid-support.
- In the final, the frame is held by the figure's hand and does not also appear as a bridge.
- Resuming an interrupted trial returns to EDITING with its stable configuration.

The save encoder/decoder and validation functions are **pure**; the localStorage adapter is
I/O and belongs at the application boundary. Handle unavailable or malformed storage without
breaking play. (Design-review correction 7.)

The version number allows schema migration. An unknown version yields a safe new game.

---

## 5. UI layer

### 5.1 Coordinate conversion (`ui/coordinates.ts`)

Isolated module: model (y up) ↔ SVG (y down). A single `modelToSvg(point)` and `svgToModel(point)`
pair. All rendering goes through this; no other module does coordinate math.

### 5.2 SVG rendering (`ui/render.ts`)

Renders the stage from model data:
- Floor, gallery, shadow polygon, frame (with visible pads and structural members), figure.
- The shadow is drawn as a polygon from the projected vertices.
- The frame is drawn as a rectangular border (top, bottom, left upright, right upright) —
  always recognizable as a material object, not a mask.
- The figure is a simple silhouette at its current position.
- Preview (tentative state) shows changes of form, position, and contact, with lost contacts
  signaled. **No** "correct combination" indicator, **no** solved-placement silhouette, **no**
  coordinates or formulas. (N09, `01-§5`.)

### 5.3 Controls

All three input modalities (mouse drag, click, keyboard) offer the **same decisions**. Control
names stay consistent across modalities. (`01-§5`, `impl-§`.)

| Element | Mouse / click | Keyboard |
| --- | --- | --- |
| Lamp | Drag cart, or click on rail | Arrows (10-unit steps), Home/End for stops |
| Cutout | Drag handle on arc, or click a point on the arc | Arrows (5° steps), Home/End for stops |
| Frame | Drag, or Place + confirm click (preview + Cancel) | Arrows (10-unit steps), Enter to confirm, Escape to cancel |
| Trial | Pause / Continue / Stop buttons | Enter/Space on focused button (native focus order) |

Keyboard focus is visible on every action. (`vis-§`, N09.)

Updating the scene during an arrow press or pointer movement must not replace the focused
control or the element holding pointer capture. Consecutive arrow presses work without
refocusing. Loss of focus cancels tentative edits; ordinary scene rendering must not create
artificial focus loss. (Design-review correction 8.)

Frame vertical placement previews the nearest flat support height within 30 model units (x
unchanged). Both pad contacts are still required; invalid previews do not commit. The figure
stays at its start during all manipulation — it does not walk to the frame's home. (`impl-§`.)

### 5.4 Local failure feedback (`ui/feedback.ts`)

When a route trial fails, the feedback is **local** — it describes what happened where:
- A gap too large: "The path breaks here — the gap is too wide to cross."
- A step too high: "The step here is too high."
- A slope too steep: "This slope is too steep to walk."
- Insufficient frame contact: "The frame's corner doesn't rest on enough support."

Feedback uses text and shape (a marker at the failure point), **not** colour alone. It gives
a next observation, not a hidden success score. **No** traffic light, **no** "correct answer"
indicator. (`vis-§`, `01-§6`, N02.)

### 5.5 Preferences and i18n

**Language** (`ui/preferences.ts`, `ui/i18n.ts`):
- Saved manual choice first; otherwise `navigator.languages[0]` (fallback `navigator.language`);
  Spanish for `es` prefixes, English otherwise. (`impl-§`.)
- All game text in English and Spanish. Source and submission docs in English. (`AGENTS.md`.)

**Sound:**
- Initially off. Modifiable. (`01-§6`.)

**Motion:**
- Saved explicit override first; otherwise `prefers-reduced-motion: reduce`, with safe
  standard-motion fallback. (`impl-§`.)
- Reduced motion affects animations only, never the physical rules or the route algorithm.

---

## 6. Visual direction (interface brief)

From `vis-§` (prepared through Codex, 2026-11-05):

**Composition.** One workshop with a dominant paper stage and a compact mechanisms area.
The lamp is a cart on a rail, rotation has a visible pivot and arc, the frame stays
recognisably material. The memorable element is the paper stage: a threatening silhouette
becomes a useful physical path when the player changes its causes.

**Palette.**

| Token | Value | Role |
| --- | --- | --- |
| Night plum | `#241C2B` | Surrounding workshop and depth |
| Walnut | `#49362E` | Worktable, rails and mechanisms |
| Paper | `#E6DABF` | Stage, paper objects, readable notes |
| Ink | `#201A1B` | Support profiles, cutout, frame |
| Brass | `#D9AF59` | Lamp, focus accents, actionable handles |
| Patina | `#82ADA0` | Secondary controls and feedback accents |

Contact feedback uses shape and text, not colour alone. Paper texture does not reduce text
legibility.

**Typography.** Georgia for title and Vera's note; system sans-serif (Segoe UI) for controls.
No external font request in M1.

**Layout.** Title and preferences on top; dominant stage in the centre; lamp rail / cutout
pivot and short feedback / Try route / Undo at the bottom. The browser viewport must not
change the physical rules.

**What to avoid.** Three equal cards with numeric sliders (hides material relationship).
Generic Halloween decoration (competes with the actual mystery). Warm-clay branding and
decorative gradients unrelated to the lamp. All M1 artwork is original SVG and CSS.

**Visual review criteria.** The lamp, pivot and frame are identifiable before instructions
name them. A contact that looks supported agrees with the model. Failure feedback gives a
next observation. Keyboard focus stays visible. The initial composition communicates a fixed
destination and an incomplete route.

---

## 7. Milestones

### M1 — Playable route (first milestone)

A working, playable route that validates geometry and state rules. Not throwaway: all
geometry and state modules are reused by later milestones.

**Scope:**
- `geometry/`: constants, projection, upper profile, surfaces, frame validation, route
  algorithm, bounds. All pure, all unit-tested.
- `state/`: state machine, transactions, undo, versioned persistence.
- `ui/`: SVG rendering, coordinate conversion, all controls (mouse/click/keyboard), local
  failure feedback, preferences, i18n (EN/ES).
- `game/main.ts`: wires modules, runs the browser flow.

**Acceptance:** requirements M1-01 through M1-08 (see `requirements.md` §6).

**Automated checks:** N01, N03, N04, N05, N06, N07, N08, N11, N12 (software-checkable).
**Human observation:** N02 (understandability), N09 (equivalence meaning), N10 (deferred
to M2 observation, but the route must not display solutions).

### M2 — Teaching and intro

- Early local contact demonstrating the support-from-above rule (including lateral passage),
  shown through a small trace — not the full ramp or frame-bridge. (FR-N02, N04.)
- Skippable intro performance: figure recognizes the high access, contacts a local support.
  Does not move lamp, rotate cutout, or build the bridge. (FR-E02.)
- Prepares for N10 human observation (people without explanation).

### M3 — Hint system

- Requested hints only (not automatic by time). Staged: describe observable problem → relate
  causes → announce solution → reveal. (FR-E05, `01-§6`.)
- No correct configuration, pre-solved placement, or automatic hints in normal play.

### M4 — Art, sound, narrative

- Final art polish: paper-theatre materials, shadow aesthetic, frame materiality.
- Sound design (initially off, modifiable).
- Narrative completion: no pursuing enemy, no "monster was good" twist, the unsettling
  becomes part of the path. Ending retains the means to create other steps. (FR-N01,
  FR-N03, FR-N04.)
- Final arrival and frame collection animation (already saved before collection).

### M5 — Submission preparation (out of scope for this authorization)

- Public repo, license, asset notices, URL, description, Kiro-usage evidence, video.
- Requires a separate reviewable decision. (`03`, `AGENTS.md`.)

---

## 8. Test strategy

### 8.1 Automated geometry/state tests (software-checkable)

These are real unit tests against the pure modules — not claimed until they pass.

**Projection (N01):**
- Moving `Lₓ` translates all shadow points by the same offset; orientation and scale unchanged.
- Rotating `θ` changes the slopes of the projected segments.
- `θ=0°` produces the documented ramp + plateau shape; `θ=90°` produces a tall non-walkable
  profile.

**Bounds (N03, N12):**
- Shadow-alone: for any `θ ∈ [0°, 90°]` and any `Lₓ`, the figure cannot reach the gallery
  without the frame. The 48 reach (including 40-wide foot) and 20-unit step are used; neither
  is added twice.
- Frame-alone: the frame (340 wide) cannot bridge the 900-unit gap even with 48 at each end.
- The 20-unit vertical step does not widen the horizontal span.

**Route — two valid configurations (N02):**
- Config A (`Lₓ=650, θ=0°, cx=1010`): route succeeds with real body and contact widths.
- Config B (`Lₓ=700, θ=0°, cx=985`): route succeeds with 35-overlap pads.
- These are **not** hardcoded as success — the test verifies the generic algorithm produces
  success for these geometries, and would also succeed for any other geometry meeting the
  same constraints.

**Route — distinct failures (N02):**
- `θ=90°, Lₓ=500`: fails with "slope" (or no walkable path to gallery).
- `θ=0°, Lₓ=500`: fails with "gap" (initial gap 80 > 48 from floor edge 220).
- `θ=0°, Lₓ=740, cx=970`: fails with "contact" (left pad overlap 10 < 20).
- Each failure produces a different reason and location.

**Steep-segment constraint:**
- A segment with slope > 30° is rejected as unwalkable even if sampled at fine resolution.
- Test: construct a synthetic steep segment, verify the route algorithm rejects it regardless
  of any internal sampling.

**Frame contact (N05, N11):**
- 35-overlap pads are valid; 10-overlap pads are invalid.
- Both pads required; one valid + one invalid → frame invalid.
- Moving the lamp to shift the plateau away from a pad → transaction rejected, prior state
  restored. No floating frame saved.

**State recovery (N08):**
- Cancel restores full prior configuration.
- Undo restores valid history points; invalid adjustments don't consume history.
- Reload recovers final result (not mid-support); interrupted trial → EDITING with stable
  config; illegible record → safe new game.
- Single frame preserved across all recovery operations.

**Arrival (N12):**
- Arrival not confirmed while the figure's foot is still on the frame.
- Arrival confirmed only when the whole foot (40) is on the gallery and past frameRight.
- Final saved before collection animation.

**Controls equivalence (N09, software part):**
- Lamp, cutout, and frame keyboard steps produce the same configuration changes as
  mouse/click alternatives.
- No solved placement or correct-answer indicator is rendered.

### 8.2 Browser flow tests

- The full flow runs in a browser: cover → preferences → editing → trial → result.
- Mouse drag, click, and keyboard each complete the same edit → trial → result sequence.
- Reduced-motion preference disables animations without changing route results.
- Language preference switches EN/ES text.
- Reload preserves state per §4.5.

### 8.3 Human playtesting (unverified — explicit, separate)

These are **not** automated and **not** claimed as passing. They require observation with
people, per `02-§7` and `03-§"Primeras comprobaciones cuando se construya"`. An agent does
not count as a participant.

- **N10:** People without explanation can distinguish incorrect slope, lack of contact, and
  lack of length, and can reinterpret the frame without a shown solution.
- **N02 (human part):** The distinct failures produce *understandable* local feedback.
- **N09 (human part):** Mouse/click/keyboard preserve *meaning* across modalities.
- Comfort and satisfaction: the player can anticipate what fails, choose between
  corrections, and discover the frame's material application with sufficient margin.

These items are tracked as unverified in `docs/testing.md` when implementation reaches that
stage. They are never marked as passing by an agent.

---

## 9. Open design items

- **O-07 (intro choreography):** Deferred to M2. The intro's intent is specified; exact
  choreography and timing will be designed when M1's route is validated.
- **O-08 (hint content):** Deferred to M3. The staged structure is specified; specific text
  per situation will be written when the hint system is built.
- **O-09 (event facts):** Re-check official sources when submission facts matter (M5, out of
  scope).

No material contradiction within V3/R1 was found. If implementation reveals one, it will be
raised with a concrete reference, not patched with a new mechanic.
