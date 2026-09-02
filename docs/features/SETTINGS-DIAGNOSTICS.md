# Settings and Diagnostics Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Centralize project configuration, personal preferences, security/account controls, backup/import operations and safe diagnostics without mixing them into everyday wedding screens.

---

## 1. Settings information architecture

Recommended sections:

1. Wedding project
2. Couple / members
3. Criteria and scoring
4. Reference locations
5. Appearance/preferences
6. Offline & storage
7. Import/export & backups
8. Security & account
9. Diagnostics
10. Danger zone

Mobile may render as a list of subpages; desktop may use sidebar/tabs.

---

## 2. Wedding project settings

Editable project fields:

- project name;
- wedding date (or unknown/not set);
- timezone;
- locale;
- currency;
- target guest count;
- budget target/reserve preferences if configured;
- planning phase overrides only when supported by planning contract.

Changing date/guest target must trigger documented derived-data recalculation/staleness, never historical quote mutation.

---

## 3. Couple and members

Display:

- both owners;
- membership status;
- MFA/security setup status;
- invitation state;
- personal display names/avatar if used.

Actions:

- invite/reinvite partner;
- update own display profile;
- security-safe role/member management if relevant;
- no ordinary action can remove the final active owner.

---

## 4. Criteria/scoring

Manage seeded/custom criteria:

- label/key display;
- type/unit;
- priority: blocking/important/bonus/informational;
- weight when scoring uses it;
- freshness policy;
- options for select criteria;
- enabled/disabled display state where appropriate.

System-defined keys cannot be silently changed to incompatible types/meaning.

Changing criterion priority recalculates compatibility views. It does not edit venue fact values.

---

## 5. Reference locations

Manage origins used for venue access comparison:

- label;
- address/text location;
- optional coordinates after user-approved geocoding workflow;
- default reference flag.

These are private project data.

---

## 6. Personal preferences

Examples:

- theme/appearance;
- preferred venue table columns;
- saved filters where supported;
- density preference;
- dashboard personal view preferences when implemented.

Personal preferences do not alter the other partner's choices unless explicitly project-wide.

---

## 7. Offline & storage

Display safely measurable values:

- local cache approximate usage;
- offline-pinned entities;
- pending mutation count;
- pending media uploads;
- conflicts;
- cloud storage/quota values only if accurate provider data is safely available;
- free-tier warning status.

Actions:

- manage offline pins/cache;
- retry failed sync;
- resolve conflicts;
- clear nonessential cache;
- never clear pending unsynced work without explicit reconciliation/confirmation.

Do not display invented quota precision if provider API does not expose it safely.

---

## 8. Import/export & backups

Actions:

- open Import Center;
- export module data;
- export structured `.mariage` backup;
- export complete archive including media/documents when selected;
- validate backup;
- restore through explicit preview/safe target workflow;
- show recorded last backup time.

Before destructive restore/project deletion, recommend verified backup according to operations policy.

---

## 9. Security/account

Display/action areas:

- email/account identity;
- MFA factors/status;
- enroll/replace factor using supported secure flow;
- logout;
- logout/remove local data option if implemented;
- recent-reauth requirement for critical operations;
- compromised-session controls if provider API supports them.

Never expose secret keys or MFA seed after enrollment.

---

## 10. Diagnostics

Display fields defined by `engineering/OBSERVABILITY-DIAGNOSTICS.md`, e.g.:

- app/build version;
- schema versions;
- local DB version;
- last sync;
- pending/conflict counts;
- connectivity;
- service worker/PWA state;
- backup age;
- safe storage/cache usage;
- safe recent error IDs.

Actions:

- `Verify project integrity`;
- `Export sanitized diagnostics`;
- retry/reconcile safe operations.

Diagnostics are not analytics and must not expose unnecessary PII.

---

## 11. Danger zone

Actions with strong protections:

- remove local data from this device;
- archive project;
- permanent project deletion when implemented.

Permanent project deletion requires:

- strong explicit confirmation;
- recent strong authentication;
- final-owner authorization;
- pre-delete backup recommendation;
- clear description of what will be removed;
- tested deletion of DB/storage/project access after retention policy.

Do not place common safe actions visually next to irreversible actions without separation.

---

## Acceptance criteria

- personal settings do not overwrite partner preferences;
- changing project date recalculates dependents according to dependency graph;
- final owner cannot be removed casually;
- cache cleanup never silently discards pending structured edits;
- backup export/validate is reachable without developer tools;
- diagnostics export contains no synthetic fixture PII/secrets in tests;
- security-sensitive actions require correct authentication state;
- destructive actions are clearly separated and protected;
- Settings remains usable on mobile.
