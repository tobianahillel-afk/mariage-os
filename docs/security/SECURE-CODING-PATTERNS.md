# Mariage OS — Secure Coding Patterns and Prohibited Primitives

Status: **Normative secure-development contract**

Purpose: make secure implementation choices repeatable. A developer should not have to rediscover common security pitfalls while implementing each feature.

## 1. General rule

Prefer well-maintained platform/provider/library primitives whose security properties are understood over custom parsing, crypto, authentication, token, escaping or query mechanisms.

Security-sensitive convenience helpers must be centralized, typed, tested and reviewable.

---

# 2. DOM/rendering

### Preferred

- `textContent` for plain user text;
- safe attribute/property setters;
- DOM node creation rather than HTML string concatenation;
- URL objects plus field-specific protocol allowlist;
- CSS classes/tokens from static mappings.

### Prohibited by default

- `innerHTML`, `outerHTML`, `insertAdjacentHTML` with untrusted strings;
- `document.write`;
- untrusted inline SVG/HTML;
- `eval`;
- `new Function`;
- string-to-code timer forms;
- setting event-handler attributes from user content;
- dynamic script URL from user/imported data.

If a future feature genuinely requires rich HTML, one centralized sanitizer + Trusted Types policy boundary is required; scattered sanitizer calls are not accepted.

---

# 3. Randomness/tokens/IDs

### Preferred

- `crypto.randomUUID()` for non-secret UUID identifiers where appropriate;
- Web Crypto / provider cryptographically secure random generation for secrets/tokens/nonces;
- server/provider-generated invitation/auth tokens when that boundary owns verification.

### Prohibited

- `Math.random()` for invitation tokens, reset secrets, nonces, cryptographic keys or any security decision;
- timestamp/counter/email-derived security tokens;
- predictable sequential secret links.

Random UUIDs are identifiers, not authorization.

---

# 4. Cryptography

### Preferred

- provider Auth cryptography;
- Web Crypto/platform standard primitives;
- frozen `.mariage` authenticated-encryption contract;
- SHA-256 for integrity/dedup where the threat model calls for it.

### Prohibited

- custom cipher/MAC/password-hash design;
- ECB mode;
- unauthenticated encryption for private backups;
- hard-coded encryption keys;
- reusing nonce/IV where the chosen algorithm requires uniqueness;
- treating hashes as encryption;
- storing password/backup secret to “help recovery.”

Changing backup cryptographic algorithms/parameters requires security review and migration/version handling.

---

# 5. Database queries

### Preferred

- Supabase/PostgREST typed query primitives;
- parameterized/static SQL;
- narrow reviewed RPC;
- `EXECUTE ... USING` for unavoidable PL/pgSQL dynamic data values;
- allowlisted static identifier mapping.

### Prohibited

- concatenating user input into SQL;
- client-supplied raw SQL/WHERE/ORDER expressions;
- generic `execute_sql(text)` RPC;
- trying to prevent injection primarily by replacing quotes/escaping attack strings.

See `SECURE-DATABASE-QUERIES.md`.

---

# 6. Object/JSON handling and prototype pollution

Imports and JSON objects are untrusted.

Requirements:

- runtime schema validation strips/rejects unknown fields according to schema policy;
- reject dangerous object keys such as `__proto__`, `prototype`, `constructor` where they could reach object-merge/property assignment code;
- avoid recursive generic deep-merge of untrusted objects into application/configuration objects;
- construct domain objects from explicit validated fields;
- use null-prototype maps or `Map` when user keys are truly arbitrary and object prototype behavior is unnecessary;
- never merge import JSON into permission/security/config objects.

Tests include prototype-pollution payloads.

---

# 7. Regular expressions / ReDoS

### Preferred

- static reviewed regex for bounded input;
- simple parser/platform API when possible;
- escape user strings before including them in a regex if regex matching is actually needed;
- input-length limits before expensive matching.

### Prohibited

- compiling arbitrary user/imported strings directly into regex;
- catastrophic/backtracking-heavy regex on unbounded attacker-controlled input;
- using one giant regex as a URL/email/file parser when a standards-aware parser exists.

Performance/security tests include pathological long input for security-relevant regexes.

---

# 8. URLs and navigation

### Preferred

- `new URL(value, allowedBase)`/platform parser;
- explicit allowlisted protocols;
- stable internal route builder;
- allowlisted redirect targets.

### Prohibited

- string prefix checks such as `startsWith('https')` as sole URL validation;
- arbitrary `returnTo` external URLs;
- user-controlled scheme passed directly to `window.location`;
- private secrets/project payload in external URL query params.

---

# 9. Network/fetch

Browser fetches go only to intended providers/origins.

If future server code fetches a user URL, SSRF controls become mandatory; never write a generic privileged `fetch(userUrl)` service.

Requests:

- use explicit method/content type;
- bound body/response where we control endpoints;
- use timeouts/abort for long external operations where relevant;
- do not auto-follow arbitrary credential-bearing redirects;
- do not attach Authorization/service credentials to third-party URLs.

---

# 10. Shell/process execution

V1 frontend has no shell/process execution requirement.

If future Workers/server/tooling introduces process execution:

- never concatenate user/imported input into a shell command;
- prefer direct library/API calls or argument-array process spawning without shell parsing;
- strict allowlists for any external binary/argument choices;
- no processing of wedding/user data through arbitrary developer shell templates.

Introducing runtime command execution is a security-review event.

---

# 11. File paths

- Storage keys use opaque IDs/project scoping, not raw filenames;
- archive extraction validates normalized target path remains within extraction root;
- reject absolute paths, `..`, symlinks/hardlinks where archive policy forbids them;
- file display name is metadata only;
- no user filename becomes HTML/URL path without safe encoding/routing.

---

# 12. Numeric operations

- money uses integer minor units;
- check safe integer/DB bigint conversion boundaries;
- reject `NaN`/Infinity;
- no parse-and-ignore trailing garbage (`parseInt('10evil')`) for authoritative domain values;
- protect count/size multiplication/addition from overflow/resource-allocation surprises.

---

# 13. Serialization

- JSON only for expected structured data; no code serialization/deserialization;
- version schemas explicitly;
- reject unsupported future schemas;
- no use of `eval` to parse JSON;
- no deserialization mechanism capable of instantiating arbitrary classes/code from imported data.

---

# 14. Authentication/authorization helpers

- UI permission helpers are UX convenience only;
- database/RPC/Storage checks remain authoritative;
- helper names should express precise permission (`can('finance.write')`) rather than vague `isAdmin()`;
- no cached client role permanently authorizes a cloud request;
- no “temporary bypass” flags in production code.

---

# 15. Error handling

- catch only where code can recover/add useful context;
- do not swallow authorization/validation failures and continue with defaults;
- no `catch { return true }`/fail-open patterns around security decisions;
- unknown security state fails closed;
- user-facing errors are sanitized; internal correlation is privacy-safe.

---

# 16. Dependencies

- no dependency for security-sensitive behavior without maintenance/security review;
- prefer official provider SDK for Auth/backend operations;
- no abandoned sanitizer/crypto/archive parser merely because its API is easy;
- dependencies cannot silently add runtime third-party script/network origins.

---

# 17. Static/lint enforcement

Where tooling supports it, CI/lint rules should flag or forbid:

- `eval` / `new Function`;
- unsafe DOM sinks;
- accidental `console.log` of auth objects/secrets in production paths;
- direct raw provider calls from forbidden layers;
- dynamic SQL helper patterns;
- `Math.random()` in security/token modules;
- unhandled promises/type-unsafe `any` at security boundaries;
- secret-looking literals.

Security lints supplement review/tests; they do not replace them.

---

# 18. Review triggers

Mandatory security review when adding:

- new Auth provider/flow;
- new RPC/`SECURITY DEFINER` function;
- raw SQL/dynamic SQL;
- rich HTML/Markdown renderer;
- server-side URL fetch;
- new file/archive parser;
- cryptography;
- public API/webhook;
- third-party script/CDN;
- custom Worker/backend;
- platform admin/support access;
- payment integration;
- command execution.
