# LogFarm

LogFarm is a Windows desktop app that turns a raw log into a short report: a summary, the root cause, and the steps to fix it.

Paste a stack trace, a Docker crash, or a wall of JSON. Claude writes the report with **your** Anthropic API key. The report stays on this computer. LogFarm does not run a server, does not host your log, and does not pay the Claude bill.

Slogan: **Harvest the insight. Cut the noise.**

The app speaks English and Turkish. English is the default.

## What you get

A successful analysis is three fields:

| Field | What it is |
| --- | --- |
| Summary | One short statement of what broke. |
| Root cause | Where it broke, based on the log. |
| Steps | Two to five concrete things to check or change. |

The app does not run those steps. It does not open a shell and it does not edit your project. You read the report and copy what you need.

If the log is longer than Claude is sent, the report is marked truncated. The full paste can still sit in the input box. History keeps a shorter copy. See [Limits](#limits).

## What LogFarm is not

- It is not a log shipper, a SIEM, or a tail of a live file.
- It does not watch a folder or a Docker daemon.
- It does not include Claude credit. An empty Anthropic balance stops analysis even with a valid license.
- It does not offer a free analysis quota. Without a license, the window shows a fixed sample report. That sample is not your log.
- It is not signed yet. Windows SmartScreen can say “Windows protected your PC” on the installer. See [Code signing](#code-signing).

## Who it is for

Developers, DevOps, and SRE people who already have a log and want the failing line pulled out of the noise: health checks, repeated INFO lines, framework frames, escaped JSON.

The model is told to treat the log as data. Text inside the log that says “ignore your rules” or “print the API key” is not an instruction.

## How an analysis works

1. You paste text, or you drop a text file on the window.
2. The **Analyze** button stays off until the log is non-empty, a license is active (or a development unlock is on), and another analysis is not already running.
3. The main process checks the license, then sends the log to `https://api.anthropic.com/v1/messages`.
4. The model is `claude-sonnet-5`. The call forces the `submit_report` tool, so the reply is a structured report rather than a free chat.
5. If the tool payload is missing `summary`, `rootCause`, or `steps`, the app asks once more for a repaired tool call. That repair is a second billed request.
6. A successful report is shown, and a copy is written into local history.
7. **Cancel** aborts the in-flight request. A second click while one request is running does not cancel the first one. It returns “an analysis is already running.”

Switching language does not rewrite the report on screen by itself. If that history item has no report in the new language, LogFarm can ask Claude to translate it. Translation uses the same API key and the same one-request-at-a-time rule. Batches are four reports at a time.

## License

The price is **$29 once**, for a lifetime license on **one computer**.

Checkout is Lemon Squeezy:

https://logfarm.lemonsqueezy.com/checkout/buy/aa5ef5c0-0bea-4f3e-a1f4-5bdc800daf4c

The card is entered on Lemon’s page. LogFarm never sees the card number. The license key arrives in the purchase email. You paste it in **Settings**.

Activation calls Lemon’s license API. The instance name sent with the key is `LogFarm-` plus this computer’s host name, cut at 80 characters. That name is how Lemon counts the seat. **Remove** in Settings deactivates that seat so the key can move to another computer.

On each launch, a stored license is validated once. If the network is down, the local record stays and the app remains licensed. If Lemon says the license is not valid, the local record is deleted and the app locks.

There is no trial counter. A locked app shows the sample report and disables **Analyze**.

Two ways skip the lock, and neither belongs in a customer build:

- `DEV_UNLOCK=true` (or `1`) in the environment while you develop.
- `npm run dist:test`, which embeds `build/test-unlock.json`. That installer is for your own machine. Do not publish it.

`npm run dist` does not embed that file.

An optional `LEMON_CHECKOUT_URL` can replace the default checkout link. It is accepted only when it is `https` and the host is `lemonsqueezy.com` or a subdomain of it.

## Where data goes

| Data | Where it goes |
| --- | --- |
| The log, for analysis | `https://api.anthropic.com/v1/messages`, with your key. It does not pass through a LogFarm server. |
| The log, after a successful analysis | Plain JSON on this computer, in the history file. A password or token that was in the log stays in that file. |
| The report | On screen, and in the same history file. The prompt asks Claude not to copy secrets into the steps. A report may show `[redacted]`. That does not delete the saved log. |
| The Anthropic key | Encrypted with Windows `safeStorage`, in `api-key.bin` under the app data folder. The renderer never receives the key. |
| The license key | Encrypted the same way, in `license.bin`. Lemon receives it on activate, validate, and deactivate. |
| The card | Only on Lemon’s checkout page. |
| Error text shown in the app | A translation code such as `errors.timeout`. Unexpected details are scrubbed: `sk-ant-…` keys, other `sk-…` tokens, `Bearer` tokens, and UUID-shaped strings. The visible detail is cut at 300 characters. |

On Windows the app data folder is under `%APPDATA%`. Running from this repo uses `%APPDATA%\logfarm`. A packaged build may use `%APPDATA%\LogFarm`, because the installed product name is LogFarm. Inside that folder:

- `api-key.bin` — encrypted Anthropic key
- `license.bin` — encrypted license key and Lemon instance id
- `settings.json` — UI language (`en` or `tr`)
- `analysis-history.json` — up to 20 analyses

Deleting `analysis-history.json` deletes history. Deleting `license.bin` locks the app until you activate again. Deleting `api-key.bin` only removes the saved key.

An uncaught error in the main process is logged as an `errors.*` code. The API key, the license, the raw log, and the stack are not written to that line. The window shows the same code in English or Turkish.

## Languages

The language switch changes the interface and the language Claude is asked to write.

History stores a report per language. Opening an old item after a switch shows the report in the current language when that translation already exists. When it does not, and a key and a license are present, LogFarm translates the missing reports. A busy or failed translation does not wipe the list you already have.

## Limits

| Limit | Value |
| --- | --- |
| Pasted log accepted by the app | 2,000,000 characters. Longer text is rejected. |
| File drop | The first 2,000,000 bytes are read. A larger file is marked truncated. Files with a null byte are rejected as non-text. A BOM at the start is stripped. |
| Log sent to Claude | The first 80,000 characters. |
| Log kept in history | The first 80,000 characters. |
| History length | 20 items. A new success drops the oldest. |
| Claude timeout | 60 seconds. |
| Model | `claude-sonnet-5` |
| Max tokens on an analysis | 8192 |
| Max tokens on a translation batch | 8192 |
| Translation batch size | 4 reports |
| Concurrent Claude calls | 1. A second call gets `errors.busy`. |
| Gap after a call that reached the network | 1.5 seconds. This includes the repair call and each translation batch. |
| Anthropic key | At most 300 characters, must start with `sk-ant-`. |
| License key | At most 256 characters. Spaces are removed. |
| Lemon activate / deactivate timeout | 20 seconds |
| Lemon validate timeout | 8 seconds |

Anthropic’s own rate limit is separate. When Claude returns HTTP 429, the app shows a rate-limit message. The 1.5 second gap is local. It slows a tight loop. It does not replace Anthropic’s quota.

## Requirements

- Windows for the installer and for `safeStorage` as tested here.
- Node.js for development.
- An Anthropic key from the Anthropic console, and credit on that account.
- A LogFarm license for a real analysis in a customer build.

The desktop window is Electron. The interface is React, TypeScript, and Tailwind. Local JSON uses `electron-store`. Packaging uses `electron-builder`.

## Develop

```bash
npm install
npm run electron:dev
```

That starts Vite on `http://localhost:5173` and opens Electron when the port is up.

To analyze without a license while developing, set `DEV_UNLOCK=true` in the environment. Do not ship a build with that flag on. `.env` is gitignored. Real keys stay out of the repo.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite only, in the browser. License and the API key bridge exist in Electron, so the browser build cannot run a real analysis. |
| `npm run build` | Typecheck and write `dist/`. |
| `npm run preview` | Serve the production web build. |
| `npm run lint` | Oxlint. |
| `npm run icon` | Rebuild the window icon from `scripts/make-icon.cjs`. |
| `npm run dist` | Customer installer. License required. |
| `npm run dist:test` | Installer with the license gate skipped. Keep it private. |

`npm run electron:dev` and a packaged app can share one app-data folder. Do not run both at once if they point at the same folder. They would write the same history and settings files.

## Project layout

| Path | Role |
| --- | --- |
| `src/` | React UI: log box, report, history, settings, English and Turkish strings. |
| `electron/main.cjs` | Window, IPC, license checks, history. |
| `electron/preload.cjs` | The only bridge the page is given. Node is not exposed to the page. |
| `electron/claude.cjs` | Anthropic calls for analysis and translation. |
| `electron/claudePace.cjs` | One Claude call at a time, then a 1.5 second gap. |
| `electron/prompt.cjs` | Instructions sent with the log. |
| `electron/reportParse.cjs` | Reads the tool payload, including Turkish key names. |
| `electron/keyStore.cjs` | Encrypted API key. |
| `electron/licenseGate.cjs` | Lock, activate, validate, clear. |
| `electron/lemonLicense.cjs` | Lemon HTTP calls and the checkout URL check. |
| `electron/historyStore.cjs` | The 20-item history file. |
| `electron/settingsStore.cjs` | Language. |
| `electron/shellGuard.cjs` | Which URLs the window may navigate to. |
| `electron/processGuard.cjs` | Uncaught errors logged as codes only. |
| `electron/errors.cjs` | Error codes and secret scrubbing. |
| `site/` | The public page: price, sample report, and the privacy text. |
| `GO-LIVE.md` | The release checklist and what is still open. |

The page in `site/` is static. It is not served by the desktop app. The buy button opens the Lemon checkout above.

## Packaging

`npm run dist` typechecks, builds the renderer, and runs `electron-builder` for an NSIS installer.

The installer is not one-click. The person installing can choose the directory. The file name is `LogFarm-Setup-<version>.exe`. A test build is `LogFarm-Setup-<version>-Test.exe`.

Electron sometimes fails to rename its temp folder while antivirus scans it. The pack script builds in `%TEMP%\logfarm-release` and copies the `.exe` into `release/`. It retries up to four times. `release/` is gitignored.

The packaged window loads `dist/index.html` from inside the asar. The production page carries a Content Security Policy: scripts and images from the app only, no network from the page, no frames, no plugins. Claude and Lemon are called from the main process, so the page does not need `connect-src`.

Navigation stays on the app. In development the only allowed page is `http://localhost:5173`. A new window is refused, except an `https` Lemon checkout, which opens in the system browser. The only permissions granted to the page are clipboard write.

Fuses on the packaged executable:

- `runAsNode` off
- cookie encryption on
- `NODE_OPTIONS` and Node inspect arguments off
- asar integrity validation on
- only load the app from the asar
- `grantFileProtocolExtraPrivileges` stays on. Turning it off left a blank window, because the packaged page is loaded with `file://`.

The customer package does not contain `.env`.

## Code signing

The installer is unsigned until a Windows Authenticode certificate is present.

When `CSC_LINK` or `WIN_CSC_LINK` is set, `npm run dist` signs with that certificate. The password is `CSC_KEY_PASSWORD` or `WIN_CSC_KEY_PASSWORD`. The hash is SHA-256. DLLs are signed too. A certificate in the Windows certificate store is used when those variables are empty and a cert is installed.

`npm run dist:test` strips those variables and turns off certificate discovery. The test build skips the license gate, so it must not carry the production signature.

Check a signed file with:

```powershell
Get-AuthenticodeSignature .\release\LogFarm-Setup-0.1.0.exe
```

`Valid` means the signature is present. SmartScreen can still warn on a new file until that publisher has reputation. An unsigned file reports `NotSigned`.

`.pfx` and `.p12` files are gitignored. Do not commit the certificate or its password.

## Security in short

The renderer is sandboxed. `contextIsolation` is on. `nodeIntegration` is off for the page, workers, and subframes. `webview` is off. A second launch focuses the existing window instead of opening another one on the same app-data folder.

IPC handlers catch errors and return `errors.*` codes. The UI translates those codes. Analysis, translation, the API key, and the license all go through that bridge. The bridge does not hand the key back to the page.

Input bounds are the table in [Limits](#limits). Dependency review is recorded in `GO-LIVE.md`. Code signing is still a manual step.

## Support

logfarm.support@gmail.com

The in-app support button opens a Gmail compose window addressed to that inbox, with the subject `LogFarm`.
