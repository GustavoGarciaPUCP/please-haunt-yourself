# Implementation decisions for V3/R1

Prepared through Codex on November 5, 2026. These fill numerical details needed to implement the documented rules. They require verification in Kiro's technical design and the running build; they are not test results.

| Detail | Initial implementation choice | Reason |
| --- | --- | --- |
| Figure | Body and foot width 40; body height 100 model units | Height follows the existing frame-clearance example; width leaves readable contact and clearance margins |
| Horizontal transition reach | Total maximum 48 between physical support endpoints, including the 40-wide foot and any remaining correction | Preserves the documented proof; never add another footprint or snap allowance beyond 48 |
| Frame feet | Two contact pads, each 40 wide, on the lower corners; each needs at least 20 overlap with a flat support at the same height | Makes the minimum contact visible; preserves the documented 60/35/10 overlap examples |
| Initial fixed floor | x from -250 to 220, y=0 | Specifies a visible extent for the previously defined floor ending at 220; provides a broad rest surface |
| Initial figure position | Centre x=170, foot y=0 | Starts on fixed floor, independent of the frame |
| Frame home | Upright frame centred at x=-40 on the initial floor, fixed to its paper-wall anchor | Entire 340-wide frame remains supported and visible; its right edge 130 does not extend the initial floor |
| Gallery | x from 1120 to 1500, y=160 | Keeps the documented left edge and leaves room to fully step off the frame |
| Frame angle | Upright and unrotated | Existing controls move the rigid frame; they do not introduce a second rotation mechanic |
| Numerical comparison | Small model-space epsilon for floating-point equality; document its value in code | Robust contact comparisons must not introduce additional gameplay reach |
| Frame vertical placement | Preview the nearest flat support height within 30 model units of the tentative bottom; keep x unchanged and require both pad contacts | This is vertical object placement, separate from the figure's bounded horizontal contact reach; invalid previews do not commit |
| Frame keyboard steps | 10 model units per arrow press, Enter to commit, Escape to cancel | Makes the already specified keyboard alternative concrete |
| Trial button activation | Native focus order, Enter/Space on the focused Pause/Continue/Stop button | No additional global shortcut is required by the design |
| Initial language | Valid saved manual choice first; otherwise the primary browser language (`navigator.languages[0]`, falling back to `navigator.language`); Spanish for `es` prefixes, English otherwise | Retains the documented locale rule and a predictable manual override |
| Motion preference | Saved explicit override first; otherwise `prefers-reduced-motion: reduce`, with a safe standard-motion fallback if unavailable | Retains the documented system preference and manual control |

Retain all other V3/R1 constants exactly: C0=(400,100); local cutout vertices (0,0), (225,90), (375,90); projection scale 2; lamp y=220 with x in [500,740]; cutout angle in [0,90] degrees; frame 340×180 with border 10; slope limit 30 degrees; vertical step limit 20.

The new left extent and frame home do not extend the source edge beyond x=220. A home frame therefore cannot defeat the existing no-shadow-only bound. These decisions must still be tested with actual route logic, body dimensions and rendering.

The route algorithm must distinguish a small transition between supports from walking along a steep profile. Sampling a steep profile in small increments must not turn it into a sequence of permitted steps. A high one-way shadow profile does not block walking underneath it on the starting floor.

The figure stays at its safe starting point while the player manipulates the frame. It does not have to walk to the frame's home anchor before the player can move that object. Only the ending requires the documented physical collection after arrival on the fixed gallery.
