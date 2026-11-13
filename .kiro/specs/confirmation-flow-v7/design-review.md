# POSTMAN's confirmations and QA closure (v7) — design review

Kiro IDE session, November 9, 2026. These are the Kiro agent's positions on Codex's review 28 and prompt07. They are not consensus and involve no users. Evidence: `output/playwright/v7-baseline.json` (before) and the results in `tasks.md` (after).

## 1. Facts versus opinions in review 28

| Review 28 item | Kind | Reproduced? |
| --- | --- | --- |
| Incomplete B replacing complete A alternates Send anyway and Replace without committing | Defect (P2) | Yes, by pointer at three PC sizes and by natural keys, and with B made from a session-window capture (finding A). The other order, a Replace question whose letter becomes incomplete before the answer, loops as well (B). |
| A stays byte-for-byte intact and intended; after cancelling, A still finishes the case | Fact | Yes, also after a reload (E). |
| Cause: each command submits one acceptance, so the other is lost | Fact | Yes. The `replace` command already tried to carry the incomplete acceptance, but by then the open question was the replace one, so it always passed `false`. |
| Existing checks cover an incomplete first send and a complete replacement separately | Fact | Yes (`check:letter` scenarios 13 and 5). |
| The audits' exemptions are local and the audits still detect the tested fault classes | Fact (Codex's negative controls) | Not rerun by me; v7 does not change either audit. |
| Priority P2: a broken allowed secondary operation, not save corruption | Opinion I share | The loop commits nothing and blocks nothing else. |
| The 5 px signature is a known limit, not automatically a redesign | Opinion I share | Measured; see §3. |
| The next experience evidence should come from a first visit | Opinion I share | Not run; a protocol is prepared (§4). |

Found while reproducing, not in review 28: a question that outlives the letter it describes (C), and an attachment checkbox that cannot be unticked and briefly writes a string into the save (D).

## 2. Positions

| Codex proposal | Position | Reason and evidence |
| --- | --- | --- |
| Keep sending an incomplete letter and replacing explicitly, collecting both decisions coherently; a combined confirmation or a finite sequence | **Accept; chosen: one combined question** | Compared: (1) let Replace also accept incompleteness, the one-line change: finite, but the Replace question says "only the new receipt can finish the job", false for an incomplete letter, and it accepts an incompleteness it never named (with finding B, an incomplete letter would go out after a question about a complete one); (2) a finite sequence, incomplete then replace, with the first answer remembered: two decisions for one act, and the second question has to repeat the first to stay true; (3) **one question naming both facts, answered once**: no state between questions, so nothing to lose or reuse; (4) refuse an incomplete letter while a complete one is held: removes an allowed operation (v4 R6.4); (5) send it without replacing A: a new standing before the end, new receipt words and new data semantics. |
| If acceptance is remembered between steps, bind it to the draft/content, recipient and affected delivery | **Accept and extend** | No answer is remembered between questions. A single question's answer is still bound, because a question can outlive its content (finding C): the key covers the draft, recipient, subject, message, attachment, the letter's exact content, the replaced delivery and whether the session is finished. The model refuses a stale answer; the view closes a stale question and says why. |
| The replacement warning must not imply that an incomplete receipt can finish the job | **Accept and extend** | The combined question says no receipt will finish the job until a complete letter arrives. The same promise appeared in TERMINAL's refusal of a replaced receipt ("The newer letter’s receipt can finish the job."), reachable once the loop is fixed; it now depends on the newer letter. |
| Do not bypass validation, certify B with receipt A, replace silently or block later edits | **Accept** | Completeness, receipts and edits are unchanged; Replace needs the answer. |
| Copy semantics after Finish session | **Accept** | Unchanged and rechecked. |
| Keep the visual design, ECHO's spatial viewer, the photograph choice, the real content between apps and the glass in the receipt | **Accept** | No visual change outside POSTMAN's question text. |
| The session signature at ECHO's minimum: verify essential information, small coherent change only if needed | **Accept; no change** | See §3. |
| No other lightbox or preset change without observation | **Accept** | Same evidence as in v6's review. |
| — (found while reproducing) | **Fix the attachment checkbox** | The draft editor offers it, and it cannot work (finding D); without it, prompt07's "B without its attachment" cannot be produced. The model also stores the flag as a boolean, so the save can never hold anything else. |
| — (made reachable by the fix) | **Make the state after an incomplete replacement honest** | TERMINAL notes the fall back once; the phase help starts at the new phase's question instead of keeping a "Tell me exactly" level from the previous phase; the "Delivered · ready to finish" toast, if still on screen, goes. No new toast: the person has just answered a question that said this. Seen in the first after-screenshots: without the toast change, the taskbar said "ready to finish" next to a tray saying "Capture retained". |
| — (found in the screenshots) | **Keep every button of a question in view at POSTMAN's minimum** | The first combined text (about 60 words) pushed "Send anyway and replace" below the fold at 640×460; after the end, the copy question did the same because the "already accepted" line stood above it. Alternatives: a modal dialog (a new component, and POSTMAN's questions are inline by design); a smaller font (hurts reading). Chosen: a shorter combined text (44 words) and hiding the "already accepted" line while the copy question, which says the same, is open. |

## 3. Essential information at ECHO's minimum

**Measured** (`output/playwright/v7-legibility.json`): with ECHO at its minimum at 1366×768, the session window's header is drawn at 7.4–7.5 px, the note's fragment at 8 px and the signature at 5.3 px (CSS pixels, from Chrome's ink).

**Where the same facts are text:**
- TERMINAL's header: "last.session Mara · 31 Oct 1987".
- TERMINAL's scene note: "FOR THE NEXT PER— / — Mara, 31 Oct 1987", and its inspector quotes “FOR THE NEXT PER—”.
- ECHO: the chip *Unfinished note*; in Captures, the verdict "its note stops at “PER—”".
- The PID in the header: `ps` in TERMINAL, and ECHO's paused caption counts the returns.

**Decision.** The decision ECHO asks for there (is this the letter's picture?) needs only the chips. No essential fact depends on the 5 px glyphs. No change.

## 4. Experience evidence still missing

Nothing in this iteration was observed with a person. `first-visit-protocol.md` in this folder updates v4's protocol for the current build and adds the three things review 28 and prompt07 name: whether a first visit can explain why the minute came back, recognize what their photograph kept, and say who received the letter. It has not been run. An AI walkthrough would have to be reported as a simulation; none was run.

## 5. Six questions for the changed interaction

### The combined question in POSTMAN
1. **Goal.** Send a letter that lacks something while the job already holds a complete one.
2. **Can observe and decide.** The question names what is missing, the delivered letter it would replace (by its time) and the consequence: "This letter is incomplete: {what}. Sending it replaces the complete letter delivered at {time}; that letter stays in Guest Inbox, marked replaced. No receipt will finish the job until a complete letter arrives. Send it anyway?" Keep editing is first and focused.
3. **What changes.** One new delivery, marked *Incomplete*, becomes the job's letter. A is marked *Replaced*, the phase falls back, and TERMINAL says so.
4. **Can it be corrected?** Yes: fix the letter in CANVAS (Lift, or Undo the reset) and send it again; no Replace question appears, because nothing complete is held. A itself is never reinstated: it stays immutable and replaced.
5. **Why here.** POSTMAN commits deliveries, so the question belongs at the commit.
6. **Strongest objection.** Four sentences at the moment of sending, and people skim dialogs. The first draft was longer (about 60 words) and pushed its last button out of view at POSTMAN's minimum; the final text has 44. The safe action is first; the consequence is shown again afterwards on both letters and in TERMINAL. Whether people read it is untested.
