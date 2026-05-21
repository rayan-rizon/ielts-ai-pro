-- Restrict SECURITY DEFINER RPC exposure while preserving app-facing RPCs.
--
-- Public/anon access is removed from SECURITY DEFINER functions except helper
-- functions used in RLS policy expressions and the public blog view counter.
-- Authenticated access is removed only from functions that are debug/setup,
-- trigger-only, or service-role-only based on current application usage.

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname NOT IN (
        'can_access_user_id',
        'get_current_profile_id',
        'get_my_public_user_id',
        'get_my_user_id',
        'increment_resource_view',
        'is_admin',
        'is_current_user_admin',
        'is_vocab_owner'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
  END LOOP;

  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'auto_complete_learning_activity',
        'calculate_question_row_count',
        'create_admin_user_complete',
        'debug_get_passages',
        'debug_question_count',
        'delete_vocab_item_v2',
        'delete_vocabulary_item',
        'exec_sql',
        'handle_new_user_points',
        'handle_payment_approval',
        'handle_stripe_event',
        'insert_question',
        'link_auth_user_to_profile',
        'rls_auto_enable',
        'sync_passage_total_questions',
        'update_resources_updated_at',
        'update_single_question_count',
        'update_skill_proficiency_from_activity',
        'update_skill_proficiency_from_test',
        'update_study_streak',
        'update_user_last_active',
        'update_user_profile_after_test'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
  END LOOP;

  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
