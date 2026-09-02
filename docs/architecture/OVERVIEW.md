# Architecture Overview

## Objective

Mariage OS must be collaborative, cloud-accessible, responsive, offline-tolerant, free-tier-first, secure and maintainable without becoming a large infrastructure project.

## High-level architecture

```text
Authorized browser / installed PWA
        │
        ├── UI + domain services
        │
        ├── IndexedDB local cache
        │      └── pending mutation queue
        │
        └── HTTPS
              │
              ▼
        Supabase project
        ├── Auth
        ├── PostgreSQL
        │    └── RLS
        ├── Realtime
        └── private Storage

Static application assets
        ▲
        │
Cloudflare Pages
        ▲
        │
GitHub public repository
(code, docs, migrations, tests; no real wedding data)
```

## Deployment unit

The frontend is a static application built with TypeScript and Vite. Cloudflare Pages hosts the generated assets. No custom always-on application server is required for V1.

## Cloud responsibilities

Supabase owns:

- authenticated identities;
- shared project membership;
- persistent structured data;
- authorization policies;
- real private files;
- change notifications where enabled.

## Browser responsibilities

The client owns:

- user interface;
- typed domain behavior;
- local working state;
- offline cache;
- pending mutation queue;
- import parsing/preview where possible;
- optimistic UI;
- conflict presentation;
- PWA installation and offline shell;
- portable export generation.

The browser is **not** a trusted security boundary. Authorization is re-enforced by Supabase/PostgreSQL.

## Data access rule

Screens must not perform arbitrary Supabase queries directly. Access should flow through services/repositories so that offline behavior, validation, synchronization and future backend portability remain centralized.

Conceptually:

```text
View
 ↓
Domain service
 ↓
Repository / local store
 ↓
Sync layer
 ↓
Supabase adapter
```

## Architectural priorities

1. Data integrity
2. Privacy and authorization
3. Recoverability
4. Simple couple UX
5. Offline tolerance
6. Free-tier sustainability
7. Maintainability
8. Performance

## Failure philosophy

A remote outage may reduce freshness, but should not erase locally confirmed work. A media failure must not prevent editing a task or RSVP. A map failure must not prevent opening a venue. A failed import must not leave half-applied critical state.

## Portability

Although Supabase is the chosen cloud backend, the domain layer must avoid leaking Supabase-specific primitives throughout the UI. Portable exports and repository/service abstractions reduce lock-in.

## Architecture changes

Significant architectural changes require an ADR documenting context, decision, alternatives, consequences, migration implications, security implications and test impact.
