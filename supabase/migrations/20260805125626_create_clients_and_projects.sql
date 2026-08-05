-- =========================================================
-- ALINORA
-- Clientes e projetos
-- =========================================================

-- Status disponíveis para clientes e projetos.
create type public.client_status as enum (
  'active',
  'inactive',
  'archived'
);

create type public.project_status as enum (
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- =========================================================
-- CLIENTES
-- =========================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  name text not null,
  company_name text,
  email text,
  phone text,
  notes text,

  status public.client_status not null default 'active',

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clients_name_length
    check (char_length(btrim(name)) between 2 and 120),

  constraint clients_company_name_length
    check (
      company_name is null
      or char_length(btrim(company_name)) between 2 and 160
    ),

  constraint clients_email_length
    check (
      email is null
      or char_length(btrim(email)) between 3 and 320
    ),

  constraint clients_phone_length
    check (
      phone is null
      or char_length(btrim(phone)) between 5 and 30
    ),

  constraint clients_notes_length
    check (
      notes is null
      or char_length(notes) <= 5000
    ),

  constraint clients_id_organization_unique
    unique (id, organization_id)
);

-- Impede e-mails duplicados dentro da mesma empresa.
create unique index clients_organization_email_unique_idx
  on public.clients (
    organization_id,
    lower(email)
  )
  where email is not null
    and btrim(email) <> '';

create index clients_organization_id_idx
  on public.clients(organization_id);

create index clients_created_by_idx
  on public.clients(created_by);

create index clients_status_idx
  on public.clients(organization_id, status);

-- =========================================================
-- PROJETOS
-- =========================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  client_id uuid not null,

  name text not null,
  description text,

  status public.project_status not null default 'active',

  start_date date,
  due_date date,

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_name_length
    check (char_length(btrim(name)) between 2 and 160),

  constraint projects_description_length
    check (
      description is null
      or char_length(description) <= 10000
    ),

  constraint projects_valid_dates
    check (
      start_date is null
      or due_date is null
      or due_date >= start_date
    ),

  constraint projects_client_same_organization
    foreign key (client_id, organization_id)
    references public.clients(id, organization_id)
    on delete restrict,

  constraint projects_id_organization_unique
    unique (id, organization_id)
);

create index projects_organization_id_idx
  on public.projects(organization_id);

create index projects_client_id_idx
  on public.projects(client_id);

create index projects_created_by_idx
  on public.projects(created_by);

create index projects_status_idx
  on public.projects(organization_id, status);

create index projects_due_date_idx
  on public.projects(organization_id, due_date);

-- =========================================================
-- UPDATED_AT
-- =========================================================

create trigger clients_set_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- =========================================================
-- PERMISSÕES DA DATA API
-- =========================================================

revoke all on table public.clients from anon, authenticated;
revoke all on table public.projects from anon, authenticated;

grant select, insert, delete
  on table public.clients to authenticated;

grant update (
  name,
  company_name,
  email,
  phone,
  notes,
  status,
  updated_at
) on table public.clients to authenticated;

grant select, insert, delete
  on table public.projects to authenticated;

grant update (
  client_id,
  name,
  description,
  status,
  start_date,
  due_date,
  updated_at
) on table public.projects to authenticated;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.clients enable row level security;
alter table public.projects enable row level security;

-- Clientes: membros podem visualizar, cadastrar e editar.
create policy "clients_select_members"
on public.clients
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "clients_insert_members"
on public.clients
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.is_organization_member(organization_id)
);

create policy "clients_update_members"
on public.clients
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

-- Somente owner e admin podem excluir clientes.
create policy "clients_delete_admins"
on public.clients
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Projetos: membros podem visualizar, cadastrar e editar.
create policy "projects_select_members"
on public.projects
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "projects_insert_members"
on public.projects
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and public.is_organization_member(organization_id)
);

create policy "projects_update_members"
on public.projects
for update
to authenticated
using (
  public.is_organization_member(organization_id)
)
with check (
  public.is_organization_member(organization_id)
);

-- Somente owner e admin podem excluir projetos.
create policy "projects_delete_admins"
on public.projects
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);