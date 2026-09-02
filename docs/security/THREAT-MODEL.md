# Threat Model

Status: **Normative V1 threat model**

## Protected assets

- guest/contact personal data;
- sensitive logistics/dietary/accessibility data;
- couple private notes/opinions/decisions;
- budget/scenario/payment data;
- quotes/contracts/invoices;
- private photos/documents;
- Auth sessions/MFA/recovery state;
- project membership/invitations;
- portable backups and backup passwords;
- integrity of tasks, dates, seating, timeline and decisions;
- free-tier cloud resources/availability.

## Actors

### Authorized owners
Can make mistakes, import bad files, use compromised devices or mis-share exports.

### Unauthenticated Internet user
Can discover public static app/repository and probe Supabase endpoints/signup surface.

### Authenticated unrelated user / other project owner in tests
Must never cross project or create unauthorized production resources.

### Attacker with stolen session/device
May read cached/cloud data until revocation; offline cached bytes cannot be remotely erased.

### Malicious/untrusted import/file/URL
Can attempt execution, parser abuse, resource exhaustion, formula injection, malicious URL/navigation or data poisoning.

### Supply-chain attacker
Compromised npm package/CI Action/build dependency.

### Honest third-party remote host
Venue/image/map host receives ordinary network request metadata even without malicious intent; privacy leakage must still be minimized/disclosed.

---

# Trust/entry points

- login/password/MFA/recovery;
- controlled bootstrap/signup configuration;
- project invitation URL/token;
- direct Supabase REST/RPC/Realtime;
- Storage upload/download/signed URL;
- IndexedDB/PWA cache;
- import center and `.mariage` restore;
- CSV/XLSX opened externally;
- remote URLs/images/maps;
- forms/notes/search;
- service-worker update;
- GitHub/CI/dependency chain.

---

# Primary threats and controls

## Cross-project IDOR / reference injection

Threat: attacker knows/guesses UUID and writes child row with their authorized `project_id` referencing another project's parent.

Controls:

- RLS;
- composite `(project_id,parent_id)` foreign keys;
- same-project polymorphic validation;
- immutable `project_id`;
- direct allow/deny tests.

## Public signup / free-tier resource abuse

Threat: public static site lets arbitrary users create Supabase accounts/projects/files and consume free quotas.

Controls:

- V1 single-couple deployment;
- controlled first-owner bootstrap;
- partner invite only;
- disable unrestricted Auth signup after enrollment;
- DB refuses additional unauthorized project creation;
- quotas/rate limits/provider protections;
- tests/checklist prove production lock.

## Invitation theft/replay/wrong account

Threat: raw invite token leaked or reused to join project.

Controls:

- cryptographically random token;
- only hash stored;
- expiry/revocation;
- verified authenticated email must equal invited email;
- one-time/idempotent atomic acceptance;
- raw token excluded from logs/activity/diagnostics;
- no service-role secret in browser.

## Credential/session theft

Controls:

- verified email/password;
- TOTP MFA both owners before cutover;
- strong/recent auth for destructive export/admin;
- provider recovery/session controls;
- safe local logout purge after pending-work handling.

Residual: remote revocation cannot erase already cached data on permanently offline stolen device; rely on device security.

## XSS / malicious URL

Controls:

- safe text rendering/no arbitrary HTML;
- runtime input validation;
- reject unsafe URL schemes;
- CSP;
- no inline untrusted SVG/HTML;
- safe search highlighting;
- no imported executable content.

## Malicious file/archive

Controls:

- type/size allowlists;
- MIME/signature validation where practical;
- no macros/formula execution;
- private Storage;
- safe preview;
- archive path traversal/symlink rejection;
- entry/count/uncompressed-size/decompression-ratio limits;
- incomplete-upload state.

## Spreadsheet formula injection

Controls: neutralize textual leading formula markers in CSV/XLSX exports; never evaluate imported formulas/macros as code.

## Import data poisoning/destruction

Controls:

- local parse/previews;
- strict schema/type validation;
- parent-scoped external IDs;
- duplicate detection;
- provenance/evidence precedence;
- no deletion by absence;
- protected fields;
- stale-preview revalidation;
- rollback/checkpoint.

## Sync stale overwrite/replay

Controls:

- revisions;
- operation IDs/receipts;
- semantic merge classes;
- protected commands with preconditions;
- no client-time last-write-wins;
- explicit conflicts;
- membership revalidation after offline/session gap.

## Financial corruption

Threat: incorrect cents/tax/scenario/refund handling or malicious import changes paid/contracted truth.

Controls:

- integer minor units;
- explicit tax mode;
- named scenarios separate from base truth;
- protected payment transitions/import rules;
- invariant/property/mutation tests;
- significant-change preview.

## Seating/timeline operational corruption

Threat: duplicate guest assignment, overcapacity final export, cross-project references, after-midnight timeline misordering.

Controls:

- DB same-project constraints;
- unique assignment rule;
- finalization validation;
- explicit day offsets;
- deterministic timeline/seating tests;
- versioned final exports.

## Service-worker stale code

Controls: versioned shell cache, compatibility ranges, controlled activation, transactional local migration, update-required fail-safe.

## Backup confidentiality/tamper/wrong password

Controls:

- optional client-side PBKDF2-HMAC-SHA-256 + AES-256-GCM format;
- fresh random salt/nonce;
- 600k minimum PBKDF2 iterations for V1 unless security review increases it;
- authenticated header parameters;
- checksums inside archive;
- full decrypt/authenticate/verify before destructive restore;
- password never sent/stored;
- future schema reject-safe.

## Remote image privacy/tracking

Threat: direct image request reveals IP/network metadata/referrer to venue/CDN.

Controls:

- no-referrer image policy;
- no private query parameters;
- lazy/nonessential loading;
- no third-party tracking scripts;
- important images may be privately archived;
- user-facing privacy documentation does not claim IP anonymity.

## Storage URL leakage

Controls: private bucket, membership RLS, short/authorized signed access where needed, no permanent public URLs for private files.

## Dependency/CI compromise

Controls: minimal dependencies, lockfile + `npm ci`, audit/scanning, pinned Actions, secret scanning, Dependabot through full gate, review.

## Quota/resource exhaustion

Controls: input/media limits, bounded queries/pagination, free-tier preflight, structured data priority, public signup lock, reject oversized archive/import.

## Accidental deletion/corruption

Controls: soft delete, trash, undo, purge eligibility, import rollback, portable verified backup, project-deletion strong auth.

---

# Abuse/adversarial cases to test

- anonymous direct API read/write;
- outsider creates second production project;
- project A child references project B venue/guest/document UUID;
- manipulate `project_id`/protected audit fields;
- direct private Storage path access;
- invitation raw token replay/wrong verified email/expired token;
- revoked member reconnects with offline queue;
- malicious `javascript:`/HTML/SVG payload;
- renamed executable/image mismatch;
- CSV formula payload;
- zip-slip/archive bomb backup;
- malformed huge XLSX/JSON;
- stale device tries to overwrite newer payment/date/scenario/seating state;
- import downgrades contractual evidence;
- imported payment attempts false `paid` state;
- two devices assign same guest to two tables;
- timeline after-midnight sort error;
- vendor export leaks total budget/guest PII;
- remote image request includes Mariage OS referrer/private query parameter;
- old app imports future backup/schema;
- wrong backup password/tampered ciphertext partially restores;
- service worker old bundle writes against incompatible schema;
- logout exposes previous user's cached project;
- large media upload starves essential structured sync.

## Residual-risk rule

No architecture removes all risk. Residual risks, accepted limitations and N/A ASVS controls are documented explicitly. A known Critical/High release vulnerability, cross-project leak or silent data-loss path cannot be accepted for V1 cutover.