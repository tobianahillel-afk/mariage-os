# Import Merge Rules

## Default: conservative smart merge

The default import mode:

- creates unmatched new entities;
- updates safe matched fields;
- preserves unrelated existing fields;
- never deletes by omission;
- never silently downgrades stronger evidence;
- surfaces genuine conflicts/protected changes.

## Field comparison classes

### Missing existing value

Existing `unknown/null`, valid imported value → eligible to fill.

### Same value

No semantic change; record provenance/import session if needed without creating noisy duplicate history.

### Stronger compatible evidence

Imported observation agrees with retained value but provides better source/freshness → add evidence and optionally raise confidence.

### Weaker conflicting evidence

Do not replace retained stronger value. Preserve as observation/conflict signal as domain policy dictates.

### Comparable/newer conflicting evidence

Surface field conflict or create conflicting observation. User may retain one value, keep both as observations or mark to verify.

### Protected field

Requires explicit high-impact review; default smart merge does not alter it.

## Source-aware merge

Ranking considers:

- contractual/event-specific confidence;
- source type;
- freshness;
- context applicability;
- manual lock/protected state.

No single “latest timestamp wins” rule applies to all domain facts.

## Independent fields

If the import changes `price` while the partner manually changed `rating`, both changes can coexist.

## Arrays/collections

### Appendable sets

Sources/tags/photos with stable unique IDs/hashes may append/deduplicate.

### Ordered/versioned data

Quote versions remain historical; a new quote does not overwrite the binary/history of an old quote.

## Deletes

Absence is not deletion.

A destructive synchronization mode, if ever supported, is separate, scoped and previewed with explicit deletions.

## Manual edits after prior import

A later re-import cannot blindly reset a field that was manually changed after the earlier import. Compare revision/provenance and surface as needed.

## Atomicity

Critical bulk imports (financial/restore) should be atomic where practical: all valid operations commit or none do.

Noncritical large imports may allow partial-valid apply only when explicitly selected and with a complete error report.

## Tests

Test unknown fill, same value, stronger/weaker evidence, manual-after-import edit, protected fields, append collections, quote versions, independent-field merge and no deletion by absence.
