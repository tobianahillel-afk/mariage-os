# Mariage OS — Public-Readiness Test Matrix

Status: **Normative V1 regression-test contract**

Private V1 must continuously prove that the core is multi-tenant/public-ready. Coverage is not sufficient if tests contain only one project.

---

## 1. Minimum synthetic actors/projects

Create stable synthetic identities similar to:

```text
Alice Example
  owner -> Project Alpha
  owner -> Project Beta

Bob Example
  owner -> Project Alpha

Carol Example
  owner -> Project Gamma

Dave Example
  authenticated, no membership
```

Never use real wedding/user names or production identifiers.

---

## 2. Minimum data collision fixtures

Intentionally reuse human/external values across projects:

- Project Alpha venue code `S1`;
- Project Beta venue code `S1`;
- same vendor display name in Alpha/Beta;
- guest named `Alex Example` in multiple projects;
- nested external child ID `main` under different parent venues/projects;
- same tag/category names across projects.

Expected: no cross-project uniqueness collision unless explicitly global by contract.

---

## 3. RLS/DB cases

Verify:

- Alice reads/writes Alpha and Beta according to role;
- Bob reads/writes Alpha but cannot read Beta;
- Carol cannot read Alpha/Beta;
- Dave cannot read any project data;
- child row cannot claim Alpha while referencing Beta parent;
- polymorphic cross-project link denied;
- known project/entity UUID does not grant access;
- deleted/revoked membership behaves according to policy.

---

## 4. Route cases

Verify:

- Alice can deep-link `/app/p/alpha/venues` and `/app/p/beta/venues`;
- Bob editing URL to Beta receives generic unauthorized/not-found UX;
- switching project resets stale project-specific selection/context;
- copied Alpha link opened by unauthorized Carol leaks no Alpha metadata;
- refresh restores the correct authorized project context.

Actual IDs are UUID fixtures; symbolic labels here are explanatory.

---

## 5. IndexedDB/offline cases

Verify:

- Alpha/Beta caches occupy distinct logical partitions;
- Alice switches Alpha→Beta without Alpha row bleed;
- pending Alpha mutation cannot be replayed against Beta;
- account switch Alice→Bob cannot display Alice-only Beta cache;
- project-scoped offline pin/search obey correct partition;
- logout safe-purge follows policy without silently losing pending work.

---

## 6. Realtime cases

Verify:

- Alpha mutation reaches authorized Alpha subscribers;
- Beta-only mutation does not appear in Bob/Alpha client;
- Alice active in Alpha does not process Beta events into Alpha read model;
- reconnect does not subscribe globally;
- malformed/changed client-side project filter cannot bypass server authorization.

---

## 7. Storage cases

Verify:

- authorized upload/read within project;
- Bob cannot fetch/generate access to Beta private media;
- object path manipulation denied;
- same filename/hash in different projects does not create ownership collision;
- deletion/orphan cleanup never removes another project's object.

---

## 8. Import/export/backup cases

Verify:

- import target project explicit;
- Alpha external IDs do not match Beta records;
- restore into an existing project requires intended controlled behavior;
- exported Alpha backup contains no Beta rows/files;
- backup metadata clearly identifies source project;
- unauthorized user cannot use backup/import path to write another project.

---

## 9. Search/read-model cases

Verify:

- Search in Alpha cannot return Beta entity;
- Dashboard counters use active project only;
- partner activity cursor is project-member scoped;
- budget/guest totals never aggregate across projects;
- global-looking utilities always derive active project context.

---

## 10. Provisioning-mode cases

Private mode:

- Dave cannot create arbitrary project;
- intended controlled bootstrap succeeds under correct setup;
- domain still supports Alpha/Beta/Gamma in test DB.

Future public-mode test suite (not V1 activation):

- verified eligible user can provision under protected policy;
- repeated request is idempotent/limited;
- new project does not affect existing tenants.

---

## 11. Checkpoint evidence

Each integration checkpoint records which portions of this matrix ran and passed.

Any cross-tenant leak/collision is BLOCKING and reopens earlier checkpoint guarantees even if introduced by a later feature.
