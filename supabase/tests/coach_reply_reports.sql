-- Run against an isolated migrated database. All fixtures roll back.
begin;

insert into auth.users (id, email) values
  ('3c880000-0000-4000-8000-000000000001', 'coach-reporter@example.invalid'),
  ('3c880000-0000-4000-8000-000000000002', 'coach-other@example.invalid');

insert into public.users (auth_id, email, full_name, role, subscription_tier)
values
  ('3c880000-0000-4000-8000-000000000001', 'coach-reporter@example.invalid', 'Reporter', 'user', 'free'),
  ('3c880000-0000-4000-8000-000000000002', 'coach-other@example.invalid', 'Other learner', 'user', 'free')
on conflict (auth_id) do nothing;

insert into public.ai_coach_conversations (id, user_id)
select '3c880000-0000-4000-8000-000000000003', id from public.users
where auth_id = '3c880000-0000-4000-8000-000000000001';

insert into public.ai_coach_messages (id, conversation_id, user_id, role, content)
select seed.id, c.id, c.user_id, seed.role, 'Synthetic message'
from public.ai_coach_conversations c cross join (values
  ('3c880000-0000-4000-8000-000000000004'::uuid, 'assistant'),
  ('3c880000-0000-4000-8000-000000000005'::uuid, 'user')
) seed(id, role)
where c.id = '3c880000-0000-4000-8000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', '3c880000-0000-4000-8000-000000000002', true);
do $$
begin
  begin
    perform public.report_coach_reply('3c880000-0000-4000-8000-000000000004');
    raise exception 'Another learner reported a private reply';
  exception when no_data_found then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '3c880000-0000-4000-8000-000000000001', true);
do $$
begin
  begin
    perform public.report_coach_reply('3c880000-0000-4000-8000-000000000005');
    raise exception 'A user message was accepted';
  exception when no_data_found then null;
  end;
end $$;

select public.report_coach_reply('3c880000-0000-4000-8000-000000000004');
select public.report_coach_reply('3c880000-0000-4000-8000-000000000004');

reset role;
do $$
begin
  assert not has_function_privilege('anon', 'public.report_coach_reply(uuid)', 'execute');
  assert not has_table_privilege('authenticated', 'ai_coach_private.reply_reports', 'SELECT');
  assert not has_table_privilege('authenticated', 'ai_coach_private.reply_reports', 'INSERT');
  assert (select count(*) from ai_coach_private.reply_reports
    where message_id = '3c880000-0000-4000-8000-000000000004') = 1;
end $$;

delete from public.ai_coach_conversations
where id = '3c880000-0000-4000-8000-000000000003';
do $$
begin
  assert not exists (select 1 from ai_coach_private.reply_reports
    where message_id = '3c880000-0000-4000-8000-000000000004');
end $$;

rollback;
