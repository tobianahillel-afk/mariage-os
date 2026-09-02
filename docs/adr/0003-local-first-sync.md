# ADR 0003 — Local-first working state with Supabase shared truth

- Status: Accepted
- Date: 2026-09-02

## Context

Both partners must edit the project from multiple devices, including venue visits with weak/no network. Waiting for a round trip before every UI update would create a fragile experience; treating each device as independent truth would create uncontrolled divergence.

## Decision

Adopt a local-first interaction model:

- IndexedDB/local store is the durable working state/cache and pending-mutation queue on each device;
- Supabase PostgreSQL is the shared cloud source of truth;
- mutations are locally persisted then synchronized;
- every synchronized entity/version supports conflict detection;
- sync state is visible to users;
- unsafe same-field conflicts are resolved explicitly;
- independent/additive operations can merge automatically when rules prove safety.

## Consequences

The architecture requires:

- mutation operation IDs;
- entity revisions/version checks;
- idempotent retry behavior;
- durable queue across restart;
- conflict models;
- local schema migrations;
- E2E offline/reconnect tests.

This is more complex than online-only CRUD, but directly satisfies the product's multi-device/venue-visit reliability requirement.

## Rejected alternatives

### Cloud-only writes
Rejected because poor/mobile network would block work or risk form loss.

### File synchronization/import between partners
Rejected as primary collaboration because it creates manual conflicts and is not real-time cloud access.

### Last-write-wins everywhere
Rejected because important prices, facts, guest states or decisions could be silently lost.
