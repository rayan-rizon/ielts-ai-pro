-- Separate the onboarding routing gate from the onboarding funnel metric.
--
-- `users.onboarding_completed` does three jobs at once: it decides whether a
-- signed-in learner lands on Onboarding or Dashboard, it is written at the
-- focus step (5 of 6) before the learner ever sees the plan, and it is ALSO
-- written by "Skip for now" with no answers collected. 95 of 457 "onboarded"
-- accounts skipped, so the admin activation rate overstates real activation by
-- roughly a fifth, and no column records when activation happened.
--
-- The gate stays exactly as it is — skippers must keep it true or they are
-- trapped in a redirect loop. Two new columns carry the measurement instead:
--
--   onboarding_outcome     'answered' | 'skipped'  (null while still in flow)
--   onboarding_completed_at  when the gate first flipped true
--
-- Backfill note: `onboarding_completed_at` is left NULL for existing rows. The
-- real timestamp was never recorded and `updated_at` moves on every later
-- profile edit, so writing it here would invent precision the data does not
-- have. Only rows completed from this migration forward carry a timestamp.
-- `onboarding_outcome` is backfilled from `weak_area`, which the focus step
-- always writes and the skip path never does; a skipper who later set a weak
-- area in Settings is the one case that reads as 'answered'.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
    ADD COLUMN IF NOT EXISTS onboarding_outcome text,
    ADD COLUMN IF NOT EXISTS onboarding_offer_seen_at timestamptz,
    ADD COLUMN IF NOT EXISTS onboarding_plan_clicked text,
    ADD COLUMN IF NOT EXISTS onboarding_offer_exit text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_onboarding_outcome_check'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_onboarding_outcome_check
            CHECK (onboarding_outcome IS NULL
                   OR onboarding_outcome IN ('answered', 'skipped'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_onboarding_plan_clicked_check'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_onboarding_plan_clicked_check
            CHECK (onboarding_plan_clicked IS NULL
                   OR onboarding_plan_clicked IN ('pro', 'premium'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.users'::regclass
          AND conname = 'users_onboarding_offer_exit_check'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_onboarding_offer_exit_check
            CHECK (onboarding_offer_exit IS NULL
                   OR onboarding_offer_exit IN ('upgrade', 'free'));
    END IF;
END $$;

UPDATE public.users
SET onboarding_outcome = CASE
        WHEN weak_area IS NOT NULL THEN 'answered'
        ELSE 'skipped'
    END
WHERE onboarding_completed IS TRUE
  AND onboarding_outcome IS NULL;

COMMENT ON COLUMN public.users.onboarding_completed IS
    'Routing gate only: true means do not send this learner back to Onboarding. True for skippers too — read onboarding_outcome to measure activation.';
COMMENT ON COLUMN public.users.onboarding_outcome IS
    'How the gate was satisfied: answered (finished the questionnaire) or skipped. NULL while the learner is still in the flow.';
COMMENT ON COLUMN public.users.onboarding_completed_at IS
    'When the gate first flipped true. NULL for accounts completed before 2026-09-14 — the timestamp was never recorded and is not reconstructable.';
COMMENT ON COLUMN public.users.onboarding_offer_seen_at IS
    'First time the onboarding plan offer rendered a real price for this learner. NULL means they never reached it, or they finished onboarding before 2026-09-14.';
COMMENT ON COLUMN public.users.onboarding_plan_clicked IS
    'First paid plan clicked from the onboarding offer. Sticky: a later free exit does not erase the intent it recorded.';
COMMENT ON COLUMN public.users.onboarding_offer_exit IS
    'How the learner last left the offer: upgrade (went to checkout) or free (continued on the free plan). NULL means they left without choosing.';

-- Records the outcome and stamps the completion time the first time the gate
-- flips, so a later profile edit can never move the activation timestamp.
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

  v_outcome := pg_catalog.nullif(p_updates->>'onboarding_outcome', '');
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

-- The learner's own browser reports what it showed them, so the write is
-- narrowed to one verb per step and the caller can only ever touch its own row.
-- First sight and first paid click are write-once: a learner who re-enters
-- onboarding cannot restart their own funnel, and no client can backdate it.
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

  if p_step = 'plan_clicked' and pg_catalog.coalesce(p_tier, '') not in ('pro', 'premium') then
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
    onboarding_offer_seen_at = pg_catalog.coalesce(profile.onboarding_offer_seen_at, pg_catalog.now()),
    onboarding_plan_clicked = case
      when p_step = 'plan_clicked'
        then pg_catalog.coalesce(profile.onboarding_plan_clicked, p_tier)
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

-- Carry the outcome into the admin overview so "Onboarded" in the panel can
-- distinguish a learner who answered from one who pressed "Skip for now".
-- Unchanged from 20260913160244 apart from the single added column.
CREATE OR REPLACE FUNCTION public.get_admin_overview_with_signup_sources(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_overview jsonb;
    v_recent jsonb;
    v_markets jsonb;
    v_market_map jsonb;
    v_days integer;
    v_since timestamptz;
    v_geo_total bigint;
    v_geo_identified bigint;
    v_geo_countries bigint;
    v_offer jsonb;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;

    v_days := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
    v_since := (date_trunc('day', now() AT TIME ZONE 'Asia/Dhaka')
        - make_interval(days => v_days - 1)) AT TIME ZONE 'Asia/Dhaka';
    v_overview := public.get_admin_overview(v_days);

    SELECT jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC)
    INTO v_recent
    FROM (
        SELECT id, full_name, email, created_at, subscription_tier,
            onboarding_completed, onboarding_outcome,
            CASE
                WHEN upper(trim(country)) ~ '^[A-Z]{2}$'
                    AND upper(trim(country)) NOT IN ('XX', 'T1')
                    THEN upper(trim(country))
                ELSE 'unknown'
            END AS country,
            COALESCE(NULLIF(signup_channel, ''), 'unknown') AS signup_channel,
            signup_utm_source
        FROM public.users
        WHERE role IS DISTINCT FROM 'admin'
        ORDER BY created_at DESC
        LIMIT 8
    ) t;

    WITH cohort AS (
        SELECT
            u.id,
            CASE
                WHEN upper(trim(u.country)) ~ '^[A-Z]{2}$'
                    AND upper(trim(u.country)) NOT IN ('XX', 'T1')
                    THEN upper(trim(u.country))
                ELSE 'unknown'
            END AS country,
            u.onboarding_completed,
            u.subscription_tier IN ('pro', 'premium') AS is_paying,
            u.last_active >= v_since AS active_in_window,
            EXISTS (
                SELECT 1 FROM public.test_sessions ts WHERE ts.user_id = u.id
            ) AS has_practiced
        FROM public.users u
        WHERE u.role IS DISTINCT FROM 'admin'
          AND u.created_at >= v_since
    ), grouped AS (
        SELECT country,
            count(*) AS signups,
            count(*) FILTER (WHERE onboarding_completed) AS onboarded,
            count(*) FILTER (WHERE has_practiced) AS practiced,
            count(*) FILTER (WHERE is_paying) AS paying,
            count(*) FILTER (WHERE active_in_window) AS active
        FROM cohort
        GROUP BY country
    ), scored AS (
        -- Share stays relative to every signup in the window, including the
        -- unknown bucket, so the percentages still add up to the real total.
        SELECT grouped.*, sum(signups) OVER () AS total_signups
        FROM grouped
    ), identified AS (
        SELECT * FROM scored WHERE country <> 'unknown'
    ), top_markets AS (
        SELECT * FROM identified ORDER BY signups DESC, country LIMIT 8
    )
    SELECT
        (SELECT jsonb_agg(jsonb_build_object(
            'country', country,
            'signups', signups,
            'share', CASE WHEN total_signups > 0
                THEN round(100.0 * signups / total_signups, 1) ELSE 0 END,
            'onboarded', onboarded,
            'practiced', practiced,
            'paying', paying,
            'active', active,
            'activationRate', CASE WHEN signups > 0
                THEN round(100.0 * onboarded / signups, 1) ELSE 0 END,
            'practiceRate', CASE WHEN signups > 0
                THEN round(100.0 * practiced / signups, 1) ELSE 0 END,
            'paidRate', CASE WHEN signups > 0
                THEN round(100.0 * paying / signups, 1) ELSE 0 END
        ) ORDER BY signups DESC, country) FROM top_markets),
        (SELECT jsonb_agg(jsonb_build_object(
            'country', country,
            'signups', signups,
            'share', CASE WHEN total_signups > 0
                THEN round(100.0 * signups / total_signups, 1) ELSE 0 END
        ) ORDER BY signups DESC, country) FROM identified)
    INTO v_markets, v_market_map;

    SELECT
        count(*),
        count(*) FILTER (WHERE upper(trim(country)) ~ '^[A-Z]{2}$'
            AND upper(trim(country)) NOT IN ('XX', 'T1')),
        count(DISTINCT upper(trim(country))) FILTER (
            WHERE upper(trim(country)) ~ '^[A-Z]{2}$'
              AND upper(trim(country)) NOT IN ('XX', 'T1'))
    INTO v_geo_total, v_geo_identified, v_geo_countries
    FROM public.users
    WHERE role IS DISTINCT FROM 'admin'
      AND created_at >= v_since;

    -- The onboarding plan offer, measured over the same window. The denominator
    -- is learners who finished the questionnaire, because only they ever reach
    -- the offer. `notRecorded` is reported rather than folded into zero: those
    -- learners onboarded before this tracking existed, which is a different
    -- fact from "reached the offer and did nothing".
    SELECT jsonb_build_object(
        'answered', count(*),
        'notRecorded', count(*) FILTER (WHERE onboarding_offer_seen_at IS NULL
            AND onboarding_completed_at IS NULL),
        'missedOffer', count(*) FILTER (WHERE onboarding_offer_seen_at IS NULL
            AND onboarding_completed_at IS NOT NULL),
        'sawOffer', count(*) FILTER (WHERE onboarding_offer_seen_at IS NOT NULL),
        'clickedPro', count(*) FILTER (WHERE onboarding_plan_clicked = 'pro'),
        'clickedPremium', count(*) FILTER (WHERE onboarding_plan_clicked = 'premium'),
        'continuedFree', count(*) FILTER (WHERE onboarding_offer_exit = 'free'),
        'leftUndecided', count(*) FILTER (WHERE onboarding_offer_seen_at IS NOT NULL
            AND onboarding_offer_exit IS NULL))
    INTO v_offer
    FROM public.users
    WHERE role IS DISTINCT FROM 'admin'
      AND created_at >= v_since
      AND onboarding_outcome = 'answered';

    RETURN v_overview || jsonb_build_object(
        'recentSignups', COALESCE(v_recent, '[]'::jsonb),
        'onboardingOffer', COALESCE(v_offer, '{}'::jsonb),
        'markets', COALESCE(v_markets, '[]'::jsonb),
        'marketMap', COALESCE(v_market_map, '[]'::jsonb),
        'geoSummary', jsonb_build_object(
            'identifiedSignups', v_geo_identified,
            'unknownSignups', v_geo_total - v_geo_identified,
            'coverageRate', CASE WHEN v_geo_total > 0
                THEN round(100.0 * v_geo_identified / v_geo_total, 1) ELSE 0 END,
            'countries', v_geo_countries,
            'basis', 'first_touch_signup_country'));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_admin_overview_with_signup_sources(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_overview_with_signup_sources(integer) TO authenticated;
