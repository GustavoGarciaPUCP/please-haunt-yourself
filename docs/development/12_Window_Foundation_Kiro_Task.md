# WINDOW-01 — bounded native Kiro implementation task

November 6, 2026. Prepared by Codex from the participant's explicit request for a small increment and maximum reasoning on Claude Opus5.5. This is a task handoff, not completed Kiro output. Do not substitute a model if it is unavailable.

**Later explicit authorization:** the exact Opus5.5 run failed because the current account does not expose that model. The participant then authorized using the best available model and their Kiro credits. This task is now assigned to native **Claude Sonnet4.5**. Do not claim Opus/max execution, switch account or purchase a subscription. All other bounded task requirements remain in force.

## Deliver exactly this increment

Create a separate, visually intentional PLEASE HAUNT YOURSELF desktop foundation at `haunt.html`. Preserve the existing index page, src/main.ts, src/core, paper-bridge UI and its tests. This increment implements smooth OS-style window opening, closing, minimizing and restoring; it does not implement or claim the four gameplay scenes.

Allowed new files:

- `haunt.html`
- `src/haunt/desktop.ts`
- `src/haunt/desktop.css`
- `src/haunt/window-motion.ts`
- `.kiro/specs/please-haunt-yourself/window-foundation.md`

Write a concise requirements/design/task note in that last file, then implement. Do not create a large duplicate of09–11. Codex can integrate the extra build entry and run checks afterward. Do not change dependencies, existing source or old Kiro specs. Do not run shell/browser commands, spawn agents or conduct additional research; this is one bounded file-writing pass to conserve credits. Final response under200words with actual files changed and limits.

## The page

English product text. A quiet nocturnal recovery desktop with a common taskbar, restrained period-inspired chrome, bone paper, petrol glass, oxblood depth and copper light. Use local CSS and small inline SVG for the representative ECHO/paper silhouettes; do not put the flattened concept-board image behind the app or add a font/network dependency. Modern softly rounded window panels with crisp borders and subtle shadows can carry fluid iOS-like motion without copying Apple's branding or turning the whole product into a generic glass dashboard.

Two functional apps, ECHO and TERMINAL, suffice for this increment. TERMINAL starts open with a short recovery message; ECHO opens from its taskbar control and shows a simple representative stage illustration. Render only controls that actually work. Other cast names may appear as non-interactive recovered-app labels, not misleading working buttons. A small visible phrase identifies this as a window foundation; do not imply that the camera puzzle, personal recordings, body extraction, postcards or final show already work.

## Window lifecycle

- Real Open/Close/Minimize/Restore actions with one window per app; repeated activation brings the same window forward, never duplicates it.
- Opening: opacity0 to1 and scale0.94/translateY12px to rest over240ms, ease-out cubic-bezier(0.23,1,0.32,1), transform origin informed by the taskbar trigger when practical. One container animation; contents are present without stagger.
- Closing: opacity1 to0 with scale0.97/translateY6px over160ms. Disable the closing window's interactions immediately, restore focus to its trigger and remove/hide it after the current close completes.
- Minimize/restore: same real lifecycle with a compact motion toward/from its taskbar trigger; preserve content state and do not render a fake maximize button. Keep actions immediately responsive.
- Cancellation is essential: closing mid-open and reopening mid-close must end at the latest requested state. Cancel old animations and invalidate old completion callbacks. No delayed callback may hide a reopened window. Closing/minimizing must not leave a hidden focus target or stale input blocker.
- Keyboard: semantic controls, visible focus, titled non-modal dialog windows, Escape closes the focused/active window, opening focuses a useful element, closing/minimizing restores focus to the trigger. No focus trap that locks the desktop; focusing a window brings it forward.
- Match prefers-reduced-motion at startup and on change. Settle to the currently requested logical state without travel or stale callbacks. The same controls remain usable.
- On narrow layouts windows remain within the viewport and primary controls remain reachable. Do not add drag physics, resize, persistence or staged gameplay for this small foundation.

## Review boundary

Do not claim success from code alone. Codex will inspect type/build results and actual browser behavior, including fast close/reopen, minimize/restore, keyboard focus and reduced motion. The existing bridge tests do not prove this window foundation.
