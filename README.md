# iTrustCircle

Monorepo:

- `apps/mobile`: SvelteKit + Capacitor v7 (Android-first)

This repo keeps **MVP scope minimal**, but enforces **reliability-first rules** for a safety/guardian app.

## What this app does (MVP)

Sentinel detects BLE disconnect → starts a cancelable countdown → if not canceled, emits an AlertEvent → reports to Tower → Tower persists + notifies Contact via Email/SMTP.

## Reliability invariant (non-negotiable)

**Guardian Core MUST NOT depend on WebView/UI or JS timers to stay alive.**

- SvelteKit/Capacitor is the **control plane** (setup, status, diagnostics).
- Safety-critical chain (monitoring/countdown/trigger/retry) MUST be runnable in **native core** (Android/iOS) with a thin bridge to TS UI.

## Quick start

```bash
pnpm -C apps/mobile install
pnpm -C apps/mobile dev

# Build & run on Android
pnpm -C apps/mobile build
pnpm -C apps/mobile exec cap sync
pnpm -C apps/mobile exec cap open android
# or:
pnpm -C apps/mobile exec cap run android
```

## Source of truth (docs vs specs)

### Product docs (why / what)

docs/prd/ — PRD + user journeys
docs/failure-modes/ — failure modes & degradations
docs/adr/ — key decisions (don’t keep them only in chat)
docs/acceptance/ — release gate (manual test steps)

### Engineering specs (how / behavior)

openspec/specs/ — current truth (what IS built)
openspec/changes/ — proposals/deltas (what SHOULD change)
openspec/project.md — project rules, workflow, architecture constraints
openspec/AGENTS.md — AI conventions for OpenSpec-driven development

Default workflow: changes are driven via OpenSpec (proposal → validate → apply → archive).

> **Rule (conflict resolution)**: If statements in `docs/**` conflict with `openspec/specs/**`, the latter takes precedence as the authoritative engineering truth. `docs/**` provides product context only and is non-binding for engineering.

## Capacitor workflow rules

Web build → cap sync → run/open
Never edit copied web assets inside native projects. Always rebuild web then sync.

## Conventions

One task at a time (WIP=1)
No cross-layer refactors in one change (split into multiple changes/commits)