# POSTMAN's free text (v8) — design review

Kiro IDE session, November 9, 2026. These are the Kiro agent's positions on Codex's review 29 and prompt08. They are not consensus and involve no users.

Evidence:
- **Before:** `output/playwright/v8-baseline.json`, the probe on the v7 build.
- **After:** `v8-after.json`, the same probe on the v8 build, and `tasks.md`.
- **Alternatives and costs measured in the page** (scratch scripts in `output/playwright/`): `v8-experiments.json`, `v8-clamp-experiment.json`, `v8-lines.json`, `v8-typing-cost.json` and `v8-typing-cost-split.json`.

## 1. Facts versus opinions in review 29

| Review 29 item | Kind | Reproduced? |
| --- | --- | --- |
| Subject 120 × W and Message `abcdef` × 100, both allowed, expand the list and the reader | Defect (P2) | Yes, at the three PC sizes, with POSTMAN as it opens, maximized and at its minimum, and in Sent (finding A). The same numbers as Codex's: at the minimum, the pane is 242 px wide and scrolls to 4209 px, and the heading and message are 4176.8 px wide. The subject is 1506.7 px wide, and the list scrolls to 866 px. 21 DOM reports at the default size and 21 at the minimum, at 1366×768. |
| The list's subject runs outside its column, including to the left | Fact | Yes. At 1366×768 it starts 110.8 px left of the list (470.8 px when maximized), taking the sender, time and badge with it. Cause: the base button rule's `justify-content: center` centres the oversized track inside the 225 px button (design §1). This is the "inherited alignment" Codex told me to inspect. |
| The letter is "scaled/clipped by that expanded layout rather than simply fitting its pane" | Fact, made precise | Clipped, not scaled. The letter's width is 100 % of a 4209 px track, capped at its 560 px maximum, so it was drawn at full size and cut by the 242–562 px pane, at all three sizes. Maximized (970–1524 px) it fitted. |
| 21 reports are repeated manifestations of one problem, not 21 defects | Opinion I share | Every report is one element whose box takes the oversized track width: a row's spans, the heading, the message, the receipt sentence or the From/To lines. |
| The stored delivery keeps exactly 120 and 600 characters; Return to the request stays usable; the case finishes | Fact, with one exception | Yes, also after a reload. The exception is an incomplete letter at POSTMAN's minimum: Fix it in CANVAS lay mostly outside the visible pane, and focusing it with Tab did not bring it into view (finding F). |
| An optional-content boundary case; the default narrative text does not reproduce it | Fact | Yes. The case's normal content, long text with spaces and line breaks, and a Unicode sample all gave 0 reports (H). |
| Entry points `.message-item`, `.item-subject`, `.reading-pane`, `.mail-head`, `.mail-body`, `.mail-message` | Fact, incomplete | Right places, and two more: `.draft-editor` and `.mail-notice`. The notice repeats an unknown To address (finding E). |
| "The text blocks lack suitable wrapping/minimum-width constraints" | Partly right | Wrapping alone does not fix it (§2, measured). The widths come from implicit `auto` tracks and fit-content items, not only from unbroken text. |
| The earlier probe established only the combined case | Fact | Yes. The message alone turned out to be its own case (C): the list was fine, and the reading pane widened. |

Found while reproducing, not in review 29:
- The message alone widens the reading pane (C).
- An 80-character unknown address widens the draft editor through the notice (E).
- Fix it in CANVAS is out of view at the minimum (F).
- Neither audit sees a cut-off picture (G): the DOM audit checks text and controls, and the drawn-text audit checks ink against the paper inside the canvas.

Typed mail text is shown only in POSTMAN. No other view reads a delivery's subject or message (searched in `src/haunt/`). TERMINAL's end card says what the photograph keeps ("the handprint and the figure"), from the letter's own data, not the mail's subject. The only other free-text field, TERMINAL's command line (200 characters), had no defect.

## 2. Positions

| Codex proposal | Position | Reason and evidence |
| --- | --- | --- |
| Constrained tracks, wrapping, unchanged payload | **Accept** | Two things, both in `desktop.css`. **Tracks:** `grid-template-columns: minmax(0, 1fr)` on five grids (reading pane, mail head, mail body, draft editor, list row). **Wrapping:** `overflow-wrap: anywhere` on four text elements (heading, message, list subject, notice). The mail model, the save and the stored deliveries are not touched; the check compares stored text with what was entered, character for character. |
| Inspect tracks and inherited alignment, not only wrapping, before choosing the smallest fix | **Accept; confirmed by measurement** | **Alternatives compared:** <br>(1) **`overflow-wrap: break-word` with the bounded tracks**, measured in the page (`v8-experiments.json`). The heading wraps, because `.mail-head` stretches its items. The message stays 4177 px wide, the pane still scrolls to 4193 px, the list subject stays 1507 px and the list scrolls to 1519 px: 4 reports. In `.mail-body` and `.message-item` (`justify-items: start`) items are fit-content, and `break-word` does not lower a word's min-content. <br>(2) **Stretch the items instead of `start`** (reasoned, not measured): the message and the list subject would then take the track's width and wrap with `break-word`. The row's badge would stretch to the row's full width too, unless it got its own `justify-self: start`. That is more rules for the same result. <br>(3) **`word-break: break-all`**: it breaks ordinary words at line ends too, so it would change how normal text looks. <br>(4) **`overflow: hidden` on the window or panes**: it hides content. Codex and the prompt rule it out. <br>**Chosen: bounded tracks plus `anywhere`.** Ordinary text still breaks at spaces first: the spaced and Unicode controls look the same as in v7 (compare sheet 08). |
| Do not merely force the outer window to hide the overflow | **Accept** | No `overflow` or clipping rule was added. A negative control puts v7's track and wrapping rules back in the page. The audit then reports 22 problems in that state: v7's own 21 (11 text-clipped, 10 text-offscreen, the baseline's exact counts) plus the cut-off letter as picture-clipped. |
| An intentional list summary may be used if justified | **Tried, then rejected** | **What was tried:** a two-line clamp on the list's sender and subject, as mail programs do. **What the audit reported:** the subject's hidden lines as covered by the row's badge. The clamp, re-created on the v8 build (`v8-clamp-experiment.json`), gives 1 text-covered report per state, by the Receipt badge. <br>**Why not adapt the audit:** `text-covered` samples every line box inside the element's clipping ancestors, but not inside its own box. Teaching it about the element's own clip is exactly the new exception the prompt asks me to avoid. It would also make vertically clamped typed text invisible to every rule (`text-overflow` checks only horizontal overflow). <br>**Chosen:** hide no typed text. The cost, measured: a row with a 120 × W subject is 203 px tall (8 lines), against 97 px with the clamp and 80 px for the case's own subject. Three such rows make the list taller than its column, so it scrolls and becomes a keyboard region (`scrollRegion`, the v5 rule). The case's normal content looks as before. |
| Do not lower the limits, truncate, change the picture or relax the auditors | **Accept and extend** | The limits 120/600/80 are unchanged. Typing one character past each limit leaves the field at its limit, as before. No exemption was added. One stricter rule was added: `picture-clipped`, a canvas or image cut off by a clipping ancestor. It mirrors `text-clipped`. It found nothing in the 210-state review route or in the other checks that run the layout audit (halloween, case, drawn, paths, confirm). Its own negative control is a canvas wider than the pane. |
| Separate subject-only, message-only and combined regressions; spaced text, Unicode; Delivered/Sent/Returned; reload; pointer and keyboard | **Accept and extend** | `check:text` covers all of these. It adds the kept draft, the 80-character unknown address, an incomplete delivery at the minimum (keyboard and pointer), three long copies after the end (the list as a keyboard region) and the negative controls. The main case at 1366×768 is typed one key per character; the others use Playwright's `fill` on the same fields. |
| Edge as additional evidence | **Accept** | `check:text` also passes in the installed Edge 157.0.4341.42, with a temporary profile: 10 outcomes, 35 audited states. This is not Firefox or Safari, nor every check in Edge. |
| No new required interaction, program or visual reset; first-visit evidence next | **Accept** | Nothing was added to the route. The first-visit protocol (`confirmation-flow-v7/first-visit-protocol.md`, About now says build v8) has not been run. |

## 3. Self-review after seeing the result

Every pair in `output/playwright/v8-compare/` (sheets 00–08) was inspected, with the after numbers in `v8-after-summary.txt`.

**Corrected after the first after-run.** The two-line clamp produced the text-covered reports described in §2. It was dropped for whole text, and the list became a keyboard region when it overflows.

**Corrected in the records.** The before/after pairs showed three overstatements in my own findings:
- **Finding C.** I first wrote that the heading and From/To lines "go out of view" for the message alone. Their text still shows; only their boxes were 4177 px wide.
- **Finding E.** "Labels outside the window" was wrong: the label text shows, and it is the fields that run past the window.
- **Finding H.** The "300-character" TERMINAL command was 200 characters: the probe enters 300, and the field's maxlength keeps 200. The probe now records the length kept.

`check:text` also said "typed" where it used `fill`. Its main case is now typed key by key, and its wording says which is which.

**Seen and kept as it is:**
- **The heading and the message** (`output/playwright/v8-lines.json`, 1366×768). A 120 × W subject in the 16.5 px bold heading takes 6 lines as POSTMAN opens and 10 at its minimum. The 600-character message takes 12 and 20 lines. The pane scrolls vertically and is a keyboard region; `End` brings the letter into view (`check:text`). Making the heading smaller for long subjects would be a design change for a boundary case that the person chose to write.
- **The letter.** Before, at 1366×768, it was visible but cut. After, with both long fields, it is whole but starts below the fold: 599 px down a 580 px pane as POSTMAN opens, 933 px down a 384 px pane at the minimum. This is the expected result of showing the full text first, in the existing order.
- **Wrapping.** `anywhere` breaks an unbroken string at the line's end, with no hyphen. Wrapping adds no characters to the text.

**Not changed, noted:** the subject's existing `trim()` at send. Spaces around a subject are removed, as in v7. Stored text equals the entered text for every case checked; none had surrounding spaces.

## 4. Six questions for what changed for the person

Only the presentation changed, so the six questions apply to one visible behaviour: the list showing the whole subject.

1. **Goal.** Find and open a message in a mailbox.
2. **Can observe and decide.** Each row shows who, when, the badge and the whole subject, wrapped.
3. **What changes.** A very long subject makes its row taller. A list taller than its column scrolls, and Tab reaches it as a region ("Messages").
4. **Can it be corrected?** Nothing to correct: the subject is what the person wrote. A later copy can use another subject.
5. **Why here.** The list is where a message is chosen. A cut-off subject there was the original defect.
6. **Strongest objection.** Mail programs summarize subjects in lists, and an eight-line row is unusual. Accepted for a boundary case: a summary needs an audit exception and hides typed text, and the normal subject still takes one line. Whether people mind is untested.

## 5. Found while checking, not changed: the cost of a key in POSTMAN

**How it showed.** Typing the main case one key per character made `check:text` time out under 4× CPU throttle. Its 600-key message took longer than Playwright's 30 s default. The harness timeout is now longer, and the typing time is recorded.

**Is it new in v8?** v8 changes no input handling. Its one addition on this path is the list's keyboard region (`scrollRegion`). Its observer runs after each re-render of the list, and its size check at most once per frame. I did not measure v7's per-key cost, so I do not claim the two builds are equal.

**Per key in the Message field** (`output/playwright/v8-typing-cost.json`, 200 keys each, against a plain textarea that no app code listens to):

| | Plain textarea | POSTMAN's Message |
| --- | --- | --- |
| Normal speed | 3 ms | 31 ms |
| 4× throttle | 10 ms | 114 ms |

Every key writes the save once, 38.5 KB.

**Where the time goes** (`v8-typing-cost-split.json`, synchronous work of one input event, median):

| Programs open | Per key |
| --- | --- |
| All four | 19.7 ms |
| Only POSTMAN | 7.8 ms |
| Only POSTMAN, save write skipped | 7.5 ms |

A draft keystroke is a store change, and CANVAS, ECHO, TERMINAL's receipt, the desktop shell and POSTMAN all render again on every store change (`store.subscribe(() => this.render())`). Closing the other three programs takes the work from 19.7 to 7.8 ms, so most of it is in their response to a change that only concerns the draft. The save write is about 0.3 ms.

**Why it is not changed here.** About 31 ms a key is not noticeable on this machine. On a machine four times slower, 114 ms a key would fall behind a fast typist. This is input handling, not layout, and prompt08 asks to keep v7's flow; a change in what every view renders on a store change belongs in its own task, with its own checks. The likely direction: views skip store changes that do not concern them, or coalesce renders into one per frame. It is recorded as a pending limit. No human has typed in it.

## 6. Not verified

- Human play; nothing in this iteration was observed with a person.
- Screen readers: the accessible names were checked in the DOM only.
- Firefox, Safari and touch.
- Input methods (IME) other than direct key presses and Playwright's text insertion.
- Real background tabs and timing targets.
