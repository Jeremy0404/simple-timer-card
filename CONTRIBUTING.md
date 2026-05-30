# Contributing to Simple Timer Card

Thanks for your interest in improving Simple Timer Card! This guide covers the
local development setup and the conventions for branches, commits, pull requests,
and releases.

## Project layout

- `src/simple-timer-card.ts` — the card element
- `src/simple-timer-card-editor.ts` — the visual editor
- `src/tap-controller.ts` — tap / hold / double-tap gesture state machine
- `src/utils.ts` — pure duration parse/format helpers (unit-tested in `utils.test.ts`)
- `src/types.ts` — HA surface + card config types

---

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
3. **Verify in the browser console** that you see the `SIMPLE-TIMER-CARD` banner — that confirms the fresh bundle loaded.

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

### Scripts

```sh
npm run build          # one-shot production build → dist/ (HACS-ready)
npm run deploy         # one-shot dev build → also copies to the Pi
npm run dev:deploy     # watch mode → rebuild + copy on every save (main dev loop)
npm run dev            # watch mode → rebuild only, no copy
npm run typecheck      # tsc --noEmit
npm run lint           # eslint src
npm run lint:fix       # eslint src --fix
npm test               # vitest run (one-shot)
npm run test:watch     # vitest in watch mode
```

### Troubleshooting

**Card shows "Custom element doesn't exist: simple-timer-card-dev".** The bundle didn't load. Open the browser console — if you don't see the `SIMPLE-TIMER-CARD-DEV` banner (purple background):

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

---

## Conventions

### Code

Follow the SOLID principles:

- **Single responsibility** — a class/module/function does one thing (e.g. gesture timing lives in `TapController`, not in the card).
- **Open/closed** — extend behaviour by adding, not by editing what works (new actions slot into the action switch; new config is additive).
- **Liskov substitution** — implementations honour the contract their type implies.
- **Interface segregation** — keep types and option bags narrow; don't force callers to depend on fields they don't use.
- **Dependency inversion** — depend on abstractions, not concretions (e.g. `TapController` takes action callbacks; it knows nothing about Home Assistant).

Prefer code that explains itself over a comment. Before writing one, extract the
value into a well-named `const` or the block into a well-named function. A comment
is justified only when it carries a *why* the code cannot — a non-obvious
rationale, an external-system contract, a browser/HA quirk, or a deliberate
workaround. Never restate *what* the code does.

**A change isn't done until it passes `typecheck`, `lint`, `test`, and `build`.**
CI runs all four on every pull request.

A **new config option** needs all of: validation in `setConfig`, a row in the
editor schema, a README config-table entry, and a `CHANGELOG.md` note.

### Branch naming

Branch off `main` using `type/short-kebab-desc`, optionally prefixed with an
issue number:

```
feat/double-tap-action
fix/123-paused-countdown-drift
chore/bump-vite
docs/contributing-guide
refactor/tap-controller
```

The `type` is one of the Conventional Commit types below and matches the kind of
change on the branch.

### Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <imperative summary>

<optional body explaining the why>
```

Types: `feat` `fix` `chore` `docs` `refactor` `test` `ci` `build` `perf`.

```
feat(actions): add double_tap_action to the time element
fix: report the actual bundle version in the console banner
docs: split dev guide out of the README
```

Keep the type lowercase, the summary imperative ("add", not "added"), and the
subject line short. Local commits don't have to be perfect — pull requests are
**squash-merged**, so it's the **PR title** that lands on `main` (see below).

### Pull requests

1. Open a PR against `main` from your `type/...` branch.
2. **The PR title must be a valid Conventional Commit** — it becomes the
   squash-merge commit message on `main`, and CI fails the PR otherwise.
3. Fill in the PR template: what & why, linked issue, and the checklist.
4. CI must be green. Three checks gate the merge:
   - **verify** — `typecheck` → `lint` → `test` → `build`.
   - **HACS** — repository / `hacs.json` validation.
   - **PR Title** — Conventional Commit title lint.
5. Update `CHANGELOG.md` under `[Unreleased]` for any user-facing change.

`main` is protected: no direct pushes, linear history, squash-merge only.

### Releases

Releases are cut manually from `main`:

1. Create a `chore: release vX.Y.Z` commit that:
   - bumps `version` in `package.json`,
   - moves the `[Unreleased]` notes into a dated `## [X.Y.Z] — YYYY-MM-DD`
     section in `CHANGELOG.md`, and adds the compare/tag link at the bottom.
2. Tag it: `git tag vX.Y.Z && git push origin main --tags`.
3. The **Release** workflow runs `typecheck` → `lint` → `test` → `build` on the
   tag, then attaches `dist/simple-timer-card.js` to the GitHub release. A broken
   commit can't ship.

Follow [Semantic Versioning](https://semver.org/): `MAJOR` for breaking config
changes, `MINOR` for new options/features, `PATCH` for fixes.
