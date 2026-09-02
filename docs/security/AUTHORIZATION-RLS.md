# Authorization and Row Level Security

## Principle

Authentication answers “who are you?” Authorization answers “may you access this project/resource?”

Mariage OS authorization is enforced in PostgreSQL/Storage policies, not merely in client UI.

## Roles

Initial roles:

- `owner` — full project operation, subject to strong-auth requirements for destructive admin actions;
- `editor` — future optional role, ordinary project edits but limited administration;
- `viewer` — future optional read-only role.

V1 is optimized for two owners.

## Membership source

`project_members(project_id, user_id, role, status, ...)` is the canonical membership relation.

## RLS baseline

For every exposed project-scoped table:

- RLS enabled;
- explicit SELECT policy;
- explicit INSERT policy;
- explicit UPDATE policy;
- explicit DELETE policy or deliberate denial;
- WITH CHECK prevents writing rows into unauthorized projects;
- policies are tested with allow and deny cases.

## Core policy concept

An authenticated user may access a row only if they have active membership in that row's project and their role permits the operation.

Do not trust a client-supplied `project_id` simply because the user is authenticated.

## Cross-project integrity

Foreign keys/link tables must not permit joining an entity from project A to an entity from project B.

This may require composite validation, triggers/functions or service-layer checks plus database constraints depending on physical schema.

## Ownership administration

Project-owner changes require explicit role policy. The last owner cannot be removed through ordinary membership mutation.

## Protected columns

Where possible, prevent arbitrary user updates to system-managed/security-sensitive columns such as:

- `project_id`;
- created-by identity;
- audit fields;
- certain revision fields;
- role escalation fields.

## Functions/views

Any database function/view exposed to the client must be reviewed for RLS/security-definer implications. `SECURITY DEFINER` functions require especially careful search path and authorization design.

## Realtime

Realtime authorization must not bypass the same project boundaries. Receiving an event is also data access.

## Tests per table

At minimum:

1. owner A can SELECT own project row;
2. owner A cannot SELECT project B row;
3. anonymous cannot SELECT private row;
4. owner A can INSERT with own project ID if role permits;
5. owner A cannot INSERT with project B ID;
6. owner A can UPDATE permitted own fields;
7. owner A cannot change row into project B;
8. unauthorized role cannot perform forbidden UPDATE/DELETE;
9. removed member loses access;
10. direct REST/API requests fail exactly as UI-hidden actions would.

## Storage

Storage policies are separate but follow the same project-membership principle. Object paths alone are not authorization.

## Verification

RLS tests are mandatory release gates. A UI E2E test is not a replacement for direct policy tests.
