-- =========================================================
-- ALINORA — DATABASE PERMISSION HARDENING
-- =========================================================
-- Objetivos:
-- 1. Remover permissões desnecessárias do papel anon.
-- 2. Impedir execução direta de funções usadas apenas por triggers.
-- 3. Preservar somente a RPC pública necessária para convites.
-- 4. Reforçar privilégios padrão para objetos futuros.
-- =========================================================

begin;

-- =========================================================
-- REMOVE ANONYMOUS ACCESS FROM APPLICATION TABLES
-- =========================================================
-- A aplicação exige autenticação para acessar dados.
-- Mesmo com RLS ativo, anon não precisa possuir privilégios
-- estruturais nessas tabelas.

revoke all privileges
on table public.profiles
from anon;

revoke all privileges
on table public.organizations
from anon;

revoke all privileges
on table public.organization_members
from anon;

revoke all privileges
on table public.clients
from anon;

revoke all privileges
on table public.projects
from anon;

revoke all privileges
on table public.requests
from anon;

revoke all privileges
on table public.tasks
from anon;

revoke all privileges
on table public.request_messages
from anon;

revoke all privileges
on table public.ai_reviews
from anon;

revoke all privileges
on table public.approvals
from anon;

revoke all privileges
on table public.client_access
from anon;

revoke all privileges
on table public.attachments
from anon;

-- =========================================================
-- PROTECT TRIGGER-ONLY FUNCTIONS
-- =========================================================
-- Estas funções devem ser executadas pelo PostgreSQL através
-- de triggers, nunca diretamente pela API pública.

revoke all
on function public.set_updated_at()
from public, anon, authenticated;

revoke all
on function public.sync_approval_responded_at()
from public, anon, authenticated;

revoke all
on function public.sync_request_completed_at()
from public, anon, authenticated;

revoke all
on function public.validate_attachment_relations()
from public, anon, authenticated;

revoke all
on function public.validate_client_portal_message()
from public, anon, authenticated;

revoke all
on function public.protect_client_approval_response()
from public, anon, authenticated;

revoke all
on function public.log_request_status_change()
from public, anon, authenticated;

-- =========================================================
-- PRESERVE THE INTENTIONAL INVITATION RPC
-- =========================================================
-- Esta é a única função pública SECURITY DEFINER que precisa
-- ser chamada por um usuário autenticado.
--
-- A própria função valida:
-- - se existe usuário autenticado;
-- - se o e-mail autenticado corresponde ao convite;
-- - se o convite ainda está pendente;
-- - se o convite pertence ao usuário correto.

revoke all
on function public.activate_client_access(uuid)
from public, anon;

grant execute
on function public.activate_client_access(uuid)
to authenticated, service_role;

comment on function public.activate_client_access(uuid) is
  'RPC intencional para ativação de convite. Exige autenticação e valida o e-mail do JWT contra o convite pendente.';

-- =========================================================
-- HARDEN DEFAULT PRIVILEGES
-- =========================================================
-- Impede que novas tabelas e funções criadas futuramente
-- recebam permissões anônimas automaticamente.

alter default privileges
in schema public
revoke all on tables
from anon;

alter default privileges
in schema public
revoke execute on functions
from public, anon;

commit;