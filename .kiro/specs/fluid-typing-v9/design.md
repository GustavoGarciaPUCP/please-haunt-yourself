# Fluid typing and the active window (v9) — design

Kiro IDE session, November 10, 2026. Implements `requirements.md` on the v8 code.
- **Not added:** dependencies, storage keys, programs or saved fields.
- **Unchanged:** the mail model, the letter model and when the save is written.
- **Versions:** the save stays `haunt.case.v4`, the fictional OS stays HAUNT OS 4, and the build identifier moves to v9.

## 1. Why a key costs what it costs (findings A–F)

1. **One notification for everything.** The case store has one listener set. Any model change runs `changed()`: compute the phase, save, `emit()`. Then every subscriber renders: TERMINAL's receipt, ECHO, CANVAS, POSTMAN and the desktop shell. The mail model already says what changed (`'draft' | 'send' | 'reset' | 'restore'`), but the store drops it.
2. **Each view redoes all of its work on every call.**
   - ECHO rebuilds its capture list and redraws the selected capture's picture: `fitCanvas`, then `drawNegative`.
   - CANVAS writes about fifteen attributes and texts, and reads two sizes.
   - POSTMAN rebuilds its mailbox list and message list, and redraws its attached letter.
   - The desktop rewrites six attributes and texts.
   - TERMINAL sets its receipt card's `hidden` again. After the end, it also redraws the receipt's live glass.
3. **Forced layouts.** A view's DOM writes invalidate layout, and the next view's size read (`getBoundingClientRect` in `fitCanvas`, `clientWidth`) forces a synchronous layout. Those layouts are 11 % of all sampled time.

"A view renders" does not mean "its pixels are repainted". The counts separate the three:
- the render callback;
- DOM mutation records;
- drawing calls that actually ran.

CANVAS's own preview, for example, was already cached by its key: it rendered on every key and wrote to the DOM, but it did not draw.

## 2. The change

### 2.1 The store says what changed — `case-store.ts`

```ts
export type CaseChange = 'case' | 'mail-draft';
```

**What the store announces.**
- A mail-model `'draft'` change is announced as `'mail-draft'`. That covers Compose, Reply, typing in To, Subject or Message, the attachment checkbox and Discard.
- Everything else is `'case'`: every other model, Send, Start the case over, a change of the save state, and a phase that moved. If the phase ever moved during a `'mail-draft'` change, the change is announced as `'case'`; today it cannot, because `derivePhase` reads no mail draft.

**What stays as it is.** On every change, the store still computes the phase and writes the save, synchronously and in the same order. `persist()` still announces a change of the save state at once; that announcement is `'case'`.

**Who listens.** `subscribe(listener: (change: CaseChange) => void)` gives every listener every change.
- Four views return early on `'mail-draft'`: ECHO, CANVAS, TERMINAL's receipt and the desktop shell.
- POSTMAN renders on both kinds.

**Why the filter is at the subscriber, and opt-out.** A view added later receives everything by default. Forgetting the filter then costs work, never correctness.

**What it relies on.** Only POSTMAN reads `store.mail.draft` (checked in `src/haunt/`, and kept that way by a test, §4). The property behind the filter is tested too: a `'mail-draft'` announcement never comes with a change to anything else in the case.

### 2.2 POSTMAN does only the pertinent work — `postman-view.ts`

- **Its letter canvases remember what they show.** Each canvas keeps a key of:
  - the letter's identity: CANVAS's draft as `run:id:revision` (revisions only grow, Undo and Redo included), or the delivery's `run:id` (a delivery never changes);
  - its backing size after `fitCanvas`.

  The canvas is drawn again only when that key changes. The key lives in a `WeakMap`, not in a DOM attribute. CANVAS's preview (`drawnKey`) and TERMINAL's receipt (`receiptKey`) already work this way. The size is read after `fitCanvas`, so a canvas that `fitCanvas` resized, and so cleared, is always drawn again.
- **The mailbox list and the message list** are rebuilt only when what they show changes. Their keys are the shown content: each mailbox's count and which is current; for each row its key, sender or recipient, time, subject, badge and tone, whether it is selected, and whether it is the one just arriving.
- **The draft editor** writes an attribute or a text only when it differs (`setText`, `setAttr`, `setHidden`). It never writes the field being typed in; that rule is unchanged since v4.
- **One `mail.list()` per render.** It deep-copies every delivery. v8 called it once per mailbox count.

### 2.3 The window manager — `window-manager.ts`

- `setSubtitle` writes only when the subtitle differs. This applies to every program.
- The active window (findings G, H):
  - **Why v8 got it wrong.** `raise()` toggles `.is-active` on every window. `close()` and `minimize()` change which window is active, because `activeInstance()` skips closing and minimized windows, but they never toggle the class.
  - **The fix.** One method, `syncActive()`, puts `.is-active` exactly on `activeInstance()` and removes it everywhere else. `raise()`, `close()` and `minimize()` call it.
  - **Focus is untouched.** No focus call is added: close and minimize still return focus to the window's trigger or taskbar button, as v4 does. The raise on pointerdown and focusin is unchanged.
  - **What a person sees.** The closing window loses its active frame as it fades out. The frame's border and titlebar have no transition, so this is an instant change on a window already fading away.

## 3. Alternatives compared

| Alternative | What it would remove | Risk | Decision |
| --- | --- | --- | --- |
| **A. Change kinds announced by the store** (`'mail-draft'` / `'case'`) | All of ECHO's, CANVAS's, TERMINAL's and the desktop's work on a key | One invariant (only POSTMAN reads the mail draft), checked by a source test and a property test | **Chosen** for the cross-app part |
| **B. Each view skips work by a key of its own inputs** | The same, if every key is complete | Each view needs a complete key. ECHO's: captures, selection, tab, frame preview, pending confirmation, glass, session, the letter's capture, frame rectangle. CANVAS's: letter, Undo/Redo, save state, delivered letter, finished, four previews. A forgotten input is a view that does not update | **Chosen only inside POSTMAN**, for its letters and lists, whose inputs are few and known. Rejected for the other views |
| **C. Render once per frame** (coalescing) | Nothing for typing: each key is one change | Views lag the model by a frame; the DOM a check or a person reads right after an input is stale | Rejected |
| **D. Deferred or debounced save** | About 1.0 ms of 19.6 per key | The last key can be lost on close or reload; "Draft saved" before it is saved. The brief says not to start there, and the evidence agrees | Rejected |
| **E. Skip the phase for `'mail-draft'`** | 0.11 ms per key | A second invariant for almost nothing | Rejected |
| **F. An event bus, a state framework, per-field subscriptions** | The same as A | More machinery than one change kind needs | Rejected |

## 4. Checks

**Unit tests (`tests/fluid-typing-v9.test.ts`).**
- **Property, over random sequences.** The sequences mix draft edits (To, Subject, Message, attachment), Compose, Reply, Discard, letter edits, Send, answers, Finish session, Start the case over, and storage failing or coming back. After every step:
  - a `'mail-draft'` announcement changes nothing in the case except the mail draft;
  - any other change is announced as `'case'`;
  - every change of the mail draft is announced;
  - when storage works, the last write holds the current draft exactly; when it fails, the state is Session only, and the change was announced as `'case'`.
- **Deterministic.**
  - A key that makes storage fail announces Session only (`'case'`) before its `'mail-draft'`.
  - Compose is `'mail-draft'`; Send is `'case'`.
- **Source.** No view other than `postman-view.ts` reads `store.mail.draft`.

**`check:typing` (`scripts/check-fluid-typing.mjs`).** Real input only:
- **Editing in Message.** Typing key by key; editing in the middle; selection and replacement; paste near the limit; Backspace; the field's own Undo. After each step, the draft is checked against the field.
- **Exact text.** Send right after the last key; close and reopen POSTMAN; a reload.
- **Questions.** An open question, then a key typed, then a letter change in CANVAS: nothing other than what was asked about is sent.
- **The other windows while typing.**
  - No DOM mutation in them, and no redraw of POSTMAN's unchanged letter.
  - A real change still reaches them: the letter in CANVAS, a send, a receipt. It does so even while they are minimized, and they show it when restored.
- **Storage blocked, then readable again.** Session only and Draft saved at the right moments; a reload reads the last key.
- **A and B, and copies after the end.**

**`check:active` (`scripts/check-active-window.mjs`).**
- **Close and minimize** the active window with another behind it. The remaining window has the active frame at once, before any click, and focus is where v4 puts it.
- **Click and type** in the remaining window.
- **The last window.** Close it; then restore a window and open one again.
- **Keyboard.** The window menu's Close and Minimize.
- **What must not move.** The window order, geometry and the case are not reset.
- **At every step,** exactly the taskbar's pressed window has `.is-active`, with the active border and titlebar.

**Profile and probes.**
- `scripts/v9-typing-profile.mjs` and `scripts/v9-active-baseline.mjs` run on both builds: v8 on port 5175, v9 on 5174.
- `scripts/v9-compare.mjs` composes the before/after sheets.

**Reruns.** Every existing browser check, `review:v6`, and the new checks in Edge.

## 5. Measurement method

- **What is compared.**
  - The counts (mutation records, drawing calls, save writes) are deterministic for a given route; they are compared exactly.
  - Timings vary between runs: over four runs of the same v8 build, the main condition's wall time per key ranged from 24.2 to 38.6 ms. They are reported as ranges over runs that alternate the two builds.
- **The instruments' cost.** The full instrument wraps 766 drawing calls per key on v8 and observes 63 mutation records. Yet in the same run, its median was between 2.4 ms lower and 5.3 ms higher than the light instrument's, which has only the timer and the save counter. Its cost is therefore within the variation between runs. Both are reported.
- **Typing speed.** Machine-speed typing, as fast as the page accepts keys, builds a backlog: Chrome then delays frames. One condition is therefore paced, at one key every 120 ms (about 8 keys a second, fast human typing). It measures each key's time to the next frame, from Chrome's Event Timing: headless Chrome, 8 ms steps, only entries of 16 ms or more.
- **What the numbers are.** The 4× CPU runs are Chrome's simulation, not a slower computer. None of these numbers says how a person perceives the typing.
