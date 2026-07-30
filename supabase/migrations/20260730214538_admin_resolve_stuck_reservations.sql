-- Repair action for stuck AI quota reservations.
--
-- reserve_ai_api_usage() inserts an ai_api_usage row up front, and quota is
-- counted by get_user_daily_usage() as "every non-cached row today" — it does
-- not look at reservationStatus. So a reservation that never finalised has
-- permanently consumed the learner's quota for a request that never ran.
-- Flagging it 'failed' would not give the quota back; only removing the
-- phantom row does. This deletes reservations that are old enough that they can
-- no longer be legitimately finalised.
CREATE OR REPLACE FUNCTION public.resolve_stuck_ai_reservations(
    p_older_than_minutes integer DEFAULT 60,
    p_dry_run boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_cutoff   timestamptz;
    v_affected bigint;
    v_users    bigint;
    v_deleted  bigint := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Never let the caller reach back into in-flight requests.
    v_cutoff := now() - make_interval(mins => GREATEST(COALESCE(p_older_than_minutes, 60), 15));

    SELECT count(*), count(DISTINCT user_id)
    INTO v_affected, v_users
    FROM public.ai_api_usage
    WHERE request_metadata->>'reservationStatus' = 'reserved'
      AND created_at < v_cutoff;

    IF NOT COALESCE(p_dry_run, true) THEN
        DELETE FROM public.ai_api_usage
        WHERE request_metadata->>'reservationStatus' = 'reserved'
          AND created_at < v_cutoff;
        GET DIAGNOSTICS v_deleted = ROW_COUNT;

        INSERT INTO public.system_health_logs (level, component, message, metadata)
        VALUES ('info', 'AdminRepair',
                'Released ' || v_deleted || ' stuck AI quota reservation(s)',
                jsonb_build_object('cutoff', v_cutoff, 'usersAffected', v_users));
    END IF;

    RETURN jsonb_build_object(
        'dryRun',        COALESCE(p_dry_run, true),
        'cutoff',        v_cutoff,
        'matched',       v_affected,
        'usersAffected', v_users,
        'deleted',       v_deleted
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_stuck_ai_reservations(integer, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_stuck_ai_reservations(integer, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_stuck_ai_reservations(integer, boolean) TO authenticated;

COMMENT ON FUNCTION public.resolve_stuck_ai_reservations(integer, boolean) IS
'Admin-only. Releases AI quota consumed by reservations that never finalised. Defaults to a dry run; pass p_dry_run => false to actually delete.';
