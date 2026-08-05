-- =========================================================
-- ALINORA
-- Identidade, organizações e membros
-- =========================================================

-- Papéis disponíveis dentro de uma empresa.
create type public.organization_role as enum (
  'owner',
  'admin',
  'member'
);

-- =========================================================
-- TABELAS
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length
    check (
      full_name is null
      or char_length(btrim(full_name)) between 2 and 100
    )
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint organizations_name_length
    check (char_length(btrim(name)) between 2 and 100),

  constraint organizations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.organization_members (
  organization_id uuid not null
    references public.organizations(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  role public.organization_role not null default 'member',
  created_at timestamptz not null default now(),

  primary key (organization_id, user_id)
);

-- Índices para consultas frequentes.
create index organization_members_user_id_idx
  on public.organization_members(user_id);

create index organizations_created_by_idx
  on public.organizations(created_by);

-- =========================================================
-- FUNÇÕES E TRIGGERS
-- =========================================================

-- Atualiza automaticamente o campo updated_at.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

-- Cria um perfil quando um usuário é criado no Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Torna o criador da empresa automaticamente owner.
create function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (
    organization_id,
    user_id,
    role
  )
  values (
    new.id,
    new.created_by,
    'owner'
  );

  return new;
end;
$$;

create trigger organization_created
after insert on public.organizations
for each row
execute function public.handle_new_organization();

-- =========================================================
-- FUNÇÕES AUXILIARES DE SEGURANÇA
-- =========================================================

create function public.is_organization_member(
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
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

create function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = any(allowed_roles)
  );
$$;

create function public.shares_organization(
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as current_membership
    join public.organization_members as target_membership
      on target_membership.organization_id =
         current_membership.organization_id
    where current_membership.user_id = (select auth.uid())
      and target_membership.user_id = target_user_id
  );
$$;

-- Remove execução pública das funções internas.
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_organization() from public;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_role(
  uuid,
  public.organization_role[]
) from public;
revoke all on function public.shares_organization(uuid) from public;

grant execute on function public.is_organization_member(uuid)
  to authenticated;

grant execute on function public.has_organization_role(
  uuid,
  public.organization_role[]
) to authenticated;

grant execute on function public.shares_organization(uuid)
  to authenticated;

-- =========================================================
-- PERMISSÕES DA DATA API
-- =========================================================

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;

grant select on table public.profiles to authenticated;

grant update (
  full_name,
  avatar_url,
  updated_at
) on table public.profiles to authenticated;

grant select, insert, delete
  on table public.organizations to authenticated;

grant update (
  name,
  slug,
  updated_at
) on table public.organizations to authenticated;

grant select, insert, delete
  on table public.organization_members to authenticated;

grant update (
  role
) on table public.organization_members to authenticated;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Perfis: usuário vê o próprio perfil e seus colegas.
create policy "profiles_select_shared_organization"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.shares_organization(id)
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);

-- Organizações.
create policy "organizations_select_members"
on public.organizations
for select
to authenticated
using (
  public.is_organization_member(id)
);

create policy "organizations_insert_authenticated"
on public.organizations
for insert
to authenticated
with check (
  created_by = (select auth.uid())
);

create policy "organizations_update_admins"
on public.organizations
for update
to authenticated
using (
  public.has_organization_role(
    id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_organization_role(
    id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "organizations_delete_owners"
on public.organizations
for delete
to authenticated
using (
  public.has_organization_role(
    id,
    array['owner']::public.organization_role[]
  )
);

-- Membros das organizações.
create policy "organization_members_select_members"
on public.organization_members
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);

create policy "organization_members_insert_admins"
on public.organization_members
for insert
to authenticated
with check (
  public.has_organization_role(
    organization_id,
    array['owner']::public.organization_role[]
  )
  or (
    role = 'member'::public.organization_role
    and public.has_organization_role(
      organization_id,
      array['admin']::public.organization_role[]
    )
  )
);

create policy "organization_members_update_owners"
on public.organization_members
for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner']::public.organization_role[]
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner']::public.organization_role[]
  )
);

create policy "organization_members_delete_owners"
on public.organization_members
for delete
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner']::public.organization_role[]
  )
);