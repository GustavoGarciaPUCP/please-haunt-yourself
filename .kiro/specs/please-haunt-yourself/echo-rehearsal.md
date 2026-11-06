# ECHO-01 Rehearsal Scene — Scope and Design

**Authored:** November 6, 2026 by Kiro (Claude Sonnet 4.5)
**Task:** First interactive reflection/exposure rehearsal in ECHO window

## Goal
Transform ECHO's static illustration into a playable scene where the player positions an opaque farewell prop to block ECHO's private reflection view while keeping the public stage clear. Once ready, rehearse an explicitly labeled example entrance with either collapse or scare-back host reaction.

## Technical Design

### First-pass Coordinate System (superseded by review below)
- Board: 640×410 logical units, responsive to container
- Public stage: rectangle at (120, 80, 400, 240) — where the cast performs
- Private view: rectangle at (20, 20, 180, 120) — ECHO's self-view thumbnail
- Farewell prop: movable opaque panel, initial position outside both regions

### Interaction Mechanics
1. **Edit mode**: Player drags prop header or uses arrow keys/directional buttons to position it
2. **Coverage validation**:
   - Private region must be fully covered by prop
   - Public stage must have zero overlap with prop
   - Visual readiness indicators update in real-time
3. **Rehearsal**: Run example entrance with chosen host reaction (Scare/Collapse)
4. **Sequence**: Appearance (280ms) → Host reaction (240ms) → ECHO response (160ms)

### State Management (`echo-scene.ts`)
- Scene states: `editing`, `performing`, `paused`, `complete`, `failed`
- Run cancellation: Generation counter invalidates stale callbacks
- Geometry validation: Pure functions for coverage checks
- Host reactions: Two paths with distinct final poses

### View/Controller (`echo-view.ts`)
- SVG rendering with separate actor groups for animation
- Pointer capture for drag, keyboard for arrow movement
- Accessibility: ARIA live regions, focus management, keyboard alternatives
- Reduced motion: Key poses only, same semantic checkpoints

### Integration
- `desktop.ts`: Open ECHO window with scene initialization, cleanup on close
- `desktop.css`: Board layout, prop styling, readiness indicators
- Existing window lifecycle preserved: minimize pauses, close disposes

## Constraints
- Example entrance only (not player-recorded content)
- No live editing during performance
- Leave/Escape priority cancels all pending work
- Tab visibility changes pause active performance
- No new dependencies, shell commands, or external assets

## Out of Scope
- Recording, CANVAS extraction, POSTMAN correspondence
- Other three tableaux
- Sound effects
- Save/persistence
- Multiple entrances or visitor policy

## Codex review and implemented corrections — November 6

The Kiro run wrote this scope and an initial file pass, then ended with a monthly usage-limit error. The design claims above were intentions, not successful verification. Codex found that the original private/public rectangles overlapped and the initial panel exceeded the board; successful privacy coverage was impossible. Window/controller initialization and lifecycle behavior also needed repair.

Current geometry: board640×410; public(20,70,380,260); private(450,70,160,110); panel180×140 at(430,240). These rectangles are screen/SVG coordinates with y increasing down. Current states also include `left`. Failed coverage requires Edit set; Leave never counts as admission/completion. Resume is explicit and restarts the paused semantic cue's duration. Minimize and hidden events pause; close stops work and detached reopen creates a fresh scene. Live reduced motion settles poses without reviving paused/departed runs.

Codex rebuilt the controller and vector composition, completed lifecycle/cancellation, added the requested Help alignment aid and ran the checks. The reviewed result passes seven ECHO unit cases and nine browser journeys, in addition to the preserved window checks. Visibility is an explicit simulated-event check, not an observed OS background-tab transition. See `docs/development/2026-11-06-echo-rehearsal.md` for attribution, evidence and remaining scope. Do not attribute the entire final controller or Codex checks to Kiro.
