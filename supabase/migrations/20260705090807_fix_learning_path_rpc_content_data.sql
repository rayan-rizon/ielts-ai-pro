CREATE OR REPLACE FUNCTION public.get_learning_path_data()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
    v_path_record RECORD;
    v_activities JSON;
    v_module_averages JSON;
    v_module_trends JSON;
    v_skill_proficiencies JSON;
    v_sessions JSON;
    v_total_tests INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or user not found';
    END IF;

    SELECT id, path_data, activities_completed, created_at
    INTO v_path_record
    FROM learning_paths
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_path_record.id IS NOT NULL THEN
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', id,
                'activity_key', activity_key,
                'scheduled_day', scheduled_day,
                'is_completed', is_completed,
                'completed_at', completed_at,
                'outcome_score', outcome_score,
                'outcome_data', outcome_data,
                'title', title,
                'module', module,
                'estimated_minutes', estimated_minutes,
                'priority', priority,
                'activity_type', activity_type,
                'skill_targets', skill_targets
            )
        ), '[]'::json)
        INTO v_activities
        FROM learning_path_activities
        WHERE learning_path_id = v_path_record.id;
    ELSE
        v_activities := '[]'::json;
    END IF;

    WITH recent_sessions AS (
        SELECT
            ts.id,
            ts.test_type,
            ts.score,
            ts.completed_at,
            ROW_NUMBER() OVER (PARTITION BY ts.test_type ORDER BY ts.completed_at DESC) AS rn
        FROM test_sessions ts
        WHERE ts.user_id = v_user_id
          AND ts.is_completed = true
          AND ts.score IS NOT NULL
        ORDER BY ts.completed_at DESC
        LIMIT 40
    ),
    module_stats AS (
        SELECT
            test_type,
            AVG(score) AS avg_score,
            MAX(CASE WHEN rn = 1 THEN score END) AS latest_score,
            MAX(CASE WHEN rn = 2 THEN score END) AS prev_score
        FROM recent_sessions
        GROUP BY test_type
    )
    SELECT
        COALESCE(json_object_agg(test_type, ROUND(avg_score::numeric, 2)), '{}'::json),
        COALESCE(json_object_agg(
            test_type,
            CASE
                WHEN latest_score > prev_score THEN 'up'
                WHEN latest_score < prev_score THEN 'down'
                ELSE 'stable'
            END
        ), '{}'::json)
    INTO v_module_averages, v_module_trends
    FROM module_stats
    WHERE avg_score IS NOT NULL;

    SELECT COUNT(*)
    INTO v_total_tests
    FROM test_sessions
    WHERE user_id = v_user_id AND is_completed = true;

    SELECT COALESCE(json_agg(
        json_build_object(
            'id', s.id,
            'test_type', s.test_type,
            'score', s.score,
            'completed_at', s.completed_at,
            'content_data', s.content_data
        )
    ), '[]'::json)
    INTO v_sessions
    FROM (
        SELECT ts.id, ts.test_type, ts.score, ts.completed_at, ts.content_data
        FROM test_sessions ts
        WHERE ts.user_id = v_user_id AND ts.is_completed = true
        ORDER BY ts.completed_at DESC
        LIMIT 40
    ) s;

    SELECT COALESCE(json_agg(
        json_build_object(
            'skill_code', sp.skill_code,
            'module', sp.module,
            'mastery_probability', sp.mastery_probability,
            'confidence_level', sp.confidence_level,
            'practice_count', sp.practice_count,
            'correct_count', sp.correct_count,
            'last_practiced_at', sp.last_practiced_at,
            'next_review_at', sp.next_review_at
        )
    ), '[]'::json)
    INTO v_skill_proficiencies
    FROM (
        SELECT *
        FROM public.skill_proficiency
        WHERE user_id = v_user_id
        ORDER BY mastery_probability ASC
        LIMIT 100
    ) sp;

    v_result := json_build_object(
        'learningPath', CASE
            WHEN v_path_record.id IS NOT NULL THEN
                json_build_object(
                    'id', v_path_record.id,
                    'path_data', v_path_record.path_data,
                    'activities_completed', v_path_record.activities_completed,
                    'created_at', v_path_record.created_at
                )
            ELSE NULL
        END,
        'activities', v_activities,
        'stats', json_build_object(
            'moduleAverages', COALESCE(v_module_averages, '{}'::json),
            'moduleTrends', COALESCE(v_module_trends, '{}'::json),
            'totalTests', COALESCE(v_total_tests, 0),
            'sessions', v_sessions
        ),
        'skillProficiencies', v_skill_proficiencies
    );

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_learning_path_data() IS
  'Combined RPC that fetches learning path, activities, stats, recent session content_data, and skill proficiencies for the authenticated user.';
