# Interaction States

Every user-facing component and screen must define more than its ideal populated state.

## Universal data states

Where relevant, UI must distinguish:

- known/confirmed;
- known/unverified;
- estimated;
- unknown;
- not applicable;
- conflicting;
- stale/revalidation suggested.

## Universal synchronization states

- synced;
- synchronizing;
- offline/pending;
- conflict;
- error with local work preserved.

## Screen states

Every major screen should define:

### Loading
Prefer immediate local/cache rendering where possible. Otherwise use stable skeletons/placeholders rather than large layout shifts.

### Empty
Explain why the page is empty and provide the next useful action.

Examples:

- “No venue yet — add one or import a list.”
- “No quote received yet — request one or attach a document.”

### Error
Explain impact and recovery. Do not expose raw vendor/database errors to normal users.

### Permission denied
Clearly distinguish authorization failure from missing data.

### Offline
Explain what remains available and which actions will be queued.

### Partial/degraded
Examples: map unavailable while venue list remains usable; external image unavailable while venue facts remain intact.

## Form behavior

### Autosave
Long forms should autosave safely after validated edits. The UI shows whether changes are saved locally and synchronized.

### Drafts
Incomplete creation flows can remain drafts. Records should not require dozens of fields to be created.

### Validation
Validation is specific and close to the offending field. Invalid monetary/date/percentage data is never silently coerced into a different meaning without preview/confirmation.

### Closing while editing
Where an edit is not yet durably stored locally, navigation should warn or persist the draft before leaving.

## Destructive actions

### Reversible
Use immediate action plus a visible Undo affordance where practical.

Examples:

- move venue to rejected;
- archive a task;
- remove a tag.

### High-impact irreversible
Require strong confirmation, potentially recent authentication/MFA.

Examples:

- permanently delete project;
- permanently purge files;
- change/remove the last owner;
- destructive restore/replace operation.

## Button behavior

Async action buttons must prevent accidental duplicate submission, show progress and leave the user with a clear result.

## Toast policy

Toasts confirm short reversible actions or background completion. They must not be the only place where a critical error or unresolved conflict is shown.

## Conflict state

Conflicts use an explicit review UI that shows both values and enough provenance to resolve safely.

## External links

External venue/source/maps links open safely without destroying unsaved local state. Allowed protocols are validated.

## Mobile forms

Avoid dense multi-column forms. Input types should trigger appropriate mobile keyboards. The virtual keyboard must not cover critical save/navigation controls.

## Accessibility

Focus moves intentionally after modal/dialog actions. Dialogs are keyboard dismissible where safe. Validation is announced accessibly. Status is expressed with text/icon semantics, not only color.
