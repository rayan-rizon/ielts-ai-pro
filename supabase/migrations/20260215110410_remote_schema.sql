drop extension if exists "pg_net";

drop trigger if exists "protect_buckets_delete" on "storage"."buckets";

drop trigger if exists "trigger_update_skill_proficiency_from_activity" on "public"."learning_path_activities";

drop trigger if exists "tr_update_passage_questions_count" on "public"."passages";

drop trigger if exists "on_payment_approval" on "public"."payment_requests";

drop trigger if exists "tr_calc_question_count" on "public"."questions";

drop trigger if exists "tr_sync_passage_totals" on "public"."questions";

drop trigger if exists "resources_updated_at_trigger" on "public"."resources";

drop trigger if exists "trigger_update_skill_proficiency" on "public"."test_sessions";

drop trigger if exists "on_auth_user_created_points" on "public"."users";

drop trigger if exists "protect_user_columns" on "public"."users";

drop policy "achievements_admin_delete" on "public"."achievements";

drop policy "achievements_admin_insert" on "public"."achievements";

drop policy "achievements_admin_update" on "public"."achievements";

drop policy "api_usage_delete_policy" on "public"."ai_api_usage";

drop policy "api_usage_modify_policy" on "public"."ai_api_usage";

drop policy "api_usage_select_policy" on "public"."ai_api_usage";

drop policy "api_usage_update_policy" on "public"."ai_api_usage";

drop policy "analytics_all_policy" on "public"."analytics_data";

drop policy "Users and admins view consent history" on "public"."consent_history";

drop policy "Users can insert own consent history" on "public"."consent_history";

drop policy "Users can insert own daily focus" on "public"."daily_focus";

drop policy "Users can update own daily focus" on "public"."daily_focus";

drop policy "Users can view own daily focus" on "public"."daily_focus";

drop policy "Users can insert own learning path activities" on "public"."learning_path_activities";

drop policy "Users can update own learning path activities" on "public"."learning_path_activities";

drop policy "Users can view own learning path activities" on "public"."learning_path_activities";

drop policy "paths_all_policy" on "public"."learning_paths";

drop policy "notifications_admin_delete" on "public"."notifications";

drop policy "notifications_admin_insert" on "public"."notifications";

drop policy "notifications_admin_update" on "public"."notifications";

drop policy "passages_delete_policy" on "public"."passages";

drop policy "passages_insert_policy" on "public"."passages";

drop policy "passages_select_policy" on "public"."passages";

drop policy "passages_update_policy" on "public"."passages";

drop policy "Update payment requests" on "public"."payment_requests";

drop policy "View payment requests" on "public"."payment_requests";

drop policy "promo_codes_all_policy" on "public"."promo_codes";

drop policy "questions_delete_policy" on "public"."questions";

drop policy "questions_insert_policy" on "public"."questions";

drop policy "questions_update_policy" on "public"."questions";

drop policy "Admins can delete referral tiers" on "public"."referral_reward_tiers";

drop policy "Admins can insert referral tiers" on "public"."referral_reward_tiers";

drop policy "Admins can update referral tiers" on "public"."referral_reward_tiers";

drop policy "resources_delete_policy" on "public"."resources";

drop policy "resources_insert_policy" on "public"."resources";

drop policy "resources_update_policy" on "public"."resources";

drop policy "Users can insert own skill proficiency" on "public"."skill_proficiency";

drop policy "Users can update own skill proficiency" on "public"."skill_proficiency";

drop policy "Users can view own skill proficiency" on "public"."skill_proficiency";

drop policy "Admins can read system logs" on "public"."system_health_logs";

drop policy "system_settings_admin_delete" on "public"."system_settings";

drop policy "system_settings_admin_insert" on "public"."system_settings";

drop policy "system_settings_admin_update" on "public"."system_settings";

drop policy "sessions_all_policy" on "public"."test_sessions";

drop policy "rate_limits_delete_policy" on "public"."tier_rate_limits";

drop policy "rate_limits_insert_policy" on "public"."tier_rate_limits";

drop policy "rate_limits_update_policy" on "public"."tier_rate_limits";

drop policy "achievements_all_policy" on "public"."user_achievements";

drop policy "points_all_policy" on "public"."user_points";

drop policy "Users can read own rewards" on "public"."user_referral_rewards";

drop policy "Users and admins can read referrals" on "public"."user_referrals";

drop policy "users_delete_policy" on "public"."users";

drop policy "users_insert_policy" on "public"."users";

drop policy "users_select_policy" on "public"."users";

drop policy "vocab_all_policy" on "public"."vocabulary_items";

alter table "public"."ai_api_usage" drop constraint "ai_api_usage_user_id_fkey";

alter table "public"."analytics_data" drop constraint "analytics_data_user_id_fkey";

alter table "public"."billing_history" drop constraint "billing_history_auth_id_fkey";

alter table "public"."billing_history" drop constraint "billing_history_user_id_fkey";

alter table "public"."consent_history" drop constraint "consent_history_user_id_fkey";

alter table "public"."daily_focus" drop constraint "daily_focus_primary_activity_id_fkey";

alter table "public"."daily_focus" drop constraint "daily_focus_user_id_fkey";

alter table "public"."learning_path_activities" drop constraint "learning_path_activities_learning_path_id_fkey";

alter table "public"."learning_path_activities" drop constraint "learning_path_activities_user_id_fkey";

alter table "public"."learning_paths" drop constraint "learning_paths_user_id_fkey";

alter table "public"."payment_requests" drop constraint "payment_requests_auth_id_fkey";

alter table "public"."questions" drop constraint "questions_passage_id_fkey";

alter table "public"."referral_reward_tiers" drop constraint "referral_reward_tiers_updated_by_fkey";

alter table "public"."skill_proficiency" drop constraint "skill_proficiency_user_id_fkey";

alter table "public"."test_sessions" drop constraint "test_sessions_passage_id_fkey";

alter table "public"."test_sessions" drop constraint "test_sessions_user_id_fkey";

alter table "public"."tier_rate_limits" drop constraint "tier_rate_limits_updated_by_fkey";

alter table "public"."user_achievements" drop constraint "user_achievements_achievement_id_fkey";

alter table "public"."user_achievements" drop constraint "user_achievements_user_id_fkey";

alter table "public"."user_points" drop constraint "user_points_user_id_fkey";

alter table "public"."user_referral_rewards" drop constraint "user_referral_rewards_tier_id_fkey";

alter table "public"."user_referral_rewards" drop constraint "user_referral_rewards_user_id_fkey";

alter table "public"."user_referrals" drop constraint "user_referrals_referred_id_fkey";

alter table "public"."user_referrals" drop constraint "user_referrals_referrer_id_fkey";

alter table "public"."users" drop constraint "users_referred_by_fkey";

alter table "public"."vocabulary_items" drop constraint "vocabulary_items_created_by_fkey";

alter table "public"."vocabulary_items" drop constraint "vocabulary_items_user_id_fkey";

alter table "public"."achievements" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."analytics_data" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."learning_paths" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."passages" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."promo_codes" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."questions" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."test_sessions" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."user_achievements" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."user_points" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."users" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."vocabulary_items" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."ai_api_usage" add constraint "ai_api_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."ai_api_usage" validate constraint "ai_api_usage_user_id_fkey";

alter table "public"."analytics_data" add constraint "analytics_data_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."analytics_data" validate constraint "analytics_data_user_id_fkey";

alter table "public"."billing_history" add constraint "billing_history_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE not valid;

alter table "public"."billing_history" validate constraint "billing_history_auth_id_fkey";

alter table "public"."billing_history" add constraint "billing_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."billing_history" validate constraint "billing_history_user_id_fkey";

alter table "public"."consent_history" add constraint "consent_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."consent_history" validate constraint "consent_history_user_id_fkey";

alter table "public"."daily_focus" add constraint "daily_focus_primary_activity_id_fkey" FOREIGN KEY (primary_activity_id) REFERENCES public.learning_path_activities(id) not valid;

alter table "public"."daily_focus" validate constraint "daily_focus_primary_activity_id_fkey";

alter table "public"."daily_focus" add constraint "daily_focus_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."daily_focus" validate constraint "daily_focus_user_id_fkey";

alter table "public"."learning_path_activities" add constraint "learning_path_activities_learning_path_id_fkey" FOREIGN KEY (learning_path_id) REFERENCES public.learning_paths(id) ON DELETE CASCADE not valid;

alter table "public"."learning_path_activities" validate constraint "learning_path_activities_learning_path_id_fkey";

alter table "public"."learning_path_activities" add constraint "learning_path_activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."learning_path_activities" validate constraint "learning_path_activities_user_id_fkey";

alter table "public"."learning_paths" add constraint "learning_paths_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."learning_paths" validate constraint "learning_paths_user_id_fkey";

alter table "public"."payment_requests" add constraint "payment_requests_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES public.users(auth_id) ON DELETE CASCADE not valid;

alter table "public"."payment_requests" validate constraint "payment_requests_auth_id_fkey";

alter table "public"."questions" add constraint "questions_passage_id_fkey" FOREIGN KEY (passage_id) REFERENCES public.passages(id) ON DELETE CASCADE not valid;

alter table "public"."questions" validate constraint "questions_passage_id_fkey";

alter table "public"."referral_reward_tiers" add constraint "referral_reward_tiers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.users(id) not valid;

alter table "public"."referral_reward_tiers" validate constraint "referral_reward_tiers_updated_by_fkey";

alter table "public"."skill_proficiency" add constraint "skill_proficiency_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."skill_proficiency" validate constraint "skill_proficiency_user_id_fkey";

alter table "public"."test_sessions" add constraint "test_sessions_passage_id_fkey" FOREIGN KEY (passage_id) REFERENCES public.passages(id) ON DELETE CASCADE not valid;

alter table "public"."test_sessions" validate constraint "test_sessions_passage_id_fkey";

alter table "public"."test_sessions" add constraint "test_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."test_sessions" validate constraint "test_sessions_user_id_fkey";

alter table "public"."tier_rate_limits" add constraint "tier_rate_limits_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.users(id) not valid;

alter table "public"."tier_rate_limits" validate constraint "tier_rate_limits_updated_by_fkey";

alter table "public"."user_achievements" add constraint "user_achievements_achievement_id_fkey" FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE not valid;

alter table "public"."user_achievements" validate constraint "user_achievements_achievement_id_fkey";

alter table "public"."user_achievements" add constraint "user_achievements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_achievements" validate constraint "user_achievements_user_id_fkey";

alter table "public"."user_points" add constraint "user_points_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_points" validate constraint "user_points_user_id_fkey";

alter table "public"."user_referral_rewards" add constraint "user_referral_rewards_tier_id_fkey" FOREIGN KEY (tier_id) REFERENCES public.referral_reward_tiers(id) not valid;

alter table "public"."user_referral_rewards" validate constraint "user_referral_rewards_tier_id_fkey";

alter table "public"."user_referral_rewards" add constraint "user_referral_rewards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_referral_rewards" validate constraint "user_referral_rewards_user_id_fkey";

alter table "public"."user_referrals" add constraint "user_referrals_referred_id_fkey" FOREIGN KEY (referred_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_referrals" validate constraint "user_referrals_referred_id_fkey";

alter table "public"."user_referrals" add constraint "user_referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_referrals" validate constraint "user_referrals_referrer_id_fkey";

alter table "public"."users" add constraint "users_referred_by_fkey" FOREIGN KEY (referred_by) REFERENCES public.users(id) not valid;

alter table "public"."users" validate constraint "users_referred_by_fkey";

alter table "public"."vocabulary_items" add constraint "vocabulary_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) not valid;

alter table "public"."vocabulary_items" validate constraint "vocabulary_items_created_by_fkey";

alter table "public"."vocabulary_items" add constraint "vocabulary_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."vocabulary_items" validate constraint "vocabulary_items_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_vocab_owner(owner_id uuid, creator_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = owner_id OR id = creator_id)
    AND auth_id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clear_promo_discount()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_old_code text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  SELECT promo_discount->>'code'
  INTO v_old_code
  FROM public.users
  WHERE auth_id = v_user_id;

  IF v_old_code IS NULL THEN
    RAISE EXCEPTION 'No active promo code to remove';
  END IF;

  -- Enable bypass for protected column trigger (trusted SECURITY DEFINER function)
  PERFORM set_config('app.bypass_column_protection', 'on', true);

  UPDATE public.users
  SET promo_discount = NULL, updated_at = now()
  WHERE auth_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'removed_code', v_old_code
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.count_inactive_users(days_inactive integer DEFAULT 30, subscription_filter text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_count INT;
BEGIN
  -- Admin check
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COUNT(*)::INT INTO total_count
  FROM users u
  WHERE COALESCE(u.last_active, u.created_at) < NOW() - (days_inactive || ' days')::INTERVAL
    AND u.role != 'admin'
    AND (subscription_filter IS NULL OR u.subscription_tier = subscription_filter);

  RETURN total_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_inactive_users(days_inactive integer DEFAULT 30, page_limit integer DEFAULT 50, page_offset integer DEFAULT 0, subscription_filter text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, auth_id uuid, email text, full_name text, subscription_tier text, last_active timestamp with time zone, created_at timestamp with time zone, inactive_days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin check via auth context
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.auth_id,
    u.email,
    u.full_name,
    u.subscription_tier,
    u.last_active,
    u.created_at,
    EXTRACT(DAY FROM NOW() - COALESCE(u.last_active, u.created_at))::INT as inactive_days
  FROM users u
  WHERE COALESCE(u.last_active, u.created_at) < NOW() - (days_inactive || ' days')::INTERVAL
    AND u.role != 'admin' -- Don't show admin accounts
    AND (subscription_filter IS NULL OR u.subscription_tier = subscription_filter)
  ORDER BY u.last_active ASC NULLS FIRST
  LIMIT page_limit OFFSET page_offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_writing_session_with_task(p_session_id uuid DEFAULT NULL::uuid, p_task_id text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_session RECORD;
  v_task RECORD;
  v_effective_task_id TEXT;

BEGIN
  -- If session_id is provided, load session first to get task_id
  IF p_session_id IS NOT NULL THEN
    SELECT * INTO v_session
    FROM test_sessions
    WHERE id = p_session_id
      AND (p_user_id IS NULL OR user_id = p_user_id)
    LIMIT 1;
    
    IF v_session IS NOT NULL THEN
      -- Extract task_id from session
      v_effective_task_id := COALESCE(
        v_session.passage_id::TEXT,
        v_session.content_data->>'id',
        v_session.content_data->>'passage_id',
        p_task_id
      );
    END IF;
  ELSE
    v_effective_task_id := p_task_id;
  END IF;
  
  -- Must have a task_id at this point
  IF v_effective_task_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'No task ID provided or found in session',
      'session', NULL,
      'task', NULL
    );
  END IF;
  
  -- Load task data
  SELECT * INTO v_task
  FROM passages
  WHERE id = v_effective_task_id::UUID
    AND is_active = TRUE
  LIMIT 1;
  
  IF v_task IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Task not found or inactive',
      'session', CASE WHEN v_session IS NOT NULL THEN row_to_json(v_session)::JSONB ELSE NULL END,
      'task', NULL
    );
  END IF;
  
  -- If no session loaded yet, try to find existing session by task_id
  IF v_session IS NULL AND p_user_id IS NOT NULL AND p_session_id IS NULL THEN
    SELECT * INTO v_session
    FROM test_sessions
    WHERE user_id = p_user_id
      AND test_type = 'writing'
      AND (
        passage_id::TEXT = v_effective_task_id
        OR content_data->>'id' = v_effective_task_id
      )
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- Build result
  RETURN jsonb_build_object(
    'error', NULL,
    'session', CASE WHEN v_session IS NOT NULL THEN row_to_json(v_session)::JSONB ELSE NULL END,
    'task', row_to_json(v_task)::JSONB
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_sensitive_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  caller_role TEXT;
  bypass_flag TEXT;
BEGIN
  -- Get the current role: 'service_role', 'authenticated', 'anon', or 'postgres'
  caller_role := current_setting('role', true);

  -- Allow service_role and postgres to modify anything
  IF caller_role IN ('service_role', 'rls_definer') THEN
    RETURN NEW;
  END IF;

  -- Allow trusted SECURITY DEFINER triggers to bypass (e.g. handle_payment_approval)
  bypass_flag := current_setting('app.bypass_column_protection', true);
  IF bypass_flag = 'on' THEN
    RETURN NEW;
  END IF;

  -- For authenticated users: block changes to protected columns
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Cannot modify protected column: role';
  END IF;

  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_tier';
  END IF;

  IF OLD.billing_interval IS DISTINCT FROM NEW.billing_interval THEN
    RAISE EXCEPTION 'Cannot modify protected column: billing_interval';
  END IF;

  IF OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id THEN
    RAISE EXCEPTION 'Cannot modify protected column: stripe_subscription_id';
  END IF;

  IF OLD.subscription_start_date IS DISTINCT FROM NEW.subscription_start_date THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_start_date';
  END IF;

  IF OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_end_date';
  END IF;

  IF OLD.subscription_amount IS DISTINCT FROM NEW.subscription_amount THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_amount';
  END IF;

  IF OLD.subscription_currency IS DISTINCT FROM NEW.subscription_currency THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_currency';
  END IF;

  IF OLD.bonus_writing_credits IS DISTINCT FROM NEW.bonus_writing_credits THEN
    RAISE EXCEPTION 'Cannot modify protected column: bonus_writing_credits';
  END IF;

  IF OLD.bonus_speaking_credits IS DISTINCT FROM NEW.bonus_speaking_credits THEN
    RAISE EXCEPTION 'Cannot modify protected column: bonus_speaking_credits';
  END IF;

  IF OLD.referral_bonus_expires_at IS DISTINCT FROM NEW.referral_bonus_expires_at THEN
    RAISE EXCEPTION 'Cannot modify protected column: referral_bonus_expires_at';
  END IF;

  IF OLD.auth_id IS DISTINCT FROM NEW.auth_id THEN
    RAISE EXCEPTION 'Cannot modify protected column: auth_id';
  END IF;

  -- NEW: Protect promo discount columns from direct user modification
  IF OLD.promo_discount IS DISTINCT FROM NEW.promo_discount THEN
    RAISE EXCEPTION 'Cannot modify protected column: promo_discount';
  END IF;

  IF OLD.used_promo_codes IS DISTINCT FROM NEW.used_promo_codes THEN
    RAISE EXCEPTION 'Cannot modify protected column: used_promo_codes';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.redeem_promo_code(code_lookup text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_promo RECORD;
  v_already_used BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not logged in');
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE upper(code) = upper(code_lookup)
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired promo code');
  END IF;

  SELECT (v_promo.id::text = ANY(COALESCE(used_promo_codes, ARRAY[]::text[])))
  INTO v_already_used
  FROM public.users
  WHERE auth_id = v_user_id;

  IF COALESCE(v_already_used, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this promo code');
  END IF;

  -- 1. Enable column protection bypass
  PERFORM set_config('app.bypass_column_protection', 'on', true);

  IF v_promo.grants_subscription IS NOT NULL THEN
    -- Activation logic
    UPDATE public.users
    SET 
      subscription_tier = v_promo.grants_subscription,
      promo_discount = NULL,
      used_promo_codes = array_append(COALESCE(used_promo_codes, ARRAY[]::text[]), v_promo.id::text),
      updated_at = now()
    WHERE auth_id = v_user_id;

    UPDATE public.promo_codes
    SET current_uses = COALESCE(current_uses, 0) + 1
    WHERE id = v_promo.id;

    -- 2. Reset bypass flag
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    RETURN jsonb_build_object(
      'success', true,
      'type', 'grant',
      'subscription', v_promo.grants_subscription,
      'message', 'Subscription ' || initcap(v_promo.grants_subscription) || ' activated successfully!'
    );
  ELSE
    -- Discount application logic
    UPDATE public.users
    SET 
      promo_discount = jsonb_build_object(
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'promo_id', v_promo.id::text,
        'applied_date', now()
      ),
      updated_at = now()
    WHERE auth_id = v_user_id;

    -- 3. Reset bypass flag
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    RETURN jsonb_build_object(
      'success', true,
      'type', 'discount',
      'discount_type', v_promo.discount_type,
      'discount_value', v_promo.discount_value,
      'code', v_promo.code,
      'message', 'Discount applied successfully!'
    );
  END IF;
END;
$function$
;


  create policy "achievements_admin_delete"
  on "public"."achievements"
  as permissive
  for delete
  to authenticated
using (( SELECT public.is_admin() AS is_admin));



  create policy "achievements_admin_insert"
  on "public"."achievements"
  as permissive
  for insert
  to authenticated
with check (( SELECT public.is_admin() AS is_admin));



  create policy "achievements_admin_update"
  on "public"."achievements"
  as permissive
  for update
  to authenticated
using (( SELECT public.is_admin() AS is_admin))
with check (( SELECT public.is_admin() AS is_admin));



  create policy "api_usage_delete_policy"
  on "public"."ai_api_usage"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "api_usage_modify_policy"
  on "public"."ai_api_usage"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "api_usage_select_policy"
  on "public"."ai_api_usage"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))) OR public.is_admin()));



  create policy "api_usage_update_policy"
  on "public"."ai_api_usage"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "analytics_all_policy"
  on "public"."analytics_data"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT public.get_my_public_user_id() AS get_my_public_user_id)) OR public.is_admin()));



  create policy "Users and admins view consent history"
  on "public"."consent_history"
  as permissive
  for select
  to public
using (((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));



  create policy "Users can insert own consent history"
  on "public"."consent_history"
  as permissive
  for insert
  to public
with check ((user_id = ( SELECT users.id
   FROM public.users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can insert own daily focus"
  on "public"."daily_focus"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = daily_focus.user_id))));



  create policy "Users can update own daily focus"
  on "public"."daily_focus"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = daily_focus.user_id))));



  create policy "Users can view own daily focus"
  on "public"."daily_focus"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = daily_focus.user_id))));



  create policy "Users can insert own learning path activities"
  on "public"."learning_path_activities"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = learning_path_activities.user_id))));



  create policy "Users can update own learning path activities"
  on "public"."learning_path_activities"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = learning_path_activities.user_id))));



  create policy "Users can view own learning path activities"
  on "public"."learning_path_activities"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = learning_path_activities.user_id))));



  create policy "paths_all_policy"
  on "public"."learning_paths"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT public.get_my_public_user_id() AS get_my_public_user_id)) OR public.is_admin()));



  create policy "notifications_admin_delete"
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using (( SELECT public.is_admin() AS is_admin));



  create policy "notifications_admin_insert"
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check (( SELECT public.is_admin() AS is_admin));



  create policy "notifications_admin_update"
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using (( SELECT public.is_admin() AS is_admin))
with check (( SELECT public.is_admin() AS is_admin));



  create policy "passages_delete_policy"
  on "public"."passages"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "passages_insert_policy"
  on "public"."passages"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "passages_select_policy"
  on "public"."passages"
  as permissive
  for select
  to authenticated
using (((is_active = true) OR public.is_admin()));



  create policy "passages_update_policy"
  on "public"."passages"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Update payment requests"
  on "public"."payment_requests"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));



  create policy "View payment requests"
  on "public"."payment_requests"
  as permissive
  for select
  to public
using (((auth_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));



  create policy "promo_codes_all_policy"
  on "public"."promo_codes"
  as permissive
  for all
  to authenticated
using (public.is_admin());



  create policy "questions_delete_policy"
  on "public"."questions"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "questions_insert_policy"
  on "public"."questions"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "questions_update_policy"
  on "public"."questions"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Admins can delete referral tiers"
  on "public"."referral_reward_tiers"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));



  create policy "Admins can insert referral tiers"
  on "public"."referral_reward_tiers"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));



  create policy "Admins can update referral tiers"
  on "public"."referral_reward_tiers"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));



  create policy "resources_delete_policy"
  on "public"."resources"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "resources_insert_policy"
  on "public"."resources"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "resources_update_policy"
  on "public"."resources"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Users can insert own skill proficiency"
  on "public"."skill_proficiency"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = skill_proficiency.user_id))));



  create policy "Users can update own skill proficiency"
  on "public"."skill_proficiency"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = skill_proficiency.user_id))));



  create policy "Users can view own skill proficiency"
  on "public"."skill_proficiency"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM public.users
  WHERE (users.id = skill_proficiency.user_id))));



  create policy "Admins can read system logs"
  on "public"."system_health_logs"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));



  create policy "system_settings_admin_delete"
  on "public"."system_settings"
  as permissive
  for delete
  to authenticated
using (( SELECT public.is_admin() AS is_admin));



  create policy "system_settings_admin_insert"
  on "public"."system_settings"
  as permissive
  for insert
  to authenticated
with check (( SELECT public.is_admin() AS is_admin));



  create policy "system_settings_admin_update"
  on "public"."system_settings"
  as permissive
  for update
  to authenticated
using (( SELECT public.is_admin() AS is_admin))
with check (( SELECT public.is_admin() AS is_admin));



  create policy "sessions_all_policy"
  on "public"."test_sessions"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT public.get_my_public_user_id() AS get_my_public_user_id)) OR public.is_admin()));



  create policy "rate_limits_delete_policy"
  on "public"."tier_rate_limits"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "rate_limits_insert_policy"
  on "public"."tier_rate_limits"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "rate_limits_update_policy"
  on "public"."tier_rate_limits"
  as permissive
  for update
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "achievements_all_policy"
  on "public"."user_achievements"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT public.get_my_public_user_id() AS get_my_public_user_id)) OR public.is_admin()));



  create policy "points_all_policy"
  on "public"."user_points"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT public.get_my_public_user_id() AS get_my_public_user_id)) OR public.is_admin()));



  create policy "Users can read own rewards"
  on "public"."user_referral_rewards"
  as permissive
  for select
  to authenticated
using ((user_id IN ( SELECT users.id
   FROM public.users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users and admins can read referrals"
  on "public"."user_referrals"
  as permissive
  for select
  to authenticated
using (((referrer_id IN ( SELECT users.id
   FROM public.users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));



  create policy "users_delete_policy"
  on "public"."users"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "users_insert_policy"
  on "public"."users"
  as permissive
  for insert
  to authenticated
with check (((auth_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));



  create policy "users_select_policy"
  on "public"."users"
  as permissive
  for select
  to authenticated
using (((auth_id = ( SELECT auth.uid() AS uid)) OR public.is_admin()));



  create policy "vocab_all_policy"
  on "public"."vocabulary_items"
  as permissive
  for all
  to authenticated
using (((user_id = ( SELECT public.get_my_public_user_id() AS get_my_public_user_id)) OR (created_by = ( SELECT auth.uid() AS uid)) OR public.is_admin()));


CREATE TRIGGER trigger_update_skill_proficiency_from_activity AFTER UPDATE ON public.learning_path_activities FOR EACH ROW EXECUTE FUNCTION public.update_skill_proficiency_from_activity();

CREATE TRIGGER tr_update_passage_questions_count BEFORE INSERT OR UPDATE ON public.passages FOR EACH ROW EXECUTE FUNCTION public.update_passage_questions_count();

CREATE TRIGGER on_payment_approval AFTER UPDATE ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.handle_payment_approval();

CREATE TRIGGER tr_calc_question_count BEFORE INSERT OR UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_single_question_count();

CREATE TRIGGER tr_sync_passage_totals AFTER INSERT OR DELETE OR UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.sync_passage_total_questions();

CREATE TRIGGER resources_updated_at_trigger BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_resources_updated_at();

CREATE TRIGGER trigger_update_skill_proficiency AFTER INSERT OR UPDATE ON public.test_sessions FOR EACH ROW EXECUTE FUNCTION public.update_skill_proficiency_from_test();

CREATE TRIGGER on_auth_user_created_points AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_points();

CREATE TRIGGER protect_user_columns BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_user_columns();

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


