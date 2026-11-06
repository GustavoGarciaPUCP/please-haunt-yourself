# Project instructions

## Product and sources

Build La ventana equivocada / The Wrong Window, a complete browser-based paper-theatre puzzle for Kiroween 2026, Costume Contest. The current design is V3/R1:

- `docs/diseno/01_Experiencia_y_sistema.md`: experience, rules, controls, states, ending, and N01–N12 validation items.
- `docs/diseno/02_Geometria_y_revision_independiente.md`: authoritative geometric constants, valid configurations, counterexamples, and limits of the prior review.
- `docs/diseno/03_Requisitos_oficiales_y_cierre.md`: event requirements as reviewed; check official sources when event facts matter.

Retain earlier planning dates. Superseded tray and recorded-hand concepts are not part of this implementation. Raise concrete contradictions instead of inventing mechanics.

## Workflow

The participant wants development coordinated from Codex through files and terminal tools. Do not automate desktop windows. Kiro CLI may perform actual development tasks in this directory; record what each tool actually does.

Start with reviewed requirements, then technical design and tasks, then implementation. The first milestone validates the playable route with body dimensions, contacts, state recovery and local failure feedback. Keep the full documented experience in the plan beyond that milestone.

Use TypeScript, Vite and SVG/HTML/CSS unless a concrete verified need justifies a change. Keep geometry and state transitions independent of rendering. Model coordinates have y upward; convert explicitly for SVG.

## Quality

- Preserve the documented projection equation and material support rules.
- A changed lamp, cutout or frame is a transaction of the full configuration. Never retain a floating frame after an invalid edit.
- Treat foot reach and snap as one bounded horizontal tolerance, not separate additive allowances.
- Prefer visible physical interactions to generic sliders or a solution-checking panel.
- Mouse, click-based and keyboard actions must offer equivalent choices. Respect sound-off and reduced motion.
- The destination is fixed. Frames are physical objects, not teleportation shortcuts.
- Do not show a correct configuration, pre-solved placement or automatic hints in normal play.
- Keep dependencies small and tests meaningful. Validate the documented counterexamples, boundary cases and recovery properties. Human playtesting remains a separate requirement.

## Evidence and delivery

Keep `.kiro/` tracked. Do not place credentials in project files. Do not fabricate tool sessions, test results, user research, usage statistics or prize claims. Distinguish planning, implemented behavior, automated checks and human observation.

Use English for source and submission documents, and provide English/Spanish game text. Local internal Spanish design documents are retained as sources and will need translation for submission.

Public publication, account changes, purchases and final submission require a separate reviewable decision. This development authorization covers local implementation and testing, not those actions.
