-- Vocabulary AI word cards: admission, rate limits and budget.
-- Run against an isolated database that has public.users and
-- public.vocabulary_items plus migrations 20261024090000 and 20261024100000.
begin;
insert into public.users(id, auth_id) values
  ('11000000-0000-0000-0000-000000000001', '01000000-0000-0000-0000-000000000001'),
  ('11000000-0000-0000-0000-000000000002', '01000000-0000-0000-0000-000000000002');
insert into public.users(id, auth_id, subscription_tier, subscription_end_date) values
  ('11000000-0000-0000-0000-000000000003', '01000000-0000-0000-0000-000000000003', 'pro', now() + interval '30 days'),
  ('11000000-0000-0000-0000-000000000004', '01000000-0000-0000-0000-000000000004', 'pro', now() - interval '1 day');

do $$
declare
  free_a uuid := '01000000-0000-0000-0000-000000000001';
  free_b uuid := '01000000-0000-0000-0000-000000000002';
  pro uuid := '01000000-0000-0000-0000-000000000003';
  lapsed uuid := '01000000-0000-0000-0000-000000000004';
  r jsonb;
  op uuid;
  i integer;
begin
  -- Learner-writable columns are bounded.
  begin
    insert into public.vocabulary_items(word, level) values ('x', 'Z9');
    raise exception 'bad level accepted';
  exception when check_violation then null; end;
  begin
    insert into public.vocabulary_items(word, translations) values ('x', '[]');
    raise exception 'array translations accepted';
  exception when check_violation then null; end;

  -- A fresh generation is reserved and counted.
  op := gen_random_uuid();
  r := public.vocab_define_reserve(free_a, op, repeat('a', 40));
  assert r->>'state' = 'reserved' and (r->>'remainingDailyQuota')::int = 24, 'first reservation';
  perform public.vocab_define_finish(op, '{"meaning":"x"}', 0.0004, 700, 'm', 900, true);

  -- A cached answer is free: it does not use the allowance.
  r := public.vocab_define_reserve(free_b, gen_random_uuid(), repeat('b', 40), '{"meaning":"c"}');
  assert r->>'state' = 'complete' and (r->>'cached')::boolean and (r->>'remainingDailyQuota')::int = 25, 'cached hit';

  -- Same word, same learner, still running: busy rather than a second charge.
  r := public.vocab_define_reserve(free_a, gen_random_uuid(), repeat('c', 40));
  assert r->>'state' = 'reserved', 'second word';
  r := public.vocab_define_reserve(free_a, gen_random_uuid(), repeat('c', 40));
  assert r->>'state' = 'rate_limited' and r->>'type' = 'busy', 'duplicate in flight';

  -- Idempotent replay.
  op := gen_random_uuid();
  perform public.vocab_define_reserve(pro, op, repeat('d', 40));
  perform public.vocab_define_finish(op, '{"meaning":"x"}', 0.0004, 700, 'm', 900, true);
  r := public.vocab_define_reserve(pro, op, repeat('d', 40));
  assert (r->>'replayed')::boolean and r->>'state' = 'complete', 'replay';

  -- Burst: the 13th request in a minute is refused with a retry time.
  update vocab_assistant_private.settings set burst_per_minute = 12;
  for i in 1..12 loop
    r := public.vocab_define_reserve(lapsed, gen_random_uuid(), repeat('e', 40), '{"meaning":"c"}');
    assert r->>'state' = 'complete', 'burst allowance ' || i;
  end loop;
  r := public.vocab_define_reserve(lapsed, gen_random_uuid(), repeat('e', 40), '{"meaning":"c"}');
  assert r->>'state' = 'rate_limited' and r->>'type' = 'burst'
    and (r->>'retryAfterSeconds')::int between 1 and 60, 'burst refusal';

  -- Daily cap per tier: a lapsed Pro plan is Free.
  delete from vocab_assistant_private.operations;
  update vocab_assistant_private.settings
    set free_daily_generations = 2, paid_daily_generations = 4, burst_per_minute = 120;
  for i in 1..2 loop
    op := gen_random_uuid();
    r := public.vocab_define_reserve(lapsed, op, repeat(i::text, 40));
    assert r->>'state' = 'reserved', 'lapsed within cap';
    perform public.vocab_define_finish(op, '{"meaning":"x"}', 0.0004, 700, 'm', 900, true);
  end loop;
  r := public.vocab_define_reserve(lapsed, gen_random_uuid(), repeat('9', 40));
  assert r->>'state' = 'rate_limited' and r->>'type' = 'quota' and (r->>'remainingDailyQuota')::int = 0,
    'lapsed plan uses the free cap';
  r := public.vocab_define_reserve(lapsed, gen_random_uuid(), repeat('9', 40), '{"meaning":"c"}');
  assert r->>'state' = 'complete', 'cached answers still served after the cap';
  for i in 1..4 loop
    op := gen_random_uuid();
    r := public.vocab_define_reserve(pro, op, repeat((i + 2)::text, 40));
    assert r->>'state' = 'reserved', 'pro within cap ' || i;
    perform public.vocab_define_finish(op, '{"meaning":"x"}', 0.0004, 700, 'm', 900, true);
  end loop;
  assert public.vocab_define_reserve(pro, gen_random_uuid(), repeat('8', 40))->>'type' = 'quota', 'pro cap';

  -- Failed generations are not charged to the learner.
  delete from vocab_assistant_private.operations;
  for i in 1..5 loop
    op := gen_random_uuid();
    perform public.vocab_define_reserve(free_b, op, repeat(i::text, 40));
    perform public.vocab_define_finish(op, null, 0, 0, '', 100, false);
  end loop;
  assert public.vocab_define_reserve(free_b, gen_random_uuid(), repeat('7', 40))->>'state' = 'reserved',
    'failures do not use the allowance';

  -- Shared budget: new generation pauses, cached answers keep working, and an
  -- exhausted day is recorded for the admin.
  delete from vocab_assistant_private.operations;
  update vocab_assistant_private.settings
    set daily_budget = 0.003, free_daily_generations = 25, concurrent_generations = 5;
  op := gen_random_uuid();
  perform public.vocab_define_reserve(free_a, op, repeat('a', 40));
  perform public.vocab_define_finish(op, '{"meaning":"x"}', 0.0031, 900, 'm', 900, true);
  r := public.vocab_define_reserve(free_b, gen_random_uuid(), repeat('b', 40));
  assert r->>'state' = 'budget_exhausted', 'budget stop';
  assert exists(select 1 from vocab_assistant_private.budget_events where level = 'exhausted'), 'budget event';
  r := public.vocab_define_reserve(free_b, gen_random_uuid(), repeat('b', 40), '{"meaning":"c"}');
  assert r->>'state' = 'complete', 'cache served during budget stop';

  -- Kill switch.
  update vocab_assistant_private.settings set enabled = false;
  begin
    perform public.vocab_define_reserve(free_a, gen_random_uuid(), repeat('z', 40));
    raise exception 'kill switch ignored';
  exception when others then
    assert sqlerrm like '%temporarily unavailable%', 'kill switch message: ' || sqlerrm;
  end;

  -- Nothing here is reachable from the browser.
  assert not has_function_privilege('anon', 'public.vocab_define_reserve(uuid,uuid,text,jsonb)', 'execute');
  assert not has_function_privilege('authenticated', 'public.vocab_define_reserve(uuid,uuid,text,jsonb)', 'execute');
  assert not has_schema_privilege('authenticated', 'vocab_assistant_private', 'usage');
end $$;
rollback;
