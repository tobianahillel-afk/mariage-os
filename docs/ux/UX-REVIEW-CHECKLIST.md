# Mariage OS — UX Review Checklist

Status: **Normative feature/checkpoint UX review procedure**

This checklist is used during feature acceptance, lot acceptance and cross-lot checkpoints. A technically correct feature can fail this review.

Review on at least:
- desktop viewport;
- narrow mobile viewport;
- touch interaction where relevant;
- populated state;
- empty state;
- offline/degraded state where applicable.

---

## 1. User job

- [ ] Can the reviewer state the screen's primary user job in one sentence?
- [ ] Does the screen visibly support that job before secondary detail?
- [ ] Is there at most one dominant primary action at a time, unless the correct design intentionally offers a balanced choice?
- [ ] Does completing the action lead to an understandable next state/next step?
- [ ] Is the feature solving a wedding-planning problem rather than exposing the database structure?

Failure examples:
- 8 equally prominent buttons;
- raw fields first, decision summary later;
- “edit everything” as the only workflow.

---

## 2. Information hierarchy

- [ ] The most important status/decision information is visible in the first viewport where practical.
- [ ] Level-1 summary, Level-2 working detail and Level-3 evidence/history are visually distinct.
- [ ] Optional/rare information does not dominate the screen.
- [ ] Warnings are proportional to importance.
- [ ] Empty space/typography/grouping create hierarchy instead of excessive boxes/borders.
- [ ] The user can scan the page in a few seconds and identify what matters.

---

## 3. Navigation / context

- [ ] Entry points from expected parent/workflow are obvious.
- [ ] Browser Back returns to a useful prior context.
- [ ] List filters/sort/compare selection are preserved when reasonable after detail navigation.
- [ ] Deep-link refresh restores the logical entity/workflow after auth.
- [ ] Breadcrumb/back label is clear where hierarchy is not obvious.
- [ ] User is not forced through Settings for ordinary wedding work.
- [ ] No important workflow dead-ends after success/error.
- [ ] Global Search/Inbox link to the canonical domain page rather than creating a parallel view of truth.

---

## 4. Page-pattern correctness

- [ ] Screen type matches `UX-ARCHITECTURE.md`.
- [ ] High-risk/multi-step work is a focused workflow, not an oversized modal.
- [ ] Short contextual edit uses inline/drawer/dialog appropriately.
- [ ] Entity detail keeps one entity context.
- [ ] Comparison is separated from ordinary collection table.
- [ ] Operational workspaces such as Seating/Timeline have purpose-built layout.

---

## 5. Tables / density

When a table exists:

- [ ] A table is actually useful for scanning/sorting/bulk work.
- [ ] Default columns are limited to decision-relevant data.
- [ ] Secondary fields are hidden/configurable/detail-only.
- [ ] Table row has clear primary click/action.
- [ ] Bulk actions appear only after selection.
- [ ] The domain still has a summary/detail experience outside the table where appropriate.
- [ ] Mobile does not depend on horizontal scrolling for the primary workflow.

Automatic UX failure:
- table chosen only because implementation is easy;
- every database field becomes a column;
- user must memorize horizontal column positions on phone.

---

## 6. Forms

- [ ] Creation asks only for minimal required information.
- [ ] Long forms are divided into meaningful sections.
- [ ] Validation appears near the field and explains correction.
- [ ] Autosave/local pending/cloud synced state is understandable.
- [ ] Navigating away cannot silently lose non-durable work.
- [ ] Advanced/rare fields are progressively disclosed.
- [ ] Mobile keyboard/input types fit the field.
- [ ] A form is not being used where a simpler direct manipulation would be better.

---

## 7. Mobile / touch

- [ ] One-column hierarchy works without desktop assumptions.
- [ ] No hover-only essential action.
- [ ] Touch targets are appropriately sized/spaced.
- [ ] Primary action is reachable but does not cover content.
- [ ] Filters/editors use bottom sheet/drill-down when beneficial.
- [ ] Virtual keyboard does not hide required controls.
- [ ] Long tables have a mobile-specific list/detail alternative.
- [ ] Venue visit mode removes unnecessary navigation/distraction.

---

## 8. Desktop / large screen

- [ ] Width is used intentionally; narrative detail does not stretch into unreadable lines.
- [ ] Full width is reserved for compare/table/seating-type tasks that benefit from it.
- [ ] Sidebars provide useful context rather than permanent clutter.
- [ ] Sticky UI is limited and does not consume excessive viewport.
- [ ] Keyboard navigation accelerates analytical work.

---

## 9. Visual consistency / beauty

Exact palette may evolve, but:

- [ ] Design tokens/components are reused.
- [ ] Spacing/typography/radius/status language are consistent.
- [ ] The screen feels calm/elegant rather than enterprise-dashboard noisy.
- [ ] Imagery is used where emotionally useful (venues/inspiration), not mechanically everywhere.
- [ ] Status colors are semantic and paired with text/icon.
- [ ] No unnecessary gradients/shadows/borders compete with data.
- [ ] Numeric/money information aligns/readably compares.
- [ ] Empty state is intentional rather than blank table chrome.

Reviewer should explicitly answer:
> Would a couple enjoy using this screen, or does it look like an internal admin console?

If the answer is “admin console”, the feature does not pass UX acceptance.

---

## 10. State completeness

For each applicable state verify visual/interaction design:

- [ ] loading;
- [ ] cached + refreshing;
- [ ] empty;
- [ ] partial/incomplete;
- [ ] offline;
- [ ] pending synchronization;
- [ ] conflict;
- [ ] retryable error;
- [ ] validation error;
- [ ] permission/not found without leak;
- [ ] unsupported capability fallback;
- [ ] success/complete;
- [ ] destructive confirmation/undo where applicable.

A wireframe only for the ideal populated state is insufficient.

---

## 11. Accessibility

- [ ] semantic headings/landmarks;
- [ ] keyboard reachability/order;
- [ ] visible focus;
- [ ] dialog focus containment/return;
- [ ] labels/errors announced appropriately;
- [ ] color not sole meaning;
- [ ] contrast passes requirements;
- [ ] reduced-motion behavior where relevant;
- [ ] touch and zoom are not disabled.

---

## 12. Collaboration / personal-vs-shared UX

- [ ] Personal rating/favorite is visually distinct from shared fact.
- [ ] Partner identity is clear when showing approvals/ratings/activity.
- [ ] User cannot mistake a pending local personal action for partner-confirmed state.
- [ ] Joint decision requirement is obvious.
- [ ] Conflict resolution explains both sides in human language.

---

## 13. Data confidence / evidence UX

Where factual certainty matters:

- [ ] Unknown is not displayed as No/0/blank.
- [ ] Conflict/stale/unverified is visible without overwhelming ordinary use.
- [ ] Source/evidence is reachable from the fact.
- [ ] Strong contractual truth is visually distinguishable where useful.
- [ ] Technical confidence metadata does not dominate simple decision summary.

---

## 14. Performance perception

- [ ] Cached content displays quickly when available.
- [ ] Long lists do not freeze interaction at reference dataset size.
- [ ] Images do not cause major layout shift.
- [ ] Background sync does not lock unrelated work.
- [ ] User receives immediate feedback for accepted local action.

---

## 15. Final reviewer decision

Record:

```text
Feature/route:
Desktop reviewed:
Mobile reviewed:
Primary job:
Result: PASS / PASS_WITH_MINOR / FAIL

UX findings:
UX-001 | MAJOR | ...
UX-002 | MINOR | ...

Evidence:
- screenshots/synthetic recording
- E2E/accessibility report
- linked feature/PR
```

`BLOCKING` or `MAJOR` UX findings prevent Feature `ACCEPTED` and checkpoint PASS.
