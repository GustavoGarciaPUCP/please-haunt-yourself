# Fluid typing and the active window (v9) — design review

Kiro IDE session, November 10, 2026. These are the Kiro agent's positions on Codex's review 30 and prompt09. They are not consensus and involve no users.

Evidence (all in `output/playwright/`, listed in `tasks.md`):
- **Profiles:** `v9-profile-<run>.json` for v8 runs a–d and v9 runs trial, c and d; the range table is `v9-table.md`.
- **Sampling profiles:** `v9-cpu-v8-unminified.json` and `v9-cpu-v9-unminified.json`.
- **Active-window probe:** `v9-active-v8.json` and `v9-active-v9.json`; the before/after sheets are in `v9-compare/`.
- **Negative controls:** `check:typing` and `check:active` run on the v8 build.

## 1. Facts versus opinions in review 30

| Review 30 item | Kind | Reproduced? |
| --- | --- | --- |
| A message-only key runs `CaseStore.changed()` and its general subscribers; the other programs update views whose content did not change | Hypothesis from code and profile | **Confirmed.** The mutation counts are exactly Codex's per 60 keys: TERMINAL 60, ECHO 1560, CANVAS 900, POSTMAN 840. Codex's 420 "desktop-or-detached" records split here into 360 for the desktop and 60 detached. |
| 29.7 ms per key wall and 16.9 ms median synchronous work with four programs; 15.7 and 8.1 with POSTMAN alone; 122.1 and 91.3 at 4× | Measurement | **Reproduced within the run-to-run variation.** Over four v8 runs: 24.2–38.6 and 13.9–20.0; alone, 10.9–15.5 and 6.0–8.6; at 4×, 111–132 and 82–99. |
| Drawing calls: ECHO 120, POSTMAN 360 per 60 keys | Measurement, partial | **Right, but smaller than the real drawing.** Codex counted `drawImage`, `fillText` and `clearRect`. Counting `fill`, `fillRect`, `stroke`, `strokeText` and `putImageData` too, and the offscreen canvases the fog is drawn into, a key costs 766 calls: ECHO 98, POSTMAN 270, offscreen 398. The conclusion is the same. |
| "Cached CANVAS/TERMINAL drawing is not claimed to rerun" | Fact | **Right.** CANVAS drew nothing, because its preview is keyed. It still cost 2.7 ms per key (14 %): 15 DOM writes, and size reads that force layout. TERMINAL drew nothing before the end. |
| Mutation records are not pixel paints | Opinion I share | Render callbacks, mutation records and drawing calls are counted separately (design §1). |
| Saving each edit may remain correct; the profile does not justify removing persistence | Opinion I share, now measured | `persist` was 1.0 ms of 19.6 per key on v8 (5 %). After the change it is the largest remaining part: 0.87 of 1.37 ms per key (§2). |
| Active window: `raise()` syncs `.is-active`; close and minimize pick the remaining window without syncing it; a click does not raise it, because the model already treats it as active | Diagnosis | **Confirmed** in the source and by the probe: steps 3 and 4 (Codex's case) are inconsistent on v8. Also inconsistent there, not in review 30:<br>- a minimized window keeps `.is-active` while hidden (step 5);<br>- closing the top one of three windows (step 8);<br>- minimizing through the taskbar button (step 9);<br>- POSTMAN alone in the typing profile. |
| An early harness waited for the visual class and stopped | Fact | **The same cause reaches the scripts' `bringForward` helpers** (requirements, finding H). While the class disagreed with the model, they could minimize the window they meant to bring forward. |
| P3; its introduction in v8 is not established | Opinion I share | The code in `raise`, `close` and `minimize` is v4's window manager. I did not trace it further. |

Not in review 30:
- **TERMINAL after the end.** After Finish session, TERMINAL redraws the receipt's live glass on every key typed in a copy: 93 calls per key (finding E).
- **Where the time goes** (sampling profiler, unminified build of the same source; requirements §1.2):

| Work per key | Share |
| --- | --- |
| ECHO | 44 % |
| POSTMAN | 34 % (its letter alone 31 %) |
| CANVAS | 14 % |
| The save | 5 % |
| The desktop | 2 % |
| The phase | under 1 % |
| TERMINAL | under 1 % |

  Forced layouts (`getBoundingClientRect` by self time) are 11 % of all sampled time.
- **Machine-speed typing builds a backlog.** On v8, Chrome's keydown-to-next-frame median was 96–168 ms, against 24 ms for the control. Paced at one key every 120 ms, it is 48 ms against the control's 16 ms. Both are headless measurements.

## 2. Positions

| Codex proposal (review 30 and prompt09) | Position | Reason and evidence |
| --- | --- | --- |
| Scope the notification, or skip view work using a relevant stable identity or revision | **Accept both, each where it fits** | **The store says what changed** (`'mail-draft'` or `'case'`). ECHO, CANVAS, TERMINAL's receipt and the desktop return early on `'mail-draft'`. This rests on one invariant that is easy to check: only POSTMAN reads the mail draft. **POSTMAN keys its own work:** its letter canvases by the letter's identity and backing size, and its lists by what they show.<br>**Rejected:** keys for the other views. Each view would need a complete key of everything it shows, and a forgotten input means a view that stops updating (design §3). |
| Keep draft, save and confirmation updates immediate and truthful | **Accept** | The save is written synchronously on every change, as before. Questions close on the same changes as in v7. The property test checks, over 250 random sequences: a `'mail-draft'` announcement never carries anything else; everything else is `'case'`; the save holds every key. `check:typing` checks the same with real input. |
| Preserve the native input, caret, selection and field Undo; the last key before Send or a reload; stale-question invalidation; immutable snapshots; storage-failure behaviour; refresh on real changes and on reopen | **Accept** | `check:typing` sections 1–7 (tasks.md). |
| Show comparable before/after work, not a debounce or a new millisecond target | **Accept** | The counts are compared exactly and the timings as ranges, both builds measured alternately. Nothing is debounced. No millisecond target is claimed: the measure is the work removed. |
| No broad state-framework rewrite | **Accept** | One change kind, four one-line filters, and keys inside POSTMAN. |
| Fix the active marker without stealing focus or changing the close/restore policy, and without resetting geometry, z-order or the case | **Accept** | `syncActive()` only toggles a class. Focus lands in the same place on v8 and v9 at all 13 probe steps. The remaining windows keep their order and position (`check:active`). |
| Cover close and minimize with a second window, the last window, restoration, the keyboard and subsequent typing | **Accept** | `check:active`, 14 states. |
| Prompt: do not start by deferring the model update or the save | **Accept; the evidence agrees** | The save was 5 % of the cost before. After the change it is most of what is left, but that is 0.87 ms per key, and it stays synchronous.<br>**Not done:** caching the encoded fog grid of the glass, which would save about 0.56 ms per key. Every in-place change of the grid (wipe, breathe, place, release) would have to invalidate it, which is a risk to the save for half a millisecond. |
| Prompt: no `JSON.stringify` of the whole case in each view | **Accept** | POSTMAN's list key serializes only the rows it shows, a few short strings each. |
| Prompt: label 4× CPU as a simulation and keep a normal measurement; identify the instrument's cost | **Accept** | Both are reported. A light instrument, with only the timer and the save counter, repeats the main condition. On v8 the full instrument's extra cost is within the variation between runs: its median was 2.4 ms lower to 5.3 ms higher than the light one. |
| Prompt §6: the smallest change, focus policy untouched | **Accept** | One method, called from `raise`, `close` and `minimize`. |
| Prompt §8: no features or claimed benefits to address the judging criteria; no licence chosen; nothing published | **Accept** | Nothing was added to the game. The missing licence file is left for the participant's decision. |
| Prompt §9: keep the dates and history, identify incorporated prior work | **Accept** | A read-only check (`git rev-list --all`, author and committer dates) found 20 reachable commits, not shallow, the earliest at 5 November 2026, 20:17 Lima. That matches review 32. The v3–v9 work is still uncommitted in the working tree; no history or timestamp was changed. This iteration incorporates no outside code, design or asset, and installs nothing. |

## 3. Self-review after use

Seen in use, and kept:
- **The sheets in `v9-compare/`.** The frame of the window that remains is active at once on v9, with its border and titlebar accent; v8 left it inactive.
- **The closing frames** (`v9-closing-v9/`, about 260 ms after the X). TERMINAL is already active while ECHO fades out behind it. The fading window loses its accent at the start of the fade. The frame has no transition, so this is an instant change on a window already disappearing. Accepted.
- **Subject and To still update what POSTMAN shows of them.** The Drafts row's subject and recipient, and the guest suggestion, change key by key: 1 mutation record per key, the row rebuilt. This was added to `check:typing` after use.

Corrected after use:
- **`check:typing` failed once in the first full suite run.** It counted 2 mutation records in CANVAS during the typing window. The cause was CANVAS's Lift animation (600 ms after its press), still running when the recording started: a timing of the harness, not work caused by the keys.
- **How the check was fixed.**
  - It now waits for the page to be quiet before recording: no toast left, and nothing changing or drawing for 600 ms.
  - It counts work during the keys' own input events as well as in total.
  - It ignores the taskbar clock, which updates on its own every 30 seconds.
- **After the fix.** Three consecutive passes, then the full suite. On v8, the same check fails at "during the input events, no other window or the desktop changed". It lists ECHO 234, CANVAS 135, POSTMAN 126, the taskbar 36, the desktop 18, TERMINAL 9 and detached 9 records for the 9 edit events.
- **The profile's frame timing.** Chrome's keydown-to-next-frame duration at machine speed measures the backlog of automated input. A paced condition (one key every 120 ms) was added before the final runs.

## 4. Six questions for the visible change

The typing change is meant to be invisible: the same text, saves and screens, with less work. The active frame is the one visible change.

1. **Goal.** Know which window will receive the keys.
2. **Can observe and decide.** The frame's border and titlebar accent, and the pressed taskbar button.
3. **What changes.** After the active window closes or minimizes, the window that becomes active shows it at once. A minimized window never does.
4. **Can it be corrected?** There is nothing to correct; it follows the real active window.
5. **Why here.** The window manager decides which window is active, so it marks it.
6. **Strongest objection.** The closing window loses its accent as it starts to fade. The change is instant, on a window that is already disappearing; it has not been watched by a person.

## 5. Not verified

- How a person perceives the typing, before or after. The numbers come from instruments, in headless Chrome.
- Human play. No person has played v4–v9.
- Screen readers, IME composition, touch, Firefox and Safari. Edge ran the new checks and `check:text` only.
- A slower computer: the 4× runs are Chrome's simulation.
