-- =========================================================
-- ALINORA
-- Solicitações e tarefas
-- =========================================================

create type public.request_status as enum (
  'received',
  'ai_review',
  'in_progress',
  'waiting_client',
  'completed',
  'cancelled'
);

create type public.request_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create type public.request_source as enum (
  'manual',
  'email',
  'whatsapp',
  'portal',
  'other'
);

create type public.task_status as enum (
  'todo',
  'in_progress',
  'blocked',
  'done',
  'cancelled'
);

-- Permite validar projeto, cliente e organização juntos.
alter table public.projects
add constraint projects_id_client_organization_unique
unique (id, client_id, organization_id);

-- =========================================================
-- SOLICITAÇÕES
-- =========================================================

create table public.requests (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid not null,
  project_id uuid,

  title text not null,
  original_message text not null,
  summary text,

  status public.request_status not null default 'received',
  priority public.request_priority not null default 'normal',
  source public.request_source not null default 'manual',

  due_at timestamptz,
  completed_at timestamptz,

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint requests_title_length
    check (char_length(btrim(title)) between 2 and 180),

  constraint requests_original_message_length
    check (
      char_length(btrim(original_message)) between 1 and 30000
    ),

  constraint requests_summary_length
    check (
      summary is null
      or char_length(summary) <= 5000
    ),

  constraint requests_client_same_organization
    foreign key (client_id, organization_id)
    references public.clients(id, organization_id)
    on delete restrict,

  constraint requests_project_client_same_organization
    foreign key (project_id, client_id, organization_id)
    references public.projects(id, client_id, organization_id)
    on delete restrict,

  constraint requests_id_organization_unique
    unique (id, organization_id)
);

create index requests_organization_id_idx
  on public.requests(organization_id);

create index requests_client_id_idx
  on public.requests(client_id);

create index requests_project_id_idx
  on public.requests(project_id);

create index requests_created_by_idx
  on public.requests(created_by);

create index requests_status_idx
  on public.requests(organization_id, status);

create index requests_priority_idx
  on public.requests(organization_id, priority);

create index requests_due_at_idx
  on public.requests(organization_id, due_at);

-- =========================================================
-- TAREFAS
-- =========================================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  request_id uuid not null,

  title text not null,
  description text,

  status public.task_status not null default 'todo',
  priority public.request_priority not null default 'normal',

  due_at timestamptz,

  assignee_id uuid
    references auth.users(id) on delete set null,

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_title_length
    check (char_length(btrim(title)) between 2 and 200),

  constraint tasks_description_length
    check (
      description is null
      or char_length(description) <= 10000
    ),

  constraint tasks_request_same_organization
    foreign key (request_id, organization_id)
    references public.requests(id, organization_id)
    on delete cascade
);

create index tasks_organization_id_idx
  on public.tasks(organization_id);

create index tasks_request_id_idx
  on public.tasks(request_id);

create index tasks_assignee_id_idx
  on public.tasks(assignee_id);

create index tasks_status_idx
  on public.tasks(organization_id, status);

create index tasks_due_at_idx
  on public.tasks(organization_id, due_at);

-- =========================================================
-- FUNÇÕES E TRIGGERS
-- =========================================================

create trigger requests_set_updated_at
before update on public.requests
for each row
execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

-- Preenche completed_at quando a solicitação é concluída.
create function public.sync_request_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed'::public.request_status then
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;

  return new;
end;
$$;

create trigger requests_sync_completed_at
before insert or update of status on public.requests
for each row
execute function public.sync_request_completed_at();

-- Garante que o responsável pela tarefa pertença à organização.
create function public.validate_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null
    and not exists (
      select 1
      from public.organization_members as membership
      where membership.organization_id = new.organization_id
        and membership.user_id = new.assignee_id
    )
  then
    raise exception
      'Task assignee must be a member of the organization';
  end if;

  return new;
end;
$$;

create trigger tasks_validate_assignee
before insert or update of organization_id, assignee_id
on public.tasks
for each row
execute function public.validate_task_assignee();

revoke all on function public.sync_request_completed_at()
  from public;

revoke all on function public.validate_task_assignee()
  from public;

-- =========================================================
-- PERMISSÕES DA DATA API
-- =========================================================

revoke all on table public.requests from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;

grant select, insert, delete
  on table public.requests to authenticated;

grant update (
  client_id,
  project_id,
  title,
  original_message,
  summary,
  status,
  priority,
  source,
  due_at,
  updated_at
) on table public.requests to authenticated;

grant select, insert, delete
  on table public.tasks to authenticated;

grant update (
  title,
  description,
  status,
  priority,
  due_at,
  assignee_id,
  updated_at
) on table public.tasks to authenticated;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.requests enable row level security;
alter table public.tasks enable row level security;

-- Solicitações.
create policy "requests_select_members"
on public.requests
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "requests_insert_members"
on public.requests
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.is_organization_member(organization_id)
);

create policy "requests_update_members"
on public.requests
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

create policy "requests_delete_admins"
on public.requests
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Tarefas.
create policy "tasks_select_members"
on public.tasks
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "tasks_insert_members"
on public.tasks
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.is_organization_member(organization_id)
);

create policy "tasks_update_members"
on public.tasks
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

create policy "tasks_delete_admins"
on public.tasks
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);