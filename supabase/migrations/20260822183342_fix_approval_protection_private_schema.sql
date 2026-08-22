-- Corrige o trigger de proteção das respostas de aprovação.
-- As funções auxiliares de segurança foram movidas do schema
-- public para o schema private.

create or replace function public.protect_client_approval_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'service_role'
    or private.is_organization_member(old.organization_id)
  then
    return new;
  end if;

  if not private.has_client_access_role(
    old.organization_id,
    old.client_id,
    array['approver']::public.client_access_role[]
  ) then
    raise exception 'Only an authorized client approver may respond.';
  end if;

  if old.status <> 'pending'::public.approval_status
    or new.status not in (
      'approved'::public.approval_status,
      'changes_requested'::public.approval_status
    )
  then
    raise exception 'This approval cannot be answered.';
  end if;

  if new.organization_id is distinct from old.organization_id
    or new.request_id is distinct from old.request_id
    or new.client_id is distinct from old.client_id
    or new.message is distinct from old.message
    or new.requested_by is distinct from old.requested_by
    or new.requested_at is distinct from old.requested_at
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Protected approval fields cannot be changed.';
  end if;

  return new;
end;
$$;

revoke all
on function public.protect_client_approval_response()
from public, anon, authenticated;