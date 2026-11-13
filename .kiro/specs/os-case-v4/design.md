# OS and complete case v4 — design

Kiro IDE session, November 7, 2026. Implements `requirements.md` in the existing TypeScript/Vite/canvas stack. No new dependencies.

## 1. One case store, views derived from it

`case-store.ts` owns the run and every model. It exposes `subscribe`, a derived `phase()`, intents for cross-app handoffs, and `persist()`, which returns `saved` or `session-only`.

| Model | File | Owns |
| --- | --- | --- |
| Request | `legacy-session.ts` | Retry, muffle, attempts, presence (`terminal` / `shadow` / `glass` / `released`), lines said, Undo until the milestone, `finish()` |
| Glass | `glass-model.ts` | Placement, fog grid, **writing layer (lines written at the milestone)**, `released`, wipe/breathe, subject geometry |
| Captures | `echo-studio.ts` | Immutable negatives (`session` / `glass` / `limited`) + editable frames, discard with one Undo, at most 8 |
| Letter | `letter-model.ts` | One draft with an embedded source, edits with local undo/redo, completeness, snapshots |
| Mail | `mail-model.ts` | Mail draft, immutable deliveries, receipts, intended delivery, archive of earlier runs |
| Acknowledgment | `case-store.ts` | `ack = { receiptId, deliveryId, at }`, validation |

Pure functions (`phase()`, completeness, subjects, receipt validation) are unit-tested in Node.

## 2. Render planes and coordinates

1. **World (stage).**
   - The glass canvas covers the workspace above the taskbar.
   - It paints the night wallpaper, the presence behind the glass, then the mist with the handprint and writing cut into it.
   - Positions are normalized to the stage; shape sizes are fractions of stage height; the fog is a 128×72 grid.
2. **Windows.** The windows, file icons and menus sit above the world and keep their own input. A wipe starts only on bare glass.
3. **ECHO projection.** `drawGlass(region = the monitor's stage rectangle)` draws the model, never a screenshot, so it never captures itself.
4. **Capture coordinates.** A glass negative stores its own stage size, placement, full fog grid and writing lines. Its frame is a box in those pixels. Letters and deliveries render from their own copies at any output size, so maximize, resize, reload or another screen size never changes their content.

## 3. Capture contract

```ts
type Negative =
  | { kind: 'session'; frame: SessionFrame }                                // TERMINAL's window: no writing, no handprint
  | { kind: 'glass'; stage: Size; placement: Placement | null; fog: string /* full grid */; writing: string[] }
  | { kind: 'limited'; stage: Size; placement: Placement | null; patch: GridPatch; crop: Box };   // migrated v3 print
interface Capture { id: number; run: string; negative: Negative; frame: Box /* capture coords */ }
```

- **Writing layer.** The glass gets its writing at the milestone, from the session's note data (`NOTE` mist lines). A glass negative copies the lines present on the glass at that moment. Wiping removes mist but not the writing, which is why breathing brings it back. So every post-milestone glass capture holds the whole note, while its frame decides only the picture.
- **Subjects.** `subjects(negative, frame, mist)` returns three things:
  - `handprint`: the mist is present and at least 35 % of the hand is in the frame;
  - `figure`: `clear` when at least 12 % of the figure is in the frame and it is uncovered (mist ≤ 45 %, or a cleared area of at least 3 % of the figure box); `faint` when it is in the frame but covered; otherwise `none`;
  - `writing`: the number of lines in the frame.
- **Chips and picture validity.** The chips show the subjects as words. A picture is valid when it shows the handprint or a clear figure.

## 4. Letter and mail data

```ts
interface LetterDraft { id: number; run: string; revision: number; captureId: number; source: Negative;
  frame: Box; mist: number /* 0..1 */; writing: 'mist' | 'paper' | 'lost'; paper: 'bone' | 'night'; layout: 'beside' | 'below'; }
interface LetterSnapshot { draftId: number; revision: number; source: CropSource /* patch under the frame */; frame: Box; mist: number;
  lines: string[] | null /* lifted lines, verbatim */; paper; layout; picture: PictureSubject; complete: boolean; missing: Missing[] }
interface Delivery { id: number; run: string; at: number; to: 'guest' | 'mara'; route: 'guest-inbox' | 'returned';
  subject: string; message: string; letter: LetterSnapshot | null; receipt: Receipt | null; hash: string }
interface Receipt { id: number; deliveryId: number; run: string; request: 'mara-1987-10-31'; recipient: 'guest'; revision: number; hash: string }
```

- **Completeness.** A letter is complete when the picture is valid, the writing is `paper`, and all captured lines are present. A limited source has no writing, so it is never complete.
- **Snapshots.** `snapshot()` copies the fog patch under the frame, so a delivery stays small and immutable.
- **Content hash.** `hash` is FNV-1a over the canonical JSON of the delivery content. A receipt repeats the hash. Validation recomputes it, which also detects tampered storage.
- **Intended delivery.** `mail.intended` is the latest delivery to guest in the run. It is set only by sending to guest. Replacing a valid intended delivery requires an explicit confirmation.
- **Validation.** `validateReceipt(store, receiptId)` requires, in order:
  1. same run;
  2. same request;
  3. route `guest-inbox`;
  4. the receipt is the intended one;
  5. the hash matches;
  6. the letter is complete.

  Each failure has its own explanation.

## 5. OS shell

- **Markup (`haunt.html`).** Stage (glass canvas, file icons, windows), taskbar (launcher, app buttons, tray), launcher menu, tray popover, toasts, boot overlay, About dialog.
- **Taskbar (48 px).**
  - Left: the `HAUNT` launcher (a glyph of the case's bell inside a window frame, not a ⌘).
  - Then app buttons with running and active indicators.
  - Right: the job phase button (opens the phase popover with the phase question and help), the sound toggle, `guest` and the clock.
- **Files.** A single column at the top left: `last.job`, then `capture-N` (the capture used by the letter), `letter`, then `receipt` once each exists. Double-click or Enter opens the file in its app; files are focusable buttons.
- **Help.** A first-visit callout at TERMINAL's *Look inside*. The phase popover carries one question per phase and a "Show me" hint.
- **About HAUNT OS.** Version `v4`, what is fictional and local, storage state, keyboard tips and attribution.

## 6. Window manager (`desktop.ts`, `window-geometry.ts`, `window-drag.ts`)

- **Registry.** Each app entry has an id, title, icon, minimum size, `defaultBounds(workspace)` and `create(content, ctx)`. `create` returns a controller with `suspend`, `resume`, `dispose` and `open(target)`.
- **Geometry.** `{ left, top, width, height }` is applied as inline pixels. `transform` and `opacity` stay owned by `window-motion.ts`.
  - **Restore bounds.** Normal bounds are kept on maximize, minimize, close and reopen within the page.
  - **Maximize.** The window fills the workspace.
  - **Clamp.** Windows are clamped on viewport resize; a window that was never moved or sized follows the default layout instead.
- **Defaults at a workspace of W×H.**

  | App | Width | Height | Position |
  | --- | --- | --- | --- |
  | TERMINAL | clamp(560, 0.42W, 700) | clamp(480, H−48, 780) | x 116, y 24 |
  | ECHO | clamp(720, 0.56W, 940) | clamp(520, H−48, 780) | right aligned, inset 24 |
  | CANVAS | clamp(760, 0.6W, 1000) | clamp(540, H−48, 780) | centred, offset 40 px |
  | POSTMAN | clamp(760, 0.58W, 960) | clamp(520, H−64, 740) | centred, offset 72 px, y 36 |

- **Pointer resize.** Eight handles use pointer capture and respect the minimum size and the workspace. Handles are hidden while maximized and on phones.
- **Window menu.** Opened by the app-icon button. Items: Restore, Move, Size, Minimize, Maximize, Close. Move and Size are keyboard modes with a visible hint.
- **Phones (≤ 640 px).** Active-app full-screen as before, with no drag or resize.

## 7. Apps

**TERMINAL.**
- *Job strip:* phase dot, `last.session · Mara · 31 Oct 1987`, the phase label, then *Look inside* and *Are you okay?*. When a receipt is ready it also shows a letter thumbnail and *Finish session*.
- *Transcript:*
  - The boot lines are ordinary: `Restored 1 session: last.session (Mara, recorded 31 Oct 1987 23:59)`.
  - The anomaly is a ghost line that writes itself.
  - Events add lines; the lines they print do not repeat as they did in v3.
- *Prompt:* input, history, chips for help / jobs / ps / Open ECHO. The redundant footer and "game shell" labels are removed.

**TERMINAL session view.**
- *Pane header:* `last.session — recorded minute 23:59:ss`. The seconds run only during an attempt cue and reset on a retry. There is also *Detach* (back to the prompt).
- *Scene:* the note, the presence made of text, the bell and its cord, and the way out. The objects are buttons.
- *Inspector slot:* shows the narration by default, or the selected object's state and actions. It sits beside the scene from a window width of 840 px and under the scene below that, with a fixed height.
- *Footer:* the primary action, Undo and Hint. *Under the hood* appears as an inspector page.

**ECHO.**
- *Header:* source radios (`fieldset` with native inputs), then the Live / Captures tabs.
- *Live tab:* the monitor with subject chips, Capture, Pause preview or Breathe, and the wipe cursor.
- *Captures tab:* the list on the left; on the right the full negative with a draggable frame, the picture, the chips and the actions.

**CANVAS.**
- *Layers panel:* Writing, Mist, Photo and Paper, each with its operations.
- *Centre:* the letter preview, which is the payload.
- *Footer:* readiness, *Draft saved* and *Compose in POSTMAN*.
- *Menu:* Edit (Undo, Redo) and Letter (Lift the writing, Reset to the capture…, Compose in POSTMAN).

**POSTMAN.**
- *Sidebar:* the mailboxes.
- *Reading pane:* the message, or the draft editor with To (input plus suggestions *Mara · sender*, *guest · this desk*), Subject, an optional message, the attached letter preview and Send.
- *Receipt card:* *Return to the request*.

Every app's menus reuse the same handlers as its buttons.

## 8. Choreography

| Moment | Lead | Duration | Notes |
| --- | --- | --- | --- |
| Boot (fresh run) | Text plus a progress line | ≤ 1.3 s | Skip on any key or click; static under reduced motion |
| Watch it try (call on) | The figure walks, writes, the bell swings | ≈ 3 s | v3 cue ownership; the recorded clock runs :00→:59, then resets |
| Let it finish (call off) | The figure walks into the glass | ≈ 0.9 s, then the glass reveal ≈ 2 s | The model commits first |
| Lift the writing (CANVAS) | Lines rise from the mist onto the paper | 0.6 s | Reduced motion: immediate |
| Send (POSTMAN) | The envelope settles into Guest Inbox | 0.3 s | No flying thumbnails between apps |
| Finish session | The delivered letter card, then the release | 0.4 s, then 1.4 s | The model commits first. Release: the print refills with mist, the figure fades, the mist clears. Reduced motion: final state |

Windows never animate their position; only open, close, minimize and restore animate transform and opacity.

## 9. Persistence (`case-save.ts`)

- **Format.** `haunt.case.v4` stores everything in §1. Bounds: at most 8 captures, 12 deliveries per run and 6 archived deliveries; text fields have length limits; the serialized save is at most 1 000 000 characters.
- **Loading.** The order is: v4, then v3 (migrated, then the v3 key is removed), then v1 (key removed). A corrupt v4 save is removed and reported.
- **Untouched.** The guide and boot flags and the paper-bridge save are never touched.
- **Never saved.** Window bounds, paused previews, Undo stacks and audio consent.

## 10. Tests

- **Unit.**
  - Phase derivation.
  - Subjects and completeness.
  - Snapshot immutability.
  - Delivery, receipt and hash validation.
  - Replacement and archive.
  - Migration from v3 and v1.
  - Geometry (clamp, maximize/restore, resize bounds).
  - All v3 rules kept.
- **Browser** (Chrome via Playwright, against `dist`, one at a time).

  | Check | Covers |
  | --- | --- |
  | `check:windows` | Lifecycle, focus, maximize/restore, resize, window-menu keyboard, arrange, viewport, layouts |
  | `check:drag` | Pointer precision at three sizes; interruptions; dragging a maximized window |
  | `check:halloween` | TERMINAL; the inspector hit-test at its control centres at three sizes |
  | `check:echo` | Radios, negative and frame, subjects, immutability, wipe cursor, discard, limited prints |
  | `check:letter` | CANVAS and POSTMAN, including document 25 scenarios 3–5 and 7 |
  | `check:case` | Full pointer and keyboard routes, reload, replay, storage failure, final screen |
  | `check:console` | The console |
  | `check:recovery` | Migration from v3 and v1, corrupt saves, interruptions |
  | `check:guide` | Boot, callout, phase help, About, desktop files |

- **Layout audit.** A shared DOM audit flags clipped text, truncated buttons and controls whose centre is covered. It runs on every major state at the three PC sizes, alongside inspected screenshots.
