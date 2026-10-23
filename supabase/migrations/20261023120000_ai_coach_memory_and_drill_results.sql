-- Ava learner memory and chat-drill results.
--
-- Memory: a handful of short durable facts the learner told Ava ("I'm sitting UKVI",
-- "explain with Bangla examples"), written by the ai-coach Edge Function from the same
-- model reply that answers the question, so it costs no extra AI call. The learner can
-- read and delete every item from the Coach page.
--
-- Drill results: the first answer to each multiple-choice mini-exercise. They stay in
-- the private schema and only ever reach Ava as a "tentative" evidence entry. Chat
-- practice never changes official scores or skill proficiency.
set lock_timeout = '2s';
set statement_timeout = '30s';

create table public.ai_coach_memory (
  user_id uuid primary key references public.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 8),
  updated_at timestamptz not null default now()
);

alter table public.ai_coach_memory enable row level security;
revoke all on table public.ai_coach_memory from public, anon, authenticated;
grant select on table public.ai_coach_memory to authenticated;

create policy "Learners read own coach memory"
on public.ai_coach_memory for select to authenticated
using (user_id = (select public.get_my_public_user_id()));

comment on table public.ai_coach_memory is
  'Short durable learner-stated facts replayed into Ava prompts. Written only by the ai-coach Edge Function; items expire after 120 days in application code.';

create table ai_coach_private.exercise_results (
  message_id uuid primary key references public.ai_coach_messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  correct boolean not null,
  prompt text not null check (length(prompt) between 1 and 160),
  created_at timestamptz not null default now()
);
create index ai_coach_exercise_results_user_recent
  on ai_coach_private.exercise_results (user_id, created_at desc);

alter table ai_coach_private.exercise_results enable row level security;
revoke all on table ai_coach_private.exercise_results from public, anon, authenticated;

-- Same contract as before; the first answer to each exercise is now also recorded.
create or replace function public.ai_coach_check_exercise(
  p_auth uuid,
  p_message_id uuid,
  p_selected_index integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  answer ai_coach_private.exercise_answers;
  learner_id uuid;
  is_correct boolean;
  exercise_prompt text;
begin
  select id into strict learner_id from public.users where auth_id = p_auth;
  select * into answer from ai_coach_private.exercise_answers
    where message_id = p_message_id and user_id = learner_id;
  if not found then raise exception 'Exercise not found' using errcode = '42501'; end if;
  if p_selected_index < 0 or p_selected_index > 4 then
    raise exception 'Invalid answer choice' using errcode = '22023';
  end if;
  is_correct := p_selected_index = answer.correct_index;
  select left(coalesce(exercise->>'prompt', ''), 160) into exercise_prompt
    from public.ai_coach_messages where id = p_message_id and user_id = learner_id;
  if exercise_prompt is not null and length(exercise_prompt) > 0 then
    insert into ai_coach_private.exercise_results(message_id, user_id, correct, prompt)
    values(p_message_id, learner_id, is_correct, exercise_prompt)
    on conflict (message_id) do nothing;
  end if;
  return jsonb_build_object(
    'correct', is_correct,
    'correctIndex', answer.correct_index,
    'explanation', answer.explanation
  );
end
$$;

revoke all on function public.ai_coach_check_exercise(uuid,uuid,integer)
  from public, anon, authenticated;
grant execute on function public.ai_coach_check_exercise(uuid,uuid,integer) to service_role;

-- Last 30 days of first-attempt drill results, for the evidence builder.
create or replace function public.ai_coach_practice_summary(p_auth uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  learner_id uuid;
  recent record;
  missed jsonb;
begin
  select id into strict learner_id from public.users where auth_id = p_auth;
  select count(*)::integer as total,
         count(*) filter (where correct)::integer as correct,
         max(created_at) as last_at
    into recent
    from ai_coach_private.exercise_results
   where user_id = learner_id and created_at >= now() - interval '30 days';
  select coalesce(jsonb_agg(prompt order by created_at desc), '[]'::jsonb) into missed
    from (
      select prompt, created_at from ai_coach_private.exercise_results
       where user_id = learner_id and not correct and created_at >= now() - interval '30 days'
       order by created_at desc limit 3
    ) latest;
  return jsonb_build_object(
    'total', coalesce(recent.total, 0),
    'correct', coalesce(recent.correct, 0),
    'lastAt', recent.last_at,
    'missedPrompts', missed
  );
end
$$;

revoke all on function public.ai_coach_practice_summary(uuid) from public, anon, authenticated;
grant execute on function public.ai_coach_practice_summary(uuid) to service_role;
