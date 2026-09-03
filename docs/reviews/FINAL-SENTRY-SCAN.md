# Mariage OS — Final Pre-Merge Sentry Scan

Status: **PRE-MERGE SENTRY METHOD FROZEN — FINAL SHA-SPECIFIC RERUN REQUIRED IMMEDIATELY BEFORE MERGE**

Purpose: define and record the final documentation-precedence, public-repository privacy and secret-hygiene checks for Run 4 without retaining real personal-data examples in the audit text itself.

## 1. Scope

The final sentry evaluates the exact PR HEAD and verifies:

- governing-document precedence and stale wording;
- unresolved review threads;
- branch divergence / mergeability;
- prohibited private file classes;
- known project-person identifiers;
- high-signal secret/token/key patterns;
- production identifiers where they would constitute a private credential/config leak;
- final changed-file inventory.

The result is SHA-specific. Any subsequent product/spec content change requires the relevant checks again.

## 2. Stale-wording / precedence result

No known semantic conflict remains among the governing entry points.

The historical words `freeze candidate` remain in the header of `docs/domain/PHYSICAL-SCHEMA-V1.md`. They are explicitly non-decision-bearing because:

1. the same header identifies the file as normative implementation schema design;
2. schema addenda control narrower corrected scopes;
3. `AGENTS.md` explicitly states that this historical label cannot authorize an alternative schema;
4. implementation permission is controlled by `IMPLEMENTATION-STATUS.md` + `FINAL-DESIGN-REVIEW.md`.

Therefore this occurrence is an accepted non-semantic historical label, not a design ambiguity. A literal cleanup may be made later without changing semantics.

## 3. Privacy / PII result

Real-name examples discovered during review were removed from product examples and replaced with synthetic labels such as `Owner-A`, `Partner A` and `Partner B`.

The final sentry must search the exact PR patch for the known project-person identifiers maintained privately during the review. The audit document intentionally does **not** reproduce those identifiers.

Passing condition: zero occurrence outside unavoidable public repository/account metadata that is not part of project content.

## 4. Secret / token result

High-signal patterns to check include provider/token/key signatures such as:

- GitHub personal-access-token prefixes;
- AWS access-key prefixes;
- private-key PEM headers;
- Google API-key prefixes;
- JWT/provider-secret patterns where practical;
- production Supabase/private deployment identifiers where they would reveal protected configuration.

Do not use ambiguous short substrings as standalone proof. Lot 0 must later add executable entropy/provider-aware secret scanning.

Passing condition for documentation phase: no prohibited credential/token/key in the exact PR patch or changed files.

## 5. Prohibited file classes

The PR must contain no real/private runtime artifact such as:

- wedding XLS/XLSX/CSV working data;
- `.mariage` backup;
- production DB dump;
- private photo/media upload;
- invoice/contract binary containing real private data;
- runtime import/export directory content;
- real `.env` file;
- key/certificate file;
- production diagnostic log.

`.gitignore` is defense in depth only; the final changed-file inventory must still be reviewed directly.

## 6. Review / mergeability

Passing condition:

- all known inline review threads resolved;
- no new unresolved blocking review;
- branch not behind `main` in a way requiring reconciliation;
- raw GitHub PR state reports `mergeable: true` and `mergeable_state: clean` immediately before merge.

Transient normalized snapshots while GitHub recalculates mergeability are not treated as authoritative if the raw PR endpoint later reports `clean` and branch comparison confirms no divergence.

## 7. Release/update architecture

The final review added and reconciled:

- `engineering/VERSIONING-UPDATE-DELIVERY.md`;
- `engineering/CI-CD.md`;
- `engineering/RELEASE-PROCESS.md`;
- `engineering/MIGRATIONS.md`;
- `architecture/PWA-LIFECYCLE.md`;
- `quality/QUALITY-GATES.md`;
- `templates/RELEASE-PLAN.md`;
- `reviews/ABSOLUTE-300-CONTROL-CHECKLIST.md`;
- `reviews/100-PERCENT-GAP-PLAN.md`.

This closes the design gap around SemVer, immutable release identity, DB-before-dependent-frontend promotion, PWA update discovery, stale-client write blocking, monitoring, rollback/forward-fix and V1.x→V2 migration rehearsal.

## 8. Exact final seal procedure

On the last immutable PR HEAD:

- [ ] fetch exact HEAD SHA;
- [ ] fetch full changed-file inventory;
- [ ] fetch final PR patch;
- [ ] run private known-identifier sentry without writing those identifiers into public docs;
- [ ] run high-signal secret/key sentry;
- [ ] confirm no prohibited private file class;
- [ ] confirm no unresolved review thread;
- [ ] confirm precedence/stale-wording status unchanged;
- [ ] confirm branch comparison has no behind-main divergence requiring reconciliation;
- [ ] confirm raw PR `mergeable=true`, `mergeable_state=clean`;
- [ ] record the exact sealed HEAD in PR metadata/comment, not in a new repository commit;
- [ ] merge that exact HEAD using expected-SHA protection.

This SHA-seal design avoids the self-referential problem where committing the SHA into the repository would create a new, different SHA that then needs another seal.
