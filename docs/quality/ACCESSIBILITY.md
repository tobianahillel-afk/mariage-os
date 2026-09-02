# Accessibility Requirements

Status: **Normative V1 quality contract**

Mariage OS is primarily for two known users, but accessibility improves reliability, mobile usability and maintainability. V1 must meet the requirements below for core workflows.

## Target

Core interactive experiences should satisfy WCAG 2.2 AA principles where reasonably applicable to the PWA and must have zero known blocking accessibility defects at release.

## Keyboard

Core desktop workflows must be operable without a mouse:

- navigation;
- opening/closing dialogs;
- forms;
- venue list/detail actions;
- tasks/decisions;
- import preview controls;
- conflict resolution;
- tables where interactive.

Focus order follows visual/logical order.

## Focus management

- dialogs trap focus while open;
- closing dialog returns focus to logical trigger;
- route/screen changes place focus predictably;
- validation errors can move/announce focus appropriately;
- hidden elements are not tabbable.

## Semantics

Use native semantic elements first:

- button for actions;
- link for navigation;
- label for inputs;
- table semantics for actual tabular data;
- headings with logical hierarchy.

ARIA supplements semantics; it does not replace correct native HTML unnecessarily.

## Status communication

Never use color alone for:

- kept/rejected;
- success/warning/error;
- sync state;
- conflict;
- missing information;
- payment overdue.

Use icon/text/label plus color.

## Contrast

Text, icons and interactive states meet appropriate AA contrast targets. Disabled states must remain distinguishable.

## Touch targets

Mobile primary interactive controls use comfortable touch targets (target approximately 44 CSS px or larger where layout permits) with enough spacing to avoid accidental destructive actions.

## Motion

Respect `prefers-reduced-motion`. Do not require animation to understand state.

## Forms

- every input has accessible name;
- required/optional state is clear;
- errors identify the field and explain correction;
- placeholder is not the only label;
- date/money units/context are visible;
- boolean `No` is not represented as absence/unchecked ambiguity when `Unknown` also exists.

## Tables and mobile fallback

Wide desktop tables must have an accessible mobile representation rather than forcing unusable horizontal interactions for every workflow. Where horizontal scrolling remains, row/column context stays understandable.

## Images

- decorative images use empty alt semantics;
- venue images have useful captions/alt where meaningful;
- source URLs are not used as alt text;
- missing/broken image does not erase textual venue identity.

## Screen reader/live status

Important asynchronous states such as import completion, sync failure or validation summary should be announced through appropriate live-region/status patterns without excessive repeated noise.

## Testing

Automated accessibility checks run on major routes/states.

Manual checks include:

- keyboard-only core flow;
- focus in dialogs/drawers;
- mobile touch usage;
- zoom/text enlargement smoke test;
- screen-reader smoke test for authentication, venue detail, task completion and import preview before V1 cutover.

A blocking accessibility regression in a core V1 flow blocks release until fixed or explicitly documented with accepted remediation plan.
