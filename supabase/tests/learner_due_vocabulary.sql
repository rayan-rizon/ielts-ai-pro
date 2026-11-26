-- Run in an isolated migrated Supabase database. Fixtures roll back.
begin;
insert into auth.users (id, email) values
  ('7b710000-0000-4000-8000-000000000001', 'vocab-owner@example.invalid'),
  ('7b710000-0000-4000-8000-000000000002', 'vocab-other@example.invalid');
insert into public.users (auth_id, email, full_name, role, subscription_tier)
values
  ('7b710000-0000-4000-8000-000000000001', 'vocab-owner@example.invalid', 'Vocabulary owner', 'user', 'free'),
  ('7b710000-0000-4000-8000-000000000002', 'vocab-other@example.invalid', 'Other learner', 'user', 'free')
on conflict (auth_id) do nothing;

insert into public.vocabulary_items
  (user_id, word, definition, next_review_date, times_reviewed, interval_days, ease_factor)
select u.id, seed.word, seed.definition, seed.due, 3, 6, 2.1
from public.users u
join (values
  ('7b710000-0000-4000-8000-000000000001'::uuid, 'placeholder', ' No definition ', null::timestamptz),
  ('7b710000-0000-4000-8000-000000000001', 'due', 'A real definition', now() - interval '1 day'),
  ('7b710000-0000-4000-8000-000000000001', 'future', 'Another definition', now() + interval '1 day'),
  ('7b710000-0000-4000-8000-000000000002', 'private', 'Other learner definition', null)
) seed(auth_id,word,definition,due) on seed.auth_id = u.auth_id;

select set_config('request.jwt.claim.sub', '7b710000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $$
declare queue jsonb;
begin
  assert to_regprocedure('public.get_learner_due_vocabulary(integer)') is not null,
    'The due vocabulary projection needs the saved review schedule';
  queue := public.get_learner_due_vocabulary(1);
  assert jsonb_array_length(queue) = 1;
  assert queue->0->>'word' = 'due', 'Filter placeholders before limiting the queue';
  assert queue->0 @> '{"times_reviewed":3,"interval_days":6,"ease_factor":2.1}';
  assert jsonb_array_length(public.get_learner_due_vocabulary(50)) = 1,
    'The queue must exclude future and other learners’ words';
  assert not has_function_privilege('anon', 'public.get_learner_due_vocabulary(integer)', 'execute');
end $$;
rollback;
