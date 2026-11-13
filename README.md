# Please Haunt Yourself

A Halloween mystery inside a fictional desktop. A session from 1987 keeps repeating its last minute. Follow the unfinished job across **TERMINAL**, **ECHO**, **CANVAS**, and **POSTMAN** to discover what Mara left behind.

**[Play in your browser](https://gustavogarciapucp.github.io/please-haunt-yourself/)**

Built for the **Costume Contest** category of [Kiroween 2026](https://kiroween.devpost.com/).

## Play

Use a desktop browser and open **TERMINAL** from the taskbar. Follow what changes on the desktop and across its programs. The main route works with on-screen controls. The session is complete when **Session finished** appears. Open the **HAUNT** menu to find **Start the case over…**.

## Run locally

With Node.js 22.13.1 and npm, run the following from the repository root.

```sh
npm ci
npm run build
npm run preview
```

Open the URL printed by Vite. The home page opens the game. The earlier paper-theatre prototype, **The Wrong Window**, is available at `/workshop.html`.

Run `npm test` for the unit suite and `npm run test:browser` for the workshop browser suite. To check the main case against a local preview on port 5174, run `npm run preview -- --port 5174 --strictPort` and run `npm run check:case` in a second terminal.

## How Kiro helped

The participant used Kiro CLI for the early window and application foundations, then used Kiro IDE to develop the linked four-program case and refine its interactions. Codex contributed design review, independent QA, and release preparation. The [Kiro development record](docs/kiro-usage.md) identifies each tool's contributions and links to the implementation evidence.

- [Four-program case](.kiro/specs/os-case-v4/requirements.md) and its [implementation and checks](.kiro/specs/os-case-v4/tasks.md)
- [Typing and window-focus polish](.kiro/specs/fluid-typing-v9/tasks.md) and the [reproducible build repair](.kiro/specs/reproducible-build-v9/tasks.md)
- [Independent build verification](docs/development/34_V9_Build_Repair_Independent_Verification.md) and [development dates](docs/development/32_Development_Dates_And_Submission_Provenance.md)

## License

[MIT](LICENSE). The Pages distribution includes Vite's license for its generated runtime helper.
