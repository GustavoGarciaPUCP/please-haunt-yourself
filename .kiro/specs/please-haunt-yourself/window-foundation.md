# WINDOW-01 — Window Foundation Specification

November 6, 2026 · Native Claude Sonnet4.5 implementation

## Requirements

Create a separate PLEASE HAUNT YOURSELF desktop foundation at `haunt.html` that demonstrates smooth OS-style window lifecycle without implementing full gameplay. This increment is visually intentional, cancelable and responsive.

**Scope:** Open/close/minimize/restore motion for ECHO and TERMINAL windows with proper focus, keyboard control and reduced-motion support. Representative visual design using nocturnal desktop palette and inline SVG. No gameplay scenes, persistence, drag or resize.

**Visual design:** Quiet nocturnal recovery desktop with bone paper, petrol glass, oxblood depth, copper light. Softly rounded modern window chrome with crisp borders and subtle shadows. Small inline SVG for ECHO/TERMINAL silhouettes. English product text identifies this as a window foundation.

**Window behavior:**
- TERMINAL starts open with recovery message
- ECHO opens from taskbar, shows representative stage illustration
- One window per app; repeated activation brings forward
- Opening: opacity 0→1, scale 0.94→1, translateY 12px→0, 240ms ease-out
- Closing: opacity 1→0, scale 1→0.97, translateY 0→6px, 160ms ease-out
- Minimize/restore: similar compact motion toward/from taskbar trigger
- Cancellation: closing mid-open and reopening mid-close must reach latest requested state
- Focus management: opening focuses window, closing/minimizing restores taskbar trigger immediately, Escape closes focused window (works during opening/restoring)
- Reduced motion: reach same logical state without travel, settle active operations on preference change
- Responsive: windows stay within viewport on narrow layouts

**Controls that work:**
- Taskbar buttons for ECHO, TERMINAL
- Window controls: close, minimize
- Keyboard: Escape, focus navigation, activation
- Focusin anywhere in window brings it forward

**Non-interactive for this increment:**
- Other app names may appear as recovered labels, not working buttons
- No camera puzzle, recordings, body extraction, postcards, save

## Design

### Architecture
- `haunt.html`: entry point with inline nocturnal palette CSS
- `desktop.ts`: window state management, lifecycle coordination, focus handling
- `desktop.css`: window chrome, taskbar, layout using CSS `translate` for centering
- `window-motion.ts`: Web Animations API control with cancellation, generation guards, reduced-motion detection

### State model
```typescript
type WindowState = 'closed' | 'opening' | 'open' | 'closing' | 'minimized' | 'restoring'
type AppId = 'echo' | 'terminal'

interface WindowInstance {
  id: AppId
  state: WindowState
  element: HTMLElement
  operationGen: number  // Guards against stale callbacks
  zIndex: number
  trigger: HTMLElement | null
}
```

### Lifecycle correctness
- **Latest state wins**: close/reopen/minimize/restore allowed at any time including during opening
- **Generation guards**: each operation increments `operationGen`; callbacks check generation before applying effects
- **Immediate focus/inert**: close/minimize restores trigger focus and marks window inert immediately, before animation
- **Cancellation without hiding**: cancel WAAPI and release fill effects without removing reopened windows
- **Reduced-motion settling**: preference change settles all active operations to target states

### Motion primitives
- `openWindow(id, trigger)`: cancel pending operations, focus immediately, animate from trigger; a completed older transition cannot steal focus
- `closeWindow(id)`: restore focus immediately, mark inert, animate out with ease-out, cleanup only if generation matches
- `minimizeWindow(id)`: restore focus immediately, compact motion to trigger
- `restoreWindow(id)`: reverse minimize, bring to front
- `cancelAllAnimations(element)`: abort WAAPI and release fill effects

### Focus strategy
- Opening: focus first interactive element or window itself
- Closing/minimizing: restore focus to taskbar trigger immediately
- Focusin anywhere in window: bring to front
- Escape: close focused/active window (works during opening/restoring)
- Tab: cycle within window, then to next window or taskbar

### Reduced motion
- Detect `prefers-reduced-motion` at startup and on change
- On change: settle all active operations to target visual state, cancel animations
- Replace transform/opacity transitions with instant state change
- Preserve focus order and logical state
- Same controls remain usable

## Tasks

1. ✓ Write this spec
2. ✓ Create `haunt.html` with nocturnal palette, taskbar structure, window containers
3. ✓ Implement `desktop.ts`: window registry, lifecycle state machine, focus management, generation guards
4. ✓ Implement `window-motion.ts`: Web Animations API control, cancellation, callbacks, preference watching
5. ✓ Style `desktop.css`: window chrome with CSS `translate` centering, explicit width, ease-out curves, responsive layout
6. ✓ Corrections: generation guards prevent stale callbacks, immediate focus/inert on close/minimize, CSS `translate` preserves WAAPI `transform`, reduced-motion settling, focusin brings forward, Escape works during opening

## Verification boundary

Code completion is not success. Codex will inspect:
- Type/build results
- Browser behavior: fast close/reopen cycles, minimize/restore, keyboard focus
- Reduced motion compliance
- Visual intentionality of nocturnal chrome

Existing paper-bridge tests do not cover this foundation.

## Codex review and executed verification

November6 follow-up: Codex corrected remaining Escape/active-window lookup, completion-focus stealing, sampled-pose cancellation, stale motion callbacks and persistent WAAPI fill effects, plus a type-check failure. Codex also refined inline vector art/chrome and integrated a second build entry. These are explicit review contributions, not additional Kiro-authored features. Build/type checking and eight real browser lifecycle/layout checks passed; see `docs/development/2026-11-06-window-foundation.md` and the repeatable `scripts/check-haunt-windows.mjs`. Full gameplay and human testing remain pending.
