create schema if not exists engineering;

revoke all on schema engineering from public;
grant usage on schema engineering to authenticated;

create table engineering.rls_probe (
  id uuid primary key,
  tenant_id uuid not null,
  label text not null
);

alter table engineering.rls_probe enable row level security;
alter table engineering.rls_probe force row level security;

grant select, insert, update, delete on engineering.rls_probe to authenticated;

create policy rls_probe_tenant_select
on engineering.rls_probe
for select
to authenticated
using (
  tenant_id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid
);

create policy rls_probe_tenant_insert
on engineering.rls_probe
for insert
to authenticated
with check (
  tenant_id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid
);

create policy rls_probe_tenant_update
on engineering.rls_probe
for update
to authenticated
using (
  tenant_id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid
)
with check (
  tenant_id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid
);

create policy rls_probe_tenant_delete
on engineering.rls_probe
for delete
to authenticated
using (
  tenant_id = nullif(auth.jwt() ->> 'tenant_id', '')::uuid
);
