set lock_timeout = '2s';
set statement_timeout = '30s';

create table ai_coach_private.reply_reports (
  message_id uuid primary key references public.ai_coach_messages(id) on delete cascade,
  reported_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table ai_coach_private.reply_reports enable row level security;
revoke all on table ai_coach_private.reply_reports from public, anon, authenticated;

-- The only learner-facing entry point. It accepts an ID and checks ownership
-- against auth.uid(), independently of any client-supplied account details.
create function public.report_coach_reply(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.ai_coach_messages m
  join public.users u on u.id = m.user_id
  where m.id = p_message_id
    and m.role = 'assistant'
    and u.auth_id = (select auth.uid())
  for key share of m;

  if not found then
    raise no_data_found using message = 'AI reply unavailable';
  end if;

  insert into ai_coach_private.reply_reports (message_id)
    values (p_message_id)
    on conflict (message_id) do nothing;
end;
$$;

revoke all on function public.report_coach_reply(uuid) from public, anon, authenticated;
grant execute on function public.report_coach_reply(uuid) to authenticated;
