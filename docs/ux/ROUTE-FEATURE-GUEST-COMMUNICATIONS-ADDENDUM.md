# Mariage OS — Route/Feature Addendum: Invitations & RSVP

Status: **NORMATIVE V1 ROUTE ADDENDUM**

Private authenticated routes remain project-scoped under `/app/p/:projectId/**`.

## Private routes

| Route | Primary user job | Feature IDs | UX contract |
|---|---|---|---|
| `/app/p/:projectId/guests/invitations` | See invitation/RSVP state and next actions | FTR-105..120 | `GUEST-COMMUNICATIONS-BLUEPRINTS.md` |
| `/app/p/:projectId/guests/invitations/new` | Prepare a send campaign safely | FTR-112..118 | campaign QIF wizard |
| `/app/p/:projectId/guests/invitations/:campaignId` | Track one campaign and retry failures | FTR-112..117 | campaign result/detail |
| `/app/p/:projectId/guests/households/:householdId` | Manage household, contacts, RSVP and communications | FTR-054..059 + FTR-105..111 | household detail integration |
| `/app/p/:projectId/guests/rsvp-settings` | Configure RSVP form/deadline/link policy | FTR-108..109 + FTR-119 | Settings/Guests subroute |
| `/app/p/:projectId/settings/communications` | Configure channels/providers/caps | FTR-113..120 | advanced settings |
| `/app/p/:projectId/settings/communications/diagnostics` | Inspect provider/webhook health | FTR-116 + FTR-120 | diagnostics |

The app may expose `Invitations & RSVP` as Guests subnavigation rather than a new global sidebar item.

## Guest capability route

`/rsvp/:token`

Purpose: secure, no-account invited-household response.

Properties:
- not nested under `/app`;
- no private sidebar/project navigation;
- no project-member session required;
- token resolves server-side to one invitation scope;
- restrictive metadata/referrer behavior;
- guest-safe public wedding identity only;
- response/confirmation/edit states defined by `GUEST-RSVP-PORTAL.md`.

## Optional public confirmation route/state

Implementation may keep confirmation within `/rsvp/:token` state rather than a second URL to avoid leaking identifiers. If a separate route is used, it must carry no raw household/project identifiers and follow the same capability authorization.

## Navigation rules

From `Guests`:
- primary tab/entry to `Invitations & RSVP`;
- household rows/detail can deep-link to communication/RSVP section;
- RSVP statistics link back to filtered households.

From campaign result:
- failed recipient → household detail;
- awaiting response → filtered Invitations & RSVP list;
- delivered state does not imply RSVP state.

From Dashboard:
- RSVP action card → filtered invitations workspace, not provider diagnostics.

## Mobile

Campaign creation uses one step per screen/panel. Campaign status list becomes grouped cards/rows. Guest RSVP is independently mobile-first.

## Back/refresh/deep-link rules

- private routes preserve project context;
- reloading campaign detail re-authorizes membership/permissions;
- guest token reload remains valid only while token active;
- expired/revoked guest link shows recoverable contact-the-couple style message, not a private-app login redirect.