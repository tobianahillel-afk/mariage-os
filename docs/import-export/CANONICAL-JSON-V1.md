# Canonical Mariage OS JSON v1

Status: **Normative logical exchange contract**

Lot 4 will translate this contract into machine-readable JSON Schema files and parser validators. This document defines the semantics that those schemas must enforce.

Canonical JSON is the preferred format for rich ChatGPT/tool-generated imports because it can preserve nested spaces, offers, facts, observations, sources and remote media references.

---

## 1. Common envelope

Every canonical domain import has:

```json
{
  "format": "mariage-os",
  "domain": "venues",
  "schemaVersion": "1.0",
  "sourceNamespace": "chatgpt-wedding-research",
  "generatedAt": "2026-09-02T20:00:00Z",
  "locale": "fr-FR",
  "items": []
}
```

### Required envelope fields

- `format`: exactly `mariage-os`.
- `domain`: supported domain identifier.
- `schemaVersion`: supported semantic schema version.
- `sourceNamespace`: stable namespace used with external IDs; must not impersonate a different importer namespace casually.
- `generatedAt`: ISO 8601 timestamp.
- `items`: array.

### Optional envelope fields

- `locale` for human-origin formatting interpretation metadata; canonical values themselves remain normalized.
- `metadata` object containing non-sensitive generator notes/version.

Unknown future schema version is rejected safely before mutation.

---

## 2. Common item metadata

Importable top-level items should use:

```json
{
  "externalId": "venue-s32",
  "operation": "upsert"
}
```

`externalId` is stable inside `sourceNamespace`.

Supported operation for ordinary V1 imports defaults to `upsert`. Destructive delete is not inferred and is not part of ordinary default canonical imports.

Optional:

- `importNote` — non-authoritative provenance note.
- `tags` — previewed values; unknown new tags/categories are not silently created if ambiguity exists.

---

# 3. Venue domain v1

Example shape:

```json
{
  "format": "mariage-os",
  "domain": "venues",
  "schemaVersion": "1.0",
  "sourceNamespace": "chatgpt-wedding-research",
  "generatedAt": "2026-09-02T20:00:00Z",
  "items": [
    {
      "externalId": "venue-s32",
      "code": "S32",
      "name": "Domaine Example",
      "status": "shortlist",
      "location": {
        "addressLine1": null,
        "postalCode": "00000",
        "city": "Example",
        "region": "Provence-Alpes-Côte d'Azur",
        "countryCode": "FR",
        "latitude": 43.0,
        "longitude": 5.0
      },
      "contact": {
        "websiteUrl": "https://example.invalid",
        "phone": null,
        "email": null
      },
      "spaces": [],
      "facts": [],
      "offers": [],
      "availability": [],
      "remoteMedia": [],
      "sources": []
    }
  ]
}
```

## Venue identity fields

- `externalId`: required for canonical upsert.
- `code`: optional human code.
- `name`: required, non-empty.
- `status`: optional; unknown/new imports should usually use `research`/`shortlist` rather than claiming final selected states.
- `summaryNote`: optional; imports must not overwrite private couple notes by default.

## Location

Normalized numeric coordinates; no string `"43,2"` in canonical JSON.

Coordinates are optional but when supplied must be valid ranges.

## Spaces

```json
{
  "externalId": "venue-s32-space-main",
  "name": "Main hall",
  "spaceType": "reception_room",
  "indoor": true,
  "areaM2": 300,
  "lengthM": null,
  "widthM": null,
  "heightM": 6.5,
  "capacitySeated": 200,
  "capacityCocktail": 250,
  "notes": null
}
```

Nested `externalId` is stable within same source namespace and parent context.

## Sources

Top-level venue sources can be defined once and referenced by `sourceExternalId`:

```json
{
  "externalId": "src-s32-official-capacity",
  "sourceType": "official_website",
  "title": "Venue official capacity page",
  "url": "https://example.invalid/capacity",
  "evidenceLevel": "official",
  "observedAt": "2026-09-02T19:00:00Z",
  "note": null
}
```

Allowed evidence-level semantic names are defined by domain facts/sources documentation and finalized in typed schema.

## Facts

```json
{
  "key": "external_caterer_allowed",
  "state": "known",
  "observations": [
    {
      "value": true,
      "evidenceLevel": "official",
      "observedAt": "2026-09-02T19:00:00Z",
      "sourceExternalId": "src-s32-catering"
    }
  ]
}
```

Rules:

- `key` should match `DEFAULT-CRITERIA.md` when semantics exist.
- `state` may be `known`,`unknown`,`not_applicable`,`conflict`.
- for `known`, at least one usable value/observation is normally expected.
- imports add observations rather than silently discarding stronger existing ones.
- an import should not assert `conflict` merely because it lacks data; `unknown` is different.

Observation `value` uses native JSON type appropriate to fact definition:

- boolean;
- number;
- string;
- array for multiselect;
- normalized object only for defined complex value type.

Money observation values use an exact structured representation, e.g.:

```json
{ "minor": 950000, "currency": "EUR" }
```

not floating `9500.00` as authoritative money.

## Offers

```json
{
  "externalId": "venue-s32-offer-summer-sat",
  "name": "Summer Saturday",
  "status": "quoted",
  "validFrom": "2027-05-01",
  "validTo": "2027-09-30",
  "weekday": 6,
  "baseAmount": { "minor": 950000, "currency": "EUR" },
  "includedGuestCount": 180,
  "extraGuestAmount": null,
  "depositAmount": null,
  "securityDepositAmount": null,
  "components": [],
  "sourceExternalId": "src-s32-quote",
  "notes": null
}
```

Weekday convention must match documented DB/domain convention and machine schema.

## Availability

```json
{
  "eventDate": "2027-06-20",
  "status": "available",
  "optionExpiresAt": null,
  "observedAt": "2026-09-02T19:00:00Z",
  "sourceExternalId": "src-s32-email"
}
```

## Remote media

```json
{
  "externalId": "venue-s32-media-exterior-01",
  "mediaType": "image",
  "category": "exterior",
  "remoteUrl": "https://example.invalid/photo.jpg",
  "sourcePageUrl": "https://example.invalid/gallery",
  "caption": "Exterior view"
}
```

Canonical research import does not embed base64 binary media. Portable binary backup uses `.mariage`.

---

# 4. Guests domain v1

Canonical guest imports can represent households and people:

```json
{
  "format": "mariage-os",
  "domain": "guests",
  "schemaVersion": "1.0",
  "sourceNamespace": "legacy-guest-workbook",
  "generatedAt": "2026-09-02T20:00:00Z",
  "items": [
    {
      "externalId": "household-001",
      "displayName": "Example household",
      "guestGroup": "family",
      "members": [
        {
          "externalId": "guest-001",
          "firstName": "Alice",
          "lastName": "Example",
          "category": "family",
          "priority": 1,
          "attendanceProbability": 1.0,
          "rsvpStatus": "pending",
          "ageGroup": "adult"
        }
      ]
    }
  ]
}
```

Rules:

- probabilities canonical range 0..1;
- exact names are data, not identity keys;
- ambiguous same-name matches never auto-merge without external ID/strong matching evidence;
- household external ID and member external IDs are stable within namespace.

---

# 5. Vendors domain v1

```json
{
  "externalId": "vendor-caterer-001",
  "vendorType": "caterer",
  "name": "Example Caterer",
  "status": "research",
  "contact": {
    "websiteUrl": "https://example.invalid",
    "phone": null,
    "email": null
  },
  "facts": [],
  "offers": [],
  "contacts": [],
  "sources": []
}
```

Fact semantics reuse stable vendor/caterer keys from `DEFAULT-CRITERIA.md`.

---

# 6. Tasks domain v1

Canonical task import supports:

```json
{
  "externalId": "task-001",
  "title": "Ask venue for room plan",
  "status": "todo",
  "priority": "high",
  "owner": { "type": "unassigned" },
  "dueAt": null,
  "links": [
    { "targetType": "venue", "targetExternalId": "venue-s32" }
  ]
}
```

Imports may not assign an owner user by arbitrary external email unless mapping to an existing project member is explicitly previewed/resolved.

---

# 7. Budget domain v1

```json
{
  "externalId": "budget-venue-s32",
  "category": "venue",
  "label": "Venue hire",
  "status": "estimated",
  "calculationType": "fixed",
  "estimatedAmount": { "minor": 950000, "currency": "EUR" },
  "links": [
    { "targetType": "venue", "targetExternalId": "venue-s32" }
  ]
}
```

Canonical imports do not mark payments `paid` without explicit input/provenance; imported estimates cannot silently rewrite contracted financial truth.

---

# 8. Null / missing / unknown semantics

These differ:

- JSON property **missing**: importer supplied no opinion/change for that field.
- property `null`: value is explicitly absent only where schema gives null meaning; it must not universally mean unknown.
- fact state `unknown`: known semantic fact exists but current value is unknown.
- fact state `not_applicable`: criterion does not apply.
- fact state `conflict`: incompatible credible observations require resolution.

Default merge logic treats missing properties as **no change**, never delete.

---

# 9. Protected fields

Canonical ordinary import cannot directly change protected runtime/system properties such as:

- DB UUID;
- `project_id`;
- revision;
- audit actor/timestamps;
- membership/roles;
- final locked decisions;
- payment evidence truth without explicit supported financial import contract;
- storage paths;
- server operation receipts.

These are generated/resolved by application/runtime.

---

# 10. Unknown fields

Within same supported schema version, unknown properties are rejected or warned according to parser strictness chosen in Lot 4. The importer must not silently store arbitrary unknown JSON into a generic blob simply to “not lose data” because this bypasses schema/domain review.

A future compatible extension requires schema versioning.

---

# 11. Normalization

Canonical JSON always uses:

- UTF-8;
- ISO date/timestamps;
- decimal JSON numbers only for non-money numerical values;
- money as minor-unit object;
- probabilities 0..1;
- stable machine keys;
- ISO country/currency codes where applicable.

Localized strings such as `9 500,00 €` belong to ad-hoc CSV/XLSX parser input, not canonical JSON.

---

# 12. Validation and commit

Even schema-valid canonical JSON still goes through:

- project/domain validation;
- duplicate matching;
- evidence precedence;
- protected-field checks;
- preview;
- transactional commit;
- import provenance/history.

Schema validity is not permission to bypass business rules.

---

# 13. Round-trip contract

For the subset declared lossless:

`canonical export → import into empty compatible project → canonical export`

must preserve domain semantics, stable external IDs (when exported), observations/sources and nested relationships modulo generated internal UUID/audit timestamps/order where order is semantically irrelevant.

Golden fixtures test this behavior.
