# POSTMAN's confirmations and QA closure (v7) — requirements

Kiro IDE session, November 9, 2026. Brief: `Kiro brief 07`, based on Codex's `docs/development/28_V6_Independent_QA_And_Confirmation_Flow.md`. This iteration repairs POSTMAN's send confirmations inside v6. It keeps the four programs, the story of contract 23, v6's design and drawn-text repairs, and every earlier data contract (`.kiro/specs/os-case-v4/`, `playability-v5/`, `visual-precision-v6/`). Positions on Codex's proposals are in `design-review.md`.

## 1. Baseline reproduced before any change

`scripts/v7-baseline.mjs` ran on the v6 build (`haunt-Db2YorXu.js`, About "build v6") with real pointer and keyboard input; no case state was injected. In every section a complete letter A was first delivered to guest, and Finish session was not pressed. Results: `output/playwright/v7-baseline.json`, a summary in `v7-baseline-summary.txt`, screenshots in `v7-baseline/`.

| # | Finding | Reproduced result |
| --- | --- | --- |
| A | Incomplete B over complete A loops (review 28) | CANVAS → Reset to the capture, Compose, guest, Send. POSTMAN alternates "This letter is incomplete… Send it anyway?" and "Guest Inbox already has a complete letter… Replace it?" for as long as each is accepted. Six acceptances by pointer at 1366×768, 1440×900 and 1920×1080, and six by natural keys (Tab Tab Enter, then Enter): still asking, 1 delivery, A intended and byte-identical, phase Delivered · ready to finish. The same with B made from a capture of TERMINAL's session window. |
| B | The other order loops too (new) | A complete B (Night paper) asked to Replace; before answering, CANVAS resets it. Replace then asks about incompleteness, and the loop starts. |
| C | A question outlives what it describes (new) | An incomplete B is asked about; in CANVAS the writing is lifted (CANVAS: "Ready…"). Back in POSTMAN the question still says "This letter is incomplete: the writing is still in the mist." Answering it leads to Replace and a complete delivery: the first question described a letter that no longer existed. |
| D | The attachment cannot be removed (new) | "Attach the letter from CANVAS" stays ticked after a click, a click on its label, or Space (`output/playwright/v7-debug-attach.json`). The `input` listener treats the checkbox as a text field and writes the string `"on"` into the draft, and the save is written with it; the re-render ticks the box again; the `change` listener then writes `true` and saves again. So "B without its attachment" cannot be produced from the draft editor at all. The intermediate save lasts only until the `change` event of the same click, but it holds a value the loader rejects: a save left in that state would make the next load discard the whole case as unreadable. |
| E | Cancel keeps A, and A still finishes (review 28) | Keep editing at the first question: A intact; a reload keeps a readable save with A intended; Guest Inbox → A → Return to the request → Finish session finishes the case with A accepted. |
| F | After Finish session (review 28, v5) | An incomplete copy asks once ("…another copy; the letter the job accepted stays as it was.") and arrives as a Copy; a complete copy asks nothing. The accepted A is unchanged. No defect. |

Not reachable in v6 because of A, so not observed: an incomplete letter actually replacing a complete one. Its consequences (the receipt texts, the phase falling back, TERMINAL's transcript) are checked after the repair; see R4.

## 2. Scope

**In scope:** the findings above, the state an incomplete replacement leaves behind, and QA of the combinations around POSTMAN's send.

**Not added:** programs, plot, a required step, a new storage format, a general approval system or dependencies. The save stays `haunt.case.v4`.

## 3. Requirements and acceptance criteria

**R1 One finite question per send attempt.**
1. When a letter to guest is incomplete and would replace the complete letter the job relies on (before Finish session), POSTMAN asks once. The question names what the letter lacks, the complete letter it would replace (by its delivery time), and the consequence: that letter is marked replaced, and no receipt can finish the job until a complete letter arrives.
2. Accepting commits exactly one delivery. Keep editing, Escape and Cancel commit nothing; neither does closing or reopening POSTMAN, a reload or Discard draft.
3. The single-fact questions keep their meaning: an incomplete letter (before the end, or as a copy after it) and a complete letter replacing a complete one.
4. No question says or implies that an incomplete letter's receipt can finish the job.

**R2 An answer applies only to what the question described.**
1. Consent is tied to the attempt: the mail draft, its recipient, subject and message, whether the letter is attached, the attached letter's exact content, the delivery it would replace, and whether the session is finished.
2. If any of these changes before the answer, nothing is sent on that answer. POSTMAN closes the question and says why; the next Send asks about what would happen then.
3. The mail model enforces this; the view cannot commit with a stale answer.
4. A double click or a repeated answer never delivers twice.

**R3 The attachment can be removed.** The checkbox toggles by pointer, label and Space. The draft and the save only ever hold a boolean. Toggling it closes an open question, like any other edit in the draft.

**R4 After an incomplete replacement, every surface says what is true.**
1. The new letter is the one the job relies on and is marked *Incomplete*; the complete letter is marked *Replaced* and its receipt is refused; the phase leaves *Delivered · ready to finish*.
2. TERMINAL's refusal of the replaced receipt does not claim that the newer letter can finish the job when it is incomplete. TERMINAL's transcript notes the fall back once.
3. The phase help starts again at the new phase's question; it never shows an answer nobody asked for.
4. A complete letter sent afterwards makes the case ready to finish again, without a Replace question (nothing complete is held).

**R5 Preserved contracts.** A delivered snapshot never changes. After Finish session a letter to guest is a Copy and the accepted letter stays the job's. The bounded history, Recover the writing, source provenance (a session-window letter gains no writing), duplicate protection, the v6 visuals and the main route are unchanged.

**R6 QA of combinations.**
1. Each finding A–D has a regression with real input; finding E and F stay covered.
2. Prompt07 §4: A + incomplete B, A + B without its attachment, A + B from a session capture; accept and cancel at each step; pointer and natural keys; B corrected to complete; content and recipient changed between steps; cancel then finish with A; reload; copies after the end.
3. The questions inspected at 1366×768, 1440×900 and 1920×1080 and with POSTMAN at its minimum, with the DOM and drawn-text audits unchanged.
4. Model-level tests, including a property-based test over random sequences of edits, sends and answers.
5. Build, unit tests, every browser check and the review route, all rerun.

**R7 Essential information at ECHO's minimum.** Check whether any fact a person needs exists only in text too small to read there. Change something only if it does.

**R8 Honest records.** Specs, README, AGENTS.md, steering and kiro-usage state what was done and verified, and what was not.
