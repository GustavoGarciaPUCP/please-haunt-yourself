# Visual precision and QA of the v5 route (v6) — requirements

Kiro IDE session, November 9, 2026. Brief: `Kiro brief 06`, based on Codex's `docs/development/27_V5_QA_Flow_And_Canvas_Text_Review.md`. This iteration repairs drawn-image layout and wording inside v5. It keeps the four programs, the story of contract 23, v5's design and flow, and every earlier data contract (`.kiro/specs/os-case-v4/`, `.kiro/specs/playability-v5/`). Positions on Codex's proposals are in `design-review.md`.

## 1. Baseline reproduced before any change

`scripts/v6-baseline.mjs` ran on the v5 build (`haunt-DuQWST70.js`, About "build v5") with real pointer and keyboard input; no case state was injected. It records every canvas text call, replays each one alone through Chrome's rasterizer with the fonts actually loaded, and compares the ink with the paper it is written on, as found in the canvas pixels (`scripts/drawn-text-audit.mjs`). Results are in `output/playwright/v6-baseline.json`, screenshots and crops in `output/playwright/v6-baseline/`.

| # | Finding | Reproduced result |
| --- | --- | --- |
| A | The note's words leave the paper (review 27, defect 1) | At every size and both DPRs, in Live, maximized, minimum, paused, the kept capture (list thumbnail, negative, picture) and in a letter made from it: both `FOR THE NEXT PER—` and `— Mara, 31 Oct 1987` have ink outside the paper. Example, 1366×768 Live: 101 of 580 ink pixels of the fragment and 57 of 281 of the signature are off the paper, up to 33 px past its edge. With the fallback fonts simulated (no Segoe Print → Ink Free; no hand font → generic cursive) the overflow remains. |
| B | The LIVE/PAUSED badge covers the session's header (defect 2) | At every size the badge lies on `last.session — recorded 23:59 [3087]` (29–58 of the sampled ink points of the header are under it). |
| C | `No writing` beside a written note (wording) | Live chips: "The figure, repeating", "No writing", "No handprint". The capture verdict: "It holds no writing and no handprint." After the milestone: "Empty window" and "The window is empty", while the note is still drawn. A letter made from that capture: CANVAS says "no handprint, figure or writing" (the figure is visible before the milestone). POSTMAN and TERMINAL say "the picture shows only mist", which is false for a session window. |
| D | Found by the new check: the paused ghost line covers the note | "You stopped the picture. Not the call." is written over the note's signature at the default and minimum sizes (3–5 covered points). |
| E | Found by the new check: viewfinder marks and labels on the header | At ECHO's minimum the top-left corner mark crosses `last.session`. In Captures, the frame editor's "Picture" label covers the header of a session negative. |
| F | Found by the new DOM rule: the capture editor draws the negative over its own chips and caption | The negative view is sized with a fixed 1.9 aspect while its real aspect is 1.6 (session) or the stage's (1.69 at 1440×900). It overflows its place by 50–86 px and covers "In the picture" chips and the caption, in ECHO's Captures at the default size and maximized. The v5 DOM audit only checked controls, so it missed this. |
| G | Found by the new DOM rule: CANVAS's Below layout covers its own footer | The letter frame uses the same fixed 1.62 aspect for its width while its real aspect is 0.82. With the note Below, the letter is 622 px tall in a 540 px stage and lies over Undo, Redo and Compose in POSTMAN. Playwright could not click Compose (3 s timeout) at 1366×768 and 1920×1080. review:v5 never chose Below, so it missed this. |

Codex's exploratory route (an early correct Bell action, apps opened early, an invalid address, Force and recovery) still passes on v5. It is rechecked in `check:paths`.

**Found later in this iteration, by the new checks:**

| # | Finding | Result |
| --- | --- | --- |
| H | The ghost line's new box cut off a letter (introduced by this iteration's move, caught before delivery) | At ECHO's minimum the line wraps so that "picture." starts a line; the italic tail of its "p" reaches left of the box and the box's clip cut 4 pixels of it (screenshots with and without the clip, `check:drawn`). |
| I | CANVAS's Lift animation starts the words below the note (present in v4 and v5) | The words settle from 1.2 em lower. In the Below layouts the block nearly fills the note, so the first frames put the signature past the letter's bottom edge. Found by `check:paths` auditing right after Recover; reproduced frame by frame with a fake clock on a build with the v5 formula: 3 ink pixels outside the letter at 1366×768 and 25 at 1920×1080 in the first sampled frame (`output/playwright/v6-lift-frames-before.json`). |

## 2. Scope

**In scope:** the findings above, the same class of defect in every other drawing, a check that sees drawn text, and QA of the whole route.

**Not added:** programs, plot, a required step, a new storage format or dependencies.

## 3. Requirements and acceptance criteria

**R1 The note stays on its paper.**
1. Everything drawn on the session window's note lies inside the paper, with a margin of at least a quarter of its own em and at least 1 device pixel. This holds for every surface that draws the session window: Live, paused, the kept capture's thumbnail, negative and picture, and the photograph of a letter made from it in CANVAS, POSTMAN and TERMINAL. It holds at DPR 1 and 2, at every PC size, at the window minimums and maximized, and with simulated fallback fonts.
2. The layout uses the measured ink of the fonts actually loaded (bearings and overhangs included). The note's shape: the fragment wrapped as needed, then the signature. A clip may guard the paper's edge but must never be what keeps words inside.
3. The fragment stays `FOR THE NEXT PER—`, unfinished, with the same signature. A session capture never gains the glass's five lines.

**R2 The viewer's status and the image do not overlap.**
1. LIVE / PAUSED / GLASS and the return flash have their own place, outside the image. Nothing of ECHO's paints over the session window's header (recorded time and PID) or its note, at any size.
2. The paused ghost line is written where the session image has nothing, and its own box never cuts off a letter.
3. Viewfinder corner marks appear only for the glass, where there is a frame to aim.
4. The capture editor does not label a session negative's header.
5. What Live shows, what a capture keeps and what CANVAS, POSTMAN and TERMINAL later show are the same picture. The transport state is never part of a capture. The OS clock and the recorded minute stay distinct.

**R3 Images stay inside their places.**
1. The capture negative (ECHO's Captures, CANVAS's Reframe) and the CANVAS letter (Beside and Below) are sized by their real aspect ratio.
2. They never cover text or controls of their own window.
3. No frame of CANVAS's Lift or Recover animation puts a word past, or close to, the letter's edge.

**R4 Labels describe what is seen.**
1. The session source names the unfinished note as present, in every phase. It never says "No writing" or "empty" while the note is visible.
2. Captions, verdicts and the incompleteness reasons in CANVAS, POSTMAN and TERMINAL match the source: a session window, an old limited picture or the glass.
3. No default text reveals Stop the call. Provenance is unchanged: session captures keep no writing layer; glass captures keep five lines.

**R5 Playability and continuity.**
1. The whole case still works, and the paths listed in prompt06 §5 are exercised with real input. Paths already covered by existing checks are rerun; the others get a new check.
2. An improvement beyond the repairs is made only with evidence and a comparison of alternatives.

**R6 QA that sees the drawing.**
1. A targeted check measures drawn text from real rasterization, independently of the app's layout numbers.
2. The DOM audit reports text covered by any element of the same window.
3. DPR 1 and 2, simulated fallback fonts (stated as simulated), three PC sizes and the minimums.
4. Before/after screenshots and crops with the same names.
5. Build, unit tests, every browser check and a visual review route, all rerun.

**R7 Honest records.** Specs, README, AGENTS.md, steering and kiro-usage state what was done and verified, and what was not.
