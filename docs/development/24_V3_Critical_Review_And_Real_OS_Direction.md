# V3 review: a real increment, an unfinished experience

November 7, 2026. Codex review requested after the participant completed Kiro IDE prompt03. Source-informed headless Chrome walkthrough, production build, screenshots, targeted interaction probes and existing checks. This is not human usability research, full screen-reader testing or a prize prediction. No application source was changed by this review.

## Verdict

V3 is materially different from v2. Dragging works, ECHO now observes the same case, the viewfinder responds to window positioning, the glass is a shared editable surface and the checkpoint survives reload. These are useful foundations and genuine Kiro-delivered work.

The result is still a development checkpoint. It does not yet deliver the convincing OS, restrained horror, expressive interaction and completed story sought by the participant. Adding further fog or ghost lines alone would not fix that. The largest gaps are the desktop's webpage-like composition, concealed contextual actions, visual tone, fragile capture-to-letter contract and missing CANVAS/POSTMAN ending.

The current ghost art and room metaphor came from the earlier project direction, including Codex scaffolding. They are not solely Kiro's design choices or failures. The next brief must change that visual direction explicitly rather than asking vaguely for more polish.

## Independent verification

- Preview at `http://127.0.0.1:5174/haunt.html` served v3, not v2: `haunt-CnGAsoj1.js`, `haunt-D2WOSIBp.css`, `v3-checkpoint` marker. A fresh build produced those same assets. This verifies this reviewed server, not an already-open user tab's cache.
- `npm.cmd run build`: passed. Preserved prototype assets remained `index-CI5aaKki.css` / `index-DtwU5Nqx.js`.
- `npm.cmd test`: **84 passed in 9 files**.
- Existing browser checks independently rerun: drag **12**, Halloween **15**, ECHO **12**, console **7**, recovery **6**, guide **7**, windows **8**: **67 journeys**, all passed with no page errors.
- Actual PC views inspected at **1366×768, 1440×900 and 1920×1080**. Fresh guide, normal startup, both windows, room, bell panel, reveal, bare misted desktop, wrong capture, wipe/breathe and a fully retained five-line print were inspected.
- An own pointer drag moved TERMINAL exactly **100 px horizontally / 40 px vertically**. Keyboard movement/arrange were covered by the drag harness.
- The intended successful five-line picture is possible: an informed drag of ECHO followed by selective pointer wipes retained a print with the whole hand, five readable lines and the figure. This is not evidence that a first-time user will discover the required framing.

Local evidence is under ignored `output/playwright/codex-v3-*`: visual-review.json, story-review.json, probes.json and PC screenshots. The corrected own review scripts are review artifacts, not new application test suites. A first automation assumption that Close retained a hidden DOM node was corrected; element removal on Close is not an application defect.

Not independently repeated: Kiro's 4× CPU-throttled runs. No audible playback, human first-use session, real screen reader, touch/pen, another browser or real background-tab transition was tested. The old prototype's own `test:browser` suite was not rerun. Automated route duration does not establish human completion time.

## Prioritized findings

### P1 — the desktop reads as a webpage with floating panels

`haunt.html:35` combines a command-symbol top bar with right-side window controls and a separate bottom taskbar. `haunt.html:51` places a large serif product title and mission copy on the wallpaper. Status is repeated in the wallpaper, terminal banner, job card and transcript. At 1920×1080 a large colored-gradient void dominates the right side. `haunt.html:97` advertises unavailable programs and `haunt.html:104` repeatedly exposes build implementation status.

This is an art/interaction judgment from inspected screenshots, not a formal operating-system conformance failure. The user explicitly wants a plausible OS. The recommended direction is a single HAUNT OS workstation convention: bottom launcher/taskbar/tray, app-owned titlebars/menus, coherent controls, actual documents and a usable wallpaper. Put project branding, build details and unavailable-feature disclosures in About/recovery information rather than using them as wallpaper furniture. Do not hide incompleteness from the participant or claim missing apps work.

### P1 — selecting the bell conceals the main intervention

`src/haunt/legacy-view.ts:68`, `src/haunt/desktop.css:664`: the contextual panel is appended below the scene/narration. At 1440×900, selecting Bell put Stop the call at **y=753.58–793.58**, while the app ended at **y=750** and the sticky action footer occupied **y=693–737**. Its center did not hit the control. Screenshot: `codex-v3-bell-before-scroll.png`.

Playwright's normal locator click automatically scrolls to it, so a passing route conceals this discovery problem. Replace or reposition an existing context area so the selected object's action and its consequence fit in the current visible work area. Do not merely reduce fonts, add forced auto-scroll or maximize every app as a workaround.

### P1 — capture evidence and a complete future letter are different contracts

`src/haunt/glass-model.ts:227` accepts an impression with at least 60% hand, **two** readable lines and a clear figure. `src/haunt/echo-studio.ts:25` makes that evidence. But `.kiro/specs/pc-agency-v3/next-programs.md:55` restricts CANVAS to lines readable in the print, while future delivery requires the complete original note.

This is an integration risk, not a claim that v3 currently fakes a delivered letter. Its verdict honestly reports partial text. The problem is that an apparently useful kept print can create a much later dead end; repeated spatial recapture becomes clerical.

Recommended v4 change: capture a **layered negative of the selected source**, with the user-selected framing as a separate photo crop. Retain the original writing layer and mist state from that actual source at that moment. Show a full-negative preview and make the changed promise explicit: full negative retained, chosen crop used for the picture. CANVAS can then separate captured writing and compose the real letter without inventing missing data. A session-window capture still has no glass writing; source choice remains meaningful.

This deliberately changes v3's promise that a print contains only the monitor rectangle. Update UI, spec, data, tests and migration together. Old crop-only v3 prints cannot retroactively become complete negatives. Preserve them as limited captures and allow a new exposure from the still-existing case without restarting it. If another approach is chosen, demonstrate complete native handoffs without inventing text or requiring repeated subpixel framing.

### P1 — the visual tone does not yet deliver the intended presence

`src/haunt/specter-art.ts`, `src/haunt/glass-render.ts`: the same wide-eyed sheet-ghost shape carries from a small room into a giant blurred face. The hand's finger construction reads as stacked rounded marks in inspected stills. The fog is a useful technical surface, but the persistent high-coverage blue-grey wash flattens the wallpaper.

Keep the same entity, causal milestone and shared model. Change its visual expression: a trace formed by repeated terminal output, a partial reflected figure and a deliberately drawn pressure/contact print. Give the hand readable anatomy/material and keep the silhouette subordinate. A restrained illustrated rendering is preferable to unconvincing photorealism. Judge at actual PC size and in a silent still. Do not add another random monster, scream or unrelated jumpscare.

### P1 — the complete case and payoff still do not exist

The retained print ends at a disabled Open in CANVAS. This was honest and within prompt03's scope. It cannot demonstrate delivery, the guest-recipient payoff or a whole-project ending. Further rounds limited to the first two apps would leave the strongest narrative claim untested.

The next proposed IDE task should complete CANVAS, POSTMAN and TERMINAL's actual acknowledgment after settling the artifact contract, while preserving the existing two-app improvements. Do not claim the current build already has that ending. Required final proof: the exact authored letter is in Guest Inbox, the matching receipt closes the original request, the glass releases and normal tools remain usable.

### P2 — ECHO's radio semantics lack expected arrow-key behavior

`src/haunt/echo-view.ts:97`, `src/haunt/echo-view.ts:328`: two buttons declare radio roles and update aria-checked, but both stay at tabIndex 0 and no arrow-key handling is installed. A real ArrowRight from Session window left focus/selection there. Tab/Enter still work; this is not a claim that keyboard source selection is wholly unavailable.

Use native radios, the expected radio-group keyboard pattern or a correctly labelled alternative button pattern. Add a complete keyboard-only successful case, not only a check that a wipe button changes fog. [W3C radio-group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)

### P2 — coaching explains a window already open

`src/haunt/first-run.ts:4`: first-visit coaching blurs the desktop and asks to open TERMINAL while it is already open. The next cards repeatedly describe what the player is about to see. Combined with the opening transcript, it front-loads instruction and reduces discovery.

Keep optional, skippable assistance. Begin with one actual contextual action/anomaly; introduce the next tool when its input exists. Avoid teaching four programs or the final solution in an opening overlay. First minute: ordinary desktop -> meaningful abnormal output -> player experiment -> visible consequence.

### P2 — the window system has only part of the expected workstation vocabulary

`src/haunt/desktop.ts:353`: current titlebars support real move/minimize/close, but no maximize/restore or user resize. Existing drag/lifecycle work should be preserved. Add a coherent, bounded window-size model, including keyboard access and restore geometry; review frame/capture behavior during size changes. These are useful familiar affordances, not a requirement to implement a whole OS, real account login or fake network/settings panels. [Microsoft titlebar guidance](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/title-bar)

### P2 — information density and terminology compete with the fiction

`src/haunt/desktop.css:488`, `src/haunt/desktop.css:723`: several shell/status labels use 10–11 px, while large story headings occupy scarce space. In ECHO, the tray repeats counts and technical descriptions while the image that matters is small. A minimum-font assertion does not establish comfortable reading. This review did not compute a WCAG contrast ratio for the variable mist background.

Use a clear type hierarchy: approximately 14–16 px important body/action text, 12–13 px secondary system information, an intentional monospaced terminal scale and a human note style only where justified. Move technical diagnostics under an inspector; show one authoritative request status. Keep material/contrast legible across fog and active/inactive windows.

## Before / After / Why

The After column is a proposed next delivery, not changes made by this review.

| Before | After | Why |
| --- | --- | --- |
| Product headline and mission paragraphs on a gradient wallpaper | Plausible workstation desktop, actionable pending-job notification and actual case documents | Establish an OS rather than a website landing page |
| Mixed system conventions and missing size controls | One familiar window/taskbar convention, maximize/restore, bounded resize and accessible movement | Support ordinary PC expectations without building irrelevant OS features |
| Bell controls extend below the app | Visible contextual inspector replacing/reusing space | Discovery must work without automation's implicit scroll |
| Letter readiness depends on crop percentages and retained line count | Explicit source-negative contract plus independent picture framing | Preserve meaningful source choice and authorship while reducing recapture busywork |
| Repeated cute ghost sprite enlarged behind glass | Same presence expressed through output, reflection, pressure and deliberate material art | Keep identity while strengthening tone and scene composition |
| Four-card opening guide and explanatory transcript | Short contextual help with one relevant next experiment | Let the player learn by acting |
| Two-app checkpoint with disabled continuation | Actual four-program handoff and matching receipt/final release | Validate the promised whole story |

## Proposed OS composition

Choose a single HAUNT OS workstation dialect. Recommended: a familiar bottom taskbar with launcher and tray; app menus/chrome belong to their own windows. Remove the command-symbol decoration unless choosing a fully consistent alternative. Preserve the case's historical date as source metadata; no need to simulate a 1987 computer literally or change the user's system date.

```text
┌─────────────────────────────────────────────────────────────────┐
│ Quiet night-workstation wallpaper; no marketing headline         │
│                                                                 │
│ [Terminal]   ┌ TERMINAL — last.session       —  □  × ┐           │
│ [Echo]       │ ordinary output ... then one wrong line │         │
│ [case file]  │ prompt and useful, concise job state     │         │
│              └─────────────────────────────────────────┘         │
│                         captured-negative.plate                  │
│                         (actual saved content, openable)         │
│                                                                 │
│ glass presence appears because of the case's real milestone      │
├─────────────────────────────────────────────────────────────────┤
│ HAUNT  [Terminal •] [Echo •] ...       pending job · sound · time │
└─────────────────────────────────────────────────────────────────┘
```

A brief first-run Restoring last session transition can establish atmosphere, but must be skippable and absent on ordinary app use. No real account, password, prolonged login gate or fake working Wi-Fi/settings is needed. The actual desktop and apps must carry the impression of a system.

Actual file objects are valuable: a job file opens the original TERMINAL request; a kept negative opens that exact ECHO artifact; a finished letter opens its CANVAS version; a receipt opens its POSTMAN delivery. They must reference real case data, not become decorative extra applications.

Keep existing charcoal/petrol/bone/copper materials but replace placeholder gradients with an intentional quiet wallpaper, controlled depth and consistent icons. System UI uses a readable sans, TERMINAL its own mono and the letter its own human material. Make the first unsettling detail anomalous within something plausible; a dashboard that is spooky everywhere has little contrast left for the reveal.

## What to preserve and what not to inflate

- Preserve the shared case/glass source, actual drag/cancellation, native capture concept, request identity, authored ghost lines, storage validation and honest local-only delivery.
- Treat the bell intervention as a short clear introduction. A source-informed route reaches the glass in Follow -> Bell -> Stop the call -> Let it finish with zero returns. That is a design observation, not a demand to gate an Observe click or manufacture extra locks.
- Spend depth on meaningful framing/retention, transforming actual captured layers, sender-versus-recipient interpretation and the resulting personal letter. Do not add unrelated riddles just to count four puzzles.
- More animations, more apps, more code or more Kiro credits do not establish originality or enjoyment. A recognizable successful outcome and motivation to try another composition need observed use.
- Keep the planned short demonstration and optional exploration. Do not extend the mandatory route with settings, file-manager tutorials or long boot scenes merely to feel like an OS.

## Next delivery and acceptance

PROMPT_KIRO_04_SO_REAL_Y_CASO_COMPLETO.md is prepared as the next participant-operated IDE task. It should proceed through: fix actual usability/input defects; establish the desktop/window design; resolve the full-negative/crop contract; improve the signature presence; complete CANVAS/POSTMAN/receipt; and verify the connected case. It is not an executed Kiro run or a new source implementation by Codex.

Acceptance needs more than the previous 67 routes: selected Bell controls actionable without auto-scroll; radio keys correct; startup reads as a desktop; source/framing and resized windows agree; a negative/letter contains only actual captured data; editing invalidates stale receipts; Guest Inbox and restored TERMINAL show real resolution; pointer and keyboard can each complete the case; reload resumes correctly; and the final film can show a real end-to-end route. A first-use non-programmer session remains needed; a source-informed agent is not that participant.

### Guideline cross-check, terse file references

- `src/haunt/echo-view.ts:97` — radio role without the expected arrow/roving-focus behavior; reproduced, not hypothetical.
- `src/haunt/legacy-view.ts:68` / `src/haunt/desktop.css:664` — contextual action below the visible app work area at the target PC size; hit-test failed before scrolling.
- `src/haunt/desktop.css:488` / `src/haunt/desktop.css:723` — secondary type size needs a design/legibility pass; no unmeasured numerical contrast violation asserted.

Freshly consulted [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), the W3C radio pattern and Microsoft window guidance inform this focused review. They are references for behavior, not the hackathon's rubric and not a requirement to copy a branded operating system. No broader WCAG certification is claimed.

## Additive consistency pass

At the participant's subsequent explicit request, [review25 — consistency across the four programs](25_Consistency_Across_The_Four_Programs.md) adds concrete action vocabulary, full-capture/photo-frame purpose, immutable sent-letter versus editable-draft rules, artifact ownership, shared spatial/phase meaning and cross-app recovery scenarios. All findings and priorities above remain. The same prompt04 now includes that addendum; no previously specified improvement was removed and no v4 app behavior is claimed as implemented by this documentation pass.
