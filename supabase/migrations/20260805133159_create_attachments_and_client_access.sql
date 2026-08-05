-- =========================================================
-- ALINORA — CLIENT ACCESS AND ATTACHMENTS
-- =========================================================

create type public.client_access_role as enum (
  'viewer',
  'approver'
);

create type public.client_access_status as enum (
  'invited',
  'active',
  'revoked'
);

-- =========================================================
-- CLIENT ACCESS
-- =========================================================

create table public.client_access (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid not null,

  user_id uuid
    references auth.users(id) on delete set null,

  email text not null,

  role public.client_access_role not null default 'viewer',
  status public.client_access_status not null default 'invited',

  invited_by uuid not null
    references auth.users(id),

  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint client_access_client_same_organization
    foreign key (client_id, organization_id)
    references public.clients(id, organization_id)
    on delete cascade,

  constraint client_access_email_length
    check (char_length(btrim(email)) between 3 and 320),

  constraint client_access_status_dates
    check (
      (
        status = 'invited'
        and accepted_at is null
        and revoked_at is null
      )
      or (
        status = 'active'
        and user_id is not null
        and accepted_at is not null
        and revoked_at is null
      )
      or (
        status = 'revoked'
        and revoked_at is not null
      )
    )
);

create unique index client_access_active_email_unique
  on public.client_access (
    organization_id,
    client_id,
    lower(email)
  )
  where status in (
    'invited'::public.client_access_status,
    'active'::public.client_access_status
  );

create unique index client_access_active_user_unique
  on public.client_access (
    organization_id,
    client_id,
    user_id
  )
  where user_id is not null
    and status = 'active'::public.client_access_status;

create index client_access_user_id_idx
  on public.client_access(user_id)
  where user_id is not null;

create index client_access_client_id_idx
  on public.client_access(client_id);

create trigger set_client_access_updated_at
before update on public.client_access
for each row
execute function public.set_updated_at();

-- =========================================================
-- CLIENT ACCESS SECURITY HELPERS
-- =========================================================

create or replace function public.has_client_access(
  target_organization_id uuid,
  target_client_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.client_access access
    where access.organization_id = target_organization_id
      and access.client_id = target_client_id
      and access.user_id = (select auth.uid())
      and access.status = 'active'
  );
$$;

create or replace function public.has_client_access_role(
  target_organization_id uuid,
  target_client_id uuid,
  allowed_roles public.client_access_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.client_access access
    where access.organization_id = target_organization_id
      and access.client_id = target_client_id
      and access.user_id = (select auth.uid())
      and access.status = 'active'
      and access.role = any(allowed_roles)
  );
$$;

create or replace function public.has_organization_client_access(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.client_access access
    where access.organization_id = target_organization_id
      and access.user_id = (select auth.uid())
      and access.status = 'active'
  );
$$;

revoke all on function public.has_client_access(uuid, uuid)
  from public;

revoke all on function public.has_client_access_role(
  uuid,
  uuid,
  public.client_access_role[]
) from public;

revoke all on function public.has_organization_client_access(uuid)
  from public;

grant execute on function public.has_client_access(uuid, uuid)
  to authenticated, service_role;

grant execute on function public.has_client_access_role(
  uuid,
  uuid,
  public.client_access_role[]
) to authenticated, service_role;

grant execute on function public.has_organization_client_access(uuid)
  to authenticated, service_role;

-- =========================================================
-- ACCEPT CLIENT INVITATION
-- =========================================================

create or replace function public.activate_client_access(
  access_id uuid
)
returns public.client_access
language plpgsql
security definer
set search_path = ''
as $$
declare
  activated_access public.client_access;
  authenticated_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required.';
  end if;

  authenticated_email :=
    lower(btrim(coalesce((select auth.jwt() ->> 'email'), '')));

  if authenticated_email = '' then
    raise exception 'The authenticated account has no email.';
  end if;

  update public.client_access as access
  set
    user_id = (select auth.uid()),
    status = 'active',
    accepted_at = now(),
    revoked_at = null
  where access.id = access_id
    and access.status = 'invited'
    and lower(btrim(access.email)) = authenticated_email
    and (
      access.user_id is null
      or access.user_id = (select auth.uid())
    )
  returning access.* into activated_access;

  if activated_access.id is null then
    raise exception 'Invitation is invalid, expired or belongs to another email.';
  end if;

  return activated_access;
end;
$$;

revoke all on function public.activate_client_access(uuid)
  from public;

grant execute on function public.activate_client_access(uuid)
  to authenticated;

-- =========================================================
-- IDENTIFY THE CLIENT CONTACT WHO SENT A MESSAGE
-- =========================================================

alter table public.request_messages
  add column author_client_access_id uuid
    references public.client_access(id) on delete set null;

create index request_messages_author_client_access_idx
  on public.request_messages(author_client_access_id)
  where author_client_access_id is not null;

create or replace function public.validate_client_portal_message()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  access_record public.client_access;
begin
  if new.sender_type = 'client'::public.message_sender_type then
    if new.author_client_access_id is null then
      raise exception 'Client messages require a client access record.';
    end if;

    select access.*
    into access_record
    from public.client_access access
    where access.id = new.author_client_access_id;

    if access_record.id is null
      or access_record.organization_id <> new.organization_id
      or access_record.client_id <> new.author_client_id
      or access_record.status <> 'active'
    then
      raise exception 'Client access does not match this message.';
    end if;

    if (select auth.role()) <> 'service_role'
      and access_record.user_id is distinct from (select auth.uid())
    then
      raise exception 'Client access belongs to another user.';
    end if;
  elsif new.author_client_access_id is not null then
    raise exception 'Only client messages may contain client access.';
  end if;

  return new;
end;
$$;

create trigger validate_client_portal_message
before insert or update on public.request_messages
for each row
execute function public.validate_client_portal_message();

-- =========================================================
-- ATTACHMENTS
-- =========================================================

create table public.attachments (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid not null,
  request_id uuid not null,

  message_id uuid
    references public.request_messages(id) on delete set null,

  uploaded_by uuid not null
    references auth.users(id),

  uploaded_by_client_access_id uuid
    references public.client_access(id) on delete set null,

  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null,

  storage_bucket text not null default 'alinora-attachments',
  storage_path text not null,

  is_internal boolean not null default false,

  created_at timestamptz not null default now(),

  constraint attachments_request_same_client_organization
    foreign key (
      request_id,
      client_id,
      organization_id
    )
    references public.requests(
      id,
      client_id,
      organization_id
    )
    on delete cascade,

  constraint attachments_file_name_length
    check (char_length(btrim(file_name)) between 1 and 255),

  constraint attachments_mime_type_length
    check (char_length(btrim(mime_type)) between 1 and 150),

  constraint attachments_file_size
    check (file_size_bytes between 1 and 20971520),

  constraint attachments_storage_bucket
    check (storage_bucket = 'alinora-attachments'),

  constraint attachments_storage_path_length
    check (char_length(btrim(storage_path)) between 10 and 1000),

  constraint attachments_storage_path_structure
    check (
      storage_path like
        organization_id::text || '/' ||
        client_id::text || '/' ||
        request_id::text || '/%'
    ),

  constraint attachments_storage_object_unique
    unique (storage_bucket, storage_path)
);

create index attachments_request_id_idx
  on public.attachments(request_id);

create index attachments_message_id_idx
  on public.attachments(message_id)
  where message_id is not null;

create index attachments_client_id_idx
  on public.attachments(client_id);

create or replace function public.validate_attachment_relations()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  message_record public.request_messages;
  access_record public.client_access;
begin
  if new.message_id is not null then
    select message.*
    into message_record
    from public.request_messages message
    where message.id = new.message_id;

    if message_record.id is null
      or message_record.organization_id <> new.organization_id
      or message_record.request_id <> new.request_id
    then
      raise exception 'Message does not belong to this request.';
    end if;

    if message_record.is_internal <> new.is_internal then
      raise exception 'Attachment visibility must match message visibility.';
    end if;
  end if;

  if new.uploaded_by_client_access_id is not null then
    select access.*
    into access_record
    from public.client_access access
    where access.id = new.uploaded_by_client_access_id;

    if access_record.id is null
      or access_record.organization_id <> new.organization_id
      or access_record.client_id <> new.client_id
      or access_record.user_id <> new.uploaded_by
      or access_record.status <> 'active'
      or new.is_internal
    then
      raise exception 'Client access cannot upload this attachment.';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_attachment_relations
before insert or update on public.attachments
for each row
execute function public.validate_attachment_relations();

-- =========================================================
-- PRIVATE STORAGE BUCKET
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'alinora-attachments',
  'alinora-attachments',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do nothing;

-- =========================================================
-- TABLE PERMISSIONS
-- =========================================================

grant select, insert, update, delete
  on public.client_access
  to authenticated;

grant select, insert, update, delete
  on public.attachments
  to authenticated;

grant select on public.organizations
  to authenticated;

grant select on public.clients
  to authenticated;

grant select on public.projects
  to authenticated;

grant select on public.requests
  to authenticated;

grant select, insert on public.request_messages
  to authenticated;

grant select, update on public.approvals
  to authenticated;

-- =========================================================
-- CLIENT ACCESS RLS
-- =========================================================

alter table public.client_access enable row level security;
alter table public.attachments enable row level security;

create policy "client_access_select_team"
on public.client_access
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "client_access_select_self"
on public.client_access
for select
to authenticated
using (
  user_id = (select auth.uid())
);

create policy "client_access_insert_admins"
on public.client_access
for insert
to authenticated
with check (
  invited_by = (select auth.uid())
  and user_id is null
  and status = 'invited'
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "client_access_update_admins"
on public.client_access
for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "client_access_delete_admins"
on public.client_access
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- =========================================================
-- CLIENT PORTAL READ ACCESS
-- =========================================================

create policy "organizations_select_client_portal"
on public.organizations
for select
to authenticated
using (
  public.has_organization_client_access(id)
);

create policy "clients_select_client_portal"
on public.clients
for select
to authenticated
using (
  public.has_client_access(organization_id, id)
);

create policy "projects_select_client_portal"
on public.projects
for select
to authenticated
using (
  public.has_client_access(organization_id, client_id)
);

create policy "requests_select_client_portal"
on public.requests
for select
to authenticated
using (
  public.has_client_access(organization_id, client_id)
);

create policy "request_messages_select_client_portal"
on public.request_messages
for select
to authenticated
using (
  not is_internal
  and exists (
    select 1
    from public.requests request
    where request.id = request_messages.request_id
      and request.organization_id = request_messages.organization_id
      and public.has_client_access(
        request.organization_id,
        request.client_id
      )
  )
);

create policy "request_messages_insert_client_portal"
on public.request_messages
for insert
to authenticated
with check (
  sender_type = 'client'
  and author_user_id is null
  and author_client_id is not null
  and author_client_access_id is not null
  and not is_internal
  and public.has_client_access(
    organization_id,
    author_client_id
  )
  and exists (
    select 1
    from public.requests request
    where request.id = request_messages.request_id
      and request.organization_id = request_messages.organization_id
      and request.client_id = request_messages.author_client_id
  )
);

create policy "approvals_select_client_portal"
on public.approvals
for select
to authenticated
using (
  public.has_client_access(organization_id, client_id)
);

create policy "approvals_update_client_portal"
on public.approvals
for update
to authenticated
using (
  status = 'pending'
  and public.has_client_access_role(
    organization_id,
    client_id,
    array['approver']::public.client_access_role[]
  )
)
with check (
  status in ('approved', 'changes_requested')
  and public.has_client_access_role(
    organization_id,
    client_id,
    array['approver']::public.client_access_role[]
  )
);

-- =========================================================
-- PROTECT CLIENT APPROVAL RESPONSES
-- =========================================================

create or replace function public.protect_client_approval_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role'
    or public.is_organization_member(old.organization_id)
  then
    return new;
  end if;

  if not public.has_client_access_role(
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

create trigger protect_client_approval_response
before update on public.approvals
for each row
execute function public.protect_client_approval_response();

-- =========================================================
-- ATTACHMENT RLS
-- =========================================================

create policy "attachments_select_team"
on public.attachments
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "attachments_select_client_portal"
on public.attachments
for select
to authenticated
using (
  not is_internal
  and public.has_client_access(organization_id, client_id)
);

create policy "attachments_insert_team"
on public.attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and uploaded_by_client_access_id is null
  and public.is_organization_member(organization_id)
);

create policy "attachments_insert_client_portal"
on public.attachments
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and uploaded_by_client_access_id is not null
  and not is_internal
  and public.has_client_access(organization_id, client_id)
);

create policy "attachments_update_team"
on public.attachments
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

create policy "attachments_delete_team"
on public.attachments
for delete
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- =========================================================
-- STORAGE OBJECT RLS
-- The metadata row must be created before uploading the file.
-- =========================================================

create policy "alinora_attachments_objects_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'alinora-attachments'
  and exists (
    select 1
    from public.attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_path = storage.objects.name
      and (
        public.is_organization_member(attachment.organization_id)
        or (
          not attachment.is_internal
          and public.has_client_access(
            attachment.organization_id,
            attachment.client_id
          )
        )
      )
  )
);

create policy "alinora_attachments_objects_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'alinora-attachments'
  and exists (
    select 1
    from public.attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_path = storage.objects.name
      and attachment.uploaded_by = (select auth.uid())
      and (
        public.is_organization_member(attachment.organization_id)
        or (
          not attachment.is_internal
          and public.has_client_access(
            attachment.organization_id,
            attachment.client_id
          )
        )
      )
  )
);

create policy "alinora_attachments_objects_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'alinora-attachments'
  and exists (
    select 1
    from public.attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_path = storage.objects.name
      and public.is_organization_member(attachment.organization_id)
  )
)
with check (
  bucket_id = 'alinora-attachments'
  and exists (
    select 1
    from public.attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_path = storage.objects.name
      and public.is_organization_member(attachment.organization_id)
  )
);

create policy "alinora_attachments_objects_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'alinora-attachments'
  and exists (
    select 1
    from public.attachments attachment
    where attachment.storage_bucket = storage.objects.bucket_id
      and attachment.storage_path = storage.objects.name
      and public.is_organization_member(attachment.organization_id)
  )
);