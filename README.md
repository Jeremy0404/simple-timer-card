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

| Option    | Type      | Required | Default                          | Description                                                                |
| --------- | --------- | -------- | -------------------------------- | -------------------------------------------------------------------------- |
| `entity`  | `string`  | yes      | —                                | A `timer.*` entity ID.                                                     |
| `name`    | `string`  | no       | Entity's `friendly_name`         | Card title override.                                                       |
| `icon`    | `string`  | no       | Entity's `icon` or `mdi:timer-outline` | MDI icon shown next to the name.                                     |
| `compact` | `boolean` | no       | `false`                          | Denser layout — smaller padding, time, and buttons.                        |

## Behaviour notes

- **Click the time → modal → Save → Start**: the dialed duration is passed to `timer.start` as a one-shot override. The helper's stored default duration is *not* modified.
- **Resume after Pause**: calls `timer.start` without a duration, so the timer continues from the remaining time at the moment of pause.
- **Automations**: any automation triggered by the `timer.finished` event (the "Minuterie terminée" trigger) fires at the dialed duration, since HA's `finishes_at` reflects the override.
- **Clock skew**: the countdown is computed via a browser-local stopwatch anchored to HA's `finishes_at` at the moment the card sees the transition to active, so small differences between your browser clock and your HA host clock don't visibly affect the displayed time.

## Development

```sh
npm install
npm run build          # production build → dist/simple-timer-card.js
npm run deploy         # build with dev cache-busting → copies to a HA config share
npm run dev:deploy     # watch mode + auto-redeploy on save
npm run typecheck      # tsc --noEmit
```

The deploy scripts assume a Home Assistant `config` SMB share at `\\<HA-IP>\config\` — edit `DEPLOY_DEST` in `vite.config.ts` to match your setup. For local iteration, register the bundled `simple-timer-card-loader.js` (not the main bundle) as your dashboard resource — the loader injects a `Date.now()` cache-buster on every page load so you never need to manually bump `?v=` during development.

## License

[MIT](LICENSE)
