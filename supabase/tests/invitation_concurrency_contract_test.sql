begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

select ok(
  position(
    'for update' in lower(
      pg_get_functiondef('public.create_project_invitation(uuid,text,text)'::regprocedure)
    )
  ) < position(
    'has_project_permission' in lower(
      pg_get_functiondef('public.create_project_invitation(uuid,text,text)'::regprocedure)
    )
  ),
  'invitation creation locks project before live permission evaluation'
);

select ok(
  position(
    'for update' in lower(
      pg_get_functiondef('public.revoke_project_invitation(uuid)'::regprocedure)
    )
  ) < position(
    'has_project_permission' in lower(
      pg_get_functiondef('public.revoke_project_invitation(uuid)'::regprocedure)
    )
  ),
  'invitation revocation locks project before live permission evaluation'
);

select ok(
  position(
    'for update' in lower(
      pg_get_functiondef('public.change_project_member_role(uuid,uuid,text)'::regprocedure)
    )
  ) < position(
    'has_project_permission' in lower(
      pg_get_functiondef('public.change_project_member_role(uuid,uuid,text)'::regprocedure)
    )
  ),
  'role mutation locks project before live permission evaluation'
);

select ok(
  position(
    'for update' in lower(
      pg_get_functiondef('public.revoke_project_member(uuid,uuid)'::regprocedure)
    )
  ) < position(
    'has_project_permission' in lower(
      pg_get_functiondef('public.revoke_project_member(uuid,uuid)'::regprocedure)
    )
  ),
  'member revocation locks project before live permission evaluation'
);

select * from finish();
rollback;
