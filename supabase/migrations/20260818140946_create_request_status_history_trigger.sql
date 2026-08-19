-- Registra automaticamente no histórico toda mudança
-- realizada no status de uma conversa.

create or replace function public.log_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  status_label text;
begin
  status_label :=
    case new.status
      when 'received' then 'Recebida'
      when 'ai_review' then 'Em análise'
      when 'in_progress' then 'Em andamento'
      when 'waiting_client' then 'Aguardando cliente'
      when 'completed' then 'Concluída'
      when 'cancelled' then 'Cancelada'
      else new.status::text
    end;

  insert into public.request_messages (
    organization_id,
    request_id,
    author_user_id,
    author_client_id,
    author_client_access_id,
    sender_type,
    body,
    is_internal
  )
  values (
    new.organization_id,
    new.id,
    null,
    null,
    null,
    'system',
    'Status atualizado para: ' || status_label || '.',
    false
  );

  return new;
end;
$$;

-- Impede que a função privilegiada seja chamada diretamente
-- pela API. Ela somente poderá ser executada pelo gatilho.
revoke all
on function public.log_request_status_change()
from public;

revoke all
on function public.log_request_status_change()
from anon;

revoke all
on function public.log_request_status_change()
from authenticated;

drop trigger if exists
  request_status_history_trigger
on public.requests;

create trigger request_status_history_trigger
after update of status
on public.requests
for each row
when (old.status is distinct from new.status)
execute function public.log_request_status_change();