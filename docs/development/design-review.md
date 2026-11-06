# Technical design review · November 5, 2026

Reviewed through Codex against V3/R1 and the generated requirements. The architecture and milestone order are accepted with these implementation corrections. This is a review, not a completed product test.

## Required corrections

1. **Projection sign.** In design §3.2, increasing lamp x by d moves every shadow vertex by **(-d, 0)**, from `S = 2(C0 + Rv) - L`. The current positive-offset wording is incorrect. Add a signed translation test in addition to distance/orientation invariance.

2. **Return an actual route.** `tryRoute` must return waypoints/support ownership and, for failure, the safely reachable prefix plus a local reason. A boolean is insufficient to animate a figure testing the constructed path. Render the computed path, not a separate fabricated straight-line animation.

3. **Resolve overlaps explicitly.** A source floor can overlap a shadow ramp. Evaluate transitions at actual overlapping positions using the height of each segment at that position, not the segments' unrelated start/end heights. Include the figure's initial x and segment intersections among transition candidates. Avoid taking a globally high profile that the figure cannot reach.

4. **Make traversal deterministic.** Use a finite graph or equivalent explicit interval method over actual segments and legal transitions. For overlapping segments, include interval boundaries and the critical positions where their height difference is 0 or ±20, as well as start/arrival positions. Walk forward along genuinely walkable segments and allow bounded transitions between supports. A sampled vertical delta is not a replacement for a continuous-segment slope check. Preserve a single total horizontal reach of 48, with no separately added foot reach.

5. **Include the structural members consistently.** The frame's bottom and top members are one-way supports. Its uprights do not become walls. Although the top member is unreachable in the known successful examples, it should not be omitted by a special-case assumption.

6. **Keep one frame state.** Persist the canonical configuration plus final/review metadata. Do not maintain a second mutable copy of frame position or trust a stored `supported` boolean. Derive support by validation and ownership from the current phase. Saving a final result and reviewing its pre-trial plan must not duplicate the frame.

7. **Separate I/O from pure state.** The save encoder/decoder and validation functions can be pure; the localStorage adapter is I/O and belongs at the application boundary. Handle unavailable or malformed storage without breaking play.

8. **Preserve focus and active manipulation.** Updating the scene during an arrow press or pointer movement must not replace the focused control or the element holding pointer capture. Verify consecutive arrow presses without refocusing. Loss of focus cancels tentative edits; ordinary scene rendering must not create artificial focus loss.

## Verification needed in the build

- Both documented successful configurations yield actual route waypoints with a 40-wide body and final support on the gallery.
- Steep profiles stay unwalkable even at very small sampling intervals.
- A high profile does not prevent movement on the initial floor underneath it.
- Frame contacts of 35 remain valid and contacts of 10 remain invalid; moving their support rejects the entire edit.
- The two no-frame/no-shadow impossibility cases arise from geometry, not preset success tests.
- The visible body movement, local failure point and accessible controls agree with the pure model.
