# Contributing

Thanks for considering a contribution to MediaFlow.

## Package manager

This repo uses **pnpm only**. Do not commit `package-lock.json` or `yarn.lock`; the
`pnpm-lock.yaml` in the repo root is the single source of truth. Install dependencies
with:

```bash
pnpm install
```

## Development loop

```bash
pnpm dev          # ray develop — hot-reloading Raycast dev session
pnpm lint          # eslint .
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest run
```

Run `pnpm test && pnpm typecheck` before pushing — CI (`.github/workflows/test.yml`)
runs `pnpm lint`, `pnpm typecheck`, and `pnpm test` on every pull request and on push
to `main`, and will fail the same way locally as it does in CI.

## Adding a new media source

See [`ADDING_NEW_SOURCE.md`](./ADDING_NEW_SOURCE.md) for the full walkthrough:
copying `src/providers/spotify.ts`, implementing `SourceProvider`, registering in
`src/core/setup.ts`, and mirroring `tests/providers/spotify.test.ts`.

## Pull requests

- **PR titles are Conventional Commits and CI-enforced**
  (`.github/workflows/pr-title.yml`, `amannn/action-semantic-pull-request`). Allowed
  types: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`,
  `revert`. The subject must not start with an uppercase letter.
- **PRs are squash-merged.** The squash commit subject is the PR title, and that is
  what `.github/workflows/bump-version.yml` (semantic-release, running on pushes to
  `main`) reads to decide whether — and how — to cut a release. A non-conforming PR
  title means no release, so get the title right before merge, not just at open time.
- Keep changes scoped; if you're touching provider code, add or update tests in the
  matching `tests/providers/*.test.ts` file.

## License

By contributing, you agree your contribution is licensed under the project's MIT
license (see [`LICENSE`](../LICENSE)).
