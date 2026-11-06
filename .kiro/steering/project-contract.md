---
inclusion: always
---

# The Wrong Window: implementation contract

Prepared through Codex on November 5, 2026. This document directs future Kiro tasks; its existence alone is not evidence that a task consumed it.

- Follow `AGENTS.md` and the V3/R1 references. Requirements and design are in `.kiro/specs/the-wrong-window/`. Use `tasks.md` for current progress rather than historical status snapshots.
- Work through files and terminal tools. Do not automate desktop windows, change accounts, purchase services, publish, push or submit.
- Keep the projection, support contacts, dimensions and fixed gallery in `src/core/` independent of rendering. No solution presets or hidden understanding flags.
- An edit is an atomic transaction of the whole construction. Unsupported candidates must restore the previous configuration and history. Saves retain confirmed states only.
- Narrative must teach observable material rules without solving the puzzle. Sound is optional, reduced motion preserves meaning, and EN/ES choices remain equivalent.
- Use `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run test:browser`, and `npm.cmd run build` as appropriate. Vite bundles the application; it does not emit individually require-able `dist/core/*.js` files. Test TypeScript modules with Vitest.
- Keep changes small enough to review. Run checks before claiming success. Do not create evidence for features or Kiro sessions that did not execute.
- Report concrete files and results. Codex and Kiro contributions must be distinguished honestly. Preserve `.kiro/` in Git; do not publish private CLI streams, model reasoning, credentials or account identifiers.
