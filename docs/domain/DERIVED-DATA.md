# Derived Data and Dependency Rules

## Principle

Derived values are computed from authoritative inputs. They must not become independent manually maintained truths.

## Examples of derived data

- expected guest attendance;
- confirmed guest count;
- cumulative priority counts;
- variable catering total;
- remaining amount to pay;
- cost per guest;
- compatibility score;
- partner agreement indicator;
- missing-critical-information count;
- milestone progress;
- next-best-action ranking;
- free-tier storage percentage.

## Dependency graph

Every derived value must define its inputs.

Example:

```text
wedding_date
  ├── countdown
  ├── milestone due dates
  ├── applicable venue offers
  └── availability freshness

guest_population
  ├── expected attendance
  ├── confirmed attendance
  ├── per-guest budget components
  ├── venue capacity warnings
  └── table/transport projections
```

## Recalculation

When an authoritative input changes, affected derived values must either:

- recalculate immediately; or
- be marked invalid/stale until recalculation completes.

They must never continue displaying as authoritative without indication.

## Persisted caches

If a derived value is persisted for performance, it must include enough dependency/version metadata to prove it is still valid or be safely rebuildable.

## Manual override

Manual overrides are permitted only when the domain explicitly supports them, and must be represented as separate override/assumption data rather than silently editing the computed result.

Example:

- computed expected attendance: 168.5
- planning scenario guest count override: 175

Both remain visible concepts.

## Scores

Calculated scores must expose their components and weights.

### Compatibility score

A compatibility score must not convert failed blocking criteria into an acceptable result.

Conceptual output:

```text
blocking_status: PASS/FAIL/UNKNOWN
weighted_score: 92%
explanation: [...]
```

### Couple agreement

Partner ratings remain separate. Agreement indicators are derived from difference/criteria, not a replacement for individual ratings.

## Progress

Progress is weighted by milestones/importance. It is not raw completed-task percentage.

## Next-best-action

Any action ranking must be explainable through factors such as urgency, deadline, blocking impact and importance. Avoid opaque AI scoring in core V1.

## Change propagation

Changing a key assumption can have three effect types:

1. `AUTO_RECALCULATE` — safe deterministic math.
2. `MARK_FOR_REVIEW` — previous human/third-party assessment may no longer apply.
3. `NO_EFFECT` — unrelated data.

Example: guest count changes from 170 to 195.

- per-guest catering estimate: auto-recalculate;
- venue two-dance-floor suitability: mark for review if originally assessed at lower count;
- photographer contact email: no effect.

## Tests

Each derived rule needs deterministic unit/property tests. Dependency invalidation must be covered by integration tests where multiple domains interact.
