# iTrustCircle

Monorepo:

- `apps/mobile`: SvelteKit + Capacitor v7 (Android)

This repo is intentionally minimal: code lives in `apps/`, specs live in `docs/`.

## Quick start

```bash
pnpm -C apps/mobile install
pnpm -C apps/mobile dev
Build & run on Android
bash
Copy code
pnpm -C apps/mobile build
pnpm -C apps/mobile exec cap sync
pnpm -C apps/mobile exec cap open android
# or:
pnpm -C apps/mobile exec cap run android
```

## Project specs (source of truth)

docs/prd/ — PRD + user journey + failure modes

docs/adr/ — key decisions (do not keep them in chat only)

docs/dev/acceptance-checklist.md — release gate (manual test steps)

## Capacitor workflow rules

Web build -> cap sync -> run/open

Never edit copied web assets inside native projects. Always rebuild web then sync.

## Conventions

One task at a time (WIP=1)
No cross-layer refactors in one change (split into multiple tasks/commits)
