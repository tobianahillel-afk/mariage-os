# Vendors Feature Contract

## Purpose

Centralize supplier discovery, comparison, contact history, quotes, inclusions, reliability assessment and booking progress.

## Views

- vendor list/table;
- cards by vendor type;
- vendor detail;
- compare selected vendors of compatible type;
- waiting/follow-up view integrated with tasks.

## Vendor detail summary

Shows:

- name/type/status;
- primary contact;
- availability for target date when known;
- latest quote/package;
- expected real cost;
- partner ratings;
- critical unknowns;
- last interaction;
- next follow-up/action;
- documents.

## Caterer specialization

Caterer detail surfaces wedding-specific fields including kosher requirements/certification, price per person, staffing, buffet/service style, drinks, cake/dessert, tableware, travel, kitchen requirements and compatibility with venues.

## Quotes

Multiple quote versions remain historical. The latest retained quote does not delete earlier versions.

Comparison must normalize inclusions so a cheap headline price does not hide mandatory extras.

## Contact history

Chronological interactions:

- email;
- phone;
- meeting/tasting;
- quote received;
- follow-up.

An interaction can serve as source evidence for facts.

## Waiting workflow

Quote/contact waiting is represented as external waiting, not an unfinished user task. Follow-up date can surface on dashboard.

## Selection

Rejected alternatives remain archived as fallback until no longer useful.

## Acceptance criteria

- generic model supports caterer plus at least one other vendor type without schema duplication;
- quote revisions preserve history;
- included/extra comparison is visible;
- vendor documents remain private;
- external wait/follow-up integrates with tasks/dashboard;
- selected vendor cannot be silently replaced by import.
