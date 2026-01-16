# iTrustCircle

Monorepo: `apps/mobile` (SvelteKit + Capacitor v7 Android)

## Quick start (dev)

```bash

pnpm -C apps/mobile install
pnpm -C apps/mobile dev
```

## AI infra bootstrap

```bash

git submodule update --init --recursive
pwsh -File .\.ai\ai-infra\scripts\install-to-project.ps1
```

## Capacitor workflow

Web build -> cap sync -> run/open
