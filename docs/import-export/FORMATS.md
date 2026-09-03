# Import / Export Formats

## Canonical format hierarchy

### CSV

Best for one simple entity/table at a time and interoperability.

Canonical machine headers use stable snake_case English identifiers even if the UI is French.

Example venue CSV headers may include:

```text
external_id,code,name,status,city,region,country,website,capacity_seated,main_room_area_m2,external_caterer,notes
```

CSV cannot represent the full nested project model without companion files; it is intentionally limited.

### XLSX

Human-friendly richer import/export.

A domain workbook may use multiple sheets.

Venue workbook concept:

- Venues
- Spaces
- Facts
- Sources
- Offers
- Photos

Rows link using stable external IDs/codes where documented.

XLSX macros are never executed.

### Canonical Mariage OS JSON

Preferred complete machine-to-machine/research exchange.

Envelope example:

```json
{
  "format": "mariage-os",
  "domain": "venues",
  "schemaVersion": "1.0",
  "sourceNamespace": "example-importer",
  "generatedAt": "2026-09-02T22:00:00Z",
  "items": []
}
```

Nested entities can include spaces, facts/observations, sources, offers and remote media references.

### `.mariage`

Full recovery archive, versioned separately from ordinary domain JSON. Contains manifest, data, optional binary files and checksums.

### Clipboard table

Tab/newline-separated text parsed as an ad-hoc table and routed through the same detection/mapping/preview pipeline as CSV.

## Schema versions

Every canonical JSON/backup format declares a schema version.

- supported older version → migrate in preview/restore;
- unsupported future version → reject safely with upgrade message;
- never “best effort” partially import unknown future schema as if complete.

## Locales

Canonical machine formats remain locale-neutral:

- ISO dates;
- normalized decimal/money representation;
- probabilities normalized to documented schema.

Ad-hoc CSV/XLSX input can parse French formatting with preview.

## External IDs

Importable entities should carry `external_id` plus namespace when possible for safe repeated updates.

## Sources

Canonical formats can attach source metadata per fact/observation, not only one URL for the entire row.

## Photos

Canonical JSON should prefer remote URL + source page metadata rather than embedding large binary image payloads. `.mariage` is the format for portable binaries.

## Round-trip

Canonical JSON exports of supported domain data must be re-importable without semantic loss within the documented scope.

## Templates

Public repository will contain versioned synthetic templates for common imports. Real project exports are never committed.
