# Mariage OS — Invariants Addendum: Guest Invitations & Communications

Status: **NORMATIVE V1 INVARIANT ADDENDUM**

These invariants are release-binding and must have tests at the appropriate layer.

## Capability / RSVP invariants

1. One raw invitation token is never stored in project/database/log/export data.
2. One invitation link scopes exactly one project + household invitation context.
3. A link cannot authorize any project-member operation.
4. Expired/revoked link cannot mutate RSVP.
5. Rotated old link cannot become active again.
6. Guest submission cannot mutate a guest outside resolved household scope.
7. Guest-created +1/child count cannot exceed explicit remaining allowance.
8. Same idempotency key cannot create duplicate RSVP effects.
9. Existing invitee identity is preserved when guest answers; response does not create duplicate canonical person.
10. Internal priority/probability/private notes are absent from guest-safe DTOs unless a separate explicit guest-visible field exists.
11. RSVP history is retained when current response changes.
12. Guest confirmation-message failure cannot roll back an already committed RSVP.

## Contact invariants

13. Contact points are project-scoped.
14. Contact point ownership relation must reference same project.
15. Possession of contact value does not prove consent/eligibility for every channel.
16. Shared/duplicate destination does not automatically merge households.
17. Invalid/suppressed destination is not silently sent to.

## Campaign invariants

18. Campaign send requires a valid frozen audience snapshot.
19. Campaign send requires a valid template/channel preview revision.
20. Audience cannot expand between preview and send without re-preview.
21. One logical communication recipient has one stable idempotency identity per campaign/send intent.
22. Retry cannot intentionally resend a successful logical recipient unless user explicitly creates a new communication intent.
23. Selective retry cannot target already-successful recipients by default.
24. Provider-specific state cannot become canonical truth without normalization.
25. Delivery/read status cannot change RSVP status.
26. Campaign/recipient/provider references cannot cross projects.
27. Scheduled dispatch rechecks current authorization/provider readiness/caps.
28. Browser timer is never authoritative scheduler.
29. Restoring backup cannot automatically dispatch historical/scheduled campaigns.
30. Importing contacts cannot automatically create/send campaigns.

## Webhook invariants

31. Unverified webhook cannot mutate trusted communication state.
32. Duplicate provider event cannot create duplicate normalized event/effect.
33. Project scope derives from stored provider-message mapping, not untrusted webhook project-like fields.
34. Late/out-of-order webhook cannot blindly regress a terminal/higher-order state.
35. Provider message ID is never an authorization credential.

## Secret/cost invariants

36. Provider secret never appears in browser bundle/public Git/project export/ordinary backup.
37. Automatic provider is disabled until explicit environment configuration/readiness.
38. Mariage OS never automatically upgrades/purchases provider plan.
39. Configured send/cost cap cannot be bypassed by client-side payload tampering.
40. Manual secure link/QR RSVP remains possible without automatic provider configuration.

## QIF invariants

41. No bulk send action occurs from a guest table row without dedicated preview/preflight.
42. Primary couple flow does not require provider API jargon.
43. Guest standard RSVP does not require Mariage OS account creation.
44. Blocked primary flow exposes a recovery/next action.
45. Mobile guest RSVP retains entered data after validation error.

## Migration/version invariants

46. V1→later-version migration preserves guest response history and non-secret communication history.
47. Provider migration does not rewrite historical provider identity/events.
48. App update cannot turn a draft/scheduled campaign into an unintended duplicate dispatch.
49. Backup format never depends on live provider credentials to remain readable.
50. Old client incompatible with new communication schema/protocol is blocked safely rather than sending with unknown semantics.