# Initial brief for Kiro

Prepared on October 30, 2026. This prompt has not been submitted to Kiro. Sending it will use the account's available credits; wait for the participant to choose when to begin.

In Kiro, start a **Feature Spec → Requirements-First** and paste the text below. This follows the [official Specs workflow](https://kiro.dev/docs/specs/).

---

I am building a complete browser-based puzzle game for Kiroween 2026, in the Costume Contest category. Its working title is La ventana equivocada. I am working solo. The final product should feel like an eerie paper-theatre workshop: the visual materials and interactions must make the puzzle understandable.

First read these existing design documents in full:

- docs/diseno/01_Experiencia_y_sistema.md
- docs/diseno/02_Geometria_y_revision_independiente.md
- docs/diseno/03_Requisitos_oficiales_y_cierre.md

Treat V3/R1 as the current design. Earlier recorded-gesture and tray mechanics are obsolete. Preserve the dates of prior planning and distinguish it from your own subsequent work.

Create the initial requirements document in English. Link each requirement to a design section and, where relevant, its N01–N12 verification item. Separate requirements that can be checked by software from those requiring observation with people. Identify any remaining contradictions or missing decisions with specific references. Do not invent new mechanics to fill gaps.

The planned stack is TypeScript, Vite and SVG/HTML/CSS. Keep model coordinates separate from screen coordinates and rendering. If you recommend a change, explain the concrete reason before adopting it.

The first implementation milestone will be a playable route that validates the geometry and state rules. It is an intermediate milestone toward the full experience. Its acceptance criteria must include:

- Moving the lamp translates the shadow without rotating or scaling it; rotating the cutout changes orientation.
- The two valid configurations from V3/R1 work with the real body and contact widths. The distinct failure examples produce understandable local feedback.
- Neither the shadow alone nor the frame alone bypasses the intended combination. Include the documented step, footprint and total horizontal-contact tolerance in the checks.
- The frame requires both supports. An edit that invalidates a placed frame must reject the entire tentative configuration and restore the prior confirmed state.
- The figure waits during editing; a route trial locks the configuration. Failed trials stop safely.
- Cancel, undo, reload and review preserve valid states and one frame. Arrival is confirmed only after the figure has fully left the frame and stands on the fixed gallery.
- Mouse, click-based and keyboard controls support the same decisions. Do not display a solved placement or a correct-answer indicator.

Preserve the full game's documented teaching, narrative, ending and accessibility requirements for later milestones; do not silently remove them to simplify the first milestone.

Return the requirements for review before creating the technical design, implementation tasks or game code. Do not install dependencies, publish anything or execute implementation tasks at this stage. Record only work you actually perform as Kiro usage; do not mark planned tests as passing.
