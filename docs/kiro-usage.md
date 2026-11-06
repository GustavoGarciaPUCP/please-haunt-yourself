# How Kiro is being used

This is a factual development record, updated on November 5, 2026. Planned work is not counted as completed work.

## Starting material and tool roles

The V3/R1 concept, Spanish design references and initial handoff existed before the first Kiro task. Their original planning dates are retained. They were developed through discussion and review in Codex, not by Kiro.

Codex coordinates local files, reviews outputs, makes implementation decisions and verifies results. Kiro CLI 3.1.0 is authenticated through the participant's Google account and works on this same local project. Desktop automation is outside the participant's chosen workflow.

## Executed work

| Task | Kiro contribution | Review and status |
| --- | --- | --- |
| Requirements-first specification | Read the V3/R1 references and generated `.kiro/specs/the-wrong-window/requirements.md` in English, including source references, N01–N12 and separate software/human checks | Codex reviewed the draft against the source. The draft raised useful implementation gaps: body width, home geometry and placement tolerance |
| Requirements corrections | Applied review changes using `docs/development/implementation-decisions.md`, whose decisions were prepared through Codex | Corrections are present. Technical design and task planning are in progress; they are not yet accepted as implemented behavior |

The first run could create the draft but some formatting repairs failed because the caller's non-interactive tool allowance omitted the required edit operation. A follow-up corrected the allowance and the repairs executed. This was an orchestration issue, not a participant rejection or a product test result.

## Evidence and limits

The specification files are retained under `.kiro/` and will remain tracked. Raw local CLI event streams are kept outside the repository; this public-facing record does not publish private model reasoning or authentication data.

No automated product test, human playtest, working build, publication or prize result is claimed by this entry. Those results will be added only after execution and review. The account's exact remaining credit balance has not been independently verified.
