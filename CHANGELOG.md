# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `hold_action` and `double_tap_action` on the time element, mirroring the
  existing `tap_action` shape. Both default to doing nothing.
- New `reset-duration` action value that clears a dialed-in duration, reverting
  the display to the helper's stored `duration` (e.g. `hold_action: { action: reset-duration }`).
- `adjust` (with optional `adjust_step`, default 60 s) shows a `+` button that
  adds time back to a running timer in place via `timer.change`. Active-only; the
  `+` is disabled until a full step has elapsed (Home Assistant rejects extending
  a timer beyond its original duration) and hidden when the core lacks
  `timer.change`.

### Changed

- State labels (`Idle` / `Running` / `Paused`) are now localized via Home
  Assistant's translations, falling back to English.
- The time element is now interactive in every state when a tap/hold/double-tap
  action is configured (previously the configured tap only applied while idle).

### Fixed

- Console banner now reports the actual bundle version instead of a hardcoded one.

## [0.2.0] — 2026-05-29

### Added

- Hide-elements options to selectively show/hide card components.
- Additional customization options.

### Changed

- Thicker progress bar.

## [0.1.0] — 2026-05-27

### Added

- Initial release.
- View any HA `timer.*` entity with a live countdown.
- Click the time to edit duration in a modal (H/M/S inputs).
- Start, Pause, Resume, and Cancel controls.
- Progress bar showing elapsed fraction; warning pulse below 10 s.
- Compact layout (`compact: true`) for stacking timers.
- Icon and name overrides.
- Visual editor based on `ha-form` (entity picker, name, icon, compact toggle).
- Theme-aware styling via HA CSS variables.
- Browser-local stopwatch anchored to `finishes_at` at the moment of state transition — avoids visible clock skew between browser and HA host.

[0.2.0]: https://github.com/Jeremy0404/simple-timer-card/releases/tag/v0.2.0
[0.1.0]: https://github.com/Jeremy0404/simple-timer-card/releases/tag/v0.1.0
