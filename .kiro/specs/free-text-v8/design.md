# POSTMAN's free text (v8) — design

Kiro IDE session, November 9, 2026. Implements `requirements.md` on the v7 code. No new dependency, storage key, program or saved field; the mail model is not changed. The save stays `haunt.case.v4`, the fictional OS stays HAUNT OS 4 and the build identifier moves to v8.

## 1. Why the text set the widths (findings A–F)

Three CSS behaviours combine; wrapping alone fixes only one of them.

1. **Implicit `auto` tracks.** `.reading-pane`, `.mail-head`, `.mail-body` and `.draft-editor` are grids with one implicit column. An `auto` track never gets narrower than the largest min-content of its items. An unbroken word's min-content is the whole word (4176.8 px for 600 unbroken characters), so the track, and every item stretched in it (the receipt, the From/To lines, the letter), became that wide.
2. **`justify-items: start`.** `.mail-body` and `.message-item` size their items to fit-content, which never goes below min-content. So `overflow-wrap: break-word`, which wraps a long word without lowering its min-content, would not be enough there.
3. **The base button rule centres content.** Every button on the desktop has `justify-content: center`. `.message-item` is a grid button, so its 1506.7 px track was centred in a 225 px button: half the subject went out on the left, taking the sender and the time with it.

## 2. The fix — `desktop.css` only

**Bounded tracks.** `.reading-pane`, `.mail-head`, `.mail-body`, `.draft-editor` and `.message-item` get `grid-template-columns: minmax(0, 1fr)`. The track is the pane's width whatever the content. A `1fr` track takes all the free space, so nothing is left to centre, and `minmax(0, …)` removes the automatic minimum that came from content.

**Typed text breaks where it must.** `overflow-wrap: anywhere` on the elements that show typed text: the reading pane's heading (subject) and message, the list's subject (the sender/recipient, `.item-who`, had it already) and POSTMAN's notice (which repeats an unknown address). `anywhere` lowers min-content, so fit-content items wrap too. Ordinary text still breaks at spaces first; a word is only broken when it alone is wider than its line. (`break-word` would wrap but keep the word's min-content, so the fit-content items of `.mail-body` and `.message-item` would still be as wide as the word.)

**The message keeps its line breaks** (`white-space: pre-wrap`, unchanged) and is shown in full; the reading pane scrolls vertically and is already a keyboard region (`scroll-region.ts`).

**The list shows the whole text, wrapped.**
- **First version, rejected after measuring.** It clamped the list's subject and sender to two lines with an ellipsis, as mail programs do. The DOM audit then reported the subject as covered by the row's badge in nine of the probe's states: a clamped element's hidden lines still have layout boxes, below the visible two, where the badge is drawn.
- **Two ways out.** (a) Teach the audit that an element's own clip hides its text. (b) Do not hide any text.
- **Chosen: (b).** The prompt asks for no new audit exceptions. Showing everything hides no typed text anywhere. A 120-character unbroken subject is about eight lines in the 225 px column; that is the visible consequence of a long subject the person chose to write. The case's own subject, "For the next person at this desk", still takes one line.
- **When the list is taller than its column**, it becomes a keyboard region like every other panel that scrolls (`scrollRegion(.message-list, 'Messages')`, the v5 rule). Its rows are buttons, so Tab reaches each of them anyway.

**The letter.** No rule changes: `.mail-letter` is `width: 100%` with `max-width: 560px`, and the canvas takes its shape from `aspect-ratio`. Once the track is bounded, 100 % is the pane's width.

## 3. The audit sees a cut-off picture (finding G) — `scripts/layout-audit.mjs`

New kind `picture-clipped`: a canvas or image inside a window that a clipping ancestor cuts off sideways, or vertically when that ancestor does not scroll. It mirrors the existing `text-clipped` rule:
- a picture partly scrolled out of a panel that really scrolls is not reported, as for text;
- `aria-hidden` pictures count too (a thumbnail is decorative for assistive technology, not for the eye);
- pictures inside `[hidden]` are skipped, and only `canvas` and `img` are checked (the SVG icons and figures are drawn to overflow on purpose).

No rule is relaxed and no exemption is added. `check:text` runs a negative control: a canvas made wider than its pane must be reported, and must not be once it is removed.

## 4. A second browser — `scripts/haunt-helpers.mjs`

`start()` reads `HAUNT_CHANNEL` (default `chrome`), so any check can run in Edge (`msedge`), which is already installed. Playwright launches it with a temporary profile, not a personal one.

## 5. Checks (R7)

**`check:text` (new, `scripts/check-free-text.mjs`).** Real input only: the main route to CANVAS, the form, Send. Text goes into the real fields with Playwright's `fill`; the main case at 1366×768 is typed one key per character, one past each limit. Each state is measured, not compared with a CSS declaration.
- **Combinations:** both fields at their limits, unbroken, at three PC sizes, with POSTMAN as it opens, maximized and at its minimum; the subject alone; the message alone; ordinary long text with spaces and line breaks; a short Unicode sample; the case's normal content.
- **Views:** Guest Inbox, Sent, Returned and the kept draft; a copy after Finish session; the notice for an unknown address of 80 characters; an incomplete delivery with Fix it in CANVAS; after a reload.
- **For each state:**
  - nothing wider than its pane: no horizontal scroll in the reading pane or the list;
  - the sender, time, badge, subject, heading, From/To lines, receipt, message, actions and letter inside their pane;
  - the letter at 1.62 (±0.02) and at most 560 px wide;
  - the heading and message equal, character for character, what was typed, with the same lines;
  - the stored delivery equal to it;
  - the list row showing the full subject, and its accessible name containing it;
  - no DOM or drawn-text audit problem.
- **Reach:**
  - by keyboard: Tab from Return to the request to Fix it in CANVAS (in view), and into the reading pane, where End scrolls the end of the message into view;
  - by pointer: Fix it in CANVAS opens CANVAS, and Return to the request, then Finish session, finishes the case.
- **The audit's negative control** (§3).

**Also:**
- `HAUNT_CHANNEL=msedge` reruns `check:text` in Edge.
- `scripts/v8-baseline.mjs` reruns as the "after" probe, and `scripts/v8-compare.mjs` builds the before/after sheets.
- `review:v6` and every existing check rerun with the new audit rule.
