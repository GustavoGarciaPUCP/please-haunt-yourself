# Project instructions

Please Haunt Yourself is a PC-first Halloween browser game. The public entry point is the repository's GitHub Pages home, which opens the case at haunt.html. The earlier paper-theatre prototype is available at workshop.html. Public player-facing text and documentation are in English.

## Implementation and verification

- The current case uses TERMINAL, ECHO, CANVAS, and POSTMAN. Follow the [narrative contract](docs/development/23_The_Unsent_Letter_Narrative_Contract.md) and the [Kiro steering record](.kiro/steering/project-contract.md) for the decisions and version history.
- Preserve the case's completion and replay behavior, save compatibility, keyboard operation, and reduced-motion support when making changes.
- Run npm run build and npm test before release. Run the appropriate browser checks against a fresh build. Record the environment and results, including any limits on what was tested.
- Record Kiro, Codex, and participant contributions according to the work each performed. Preserve the project history and development dates. The [Kiro development record](docs/kiro-usage.md) links to the specifications and checks.
