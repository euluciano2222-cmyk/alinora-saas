-- =========================================================
-- ALINORA
-- Mensagens, aprovações e revisões da IA
-- =========================================================

create type public.message_sender_type as enum (
  'team',
  'client',
  'system'
);

create type public.ai_review_status as enum (
  'pending',
  'approved',
  'edited',
  'rejected'
);

create type public.approval_status as enum (
  'pending',
  'approved',
  'changes_requested',
  'cancelled'
);

-- Permite validar solicitação, cliente e organização juntos.
alter table public.requests
add constraint requests_id_client_organization_unique
unique (id, client_id, organization_id);

-- =========================================================
-- MENSAGENS
-- =========================================================

create table public.request_messages (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  request_id uuid not null,

  sender_type public.message_sender_type not null,

  author_user_id uuid
    references auth.users(id) on delete set null,

  author_client_id uuid,

  body text not null,
  is_internal boolean not null default false,

  created_at timestamptz not null default now(),

  constraint request_messages_body_length
    check (char_length(btrim(body)) between 1 and 30000),

  constraint request_messages_request_same_organization
    foreign key (request_id, organization_id)
    references public.requests(id, organization_id)
    on delete cascade,

  constraint request_messages_client_matches_request
    foreign key (
      request_id,
      author_client_id,
      organization_id
    )
    references public.requests(
      id,
      client_id,
      organization_id
    )
    on delete cascade,

  constraint request_messages_valid_author
    check (
      (
        sender_type = 'team'
        and author_user_id is not null
        and author_client_id is null
      )
      or (
        sender_type = 'client'
        and author_user_id is null
        and author_client_id is not null
        and is_internal = false
      )
      or (
        sender_type = 'system'
        and author_user_id is null
        and author_client_id is null
      )
    )
);

create index request_messages_organization_id_idx
  on public.request_messages(organization_id);

create index request_messages_request_id_idx
  on public.request_messages(request_id);

create index request_messages_created_at_idx
  on public.request_messages(request_id, created_at);

-- =========================================================
-- REVISÕES DA IA
-- =========================================================

create table public.ai_reviews (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  request_id uuid not null,

  status public.ai_review_status not null default 'pending',

  suggested_summary text,
  suggested_priority public.request_priority,
  suggested_due_at timestamptz,
  suggested_tasks jsonb not null default '[]'::jsonb,

  model_name text,
  confidence numeric(4, 3),

  requested_by uuid not null
    references auth.users(id),

  reviewed_by uuid
    references auth.users(id),

  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ai_reviews_request_same_organization
    foreign key (request_id, organization_id)
    references public.requests(id, organization_id)
    on delete cascade,

  constraint ai_reviews_summary_length
    check (
      suggested_summary is null
      or char_length(suggested_summary) <= 5000
    ),

  constraint ai_reviews_tasks_is_array
    check (jsonb_typeof(suggested_tasks) = 'array'),

  constraint ai_reviews_confidence_range
    check (
      confidence is null
      or confidence between 0 and 1
    ),

  constraint ai_reviews_model_name_length
    check (
      model_name is null
      or char_length(btrim(model_name)) between 2 and 120
    )
);

create index ai_reviews_organization_id_idx
  on public.ai_reviews(organization_id);

create index ai_reviews_request_id_idx
  on public.ai_reviews(request_id);

create index ai_reviews_status_idx
  on public.ai_reviews(organization_id, status);

create index ai_reviews_created_at_idx
  on public.ai_reviews(request_id, created_at desc);

-- =========================================================
-- APROVAÇÕES
-- =========================================================

create table public.approvals (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  request_id uuid not null,
  client_id uuid not null,

  status public.approval_status not null default 'pending',

  message text,
  response_note text,

  requested_by uuid not null
    references auth.users(id),

  requested_at timestamptz not null default now(),
  responded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint approvals_request_client_same_organization
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

  constraint approvals_message_length
    check (
      message is null
      or char_length(message) <= 5000
    ),

  constraint approvals_response_note_length
    check (
      response_note is null
      or char_length(response_note) <= 5000
    )
);

-- Apenas uma aprovação pendente por solicitação.
create unique index approvals_one_pending_per_request_idx
  on public.approvals(request_id)
  where status = 'pending';

create index approvals_organization_id_idx
  on public.approvals(organization_id);

create index approvals_client_id_idx
  on public.approvals(client_id);

create index approvals_status_idx
  on public.approvals(organization_id, status);

-- =========================================================
-- FUNÇÕES E TRIGGERS
-- =========================================================

-- Valida se o autor interno pertence à organização.
create function public.validate_request_message_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.sender_type = 'team'
    and not exists (
      select 1
      from public.organization_members as membership
      where membership.organization_id = new.organization_id
        and membership.user_id = new.author_user_id
    )
  then
    raise exception
      'Message author must be a member of the organization';
  end if;

  return new;
end;
$$;

create trigger request_messages_validate_author
before insert on public.request_messages
for each row
execute function public.validate_request_message_author();

-- Valida e registra a revisão humana da IA.
create function public.validate_ai_reviewer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending'::public.ai_review_status then
    new.reviewed_by = null;
    new.reviewed_at = null;
  else
    if new.reviewed_by is null then
      raise exception
        'A reviewed AI suggestion requires a reviewer';
    end if;

    if not exists (
      select 1
      from public.organization_members as membership
      where membership.organization_id = new.organization_id
        and membership.user_id = new.reviewed_by
    )
    then
      raise exception
        'AI reviewer must be a member of the organization';
    end if;

    new.reviewed_at = coalesce(new.reviewed_at, now());
  end if;

  return new;
end;
$$;

create trigger ai_reviews_validate_reviewer
before insert or update of status, reviewed_by
on public.ai_reviews
for each row
execute function public.validate_ai_reviewer();

-- Registra quando uma aprovação recebe resposta.
create function public.sync_approval_responded_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pending'::public.approval_status then
    new.responded_at = null;
  else
    new.responded_at = coalesce(new.responded_at, now());
  end if;

  return new;
end;
$$;

create trigger approvals_sync_responded_at
before insert or update of status
on public.approvals
for each row
execute function public.sync_approval_responded_at();

create trigger ai_reviews_set_updated_at
before update on public.ai_reviews
for each row
execute function public.set_updated_at();

create trigger approvals_set_updated_at
before update on public.approvals
for each row
execute function public.set_updated_at();

revoke all on function public.validate_request_message_author()
  from public;

revoke all on function public.validate_ai_reviewer()
  from public;

revoke all on function public.sync_approval_responded_at()
  from public;

-- =========================================================
-- PERMISSÕES DA DATA API
-- =========================================================

revoke all on table public.request_messages
  from anon, authenticated;

revoke all on table public.ai_reviews
  from anon, authenticated;

revoke all on table public.approvals
  from anon, authenticated;

-- Mensagens são imutáveis depois do envio.
grant select, insert, delete
  on table public.request_messages to authenticated;

grant select, insert, delete
  on table public.ai_reviews to authenticated;

grant update (
  status,
  suggested_summary,
  suggested_priority,
  suggested_due_at,
  suggested_tasks,
  reviewed_by,
  updated_at
) on table public.ai_reviews to authenticated;

grant select, insert, delete
  on table public.approvals to authenticated;

grant update (
  status,
  response_note,
  updated_at
) on table public.approvals to authenticated;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.request_messages enable row level security;
alter table public.ai_reviews enable row level security;
alter table public.approvals enable row level security;

-- Mensagens.
create policy "request_messages_select_members"
on public.request_messages
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

-- Usuários internos só podem escrever como eles mesmos.
-- Mensagens de cliente e sistema serão criadas pelo backend seguro.
create policy "request_messages_insert_team"
on public.request_messages
for insert
to authenticated
with check (
  sender_type = 'team'
  and author_user_id = (select auth.uid())
  and public.is_organization_member(organization_id)
);

create policy "request_messages_delete_admins"
on public.request_messages
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Revisões da IA.
create policy "ai_reviews_select_members"
on public.ai_reviews
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "ai_reviews_insert_members"
on public.ai_reviews
for insert
to authenticated
with check (
  requested_by = (select auth.uid())
  and status = 'pending'
  and public.is_organization_member(organization_id)
);

create policy "ai_reviews_update_members"
on public.ai_reviews
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
  and (
    status = 'pending'
    or reviewed_by = (select auth.uid())
  )
);

create policy "ai_reviews_delete_admins"
on public.ai_reviews
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Aprovações.
create policy "approvals_select_members"
on public.approvals
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "approvals_insert_members"
on public.approvals
for insert
to authenticated
with check (
  requested_by = (select auth.uid())
  and status = 'pending'
  and public.is_organization_member(organization_id)
);

-- A equipe pode cancelar uma aprovação.
-- Aprovar ou solicitar mudanças será feito pelo portal seguro do cliente.
create policy "approvals_update_team_cancel"
on public.approvals
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  status = 'cancelled'
  and public.is_organization_member(organization_id)
);

create policy "approvals_delete_admins"
on public.approvals
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);