# Requirements Traceability

Status: **Normative implementation-verification process**

The source requirement index is [`../REQUIREMENTS-CATALOG.md`](../REQUIREMENTS-CATALOG.md).

The purpose of traceability is to ensure no important behavior exists only in chat memory, and no P0/P1 requirement remains a paper statement without implementation and verification evidence.

## Requirement prefixes

Use the catalog prefixes exactly:

- `PRD-` product/collaboration
- `IAM-` identity/project isolation
- `SYN-` local-first/synchronization
- `PWA-` PWA/offline lifecycle
- `VEN-` venues
- `FAC-` facts/provenance/confidence
- `VND-` vendors
- `GST-` guests/households
- `TSK-` tasks
- `DEC-` decisions
- `FIN-` budget/payments
- `MED-` documents/media/storage
- `IMP-` import/export
- `BAK-` backup/migration/recovery
- `SEC-` security/privacy
- `QLT-` quality/testing
- `UX-` UX/accessibility
- `OPS-` free-tier/operations

IDs are stable. Do not reuse a retired ID for different behavior.

## Traceability lifecycle

A requirement moves through:

1. **Specified** — documented in catalog and detailed spec.
2. **Planned** — assigned to implementation lot/issue.
3. **Implemented** — code/migration exists.
4. **Verified** — required automated/manual evidence passes.
5. **Released** — included in production release.

P0/P1 requirements required by V1 cannot be marked `Verified` solely because code exists.

## Traceability record

Implementation work should make it possible to produce a row such as:

| Requirement | Detailed spec | Lot/PR | Code/migration | Test/evidence | Security/ASVS | Status |
|---|---|---|---|---|---|---|
| IMP-003 | import-export/MERGE.md | Lot 4 / PR #X | ImportManager | `reimport is idempotent` | n/a | Verified |

The exact storage format for the live matrix may be Markdown or generated from test/PR metadata, decided in Lot 0. It must remain readable without proprietary tooling.

## PR requirements

A feature PR must list relevant requirement IDs when it materially implements/changes normative behavior.

Example:

```text
Requirements: VEN-003, FAC-002, SEC-003, QLT-004
```

Reviewers check that:

- requirements are implemented rather than partially implied;
- negative/error/security behavior is covered;
- requirement changes update documentation first/alongside code;
- newly discovered behavior has an ID/spec rather than being hidden in implementation.

## Test naming

For critical requirements, include the ID in test description/metadata where practical:

```text
IMP-003 reimporting the same externalId is idempotent
SEC-003 cross-project venue SELECT is denied
FIN-005 guest-count change recomputes scenario without changing quote history
```

One test can support multiple requirements; one requirement commonly has multiple tests.

## Given/When/Then acceptance

Critical flows should be expressible behaviorally.

Example:

```text
SYN-010
Given an authenticated owner has a durable pending local edit
And the device is offline
When the application is closed and reopened
Then the edit remains present locally
And remains visibly pending
And when connectivity/auth is restored it synchronizes once without duplication.
```

## Security traceability

Applicable security requirements also link to:

- threat(s) from `security/THREAT-MODEL.md`;
- ASVS item(s) from `security/ASVS-MATRIX.md`;
- RLS/security test evidence;
- release-blocker status if failing.

## Migration traceability

If a requirement changes stored semantics, the PR must link:

- data/schema migration;
- old fixture migration test;
- export/import compatibility impact;
- rollback/recovery approach.

## No orphan implementation

A significant production behavior must not appear without:

- requirement/specification;
- acceptance behavior;
- tests/evidence;
- security implications considered.

## No paper-only V1 requirements

Before V1 cutover, every applicable P0/P1 requirement must be categorized:

- `Verified`, with evidence; or
- explicitly deferred by accepted scope/ADR.

There is no `assumed complete` state.

## Documentation-only phase

At the end of Run 4, requirements are predominantly `Specified` and assigned conceptually to lots. Lot 0 should establish the concrete traceability artifact/process used by CI/PRs; later lots populate implementation/test references progressively.
