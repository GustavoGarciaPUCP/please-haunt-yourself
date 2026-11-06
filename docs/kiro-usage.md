# How Kiro is being used

Factual development record, November 5, 2026. This is a work log, not the final submission write-up. Planned work, failed attempts and completed contributions are distinguished below.

## Starting material and tool roles

The V3/R1 concept, Spanish design references and initial handoff existed before the first Kiro task. Their original planning dates are retained. They were developed through discussion and review in Codex, not by Kiro.

Codex coordinates and reviews local work. The participant's authenticated Kiro CLI 3.1.0 operates in this project through its native interface. No desktop automation is used. No authentication tokens are extracted or routed to a third-party model harness.

## Executed work

| Local run | Actual Kiro contribution | Review/outcome |
| --- | --- | --- |
| Requirements, V3 spec mode | Read the V3/R1 references and generated `requirements.md` in English, with source references, N01–N12 and separate human/software checks | Generated file retained. Some repair operations failed because the caller's initial tool allowance omitted editing; a subsequent task applied them |
| Design, resumed V3 spec mode | Corrected requirements and wrote `design.md` after concrete implementation decisions supplied through Codex | Design file retained and reviewed. The command stalled after writing and was stopped; no Kiro-generated task list is claimed |
| Core setup, V2 | Created initial `package.json`, `tsconfig.json` and `vite.config.ts`; revised technical design | Service throttled before engine implementation. Codex subsequently updated dependencies/configuration and implemented the playable engine and UI |
| Geometry, V2 | Read relevant sources | Service throttled; no geometry code or tests were produced. Current `geometry.ts` was implemented through Codex |
| Sonnet properties, V2 | Attempted a smaller test task | Service throttled; no tests from this attempt are claimed |
| Physics tests, V3 default, Claude Sonnet 4.5 | Wrote `tests/physics-properties.test.ts`, covering projection, contacts, routes, edit transactions and save validation | All 14 initial tests passed independently. Type checking exposed an unused import; review also identified a vacuous conditional and opportunities for stronger randomized checks |
| Physics review, V3 default, Claude Sonnet 4.5 | Corrected the import, replaced a vacuous check with concrete 20/19 contact boundaries, and added randomized rollback and bridge-save tests | Kiro ran type checking and the suite, corrected a failing fixture, then obtained 28 passing tests. Codex independently confirmed the results and tightened save coverage to encode during the unsupported preview, rather than before the attempted edit |
| Opening performance, V3 default, Claude Sonnet 4.5 | Read the project steering contract; wrote `src/core/opening.ts`, integrated the opening into controller/view/types, and added unit/browser checks | Type checking and unit checks executed. A browser run left a passed report, but the CLI remained waiting and was stopped. Completed files are retained; a normal command completion is not claimed |
| Opening review, V3 default, Claude Sonnet 4.5 | Applied concrete review on reduced-motion holding, Help interruption, focus transfer and a physically clearer local path; extended browser coverage | Task finished normally without running commands, as requested. Codex independently tested the changes, fixed a remaining zero-time reduced-motion pose and incorrect test selector/expectations, then obtained 35 passing unit/property tests and 9 passing browser checks |

Codex authored the first playable engine, workshop UI/controller, `tests/route.test.ts` and initial browser end-to-end tests. Kiro authored the later opening module and integration/tests; Codex review fixes are identified above. Codex also added the home aperture closing when its frame moves, a visible final grip, and the visual correction that keeps opening text off the figure's feet. Kiro specs informed the implementation, but they do not make all subsequent code Kiro-authored.

## Evidence and limits

Requirements/design live in `.kiro/specs/the-wrong-window/`. The task tracker there is explicitly Codex-maintained and was created after the first playable build. Steering was prepared through Codex, and the opening run's Read File events confirm it was consumed. Its practical constraints were used in the task and reviewed in the output: unchanged mechanisms, equivalent motion choices, truthful evidence and local-only work.

No production defect is claimed to have been discovered by the physics PBT suite in this iteration. It provides regression coverage; review and verification did reveal and correct test-fixture and opening-integration problems. We have not used Kiro hooks, Crew or MCP for this implementation and do not claim otherwise.

Actual CLI event streams are retained privately outside the repository. The public-facing record excludes private model reasoning, credentials and account data. Local Git commits preserve reviewed artifacts; this record does not fabricate sessions or alter dates.

No exact credit debit or remaining balance has been independently verified. The participant last reported `0/4000` used. Successful Kiro file changes establish real execution, not a particular charge or usage threshold.

## Competition boundary

[Official rules, section 4](https://kiroween.devpost.com/rules) accept Kiro CLI and leave sufficiency of Kiro use to the judges. There is no numeric usage threshold stated there. Spending credits alone is not our acceptance criterion.

Before submission, review the actual development contributions and explain how specific Kiro outputs affected the working product. Keep `.kiro/` in the public source, provide the required write-up and ensure it agrees with files, history and demonstrated behavior. We do not claim organizer approval, completed human playtesting or guaranteed eligibility.
