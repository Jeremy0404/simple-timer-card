# Simple Timer Card

[![hacs](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)
[![GitHub release](https://img.shields.io/github/v/release/Jeremy0404/simple-timer-card)](https://github.com/Jeremy0404/simple-timer-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A clean, minimal Lovelace card for Home Assistant `timer` helpers. View the countdown, click to change the duration, start/pause/resume/cancel — all from a single card.

<!-- Add a screenshot at docs/screenshot.png and uncomment:
![Screenshot](docs/screenshot.png)
-->

## Features

- Click the time to edit duration in a modal (hours / minutes / seconds)
- Start, Pause, Resume, Cancel controls
- Smooth live countdown with a progress bar
- End-of-timer warning pulse below 10 seconds
- Theme-aware — uses HA's CSS variables, looks native in any theme
- Compact mode for stacking several timers on one dashboard
- Icon and name overrides
- Visual editor — no YAML required to add the card

## Installation

### HACS (custom repository)

1. Open **HACS → Frontend → ⋮ (top right) → Custom Repositories**
2. Repository URL: `https://github.com/Jeremy0404/simple-timer-card`
3. Type: `Plugin`
4. Click **Add**, then install **Simple Timer Card**
5. Refresh your browser

HACS handles the resource registration and cache-busting automatically.

### Manual

1. Download `simple-timer-card.js` from the [latest release](https://github.com/Jeremy0404/simple-timer-card/releases/latest)
2. Copy it to `<config>/www/community/simple-timer-card/simple-timer-card.js`
3. Add the resource under **Settings → Dashboards → Resources**:
   - URL: `/local/community/simple-timer-card/simple-timer-card.js`
   - Type: **JavaScript module**
4. Hard-refresh your browser

## Usage

### Visual editor

In edit mode, **Add Card → Simple Timer**. Pick your timer entity in the form. Done.

### YAML

Minimal:

```yaml
type: custom:simple-timer-card
entity: timer.coffee
```

With all options:

```yaml
type: custom:simple-timer-card
entity: timer.coffee
name: Morning coffee
icon: mdi:coffee
compact: false
```

## Configuration

| Option                    | Type      | Default                                | Description                                                                                                                          |
| ------------------------- | --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `entity`                  | `string`  | — *(required)*                         | A `timer.*` entity ID.                                                                                                               |
| `name`                    | `string`  | Entity's `friendly_name`               | Card title override.                                                                                                                 |
| `icon`                    | `string`  | Entity's `icon` or `mdi:timer-outline` | MDI icon shown next to the name.                                                                                                     |
| `color`                   | `string`  | —                                      | CSS color used as the accent (primary buttons, progress bar, active state, focus rings). Any CSS color: `#e91e63`, `tomato`, `rgb(…)`. |
| `compact`                 | `boolean` | `false`                                | Denser layout — smaller padding, time, and buttons.                                                                                  |
| `show_progress`           | `boolean` | `true`                                 | Show the thin progress bar at the bottom of the card.                                                                                |
| `hide_icon`               | `boolean` | `false`                                | Hide the icon.                                                                                                                       |
| `hide_name`               | `boolean` | `false`                                | Hide the name. (If both icon and name are hidden, the header row disappears.)                                                        |
| `hide_state`              | `boolean` | `false`                                | Hide the state label (`Idle` / `Running` / `Paused`).                                                                                |
| `warn_threshold_seconds`  | `number`  | `10`                                   | Seconds below which the countdown turns warning-color and pulses. `0` disables the warning.                                          |
| `tap_action`              | `object`  | open duration modal                    | Standard HA action object. Supported actions: `more-info`, `navigate`, `url`, `call-service`, `none`. Omit for the default modal.    |

### `tap_action` recipes

Read-only display:

```yaml
tap_action:
  action: none
```

Open HA's entity-details popup:

```yaml
tap_action:
  action: more-info
```

Call a script:

```yaml
tap_action:
  action: call-service
  service: script.start_pomodoro
  service_data:
    duration: 1500
```

Jump to another dashboard:

```yaml
tap_action:
  action: navigate
  navigation_path: /lovelace/timers
```

### Example using everything

```yaml
type: custom:simple-timer-card
entity: timer.coffee
name: Morning coffee
icon: mdi:coffee
color: "#9c27b0"
compact: true
hide_state: true
warn_threshold_seconds: 5
tap_action:
  action: more-info
```

## Behaviour notes

- **Click the time → modal → Save → Start**: the dialed duration is passed to `timer.start` as a one-shot override. The helper's stored default duration is *not* modified.
- **Resume after Pause**: calls `timer.start` without a duration, so the timer continues from the remaining time at the moment of pause.
- **Automations**: any automation triggered by the `timer.finished` event (the "Minuterie terminée" trigger) fires at the dialed duration, since HA's `finishes_at` reflects the override.
- **Clock skew**: the countdown is computed via a browser-local stopwatch anchored to HA's `finishes_at` at the moment the card sees the transition to active, so small differences between your browser clock and your HA host clock don't visibly affect the displayed time.

## Development

### Prerequisites

- **Node.js 20+** (`node --version` to check).
- **Home Assistant** running on your network, with its `config` directory exposed as an SMB share. On HAOS this means installing and starting the **Samba share** add-on (Settings → Add-ons → Samba share).
- A **timer entity** in HA to point the card at — see [Create a test timer](#create-a-test-timer) below.

### Setup (one-time)

1. **Clone and install:**

   ```sh
   git clone https://github.com/Jeremy0404/simple-timer-card.git
   cd simple-timer-card
   npm install
   ```

2. **Point the deploy script at your HA share.** Open [`vite.config.ts`](vite.config.ts) and edit the `DEPLOY_DEST` constant:

   ```ts
   const DEPLOY_DEST = '//192.168.1.177/config/www/community/simple-timer-card-dev';
   ```

   Replace `192.168.1.177` with your HA host's IP. Forward slashes work on Windows, macOS, and Linux when the share is reachable. (On macOS/Linux, mount the share first — e.g. `//host/config` mounted at `/Volumes/config` — and use the mount point.)

   > **Why a `-dev` folder?** HACS owns `/config/www/community/simple-timer-card/` and writes pre-gzipped `.js.gz` files there. HA's web server serves those `.gz` files preferentially to every browser that accepts gzip — which is all of them. If dev deploys into the same folder, the stale `.gz` from HACS shadows your fresh `.js` and you load the wrong bundle. Keeping dev in its own folder avoids that fight entirely.

3. **First build & deploy:**

   ```sh
   npm run deploy
   ```

   This produces two files in `dist/` and copies both to `<config>/www/community/simple-timer-card-dev/` on the Pi:

   - `simple-timer-card.js` — the actual card bundle.
   - `simple-timer-card-loader.js` — a tiny (~300 B) loader that imports the bundle with a runtime cache-buster.

4. **Register the loader as a Lovelace resource** in Home Assistant:

   - **Settings → Dashboards → ⋮ (top-right) → Resources → Add resource**
   - **URL:** `/local/community/simple-timer-card-dev/simple-timer-card-loader.js`
   - **Resource type:** JavaScript module
   - **Create**

   You only do this once. The loader stays put across builds and bakes a `Date.now()` cache-buster into every page load — so subsequent edits land on a normal refresh, no URL fiddling.

5. **Add the card to a dashboard:**

   - Open any dashboard → edit mode → **+ Add card** → search for **Simple Timer (Dev)** in the picker.
   - Or via YAML:

     ```yaml
     type: custom:simple-timer-card-dev
     entity: timer.dev_test
     ```

   > **Note the `-dev` suffix.** Dev builds register under `<simple-timer-card-dev>` so you can run them alongside a HACS-installed production card on the same dashboard. The picker shows two entries — *Simple Timer* (prod) and *Simple Timer (Dev)* — and the dev console banner prints in purple to make it visually obvious which is which. Production builds (`npm run build`, HACS) keep the unprefixed `<simple-timer-card>` tag.

### The dev iteration loop

Run the watcher once:

```sh
npm run dev:deploy
```

Then for each change you make:

1. **Save the file.** Vite rebuilds and copies to the Pi (you'll see `[deploy] copied bundle + loader -> ...` in the terminal).
2. **Hard-refresh the dashboard tab** (`Ctrl+Shift+R` on Windows/Linux, `Cmd+Shift+R` on macOS).
3. **Verify in the browser console** that you see the `SIMPLE-TIMER-CARD v0.1.0` banner — that confirms the fresh bundle loaded.

That's the whole loop. No resource URL bumps, no service-worker workarounds.

### Create a test timer

Easiest path, via the HA UI:

- **Settings → Devices & Services → Helpers → Create helper → Timer**
- Name: `Dev test`, Duration: `00:00:30` — leaves the entity ID as `timer.dev_test`.

Or in `configuration.yaml`:

```yaml
timer:
  dev_test:
    duration: "00:00:30"
    name: Dev test
```

Then restart HA (Settings → System → Restart) or call the **timer** integration's reload service.

### All scripts

```sh
npm run build          # one-shot production build → dist/ (HACS-ready)
npm run deploy         # one-shot dev build → also copies to the Pi
npm run dev:deploy     # watch mode → rebuild + copy on every save (main dev loop)
npm run dev            # watch mode → rebuild only, no copy
npm run typecheck      # tsc --noEmit
npm run lint           # eslint src
npm run lint:fix       # eslint src --fix
npm test               # vitest run (one-shot — 16 tests on utils)
npm run test:watch     # vitest in watch mode
```

CI runs typecheck → lint → test → build on every `v*` tag push before attaching the bundle to the GitHub release, so a broken commit can't ship.

### Troubleshooting

**Card shows "Custom element doesn't exist: simple-timer-card-dev".** The bundle didn't load. Open the browser console — if you don't see the `SIMPLE-TIMER-CARD-DEV v0.1.0` banner (purple background):

- Confirm the resource URL is the **loader** under `simple-timer-card-dev/` (not the bundle, and not the HACS-owned `simple-timer-card/` folder).
- Confirm the file is actually on the Pi: `ls //<HA-IP>/config/www/community/simple-timer-card-dev/` should list both files.
- If you see `.gz` files alongside the `.js` ones, you've collided with the HACS folder. Move `DEPLOY_DEST` to a dev-only path (default: `simple-timer-card-dev/`) and redeploy.
- Hard-refresh once more.

**Card shows "Custom element doesn't exist: simple-timer-card" instead.** Your dashboard YAML refers to the *production* tag but only the dev build is installed (or vice-versa). Use `custom:simple-timer-card-dev` for the dev build, `custom:simple-timer-card` for HACS-installed prod.

**Changes don't appear after editing.** A hard refresh should always work because the loader appends `?v=<timestamp>` to the bundle URL on every page load. If it doesn't:

- Open DevTools → **Application** → **Service Workers** → click **Update** and reload.
- One-time nuclear option: edit the registered resource URL and append `?v=99` to the *loader* itself. Only needed if you've changed `loader.ts`.

**`[deploy] copied ...` doesn't appear in the watcher.** Vite rebuilds, but the SMB copy failed:

- Check the share is reachable: `ls //<HA-IP>/config/` from your terminal.
- On HAOS, the Samba add-on must allow write access and you must be authenticated. On Windows, opening `\\<HA-IP>\config` in File Explorer once authenticates the session.

**Visual editor renders blank.** HA's internal `ha-form`, `ha-entity-picker`, `ha-icon-picker`, and `ui_action` selector are used. They've been stable since HA 2023.1, but a future rename would silently break the form. The card itself isn't affected — fall back to YAML mode.

**Build warns `new URL(...) doesn't exist at build time`.** Intentional — the loader resolves the bundle URL at runtime relative to wherever HA serves it from. Leave the warning be.

## License

[MIT](LICENSE)
