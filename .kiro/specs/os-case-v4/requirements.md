# OS and complete case v4 — requirements

Kiro IDE session, November 7, 2026. Brief: `Kiro brief 04` (sections 1–14), with `docs/development/24_V3_Critical_Review_And_Real_OS_Direction.md` and `25_Consistency_Across_The_Four_Programs.md` (Codex). Story authority remains contract 23. This file records the Kiro agent's decisions for this run. It is not consensus, approval or a human study.

## 1. Scope

This run builds the whole case: a desktop that reads as a workstation, TERMINAL and ECHO improved, CANVAS and POSTMAN implemented, and TERMINAL's real acknowledgment and release.

**Preserved from v3:**
- titlebar drag, focus and motion cancellation;
- the single bell producer, muffle versus stop, and the glass milestone;
- the shared glass model and the ECHO viewfinder;
- passive captures;
- validated saves and v1 migration;
- the paper-bridge prototype (`index.html`, `src/core`, `src/ui`, `src/main.ts`) and all uncommitted Codex documents.

**Not added:** a fifth program, settings, login, network, a file manager, real mail, the camera or host processes.

## 2. Baseline reproduced before any change (`output/playwright/v4-baseline.json`)

- **Bell action below the window.** At 1440×900, *Stop the call* sat at y 753.6–793.6 while the window ended at 750 and the action footer at 682–749. A hit-test at its centre did not reach the control.
- **ECHO radio keys.** Both source buttons were `role=radio` with tabIndex 0. ArrowRight left focus and selection on *Session window*.
- **Before images.** Before stills are `v4-before-desktop-{1366x768,1440x900,1920x1080}.png` and `v4-before-bell-1440x900.png`.

## 3. Weakest points and the chosen solution for each

Every row compares three options (player effect, clarity, personality, effort, risk) and picks one.

| Problem | Options compared | Chosen | Why |
| --- | --- | --- | --- |
| Desktop reads as a web page | (a) restyle the existing top bar and hero; (b) a single bottom-taskbar workstation (launcher, running apps, tray), quiet painted wallpaper, real case files on the desktop; (c) a retro 1987 CRT shell | **(b)** | The case is about "the next person at this desk *now*". The OS should be today's desk; the 1987 session is a recording inside it. (a) keeps the landing-page composition. (c) would make everything strange from the first pixel and remove contrast for the anomaly. |
| Bell actions hidden below the room | (a) shrink type; (b) auto-scroll to the panel; (c) an **inspector slot** that replaces the narration when an object is selected (side by side when wide) | **(c)** | The cause, the action and its effect stay in one visible place, with no scrolling. (a) hurts reading; (b) still hides the panel from a person before the scroll. |
| ECHO source selector keys | (a) arrow handlers on the buttons; (b) **native radio inputs** in a fieldset styled as a segmented control; (c) two toggle buttons | **(b)** | The platform gives roving focus, arrow keys and form semantics. |
| Capture contract (two readable lines versus the full note) | (a) keep crop-only prints and require precise framing; (b) **full layered negative + separate photo frame**; (c) capture always copies the job's note from constants | **(b)** | The note is a captured layer, as the breathe mechanic already showed: writing marks stay on the glass when the mist is wiped. The frame only decides the picture. (c) invents data. (a) keeps the clerical hunt. |
| Presence art (cute sheet ghost enlarged) | (a) more blur and drops; (b) **a figure made of its own repeated output** ("I'll finish in a minute." lines clipped to a human silhouette), the same figure as a partial reflection behind the glass, and a drawn pressure print; (c) photographic hand textures | **(b)** | The presence speaks through program output (contract 23), so it should look like output. It is recognisable by material and gesture, not by eyes. (c) would need imagery we do not have and would clash with the illustrated style. |
| First visit coaching | (a) keep the spotlight tour; (b) **one optional callout** at the anomaly plus phase help in the tray; (c) no help | **(b)** | The first minute becomes ordinary desktop → wrong line → one experiment → consequence, and help stays available on request. |

Per-app decisions (CANVAS layers, POSTMAN routes) are in `design.md` §6–7 and `design-review.md`.

## 4. Fixed vocabulary (UI labels)

| Label | Meaning | Never does |
| --- | --- | --- |
| Pause preview / Resume live (ECHO) | Freeze or unfreeze ECHO's live link | Stop or finish TERMINAL's job |
| Muffle the bell | Silence the ring and its ring evidence | Remove the retry |
| Stop the call | Disarm the automatic reissue | Deliver or acknowledge anything |
| Capture | Keep an immutable negative of the selected source | Send, complete, or later read a changed source |
| Photo frame | The view within a capture that becomes the picture | Recapture or drop the writing layer |
| Use this capture | Make that capture the CANVAS draft's source | Certify delivery |
| Lift the writing | Separate the captured writing from the mist onto the paper | Invent or change Mara's words |
| Draft saved (status) | The editable letter is kept | Send |
| Compose in POSTMAN | Open a mail draft with the current letter attached | Send |
| Reply | Prepare a draft addressed to the sender (Mara) | Send, return or fail |
| Send | Commit one delivery attempt to the address in the draft | Choose the address silently |
| Return to the request | Bring TERMINAL forward with that receipt | Claim a different letter was delivered |
| Finish session | Accept the matching delivery and close the job | Merely close a window |
| Close | Close a window | Change the case |

The main path uses: capture, picture, writing, letter, delivery. PIDs, revisions and hashes appear only under *Under the hood* and in About.

## 5. Phases (identical in the job file, tray, notifications, TERMINAL, help and About)

| Phase label | True | Still pending |
| --- | --- | --- |
| Repeating | The job reissues on every failed finish | Stop the call |
| Call stopped · letter pending | Retry is off; the impression can finish or is on the glass | Capture the impression |
| Capture retained | A glass capture holds the impression and its writing | A finished letter |
| Letter draft ready | The picture shows the presence and the writing is lifted | A deliberate delivery |
| Delivered · ready to finish | Guest Inbox holds the complete letter and its matching receipt exists | Finish session in TERMINAL |
| Session finished | The matching receipt was accepted and the glass released | Nothing; only inspection and replay |

Phases are derived from data. A returned or incomplete send never moves the case into *Delivered · ready to finish* and never re-arms the call.

## 6. Requirements and acceptance criteria

**R1 Workstation.**
1. Bottom taskbar: HAUNT launcher; Terminal, Echo, Canvas and Postman buttons showing which apps are running and which one is active; tray with job phase, sound (off by default), the user "guest" and the clock.
2. The wallpaper is a quiet painted night drawn on the glass surface. There is no product headline, mission paragraph or build label on the wallpaper or taskbar.
3. The desktop shows real case files: `last.job` always, plus files for the capture in use, the letter and the receipt once they exist. Each opens its object in its app.
4. Launcher menu: the four apps, Arrange windows, Help, About HAUNT OS (version, scope, storage state, attribution), and Start the case over… (with confirmation).
5. A "Restoring last session" entry plays only on a fresh run. It can be skipped and never delays a reload.

**R2 Windows.**
1. Every app window has an icon (which opens the window menu), a title, Minimize, Maximize/Restore and Close.
2. Titlebar drag keeps all v3 guarantees. Dragging a maximized window restores it under the pointer. Double-clicking the titlebar toggles maximize.
3. Resize from edges and corners, bounded by the app's minimum size and the workspace.
4. The window menu offers Move and Size by keyboard (arrows; Shift for larger steps; Enter to finish; Escape to cancel), plus Maximize, Restore, Minimize and Close.
5. Restore geometry survives maximize, minimize and same-page reopening. Viewport changes clamp windows. Arrange windows restores default bounds without touching the case.
6. Escape closes menus and popovers and cancels move or size modes. It no longer closes app windows.

**R3 TERMINAL.**
1. One authoritative job strip (phase and actions). The anomaly is a line in the transcript that nobody typed.
2. The session view has a scene and an inspector. Selecting an object shows its state and actions in the visible inspector, with no scrolling at the three PC sizes.
3. v3 rules are kept: muffle versus stop, one producer of the bell, the milestone commit, the shadow, Undo until the milestone, and fake-audio cancellation.
4. The recorded minute is labelled as recorded time and never requires real waiting.
5. A receipt brings *Finish session* to the job strip; the typed command `finish` does the same. Validation checks the request, the run, the guest route, completeness, the intended delivery and the content hash.
6. *Finish session* commits immediately, then shows the delivered letter and releases the glass. The final line "You were the next person. You can close the window now." is written once and archived. Afterwards no ghost output appears and normal commands work.

**R4 ECHO.**
1. Source selection uses native radios (arrow keys move focus and selection).
2. *Live*: monitor, subject chips (Handprint / Figure / Writing / Only mist), Capture, and Pause preview (session source) or Breathe on the glass (glass source). Wiping works by pointer and by keyboard: a focusable wipe cursor moved with the arrows, with Space wiping.
3. Capture keeps a full negative of the source and an initial frame equal to the monitor's rectangle. *Captures* shows the full negative with the frame and the picture larger: "Full image kept. This frame becomes the picture." The frame can be moved and resized by pointer and keyboard, without another exposure.
4. A session-window capture has no writing and no handprint. After the milestone it says "The window is empty. The mark is on the glass." Before the milestone a glass capture is bare glass.
5. Captures never change after they are taken. At most 8; Discard has a one-step Undo; a full tray is explained.
6. Migrated v3 prints are *limited captures*: picture only, no writing layer. They are shown, and offer a new exposure.

**R5 CANVAS.**
1. The draft embeds what it needs from its capture, so discarding the capture in ECHO never breaks it.
2. Layers: Writing (in the mist → on the paper), Mist (0–100 %), Photo (frame), Paper (Bone or Night) and note position (Beside or Below).
3. Clearing the mist while the writing is still in it loses the words. The preview and payload both lose the note, the ghost writes "Not the words.", and Undo restores it.
4. A readiness line names what is missing. *Compose in POSTMAN* opens the mail draft with this letter attached.
5. Undo and Redo are local to CANVAS (Ctrl+Z / Ctrl+Y when focus is not in a text field).

**R6 POSTMAN.**
1. Mailboxes: Guest Inbox (this desk), Recovered · 1987 (Mara's unsent message), Drafts, Sent, Returned, and Archive (earlier runs only).
2. *Reply* prepares a draft to Mara. *Send* to Mara is returned locally ("That went back to the sender."). No receipt is created, the call stays stopped and the draft content is kept for correction.
3. *Send* to guest commits an immutable snapshot of the letter, subject and message, together with one receipt. A double click, remount or reload never duplicates it.
4. Sending an incomplete letter asks first. If sent anyway, it is stored as incomplete and never makes the case ready to finish.
5. Sending to guest when a valid delivery already exists requires an explicit Replace; the earlier delivery stays visible and is marked replaced.
6. A receipt's *Return to the request* opens TERMINAL with that receipt.

**R7 Data.**
1. `haunt.case.v4` holds the run identity, terminal, glass (with its writing layer and release state), captures, letter draft, mail and acknowledgment. Everything is validated and size-bounded.
2. v3 migrates: terminal and glass are kept, glass prints become limited captures and session prints become session captures. v1 migrates as in v3 (key removed, nothing completed). The migration is reported once.
3. Start the case over creates a new run; earlier deliveries move to Archive, and their receipts cannot finish the new run. Reload continues the run.
4. If storage fails, the tray shows *Session only* and About explains it. The UI never claims a save that did not happen.

**R8 Presence and glass.**
1. The milestone reveal (about 2 s) and the final release (about 1.4 s) are distinct treatments.
2. The handprint has a readable anatomy (palm, pads, fingers, thumb, creases).
3. The figure is subordinate to the hand and the UI stays readable.
4. Reduced motion lands on the same states.

**R9 PC presentation.**
1. Body text and actions are 14–15 px; secondary text 12–13 px; terminal mono 13.5–14 px.
2. No clipped labels or buttons at 1366×768, 1440×900 or 1920×1080, checked by a DOM audit and by inspected screenshots.
3. Controls are not hidden behind bars, and nothing scrolls unexpectedly.

**R10 Honesty.** About states what is fiction and local. Human play, screen readers and audible sound remain unverified.

## 7. Cross-app scenarios to verify (from document 25 §14.7; executed results are in tasks.md)

1. Correct route A: capture, letter A, Guest Inbox A, receipt A, Finish session. Every view agrees.
2. Wrong source: a session capture has no writing. A new exposure keeps the earlier capture unchanged.
3. Narrow photo frame: CANVAS can still lift all lines and reframe, without inventing words or hunting for pixels.
4. Reply to Mara stays a draft. Sending to Mara returns, with no receipt and no re-armed call. Correcting to guest delivers the same content.
5. Send A, edit B: A is unchanged in Guest Inbox and receipt A matches only A. Only an explicit Replace changes the intended delivery.
6. Finish, then edit a copy or reload: the case stays finished.
7. Capture, letter, then discard the capture: the letter is intact.
8. Capture at one size, then maximize/resize/reload at another: same content and phase.
9. Reload after Send or Finish: no duplicates.
10. Replay, then offer the archived receipt: refused.
11. Keyboard-only full route reaches the same outcome as the pointer route.
12. Storage failure: *Session only*; the case still finishes in memory.
13. Incomplete send: no ready state, missing content named, corrected without repeating the call.
