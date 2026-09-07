# Venue Commercial Workflow — WP-2.6 Freeze Addendum

Status: **Normative V1 addendum for Lot-2 Venue commercial persistence**

Purpose: close the implementation-level semantics for `venue_offers`, `offer_components`, `venue_availabilities`, Venue `contacts` and Venue `interactions` without pre-implementing the Budget, Task, Vendor or Document packets that consume/link this data later.

This addendum controls WP-2.6 where the broader `VENUES.md`, `STATE-MACHINES.md` or `PHYSICAL-SCHEMA-V1.md` contracts are intentionally conceptual. It does not weaken any same-project, history, money, tax, date/time, authorization or source-provenance invariant.

## 1. Ownership and scope

WP-2.6 implements only Venue-owned commercial/contact rows:

- `venue_offers`;
- Venue-owned `offer_components`;
- `venue_availabilities`;
- Venue-owned `contacts`;
- Venue-owned `interactions`.

The following remain outside WP-2.6:

- `vendor_offers` and Vendor-owned contacts/interactions/components — Lot 7;
- budget items/scenarios/calculation/payment truth — Lot 5;
- automatic follow-up Tasks — Lot 3;
- document metadata/storage and `quote_document_id` relationship — WP-2.9 plus its document dependencies;
- local/offline mutation integration — WP-2.10/2.12;
- Venue detail presentation — WP-2.11.

No WP-2.6 command creates or updates Budget/Task/Vendor/Document authority.

## 2. Staged physical-schema rule

`PHYSICAL-SCHEMA-V1.md` remains the final V1 schema target, but cross-packet relationships are introduced only when both ends exist and can satisfy same-project integrity.

Therefore:

- WP-2.6 creates `venue_offers` **without** `quote_document_id`; WP-2.9 adds the nullable column and composite same-project FK when `documents` exists;
- WP-2.6 creates generic `offer_components` with currently supported `owner_type = 'venue_offer'`; the later Vendor packet widens the allowed owner type/validator to `vendor_offer` when `vendor_offers` exists;
- WP-2.6 creates generic `contacts` / `interactions` with currently supported `parent_type = 'venue'`; the later Vendor packet widens those allowlists when the Vendor slice is implemented;
- no unvalidated UUID placeholder is stored merely to anticipate a future table.

This is staged implementation of the frozen final model, not a parallel schema.

## 3. Venue offer lifecycle

Stored offer statuses remain exactly:

- `draft`;
- `quoted`;
- `accepted`;
- `rejected`;
- `expired`;
- `superseded`.

### 3.1 Creation

A new offer may be created only as:

- `draft` for couple-entered commercial preparation that is not yet represented as a received/current quote; or
- `quoted` when recording a received/current external offer.

`accepted`, `rejected`, `expired` and `superseded` are transition states, not client-supplied creation shortcuts.

### 3.2 Allowed transitions

WP-2.6 supports exactly:

```text
draft  -> quoted
draft  -> rejected
quoted -> accepted
quoted -> rejected
quoted -> expired
quoted -> superseded
accepted -> superseded
```

`rejected`, `expired` and `superseded` are terminal for that offer row. A later/new commercial proposal is a new offer row; terminal history is not reopened or rewritten.

`accepted -> superseded` is allowed only as an explicit commercial-history transition when a later replacement offer makes that accepted proposal no longer the current planning offer. It does **not** rewrite any later contracted/paid Budget truth; Lot 5 remains authoritative for those downstream semantics.

### 3.3 Commercial-term immutability

- A `draft` may edit its commercial terms with expected-revision concurrency.
- Once an offer reaches `quoted`, its quoted commercial terms are historical and are not mutated through ordinary update.
- Later negotiation/revision is represented by a separate offer row; the prior row may transition to `superseded`.
- Status transition does not delete or rewrite the prior amounts/components/source/date range.
- No ordinary hard delete is exposed for offer history in WP-2.6.

Because the frozen physical schema does not define an offer-to-offer supersession FK, WP-2.6 does not invent one. The historical rows/statuses remain authoritative; quote-document version lineage can provide explicit document provenance once WP-2.9 exists.

## 4. Offer commercial values

Money follows `MONEY.md`:

- integer minor units only;
- explicit three-letter uppercase ISO currency;
- no binary-floating-point authoritative monetary amount;
- TypeScript/browser numeric inputs must remain safe integers; PostgreSQL boundaries mirror the supported safe-integer domain so provider reads cannot create an application-unreadable amount;
- non-negative amount columns remain non-negative.

Tax follows the frozen values:

- `included`;
- `excluded`;
- `unknown`;
- `not_applicable`.

`tax_rate_basis_points`, when present, is an integer `0..10000`. Unknown treatment remains unknown even if a rate happens to be known; the application never infers included/excluded treatment.

Offer validity uses civil dates. If both bounds exist, `valid_from <= valid_to` is required.

Weekday uses the frozen `0=Sunday ... 6=Saturday` convention.

`included_end_day_offset` is an integer `0..2`; after-midnight end time remains explicit rather than inferred from comparing wall-clock times.

## 5. Venue offer components

Component machine values remain exactly:

- `component_type`: `included`, `mandatory_extra`, `optional`;
- `calculation_type`: `fixed`, `per_guest`, `per_adult`, `per_child`, `per_table`, `per_hour`, `quantity_unit`.

WP-2.6 stores component inputs and commercial provenance only. It does **not** calculate scenario totals or define Lot-5 rounding/formula behavior.

A component belongs to exactly one same-project Venue offer. Components of a non-draft offer are historical commercial terms and cannot be edited/deleted through ordinary WP-2.6 commands; a revised quote creates a new offer/component set.

`quantity`, where supplied, is non-negative with at most three fractional decimal digits and within the physical `numeric(12,3)` range. It is commercial input, not authoritative money.

## 6. Availability observations

Availability is append-oriented evidence, not a mutable current-state row.

Statuses remain exactly:

- `unknown`;
- `available`;
- `unavailable`;
- `option_held`;
- `expired`.

Rules:

- every observation has immutable `event_date`, `status`, `observed_at`, source reference and note after creation;
- ordinary WP-2.6 mutation appends a new observation rather than updating/deleting an old one;
- multiple observations for the same Venue/date coexist;
- latest/relevant availability is a read-model selection and never deletes history;
- `date_option_id`, when present, belongs to the same project and its `event_date` equals the observation `event_date`;
- `option_expires_at` is permitted only for `option_held`; other statuses store it as null;
- an elapsed option expiry does not rewrite the held observation. The read model can treat it as no longer current, and a later explicit `expired` observation may be appended;
- changing candidate/selected wedding dates reselects relevance and never rewrites historical availability.

`observed_at` / `option_expires_at` are absolute instants and use the same strict application-readable instant domain already accepted for Lot-2 evidence boundaries rather than relying on permissive PostgreSQL timestamp text coercion.

## 7. Contacts

A WP-2.6 contact has `parent_type = 'venue'` and belongs to exactly one same-project Venue.

Contacts are collaboratively editable identity/reference rows with expected-revision concurrency. Ordinary update may change the contact's human details but never `project_id`, parent identity, audit identity or server revision directly.

`preferred_channel` is descriptive contact metadata in WP-2.6, not a communications-provider command/channel enum.

## 8. Interactions and quote follow-up

An interaction is an append-oriented historical event under one Venue. WP-2.6 exposes create/list/read, not ordinary rewrite/delete of a recorded interaction.

Required semantics:

- `parent_type = 'venue'`;
- `interaction_type` is a bounded non-empty descriptive machine/text label, not a second Venue lifecycle state machine;
- `occurred_at` is the historical interaction instant;
- `summary` is required plain text;
- `next_follow_up_at` is optional follow-up metadata only;
- `source_id` may link the interaction to existing same-project provenance;
- optional `contact_id` must belong to the **same Venue parent**, not merely the same project.

The existing Venue candidate lifecycle remains the canonical workflow state for `quote_requested`, `quote_received`, etc. WP-2.6 does not create a duplicate `reply_status` column. A service/UI may coordinate an explicit Venue lifecycle command with an appended interaction, but neither record silently derives or rewrites the other.

`next_follow_up_at` does not create or complete a Task. Lot 3 may later derive/suggest Task workflow from this data.

## 9. Sources and future quote documents

Existing `sources` from WP-2.4 can be referenced by Venue offer, availability and interaction rows only through same-project integrity.

Source mutation/breakage never deletes the commercial/history row that cited it.

`quote_document_id` remains absent until WP-2.9 owns the Document endpoint/table relationship. When added, the link is nullable, same-project and version-aware under Document contracts; it does not make the offer amount a duplicate editable Budget truth.

## 10. Validation bounds

WP-2.6 runtime and PostgreSQL boundaries reject overlong inputs; there is no silent truncation.

Use these packet-level maxima, aligned with existing Venue/text conventions:

- offer/contact/component display name or label: 240 Unicode code points;
- role label: 160;
- email: 320;
- phone: 80;
- preferred channel: 80;
- interaction type: 80;
- unit label: 80;
- notes / interaction summary: 5000;
- currency: exactly three uppercase ASCII letters;
- source IDs, venue IDs, date-option IDs, contact IDs and entity IDs: canonical UUIDs at runtime boundaries.

Human text is trimmed at required/optional label boundaries according to existing domain conventions; meaningful internal Unicode is preserved. Empty optional text canonicalizes to null. Plain text is never rendered/executed as HTML.

## 11. Authorization and integrity

All WP-2.6 rows are private project data using `venues.read` / `venues.write` semantics already established for the Venue bounded context.

Direct DB/RPC tests cover owner allow plus anon, outsider, project-B owner and revoked-member denial.

Database integrity additionally enforces:

- immutable `project_id` and protected audit/revision fields;
- Venue/date option/source/offer/contact relationships are same-project;
- interaction contact belongs to the same Venue parent;
- staged polymorphic `owner_type` / `parent_type` allowlists cannot be forged to unsupported future entity types;
- availability date-option/date equality;
- lifecycle/value constraints described above.

## 12. Required WP-2.6 tests

At minimum:

- draft offer create/edit and quoted-term immutability;
- every allowed and representative denied offer status transition;
- revised quote preserves prior offer/components and can supersede historical row without Budget mutation;
- amount safe-integer/non-negative/currency/tax/rate/date-range/weekday/day-offset boundaries;
- component enums/quantity bounds and non-draft immutability;
- availability append history, candidate-date equality, option expiry and strict instant parsing;
- source breakage/removal of URL does not destroy linked commercial/availability/interaction history;
- contact same-project CRUD/revision and parent immutability;
- interaction append-only behavior, contact-parent match and follow-up timestamp validation;
- Venue lifecycle quote states remain distinct from interaction type/follow-up metadata;
- direct owner/anon/outsider/project-B/revoked RLS matrix for every new table;
- provider response validation fails closed on wrong project/parent/date/source/enum/value shape;
- no WP-2.6 mutation creates Budget items, Tasks, Vendors or Documents;
- clean migration reset and full `npm run verify` on exact reviewed head.
