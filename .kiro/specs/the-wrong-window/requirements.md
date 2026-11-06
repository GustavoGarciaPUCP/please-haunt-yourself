# The Wrong Window / La ventana equivocada — Requirements

**Spec type:** Feature Spec (Requirements-First)
**Status:** Draft for review — no technical design, tasks or game code have been created yet.
**Author:** Kiro, from the V3/R1 design handoff.
**Date of this draft:** November 5, 2026.

> This document states what must be built. It is a requirement, not a claim that any
> behavior already exists. No game code, tests, build or publication has been performed at
> this stage. The planning dates inside the Spanish design sources are retained; this draft is
> Kiro's subsequent work and is dated above.

---

## 1. Purpose and scope

Build a complete, browser-based paper-theatre puzzle game for **Kiroween 2026**, in the
**Costume Contest** category, working title **La ventana equivocada / The Wrong Window**. The
final product must feel like an eerie paper-theatre workshop whose visual materials and
interactions make the puzzle understandable. Solo developer.

This requirements document covers the **full game** so that later milestones are not silently
dropped, but it marks a **first implementation milestone** (M1) whose acceptance criteria
validate the playable route, geometry and state rules. M1 is an intermediate step toward the
full experience, not the final scope.

Designation key for each requirement:

- **Check type** — `[S]` software-checkable by automated tests/properties;
  `[H]` requires observation with people; `[S+H]` has both a software component and a
  human-judgement component.
- **Sources** — `01-§N` = section N of `01_Experiencia_y_sistema.md`;
  `02-§N` = section N of `02_Geometria_y_revision_independiente.md`;
  `03-§N` = section N of `03_Requisitos_oficiales_y_cierre.md`;
  `impl-§` = `docs/development/implementation-decisions.md`;
  `vis-§` = `docs/development/visual-direction.md`.
- **Verification** — `N01`–`N12` = the validation items in `01-§8`.

---

## 2. Source authority

The current design is **V3/R1**. The three Spanish design documents are the authoritative
sources for experience, geometry and event rules:

- `01_Experiencia_y_sistema.md` — experience, rules, controls, states, N01–N12.
- `02_Geometria_y_revision_independiente.md` — authoritative geometric constants, valid
  configurations, counterexamples, and limits of the prior review.
- `03_Requisitos_oficiales_y_cierre.md` — event requirements as reviewed; check official
  sources when event facts matter.

Earlier recorded-gesture and tray ("Bandeja") mechanics are obsolete and **not** part of this
implementation. Where the design is silent or ambiguous, this document raises the issue
explicitly rather than inventing a new mechanic. (Sources: `AGENTS.md`, `01-§5`,
`02-§1`, `02-§2`.)

Numerical details not fixed in the Spanish design sources are filled by
`docs/development/implementation-decisions.md` (prepared through Codex on 2026-11-05). Those
choices require verification in Kiro's technical design and the running build; they are not
test results. They are cited per requirement in §4 and §8. Interface direction is
`docs/development/visual-direction.md` (same date, same provenance); it is an implementation
direction, not evidence of a tested interface.

Event facts (schedule, rules, delivery obligations) are taken from `03` as reviewed on
2026-10-30; official sources must be re-checked when those facts matter for submission.
Submission, publication, account changes and purchases are **out of scope** for this
authorization and require a separate reviewable decision. (Source: `03-§"Estado del evento"`,
`AGENTS.md`.)

---

## 3. Definitions

| Term | Meaning | Source |
| --- | --- | --- |
| Model coordinates | Internal coordinates with **y upward**; separate from screen/SVG coordinates. | `02-§3`, `AGENTS.md` |
| Cutout / template (plantilla) | Paper cutout on a pivot; its orientation, projected by light, produces the shadow. | `01-§3` |
| Lamp (lámpara) | Light source on a horizontal rail; moving it translates the shadow without rotating or scaling it. | `01-§3`, `02-§3` |
| Shadow (proyección) | The projected profile of the cutout; a walkable black surface that supports the figure from above. | `01-§2`, `01-§3` |
| Frame (marco) | A rigid, black, complete, always-recognizable physical object; known as an opening in a wall, but outside a wall it retains material and can act as a bridge. | `01-§3`, `02-§6` |
| Figure (figura) | The small body that must reach the fixed gallery; it does not jump. | `01-§3`, `02-§3` |
| Gallery (galería) | The fixed, visible high destination; **not** "any exit". | `01-§4`, `02-§6` |
| Footprint (huella) | The figure's contact width; included within the single total horizontal tolerance, not added separately. | `01-§3`, `02-§3`, `AGENTS.md` |
| Contact tolerance | Total horizontal reach at a contact, including footprint and any automatic correction; bounded by **48** model units, not additive. | `02-§3`, `AGENTS.md` |
| Step | A small ascending or descending height change the figure can traverse; max **20** model units. | `01-§3`, `02-§3`, `impl-§` |
| Figure body | Body and foot width **40** model units; body height **100** model units; initial centre x=170, foot y=0. | `impl-§` (cites `02-§4` height) |
| Frame pads | Two contact pads, each **40** wide, on the lower corners; each needs at least **20** overlap with a flat support at the same height. | `impl-§`, `02-§4` |
| Frame home | Upright frame centred at x=−40 on the initial floor, fixed to its paper-wall anchor; right edge 130 does not extend the floor edge. | `impl-§` |
| Initial floor | x from −250 to 220, y=0. | `impl-§` (extends `02-§3`) |
| Gallery extent | x from 1120 to 1500, y=160. | `impl-§` (extends `02-§3`) |
| Placement reach | Vertical frame placement previews the nearest flat support height within **30** model units; x unchanged; both pad contacts required. This is object placement, separate from the figure's bounded horizontal contact reach. | `impl-§` |
| Transaction | A confirmed change to lamp, cutout or frame validates the **full configuration**; an invalid confirmation restores the prior confirmed state entirely. | `01-§3`, `02-§5`, `AGENTS.md` |

---

## 4. Functional requirements

### 4.1 Projection model and geometry

**FR-G01 — Projection equation.** The shadow is computed, never selected from a
predrawn "correct" illustration. For each cutout vertex `vᵢ`, the projected point is
`Sᵢ = 2(C₀ + Rθ·vᵢ) − L`, with pivot `C₀ = (400, 100)`, local vertices
`v₀=(0,0), v₁=(225,90), v₂=(375,90)`, lamp `L=(Lₓ, 220)` on a rail with `Lₓ ∈ [500, 740]`,
and pivot rotation `θ ∈ [0°, 90°]`. Template and screen are on parallel fixed-depth planes
with projection factor 2. — Sources: `02-§3`. Verification: — (foundational, checked via FR-G02/FR-G04). Check type: `[S]`.

**FR-G02 — Lamp translates, never rotates or scales.** Changing `Lₓ` translates every
projected point by the same offset; it does not change orientation, scale, or tilt the
profile. Rotating the cutout (`Rθ`) changes the slopes of the same projection. — Sources:
`01-§3`, `02-§3`. Verification: **N01**. Check type: `[S]`.

**FR-G03 — Stage geometry.** Initial floor is at `y=0` from `x=−250` to `x=220`. The gallery
is at `y=160` from `x=1120` to `x=1500`. The figure (body and foot width 40, height 100) does
not jump. It follows upper profiles with slopes up to 30° and steps (up or down) up to 20
model units. The figure starts centred at x=170, foot y=0. — Sources: `02-§3`, `01-§3`,
`impl-§`. Verification: **N06**, **N12**. Check type: `[S]`.

**FR-G04 — Contact tolerance is a single bounded allowance.** The total horizontal reach
at any contact is at most **48** model units, **including** the 40-wide foot and any
remaining auto-correction/snap. Neither the footprint nor any correction may be counted a
second time; these are not separately additive allowances. The implementation must not add
any tolerance outside this 48. Frame vertical placement (nearest support within 30, x
unchanged) is object placement, separate from this figure contact reach. — Sources:
`02-§3`, `02-§5`, `impl-§`, `AGENTS.md`. Verification: **N12**. Check type: `[S]`.

**FR-G05 — Coordinate separation.** Model coordinates (y upward) are kept strictly separate
from screen/SVG coordinates. Conversion to SVG is explicit and isolated. Geometry and state
transitions are independent of rendering. — Sources: `02-§3`, `AGENTS.md`. Check type: `[S]`.

### 4.2 Cutout / template

**FR-C01 — Pivot arc with visible stops.** The cutout rotates on its pivot along a
mechanical arc with **visible stops at 0° and 90°**. The 0° end does not require hitting a
tiny angle. — Sources: `01-§3`, `02-§3`. Verification: **N01**. Check type: `[S]`.

**FR-C02 — Rotation changes slopes.** Rotating the cutout reorients the template and its
projection, changing the slopes of the shadow. — Sources: `01-§2`, `01-§3`, `02-§3`.
Verification: **N01**. Check type: `[S]`.

### 4.3 Lamp

**FR-L01 — Horizontal rail.** The lamp moves horizontally along its rail between `Lₓ=500`
and `Lₓ=740`. — Sources: `02-§3`, `01-§3`. Check type: `[S]`.

**FR-L02 — Translation only.** See FR-G02: moving the lamp translates the shadow; it does
not rotate or scale it. — Sources: `01-§3`, `02-§3`. Verification: **N01**. Check type: `[S]`.

### 4.4 Frame

**FR-F01 — Material and recognizable.** The frame is rigid, black, complete, and always
recognizable as a material object — not a mask that gains weight only at the end. It must
be seen whole and material before being reinterpreted as a bridge. — Sources: `01-§3`,
`02-§6`. Verification: **N04**, **N05**, **N10**. Check type: `[S+H]`.

**FR-F02 — Dimensions and pads.** Frame width 340, height 180, edge thickness 10. It has two
contact pads, each **40** wide, on the lower corners; each needs at least **20** overlap with
a flat support at the same height. Placed on `y=160`, its top walking surface is at `y=170`
(a step of 10, within the allowed 20). Interior height 160 fits a body of height 100. The
frame's home is upright and centred at x=−40 on the initial floor, fixed to its paper-wall
anchor; its right edge (130) does not extend the floor edge (220). — Sources: `02-§4`,
`impl-§`. Verification: **N05**, **N12**. Check type: `[S]`.

**FR-F03 — Both supports required; no levitation.** The frame must rest with both lower
pads on sufficient flat support at the same height. It cannot be suspended without support,
rest one pad on a ramp, or use a single point contact as a wide base. Vertical placement
previews the nearest flat support height within 30 model units (x unchanged); both pad
contacts are still required and invalid previews do not commit. A placement without
support returns the piece to its confirmed state (does not destroy it). The figure stays at
its safe starting point while the player manipulates the frame; it does not have to walk to
the frame's home anchor before the player can move that object. — Sources: `01-§3`,
`02-§4`, `02-§6`, `impl-§`. Verification: **N05**, **N11**. Check type: `[S]`.

**FR-F04 — Lateral passage through uprights.** The frame's uprights are traversed laterally
under the same general support-from-above rule. No special exception is invented to enter
the gap. The edge has visible thickness, a small allowed step, and sufficient interior space
for the figure. — Sources: `01-§3`, `02-§6`. Verification: **N04**. Check type: `[S]`.

**FR-F05 — Visible contacts.** The frame's skates/contacts are visible from the first
manipulation. Vertical settlement on supports is previewed with a wide placement tolerance
(not pixel-precise). Settlement does not horizontally align the piece, nor correct lamp or
template. — Sources: `01-§3`. Verification: **N05**. Check type: `[S+H]`.

**FR-F06 — Destination is fixed.** Moving the frame does not transport the gallery. The
opening shows local context, not a photograph or portal to a remote fixed destination.
Placing an opening beside the figure does not take it to the gallery. — Sources: `01-§3`,
`01-§4`, `02-§6`. Verification: **N06**. Check type: `[S]`.

### 4.5 Transactions and configuration integrity

**FR-T01 — Full-configuration transaction.** Each confirmed change to lamp, cutout or frame
is a transaction over the full configuration. A confirmation that invalidates any support
(including the frame's) is rejected and the entire prior confirmed configuration is restored.
No suspended/partially-supported state is saved or rehearsed. — Sources: `01-§3`, `02-§5`,
`AGENTS.md`. Verification: **N11**. Check type: `[S]`.

**FR-T02 — Provisional loss is visible but not committed.** During adjustment, a lost
support may be shown provisionally with the lost contact signaled, but it is not committed.
To make a broad change, the frame may first be withdrawn to its anchor or to an available
broad surface; Undo remains accessible. — Sources: `01-§3`, `02-§5`. Verification: **N11**.
Check type: `[S]`.

### 4.6 Stage, solutions and the need to combine

**FR-S01 — Stage layout.** The starting ground ends before the high gallery. The shadow can
form a ramp and a plateau, but combinations connecting to the ground do not alone reach the
gallery. The frame is not wide enough to bridge the entire gap alone. — Sources: `01-§4`,
`02-§5`. Verification: **N03**. Check type: `[S]`.

**FR-S02 — Shadow alone is insufficient (bound).** For any `θ ∈ [0°, 90°]`, the shadow's
total horizontal width is at most 750. Even granting 48 at each end (start and destination),
maximum reach is 1066, still less than the 1120 gallery start — a margin of 54. The 20-unit
step does not widen the horizontal span. The implementation must not add a tolerance outside
the 48. — Sources: `02-§5`. Verification: **N03**, **N12**. Check type: `[S]`.

**FR-S03 — Frame alone is insufficient.** Frame width 340; even with 48 at each end,
340 + 96 < 900 separation. It needs flat supports at the same height and cannot float one
end over a ramp. The shadow provides the intermediate support that makes the frame useful.
— Sources: `02-§5`. Verification: **N03**. Check type: `[S]`.

**FR-S04 — Two valid configurations with margin.** The following two configurations produce a
complete path; both must work with the real body and contact widths:

| Config | Lamp `Lₓ` | Cutout `θ` | Frame center | Ramp touches ground | Plateau | Frame span | Contact (shadow / gallery) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 650 | 0° | 1010 | x=200 | 600–900 | 840–1180 | 60 / 60 |
| B | 700 | 0° | 985 | x=150 | 550–850 | 815–1155 | 35 / 35 |

— Sources: `02-§4`. Verification: **N02**. Check type: `[S]`.

**FR-S05 — Distinct failures.** The following produce different, understandable problems (not
the same generic "wrong"):

| Config | Result |
| --- | --- |
| `θ=90°, Lₓ=500` | High vertical profile; no walkable path to the gallery. |
| `θ=0°, Lₓ=500` | Shadow starts at x=300, reaches y=0 at 350; gap of 80 from ground edge 220, not bridged even with 48 reach. |
| `θ=0°, Lₓ=740`, frame at 970 | Plateau 510–810; frame 800–1140 has only 10 left contact — insufficient support, though slope works. |

— Sources: `02-§4`. Verification: **N02**, **N10**. Check type: `[S+H]`.

**FR-S06 — No forced order.** The player may approach the frame, lamp or cutout first. No
forced order of adjustments and no requirement to pass through erroneous configurations to
unlock the solution. — Sources: `01-§2`, `01-§4`. Verification: **N02**. Check type: `[S+H]`.

### 4.7 Support-from-above rule

**FR-R01 — Support from above, uniformly.** Black stage profiles support from above; their
side faces do not trap or prevent passage (not solid walls). Walkable slopes ≤ 30°; no
jumping; steps ≤ 20. The rule applies uniformly to shadow, stage traces and the frame, and
allows predicting lateral passage past uprights. — Sources: `01-§3`, `02-§6`. Verification:
**N04**. Check type: `[S]`.

**FR-R02 — No "solid wall" language for vertical shadows.** A vertical shadow is inadequate
as support toward the gallery but does not enclose the figure. — Sources: `01-§3`.
Verification: **N04**, **N10**. Check type: `[S+H]`.

### 4.8 Controls

**FR-K01 — Mouse / drag and click alternatives.** Lamp: drag the carriage or click on the
rail. Cutout: drag the handle along the arc or choose a point on the arc. Frame: drag, or
activate Place then confirm with another click (preview and Cancel available). — Sources:
`01-§5`. Verification: **N09**. Check type: `[S+H]`.

**FR-K02 — Keyboard equivalents.** Lamp: arrows in 10-unit steps; Home/End for stops.
Cutout: arrows in 5° steps; Home/End for stops. Frame: move with arrows in 10-unit steps,
confirm with Enter, cancel with Escape. Trial: Pause/Continue/Stop via native focus order and
Enter/Space on the focused button (no extra global shortcut required). Mouse, click-based
and keyboard actions must offer equivalent decisions. — Sources: `01-§5`, `impl-§`,
`AGENTS.md`. Verification: **N09**. Check type: `[S+H]`.

**FR-K03 — No solved placement or correct-answer indicator.** The preview shows changes of
form, position and contact, without a "correct combination" traffic light, without a
silhouette of the frame in the solved place, and without coordinates or formulas in the
product. No correct configuration, pre-solved placement or automatic hints in normal play.
— Sources: `01-§5`, `AGENTS.md`. Verification: **N02**, **N09**. Check type: `[S]`.

**FR-K04 — Low trial cost.** The cost of testing a route must be small (quick to attempt).
— Sources: `01-§5`. Verification: — . Check type: `[H]`.

### 4.9 Game cycle and states

**FR-E01 — Cover / preferences.** The cover presents the objective and allows choosing
language, sound and motion. Initial language: a valid saved manual choice first; otherwise
the primary browser language (`navigator.languages[0]`, falling back to `navigator.language`);
Spanish for `es` prefixes, English otherwise. Sound is initially off; modifiable. Motion: a
saved explicit override first; otherwise `prefers-reduced-motion: reduce`, with a safe
standard-motion fallback; modifiable. An explicit action enters the workshop; no solution is
played while choosing preferences. No automatic solution on the cover. — Sources: `01-§6`,
`01-§7`, `impl-§`. Check type: `[S+H]`.

**FR-E02 — Intro performance (skippable).** A brief performance shows the figure recognizing
the high access and contacting a local support. It does not move the lamp, rotate the
cutout or build the bridge automatically. It can be skipped; objective and controls remain
available. *(Deferred beyond M1; preserved for later milestones.)* — Sources: `01-§6`.
Check type: `[H]`.

**FR-E03 — Prepare (editing).** The figure waits on its fixed ground. Changes to light,
cutout and frame have immediate visual response. There is no advancing threat, falling or
countdown. In editing, the figure is not pushed by a changing shadow; it is a configuration
trial, not a continuous dynamic simulation on its body. — Sources: `01-§6`, `02-§6`.
Verification: **N07**. Check type: `[S]`.

**FR-E04 — Test (trial).** On request, the configuration is locked and the figure attempts to
traverse the supports. The light cannot be removed and the ground cannot be moved during the
crossing. A discontinuity, excessive slope or insufficient support is expressed **where it
occurs** (local feedback); the figure stops safely and returns to the start, preserving the
configuration. Failure does not reset the mechanisms or record "understanding". — Sources:
`01-§6`. Verification: **N02**, **N07**. Check type: `[S+H]`.

**FR-E05 — Review (hints, on request only).** Hints are requested, not automatic by time.
First they describe the observable problem; then relate causes; an explicit solution is
announced before it is revealed. *(Deferred beyond M1; preserved for later milestones.)*
— Sources: `01-§6`. Check type: `[H]`.

**FR-E06 — Finish / arrival confirmation.** Arrival is confirmed only when the figure's
entire footprint is on the fixed gallery **and** it has left the frame's right edge behind.
Its support cannot depend on the piece it is about to lift. Then it turns, takes the frame
from the reached side and carries it away — removing the bridge, not pretending to close a
second wall. The final is saved before the collection is represented; reload recovers the
final result, not a figure mid-support. — Sources: `01-§6`, `01-§7`, `03-§"Cierres de la
auditoría final"` item 3. Verification: **N12**. Check type: `[S]`.

### 4.10 State recovery

**FR-U01 — State table.** The game defines the states in `01-§7`: Cover, Editing, Tentative
manipulation, Trial/pause, Failed result, Confirmed arrival, Final. Each has defined behavior
per `01-§7`. — Sources: `01-§7`. Check type: `[S]`.

**FR-U02 — Cancel / focus loss.** Cancel, or a confirmation that invalidates supports,
restores the full previous configuration. Changing area, losing focus or opening another
panel cancels the provisional change first. — Sources: `01-§7`. Verification: **N08**.
Check type: `[S]`.

**FR-U03 — Trial lock and safe stop.** During a trial the configuration is locked; pause or
closing Help does not auto-resume. Stopping before arriving returns to start without altering
the plan. Resuming an interrupted trial returns to Editing with its stable configuration.
— Sources: `01-§7`. Verification: **N07**, **N08**. Check type: `[S]`.

**FR-U04 — Failed result.** A failed trial gives a readable consequence and returns to
Editing; no loss of objects. — Sources: `01-§7`. Verification: **N08**. Check type: `[S+H]`.

**FR-U05 — Undo.** Undo covers the last 20 confirmed editing operations. It preserves
access settings and comfortable view arrangement; it does not save images. An invalid
adjustment does not consume history. — Sources: `01-§7`. Verification: **N08**. Check type:
`[S]`.

**FR-U06 — Versioned local record.** The local save is versioned and stores: confirmed
parameters, frame position/support, bounded history, preferences, introduction attended,
plan prior to the final trial, and termination state. The full configuration and each
history point are validated before allowing restore. No drags, animations or partial trials
are saved. An illegible record offers a safe new game and never duplicates objects. —
Sources: `01-§7`. Verification: **N08**. Check type: `[S]`.

**FR-U07 — Review and restart.** Review restores the configuration prior to the successful
trial and allows repeating it; the achievement of having finished is preserved until a new
game. Restart asks for confirmation and preserves preferences. In the final, the frame is
held by the figure's hand and does not also appear as a bridge; Review recovers the single
frame of the previous plan. — Sources: `01-§7`. Verification: **N08**. Check type: `[S]`.

### 4.11 Teaching and narrative (full game, deferred beyond M1)

**FR-N01 — Three related understandings.** The puzzle is built on three related
understandings, not three buttons to count: (1) the black shape is the projection of the
visible cutout — understanding a cause; (2) separating form and position — a translated
vertical shape gives no walkable slope, while orientation changes slopes and the lamp
decides where the form falls; (3) reinterpreting the frame as a material support that can
complete the final gap. These combine into a plan; they do not require witnessing specific
failures and are not recorded via "understood" flags. — Sources: `01-§2`. Verification:
**N10**. Check type: `[H]`.

**FR-N02 — Early local contact teaches the support rule.** The support-from-above rule is
shown through an early local contact with a small trace, including lateral passage — not by
demonstrating the full ramp or the frame-bridge. — Sources: `01-§3`. Verification: **N04**,
**N10**. Check type: `[H]`.

**FR-N03 — No "monster was good" twist.** The initially unsettling high projection is not
described as an enemy that pursues; there is no late "the monster was good" reversal. The
unsettling is turned into part of the path without erasing it. — Sources: `01-§1`, `01-§6`.
Check type: `[H]`.

**FR-N04 — Ending retains the means to create other steps.** On finishing, the shadow
continues to exist behind; the figure keeps a means to create other steps. — Sources:
`01-§6`. Check type: `[H]`.

### 4.12 Accessibility (full game, applies from M1 where noted)

**FR-A01 — Sound off by default; modifiable.** Sound is initially off and modifiable.
— Sources: `01-§6`. Verification: **N09**. Check type: `[S]`.

**FR-A02 — Reduced motion.** Reduced motion follows the system preference and is modifiable.
— Sources: `01-§6`. Verification: **N09**. Check type: `[S]`.

**FR-A03 — Equivalent input modalities.** Mouse/click and keyboard must offer the same
decisions and preserve meaning. (Restates FR-K01/FR-K02 under accessibility.) — Sources:
`01-§5`, `AGENTS.md`. Verification: **N09**. Check type: `[S+H]`.

**FR-A04 — Bilingual text.** Game text is provided in English and Spanish. Source and
submission documents are in English. — Sources: `AGENTS.md`, `03-§"Lista operativa de
entrega"`. Check type: `[S]`.

---

## 5. Non-functional requirements

**NF-01 — Stack.** TypeScript, Vite, and SVG/HTML/CSS. A change requires a concrete verified
reason, explained before adopting it. — Sources: `AGENTS.md`, `04-§4`. Check type: `[S]`.

**NF-02 — Rendering independence.** Geometry and state transitions are independent of
rendering. SVG is used for explicit geometry of cutout, frame and shadows; HTML for controls
and keyboard alternatives. — Sources: `AGENTS.md`, `04-§4`. Check type: `[S]`.

**NF-03 — Small dependencies.** Keep dependencies small. Prefer well-known, actively
maintained packages; use exact/pinned versions. — Sources: `AGENTS.md`, `04-§4`. Check type:
`[S]`.

**NF-04 — Meaningful tests.** Tests must be meaningful: validate the documented
counterexamples, boundary cases and recovery properties. Human playtesting is a separate
requirement and cannot be replaced by an agent. — Sources: `AGENTS.md`, `02-§7`, `03-§
"Primeras comprobaciones cuando se construya"`. Check type: `[S+H]`.

**NF-05 — No fabricated evidence.** Do not fabricate tool sessions, test results, user
research, usage statistics or prize claims. Distinguish planning, implemented behavior,
automated checks and human observation. — Sources: `AGENTS.md`, `03-§"Cierres de la
auditoría final"`. Check type: `[S]`.

---

## 6. First milestone (M1) — playable route validation

M1 validates the geometry and state rules with a playable route. It is an intermediate
milestone toward the full experience. The following acceptance criteria define M1; each
links to the requirements and verification items above.

### M1 acceptance criteria

**M1-01 — Lamp translates; cutout rotates.** Moving the lamp translates the shadow without
rotating or scaling it; rotating the cutout changes the shadow's orientation/slopes.
→ FR-G02, FR-L02, FR-C02. Verification: **N01**. Check: `[S]`.

**M1-02 — Two valid configurations work with the real body.** Both documented configurations
(A: `Lₓ=650`, `θ=0°`, frame center 1010; B: `Lₓ=700`, `θ=0°`, frame center 985) produce a
complete crossing using the real body and contact widths, avoiding pixel precision.
→ FR-S04. Verification: **N02**. Check: `[S]`.

**M1-03 — Distinct failures give understandable local feedback.** The documented failure
examples (`θ=90°`; `Lₓ=500` initial gap; `Lₓ=740` insufficient left contact) produce
different, understandable local feedback where the problem occurs.
→ FR-S05, FR-E04. Verification: **N02**. Check: `[S+H]`.

**M1-04 — Neither shadow nor frame alone bypasses the combination.** The shadow-alone bound
(width ≤ 750, total reach ≤ 1066 < 1120) and the frame-alone insufficiency (340 + 96 < 900)
are both enforced. The checks include the documented 20-unit step, the footprint and the
total horizontal-contact tolerance of 48 (not additive).
→ FR-S02, FR-S03, FR-G04. Verification: **N03**, **N12**. Check: `[S]`.

**M1-05 — Frame requires both supports; invalid edit is a full transaction.** The frame
requires both lower ends on sufficient flat support. An edit (lamp or cutout change) that
invalidates a placed frame rejects the entire tentative configuration and restores the prior
confirmed state. No levitation is confirmable.
→ FR-F03, FR-T01, FR-T02. Verification: **N05**, **N11**. Check: `[S]`.

**M1-06 — Figure waits during editing; trial locks the configuration.** In editing the
figure is not pushed by a changing shadow. A route trial locks the configuration. Failed
trials stop safely and return to the start, preserving the configuration.
→ FR-E03, FR-E04, FR-U03. Verification: **N07**. Check: `[S]`.

**M1-07 — Cancel, undo, reload and review preserve valid states and one frame.** These
operations preserve a single frame and a safe state. Arrival is confirmed only after the
figure has fully left the frame and stands on the fixed gallery.
→ FR-U01–FR-U07, FR-E06. Verification: **N08**, **N12**. Check: `[S]`.

**M1-08 — Equivalent controls; no solved display.** Mouse, click-based and keyboard controls
support the same decisions. No solved placement or correct-answer indicator is shown.
→ FR-K01, FR-K02, FR-K03. Verification: **N09**. Check: `[S+H]`.

### M1 scope boundary (explicitly preserved for later, not removed)

The following are **part of the full game** and are preserved for later milestones; they are
not M1 acceptance criteria and must not be silently dropped from the plan:

- The intro performance and its skippability (FR-E02).
- The requested hint system with its staged reveal (FR-E05).
- The full teaching sequence and the early local-contact demonstration (FR-N01, FR-N02).
- The narrative constraints — no pursuing enemy, no "monster was good" twist, the unsettling
  becoming part of the path (FR-N03, FR-N04).
- Final art, sound design and presentation materials (`03`, `04-§5`).
- Event submission obligations: public repo, license, URL, video, description, Kiro-usage
  evidence — all out of scope for this development authorization (`03`, `AGENTS.md`).

---

## 7. Check-type classification summary

### Software-checkable `[S]` — automatable tests/properties

N01 (lamp/cutout projection), N03 (neither element alone suffices), N04 (support-from-above
uniform rule), N05 (frame contacts visible/permanent/same criteria), N06 (no jump/teleport),
N07 (figure waits, trial locks), N08 (cancel/undo/reload/review integrity), N11 (no
levitation, full rejection), N12 (step/footprint/48 tolerance, arrival condition). Also:
FR-G01–FR-G05, FR-C01–FR-C02, FR-L01–FR-L02, FR-F02–FR-F04, FR-F06, FR-T01–FR-T02, FR-S01–FR-S04,
FR-R01, FR-E03, FR-E06, FR-U01–FR-U07, FR-A01, FR-A04, all NF items.

### Human-observation `[H]` / `[S+H]` — require people

N02 partially (the "understandable" quality of distinct failures), N09 partially (meaning
preserved across modalities), N10 entirely (people without explanation distinguishing slope,
contact and length errors, and reinterpreting the frame without a shown solution). Also:
FR-F01, FR-F05, FR-S05 (understandability), FR-S06, FR-R02, FR-E01 (preference clarity),
FR-E02, FR-E04 (local feedback legibility), FR-E05, FR-N01–FR-N04, FR-A03, FR-K04, NF-04
(human playtesting).

Per `02-§7` and `03-§"Primeras comprobaciones cuando se construya"`, an agent describing the
correct result does **not** substitute for any human observation, and agents do not count as
participants.

---

## 8. Open issues, contradictions and missing decisions

The design is internally consistent after the R1 corrections. The following are open
decisions or gaps that must be resolved during technical design/implementation — **not** by
inventing new mechanics.

### 8.1 Resolved numeric decisions (from `impl-§`)

The following were gaps in the Spanish design sources; they are now filled by
`docs/development/implementation-decisions.md` (prepared through Codex, 2026-11-05). They
require verification in the technical design and running build; they are not test results.

**O-01 — Figure body width (footprint) — RESOLVED.** Body and foot width **40** model units;
body height **100** (height follows `02-§4` frame clearance; width leaves readable contact
and clearance margins). The 48 contact reach includes this 40-wide foot plus any remaining
correction — never a second footprint or snap. Cited: `impl-§`; incorporated in FR-G03,
FR-G04, FR-F02.

**O-02 — Frame anchor / broad-surface geometry — RESOLVED.** Frame home is upright, centred
at x=−40 on the initial floor (x from −250 to 220), fixed to its paper-wall anchor; its right
edge 130 does not extend the floor edge 220. Direct manipulation happens while the figure
waits at its safe start (x=170); the figure does **not** have to walk to the home anchor to
move the frame. The home frame remains fully supported and visible. Cited: `impl-§`;
incorporated in FR-F02, FR-F03. (The earlier draft's suggestion that the figure must be able
to reach the anchor is removed — it conflicts with the editing model where the figure waits.)

**O-03 — Placement tolerance magnitude — RESOLVED.** Frame vertical placement previews the
nearest flat support height within 30 model units (x unchanged, both pad contacts still
required). This is object placement, separate from the figure's bounded horizontal contact
reach of 48; invalid previews do not commit. Cited: `impl-§`; incorporated in FR-G04, FR-F03.

### 8.2 Resolved interaction details (from `impl-§`)

**O-04 — Trial keyboard shortcuts — RESOLVED.** Trial controls use native focus order and
Enter/Space on the focused Pause/Continue/Stop button; no additional global shortcut is
required by the design. Cited: `impl-§`; incorporated in FR-K02.

**O-05 — Language detection method — RESOLVED.** A valid saved manual choice takes
precedence; otherwise the primary browser language (`navigator.languages[0]`, falling back
to `navigator.language`); Spanish for `es` prefixes, English otherwise. Cited: `impl-§`;
incorporated in FR-E01.

**O-06 — Reduced-motion detection — RESOLVED.** A saved explicit override takes precedence;
otherwise `prefers-reduced-motion: reduce`, with a safe standard-motion fallback if
unavailable. Cited: `impl-§`; incorporated in FR-E01.

### 8.3 Deferred narrative/teaching details (not contradictions)

**O-07 — Intro choreography.** The brief intro performance (`01-§6`) is described in intent
but not in exact choreography or timing. Deferred beyond M1 (FR-E02).

**O-08 — Hint content.** The staged hint reveal (`01-§6`) describes the structure but not the
specific text per situation. Deferred beyond M1 (FR-E05).

### 8.4 Event facts to re-verify (not design contradictions)

**O-09 — Official schedule and rules may change.** Event dates and rules in `03` were
reviewed on 2026-10-30. Per `AGENTS.md`, official sources must be re-checked when event facts
matter for submission. Not a design contradiction; a process reminder.

### 8.5 No contradictions found within V3/R1

The V2-era issues (shortcut without frame, frame levitation after light change, collection
while still supported) were explicitly corrected in R1 (`02-§5` regression section, `03-§
"Cierres de la auditoría final"`). No further material contradiction between `01`, `02` and
`03` was found. If implementation reveals one, it will be raised with a concrete reference
rather than patched with a new mechanic, per `AGENTS.md`.

---

## 9. References

- `docs/diseno/01_Experiencia_y_sistema.md` — experience, rules, controls, states, N01–N12.
- `docs/diseno/02_Geometria_y_revision_independiente.md` — geometric constants, solutions,
  counterexamples, review limits.
- `docs/diseno/03_Requisitos_oficiales_y_cierre.md` — event requirements and audit closures.
- `docs/diseno/04_Preparacion_e_instalacion.md` — setup and submission checklist.
- `docs/development/implementation-decisions.md` — numerical implementation choices for V3/R1
  (prepared through Codex, 2026-11-05).
- `docs/development/visual-direction.md` — interface direction for the first playable build
  (prepared through Codex, 2026-11-05).
- `AGENTS.md` — project instructions (workspace rule).
