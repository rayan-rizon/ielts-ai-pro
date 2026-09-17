-- Keep fresh Learning Path evidence consistent with the generator. No table or policy changes.
CREATE OR REPLACE FUNCTION public.get_learning_path_data()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_path record;
    v_activities json;
    v_module_averages json;
    v_module_trends json;
    v_sessions json;
    v_proficiencies json;
    v_total_tests integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING errcode = '42501';
    END IF;

    SELECT profile.id
    INTO v_user_id
    FROM public.users AS profile
    WHERE profile.auth_id = auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Profile not found' USING errcode = '42501';
    END IF;

    SELECT path.id, path.path_data, path.activities_completed, path.created_at
    INTO v_path
    FROM public.learning_paths AS path
    WHERE path.user_id = v_user_id
    ORDER BY path.created_at DESC
    LIMIT 1;

    SELECT COALESCE(
        pg_catalog.json_agg(
            pg_catalog.json_build_object(
                'id', activity.id,
                'activity_key', activity.activity_key,
                'scheduled_day', activity.scheduled_day,
                'scheduled_date', activity.scheduled_date,
                'stage_key', activity.stage_key,
                'completion_policy', activity.completion_policy,
                'requested_mode', activity.requested_mode,
                'evidence_key', activity.evidence_key,
                'is_completed', activity.is_completed,
                'completed_at', activity.completed_at,
                'outcome_score', activity.outcome_score,
                'outcome_band', activity.outcome_band,
                'outcome_accuracy', activity.outcome_accuracy,
                'completion_source', activity.completion_source,
                'outcome_data', activity.outcome_data,
                'title', activity.title,
                'description', activity.description,
                'module', activity.module,
                'estimated_minutes', activity.estimated_minutes,
                'priority', activity.priority,
                'activity_type', activity.activity_type,
                'skill_targets', activity.skill_targets
            )
            ORDER BY activity.scheduled_date NULLS LAST, activity.scheduled_day, activity.created_at
        ),
        '[]'::json
    )
    INTO v_activities
    FROM public.learning_path_activities AS activity
    WHERE activity.learning_path_id = v_path.id;

    WITH recent_sessions AS (
        SELECT
            session.test_type,
            session.score,
            session.completed_at,
            pg_catalog.row_number() OVER (
                PARTITION BY pg_catalog.lower(session.test_type)
                ORDER BY session.completed_at DESC
            ) AS sequence
        FROM public.test_sessions AS session
        WHERE session.user_id = v_user_id
          AND session.is_completed = true
          AND session.score IS NOT NULL
          AND session.completed_at >= pg_catalog.now() - interval '90 days'
          AND NOT public.is_abandoned_test_session(
              session.test_type,
              session.score,
              session.actual_duration_seconds,
              session.content_data
          )
    ), module_stats AS (
        SELECT
            pg_catalog.lower(test_type) AS test_type,
            pg_catalog.avg(score) AS average_score,
            pg_catalog.max(score) FILTER (WHERE sequence = 1) AS latest_score,
            pg_catalog.max(score) FILTER (WHERE sequence = 2) AS previous_score
        FROM recent_sessions
        GROUP BY pg_catalog.lower(test_type)
    )
    SELECT
        COALESCE(
            pg_catalog.json_object_agg(
                test_type,
                pg_catalog.round(average_score::numeric, 2)
            ),
            '{}'::json
        ),
        COALESCE(
            pg_catalog.json_object_agg(
                test_type,
                CASE
                    WHEN latest_score > previous_score THEN 'up'
                    WHEN latest_score < previous_score THEN 'down'
                    ELSE 'stable'
                END
            ),
            '{}'::json
        )
    INTO v_module_averages, v_module_trends
    FROM module_stats;

    SELECT pg_catalog.count(*)::integer
    INTO v_total_tests
    FROM public.test_sessions AS session
    WHERE session.user_id = v_user_id
      AND session.is_completed = true
      AND session.score IS NOT NULL
      AND NOT public.is_abandoned_test_session(
          session.test_type,
          session.score,
          session.actual_duration_seconds,
          session.content_data
      );

    SELECT COALESCE(
        pg_catalog.json_agg(
            pg_catalog.json_build_object(
                'id', session_row.id,
                'test_type', session_row.test_type,
                'score', session_row.score,
                'test_mode', session_row.test_mode,
                'is_completed', session_row.is_completed,
                'evaluation_status', session_row.evaluation_status,
                'actual_duration_seconds', session_row.actual_duration_seconds,
                'completed_at', session_row.completed_at,
                'content_data', session_row.content_data
            )
            ORDER BY session_row.completed_at DESC
        ),
        '[]'::json
    )
    INTO v_sessions
    FROM (
        SELECT recent.id, recent.test_type, recent.score, recent.completed_at, recent.content_data,
            recent.test_mode, recent.is_completed, recent.evaluation_status, recent.actual_duration_seconds
        FROM public.test_sessions AS recent
        WHERE recent.user_id = v_user_id
          AND recent.is_completed = true
          AND recent.completed_at >= pg_catalog.now() - interval '90 days'
          AND NOT public.is_abandoned_test_session(
              recent.test_type,
              recent.score,
              recent.actual_duration_seconds,
              recent.content_data
          )
        ORDER BY recent.completed_at DESC
        LIMIT 120
    ) AS session_row;

    SELECT COALESCE(
        pg_catalog.json_agg(
            pg_catalog.json_build_object(
                'skill_code', proficiency.skill_code,
                'module', proficiency.module,
                'mastery_probability', proficiency.mastery_probability,
                'confidence_level', proficiency.confidence_level,
                'practice_count', proficiency.practice_count,
                'correct_count', proficiency.correct_count,
                'last_practiced_at', proficiency.last_practiced_at,
                'next_review_at', proficiency.next_review_at,
                'evidence_version', proficiency.evidence_version
            )
            ORDER BY proficiency.mastery_probability ASC
        ),
        '[]'::json
    )
    INTO v_proficiencies
    FROM (
        SELECT current_skill.*
        FROM public.skill_proficiency AS current_skill
        WHERE current_skill.user_id = v_user_id
        ORDER BY current_skill.mastery_probability ASC
        LIMIT 120
    ) AS proficiency;

    RETURN pg_catalog.json_build_object(
        'learningPath', CASE
            WHEN v_path.id IS NULL THEN NULL
            ELSE pg_catalog.json_build_object(
                'id', v_path.id,
                'path_data', v_path.path_data,
                'activities_completed', v_path.activities_completed,
                'created_at', v_path.created_at
            )
        END,
        'activities', COALESCE(v_activities, '[]'::json),
        'stats', pg_catalog.json_build_object(
            'moduleAverages', COALESCE(v_module_averages, '{}'::json),
            'moduleTrends', COALESCE(v_module_trends, '{}'::json),
            'totalTests', COALESCE(v_total_tests, 0),
            'sessions', COALESCE(v_sessions, '[]'::json)
        ),
        'skillProficiencies', COALESCE(v_proficiencies, '[]'::json)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_learning_path_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_learning_path_data() TO authenticated, service_role;

COMMENT ON FUNCTION public.get_learning_path_data() IS
  'Returns the current authenticated learner path, activities, measured recent evidence, and skill proficiencies in one bounded call.';
