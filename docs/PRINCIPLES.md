# Product and Engineering Principles

These principles are binding unless an Architecture Decision Record (ADR) explicitly changes them.

## P1 — The interface must answer what matters next

Every screen should help the couple understand, decide or act. Information that does none of these should not dominate the primary UI.

## P2 — Enter information once

A value has one authoritative representation. Derived values are calculated, not independently re-entered.

Changing guest count may update variable budget estimates, venue-capacity warnings and transport projections from that single source.

## P3 — Unknown is not false

The system distinguishes:

- yes;
- no;
- unknown;
- not applicable;
- conflict.

Blank data must not accidentally mean `false`.

## P4 — Evidence travels with important facts

Critical facts can carry sources, verification state and observation date. Contractual confirmation outranks unverified imports, but weaker observations remain available historically.

## P5 — No silent destruction

Imports, synchronization, merges, migrations and user actions must never silently delete confirmed information or overwrite a genuine conflict.

## P6 — Local-first interaction, shared cloud truth

User actions should feel instant using local state. The shared Supabase project is the common cloud truth. Pending offline operations remain visible until acknowledged by the cloud.

## P7 — Conflicts are explicit

Concurrent edits to independent fields merge where safe. Conflicting edits to the same semantic fact require deterministic policy or human resolution.

## P8 — Security is enforced below the UI

Frontend visibility is not authorization. PostgreSQL RLS and Storage policies enforce project membership and permissions.

## P9 — Real data never enters the public repository

Only synthetic fixtures belong in GitHub.

## P10 — Free-tier-first is a product requirement

The application should prevent nonessential media usage from threatening the zero-cost operating target. Essential structured data takes precedence over decorative storage.

## P11 — Portable by design

The couple must be able to export project data in open, documented formats. Supabase must not become an irreversible lock-in.

## P12 — Imports are reversible and traceable

Large imports require preview. Each applied import records provenance and changes. Rollback must respect later user edits.

## P13 — Objective fit and subjective love are separate

Compatibility scores, blocking criteria and logistics never replace each partner's emotional rating.

## P14 — Scores must be explainable

Any calculated score must expose its inputs and weighting. No opaque scoring.

## P15 — Blocking criteria beat aggregate scores

A venue cannot become acceptable because a weighted average hides a failed non-negotiable criterion.

## P16 — Important decisions preserve the reason

Selecting or rejecting a venue/vendor stores the decision, alternatives and rationale.

## P17 — Reversible actions should be easy; irreversible actions should be hard

Use undo/toasts for reversible changes. Require strong confirmation and recent authentication for destructive project-level actions.

## P18 — The app adapts to the planning phase

What matters at J-300 differs from J-5. The dashboard should prioritize the current wedding phase.

## P19 — Mobile is a primary surface

Venue visits, quick capture, tasks, notes and photos must be pleasant on a real phone. Desktop is preferred for dense comparison/import workflows, but mobile cannot be an afterthought.

## P20 — Offline is a degraded mode, not a second product

Essential cached workflows remain available. Features requiring live external services may degrade gracefully.

## P21 — Tests are part of the feature

A behavior without appropriate automated verification is unfinished.

## P22 — Documentation is part of the architecture

Behavioral and architectural changes update documentation in the same delivery unit.

## P23 — Keep dependencies few and justified

Every dependency has maintenance, security and bundle cost. Prefer platform capabilities when they are clear and reliable.

## P24 — Privacy through minimization

Do not collect personal information merely because storage is available.

## P25 — Fail visibly and recoverably

Errors should tell users what happened, whether their work is safe, and what they can do next. Internal vendor/error codes should not leak into normal UX.
