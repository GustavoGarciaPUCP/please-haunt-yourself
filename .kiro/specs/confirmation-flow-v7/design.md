# POSTMAN's confirmations and QA closure (v7) — design

Kiro IDE session, November 9, 2026. Implements `requirements.md` on the v6 code. No new dependency, storage key, program or saved field; the save stays `haunt.case.v4` and the fictional OS stays HAUNT OS 4. The build identifier moves to v7.

## 1. One question per attempt, answered with its key (R1, R2) — `mail-model.ts`

**The attempt.** `MailModel.attempt(letter)` evaluates what Send would do with the draft as it is now, without doing it:
- the resolved recipient, and the attached letter (or none);
- `complete` and `missing`, for a letter to guest;
- `replaces`: the complete delivery the job relies on, which this send would replace (to guest, before Finish session only);
- `copy`: after Finish session a letter to guest is another copy;
- `key`: FNV-1a over `[mail draft id, run, recipient, subject as delivered, message, attached snapshot (its full content, revision included), replaced delivery id and hash, copy]`. Same key, same content, same consequences.

**The question.** `send()` asks at most one question per attempt:

| Attempt | Result | Question |
| --- | --- | --- |
| To guest, incomplete, nothing complete held, before the end | `confirm-incomplete`, `replaces: null`, `copy: false` | incomplete |
| To guest, incomplete, after the end | `confirm-incomplete`, `copy: true` | incomplete copy |
| To guest, incomplete, a complete letter held | `confirm-incomplete`, `replaces: A` | **incomplete and replacing A** (new) |
| To guest, complete, a complete letter held | `confirm-replace`, `replaces: A` | replace |
| To guest, complete, otherwise; to Mara | — | none |

Both confirmation results carry the attempt's `key`.

**The answer.** `send(letter, { confirm: key })` commits only if `key` equals the key of the attempt as it is now. Otherwise nothing is committed:
- if the attempt now needs a question, that question is returned (with its own key);
- if it needs none, the result is `changed`: an answer given for something else never sends by itself.

The duplicate guard (`sentKey`, the same string as in v6, so saved drafts keep working) and the re-entrancy guard (`sending`) are unchanged. The incomplete-then-replace order of v6 is gone: there is nothing to accumulate between questions, so nothing can be lost between them.

**The attachment in the model (R3).** `updateDraft` stores `attached` as `fields.attached === true`, so a non-boolean can never reach the save.

`CaseStore.send({ confirm })` passes the answer through; `CaseStore.sendAttempt()` exposes `attempt()` for POSTMAN.

## 2. POSTMAN (R1–R3) — `postman-view.ts`

**State.** One `Confirm = { key, missing | null, replaces | null, copy }` for the open question. Every button that goes ahead (Send anyway, Replace, Send anyway and replace) sends `{ confirm: key }`.

**The questions' words.** "{phrases}" is `missingPhrases` in the words of the letter's own source (v6).

| Question | Text | Buttons (first one focused) |
| --- | --- | --- |
| incomplete | This letter is incomplete: {phrases}. Send it anyway? It will arrive, but it cannot finish the job. | **Keep editing** · Open CANVAS · Send anyway |
| incomplete copy | This letter is incomplete: {phrases}. Send it anyway? It will arrive as another copy; the letter the job accepted stays as it was. | the same |
| replace | Guest Inbox already has a complete letter from this job. Replace it? The letter delivered at {time} stays there, marked replaced, and only the new receipt can finish the job. | **Replace** · Cancel |
| incomplete and replacing | This letter is incomplete: {phrases}. Sending it replaces the complete letter delivered at {time}; that letter stays in Guest Inbox, marked replaced. No receipt will finish the job until a complete letter arrives. Send it anyway? | **Keep editing** · Open CANVAS · Send anyway and replace |

The first and third keep v6's opening sentences, so the existing checks that quote them still apply. "{time}" names the delivery the question is about. The combined question is the longest; it was shortened (from a first draft of about 60 words to 44) after the first screenshots, because with POSTMAN at its minimum (640×460) its last button fell below the fold of the reading pane. All questions now keep every button in view at that size (`check:confirm`).

**After the end.** While the incomplete-copy question is open, the line above the draft ("The job already accepted your letter. Sending again delivers another copy…") is hidden: the question says the same thing, and with both, the question's buttons did not fit at POSTMAN's minimum.

**A question never outlives what it describes (R2.2).** Each render compares the open question's key with `store.sendAttempt()`. If they differ, the question closes and a notice says why:
- the session finished meanwhile: "The session finished after you pressed Send, so nothing was sent. Sending now delivers another copy.";
- anything else (in practice, the letter changed in CANVAS): "The letter changed after you pressed Send, so nothing was sent. Send checks it again."

Edits made in POSTMAN itself (To, Subject, Message, the address buttons, the attachment) close the question silently, as typing did in v6. A `changed` result shows the second notice.

**The attachment checkbox (R3).** The `input` listener handles only the three text fields (`to`, `subject`, `message`); the checkbox is handled only by `change`, which also closes the question.

**After sending.** The status line for an incomplete letter that replaced a complete one says so: "Delivered to guest@haunt, marked incomplete. The complete letter it replaced is marked replaced; no receipt can finish the job until a complete letter arrives." A replaced delivery that was itself incomplete reads "Replaced by a newer letter. This incomplete letter’s receipt cannot finish the job." instead of "can no longer".

## 3. The state an incomplete replacement leaves (R4)

This state was unreachable in v6. Nothing in the data changes: the new delivery is intended, A's standing is `replaced`, and `derivePhase` already falls back because the intended delivery is not valid.

- **TERMINAL's refusal** (`receiptMessage`, `case-store.ts`) takes the delivery the job relies on. For a replaced receipt it says "The newer letter’s receipt can finish the job." only when that letter is complete; otherwise "That receipt is for a letter you replaced. The letter that replaced it is incomplete, so no receipt can finish the job until a complete letter arrives."
- **TERMINAL's transcript** (`phaseLines`, `haunting-presentation.ts`): when the phase falls back from *Delivered · ready to finish* to an earlier phase other than *Repeating* (Start over goes to *Repeating*), and the job's letter is incomplete, one line: "TERMINAL: The letter the job relies on was replaced by an incomplete one. No receipt can finish the job until a complete letter arrives."
- **Phase help** (`desktop-shell.ts`): the hint level resets on every phase change, forward or back. Toasts stay forward-only: the person has just answered a question that said all of this. A toast still on screen when the phase moves back (the "Delivered · ready to finish" toast lasts 6.5 s) is removed, since it is no longer true.
- **CANVAS** needs no change: its line already says "This is the letter you sent." for the delivered revision.
- **Recovery:** fix the letter (Lift, or Undo the reset) and send it; with nothing complete held, no Replace question appears and the case is ready to finish again.

## 4. ECHO's minimum (R7)

Measured on v6, unchanged in v7 (`output/playwright/v7-legibility.json`, 1366×768 with ECHO at its minimum, DPR 1 and 2): header 7.4–7.5 px, the note's fragment 8 px, the signature 5.3 px (CSS px, from Chrome's rasterized ink). The facts they carry are on screen as text: TERMINAL's header "last.session Mara · 31 Oct 1987", TERMINAL's scene note "FOR THE NEXT PER— / — Mara, 31 Oct 1987" and its inspector; in ECHO the chip *Unfinished note* and, in Captures, the verdict "its note stops at “PER—”". Deciding that this source is not the letter's picture needs only the chips. No change.

## 5. Checks (R6)

- **Unit, `tests/confirmation-flow-v7.test.ts`:** the four questions and their keys; one acceptance, one delivery; stale answers after a letter edit, an attachment change, a recipient change and Finish session; the session-capture letter gains no words; the replaced and incomplete states; TERMINAL's texts; the phase falling back and recovering; the saved form round-trip; and a property-based test (fast-check) over random sequences of edits, sends and answers with three invariants: nothing is delivered without the question of that exact attempt being answered; every delivered snapshot stays byte-identical; answering a question with its own key always commits in one step.
- **Browser, `check:confirm` (new, `scripts/check-confirmations.mjs`):** findings A–F with real input, pointer and natural keys, every cancel, every content change between the question and the answer, a double click on the answer, copies after the end, reload, and each question at three PC sizes and with POSTMAN at its minimum, with the DOM and drawn-text audits and every button of the question in view without scrolling.
- **Existing checks:** rerun unchanged except the build identifier in `check:guide`; unit tests adapted to the new answer (the key instead of the two booleans), with reasons in `tasks.md`.
- **`scripts/v7-baseline.mjs`** reruns as the "after" probe, and **`scripts/v7-compare.mjs`** builds the before/after sheets.
