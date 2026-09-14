-- Fix: COALESCE and NULLIF cannot be schema-qualified.
--
-- 20260914130736 wrote `pg_catalog.coalesce(...)` and `pg_catalog.nullif(...)`,
-- copying the `pg_catalog.now()` / `pg_catalog.lower()` pattern the surrounding
-- code uses to stay safe under `SET search_path = ''`. That pattern does not
-- apply here: COALESCE, NULLIF, GREATEST and LEAST are SQL *constructs*, not
-- functions in pg_catalog, so qualifying them raises
--   42883: function pg_catalog.coalesce(text, unknown) does not exist
-- at runtime. They never needed qualifying — the grammar resolves them without
-- consulting search_path at all.
--
-- CREATE FUNCTION does not resolve identifiers inside a plpgsql body, so both
-- functions were created without complaint and failed only when first called:
--
--   * record_onboarding_offer threw on every call. The client logs and swallows
--     the error by design (analytics must never block a learner), so the whole
--     plan-offer funnel silently recorded nothing.
--   * upsert_user_profile threw on every call, and User.updateMyUserData fell
--     back to a direct table update. Onboarding kept working and the payload
--     columns (onboarding_completed, onboarding_outcome) were still written,
--     which is why this stayed invisible — but onboarding_completed_at is
--     derived inside the function, so it was never set.
--
-- Bodies below are unchanged from 20260914130736 apart from dropping the four
-- bad prefixes. pg_catalog.now(), .lower() and .to_jsonb() are real catalog
-- functions and stay qualified.

CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_auth_id uuid,
  p_email text,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
declare
  v_user_id uuid;
  v_result jsonb;
  v_availability jsonb;
  v_outcome text;
begin
  if auth.uid() is null or auth.uid() <> p_auth_id then
    raise exception 'Authentication required for this profile' using errcode = '42501';
  end if;

  if p_updates ? 'study_availability' then
    v_availability := p_updates->'study_availability';
    if not public.is_valid_study_availability(v_availability) then
      raise exception 'Invalid study availability' using errcode = '22023';
    end if;
  end if;

  v_outcome := nullif(p_updates->>'onboarding_outcome', '');
  if v_outcome is not null and v_outcome not in ('answered', 'skipped') then
    raise exception 'Invalid onboarding outcome' using errcode = '22023';
  end if;

  select profile.id into v_user_id
  from public.users as profile
  where profile.auth_id = p_auth_id;

  if v_user_id is null then
    select profile.id into v_user_id
    from public.users as profile
    where pg_catalog.lower(profile.email) = pg_catalog.lower(p_email);
  end if;

  if v_user_id is not null then
    update public.users as profile
    set
      auth_id = p_auth_id,
      full_name = case when p_updates ? 'full_name' then nullif(p_updates->>'full_name', '') else profile.full_name end,
      avatar_url = case when p_updates ? 'avatar_url' then nullif(p_updates->>'avatar_url', '') else profile.avatar_url end,
      exam_type = case when p_updates ? 'exam_type' then nullif(p_updates->>'exam_type', '') else profile.exam_type end,
      target_band_score = case when p_updates ? 'target_band_score' then (p_updates->>'target_band_score')::numeric(2,1) else profile.target_band_score end,
      test_date = case when p_updates ? 'test_date' then nullif(p_updates->>'test_date', '')::date else profile.test_date end,
      study_hours_goal = case when p_updates ? 'study_hours_goal' then greatest(1, least(40, (p_updates->>'study_hours_goal')::numeric)) else profile.study_hours_goal end,
      study_availability = case when p_updates ? 'study_availability' then v_availability else profile.study_availability end,
      weak_area = case when p_updates ? 'weak_area' then nullif(p_updates->>'weak_area', '') else profile.weak_area end,
      onboarding_completed = case when p_updates ? 'onboarding_completed' then (p_updates->>'onboarding_completed')::boolean else profile.onboarding_completed end,
      -- 'answered' is the stronger statement: a learner who finished the
      -- questionnaire after skipping is activated, never the other way round.
      onboarding_outcome = case
        when v_outcome is null then profile.onboarding_outcome
        when profile.onboarding_outcome = 'answered' then 'answered'
        else v_outcome
      end,
      onboarding_completed_at = case
        when profile.onboarding_completed_at is not null then profile.onboarding_completed_at
        when (p_updates->>'onboarding_completed')::boolean is true then pg_catalog.now()
        else profile.onboarding_completed_at
      end,
      updated_at = pg_catalog.now()
    where profile.id = v_user_id
    returning pg_catalog.to_jsonb(profile.*) into v_result;
    return v_result;
  end if;

  insert into public.users as profile (
    auth_id, email, full_name, avatar_url, exam_type, role, subscription_tier,
    target_band_score, test_date, study_hours_goal, study_availability, weak_area,
    onboarding_completed, onboarding_outcome, onboarding_completed_at,
    created_at, updated_at
  ) values (
    p_auth_id,
    p_email,
    coalesce(nullif(p_updates->>'full_name', ''), p_email),
    nullif(p_updates->>'avatar_url', ''),
    coalesce(nullif(p_updates->>'exam_type', ''), 'academic'),
    'user',
    'free',
    nullif(p_updates->>'target_band_score', '')::numeric(2,1),
    nullif(p_updates->>'test_date', '')::date,
    coalesce(nullif(p_updates->>'study_hours_goal', '')::numeric, 10),
    v_availability,
    nullif(p_updates->>'weak_area', ''),
    coalesce((p_updates->>'onboarding_completed')::boolean, false),
    v_outcome,
    case when (p_updates->>'onboarding_completed')::boolean is true then pg_catalog.now() end,
    pg_catalog.now(),
    pg_catalog.now()
  )
  returning pg_catalog.to_jsonb(profile.*) into v_result;

  return v_result;
end;
$function$;

REVOKE ALL ON FUNCTION public.upsert_user_profile(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_profile(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_profile(uuid, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.record_onboarding_offer(p_step text, p_tier text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
declare
  v_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_step not in ('offer_seen', 'plan_clicked', 'continued_free') then
    raise exception 'Invalid onboarding offer step' using errcode = '22023';
  end if;

  if p_step = 'plan_clicked' and coalesce(p_tier, '') not in ('pro', 'premium') then
    raise exception 'Invalid onboarding plan tier' using errcode = '22023';
  end if;

  select profile.id into v_user_id
  from public.users as profile
  where profile.auth_id = auth.uid();

  if v_user_id is null then
    return;
  end if;

  update public.users as profile
  set
    -- Every step implies the offer was on screen, so a missed 'offer_seen'
    -- (a reload, a blocked request) can never produce a click with no sighting.
    onboarding_offer_seen_at = coalesce(profile.onboarding_offer_seen_at, pg_catalog.now()),
    onboarding_plan_clicked = case
      when p_step = 'plan_clicked'
        then coalesce(profile.onboarding_plan_clicked, p_tier)
      else profile.onboarding_plan_clicked
    end,
    onboarding_offer_exit = case
      when p_step = 'plan_clicked' then 'upgrade'
      when p_step = 'continued_free' then 'free'
      else profile.onboarding_offer_exit
    end
  where profile.id = v_user_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.record_onboarding_offer(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_onboarding_offer(text, text) TO authenticated;
