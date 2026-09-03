# Mariage OS — Guest Communications & RSVP Acceptance Suite

Status: **NORMATIVE V1 ACCEPTANCE ADDENDUM**

These scenarios extend the global acceptance suite. They must map to FTR-105..120 and RSVP/COM/QIF/COMMOPS requirements.

## Guest link / RSVP

### GC-001 — Valid household link
Given household A has an active invitation link
When the link is opened
Then only guest-safe data for household A is returned.

### GC-002 — Cross-household identifier attack
Given a valid token for household A
When request payload includes guest/household identifiers from B
Then the server rejects them and no B data is disclosed or mutated.

### GC-003 — Invalid token enumeration
Given random invalid tokens
When repeatedly resolved within limits
Then errors remain generic and do not disclose project/household existence.

### GC-004 — Expired token
Given an expired token
When RSVP submit occurs
Then no mutation occurs and guest receives safe expiry guidance.

### GC-005 — Revoked/rotated token
Given link L1 was rotated to L2
When L1 is used
Then it cannot read/write RSVP scope.

### GC-006 — Idempotent duplicate submit
Given one RSVP submission succeeded
When the same idempotency key is replayed
Then no duplicate guest/submission effect occurs.

### GC-007 — Existing persons updated
Given household members already exist
When guest confirms attendance
Then those people are updated rather than re-created.

### GC-008 — Authorized +1
Given allowance +1 = 1
When one +1 is added
Then exactly one canonical guest is created with portal provenance and allowance is respected.

### GC-009 — Unauthorized +1
Given allowance +1 = 0
When payload tries to create +1
Then server rejects it regardless of UI tampering.

### GC-010 — Additional children cap
Given child allowance = 2
When payload tries 3 additions
Then transaction is rejected/validated according to explicit partial-commit policy; no silent third child is created.

### GC-011 — Private fields absent
Given a guest has priority/probability/private notes
When portal DTO is inspected
Then those fields are absent unless explicitly guest-visible by a separate allowlisted field definition.

### GC-012 — Guest validation preservation
Given invalid optional/required guest input
When submit fails validation
Then entered safe values remain visible and errors are field-specific.

### GC-013 — Guest RSVP recalculates stats
Given pending guest becomes confirmed
When submission commits
Then confirmed/expected summaries update according to canonical semantics.

### GC-014 — Seating invalidation
Given guest RSVP change conflicts with current seating readiness
When response commits
Then seating is flagged/recomputed according to dependency contract, not silently left trustworthy.

### GC-015 — Budget dependency
Given active budget scenario depends on guest count
When confirmed/expected guest count changes
Then derived scenario output is recalculated/marked using existing budget dependency rules; historical quote/contract truth is unchanged.

### GC-016 — Confirmation provider failure
Given RSVP DB commit succeeds and optional confirmation-message send fails
Then RSVP remains committed and UI explains response success separately from message-delivery failure.

### GC-017 — Edit before deadline
Given edit policy allows changes
When same link is reopened
Then latest guest-visible response is shown and valid edits append history.

### GC-018 — Edit after locked deadline
Given edit policy blocks changes after deadline
When guest attempts edit
Then no mutation occurs and UI explains contact-couple next step.

### GC-019 — QIF mobile completion
Given a first-time guest on supported mobile viewport
When completing a standard household RSVP
Then no account/provider jargon is required and primary attendance choice is immediately discoverable.

### GC-020 — Accessibility
Given keyboard/screen-reader use
When traversing RSVP
Then labels, focus order, error announcements and controls satisfy accessibility contract.

## Campaign/preflight

### GC-021 — Frozen audience
Given campaign preview selects 80 destinations
When project data changes before send
Then send requires revalidation and cannot silently include newly matching recipients.

### GC-022 — Contact changed after preview
Given destination changes after preview
When send is attempted
Then stale preview is invalidated before dispatch.

### GC-023 — Token rotated after preview
Given campaign contains RSVP link L1 and L1 is rotated
When send is attempted
Then stale personalization blocks/rebuilds rather than sending revoked link.

### GC-024 — Exact send confirmation
Given 86 eligible WhatsApp recipients
When final confirmation is shown
Then primary CTA states channel and exact recipient count.

### GC-025 — Missing contacts
Given some households lack selected-channel contact
When preview runs
Then they appear as excluded/problem recipients with corrective action.

### GC-026 — Duplicate destination
Given two household records share one destination ambiguously
When preview runs
Then duplicate is flagged and not silently sent twice.

### GC-027 — Suppressed destination
Given a destination is actively suppressed
When audience matches it
Then it is excluded unless explicit reviewed unsuppression occurs.

### GC-028 — Cost cap
Given campaign estimated/provider-known cost exceeds configured cap
When send is requested
Then dispatch is blocked pending explicit policy change/authorization.

### GC-029 — No configured provider
Given Email/SMS/WhatsApp provider is unavailable
When user needs invitations
Then manual secure link/QR remains usable and QIF provides setup path.

### GC-030 — Template missing variable
Given required personalization variable is missing
When preview renders
Then send is blocked; internal ID/placeholder is not leaked.

## Sending/idempotency/webhooks

### GC-031 — Provider timeout after success
Given provider accepted a message but client/server acknowledgement times out
When retry logic runs
Then stable idempotency/provider reconciliation prevents duplicate logical send.

### GC-032 — Selective retry
Given 5 of 100 recipients failed and 95 succeeded
When retry failed is chosen
Then only eligible failed recipients are retried.

### GC-033 — Forged webhook
Given invalid provider signature
When callback arrives
Then event is rejected before trusted state mutation.

### GC-034 — Replayed webhook
Given already processed provider event id/signature payload
When replayed
Then state/history is not duplicated.

### GC-035 — Provider event project tampering
Given callback payload includes arbitrary project-like metadata
When processed
Then project scope comes only from stored provider-message mapping.

### GC-036 — Out-of-order callbacks
Given `delivered` arrives before delayed `sent`
When both are processed
Then canonical state machine/history remains valid and does not regress blindly.

### GC-037 — Read status optionality
Given provider does not support read receipt
When message delivered
Then UI does not invent `read`.

### GC-038 — No tracking pixel default
Given email template is rendered with default settings
Then no hidden open-tracking pixel is inserted by Mariage OS.

### GC-039 — Provider credential isolation
Given browser/project export/backup ordinary payload
Then provider secrets are absent.

### GC-040 — Revoked send permission
Given user had send permission at preview but loses it before dispatch
When dispatch occurs
Then server rechecks and denies.

## Email/SMS/WhatsApp channel requirements

### GC-041 — Email sender readiness
Given email channel enabled for production
Then configured sending domain authentication/readiness evidence is present before cutover.

### GC-042 — Email bounce suppression
Given hard-bounce/complaint event according to provider semantics
When processed
Then destination can become suppressed and is not repeatedly retried.

### GC-043 — SMS normalization
Given French/international phone input
When eligible for SMS
Then canonical destination follows validated normalization and invalid numbers are blocked preflight.

### GC-044 — SMS segmentation/cost signal
Given provider exposes segment/cost estimation
When long SMS preview is built
Then relevant user-visible warning/cost signal is shown without fake precision.

### GC-045 — WhatsApp official provider boundary
Given WhatsApp channel implementation
Then no WhatsApp Web/personal-account browser automation exists in runtime architecture.

### GC-046 — WhatsApp template eligibility
Given provider requires approved template for outbound initiation
When template is unavailable/ineligible
Then send is blocked with corrective setup guidance.

## Onboarding/QIF

### GC-047 — Onboarding can defer provider setup
Given couple chooses WhatsApp/SMS/email later
When onboarding continues
Then project creation completes and a setup task/Settings path is available.

### GC-048 — Onboarding manual-link path
Given no providers configured
When couple chooses Mariage OS RSVP links
Then they can later generate/share secure links/QR without provider configuration.

### GC-049 — Discoverability
Given first-time authenticated owner on Guests
When looking to send invitations
Then `Invitations & RSVP` is discoverable without consulting documentation.

### GC-050 — Failure next action
Given campaign has invalid contacts/provider failure
When result screen is shown
Then each actionable failure exposes a clear next step and household navigation.

## Public SaaS readiness

### GC-051 — Cross-project campaign isolation
Given projects A and B
When A member guesses B campaign/recipient ID
Then read/write/send is denied.

### GC-052 — Tenant send cap
Given public-SaaS tenant exceeds configured communication quota
When further send attempted
Then it is blocked without affecting other tenants.

### GC-053 — Guest link no membership
Given valid RSVP token
When private `/app/p/:projectId/**` endpoint is called
Then token grants no project-member access.

### GC-054 — Backup restore no accidental send
Given backup restores communication history
When restore completes
Then no campaign is automatically scheduled/dispatched and provider credentials are not resurrected from project data.

## Cutover/QIF evidence

### GC-055 — Couple campaign usability
A representative owner can create an invitation campaign from Guests, identify audience, preview and understand result without provider/API documentation.

### GC-056 — Guest response usability
A representative invited user can complete RSVP on supported mobile browser without account creation or assistance.

### GC-057 — Real-channel synthetic smoke
Before real guest campaign, each enabled automatic production channel is tested with controlled synthetic/test recipients and callback evidence.

### GC-058 — Manual fallback
If all automatic providers are disabled/unavailable, the couple can still distribute secure RSVP links/QR and collect guest responses.

### GC-059 — Partial outage resilience
Provider outage does not prevent private guest list management or already-known RSVP data access; it only degrades affected communication operations.

### GC-060 — Communication data privacy
Diagnostics/log/export inspections confirm no raw invitation tokens/provider secrets and no unnecessary contact/message payload leakage.