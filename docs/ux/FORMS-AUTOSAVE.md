# Forms, Drafts and Autosave

Status: **Normative UX/data-safety contract**

Long forms must not make users fear losing work. At the same time, Mariage OS must not persist invalid half-values as confirmed domain truth.

## Form categories

### Immediate field edit
Examples: venue note, rating, simple fact value.

Behavior:
- edit locally;
- validate;
- persist durable local mutation;
- show `Saving…`/`Saved`/`Pending sync` state;
- sync asynchronously.

### Multi-field structured form
Examples: new offer, payment, contact, import mapping.

Behavior:
- maintain local draft;
- validate fields incrementally;
- only create/update canonical domain record when minimum valid commit contract is met;
- preserve draft across accidental navigation/reload where practical.

### Destructive/admin form
Examples: permanent deletion, membership/admin action.

Behavior:
- no background autosubmit;
- explicit confirmation;
- reauthentication where security policy requires it.

## Minimal creation

Creating a venue/vendor/task must require only the minimum identity fields needed to create a useful draft record. Optional detail can be completed later.

The product must not force users to complete dozens of fields before saving an idea.

## Validation timing

- obvious format/range errors may show after field interaction;
- do not show every untouched optional field as red error;
- cross-field/domain validation runs before canonical commit;
- server/RLS errors are handled separately from client validation.

## Autosave state

User-visible save/sync state may include:

- Draft saved on device;
- Saving locally;
- Saved / synced;
- Saved locally — waiting for connection;
- Conflict needs review;
- Could not save locally.

Never display `Saved` if the operation has not reached the documented durable local-save point.

## Debounce

Text edits may use a short debounce for local mutation creation/sync batching, but the currently typed value remains in component state immediately.

Before destructive navigation/close where a debounce has not persisted yet, flush the draft/local save if technically possible.

## Navigation

Internal navigation should not discard an active draft without warning/recovery.

External links normally open separately so a source lookup does not destroy the form.

## Cancel

For structured drafts, `Cancel` discards only the current uncommitted draft after appropriate confirmation if meaningful work exists. It must not revert unrelated already-committed/synced fields silently.

## Undo

Simple reversible changes may offer undo. Undo itself is a new valid mutation/history event, not a secret deletion of audit history.

## Numeric/money inputs

UI accepts user-friendly localized entry but converts to canonical exact domain representation only after validation. Intermediate values such as `9 ` or `9,` while typing must not cause destructive normalization.

## Dates/time

Date inputs distinguish civil date from timestamp. Times after midnight are interpreted according to the explicit event-date/time contract, not guessed from browser timezone.

## Tri/quad-state facts

For facts where `unknown`, `yes`, `no`, `not applicable` or `conflict` differ, the UI must make the selected semantic state explicit. A blank checkbox cannot encode all states.

## Offline

Eligible forms work offline using local drafts/mutations. Forms requiring server-only authorization/admin operations clearly state that connection is required.

## Tests

- close/reopen draft recovery;
- debounce flush/navigation;
- invalid input does not corrupt canonical record;
- offline edit survives restart;
- external-link action preserves draft;
- session expiry does not lose local draft;
- conflict after editing retains both local/remote values;
- localized money/date parsing boundary cases.
