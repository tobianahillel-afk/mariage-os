# Threat Model

## Assets

High-value assets include:

- guest personal/contact information;
- private couple notes and decisions;
- financial budgets/payments;
- quotes/contracts/invoices;
- private photos/documents;
- project membership and permissions;
- authentication sessions;
- portable backups;
- integrity of planning decisions/tasks.

## Actors

### Authorized owners

Legitimate users can still make mistakes, import bad files, use compromised devices or accidentally expose data.

### Unauthorized Internet user

May discover the public site/repository and attempt direct Supabase API/object access.

### Authenticated user from another project

Must never cross project boundaries.

### Attacker with stolen session/device

May attempt to read/export/change data until session is revoked.

### Malicious/untrusted file or external content

May attempt script execution, parser abuse, formula injection, oversized resource consumption or privacy leakage.

### Supply-chain attacker

May compromise a dependency, CI action or package release.

## Entry points

- login/session flows;
- Supabase REST/realtime access;
- Storage upload/download;
- import center;
- external URL fields/images;
- quick-add/forms/notes;
- backup restore;
- exported files opened in spreadsheet software;
- PWA/service worker/update mechanism;
- CI/repository/dependency chain.

## Primary threats and controls

### Cross-project IDOR / authorization bypass

Threat: changing an entity UUID/project ID or calling API directly.

Controls: RLS, membership joins/functions, foreign-key/project consistency, deny tests, no reliance on UI.

### Credential/session theft

Controls: MFA for owners, secure Auth defaults, reauthentication for critical actions, session revocation guidance, minimal sensitive offline persistence.

### XSS

Threat: note/source/import content rendered as executable HTML.

Controls: textContent/safe rendering, no arbitrary HTML, CSP, protocol validation, no untrusted inline SVG.

### Malicious file upload

Controls: allowlist, size limits, MIME/signature checks where practical, no execution/macros, private storage, safe preview, incomplete-upload state.

### Spreadsheet formula injection

Controls: neutralize dangerous text cells on CSV/XLSX export where needed; never execute formulas/macros during import.

### Import data poisoning/destruction

Controls: preview, validation, confidence/provenance, no deletion by absence, protected fields, idempotence, rollback, stronger-value preservation.

### Sync stale overwrite

Controls: revisions, operation IDs, semantic merge classes, conflict UI, no timestamp-only last-write authority.

### Service worker stale code

Controls: versioned cache, controlled update/reload, schema compatibility checks, migration tests.

### Backup exposure

Controls: explicit privacy warning, optional client-side encryption, no upload to public repo, minimized diagnostic content.

### Storage URL leakage

Controls: private bucket, authorized access/signed URLs where needed, avoid long-lived public URLs for private files.

### Dependency compromise

Controls: minimal dependencies, lockfile, `npm ci`, scanners, review, pinned CI actions, Dependabot with full tests.

### Quota/resource exhaustion

Controls: import/media size limits, batch limits, storage budget, prioritize structured data, reject oversized operations before upload.

### Accidental deletion

Controls: soft delete, trash, undo, backup, strong project-deletion confirmation.

## Abuse cases to test

- anonymous API read;
- user A reads/updates user B project by guessed UUID;
- manipulate `project_id` in mutation;
- direct Storage object path access;
- malicious `javascript:` URL;
- HTML/SVG payload in note/import;
- renamed executable pretending to be image;
- CSV formula payload;
- huge/recursive/malformed import;
- stale device overwrites newer financial fact;
- old session attempts project deletion;
- import downgrades contractual venue condition;
- exported vendor packet leaks total private budget;
- backup from future schema imported by old app;
- service worker serves incompatible old bundle.

## Residual risk

No design eliminates all risk. Residual risks, accepted limitations and N/A controls must be documented explicitly rather than implied.
