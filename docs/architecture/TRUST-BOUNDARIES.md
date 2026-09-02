# Trust Boundaries

## Purpose

Mariage OS processes private personal, financial and contractual information. Security design starts by defining what is trusted and what is not.

## Trust zones

### Zone A — Authorized user intent

A signed-in couple member is allowed to request actions within the project, but their browser, extensions, network and uploaded files are still not inherently trusted.

### Zone B — Browser application

The frontend is untrusted from an authorization perspective. Users can inspect and alter JavaScript, forge network requests and manipulate local state.

Therefore:

- frontend role checks are UX only;
- project authorization is enforced by PostgreSQL RLS/Storage policies;
- secret/service-role credentials never exist in frontend code.

### Zone C — Local device storage

IndexedDB contains cached private data and pending mutations. It improves resilience but must be treated as data residing on the user's device.

Threats include:

- lost/unlocked device;
- malicious browser extension;
- shared device account;
- stale/offline data.

Critical exports and account operations may require recent authentication.

### Zone D — Cloudflare static hosting

Cloudflare Pages serves public application assets only. It must not contain production project data or confidential secrets.

### Zone E — Supabase Auth

Authenticates identities and session assurance. Authentication alone does not imply authorization to a project.

### Zone F — Supabase PostgreSQL

Primary structured-data trust boundary. RLS must verify membership/role for every exposed project resource.

### Zone G — Supabase Storage

Private binary storage. Object paths, metadata and download/upload authorization must be protected independently of frontend UI.

### Zone H — External sources

Venue websites, image URLs, Google Maps links and other remote content are untrusted external resources.

The application must not execute external content. External URLs must use allowed protocols and safe navigation practices.

### Zone I — Imported files

CSV, XLSX, JSON, PDF and images are untrusted input even when selected by an authorized owner.

The import pipeline must validate type, size, schema and content. Active content/macros are never executed.

## Core security invariants

1. Knowing an entity UUID does not grant access to it.
2. Being authenticated does not grant access to every project.
3. A project member cannot access another project's data.
4. Public repository content must be safe to disclose publicly.
5. Client-side validation never replaces server-side authorization/integrity rules.
6. External content is data, never executable application code.
7. An export profile contains only fields explicitly allowed for that profile.
8. A failed authorization attempt never falls back to cached cloud access permissions silently.

## Future threat model

A complete threat model will enumerate assets, entry points, adversaries, abuse cases, mitigations, detection and tests. This file defines the initial trust-boundary foundation only.
