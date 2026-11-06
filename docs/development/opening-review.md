# Opening review

Codex review of the first Kiro implementation, November 5, 2026. This records observed discrepancies, not a claim that passing tests establish UX quality.

1. Reduced motion currently shares the normal elapsed-time completion branch. It must remain on the still contact pose until explicit continuation; changing preferences must not leave it at the starting pose or auto-complete it.
2. Opening Help currently leaves the opening clock running behind the dialog. Finish safely before opening Help, retain the construction and do not start a route when Help closes.
3. Skipping/natural completion hides the active button without moving focus. Transfer focus once to the first useful enabled mechanism after rendering, including automatic normal-motion completion.
4. The local path currently puts the figure at x110/y0 before it steps up. At that point the frame's rail is already under its feet. Lift at the approach to the rail, then traverse its side at rail-top height. Use existing geometry for the contact pose and return safely. Do not move a mechanism or show a bridge solution.

Browser checks should wait beyond the normal demonstration duration to distinguish a true reduced-motion hold from a fast click that merely beats an automatic timer. Also check Help interruption and unchanged construction/history. Prefer a few tests of physical/persistence behavior over tests that only repeat waypoint literals.

Kiro applied corrections to these findings in a follow-up file-editing task. Independent verification found two remaining problems: the static pose at zero elapsed time and a browser test selecting a descendant that did not exist. Codex corrected both, made the two continuation controls mutually visible, and confirmed 35 passing unit/property tests and 9 passing browser checks. A screenshot then showed the opening text covering the figure's feet; it was moved above the action and rechecked.

The physical contact is performed with the existing home frame, rather than a new small stroke. It introduces the frame locally without demonstrating its use as a bridge. This implementation choice still needs observation with people; software checks do not establish that its teaching is effective.
