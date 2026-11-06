# WINDOW-01 — implementation and verification record

November 6, 2026. This records the new project's first bounded implementation increment, not the four-scene game or competition readiness.

## Authorization and model access

The participant explicitly resumed a small amount of coding for smooth OS-style window opening/closing and related controls. They requested native Kiro with Claude Opus5.5 at maximum effort. Kiro CLI3.1.0 reported itself current; its account model catalog did not include Opus5.5. A direct run with that explicit model and effort failed before tool work: the model was unavailable and max effort could not be applied. No fallback output is claimed from that attempt.

A native `/usage` inspection showed Kiro Free and42.58 of50 plan credits used before the successful implementation. This plan display does not establish the promotional4,000-credit balance or its consumption order. The participant confirmed this was the same Free account, then explicitly authorized the best available model and use of their Kiro credits. Claude Sonnet4.5 was selected from that account's actual catalog. No subscription, account switch, credential extraction or region workaround was used.

## Actual contributions

| Run/work | Result |
| --- | --- |
| Codex preparation | Bounded task12, updated authorization and `.kiro/steering/project-contract.md`; not Kiro-generated work |
| Native Kiro Sonnet4.5, WINDOW-01 | Completed normally; wrote the short new foundation spec, `haunt.html`, `desktop.ts`, `desktop.css` and `window-motion.ts` |
| Codex review | Found that animated transforms overwrote CSS centering, reopen during close was ignored, active-window lookup excluded opening, focus was delayed, and motion preference changes did not settle active animations |
| First native Kiro correction attempt | File-replacement permissions were missing in Codex's launch configuration. The calls failed before approval; the participant did not reject them. Codex stopped the process instead of allowing repeated retries. No successful fix is claimed from that interrupted run |
| Resumed native Kiro correction | Completed normally with the permission issue corrected. Changed centering, operation generations, inert/focus handling, motion preference callback and related spec notes. Tool activity stayed within file operations; no new Kiro shell/browser verification is claimed |
| Codex final corrections | Fixed the unused binding exposed by type checking, completion focus stealing and Escape lookup during opening; made focus immediate; sampled reversal poses; guarded stale motion completions and released finished fill effects; kept a repeated taskbar activation on the same existing window |
| Codex interface/integration | Refined local inline SVG cast, desktop typography/chrome and useful terminal copy; added primary Open ECHO, responsive layout, two-entry build and repeatable browser-check script without new dependencies |

The earlier paper-bridge source/index and its `.kiro/specs/the-wrong-window/` remain preserved. A new `.kiro` spec does not make the old prototype or Codex review fixes Kiro-authored. Private event streams remain outside Git and are not published; private reasoning and account identifiers are excluded.

## Working increment

Two functional windows: ECHO and TERMINAL. Open, close, minimize and restore are real lifecycle actions. Latest requested state wins during reversals; departing windows become inert and restore focus immediately. Keyboard focus raises a window; Escape works during opening/restoring. Reduced-motion changes settle to the same requested state. The ECHO illustration is an early inline vector treatment, not the completed camera puzzle.

Personal recordings, body extraction, visitor policy, invitations/postcards, persistence and premiere remain unimplemented. Other application names are non-interactive cast labels. This avoids pretending that a window shell is the completed experience.

## Executed checks

`npm.cmd run build` passed after Codex's final corrections, including TypeScript checking and both HTML build entries. The repeatable browser script uses the repository's existing Playwright library and local headless Chrome; the newly installed standalone Playwright CLI package was unavailable, so no extra runtime dependency was downloaded to perform this verification.

Eight browser checks passed with no page errors:

1. Initial TERMINAL visibility, actual focus and in-bounds placement.
2. An actual240ms opening transition that settles without lingering animation effects.
3. Close/reopen in the same turn: immediate inert/focus handling and no delayed deletion after the old close deadline.
4. Interrupted minimize/restore preserves the same window/content instance.
5. Escape during opening closes the correct window and restores its trigger.
6. Switching to reduced motion during opening settles correctly; keyboard reopen/close still works.
7. Keyboard focus raises the intended window without an earlier completion stealing focus.
8. Windows/controls remain within desktop bounds at390×844 and800×450, in addition to the1440×980 desktop capture.

These are browser behavior checks of WINDOW-01, not human playtesting, measured aesthetic superiority or proof of any unimplemented game mechanic. Actual captures and the machine-readable check report are local artifacts in `output/playwright/`, excluded from Git. `scripts/check-haunt-windows.mjs` is retained for repeating the checks against a running server.

After the directory/package rename, Codex rebuilt from the new root and repeated all eight checks against the compiled production preview at the same local URL; all passed again with no page errors. The check script also explicitly asserts initial focus. The earlier bridge's source, index page and specs have no implementation diff in this increment.

## Folder and project identity

At the participant's explicit instruction, the repository directory was renamed in place from `C:/Users/51924/Documents/Kiroween2026/LaVentanaEquivocada` to `C:/Users/51924/Documents/Kiroween2026/PleaseHauntYourself`. Both resolved paths were checked within the named parent and the destination was absent. The same `.git` directory/history was retained. Package metadata now names Please Haunt Yourself; dependency versions were not changed. Historical run records retain their original locations/dates.

Use `http://127.0.0.1:5174/haunt.html` for this new foundation when its local server is running. The root page is still the preserved bridge prototype. No remote publication or submission occurred. Exact post-run billing and promotional credit debits remain unverified.
