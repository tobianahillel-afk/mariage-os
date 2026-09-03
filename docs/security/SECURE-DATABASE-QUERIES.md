# Secure Database Querying and SQL Injection Prevention

Status: **Normative V1 database-security contract**

## Objective

User-controlled data must never be able to alter the structure or intent of SQL executed by Mariage OS.

The primary defense is **parameterization/static SQL plus allowlisted identifiers**, not escaping attack strings.

## 1. Ordinary application queries

For browser/application runtime operations:

- use `supabase-js`/PostgREST query APIs or reviewed RPCs;
- pass user values as values through the query API;
- never build REST/RPC/SQL text by concatenating an input value;
- sort/filter/search UI keys map to stable predefined query columns/operations rather than arbitrary user-provided SQL fragments;
- client never sends raw table names, SQL WHERE clauses, ORDER BY clauses or executable expressions to a generic endpoint.

## 2. PostgreSQL migrations/functions

Prefer static SQL.

If PL/pgSQL dynamic SQL is genuinely required:

- bind **data values** via parameter mechanisms such as `EXECUTE ... USING`;
- choose dynamic identifiers only from a strict application allowlist;
- quote identifiers with PostgreSQL identifier-safe functions where needed;
- never treat string escaping as equivalent to parameterization;
- document why dynamic SQL is required and add injection tests.

Example principle:

```sql
-- Good shape for data values
EXECUTE 'select ... where id = $1' USING requested_id;
```

Do not do:

```sql
EXECUTE 'select ... where id = ''' || requested_id || '''';
```

## 3. Dynamic sort/filter

Public/user filters are mapped:

```text
"price"     -> predefined `price_minor`
"name"      -> predefined `name`
"updated"   -> predefined `updated_at`
```

Unknown sort/filter keys are rejected. They are never inserted into SQL verbatim.

Complex user filter builders, if introduced, compile from a typed AST/allowlisted operators to reviewed query primitives. They never accept raw SQL.

## 4. Search

Search input is data.

- use safe provider-supported text/search/filter APIs;
- wildcard/metacharacter semantics are explicitly escaped or intentionally supported according to the chosen search operator;
- do not create a generic `search(sql text)` RPC;
- search respects project permissions/RLS and result-size bounds.

## 5. RPC/functions

Every browser-callable RPC:

- has a narrow typed purpose;
- validates inputs;
- validates current membership/permission;
- cannot accept executable SQL fragments;
- has direct authorization/injection tests;
- returns only the minimum data needed.

`SECURITY DEFINER` functions additionally:

- set a safe/fixed `search_path`;
- schema-qualify sensitive objects where appropriate;
- do not inherit user-controllable object resolution;
- perform explicit authorization before privileged writes;
- grant EXECUTE only to the intended DB roles.

## 6. Database roles/GRANT

RLS is not the only database access control.

- revoke unnecessary table/function/schema privileges;
- grant only required operations to browser-facing roles;
- high-privilege helper functions are not accidentally executable by `anon`/`authenticated` unless explicitly designed and self-authorizing;
- service-role/database-owner credentials never appear in browser code.

## 7. Migrations and admin scripts

Developer-controlled migration text can contain SQL, but data imported into migrations/admin utilities remains untrusted.

- never interpolate production/user values into migration shell commands without safe parameter/file boundaries;
- backup/import scripts do not `eval` SQL extracted from user files;
- generated SQL artifacts are reviewed before execution if generation is ever introduced.

## 8. Escaping

Output/input escaping may still be needed for context-specific syntax, but:

> escaping is not accepted as the primary SQL injection defense.

Prepared/parameterized queries or safe static stored procedures are required wherever untrusted data enters database queries.

## 9. Test corpus

Direct tests include values containing:

- `'` and `"`;
- semicolons;
- SQL comments;
- boolean/inference payload patterns;
- UNION-like strings;
- Unicode quote/confusable characters;
- wildcard characters used by LIKE/search operators;
- malicious sort/filter column names;
- schema/table/function-looking strings;
- oversized search expressions.

Passing criteria:

- payload is treated as data or rejected;
- no query structure changes;
- no unexpected rows cross project/security boundaries;
- errors do not reveal useful SQL/schema internals.

## 10. Code-review invariant

Any occurrence of dynamic query construction or raw SQL in application/provider code is security-review material.

A new generic raw-query helper is prohibited by default and requires an explicit ADR/security review if ever proposed.