# Trust Boundaries

Status: **Normative V1 security architecture reference**

Mariage OS processes private personal, financial and contractual information. “Trusted” is contextual: a signed-in owner is allowed to request project actions, but client state, input files, network requests and external content are never trusted for authorization/integrity merely because they came from that owner.

## Zone A — Human owner intent

Two legitimate owners can still make mistakes, import malicious files, use compromised devices or perform destructive actions accidentally.

Controls include confirmation, recent auth for critical operations, non-destructive imports, provenance/history, backup/recovery and explainable state.

## Zone B — Browser/PWA runtime

Frontend JavaScript is **not an authorization boundary**. A user/attacker can inspect/modify it or forge requests.

Therefore:

- frontend role checks are UX only;
- RLS/Storage policies and DB integrity are authoritative;
- client `project_id` is never proof of ownership;
- service-role/secret credentials never ship to browser;
- security-definer/RPC commands reauthorize internally.

## Zone C — Local device/IndexedDB/cache

Local device can contain cached private project data, pending mutations, drafts and unsynced files.

Threats:

- lost/stolen/unlocked device;
- shared OS/browser profile;
- malicious extension/local malware;
- stale offline data;
- old authenticated session remnants.

Important distinction:

- session expiry/revocation stops **future cloud authorization/synchronization**;
- previously cached data may remain physically present/readable according to the documented local privacy/logout policy until safe purge;
- cached data never grants renewed cloud access.

Logout/project switching clears visible context first and follows pending-work-safe purge semantics.

## Zone D — Cloudflare Pages/public application assets

Cloudflare serves public static assets only.

It must not contain:

- real wedding data;
- private configuration;
- service secrets;
- production backups.

Headers/CSP/cache deployment affect frontend security and PWA version safety but do not authorize database data.

## Zone E — Public GitHub repository and CI

Repository/CI content is assumed publicly discoverable.

Allowed:

- code;
- migrations;
- docs;
- synthetic fixtures;
- sanitized logs/artifacts.

Forbidden:

- real wedding data;
- private screenshots;
- tokens/secret keys;
- production dumps/backups;
- PII-bearing diagnostic artifacts.

CI third-party actions/dependencies are supply-chain boundaries and must be pinned/reviewed per policy.

## Zone F — Supabase Auth

Authenticates identity/session assurance/MFA. Authentication alone does not grant project membership.

Controlled bootstrap/invitation semantics prevent arbitrary production project creation.

Invitation tokens are untrusted bearer material until server-side validation of hash, expiry, intended identity, membership state and one-time use succeeds.

## Zone G — Supabase PostgreSQL

Primary structured-data security/integrity boundary.

Requires:

- RLS on project-scoped exposed tables;
- same-project relational constraints/validation;
- role/owner invariants;
- protected columns;
- safe transaction/RPC boundaries for critical commands;
- secure `SECURITY DEFINER` search path/explicit authorization if such functions are used.

## Zone H — Supabase Storage

Private binary storage with independent policies.

Object path/UUID/filename obscurity is not authorization. DB metadata and Storage policy must agree on project membership. Signed URLs are temporary access mechanisms, not durable identity.

## Zone I — Realtime channel/events

Receiving a realtime event is data access. Subscriptions must remain project-authorized/scoped.

Realtime events are not durability truth: missed events are repaired through normal refresh/revision logic.

## Zone J — External websites/maps/media/providers

Venue websites, image hosts, map/routing providers and other Internet resources are untrusted external parties.

Risks include:

- malicious content;
- broken/stale data;
- privacy metadata/referrer leakage;
- tracking;
- protocol abuse;
- availability failure.

Rules:

- allowed protocols only;
- no execution of external active content as trusted application code;
- no private project data embedded in URLs unnecessarily;
- external images use privacy-preserving referrer behavior;
- map/media failure never blocks core records;
- external response is evidence/input, not automatic authoritative truth.

## Zone K — Imported/uploaded files

CSV/XLSX/JSON/PDF/images/archives are untrusted input even when selected by an owner.

Validate type/size/schema/signature/content; never execute macros/active content. Import parsing does not grant mutation permission; preview/business validation/RLS still apply.

## Zone L — Downloaded exports/backups

Once a `.mariage`, CSV/XLSX export, document packet or backup leaves the app and is downloaded, it is outside application cloud control.

Risks:

- user stores it insecurely;
- shares wrong file;
- loses password;
- keeps copies after project deletion.

Controls:

- explicit export profiles/allowlists;
- privacy warnings;
- authenticated encryption for private full backup;
- checksums/version metadata;
- no claim that cloud deletion erases downloaded copies.

## Zone M — Email/invitation delivery channel

If an invitation/recovery link is delivered over email/provider-supported channel, mailbox/provider security is outside Mariage OS control.

The application limits impact through token entropy/hash/expiry/one-time use/intended-account validation and does not treat possession of a stale link alone as project membership.

## Core security invariants

1. Knowing UUID/path/external ID never grants access.
2. Authentication alone never grants arbitrary project access.
3. Project membership does not allow cross-project relationships.
4. Public repository/CI artifacts are safe to disclose.
5. Client validation never replaces server authorization/integrity.
6. External/imported content is data, not trusted executable code.
7. Export/share profiles expose explicit allowlisted data only.
8. Local cached data never becomes proof of current cloud authorization.
9. Revoked/expired identity can preserve pending local work for recovery but cannot synchronize until authorization is re-established.
10. A downloaded private backup is outside cloud-retention control.
11. Single-couple bootstrap prevents public free-tier resource abuse.

## Governing threat model

The complete abuse/threat analysis is `security/THREAT-MODEL.md`. This trust-boundary document and that threat model must remain consistent; neither is “future documentation”.
