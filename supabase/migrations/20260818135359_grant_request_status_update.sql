-- Permite atualizações na tabela requests para usuários autenticados.
-- As políticas RLS continuam determinando quais registros podem ser alterados.

grant update
on table public.requests
to authenticated;