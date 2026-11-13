# Visual precision and QA of the v5 route (v6) — design review

Kiro IDE session, November 9, 2026. These are the Kiro agent's positions on Codex's review 27 and prompt06. They are not consensus and involve no users. Evidence: `output/playwright/v6-baseline.json` (before) and the results recorded in `tasks.md` (after).

## 1. Facts versus opinions in review 27

| Review 27 item | Kind | Reproduced? |
| --- | --- | --- |
| Note fragment and signature exceed the 70-unit paper | Defect | Yes, on every surface that draws the session window, at both DPRs, and with simulated fallbacks (A) |
| LIVE/PAUSED badge covers the drawn header | Defect | Yes, at every size (B) |
| "No writing" beside a visible note | Wording contradiction; how much it confuses people is untested | Yes (C). The same contradiction reaches CANVAS, POSTMAN and TERMINAL for a session-window letter |
| The DOM audit cannot see drawn text | Fact | Yes. It also missed DOM text covered by an image (F, G) |
| The early correct Bell action reaches the glass with zero returns; the photograph choice reaches the delivery | Fact | Rechecked on v6: zero returns and no bell scheduled, then the whole case (`check:paths`); the choice in the delivered letter (`check:letter`, `check:keys`) |
| "The photograph choice may be ignored; the final view may feel small" | Open experience questions | Agreed; only people can answer them |

## 2. Positions

| Codex proposal | Position | Reason and evidence |
| --- | --- | --- |
| A measured layout of the note with real metrics, margins and wrapping; a clip only as a final guard | **Accept and extend** | The layout uses ink bounds, not advance widths: Segoe Print overhangs "FOR THE NEXT" by 0.1 em past its advance. It is drawn at the 100 px reference under a scale, so the drawing uses the same shaping as the measurement at every size. The note copies TERMINAL's own note: two lines and a UI-font signature. Rejected: a bigger paper alone (a wider fallback font would overflow again), one line shrunk until it fits (illegible at the minimum), and the complete message (forbidden: it would turn a session capture into the letter). |
| Give the viewer's status and the source content separate space; choose the smallest coherent layout | **Accept; chosen: a status bar above the image** | Compared alternatives: (1) an opaque badge on the same text (ruled out by prompt06); (2) the badge in the header's free right side (depends on font, scale and PID length, and would still sit on the glass viewfinder's image); (3) removing the drawn header (captures would lose the recorded minute and the PID, which is evidence of each return); (4) drawing LIVE/PAUSED into the image (captures would keep a transport state); (5) **a 26 px bar in the monitor bezel**. Option 5 costs 29 px of the monitor's height: at ECHO's minimum the picture is 339×212 px instead of v5's 385×240, 12 % smaller in each dimension. It keeps both identities readable and changes no retained image. |
| — (found by the new check) | **Move the paused ghost line to the session's quiet zone; keep corner marks for the glass only; no "Picture" label on a session negative** | Same family: DOM painted over drawn words (D, E). Moving the ghost line below the image was rejected: it would shift the controls whenever it appears. |
| — (found by the new DOM rule) | **Size the capture negative and the CANVAS letter by their real aspect** | One CSS variable was never set, so the width used a fixed aspect (F, G). The Below layout blocked Compose by pointer. The menu still offered Letter → Compose in POSTMAN. |
| — (found by `check:drawn` in this iteration's own change) | **Pad the ghost line's box** | Moving the line into the quiet zone gave it a clipping box at the zone's edge. At ECHO's minimum the italic tail of a line-initial "p" lost 4 pixels to that clip (H). Alternatives: remove the clip (the guard against a long line or a large fallback font would go); shrink the font (it is already 11 px at the minimum). Chosen: 0.2 × 0.3 em of padding inside the same box, which keeps the guard. |
| — (found by `check:paths`) | **Bound the Lift animation's drift** | The words settled from 1.2 em lower whatever the room under them, so in the Below layouts the first frames cut the signature at the letter's bottom edge (I). Alternatives: settle from above (the words would cross the photograph, the overlap this iteration removes); fade only (loses the motion that shows the words arriving, also Beside, where there is room). Chosen: the same motion, limited to the measured room under the block. |
| "Unfinished note" with a short context, phase-aware, without technical terms or giving the Bell away | **Accept and modify** | The chip says *Unfinished note* and is on: the note is visible, so it is in the frame. The verdict quotes where the note stops (“PER—”), which is what the player sees. "Empty window" becomes *No figure* and *The note left behind*. Extended to CANVAS, POSTMAN and TERMINAL, where a session letter was called "only mist". Nothing names Stop the call. |
| Add targeted canvas-layout/ink checks plus inspected raster screenshots | **Accept** | The check replays each text call through the real rasterizer and finds the paper from the pixels. The ghost line is judged from screenshots, and Lift frame by frame under a fake clock. None of it reads the app's layout numbers, so it does not repeat them. Fallback fonts are simulated by rewriting canvas font lists and reported as simulated. The before/after sheets were inspected, not only counted. |
| Keep the photograph choice optional and expressive; no extra required step | **Accept** | Unchanged. |
| Evaluate recognizable image choices (the three presets) | **Evaluated; no change needed** | See §3. |
| Evaluate an explicit way to read the delivered letter | **Evaluated; no change needed** | See §3. |

## 3. Small improvements considered

**The three photograph presets at 1366×768.**
- **Evidence.** The thumbnails are about 66×41 px. Pointing at one previews it in the large letter, and choosing it changes the letter at once. A keyboard choice changes the letter immediately, because a radio selection is the choice.
- **Alternatives.** (a) Larger thumbnails in two rows: the Paper section falls below the fold again, the v5 problem. (b) Thumbnails cropped to the subject: they would no longer show the photograph the player framed, which is untruthful. (c) A "Preview" caption on the letter while pointing: it adds another overlay over a drawing, the defect class of this iteration.
- **Decision.** No change. The large letter already is the readable view.

**Reading the delivered letter.**
- **Evidence.** Guest Inbox shows it at the reading pane's full width. The `receipt` desktop file opens that message (`check:guide`). TERMINAL's receipt shows it small, beside the glass.
- **Alternatives.** (a) Make the receipt's letter a button that opens Guest Inbox: a second route to an existing view, and one more Tab stop between Finish session and the transcript at the climax. (b) A lightbox in TERMINAL: a new viewer component for an existing view.
- **Decision.** No change in this pass. Whether people want to read it again at the end is untested.

## 4. Six questions for the changed interactions

### ECHO's monitor status
1. **Goal.** Know what the monitor shows: live, paused or the glass.
2. **Can observe and decide.** The bar names the state. The image shows the source, complete.
3. **What changes.** Pause and Resume change the bar. Captures keep only the image.
4. **Can it be corrected?** Resume live.
5. **Why here and why Halloween.** A monitor with its own status strip is how a camera or capture device shows state. The image is the evidence and stays untouched.
6. **Strongest objection.** The bar takes 29 px of height from the picture. At ECHO's minimum the picture is 12 % smaller in each dimension than in v5 (339×212 px against 385×240). The header, the note's two lines and the ghost line stay legible in the minimum screenshots; the signature is about 5 px tall there.

### The unfinished note
1. **Goal.** Read what the session window shows of Mara's note.
2. **Can observe and decide.** The fragment and the signature, on paper, and the chip *Unfinished note*.
3. **What changes.** Nothing: it is evidence. The whole note only exists on the glass after the minute ends.
4. **Can it be corrected?** Not applicable.
5. **Why here and why Halloween.** A note interrupted mid-word, every minute, is the haunting's symptom.
6. **Strongest objection.** *Unfinished note* could make a player think ECHO or CANVAS can finish it. The verdict says where it stops, and CANVAS says the letter needs Mara's whole note. Whether that reads right needs people.
