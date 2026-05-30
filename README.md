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
- Start, Pause, Resume, and Cancel controls
- Smooth live countdown with a progress bar
- End-of-timer warning pulse below 10 seconds
- Optional + button to add time back to a running timer without restarting it
- Optional finish time on the state row (e.g. `ends 14:35`)
- Tap, hold, and double-tap actions on the time — more-info, navigate, call a service, reset the dialed duration, and more
- Theme-aware — uses HA's CSS variables, looks native in any theme
- State labels (`Idle` / `Running` / `Paused`) follow your Home Assistant language
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
| `show_finish_time`        | `boolean` | `false`                                | Show the wall-clock time the timer ends (e.g. `Running · ends 14:35`). Appears on the state row while running or paused; rides its own line when `hide_state` is set. Crossing midnight adds a `+1d` marker. |
| `hide_icon`               | `boolean` | `false`                                | Hide the icon.                                                                                                                       |
| `hide_name`               | `boolean` | `false`                                | Hide the name. (If both icon and name are hidden, the header row disappears.)                                                        |
| `hide_state`              | `boolean` | `false`                                | Hide the state label (`Idle` / `Running` / `Paused`).                                                                                |
| `warn_threshold_seconds`  | `number`  | `10`                                   | Seconds below which the countdown turns warning-color and pulses. `0` disables the warning.                                          |
| `adjust`                  | `boolean` | `false`                                | Show a `+` button beside the time to add time back to a **running** timer (via `timer.change`, no cancel-and-restart). Active-only; hidden if your HA core lacks `timer.change`. |
| `adjust_step`             | `number`  | `60`                                   | Seconds added per `+` tap. HA won't extend a timer past its original duration, so `+` is disabled until at least this many seconds have elapsed.                               |
| `tap_action`              | `object`  | open duration modal                    | Action when the time is tapped. Standard HA action object. Supported actions: `more-info`, `navigate`, `url`, `call-service`, `none`, plus `reset-duration`. Omit for the default modal.    |
| `hold_action`             | `object`  | none                                   | Action when the time is pressed and held (~0.5 s). Same shape as `tap_action`. Does nothing unless set.                              |
| `double_tap_action`       | `object`  | none                                   | Action when the time is double-tapped (~0.25 s window). Same shape as `tap_action`. Does nothing unless set.                         |

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

### Hold & double-tap

`hold_action` and `double_tap_action` take the same action object as `tap_action`
and both default to doing nothing. Hold is a ~0.5 s press; double-tap is two taps
within ~0.25 s. (When a `double_tap_action` is set, a single tap waits out that
window before firing.)

```yaml
tap_action:
  action: none           # read-only at a tap…
hold_action:
  action: more-info      # …but hold opens the details popup
```

### Reset the dialed duration

`reset-duration` clears a duration you dialed in via the modal, reverting the
display to the helper's stored `duration`. It's a card action value (not in the
visual editor's action dropdown), so set it in YAML — typically on hold:

```yaml
hold_action:
  action: reset-duration
```

### Adjust a running timer

Set `adjust: true` to show a `+` button beside the time. Each tap calls
`timer.change` to add `adjust_step` seconds back to the **running** timer in
place — no cancel and restart, so the finish time just shifts out. Set the step
with `adjust_step` (seconds, default 60).

```yaml
type: custom:simple-timer-card
entity: timer.coffee
adjust: true
adjust_step: 30
```

Home Assistant won't let a timer be extended **beyond its original duration**, so
`+` only adds time you've already counted down: it stays greyed out until at
least one step has elapsed, and tops out at the configured duration. The button
only appears while the timer is active (HA's `timer.change` doesn't apply to idle
or paused timers), and is hidden entirely if your Home Assistant core predates
the `timer.change` service.

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
adjust: true
adjust_step: 30
show_finish_time: true
tap_action:
  action: more-info
```

## Behaviour notes

- **Click the time → modal → Save → Start**: the dialed duration is passed to `timer.start` as a one-shot override. The helper's stored default duration is *not* modified.
- **Resume after Pause**: calls `timer.start` without a duration, so the timer continues from the remaining time at the moment of pause.
- **Automations**: any automation triggered by the `timer.finished` event (the "Minuterie terminée" trigger) fires at the dialed duration, since HA's `finishes_at` reflects the override.
- **Clock skew**: the countdown is computed via a browser-local stopwatch anchored to HA's `finishes_at` at the moment the card sees the transition to active, so small differences between your browser clock and your HA host clock don't visibly affect the displayed time.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the local
dev setup and the branch / commit / pull-request / release conventions.

## License

[MIT](LICENSE)
