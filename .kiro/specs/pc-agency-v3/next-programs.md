# Next programs — CANVAS, POSTMAN and the final acknowledgment

Kiro IDE session, November 6, 2026. **Specification only. Nothing in this file is implemented in the v3 checkpoint.** It continues the same case from the data this build already produces: the request `mara-1987-10-31` and a kept ECHO print. Story authority: contract 23 (Codex).

## Who sends what to whom

| Fact | Value |
| --- | --- |
| Sender | Mara, 31 October 1987 (the old session) |
| Recipient | `guest`, the current user of this desk: the next person at this desk, the player |
| Payload | One finished letter = Mara's original note (verbatim) + the picture from the player's kept print |
| Wrong route | Reply to sender (Mara). It returns: "That went back to the sender." |
| Delivery | A local entry in the fictional Guest Inbox plus a receipt. No network, email or real person. |
| Closure | TERMINAL accepts a receipt that matches the request, the letter version and the recipient |

## Data contracts

```ts
// Produced today by ECHO (v3): the print the player chose "for the letter".
interface KeptPrint { requestId: 'mara-1987-10-31'; printId: number; kind: 'impression' | 'partial' | ...; glass: GlassFrame; facts: FrameFacts }

// CANVAS output (future)
interface FinishedLetter {
  requestId: 'mara-1987-10-31'; letterId: number; version: number;      // version increments on every committed edit
  fromPrint: number;                                                    // provenance: the kept print's id
  picture: { crop: Rect; mist: number /* 0..1 kept condensation */ };
  writing: { lines: readonly string[]; complete: boolean };             // lines actually separated from the print, verbatim
  layout: { notePlacement: 'left' | 'right' | 'below'; paper: 'card' | 'photo' };
  previewHash: string;                                                  // hash of the rendered preview: payload equals what is visible
}

// POSTMAN output (future)
interface DeliveryReceipt {
  requestId: 'mara-1987-10-31'; letterId: number; letterVersion: number; previewHash: string;
  recipient: 'guest'; route: 'guest-inbox'; receiptId: number;
}
```

**Validation (TERMINAL, future):** `receipt.requestId === request.id && receipt.recipient === 'guest' && receipt.route === 'guest-inbox' && receipt.letterVersion === letter.version && receipt.previewHash === letter.previewHash && letter.writing.complete`.

A receipt for an older version, another letter or the sender route does not close the request. TERMINAL explains the mismatch and leaves the request open.

## CANVAS — finish the letter

**Identity:** a work surface with layers and composition. It has no source switch (that is ECHO's job) and no delivery (that is POSTMAN's).

**Input:** the kept print only. *Open in CANVAS* on that print is the contextual handoff. Opened without one, CANVAS shows an empty board: "No print is kept for the letter. Keep one in ECHO first." It also offers a button that opens ECHO.

**Operations (each changes the delivered result):**

1. **Separate the writing from the mist.**
   - The print has layers: night/figure, condensation, writing cut and hand.
   - The player raises the writing layer out of the condensation, using a contrast/threshold handle on the writing layer, not a wipe gesture. The writing becomes ink on the letter.
   - Lowering the condensation too far without separating the writing first erases the words. The preview then truly lacks them, and the ghost writes "Not the words." Undo restores them.
   - Only lines that were readable in the print can be separated. A print with two readable lines yields a letter with those two lines, and POSTMAN later warns that it is incomplete.
2. **Choose the picture.** Crop within the print's frame and choose how much mist stays around the figure. Both are the player's authorship.
3. **Compose.** Choose where the note sits relative to the picture and the paper style. The preview is the payload.

**Acceptance criteria (future tasks C1–C6):**

- **C1.** CANVAS reads only the kept print's data and never invents text: lines = readable lines in that print.
- **C2.** Erasing the words updates the preview and the payload together, shows "Not the words.", and Undo restores them.
- **C3.** *Compose with this* creates a `FinishedLetter` with incremented `version` and `previewHash`, and opens POSTMAN on Mara's thread.
- **C4.** Editing a letter that was already delivered creates a new version. The old receipt no longer matches it, and TERMINAL says so.
- **C5.** Keyboard equivalents exist for the layer handle, the crop and the placement. Reduced motion is static.
- **C6.** No source switching, wiping or sending inside CANVAS (removal test: without CANVAS the letter lacks separated writing and a chosen picture, so its step is justified).

## POSTMAN — deliver it

**Identity:** a thread view with sender and recipient fields, a mailbox list and a receipt.

**Input:** a `FinishedLetter`. Opened earlier, POSTMAN shows Mara's thread with an empty draft: "The letter isn't finished yet. CANVAS finishes it from ECHO's print."

**The thread:**

- From: **Mara** (31 Oct 1987), with the subject "For the next person at this desk".
- Its body is the old job request: "Leave the picture and the note for the next person at this desk."
- Mailboxes: *Outbox*, *Returned* and **Guest Inbox — guest (you, at this desk now)**.

**Decision:**

- **Reply to Mara** is plausible because it is the default for a thread. It goes to the sender and returns: "That went back to the sender." The returned item is visible in *Returned*. The thread still shows the next-user instruction. No earlier work is reset.
- **Deliver to Guest Inbox** stores that exact letter version in the Guest Inbox and creates a `DeliveryReceipt`. The receipt shows the letter preview, version and recipient.
- *Return to the request* on the receipt opens TERMINAL.

**Acceptance criteria (future tasks P1–P6):**

- **P1.** The sender and recipient are always visible, and the two routes produce different, persisted results.
- **P2.** A delivery stores the exact payload (`previewHash`) and creates exactly one receipt per letter version. Closing windows or replaying cues never delivers twice.
- **P3.** An incomplete letter (missing lines or missing picture) can be sent only after a plain warning naming what is missing. Its receipt is marked incomplete and TERMINAL refuses it with that reason.
- **P4.** The returned reply never contacts anyone and never produces a receipt.
- **P5.** Undo of a delivery is a separate, explicit "Recall from Guest Inbox" that invalidates the receipt.
- **P6.** Keyboard and reduced-motion parity apply.

## TERMINAL — the final acknowledgment

When TERMINAL receives a valid receipt (*Return to the request*, or `jobs ack <receiptId>`):

1. The job is archived as "Delivered. Session complete." The ghost writes its last committed line: **"You were the next person. You can close the window now."**
2. The glass releases. The hand lifts away in about 0.8 s (reduced motion: immediate). The fog clears in about 0.2 s while the kept letter stays inspectable. This is a different scene from the milestone reveal: the letter arrived, the call did not just stop.
3. After that TERMINAL never adds ghost lines. `echo` returns only the player's words. History keeps the final line.
4. **Keepsake:** after closure the player may keep a local copy of the letter or decline it. Declining removes only the personal copy. The delivered record and receipt stay intact and honest. Deleting the delivered record is a separate explicit action that also marks the receipt as referring to a removed letter.

**Acceptance criteria (future tasks T1–T5):**

- **T1.** Only a matching receipt closes the request: same `requestId`, version, `previewHash`, `recipient === 'guest'` and `route === 'guest-inbox'`.
- **T2.** A stale or mismatched receipt keeps the request open and explains why.
- **T3.** Closure persists, and reload never replays the release scene.
- **T4.** An old v1 or v3 save never closes the request without a receipt.
- **T5.** The final line is history; no autonomous ghost output follows.

## Save version for the full case

`haunt.case.v4` will add `letters`, `mail` and `receipt`. Migration from v3 will keep the request, the glass, the prints and the kept print, and will never mark anything delivered.

## Video plan alignment

`PITCH.md`'s 110-second gameplay block maps one beat per program: TERMINAL (stop the call), ECHO (frame and keep), CANVAS (separate the words, compose), POSTMAN (reply returns, deliver to guest) and TERMINAL (acknowledgment). Only the first two exist in this build.
