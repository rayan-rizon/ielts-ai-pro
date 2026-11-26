-- The existing due-word RPC omits the state used by the spaced-repetition
-- scheduler. Keep its web contract and expose a complete mobile review card.
create function public.get_learner_due_vocabulary(p_limit integer default 50)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(card) order by card.next_review_date nulls first, card.id), '[]'::jsonb)
  from (
    select v.id, v.word, v.definition, v.example, v.example_sentence, v.source,
      v.mastery_level, v.next_review_date, v.last_reviewed,
      v.times_reviewed, v.interval_days, v.ease_factor
    from public.vocabulary_items v
    where v.user_id = (select u.id from public.users u where u.auth_id = (select auth.uid()))
      and (v.next_review_date is null or v.next_review_date <= now())
      and v.definition !~* '^[[:space:]]*(saved ielts vocabulary word|no definition)?[[:space:]]*$'
    order by v.next_review_date nulls first, v.id
    limit least(greatest(coalesce(p_limit, 50), 1), 50)
  ) card
$$;

revoke all on function public.get_learner_due_vocabulary(integer) from public, anon;
grant execute on function public.get_learner_due_vocabulary(integer) to authenticated;
