# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

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

[0.1.0]: https://github.com/Jeremy0404/simple-timer-card/releases/tag/v0.1.0
