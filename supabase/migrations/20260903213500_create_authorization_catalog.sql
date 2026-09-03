create table public.app_permissions (
  permission_key text primary key,
  description text not null check (char_length(description) between 1 and 240),
  sensitivity text not null check (
    sensitivity in (
      'ordinary',
      'personal',
      'financial',
      'sensitive_document',
      'security_admin'
    )
  ),
  created_at timestamptz not null default now(),
  constraint app_permissions_key_format check (
    permission_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  )
);

create table public.app_roles (
  role_key text primary key,
  display_name text not null check (char_length(display_name) between 1 and 80),
  is_assignable boolean not null default true,
  created_at timestamptz not null default now(),
  constraint app_roles_key_format check (role_key ~ '^[a-z][a-z0-9_]*$')
);

create table public.app_role_permissions (
  role_key text not null references public.app_roles(role_key) on update restrict on delete restrict,
  permission_key text not null references public.app_permissions(permission_key) on update restrict on delete restrict,
  primary key (role_key, permission_key)
);

revoke all on table public.app_permissions from anon, authenticated;
revoke all on table public.app_roles from anon, authenticated;
revoke all on table public.app_role_permissions from anon, authenticated;

insert into public.app_roles (role_key, display_name, is_assignable)
values
  ('owner', 'Owner', true),
  ('editor', 'Editor', true),
  ('viewer', 'Viewer', true);

insert into public.app_permissions (permission_key, description, sensitivity)
values
  ('project.read', 'Read project identity and ordinary project settings.', 'ordinary'),
  ('project.settings.update', 'Update shared project settings.', 'security_admin'),
  ('project.archive', 'Archive the project through a protected command.', 'security_admin'),
  ('project.delete', 'Delete the project through a protected command.', 'security_admin'),
  ('members.read', 'Read project membership information.', 'personal'),
  ('members.invite', 'Invite a project member through a protected command.', 'security_admin'),
  ('members.manage_roles', 'Change or revoke memberships through a protected command.', 'security_admin'),
  ('security.manage', 'Manage project security settings.', 'security_admin'),
  ('audit.read', 'Read project audit history.', 'personal'),
  ('venues.read', 'Read venue planning data.', 'ordinary'),
  ('venues.write', 'Create and update venue planning data.', 'ordinary'),
  ('vendors.read', 'Read vendor planning data.', 'ordinary'),
  ('vendors.write', 'Create and update vendor planning data.', 'ordinary'),
  ('access.read', 'Read travel and access planning data.', 'ordinary'),
  ('access.write', 'Create and update travel and access planning data.', 'ordinary'),
  ('guests.read', 'Read guest planning data.', 'personal'),
  ('guests.write', 'Create and update guest planning data.', 'personal'),
  ('guest_sensitive.read', 'Read sensitive guest details.', 'personal'),
  ('guest_sensitive.write', 'Create and update sensitive guest details.', 'personal'),
  ('seating.read', 'Read seating data.', 'personal'),
  ('seating.write', 'Create and update seating data.', 'personal'),
  ('tasks.read', 'Read project tasks.', 'ordinary'),
  ('tasks.write', 'Create and update project tasks.', 'ordinary'),
  ('decisions.read', 'Read project decisions.', 'ordinary'),
  ('decisions.write', 'Create and update project decisions.', 'ordinary'),
  ('decisions.finalize', 'Finalize protected joint decisions.', 'ordinary'),
  ('planning.read', 'Read planning milestones and phases.', 'ordinary'),
  ('planning.write', 'Create and update planning milestones and phases.', 'ordinary'),
  ('timeline.read', 'Read wedding timeline data.', 'ordinary'),
  ('timeline.write', 'Create and update wedding timeline data.', 'ordinary'),
  ('inbox.read', 'Read project Inbox captures.', 'ordinary'),
  ('inbox.write', 'Create and update project Inbox captures.', 'ordinary'),
  ('search.use', 'Search data already authorized for the current member.', 'ordinary'),
  ('finance.read', 'Read financial planning data.', 'financial'),
  ('finance.write', 'Create and update financial planning data.', 'financial'),
  ('payments.record', 'Record project payment events.', 'financial'),
  ('payments.refund', 'Record refunds and credits.', 'financial'),
  ('documents.read', 'Read ordinary project documents.', 'ordinary'),
  ('documents.write', 'Create and update project documents.', 'ordinary'),
  ('sensitive_documents.read', 'Read sensitive project documents.', 'sensitive_document'),
  ('contract_review.read', 'Read contract-readiness data.', 'sensitive_document'),
  ('contract_review.write', 'Create and update contract-readiness data.', 'sensitive_document'),
  ('media.read', 'Read project media.', 'ordinary'),
  ('media.write', 'Create and update project media.', 'ordinary'),
  ('imports.preview', 'Preview imports without mutating project data.', 'ordinary'),
  ('imports.apply', 'Apply reviewed imports.', 'ordinary'),
  ('imports.rollback', 'Rollback eligible imported changes.', 'ordinary'),
  ('exports.standard', 'Export data the current member is authorized to read.', 'ordinary'),
  ('exports.sensitive', 'Export sensitive project data.', 'security_admin'),
  ('backup.full_export', 'Create a complete protected backup export.', 'security_admin'),
  ('backup.restore', 'Restore a protected backup.', 'security_admin');

insert into public.app_role_permissions (role_key, permission_key)
select 'owner', permission_key
from public.app_permissions;

insert into public.app_role_permissions (role_key, permission_key)
values
  ('editor', 'project.read'),
  ('editor', 'members.read'),
  ('editor', 'venues.read'),
  ('editor', 'venues.write'),
  ('editor', 'vendors.read'),
  ('editor', 'vendors.write'),
  ('editor', 'access.read'),
  ('editor', 'access.write'),
  ('editor', 'guests.read'),
  ('editor', 'guests.write'),
  ('editor', 'guest_sensitive.read'),
  ('editor', 'guest_sensitive.write'),
  ('editor', 'seating.read'),
  ('editor', 'seating.write'),
  ('editor', 'tasks.read'),
  ('editor', 'tasks.write'),
  ('editor', 'decisions.read'),
  ('editor', 'decisions.write'),
  ('editor', 'planning.read'),
  ('editor', 'planning.write'),
  ('editor', 'timeline.read'),
  ('editor', 'timeline.write'),
  ('editor', 'inbox.read'),
  ('editor', 'inbox.write'),
  ('editor', 'search.use'),
  ('editor', 'finance.read'),
  ('editor', 'finance.write'),
  ('editor', 'payments.record'),
  ('editor', 'payments.refund'),
  ('editor', 'documents.read'),
  ('editor', 'documents.write'),
  ('editor', 'sensitive_documents.read'),
  ('editor', 'contract_review.read'),
  ('editor', 'contract_review.write'),
  ('editor', 'media.read'),
  ('editor', 'media.write'),
  ('editor', 'imports.preview'),
  ('editor', 'imports.apply'),
  ('editor', 'imports.rollback'),
  ('editor', 'exports.standard');

insert into public.app_role_permissions (role_key, permission_key)
values
  ('viewer', 'project.read'),
  ('viewer', 'venues.read'),
  ('viewer', 'vendors.read'),
  ('viewer', 'access.read'),
  ('viewer', 'tasks.read'),
  ('viewer', 'decisions.read'),
  ('viewer', 'planning.read'),
  ('viewer', 'timeline.read'),
  ('viewer', 'search.use'),
  ('viewer', 'documents.read'),
  ('viewer', 'media.read'),
  ('viewer', 'exports.standard');

create or replace function public.role_has_permission(
  requested_role text,
  requested_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.app_role_permissions arp
    join public.app_roles ar on ar.role_key = arp.role_key
    join public.app_permissions ap on ap.permission_key = arp.permission_key
    where ar.role_key = requested_role
      and ar.is_assignable
      and ap.permission_key = requested_permission
  );
$$;

revoke all on function public.role_has_permission(text, text) from public;
revoke all on function public.role_has_permission(text, text) from anon, authenticated;

comment on function public.role_has_permission(text, text) is
  'Internal migration-controlled role/permission lookup. Client code must not supply a role to authorize itself; WP-1.2 composes this with auth.uid() and active project membership.';
