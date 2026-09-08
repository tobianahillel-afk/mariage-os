# Venue Commercial Workflow — WP-2.6 Boundary Addendum

Status: **Normative V1 addendum for WP-2.6 implementation boundaries**

Purpose: close the implementation-level ambiguities left intentionally open by `VENUE-COMMERCIAL-WORKFLOW-ADDENDUM.md`: canonical phone/WhatsApp storage, retry/idempotency semantics for append-oriented Venue commercial history, and deterministic availability read-model selection.

This addendum controls WP-2.6 where it is more specific. It does not widen WP-2.6 scope, add a communications provider, create Task/Budget authority, or change the accepted project/auth/RLS foundations.

## 1. Canonical phone and WhatsApp identifiers

WP-2.6 does **not** parse locale-dependent phone formats.

For Venue contact phone-like values, canonical application storage is an international numeric identifier in this exact grammar:

```text
^\+[1-9][0-9]{1,14}$
```

Therefore:

- a non-null canonical value starts with one ASCII `+`;
- it contains 2..15 ASCII digits after the `+`;
- the first digit after `+` is `1..9`;
- spaces, parentheses, hyphens, dots, extensions, alphabetic vanity text and other punctuation are not part of the canonical stored value;
- a leading international dial prefix such as `00` is not silently rewritten to `+`;
- local/national numbers without an explicit international prefix are rejected rather than guessed from project locale/country;
- Unicode digit lookalikes are rejected; canonical digits are ASCII `0..9` only;
- input is ECMAScript-trimmed at the application boundary before validation; blank optional input canonicalizes to null;
- control characters or any non-canonical content cause validation failure, never silent sanitization.

The grammar is a deterministic storage/identity boundary only. Passing it does **not** assert that a number is allocated, reachable, mobile-capable, or registered with WhatsApp.

When a contact field specifically represents a WhatsApp destination, it uses the **same canonical numeric grammar**. WP-2.6 does not invoke WhatsApp, test account registration or claim message delivery.

The existing packet maximum `phone: 80 Unicode code points` remains a generic resource preflight bound; this canonical grammar is intentionally stricter and therefore shorter.

TypeScript normalization, PostgreSQL constraints/RPC validation and provider-response parsing must agree on the exact same canonical form. Regression tests cover null/blank, smallest/longest supported forms, leading zero, local format, `00` prefix, punctuation, Unicode digits, controls and overlength/noncanonical values.

## 2. Append-only retry identity

`venue_availabilities` and Venue-owned `interactions` are append-oriented historical rows. A network retry must not silently create a second historical event for the same logical append.

WP-2.6 uses the row's existing application-owned UUID primary key as the retry identity; it does **not** add a second hidden `operation_id` column.

### 2.1 Command contract

For creation of an availability observation or interaction:

1. the application/caller generates a canonical UUID `id` **once**, before the first remote attempt;
2. every retry of that same logical append reuses exactly that `id`;
3. the server/database command validates project membership, parent relationships and the complete canonical payload before accepting the append;
4. first valid use of the UUID inserts the immutable row;
5. replay of the same UUID is idempotent only when the already-stored row belongs to the same authorized project/parent and its immutable client-controlled semantic payload is canonically equal to the retried payload;
6. same UUID with a different semantic payload is a typed conflict and never mutates/replaces the existing historical row;
7. a UUID belonging to another project must never cause that foreign row or payload to be returned or disclosed; ordinary authorization/non-disclosure rules still apply.

Server-generated fields such as `created_at`, server audit identity and provider transport metadata are not part of replay-payload equality. All client-controlled immutable relationship and business fields are.

### 2.2 Exactly-once claim boundary

WP-2.6 may describe **same-ID replay as idempotent**. It must not claim global exactly-once delivery:

- two separately generated UUIDs represent two distinct append intents even if their payloads happen to be equal;
- automatic content-based deduplication is not introduced;
- retry code must preserve the original UUID rather than generating a replacement ID after an ambiguous network result;
- later offline/sync work may carry this stable entity/operation identity through its queue but must not change historical semantics.

This aligns with the repository contract that application-owned entities may use secure client-generated UUIDs and mutation context may carry operation identity, without introducing a parallel idempotency table in WP-2.6.

### 2.3 Deterministic Venue availability read model

`venue_availabilities` remains append-only historical evidence. "Latest" or "relevant" is a derived read-model decision only; it never mutates, deletes or rewrites an observation.

For one authorized project, Venue and `event_date`, the relevant observation set is every availability row matching that exact project/Venue/date. `date_option_id` is retained contextual provenance and does not partition observations for the same civil event date; changing which candidate date option is selected therefore changes which `event_date` the caller asks about, not historical rows.

When more than one observation exists for that Venue/date, the canonical deterministic order is:

1. `observed_at DESC` — most recently observed business evidence first;
2. `created_at DESC` — if business observation instants are equal, the most recently appended stored observation first;
3. canonical UUID `id ASC` — final stable tie-break only when both instants are equal.

The UUID tie-break carries **no** business recency meaning. It exists only so every conforming read model returns the same row under an otherwise indistinguishable tie. Provider queries may return rows in any order; application/domain selection must not trust provider ordering unless the complete canonical order is enforced and then still validates returned identities/rows.

Absence of an observation is **not** synthesized into a stored or effective `unknown` observation. No observation and an explicit historical observation whose status is `unknown` remain distinguishable.

For the selected latest observation, effective availability at an explicit evaluation instant follows:

- when stored `status != 'option_held'`, effective status equals the stored status;
- when stored `status = 'option_held'` and `option_expires_at` is strictly later than the evaluation instant, effective status remains `option_held`;
- when stored `status = 'option_held'` and `option_expires_at` is equal to or earlier than the evaluation instant, effective status is derived as `expired`;
- deriving `expired` never changes the stored historical `status='option_held'` row and never appends an `expired` row automatically;
- if an explicit later `expired` observation exists, ordinary canonical latest-selection rules select it like any other observation.

The evaluation instant uses the frozen strict absolute-instant profile in `DATES-TIME.md`. Tests must prove equal-`observed_at` ordering, equal-`observed_at`/`created_at` UUID tie-breaking, explicit-unknown versus no-observation, held-before-expiry, held-at-expiry, held-after-expiry and non-mutation of history.

## 3. Mutable create/update entities

`venue_offers`, Venue-owned `offer_components` and Venue-owned `contacts` keep their frozen create/update and expected-revision semantics. This addendum does not turn their mutable lifecycle into append-only history.

A client-generated UUID remains normal application entity identity. Ordinary optimistic revision and lifecycle checks still govern later mutation.

## 4. Required boundary tests

In addition to `VENUE-COMMERCIAL-WORKFLOW-ADDENDUM.md` §12, WP-2.6 Pass A must prove:

- TypeScript ↔ PostgreSQL ↔ provider parity for the canonical phone/WhatsApp grammar;
- no locale-derived phone guessing or punctuation stripping;
- availability same-ID/same-payload replay returns one historical row;
- interaction same-ID/same-payload replay returns one historical row;
- same-ID/different-payload replay fails atomically and preserves the first row;
- replay cannot cross project, venue, date/contact/source parent boundaries or disclose a foreign row;
- retry uses the caller-supplied stable UUID rather than server-generated replacement identity;
- availability latest/relevant selection follows the complete canonical `observed_at DESC, created_at DESC, id ASC` order independently from provider row order;
- elapsed `option_held` derives effective `expired` without mutating or appending history;
- direct SQL/RPC write-around attempts cannot bypass append immutability or the replay conflict rule;
- malformed provider responses remain fail-closed.

## 5. Scope fence

This addendum does not implement or specify:

- Email/WhatsApp provider sending, delivery receipts or provider message idempotency;
- Task/reminder idempotency;
- offline mutation queue mechanics (WP-2.10/2.12);
- content-based duplicate detection;
- imported communication-message reconciliation;
- Vendor contacts/interactions (Lot 7).

It only freezes the deterministic WP-2.6 contact-value, append-retry and availability read-model boundaries needed before Pass A.