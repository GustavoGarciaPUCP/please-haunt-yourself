# Visual direction · first playable build

Prepared through Codex on November 5, 2026, using the frontend-design guidance and the existing V3/R1 brief. This is an implementation direction, not evidence of a tested interface.

## Plan

The memorable element is the paper stage: a threatening silhouette becomes a useful physical path when the player changes its causes. Give that transformation most of the screen and keep surrounding interface controls quiet.

### Materials and colour

| Token | Value | Role |
| --- | --- | --- |
| Night plum | `#241C2B` | Surrounding workshop and depth |
| Walnut | `#49362E` | Worktable, rails and mechanisms |
| Paper | `#E6DABF` | Stage, paper objects and readable notes |
| Ink | `#201A1B` | Actual support profiles, cutout and frame |
| Brass | `#D9AF59` | Lamp, focus accents and actionable handles |
| Patina | `#82ADA0` | Secondary controls and feedback accents |

Use contrast-tested text combinations. Contact feedback must also use shape and text, not colour alone. Paper texture belongs on materials and should not reduce text legibility.

### Typography

Use Georgia for the title and Vera's short note, with Segoe UI/system sans-serif for controls and instructions. Keep a clear hierarchy and sentence case. These system fonts need no external font request; reassess only after a working visual review.

### Layout

One workshop contains a dominant stage and a compact mechanisms area. The lamp is a cart on a rail, rotation has a visible pivot and arc, and the frame stays recognisably material. The control names should remain consistent across mouse, click and keyboard alternatives.

```text
Title                                      Language / sound / motion
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│          Paper stage: figure, source floor, shadow, gallery       │
│          The complete frame remains visible and graspable       │
│                                                                 │
├───────────────────────────┬─────────────────────────────────────┤
│ Lamp rail / cutout pivot  │ Short feedback / Try route / Undo   │
└───────────────────────────┴─────────────────────────────────────┘
```

Treat this as a composition, not a fixed pixel layout. The browser viewport must not change the physical rules. Test small screens with legible objects and comfortable controls before claiming mobile support.

### Motion and feedback

Motion follows an action: the lamp changes the projection, a dragged frame exposes its contacts, and a route trial shows the figure testing the plan. Respect reduced motion. Start sound off. Localised feedback describes a missing contact or an unsuitable path without displaying the solved configuration.

## Critique and revision before building

A layout with three equal cards and numeric sliders would hide the material relationship that makes this project distinctive. Replace it with one stage and visible source mechanisms. A generic Halloween layer of ghosts, bats and flashing effects would compete with the actual mystery; invest the visual emphasis in the silhouette and paper materials already specified.

The palette and serif type are justified by a paper-theatre workshop, with night plum and brass tied to its lighting. Avoid warm-clay branding and decorative gradients unrelated to the lamp. All artwork in the first build can be original SVG and CSS, with no external asset dependency.

## Visual review criteria

- The lamp, pivot and frame are identifiable before instructions name them.
- A contact that looks supported agrees with the model's accepted contact.
- Failure feedback gives a next observation, not a hidden success score.
- Keyboard focus stays visible on every action, including stage controls.
- The initial composition communicates a fixed destination and an incomplete route.
- The final experience retains the documented arrival and frame recovery, with no premature celebration.
