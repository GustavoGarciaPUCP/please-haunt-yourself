# The Wrong Window / La ventana equivocada

A browser puzzle in a paper-theatre workshop. Move the light, turn a paper cutout and reconsider a rigid frame to make a path to a fixed high gallery. The shadow is calculated from the objects you manipulate; success follows material contacts and the figure's route.

Working entry for Kiroween 2026, Costume Contest. First playable development milestone, not a finished competition submission.

**Concept status, November 5:** the participant has authorized changing the central idea. This running game is the preserved earlier prototype. The current candidate is a [Halloween desktop with dead programs](docs/diseno/05_Programas_muertos_propuesta.md), proposed by the participant and under review. The checks below belong to the earlier game; they are not evidence for a new implementation or its competitive quality.

**Current phase: concepts only.** The participant has stopped application coding while we challenge and develop the ideas. [Inherited functions](docs/diseno/06_Exploracion_funciones_heredadas.md) explores a substantially different interaction within the fictional desktop; it remains a candidate, not an implementation commitment.

**Latest recommendation, November 6:** [One Last Function — complete experience proposal](docs/diseno/07_Ultima_funcion_diseno_completo.md). Three applications with distinct behaviors stage a Halloween attraction and survive as an interactive theme. The document defines the premise, encounters, event sequence, recovery and playable ending, incorporating criticism from two Codex agents. This is the proposal to review next; earlier explorations are retained as history. No application code was changed for it.

**Later revision:** [Please Haunt Yourself](docs/diseno/08_Please_Haunt_Yourself.md) is now the recommendation to review: six English-language programs and personalization through the player's recorded decisions, authored scene, correspondence and causal score. This responds to the participant's rejection of07 as too simple. The old runnable game remains unchanged; the revised experience is design only.

## Run locally

Requires Node.js 22.12 or later in the Node 22 release line (development verified with 22.13.1).

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173/`. On non-Windows shells, use `npm` in place of `npm.cmd`.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:browser
npm.cmd run build
```

Browser tests use a locally installed Google Chrome through Playwright. Build output goes to `dist/`. The game needs no backend, login, runtime AI service or API key. It saves confirmed constructions and preferences in this browser's local storage; if storage is unavailable, the current session remains playable.

## Play

- Enter the workshop. The figure waits while you prepare the scene.
- Drag or click the lamp rail and paper pivot. Keyboard arrows adjust them; Home/End reach their mechanical stops.
- Drag the frame, or choose **Place frame** and click the stage. With keyboard focus on the frame, Enter picks it up, arrows move it, Enter sets it down and Escape cancels.
- Try the route, pause, continue or return to the table. Undo restores confirmed edits. Hints are requested explicitly.
- Language, sound and reduced motion can be changed. Sound starts off.

The skippable opening, moving figure, support contacts, transactional rejection, save recovery and first ending are implemented. Automated checks exercise two distinct constructions through the actual browser controls. Human discovery testing, ending choreography and mobile legibility still need work; a fitting mobile layout is not proof that the puzzle is comfortable on a phone. Use a desktop browser for this development version.

## Development and evidence

Game implementation began November 5, 2026. Earlier concept and design notes retain their dates and are disclosed as planning. Kiro CLI generated requirements, technical design, initial configuration, physics tests and the opening feature with integration/tests. Codex implemented the first playable engine/interface, reviewed and corrected Kiro output and runs independent checks. The detailed [Kiro usage record](docs/kiro-usage.md) distinguishes completed contributions, interrupted attempts and planned work.

- [Requirements](.kiro/specs/the-wrong-window/requirements.md), [technical design](.kiro/specs/the-wrong-window/design.md) and [current task tracker](.kiro/specs/the-wrong-window/tasks.md).
- [Implementation decisions](docs/development/implementation-decisions.md) and [design review](docs/development/design-review.md).
- [Executed verification](docs/development/verification.md) and [next iterations](docs/development/next-iterations.md).
- [Original experience](docs/diseno/01_Experiencia_y_sistema.md) and [geometry reference](docs/diseno/02_Geometria_y_revision_independiente.md), retained in Spanish.
- [Official rules](https://kiroween.devpost.com/rules). The event website governs; local notes do not establish eligibility or sufficient Kiro usage.

`.kiro/` stays tracked. No public deployment or submission has occurred. Public delivery still needs license/asset review, English or translated submission materials, a real demo, and a separate publication decision. Private CLI streams and authentication information are not part of this repository.
