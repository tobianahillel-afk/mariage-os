# Runtime Input Validation and Canonicalization

Status: **Normative V1 security/data-boundary contract**

TypeScript types do not validate runtime data. Every value crossing an untrusted boundary must be parsed/validated before use in domain logic, persistence, URL construction, rendering or privileged operations.

## 1. Boundary inventory

Untrusted or version-sensitive input includes:

- HTML form controls;
- pasted/clipboard content;
- route params and query strings;
- CSV/XLSX/JSON imports;
- `.mariage` archives;
- uploaded file metadata;
- external URLs;
- network/API/provider responses;
- IndexedDB/local cache after application/schema upgrades;
- postMessage/service-worker messages if introduced;
- future webhook/public API payloads.

## 2. Validation architecture

The codebase must have centralized runtime schemas/parsers (library chosen in Lot 0/1 under dependency policy) rather than ad hoc checks scattered across views.

Flow:

```text
raw input
  ↓
size/count preflight
  ↓
syntax/type parser
  ↓
field canonicalization where appropriate
  ↓
semantic/domain validation
  ↓
authorized command/service
  ↓
DB constraints/RLS/domain invariant revalidation
```

Client validation improves UX; authoritative security/integrity checks remain in server/database/domain boundaries where necessary.

## 3. Allowlist first

Prefer known-good validation:

- enum values from stable allowlists;
- numeric ranges;
- date/time parsers with exact locale/ISO rules;
- currency codes from allowed project/app set;
- URL schemes/origins according to field purpose;
- known sort/filter keys mapped to predefined query expressions;
- known import schema versions.

Do not attempt to make arbitrary unsafe input safe by maintaining a blacklist of attack strings.

## 4. Length and resource limits

Every user-controlled string/collection has a documented upper bound appropriate to the field or operation.

At minimum define/verify limits for:

- display names/titles;
- notes/descriptions;
- URLs;
- search terms;
- tags/categories;
- CSV/XLSX rows/columns/sheets;
- JSON nesting/object/array counts;
- upload bytes/image dimensions;
- backup archive entries/decompressed bytes;
- bulk command batch size.

Reject or explicitly truncate only where the product contract allows it. Silent truncation of meaningful data is forbidden.

## 5. Unicode and canonicalization

Human text is preserved for display. Security/comparison normalization must not destructively rewrite the original value.

Examples:

- email comparison uses the provider/normalized-email contract, not arbitrary display-name normalization;
- tags/category duplicate matching may use a separate normalized key;
- file names are treated as labels and never trusted as Storage paths;
- URLs are parsed using standards-aware URL APIs, not regular-expression concatenation;
- Unicode confusable handling may be considered for usernames/public identifiers if such identifiers become security-sensitive; ordinary guest/venue names are not modified just because they contain non-ASCII characters.

Normalization itself must not create a bypass where validation happens before a dangerous transformation. Parse/canonicalize/validate order is explicitly tested per boundary.

## 6. Numbers and money

- authoritative money parses into integer minor units + currency;
- reject overflow/NaN/Infinity;
- percentages/probabilities validate exact supported range;
- quantities/capacities cannot silently accept negative values where domain-invalid;
- locale-aware decimal parsing is explicit;
- numeric strings with unexpected trailing text are not partially parsed as valid numbers.

## 7. Dates and times

- civil date uses frozen `date` semantics;
- timestamps are ISO/absolute where required;
- imported ambiguous date formats require explicit locale/mapping/preview;
- timeline next-day semantics use explicit day offset;
- invalid calendar dates are rejected, not auto-normalized silently.

## 8. URLs

Use the platform URL parser. Field-specific allowlists apply.

Navigation/source URLs:

- normally `https:`;
- `http:` may be stored only where needed for public legacy source reference and never carries private secrets;
- reject `javascript:`, `vbscript:`, executable `data:` targets and unexpected custom schemes;
- external redirect/return URLs are constrained to registered/allowlisted destinations;
- private data is not serialized into remote URLs/query strings unnecessarily.

Future server-side arbitrary URL fetches require the separate SSRF controls in `SECURITY-CONTROL-BASELINE.md`.

## 9. HTML/rich content

V1 user content is plain text. HTML-looking input remains text.

If rich content is later introduced:

- a single audited sanitizer/Trusted Types policy boundary is used;
- allowed tags/attributes/protocols are explicit;
- sanitizer bypass tests are mandatory;
- raw unsanitized content never flows to an executable DOM sink.

## 10. Validation errors

Errors must be useful but non-revealing:

- identify field/constraint where appropriate;
- do not echo executable HTML unsafely;
- do not expose SQL/policy/stack/secret internals;
- bulk import produces row/field-level safe errors and preserves original source context for the authorized user.

## 11. Trust revalidation

Previously validated data may require validation again when crossing a new trust/version boundary. Examples:

- IndexedDB row after schema migration;
- old backup restored by a newer app;
- API response after provider/schema change;
- imported canonical JSON from another tool/version.

Do not equate “came from our database” with “forever safe for every sink.” Output context still matters.

## 12. Tests

Required adversarial cases include:

- empty/null/missing/overlong strings;
- Unicode/RTL/control characters;
- HTML/script payloads;
- dangerous URL schemes/encoded variants;
- numeric overflow/NaN/Infinity/locale ambiguity;
- invalid/ambiguous dates;
- huge arrays/nesting;
- malformed/partial JSON;
- unexpected enum values;
- route IDs from another project;
- stale local schema values;
- validation-before-normalization bypass attempts.

Every validation bug gets a regression fixture/test.