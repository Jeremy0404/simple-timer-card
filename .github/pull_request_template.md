<!--
The PR title must follow Conventional Commits (feat: / fix: / chore: / docs: …).
It becomes the squash-merge commit on main, and CI fails the PR otherwise.
-->

## What & why

<!-- What does this change do, and why? Link any related issue, e.g. Closes #123 -->

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] `CHANGELOG.md` `[Unreleased]` updated (for user-facing changes)
- [ ] README config table updated (if a config option was added/changed)
- [ ] Tested in a running Home Assistant instance
